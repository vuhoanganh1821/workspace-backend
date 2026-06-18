export enum ERole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum EProjectHealth {
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  CRITICAL = 'CRITICAL',
}

export enum EProjectRole {
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  MEMBER = 'MEMBER',
}

export enum ETaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  CODING_DONE = 'CODING_DONE',
  TESTING = 'TESTING',
  DONE = 'DONE',
}

export enum ETaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ETaskType {
  DESIGN = 'Design',
  FRONTEND = 'Frontend',
  BACKEND = 'Backend',
  BUG = 'Bug',
  TESTING = 'Testing',
}

export enum ESprintStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum EConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}
