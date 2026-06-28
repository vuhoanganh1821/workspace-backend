import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Sprint,
  SprintSchema,
} from 'src/modules/sprints/entities/sprint.entity';
import {
  TaskComment,
  TaskCommentSchema,
} from '../task-comment/entities/task-comment.entity';
import {
  TaskHistory,
  TaskHistorySchema,
} from '../task-history/entities/task-history.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Task, TaskSchema } from './entities/task.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: TaskHistory.name, schema: TaskHistorySchema },
      { name: TaskComment.name, schema: TaskCommentSchema },
      { name: User.name, schema: UserSchema },
      { name: Sprint.name, schema: SprintSchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
