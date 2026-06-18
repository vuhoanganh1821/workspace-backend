import { Types } from 'mongoose';

export class CreateTaskDto {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  projectId: string | Types.ObjectId;
  assigneeId?: string | Types.ObjectId;
  sprintId?: string | Types.ObjectId;
  createdBy: string | Types.ObjectId;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
}
