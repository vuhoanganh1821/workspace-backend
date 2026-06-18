import { Injectable, BadRequestException } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  async uploadFile(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để upload!');
    }

    const fileNameWithExt = decodeURIComponent(file?.originalname);

    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file?.originalname?.includes('.pdf');
    const lastDotIndex = fileNameWithExt.lastIndexOf('.');

    const fileNameWithoutExt =
      lastDotIndex !== -1
        ? fileNameWithExt.substring(0, lastDotIndex)
        : fileNameWithExt;

    const safePublicId =
      isImage || isPdf
        ? `${Date.now()}_${fileNameWithoutExt}`
        : `${Date.now()}_${fileNameWithExt}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'workspace',
          resource_type: 'auto',
          public_id: safePublicId,
          use_filename: true,
          unique_filename: false,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as UploadApiResponse);
        },
      );

      streamifier.createReadStream(file?.buffer).pipe(uploadStream);
    });
  }
}
