import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConnectionDto } from './dto/connection.dto';

@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService) {}

  async sendRequest(requesterId: string, dto: CreateConnectionDto) {
    if (requesterId === dto.addresseeId) {
      throw new BadRequestException('Impossible de vous connecter à vous-même');
    }

    const existing = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId: dto.addresseeId },
          { requesterId: dto.addresseeId, addresseeId: requesterId },
        ],
      },
    });
    if (existing) {
      throw new BadRequestException('Une connexion existe déjà entre ces deux utilisateurs');
    }

    return this.prisma.connection.create({
      data: {
        requesterId,
        addresseeId: dto.addresseeId,
        message: dto.message,
      },
    });
  }

  async respondToRequest(userId: string, connectionId: string, accept: boolean) {
    const connection = await this.prisma.connection.findUnique({ where: { id: connectionId } });
    if (!connection) throw new NotFoundException('Demande de connexion introuvable');
    if (connection.addresseeId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas répondre à cette demande');
    }

    return this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: accept ? 'ACCEPTED' : 'REJECTED' },
    });
  }

  async getMyConnections(userId: string, status?: string) {
    return this.prisma.connection.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
        ...(status ? { status: status as any } : {}),
      },
      include: {
        requester: { include: { profile: true } },
        addressee: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingRequests(userId: string) {
    return this.prisma.connection.findMany({
      where: { addresseeId: userId, status: 'PENDING' },
      include: { requester: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({ where: { id: connectionId } });
    if (!connection) throw new NotFoundException('Connexion introuvable');
    if (connection.requesterId !== userId && connection.addresseeId !== userId) {
      throw new ForbiddenException();
    }
    return this.prisma.connection.delete({ where: { id: connectionId } });
  }
}
