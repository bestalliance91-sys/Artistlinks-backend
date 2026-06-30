import { IsString, IsOptional, IsArray, IsBoolean, IsInt, IsObject } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  artistName?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsArray()
  @IsOptional()
  genres?: string[];

  @IsArray()
  @IsOptional()
  skills?: string[];

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @IsArray()
  @IsOptional()
  portfolioUrls?: string[];

  @IsInt()
  @IsOptional()
  yearsActive?: number;

  @IsBoolean()
  @IsOptional()
  isAvailableForWork?: boolean;
}

export class SearchProfilesDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  genre?: string;
}
