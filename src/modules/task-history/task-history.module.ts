import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskHistory, TaskHistorySchema } from './entities/task-history.entity';
import { TaskHistoryController } from './task-history.controller';
import { TaskHistoryService } from './task-history.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskHistory.name, schema: TaskHistorySchema },
    ]),
  ],
  controllers: [TaskHistoryController],
  providers: [TaskHistoryService],
})
export class TaskHistoryModule {}
