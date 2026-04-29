import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, ClassPassTemplate } from '@prisma/client';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  IsInt,
  Min,
  Max,
  ValidateIf,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class GrantPassDto {
  @IsEnum(ClassPassTemplate)
  template: ClassPassTemplate;

  @ValidateIf((o) => o.template === 'CUSTOM')
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  customCount?: number;
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
    return this.adminService.grantClassPass(id, dto.template, dto.customCount);
  }
}
