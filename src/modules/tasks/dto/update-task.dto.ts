import { ETaskStatus } from 'src/enums';

export class UpdateTaskDto {
  title: string;
  description: string;
  status: ETaskStatus;
  priority: string;
  type: string;
  projectId: string;
  assigneeId: string;
  sprintId: string;
  createdBy: string;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
}
