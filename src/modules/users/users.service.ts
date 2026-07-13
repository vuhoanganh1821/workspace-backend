import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import uniqBy from 'lodash/uniqBy';
import { Model, QueryFilter, Types } from 'mongoose';
import { PaginationList } from 'src/common/types';
import { EProjectRole, ERole, ETaskStatus } from 'src/enums';
import {
  ProjectMember,
  ProjectMemberDocument,
  ProjectMemberWithRelations,
} from '../project-members/entities/project-member.entity';
import { Project, ProjectDocument } from '../projects/entities/project.entity';
import { Task, TaskDocument } from '../tasks/entities/task.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import {
  GetPerformanceQueryDto,
  UserPerformanceDto,
} from './dto/get-user-performance.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';
import {
  getUserPerformancePipeline,
  IAggregationResult,
} from './pipelines/user-performance.pipeline';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,

    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,

    @InjectModel(ProjectMember.name)
    private projectMemberModel: Model<ProjectMemberDocument>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { fullName, email, password, role } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);

    return await new this.userModel({
      fullName,
      email,
      passwordHash,
      role,
    }).save();
  }

  async findAll(filterDto: FilterUserDto): Promise<PaginationList<User>> {
    const { search, skip, limit } = filterDto;

    const userQuery: QueryFilter<UserDocument> = {
      ...(search && { fullName: { $regex: search, $options: 'i' } }),
    };

    const [results, totalCount] = await Promise.all([
      this.userModel
        .find(userQuery)
        .select('fullName email avatar role phoneNumber isActive')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(userQuery).exec(),
    ]);

    return { results, totalCount };
  }

  async findOne(id: string) {
    return this.userModel.findById(id).exec();
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { returnDocument: 'after' })
      .exec();
  }

  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted successfully' };
  }

  async getPerformance(
    userId: string,
    query: GetPerformanceQueryDto,
  ): Promise<UserPerformanceDto> {
    const pipeline = getUserPerformancePipeline(userId, query);

    const [aggregationResult] = await this.taskModel
      .aggregate<IAggregationResult>(pipeline)
      .exec();

    const { tasksData, statusOverviewData, projectTimelineData } =
      aggregationResult;

    const totalTasks = tasksData?.length ?? 0;
    const totalReopens =
      tasksData?.reduce((sum, task) => sum + (task?.reopenCount ?? 0), 0) ?? 0;
    const totalLoggedHours =
      tasksData?.reduce((sum, task) => sum + (task?.loggedHours ?? 0), 0) ?? 0;
    const totalEstimatedHours =
      tasksData?.reduce((sum, task) => sum + (task?.estimatedHours ?? 0), 0) ?? 0;

    const completedTasksCount =
      statusOverviewData?.find(
        (statusOverview) => statusOverview?._id === ETaskStatus.DONE,
      )?.count ?? 0;

    const completionRate =
      totalTasks > 0
        ? Number(((completedTasksCount / totalTasks) * 100).toFixed(2))
        : 0;

    return {
      kpis: {
        totalTasks,
        completionRate,
        totalReopens,
        loggedHours: totalLoggedHours,
        totalEstimatedHours: totalEstimatedHours,
      },
      projectTimeLine:
        projectTimelineData?.map((project) => ({
          _id: project?._id?.toString(),
          name: project?.name ?? '',
          totalLoggedHours: project?.totalLoggedHours ?? 0,
        })) ?? [],
      statusOverview:
        statusOverviewData?.map((statusData) => ({
          status: statusData?._id,
          count: statusData?.count ?? 0,
        })) ?? [],
      tasks:
        tasksData?.map((task) => ({
          _id: task?._id?.toString(),
          title: task?.title ?? '',
          projectId: task?.projectId ?? '',
          dueDate: task?.dueDate ?? null,
          completionDate: task?.completionDate ?? null,
          reopenCount: task?.reopenCount ?? 0,
          status: task?.status as ETaskStatus,
          estimatedHours: task?.estimatedHours ?? 0,
          loggedHours: task?.loggedHours ?? 0,
        })) ?? [],
    };
  }

  async getMyManagedUsers(currentUserId: string) {
    const foundUser = await this.userModel.findById(currentUserId);

    if (foundUser?.role === ERole.ADMIN) {
      return this.userModel
        .find()
        .select('fullName avatar')
        .lean<UserDocument[]>()
        .exec();
    }

    const userObjectId = new Types.ObjectId(currentUserId);

    const myManagements = await this.projectMemberModel
      .find({
        userId: userObjectId,
        role: EProjectRole.PROJECT_MANAGER,
      })
      .select('projectId')
      .lean()
      .exec();

    if (myManagements?.length === 0) {
      return [foundUser];
    }

    const projectIds = myManagements.map((m) => m?.projectId);

    if (projectIds?.length === 0) {
      return [];
    }

    const allMembersInProjects = await this.projectMemberModel
      .find({
        projectId: { $in: projectIds },
      })
      .populate('user', '_id fullName avatar')
      .lean<ProjectMemberWithRelations[]>()
      .exec();

    const users = allMembersInProjects.map(
      (member) => member?.user as UserDocument,
    );

    const myManagedUsers = uniqBy(users, '_id') as UserDocument[];

    return myManagedUsers;
  }

  async getMyManagedProjects(currentUserId: string) {
    const foundUser = await this.userModel.findById(currentUserId);

    if (foundUser?.role === ERole.ADMIN) {
      return this.projectModel
        .find()
        .select('name logo')
        .lean<ProjectDocument[]>()
        .exec();
    }

    const userObjectId = new Types.ObjectId(currentUserId);

    const myManagements = await this.projectMemberModel
      .find({
        userId: userObjectId,
        role: EProjectRole.PROJECT_MANAGER,
      })
      .populate('project', '_id name logo')
      .lean<ProjectMemberWithRelations[]>()
      .exec();

    const myManagedProjects = myManagements?.map((m) => m?.project);

    return myManagedProjects;
  }

  async getMyProjects(currentUserId: string) {
    const foundUser = await this.userModel.findById(currentUserId);

    if (foundUser?.role === ERole.ADMIN) {
      return this.projectModel
        .find()
        .select('name logo')
        .lean<ProjectDocument[]>()
        .exec();
    }

    const userObjectId = new Types.ObjectId(currentUserId);

    const myProjectMembers = await this.projectMemberModel
      .find({ userId: userObjectId })
      .populate('project', '_id name logo')
      .lean<ProjectMemberWithRelations[]>()
      .exec();

    const myManagedProjects = myProjectMembers?.map((m) => m?.project);

    return myManagedProjects;
  }
}
