import { IsOptional, IsString } from 'class-validator';

export class GetProjectsFilterDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  skip: number;
  limit: number;
}
