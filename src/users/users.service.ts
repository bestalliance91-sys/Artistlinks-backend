import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, SearchProfilesDto } from './dto/profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfileByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.update({
      where: { userId },
      data: dto as any,
    });
    return profile;
  }

  async searchProfiles(dto: SearchProfilesDto, page = 1, limit = 20) {
    const where: any = {};

    if (dto.query) {
      where.OR = [
        { fullName: { contains: dto.query, mode: 'insensitive' } },
        { artistName: { contains: dto.query, mode: 'insensitive' } },
        { bio: { contains: dto.query, mode: 'insensitive' } },
      ];
    }
    if (dto.country) where.country = dto.country;
    if (dto.genre) where.genres = { has: dto.genre };
    if (dto.role) where.user = { role: dto.role };

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        include: { user: { select: { id: true, role: true, isVerified: true, email: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profile.count({ where }),
    ]);

    return { profiles, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getPublicProfile(profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: { select: { id: true, role: true, isVerified: true } } },
    });
    if (!profile) throw new NotFoundException('Profil introuvable');
    return profile;
  }
}
