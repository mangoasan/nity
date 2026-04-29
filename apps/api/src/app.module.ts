import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MastersModule } from './masters/masters.module';
import { ClassTypesModule } from './class-types/class-types.module';
import { ScheduleModule } from './schedule/schedule.module';
import { BookingsModule } from './bookings/bookings.module';
import { PersonalTrainingModule } from './personal-training/personal-training.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuthModule,
    MastersModule,
    ClassTypesModule,
    ScheduleModule,
    BookingsModule,
    PersonalTrainingModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
