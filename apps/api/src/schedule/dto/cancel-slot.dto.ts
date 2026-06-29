import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelSlotDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
