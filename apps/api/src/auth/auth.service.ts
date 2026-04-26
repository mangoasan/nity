import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private signToken(userId: string, email: string) {
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
}
