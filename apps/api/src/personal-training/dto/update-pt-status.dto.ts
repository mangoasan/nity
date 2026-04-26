import { IsEnum } from 'class-validator';
import { PTRequestStatus } from '@prisma/client';

export class UpdatePTStatusDto {
  @IsEnum(PTRequestStatus)
  status: PTRequestStatus;
}
