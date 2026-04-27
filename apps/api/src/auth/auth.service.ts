import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private signToken(userId: string, email: string | null) {
    return this.jwtService.sign({ sub: userId, email });
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        authProvider: AuthProvider.EMAIL,
      },
    });

    return {
      accessToken: this.signToken(user.id, user.email),
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return {
      accessToken: this.signToken(user.id, user.email),
      user: this.sanitizeUser(user),
    };
  }

  async findOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { googleId: data.googleId },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: data.googleId,
            authProvider: AuthProvider.GOOGLE,
            avatarUrl: data.avatarUrl,
          },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            name: data.name,
            email: data.email,
            googleId: data.googleId,
            authProvider: AuthProvider.GOOGLE,
            avatarUrl: data.avatarUrl,
          },
        });
      }
    }

    return user;
  }

  async googleLogin(user: any) {
    return {
      accessToken: this.signToken(user.id, user.email),
      user: this.sanitizeUser(user),
    };
  }

  sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitizeUser(user);
  }

  async updatePhone(userId: string, phone: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { phone },
    });
    return this.sanitizeUser(user);
  }

  async getMyPassSummary(userId: string) {
    const now = new Date();
    const passes = await this.prisma.classPass.findMany({
      where: {
        userId,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { startsAt: 'asc' },
    });

    const unlimited = passes.find((p) => p.isUnlimited);
    const finite = passes.find((p) => !p.isUnlimited && (p.remainingClasses ?? 0) > 0);

    return {
      unlimitedPass: unlimited
        ? { id: unlimited.id, expiresAt: unlimited.expiresAt, template: unlimited.template }
        : null,
      finitePass: finite
        ? { id: finite.id, remainingClasses: finite.remainingClasses, template: finite.template }
        : null,
      hasActivePass: !!(unlimited || finite),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    if (!user.passwordHash) {
      throw new BadRequestException('Password change is not available for OAuth accounts. Set a password first.');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  }
}
