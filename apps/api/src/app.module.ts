import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    PrismaModule,
    AuthModule,
    MastersModule,
    ClassTypesModule,
    ScheduleModule,
    BookingsModule,
    PersonalTrainingModule,
    AdminModule,
  ],
})
export class AppModule {}
