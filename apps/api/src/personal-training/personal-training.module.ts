import { Module } from '@nestjs/common';
import { PersonalTrainingService } from './personal-training.service';
import { PersonalTrainingController } from './personal-training.controller';

@Module({
  providers: [PersonalTrainingService],
  controllers: [PersonalTrainingController],
})
export class PersonalTrainingModule {}
