import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, QueryFilter } from 'mongoose';
import { getValidArray } from 'src/common';
import {
  ProjectMember,
  ProjectMemberDocument,
} from 'src/modules/project-members/entities/project-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetProjectsFilterDto } from './dto/get-projects-filter.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectDocument } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectMember.name)
    private projectMemberModel: Model<ProjectMemberDocument>,
  ) {}

  async getProjects(filterDto: GetProjectsFilterDto): Promise<Project[]> {
    const { userId, search } = filterDto;

    const projectIds: Types.ObjectId[] = [];

    if (userId) {
      const members: ProjectMember[] = await this.projectMemberModel
        .find({ userId: new Types.ObjectId(userId) })
        .select('projectId')
        .exec();

      const myProjectIds = getValidArray(members)?.map(
        (member) => member?.projectId,
      );

      projectIds.push(...myProjectIds);
    }

    const projectQuery: QueryFilter<ProjectDocument> = {
      ...(userId && { _id: { $in: projectIds } }),
      ...(search && { name: { $regex: search, $options: 'i' } }),
    };

    return this.projectModel.find(projectQuery).sort({ updatedAt: -1 }).exec();
  }

  async create(createProjectDto: CreateProjectDto) {
    return await new this.projectModel(createProjectDto).save();
  }

  findMembersByProject(projectId: string) {
    return this.projectMemberModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .populate('user', 'fullName avatar')
      .exec();
  }

  async findOne(id: string) {
    const foundProject = await this.projectModel.findById(id).exec();

    if (!foundProject) {
      return null;
    }

    return foundProject;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    return await this.projectModel.findByIdAndUpdate(id, updateProjectDto, {
      new: true,
    });
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid Project ID format`);
    }
    const projectObjectId = new Types.ObjectId(id);

    const [deletedProject, deleteMembersResult] = await Promise.all([
      this.projectModel.findByIdAndDelete(projectObjectId),
      this.projectMemberModel.deleteMany({ projectId: projectObjectId }),
    ]);

    if (!deletedProject) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return {
      message: 'Project deleted successfully',
    };
  }
}
