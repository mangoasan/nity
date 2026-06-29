import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus, Weekday } from '@prisma/client';
import { toPublicAssetUrl } from '../common/utils/url';

// Kazakhstan timezone offset in minutes (UTC+5)
const KZ_OFFSET_MINUTES = 5 * 60;

function toKzDate(utc: Date): Date {
  return new Date(utc.getTime() + KZ_OFFSET_MINUTES * 60_000);
}

/** Parse HH:MM string and combine with a date in KZ local time, return UTC Date */
function classStartUtc(bookingDate: Date, startTimeStr: string): Date {
  const kzDate = toKzDate(bookingDate);
  const [hh, mm] = startTimeStr.split(':').map(Number);
  // Build local date components in KZ time
  const kzYear = kzDate.getUTCFullYear();
  const kzMonth = kzDate.getUTCMonth();
  const kzDay = kzDate.getUTCDate();
  // Construct the class start moment as UTC by subtracting offset
  return new Date(
    Date.UTC(kzYear, kzMonth, kzDay, hh, mm) - KZ_OFFSET_MINUTES * 60_000,
  );
}

function dateOnlyUtc(value: string | Date): Date {
  const date =
    typeof value === 'string'
      ? new Date(`${value.split('T')[0]}T00:00:00.000Z`)
      : value;

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Invalid booking date');
  }

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

const CANCEL_DEADLINE_MINUTES = 60;

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

  private async findActivePass(userId: string) {
    const now = new Date();

    // Prefer unlimited pass still valid
    const unlimited = await this.prisma.classPass.findFirst({
      where: {
        userId,
        isUnlimited: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { startsAt: 'asc' },
    });
    if (unlimited) return unlimited;

    // Finite pass with remaining classes
    return this.prisma.classPass.findFirst({
      where: {
        userId,
        isUnlimited: false,
        remainingClasses: { gt: 0 },
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async create(userId: string, dto: CreateBookingDto) {
    const slot = await this.prisma.scheduleSlot.findUnique({
      where: { id: dto.scheduleSlotId },
    });
    if (!slot) throw new NotFoundException('Schedule slot not found');
    if (!slot.isActive) throw new BadRequestException('This class is not available');

    const bookingDate = dateOnlyUtc(dto.bookingDate);
    const classStart = classStartUtc(bookingDate, slot.startTime);
    if (classStart <= new Date()) {
      throw new BadRequestException(
        'This class has already started and can no longer be booked',
      );
    }

    const cancellation = await this.prisma.scheduleCancellation.findUnique({
      where: {
        scheduleSlotId_cancellationDate: {
          scheduleSlotId: dto.scheduleSlotId,
          cancellationDate: bookingDate,
        },
      },
    });
    if (cancellation) {
      throw new BadRequestException('This class has been cancelled');
    }

    const weekdayByJsDay: Weekday[] = [
      Weekday.SUNDAY,
      Weekday.MONDAY,
      Weekday.TUESDAY,
      Weekday.WEDNESDAY,
      Weekday.THURSDAY,
      Weekday.FRIDAY,
      Weekday.SATURDAY,
    ];
    if (weekdayByJsDay[bookingDate.getUTCDay()] !== slot.weekday) {
      throw new BadRequestException('Booking date does not match the schedule');
    }

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

    // Find active pass — required to book
    const activePass = await this.findActivePass(userId);
    if (!activePass) {
      throw new ForbiddenException(
        'No active class pass. Please purchase a pass to book classes.',
      );
    }

    const frozenDate = dateOnlyUtc(bookingDate);
    const freeze = await this.prisma.classPassFreeze.findFirst({
      where: {
        classPassId: activePass.id,
        startDate: { lte: frozenDate },
        endDate: { gte: frozenDate },
      },
    });
    if (freeze) {
      throw new BadRequestException(
        'Your class pass is frozen on this date. Booking is unavailable.',
      );
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
      // Re-booking a cancelled slot — consume pass again
      const booking = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.booking.update({
          where: { id: existing.id },
          data: {
            status: BookingStatus.CONFIRMED,
            notes: dto.notes,
            classPassId: activePass.id,
          },
          include: { scheduleSlot: { include: { master: true, classType: true } } },
        });

        if (!activePass.isUnlimited) {
          await tx.classPass.update({
            where: { id: activePass.id },
            data: { remainingClasses: { decrement: 1 } },
          });
        }

        return updated;
      });

      return this.serializeBooking(booking);
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          userId,
          scheduleSlotId: dto.scheduleSlotId,
          bookingDate,
          notes: dto.notes,
          classPassId: activePass.id,
        },
        include: { scheduleSlot: { include: { master: true, classType: true } } },
      });

      if (!activePass.isUnlimited) {
        await tx.classPass.update({
          where: { id: activePass.id },
          data: { remainingClasses: { decrement: 1 } },
        });
      }

      return created;
    });

    return this.serializeBooking(booking);
  }

  async createForUserByAdmin(dto: CreateBookingDto & { userId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.create(dto.userId, {
      scheduleSlotId: dto.scheduleSlotId,
      bookingDate: dto.bookingDate,
      notes: dto.notes,
    });
  }

  async findMyBookings(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        scheduleSlot: { include: { master: true, classType: true } },
        classPass: true,
      },
      orderBy: { bookingDate: 'desc' },
    });

    return bookings.map((booking) => this.serializeBooking(booking));
  }

  async cancelBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { scheduleSlot: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be cancelled');
    }

    // Cancellation deadline: 1 hour before class start
    const classStart = classStartUtc(booking.bookingDate, booking.scheduleSlot.startTime);
    const deadline = new Date(classStart.getTime() - CANCEL_DEADLINE_MINUTES * 60_000);
    if (new Date() > deadline) {
      throw new ForbiddenException(
        'Cancellation is no longer available — the deadline has passed (1 hour before class start)',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      // Refund one class to finite pass
      if (booking.classPassId) {
        const pass = await tx.classPass.findUnique({ where: { id: booking.classPassId } });
        if (pass && !pass.isUnlimited) {
          await tx.classPass.update({
            where: { id: pass.id },
            data: { remainingClasses: { increment: 1 } },
          });
        }
      }

      return updated;
    });
  }

  // Admin methods
  async findAll(filters?: {
    status?: BookingStatus;
    slotId?: string;
    date?: string;
    weekday?: Weekday;
    classTypeId?: string;
    masterId?: string;
    userSearch?: string;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.slotId) where.scheduleSlotId = filters.slotId;
    if (filters?.date) where.bookingDate = new Date(filters.date);
    if (filters?.weekday) {
      where.scheduleSlot = { ...where.scheduleSlot, weekday: filters.weekday };
    }
    if (filters?.classTypeId) {
      where.scheduleSlot = { ...where.scheduleSlot, classTypeId: filters.classTypeId };
    }
    if (filters?.masterId) {
      where.scheduleSlot = { ...where.scheduleSlot, masterId: filters.masterId };
    }
    if (filters?.userSearch) {
      const q = filters.userSearch;
      where.user = {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        scheduleSlot: { include: { master: true, classType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((booking) => this.serializeBooking(booking));
  }

  async updateStatus(bookingId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { classPass: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // If cancelling via admin and booking had a finite pass, refund it
    if (
      dto.status === BookingStatus.CANCELLED &&
      booking.status === BookingStatus.CONFIRMED &&
      booking.classPass &&
      !booking.classPass.isUnlimited
    ) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.booking.update({
          where: { id: bookingId },
          data: { status: dto.status },
        });
        await tx.classPass.update({
          where: { id: booking.classPassId! },
          data: { remainingClasses: { increment: 1 } },
        });
        return updated;
      });
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: dto.status },
    });
  }
}
