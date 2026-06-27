import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskHistoryDto } from './create-task-history.dto';

export class UpdateTaskHistoryDto extends PartialType(CreateTaskHistoryDto) {}
