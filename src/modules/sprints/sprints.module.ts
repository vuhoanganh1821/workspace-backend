import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from 'src/modules/tasks/entities/task.entity';
import {
  ProjectMember,
  ProjectMemberSchema,
} from '../project-members/entities/project-member.entity';
import { Sprint, SprintSchema } from './entities/sprint.entity';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sprint.name, schema: SprintSchema },
      { name: Task.name, schema: TaskSchema },
      { name: ProjectMember.name, schema: ProjectMemberSchema },
    ]),
  ],
  controllers: [SprintsController],
  providers: [SprintsService],
})
export class SprintsModule {}
