import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMasterDto } from './dto/create-master.dto';
import { UpdateMasterDto } from './dto/update-master.dto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { getMasterUploadsDir } from '../common/utils/uploads';

@Injectable()
export class MastersService {
  constructor(private prisma: PrismaService) {}

  private serializeMaster<T extends { photoUrl?: string | null }>(master: T): T {
    return { ...master, photoUrl: master.photoUrl ?? null };
  }

  async findAll(activeOnly = false) {
    const masters = await this.prisma.yogaMaster.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });

    return masters.map((master) => this.serializeMaster(master));
  }

  async findOne(id: string) {
    const master = await this.prisma.yogaMaster.findUnique({ where: { id } });
    if (!master) throw new NotFoundException('Master not found');
    return this.serializeMaster(master);
  }

  async findBySlug(slug: string) {
    const master = await this.prisma.yogaMaster.findUnique({ where: { slug } });
    if (!master) throw new NotFoundException('Master not found');
    return this.serializeMaster(master);
  }

  async create(dto: CreateMasterDto) {
    const existing = await this.prisma.yogaMaster.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug already in use');
    const master = await this.prisma.yogaMaster.create({ data: dto });
    return this.serializeMaster(master);
  }

  async update(id: string, dto: UpdateMasterDto) {
    await this.findOne(id);
    const master = await this.prisma.yogaMaster.update({ where: { id }, data: dto });
    return this.serializeMaster(master);
  }

  async remove(id: string) {
    await this.findOne(id);
    const master = await this.prisma.yogaMaster.delete({ where: { id } });
    return this.serializeMaster(master);
  }

  async savePhoto(file: { buffer: Buffer; mimetype?: string; originalname?: string }) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('PNG file is required');
    }

    if (file.mimetype !== 'image/png') {
      throw new BadRequestException('Only PNG images are supported');
    }

    const uploadsDir = getMasterUploadsDir();
    await mkdir(uploadsDir, { recursive: true });

    const filename = `master-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.png`;
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, file.buffer);

    return filename;
  }
}
