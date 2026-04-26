import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { Weekday } from '@prisma/client';
import { toPublicAssetUrl } from '../common/utils/url';

const WEEKDAY_ORDER: Weekday[] = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
  Weekday.SUNDAY,
];

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
      include: { master: true, classType: true },
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

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.scheduleSlot.delete({ where: { id } });
  }
}
