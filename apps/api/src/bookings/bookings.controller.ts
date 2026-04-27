import {
  Controller, Get, Post, Put, Delete, Body, Param,
  UseGuards, Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, BookingStatus, Weekday } from '@prisma/client';

@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyBookings(@CurrentUser() user: any) {
    return this.bookingsService.findMyBookings(user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(user.id, id);
  }

  // Admin routes
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll(
    @Query('status') status?: BookingStatus,
    @Query('slotId') slotId?: string,
    @Query('date') date?: string,
    @Query('weekday') weekday?: Weekday,
    @Query('classTypeId') classTypeId?: string,
    @Query('masterId') masterId?: string,
    @Query('userSearch') userSearch?: string,
  ) {
    return this.bookingsService.findAll({
      status, slotId, date, weekday, classTypeId, masterId, userSearch,
    });
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }
}
