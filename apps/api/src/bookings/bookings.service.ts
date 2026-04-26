import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus } from '@prisma/client';
import { toPublicAssetUrl } from '../common/utils/url';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  private serializeBooking<
    T extends {
      scheduleSlot?: {
        master?: { photoUrl?: string | null } | null;
      } | null;
    },
  >(booking: T): T {
    if (!booking.scheduleSlot?.master) {
      return booking;
    }

    return {
      ...booking,
      scheduleSlot: {
        ...booking.scheduleSlot,
        master: {
          ...booking.scheduleSlot.master,
          photoUrl: toPublicAssetUrl(booking.scheduleSlot.master.photoUrl) || null,
        },
      },
    };
  }

  async create(userId: string, dto: CreateBookingDto) {
    const slot = await this.prisma.scheduleSlot.findUnique({
      where: { id: dto.scheduleSlotId },
      include: {
        _count: { select: { bookings: { where: { status: BookingStatus.CONFIRMED } } } },
      },
    });
    if (!slot) throw new NotFoundException('Schedule slot not found');
    if (!slot.isActive) throw new BadRequestException('This class is not available');

    const bookingDate = new Date(dto.bookingDate);

    // Check capacity
    const confirmedCount = await this.prisma.booking.count({
      where: {
        scheduleSlotId: dto.scheduleSlotId,
        bookingDate,
        status: BookingStatus.CONFIRMED,
      },
    });
    if (confirmedCount >= slot.capacity) {
      throw new ConflictException('Class is fully booked');
    }

    // Check duplicate
    const existing = await this.prisma.booking.findUnique({
      where: {
        userId_scheduleSlotId_bookingDate: {
          userId,
          scheduleSlotId: dto.scheduleSlotId,
          bookingDate,
        },
      },
    });
    if (existing) {
      if (existing.status === BookingStatus.CONFIRMED) {
        throw new ConflictException('You have already booked this class');
      }
      // Allow re-booking if cancelled
      const booking = await this.prisma.booking.update({
        where: { id: existing.id },
        data: { status: BookingStatus.CONFIRMED, notes: dto.notes },
        include: { scheduleSlot: { include: { master: true, classType: true } } },
      });

      return this.serializeBooking(booking);
    }

    const booking = await this.prisma.booking.create({
      data: {
        userId,
        scheduleSlotId: dto.scheduleSlotId,
        bookingDate,
        notes: dto.notes,
      },
      include: {
        scheduleSlot: { include: { master: true, classType: true } },
      },
    });

    return this.serializeBooking(booking);
  }

  async findMyBookings(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        scheduleSlot: { include: { master: true, classType: true } },
      },
      orderBy: { bookingDate: 'desc' },
    });

    return bookings.map((booking) => this.serializeBooking(booking));
  }

  async cancelBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new NotFoundException('Booking not found');

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  // Admin methods
  async findAll(filters?: { status?: BookingStatus; slotId?: string }) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.slotId ? { scheduleSlotId: filters.slotId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        scheduleSlot: { include: { master: true, classType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((booking) => this.serializeBooking(booking));
  }

  async updateStatus(bookingId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: dto.status },
    });
  }
}
