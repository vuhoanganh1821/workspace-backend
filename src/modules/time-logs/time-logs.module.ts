import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimeLog, TimeLogSchema } from './entities/time-log.entity';
import { TimeLogsController } from './time-logs.controller';
import { TimeLogsService } from './time-logs.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TimeLog.name, schema: TimeLogSchema }]),
  ],
  controllers: [TimeLogsController],
  providers: [TimeLogsService],
})
export class TimeLogsModule {}
