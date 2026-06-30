import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateConnectionDto {
  @IsUUID()
  addresseeId: string;

  @IsString()
  @IsOptional()
  message?: string;
}
