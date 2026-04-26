import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
