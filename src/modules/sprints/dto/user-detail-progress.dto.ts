export class MiniTaskDto {
  _id: string;
  title: string;
  priority: string;
  dueDate: Date;
  isOverdue: boolean;
}

export class UserDetailSummary {
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

export class TasksByStatus {
  todo: MiniTaskDto[];
  inProgress: MiniTaskDto[];
  codingDone: MiniTaskDto[];
  testing: MiniTaskDto[];
  done: MiniTaskDto[];
}

export class UserDetailProgressDto {
  _id: string;
  fullName: string;
  avatar: string;
  position: string;
  summary: UserDetailSummary;
  tasksByStatus: TasksByStatus;
  overdueTasks: MiniTaskDto[];
}
