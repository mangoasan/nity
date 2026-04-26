import { Module } from '@nestjs/common';
import { ClassTypesService } from './class-types.service';
import { ClassTypesController } from './class-types.controller';

@Module({
  providers: [ClassTypesService],
  controllers: [ClassTypesController],
  exports: [ClassTypesService],
})
export class ClassTypesModule {}
