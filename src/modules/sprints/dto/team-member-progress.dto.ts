export class TeamMemberProgressDto {
  _id: string;
  fullName: string;
  avatar: string;
  position: string;
  totalTasks: number;
  totalDone: number;
  totalOverdue: number;
  progressPercentage: number;
}
