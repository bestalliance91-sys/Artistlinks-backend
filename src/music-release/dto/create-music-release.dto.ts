import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ReleaseType } from '@prisma/client';

export class CreateMusicReleaseDto {
  @IsString()
  title: string;

  @IsEnum(ReleaseType)
  type: ReleaseType;

  @IsString()
  coverArtUrl: string;

  @IsArray()
  @IsOptional()
  platforms?: string[];

  @IsString()
  @IsOptional()
  isrc?: string;

  @IsString()
  @IsOptional()
  upc?: string;
}
