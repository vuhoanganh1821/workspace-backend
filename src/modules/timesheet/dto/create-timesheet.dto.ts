export class CreateTimesheetDto {
  taskName: string;
  description: string;
  startTime: Date;
  endTime: Date;
  hourlyRate: number;
  userId: string;
  projectId: string;
  taskId: string;
}
