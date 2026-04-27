import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { normalizeLocale } from '../common/utils/url';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any) {
    return this.authService.sanitizeUser(user);
  }

  @Get('me/passes')
  @UseGuards(JwtAuthGuard)
  getMyPasses(@CurrentUser() user: any) {
    return this.authService.getMyPassSummary(user.id);
  }

  @Patch('me/phone')
  @UseGuards(JwtAuthGuard)
  updatePhone(@CurrentUser() user: any, @Body() dto: UpdatePhoneDto) {
    return this.authService.updatePhone(user.id, dto.phone);
  }

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(@Query('locale') _locale?: string) {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: any) {
    const result = await this.authService.googleLogin(req.user);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3100';
    const locale = normalizeLocale(req.query.state);

    // If user has no phone, redirect to complete-phone page
    if (!req.user.phone) {
      return res.redirect(
        `${frontendUrl}/${locale}/auth/complete-phone?token=${result.accessToken}`,
      );
    }

    res.redirect(
      `${frontendUrl}/${locale}/auth/callback?token=${result.accessToken}`,
    );
  }
}
