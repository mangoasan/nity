import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { Weekday } from '@prisma/client';
import { toPublicAssetUrl } from '../common/utils/url';
import { CancelSlotDto } from './dto/cancel-slot.dto';

const WEEKDAY_ORDER: Weekday[] = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
  Weekday.SUNDAY,
];

const JS_DAY_TO_WEEKDAY: Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

function dateOnlyUtc(value: string): Date {
  const datePart = value.split('T')[0];
  const date = new Date(`${datePart}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Invalid cancellation date');
  }
  return date;
}

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  private serializeSlot<T extends { master: { photoUrl?: string | null } | null }>(slot: T): T {
    if (!slot.master) {
      return slot;
    }

    return {
      ...slot,
      master: {
        ...slot.master,
        photoUrl: toPublicAssetUrl(slot.master.photoUrl) || null,
      },
    };
  }

  async findAll(activeOnly = false) {
    const slots = await this.prisma.scheduleSlot.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        master: true,
        classType: true,
        cancellations: { orderBy: { cancellationDate: 'asc' } },
        _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
      },
    });

    // Group by weekday in correct order
    const grouped: Record<string, typeof slots> = {};
    for (const day of WEEKDAY_ORDER) {
      grouped[day] = [];
    }
    for (const slot of slots) {
      grouped[slot.weekday].push(slot);
    }
    for (const day of WEEKDAY_ORDER) {
      grouped[day] = grouped[day]
        .map((slot) => this.serializeSlot(slot))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return grouped;
  }

  async findOne(id: string) {
    const slot = await this.prisma.scheduleSlot.findUnique({
      where: { id },
      include: {
        master: true,
        classType: true,
        cancellations: { orderBy: { cancellationDate: 'asc' } },
      },
    });
    if (!slot) throw new NotFoundException('Schedule slot not found');
    return this.serializeSlot(slot);
  }

  async getSlotWithBookingCount(id: string) {
    const slot = await this.prisma.scheduleSlot.findUnique({
      where: { id },
      include: {
        master: true,
        classType: true,
        cancellations: { orderBy: { cancellationDate: 'asc' } },
        _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
      },
    });
    if (!slot) throw new NotFoundException('Schedule slot not found');
    return this.serializeSlot(slot);
  }

  async create(dto: CreateSlotDto) {
    const slot = await this.prisma.scheduleSlot.create({
      data: dto,
      include: { master: true, classType: true },
    });

    return this.serializeSlot(slot);
  }

  async update(id: string, dto: UpdateSlotDto) {
    await this.findOne(id);
    const slot = await this.prisma.scheduleSlot.update({
      where: { id },
      data: dto,
      include: { master: true, classType: true },
    });

    return this.serializeSlot(slot);
  }

  async cancelOccurrence(id: string, dto: CancelSlotDto) {
    const slot = await this.findOne(id);
    const cancellationDate = dateOnlyUtc(dto.date);

    if (JS_DAY_TO_WEEKDAY[cancellationDate.getUTCDay()] !== slot.weekday) {
      throw new BadRequestException(
        'Cancellation date does not match the schedule weekday',
      );
    }

    const existing = await this.prisma.scheduleCancellation.findUnique({
      where: {
        scheduleSlotId_cancellationDate: {
          scheduleSlotId: id,
          cancellationDate,
        },
      },
    });
    if (existing) {
      throw new ConflictException('This class occurrence is already cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      const cancellation = await tx.scheduleCancellation.create({
        data: {
          scheduleSlotId: id,
          cancellationDate,
          reason: dto.reason?.trim() || null,
        },
      });

      const bookings = await tx.booking.findMany({
        where: {
          scheduleSlotId: id,
          bookingDate: cancellationDate,
          status: 'CONFIRMED',
        },
        include: { classPass: true },
      });

      if (bookings.length > 0) {
        await tx.booking.updateMany({
          where: { id: { in: bookings.map((booking) => booking.id) } },
          data: { status: 'CANCELLED' },
        });

        const refunds = new Map<string, number>();
        for (const booking of bookings) {
          if (booking.classPass && !booking.classPass.isUnlimited) {
            refunds.set(
              booking.classPass.id,
              (refunds.get(booking.classPass.id) || 0) + 1,
            );
          }
        }

        for (const [classPassId, count] of refunds) {
          await tx.classPass.update({
            where: { id: classPassId },
            data: { remainingClasses: { increment: count } },
          });
        }
      }

      return { ...cancellation, cancelledBookings: bookings.length };
    });
  }

  async restoreOccurrence(id: string, date: string) {
    await this.findOne(id);
    const cancellationDate = dateOnlyUtc(date);
    const cancellation = await this.prisma.scheduleCancellation.findUnique({
      where: {
        scheduleSlotId_cancellationDate: {
          scheduleSlotId: id,
          cancellationDate,
        },
      },
    });
    if (!cancellation) {
      throw new NotFoundException('Schedule cancellation not found');
    }

    await this.prisma.scheduleCancellation.delete({
      where: { id: cancellation.id },
    });
    return { success: true };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.scheduleSlot.delete({ where: { id } });
  }
}
