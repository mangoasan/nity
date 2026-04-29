import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ClassPassTemplate, Role, AuthProvider } from '@prisma/client';

const PASS_CLASSES: Record<string, number | null> = {
  TRIAL: 1,
  EIGHT: 8,
  TWELVE: 12,
  UNLIMITED_MONTH: null,
  CUSTOM: null,
};

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
              type: 'unlimited',
              template: unlimitedPass.template,
              expiresAt: unlimitedPass.expiresAt,
            }
          : finitePass
          ? {
              type: 'finite',
              template: finitePass.template,
              remainingClasses: finitePass.remainingClasses,
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

  async grantClassPass(userId: string, template: ClassPassTemplate, customCount?: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const isUnlimited = template === ClassPassTemplate.UNLIMITED_MONTH;

    if (isUnlimited) {
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
        const newExpiry = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
        return this.prisma.classPass.update({
          where: { id: existing.id },
          data: { expiresAt: newExpiry },
        });
      }

      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return this.prisma.classPass.create({
        data: {
          userId,
          template,
          isUnlimited: true,
          totalClasses: null,
          remainingClasses: null,
          startsAt: now,
          expiresAt,
        },
      });
    }

    // Finite pass
    const count =
      template === ClassPassTemplate.CUSTOM
        ? (customCount as number)
        : (PASS_CLASSES[template] as number);

    if (!count || count < 1) {
      throw new BadRequestException('Invalid class count');
    }

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
      return this.prisma.classPass.update({
        where: { id: existingFinite.id },
        data: {
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
        totalClasses: count,
        remainingClasses: count,
        startsAt: now,
        expiresAt: null,
      },
    });
  }
}
