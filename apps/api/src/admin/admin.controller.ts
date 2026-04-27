import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, ClassPassTemplate } from '@prisma/client';
import { IsEnum } from 'class-validator';

class GrantPassDto {
  @IsEnum(ClassPassTemplate)
  template: ClassPassTemplate;
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

  @Post('users/:id/class-pass')
  grantClassPass(@Param('id') id: string, @Body() dto: GrantPassDto) {
    return this.adminService.grantClassPass(id, dto.template);
  }
}
