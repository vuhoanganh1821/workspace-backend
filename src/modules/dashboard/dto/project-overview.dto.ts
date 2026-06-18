import { SprintDocument } from 'src/modules/sprints/entities/sprint.entity';

export class ProjectOverviewDto {
  _id: string;
  name: string;
  logo: string;
  activeSprint: Partial<SprintDocument>;
  progress: number;
  healthStatus: string;
}
