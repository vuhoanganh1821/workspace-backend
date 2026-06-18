import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EProjectRole } from 'src/enums';
import { ProjectDocument } from 'src/modules/projects/entities/project.entity';
import { UserDocument } from 'src/modules/users/entities/user.entity';

export type ProjectMemberDocument = HydratedDocument<ProjectMember>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      EProjectRole.PROJECT_MANAGER,
      EProjectRole.TEAM_LEAD,
      EProjectRole.MEMBER,
    ],
    default: EProjectRole.MEMBER,
  })
  role: EProjectRole;

  @Prop({ required: true })
  position: string;

  @Prop({ default: Date.now })
  joinedAt: Date;
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

ProjectMemberSchema.virtual('project', {
  ref: 'Project',
  localField: 'projectId',
  foreignField: '_id',
  justOne: true,
});

ProjectMemberSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export type ProjectMemberWithRelations = ProjectMember & {
  user?: Partial<UserDocument>;
  project?: Partial<ProjectDocument>;
};
