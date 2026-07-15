import { Controller, Post, Get, Patch, Body, Param, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MusicReleaseService } from './music-release.service';
import { CreateMusicReleaseDto } from './dto/create-music-release.dto';
import { RejectReleaseDto, MarkUploadedDto } from './dto/process-release.dto';

@Controller('music-releases')
@UseGuards(JwtAuthGuard)
export class MusicReleaseController {
  constructor(private readonly musicReleaseService: MusicReleaseService) {}

  @Post()
  @UseInterceptors(FileInterceptor('audio'))
  create(
    @Req() req,
    @Body() dto: CreateMusicReleaseDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.musicReleaseService.create(req.user.id, dto, file);
  }

  @Get('my')
  findMy(@Req() req) {
    return this.musicReleaseService.findMyReleases(req.user.id);
  }

  @Get('pending')
  findPending() {
    return this.musicReleaseService.findAllPending();
  }

  @Patch(':id/approve')
  approve(@Req() req, @Param('id') id: string) {
    return this.musicReleaseService.approve(id, req.user.id);
  }

  @Patch(':id/reject')
  reject(@Req() req, @Param('id') id: string, @Body() dto: RejectReleaseDto) {
    return this.musicReleaseService.reject(id, req.user.id, dto.rejectionReason);
  }

  @Patch(':id/mark-uploaded')
  markUploaded(@Req() req, @Param('id') id: string, @Body() dto: MarkUploadedDto) {
    return this.musicReleaseService.markUploaded(id, req.user.id, dto.distroKidUrl);
  }

  @Patch(':id/mark-live')
  markLive(@Req() req, @Param('id') id: string) {
    return this.musicReleaseService.markLive(id, req.user.id);
  }
}
