import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import {
  ProjectMember,
  ProjectMemberDocument,
} from './entities/project-member.entity';

@Injectable()
export class ProjectMembersService {
  constructor(
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

  remove(id: string) {
    return this.projectMemberModel.findByIdAndDelete(id);
  }
}
