import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../tasks/entities/task.entity';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import {
  ProjectMember,
  ProjectMemberDocument,
} from './entities/project-member.entity';

@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,

    @InjectModel(ProjectMember.name)
    private projectMemberModel: Model<ProjectMemberDocument>,
  ) {}

  create(createProjectMemberDto: CreateProjectMemberDto) {
    const { projectId, userId } = createProjectMemberDto;

    const newMember = new this.projectMemberModel({
      ...createProjectMemberDto,
      userId: new Types.ObjectId(userId),
      projectId: new Types.ObjectId(projectId),
    });

    return newMember.save();
  }

  update(id: string, updateDto: UpdateProjectMemberDto) {
    return this.projectMemberModel.findByIdAndUpdate(
      id,
      {
        ...updateDto,
        userId: new Types.ObjectId(updateDto?.userId),
        projectId: new Types.ObjectId(updateDto?.projectId),
      },
      { returnDocument: 'after' },
    );
  }

  async remove(id: string) {
    const foundMember = await this.projectMemberModel.findOne({ _id: id });

    if (foundMember) {
      await Promise.all([
        this.projectMemberModel.findByIdAndDelete(id),
        this.taskModel.updateMany(
          {
            assigneeId: new Types.ObjectId(foundMember?.userId),
            projectId: new Types.ObjectId(foundMember?.projectId),
          },
          {
            $unset: { assigneeId: 1 },
          },
        ),
      ]);
    }
  }
}
