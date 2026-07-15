import { Module } from '@nestjs/common';
import { MusicReleaseController } from './music-release.controller';
import { MusicReleaseService } from './music-release.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MusicReleaseController],
  providers: [MusicReleaseService, CloudinaryProvider],
})
export class MusicReleaseModule {}
