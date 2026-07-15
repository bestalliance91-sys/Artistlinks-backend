import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { CreateMusicReleaseDto } from './dto/create-music-release.dto';
import { UserRole, ReleaseStatus } from '@prisma/client';
import * as streamifier from 'streamifier';

@Injectable()
export class MusicReleaseService {
  constructor(
    private prisma: PrismaService,
    @Inject('CLOUDINARY') private cloudinaryConfig,
  ) {}

  async uploadAudio(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'artistlinks/music-releases' },
        (error, result) => {
          if (error) return reject(error);
          if (result === undefined) return reject(new Error("Upload Cloudinary echoue"));
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async create(artistId: string, dto: CreateMusicReleaseDto, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Le fichier audio est requis');
    }
    const uploadResult = await this.uploadAudio(file);
    return this.prisma.musicRelease.create({
      data: {
        artistId,
        title: dto.title,
        type: dto.type,
        coverArtUrl: dto.coverArtUrl,
        audioUrl: uploadResult.secure_url,
        platforms: dto.platforms || [],
        isrc: dto.isrc,
        upc: dto.upc,
      },
    });
  }

  async findMyReleases(artistId: string) {
    return this.prisma.musicRelease.findMany({
      where: { artistId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllPending() {
    return this.prisma.musicRelease.findMany({
      where: { status: ReleaseStatus.PENDING_REVIEW },
      include: { artist: { select: { id: true, email: true } } },
      orderBy: { submittedAt: 'asc' },
    });
  }

  private async assertLabelRole(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.LABEL) {
      throw new ForbiddenException('Seul un compte LABEL peut effectuer cette action');
    }
  }

  async approve(releaseId: string, labelUserId: string) {
    await this.assertLabelRole(labelUserId);
    return this.updateStatus(releaseId, ReleaseStatus.APPROVED, labelUserId);
  }

  async reject(releaseId: string, labelUserId: string, reason: string) {
    await this.assertLabelRole(labelUserId);
    await this.updateStatus(releaseId, ReleaseStatus.REJECTED, labelUserId);
    return this.prisma.musicRelease.update({
      where: { id: releaseId },
      data: { rejectionReason: reason },
    });
  }

  async markUploaded(releaseId: string, labelUserId: string, distroKidUrl: string) {
    await this.assertLabelRole(labelUserId);
    await this.updateStatus(releaseId, ReleaseStatus.MANUALLY_UPLOADED, labelUserId);
    return this.prisma.musicRelease.update({
      where: { id: releaseId },
      data: { distroKidUrl },
    });
  }


  async markLive(releaseId: string, labelUserId: string) {
    await this.assertLabelRole(labelUserId);
    return this.updateStatus(releaseId, ReleaseStatus.LIVE, labelUserId);
  }

  private async updateStatus(releaseId: string, status: ReleaseStatus, processedBy: string) {
    const release = await this.prisma.musicRelease.findUnique({ where: { id: releaseId } });
    if (!release) {
      throw new NotFoundException('Release introuvable');
    }
    return this.prisma.musicRelease.update({
      where: { id: releaseId },
      data: { status, processedAt: new Date(), processedBy },
    });
  }
}
