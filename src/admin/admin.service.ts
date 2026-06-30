import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, usersByRole, usersByTier, totalRevenue, recentPayments, totalConnections] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.groupBy({ by: ['role'], _count: true }),
        this.prisma.user.groupBy({ by: ['subscriptionTier'], _count: true }),
        this.prisma.payment.aggregate({
          where: { status: 'SUCCESS' },
          _sum: { amount: true, commissionAmount: true },
        }),
        this.prisma.payment.findMany({
          where: { status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { email: true } } },
        }),
        this.prisma.connection.count({ where: { status: 'ACCEPTED' } }),
      ]);

    return {
      totalUsers,
      usersByRole,
      usersByTier,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalCommission: totalRevenue._sum.commissionAmount || 0,
      recentPayments,
      totalConnections,
    };
  }

  async getAllUsers(page = 1, limit = 50) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        include: { profile: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive } });
  }

  async verifyUser(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
  }
}
