import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClassPassTemplate } from '@prisma/client';

const PASS_CLASSES: Record<string, number | null> = {
  TRIAL: 1,
  EIGHT: 8,
  TWELVE: 12,
  UNLIMITED_MONTH: null,
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

  async grantClassPass(userId: string, template: ClassPassTemplate) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isUnlimited = template === ClassPassTemplate.UNLIMITED_MONTH;
    const totalClasses = isUnlimited ? null : (PASS_CLASSES[template] as number);
    const startsAt = new Date();
    const expiresAt = isUnlimited
      ? new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.classPass.create({
      data: {
        userId,
        template,
        isUnlimited,
        totalClasses,
        remainingClasses: isUnlimited ? null : totalClasses,
        startsAt,
        expiresAt,
      },
    });
  }
}
