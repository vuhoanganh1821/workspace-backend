export class CreateTimeLogDto {
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  taskId: string;
  userId: string;
  projectId: string;
}
