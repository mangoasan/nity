import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ClassPassTemplate, Role, AuthProvider } from '@prisma/client';

const DAY_MS = 24 * 60 * 60 * 1000;

const PASS_FREEZE_DAYS: Record<number, number> = {
  1: 3,
  3: 9,
  6: 18,
  12: 30,
};

function freezeDaysForDuration(months: number) {
  return PASS_FREEZE_DAYS[months] ?? Math.min(months * 3, 30);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function dateOnlyUtc(value: string | Date) {
  const date = new Date(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function inclusiveDays(startDate: Date, endDate: Date) {
  return Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalUsers,
      totalMasters,
      totalBookings,
      pendingPTRequests,
      confirmedBookings,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.yogaMaster.count({ where: { isActive: true } }),
      this.prisma.booking.count(),
      this.prisma.personalTrainingRequest.count({ where: { status: 'NEW' } }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    ]);

    return {
      totalUsers,
      totalMasters,
      totalBookings,
      pendingPTRequests,
      confirmedBookings,
    };
  }

  async getUsers() {
    const now = new Date();
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        authProvider: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            ptRequests: true,
          },
        },
        classPasses: {
          where: {
            startsAt: { lte: now },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          include: {
            freezes: {
              orderBy: { startDate: 'desc' },
            },
          },
          orderBy: { startsAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => {
      const activePasses = u.classPasses;
      const unlimitedPass = activePasses.find((p) => p.isUnlimited);
      const finitePass = activePasses.find((p) => !p.isUnlimited && (p.remainingClasses ?? 0) > 0);

      const { classPasses, ...rest } = u;
      return {
        ...rest,
        activePass: unlimitedPass
          ? {
              id: unlimitedPass.id,
              type: 'unlimited',
              template: unlimitedPass.template,
              durationMonths: unlimitedPass.durationMonths,
              expiresAt: unlimitedPass.expiresAt,
              freezeDaysTotal: unlimitedPass.freezeDaysTotal,
              freezeDaysUsed: unlimitedPass.freezeDaysUsed,
              freezes: unlimitedPass.freezes,
            }
          : finitePass
          ? {
              id: finitePass.id,
              type: 'finite',
              template: finitePass.template,
              durationMonths: finitePass.durationMonths,
              totalClasses: finitePass.totalClasses,
              remainingClasses: finitePass.remainingClasses,
              expiresAt: finitePass.expiresAt,
              freezeDaysTotal: finitePass.freezeDaysTotal,
              freezeDaysUsed: finitePass.freezeDaysUsed,
              freezes: finitePass.freezes,
            }
          : null,
      };
    });
  }

  async createUser(dto: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    role?: Role;
  }) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email ?? undefined,
        phone: dto.phone ?? undefined,
        passwordHash,
        role: dto.role ?? Role.USER,
        authProvider: AuthProvider.EMAIL,
      },
    });

    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async deleteUser(userId: string, currentAdminId: string) {
    if (userId === currentAdminId) {
      throw new BadRequestException('You cannot delete your own admin account');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.deleteMany({ where: { userId } });
      await tx.classPassFreeze.deleteMany({ where: { userId } });
      await tx.classPass.deleteMany({ where: { userId } });
      await tx.personalTrainingRequest.updateMany({
        where: { userId },
        data: { userId: null },
      });
      await tx.user.delete({ where: { id: userId } });
    });

    return { success: true };
  }

  async grantClassPass(
    userId: string,
    dto: { durationMonths: number; isUnlimited: boolean; classCount?: number },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (
      !Number.isInteger(dto.durationMonths) ||
      dto.durationMonths < 1 ||
      dto.durationMonths > 120
    ) {
      throw new BadRequestException('Invalid pass duration');
    }

    if (!dto.isUnlimited) {
      if (
        !dto.classCount ||
        !Number.isInteger(dto.classCount) ||
        dto.classCount < 1 ||
        dto.classCount > 1000
      ) {
        throw new BadRequestException('Invalid class count');
      }
    }

    const now = new Date();
    const freezeDays = freezeDaysForDuration(dto.durationMonths);
    const template = dto.isUnlimited
      ? ClassPassTemplate.UNLIMITED_MONTH
      : dto.durationMonths === 1 && dto.classCount === 8
      ? ClassPassTemplate.EIGHT
      : dto.durationMonths === 1 && dto.classCount === 12
      ? ClassPassTemplate.TWELVE
      : ClassPassTemplate.CUSTOM;

    if (dto.isUnlimited) {
      // Extend existing unlimited pass or create new one
      const existing = await this.prisma.classPass.findFirst({
        where: {
          userId,
          isUnlimited: true,
          startsAt: { lte: now },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: { startsAt: 'desc' },
      });

      if (existing) {
        const base =
          existing.expiresAt && existing.expiresAt > now ? existing.expiresAt : now;
        const newExpiry = addMonths(base, dto.durationMonths);
        return this.prisma.classPass.update({
          where: { id: existing.id },
          data: {
            durationMonths: existing.durationMonths + dto.durationMonths,
            freezeDaysTotal: existing.freezeDaysTotal + freezeDays,
            expiresAt: newExpiry,
          },
        });
      }

      const expiresAt = addMonths(now, dto.durationMonths);
      return this.prisma.classPass.create({
        data: {
          userId,
          template,
          isUnlimited: true,
          durationMonths: dto.durationMonths,
          freezeDaysTotal: freezeDays,
          freezeDaysUsed: 0,
          totalClasses: null,
          remainingClasses: null,
          startsAt: now,
          expiresAt,
        },
      });
    }

    // Finite pass
    const count = dto.classCount as number;

    // Add to existing active finite pass if present
    const existingFinite = await this.prisma.classPass.findFirst({
      where: {
        userId,
        isUnlimited: false,
        remainingClasses: { gt: 0 },
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { startsAt: 'desc' },
    });

    if (existingFinite) {
      const base =
        existingFinite.expiresAt && existingFinite.expiresAt > now
          ? existingFinite.expiresAt
          : now;

      return this.prisma.classPass.update({
        where: { id: existingFinite.id },
        data: {
          durationMonths: existingFinite.durationMonths + dto.durationMonths,
          freezeDaysTotal: existingFinite.freezeDaysTotal + freezeDays,
          expiresAt: addMonths(base, dto.durationMonths),
          remainingClasses: { increment: count },
          totalClasses:
            existingFinite.totalClasses != null
              ? existingFinite.totalClasses + count
              : count,
        },
      });
    }

    // Create new finite pass
    return this.prisma.classPass.create({
      data: {
        userId,
        template,
        isUnlimited: false,
        durationMonths: dto.durationMonths,
        freezeDaysTotal: freezeDays,
        freezeDaysUsed: 0,
        totalClasses: count,
        remainingClasses: count,
        startsAt: now,
        expiresAt: addMonths(now, dto.durationMonths),
      },
    });
  }

  private async findFreezableActivePass(userId: string) {
    const now = new Date();

    const unlimited = await this.prisma.classPass.findFirst({
      where: {
        userId,
        isUnlimited: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { startsAt: 'desc' },
    });
    if (unlimited) return unlimited;

    return this.prisma.classPass.findFirst({
      where: {
        userId,
        isUnlimited: false,
        remainingClasses: { gt: 0 },
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { startsAt: 'desc' },
    });
  }

  async freezeClassPass(
    userId: string,
    dto: { startDate: string; endDate: string; reason?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const activePass = await this.findFreezableActivePass(userId);
    if (!activePass) {
      throw new BadRequestException('User has no active class pass to freeze');
    }

    const startDate = dateOnlyUtc(dto.startDate);
    const endDate = dateOnlyUtc(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('Freeze end date must be after start date');
    }

    if (endDate < dateOnlyUtc(activePass.startsAt)) {
      throw new BadRequestException('Freeze dates are outside the class pass period');
    }

    if (
      activePass.expiresAt &&
      (startDate > dateOnlyUtc(activePass.expiresAt) ||
        endDate > dateOnlyUtc(activePass.expiresAt))
    ) {
      throw new BadRequestException('Freeze dates are outside the class pass period');
    }

    const days = inclusiveDays(startDate, endDate);
    const remainingFreezeDays =
      activePass.freezeDaysTotal - activePass.freezeDaysUsed;
    if (days > remainingFreezeDays) {
      throw new BadRequestException('Not enough freeze days available');
    }

    const overlap = await this.prisma.classPassFreeze.findFirst({
      where: {
        classPassId: activePass.id,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlap) {
      throw new ConflictException('Freeze dates overlap an existing freeze');
    }

    return this.prisma.$transaction(async (tx) => {
      const freeze = await tx.classPassFreeze.create({
        data: {
          userId,
          classPassId: activePass.id,
          startDate,
          endDate,
          days,
          reason: dto.reason,
        },
      });

      await tx.classPass.update({
        where: { id: activePass.id },
        data: {
          freezeDaysUsed: { increment: days },
          expiresAt: activePass.expiresAt
            ? new Date(activePass.expiresAt.getTime() + days * DAY_MS)
            : null,
        },
      });

      return freeze;
    });
  }
}
