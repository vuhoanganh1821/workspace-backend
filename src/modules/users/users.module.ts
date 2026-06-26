import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProjectMember,
  ProjectMemberSchema,
} from '../project-members/entities/project-member.entity';
import { Project, ProjectSchema } from '../projects/entities/project.entity';
import { Task, TaskSchema } from '../tasks/entities/task.entity';
import { User, UserSchema } from './entities/user.entity';
import { MeController } from './me.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectMember.name, schema: ProjectMemberSchema },
    ]),
  ],
  controllers: [UsersController, MeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
