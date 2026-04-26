import { PartialType } from '@nestjs/mapped-types';
import { CreateClassTypeDto } from './create-class-type.dto';

export class UpdateClassTypeDto extends PartialType(CreateClassTypeDto) {}
