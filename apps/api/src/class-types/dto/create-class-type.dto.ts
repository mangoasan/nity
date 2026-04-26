import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, Min } from 'class-validator';
import { ClassLevel } from '@prisma/client';

export class CreateClassTypeDto {
  @IsString()
  titleRu: string;

  @IsString()
  titleEn: string;

  @IsString()
  titleKk: string;

  @IsOptional()
  @IsString()
  descriptionRu?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  descriptionKk?: string;

  @IsInt()
  @Min(15)
  durationMinutes: number;

  @IsEnum(ClassLevel)
  level: ClassLevel;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
