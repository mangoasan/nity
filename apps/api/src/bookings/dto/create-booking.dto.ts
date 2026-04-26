import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  scheduleSlotId: string;

  @IsDateString()
  bookingDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
