import {
  Controller, Get, Post, Put, Delete, Body, Param,
  UseGuards, Query,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { CancelSlotDto } from './dto/cancel-slot.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('schedule')
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    return this.scheduleService.findAll(active === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleService.getSlotWithBookingCount(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateSlotDto) {
    return this.scheduleService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSlotDto) {
    return this.scheduleService.update(id, dto);
  }

  @Post(':id/cancellations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  cancelOccurrence(@Param('id') id: string, @Body() dto: CancelSlotDto) {
    return this.scheduleService.cancelOccurrence(id, dto);
  }

  @Delete(':id/cancellations/:date')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  restoreOccurrence(@Param('id') id: string, @Param('date') date: string) {
    return this.scheduleService.restoreOccurrence(id, date);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
