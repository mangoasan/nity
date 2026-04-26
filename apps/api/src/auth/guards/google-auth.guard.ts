import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { normalizeLocale } from '../../common/utils/url';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    return {
      scope: ['email', 'profile'],
      state: normalizeLocale(request.query?.locale),
    };
  }
}
