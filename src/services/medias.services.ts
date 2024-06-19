import { Request } from 'express';
import sharp from 'sharp';
import path from 'path';
import { getNameFilePath, handleUploadImage, handleUploadVideo } from '~/utils/file';
import { UPLOAD_IMAGE_DIR } from '~/constants/dir';
import { envConfig, isProduction } from '~/constants/config';
import { MediaType } from '~/constants/enums';

class MediasService {
  async uploadImage(req: Request) {
    const file = await handleUploadImage(req);
    const result = Promise.all(
      file.map(async (file) => {
        const newFileName = getNameFilePath(file.newFilename);
        const fileNameJpeg = path.resolve(UPLOAD_IMAGE_DIR, `${newFileName}.jpg`);
        await sharp(file.filepath).jpeg().toFile(fileNameJpeg);
        return {
          url: isProduction
            ? `${envConfig.host}/static/image/${newFileName}.jpg`
            : `http://localhost:${envConfig.port}/static/image/${newFileName}.jpg`,
          type: MediaType.Image,
        };
      })
    );
    return result;
  }

  async uploadVideo(req: Request) {
    const file = await handleUploadVideo(req);
    const result = Promise.all(
      file.map(async (file) => {
        return {
          url: isProduction
            ? `${envConfig.host}/static/video/${file.newFilename}`
            : `http://localhost:${envConfig.port}/static/video/${file.newFilename}`,
          type: MediaType.Video,
        };
      })
    );
    return result;
  }
}

const mediasService = new MediasService();
export default mediasService;
