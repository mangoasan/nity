import {
  Controller, Get, Post, Put, Body, Param,
  UseGuards, Query, Req,
} from '@nestjs/common';
import { PersonalTrainingService } from './personal-training.service';
import { CreatePTRequestDto } from './dto/create-pt-request.dto';
import { UpdatePTStatusDto } from './dto/update-pt-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('personal-training')
export class PersonalTrainingController {
  constructor(private ptService: PersonalTrainingService) {}

  @Post()
  create(@Body() dto: CreatePTRequestDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.ptService.create(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@Query('status') status?: string) {
    return this.ptService.findAll(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.ptService.findOne(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePTStatusDto) {
    return this.ptService.updateStatus(id, dto);
  }
}
