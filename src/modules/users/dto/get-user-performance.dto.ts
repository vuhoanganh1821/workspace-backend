import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ETaskStatus } from 'src/enums';

export class GetPerformanceQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string = 'all';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UserPerformanceDto {
  kpis: {
    totalTasks: number;
    completionRate: number;
    totalReopens: number;
    loggedHours: number;
  };
  projectTimeLine: {
    _id: string;
    name: string;
    totalLoggedHours: number;
  }[];
  statusOverview: {
    status: ETaskStatus;
    count: number;
  }[];
  tasks: {
    _id: string;
    title: string;
    dueDate: Date;
    completionDate: Date | null;
    reopenCount: number;
    status: ETaskStatus;
    estimatedHours: number;
    loggedHours: number;
  }[];
}
