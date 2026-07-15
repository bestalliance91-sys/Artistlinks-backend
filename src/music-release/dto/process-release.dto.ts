import { IsString, IsOptional } from 'class-validator';

export class ApproveReleaseDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectReleaseDto {
  @IsString()
  rejectionReason: string;
}

export class MarkUploadedDto {
  @IsString()
  distroKidUrl: string;
}
