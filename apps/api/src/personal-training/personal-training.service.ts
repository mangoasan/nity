import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePTRequestDto } from './dto/create-pt-request.dto';
import { UpdatePTStatusDto } from './dto/update-pt-status.dto';

@Injectable()
export class PersonalTrainingService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePTRequestDto, userId?: string) {
    return this.prisma.personalTrainingRequest.create({
      data: { ...dto, userId: userId ?? null },
    });
  }

  findAll(status?: string) {
    return this.prisma.personalTrainingRequest.findMany({
      where: status ? { status: status as any } : undefined,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const req = await this.prisma.personalTrainingRequest.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!req) throw new NotFoundException('Request not found');
    return req;
  }

  async updateStatus(id: string, dto: UpdatePTStatusDto) {
    await this.findOne(id);
    return this.prisma.personalTrainingRequest.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
