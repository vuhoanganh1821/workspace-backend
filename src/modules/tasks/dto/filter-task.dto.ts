import { IsOptional, IsString } from 'class-validator';

export class FilterTaskDto {
  sprintId: string;

  @IsOptional()
  @IsString()
  search?: string;
}
