import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProjectMembersModule } from './modules/project-members/project-members.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TimeLogsModule } from './modules/time-logs/time-logs.module';
import { TimesheetModule } from './modules/timesheet/timesheet.module';
import { UploadController } from './modules/upload/upload.controller';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mongoUri =
          configService.get<string>('MONGO_DB_URI') ??
          'mongodb://127.0.0.1:27017/timesheet';

        return {
          uri: mongoUri,
          connectionFactory: (connection: Connection): Connection => {
            connection.on('connected', () => {
              console.log('✨ MONGODB CONNECTED SUCCESSFULLY!');
              console.log('👉 Database Name:', connection.name);
              console.log('👉 Host:', connection.host);
              console.log('👉 Port:', connection.port);
            });

            connection.on('error', (error) => {
              console.error('❌ MONGODB CONNECTION ERROR:', error);
            });

            connection.on('disconnected', () => {
              console.warn('⚠️ MONGODB DISCONNECTED!');
            });

            return connection;
          },
        };
      },
    }),

    AuthModule,
    DashboardModule,
    ChatModule,
    ProjectsModule,
    ProjectMembersModule,
    SprintsModule,
    TasksModule,
    TimeLogsModule,
    TimesheetModule,
    UploadModule,
    UsersModule,
  ],
  controllers: [AppController, UploadController],
  providers: [AppService],
})
export class AppModule {}
