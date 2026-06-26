import { Types } from 'mongoose';
import { ETaskStatus } from 'src/enums';

export class CreateTaskDto {
  title: string;
  description?: string;
  status?: ETaskStatus;
  priority?: string;
  projectId: string | Types.ObjectId;
  assigneeId?: string | Types.ObjectId;
  sprintId?: string | Types.ObjectId;
  createdBy: string | Types.ObjectId;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
}
