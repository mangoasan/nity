import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  IsInt,
  ValidateIf,
  MaxLength,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class GrantPassDto {
  @IsInt()
  @Min(1)
  @Max(120)
  @Type(() => Number)
  durationMonths: number;

  @IsBoolean()
  isUnlimited: boolean;

  @ValidateIf((o) => !o.isUnlimited)
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  classCount?: number;
}

class FreezePassDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  reason?: string;
}

class CreateUserAdminDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users')
  createUser(@Body() dto: CreateUserAdminDto) {
    return this.adminService.createUser(dto);
  }

  @Post('users/:id/class-pass')
  grantClassPass(@Param('id') id: string, @Body() dto: GrantPassDto) {
    return this.adminService.grantClassPass(id, dto);
  }

  @Post('users/:id/class-pass/freeze')
  freezeClassPass(@Param('id') id: string, @Body() dto: FreezePassDto) {
    return this.adminService.freezeClassPass(id, dto);
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() user: any, @Param('id') id: string) {
    return this.adminService.deleteUser(id, user.id);
  }
}
