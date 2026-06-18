import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const cloudinaryResponse = await this.uploadService.uploadFile(file);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const fileUrl: string = cloudinaryResponse?.secure_url;

    return fileUrl;
  }
}
