import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassTypeDto } from './dto/create-class-type.dto';
import { UpdateClassTypeDto } from './dto/update-class-type.dto';

@Injectable()
export class ClassTypesService {
  constructor(private prisma: PrismaService) {}

  findAll(activeOnly = false) {
    return this.prisma.yogaClassType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { titleRu: 'asc' },
    });
  }

  async findOne(id: string) {
    const ct = await this.prisma.yogaClassType.findUnique({ where: { id } });
    if (!ct) throw new NotFoundException('Class type not found');
    return ct;
  }

  create(dto: CreateClassTypeDto) {
    return this.prisma.yogaClassType.create({ data: dto });
  }

  async update(id: string, dto: UpdateClassTypeDto) {
    await this.findOne(id);
    return this.prisma.yogaClassType.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.yogaClassType.delete({ where: { id } });
  }
}
