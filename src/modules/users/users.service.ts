import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import uniqBy from 'lodash/uniqBy';
import { Model, Types } from 'mongoose';
import { EProjectRole, ERole } from 'src/enums';
import {
  ProjectMember,
  ProjectMemberDocument,
  ProjectMemberWithRelations,
} from '../project-members/entities/project-member.entity';
import { Project, ProjectDocument } from '../projects/entities/project.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

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

  findAll() {
    return this.userModel
      .find()
      .select('fullName email avatar role phoneNumber isActive')
      .exec();
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

    const projectIds = myManagements.map((m) => m?.projectId);

    if (projectIds?.length === 0) {
      return [];
    }

    const allMembersInProjects = await this.projectMemberModel
      .find({
        projectId: { $in: projectIds },
        userId: { $ne: userObjectId },
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
