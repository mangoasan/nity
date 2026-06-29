import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAdminBookingDto {
  @IsString()
  userId: string;

  @IsString()
  scheduleSlotId: string;

  @IsDateString()
  bookingDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
