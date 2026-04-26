import { IsString, IsInt, IsEnum, IsOptional, IsBoolean, Min, Matches } from 'class-validator';
import { Weekday } from '@prisma/client';

export class CreateSlotDto {
  @IsString()
  masterId: string;

  @IsString()
  classTypeId: string;

  @IsEnum(Weekday)
  weekday: Weekday;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:MM' })
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be HH:MM' })
  endTime: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsString()
  locationLabel?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
