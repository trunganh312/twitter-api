import { Request } from 'express';
import sharp from 'sharp';
import path from 'path';
import { getNameFilePath, handleUploadImage, handleUploadVideo } from '~/utils/file';
import { UPLOAD_IMAGE_DIR } from '~/constants/dir';
import { envConfig, isProduction } from '~/constants/config';
import { EncodingStatus, MediaType } from '~/constants/enums';
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video';
import fsPromise from 'fs/promises';
import databaseService from '~/services/database.services';
import { VideoStatus } from '~/models/schemas/VideoStatus.schema';
import { ErrorWithStatus } from '~/utils/error';

class Queue {
  // Mang luu tru cong viec trong hang doi
  items: string[];
  // Trang thai hang doi co dang encoding hay khong
  encoding: boolean;
  constructor() {
    this.items = [];
    this.encoding = false;
  }

  // Them cong viec vao hang doi va bat dau qua trinh encode luon, neu trong hang doi dang encode thi phai doi
  async enqueue(item: string) {
    this.items.push(item);
    const pathName = getNameFilePath(item.split('\\').pop() as string);
    console.log(item);
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: pathName,
        status: EncodingStatus.Pending,
      })
    );
    this.processEncode();
  }

  async processEncode() {
    if (this.encoding) return;
    if (this.items.length > 0) {
      this.encoding = true;
      const videoPath = this.items[0];
      const pathName = getNameFilePath(videoPath.split('/').pop() as string);
      await databaseService.videoStatus.updateOne(
        {
          name: pathName,
        },
        {
          $set: {
            status: EncodingStatus.Processing,
          },
          $currentDate: {
            updated_at: true,
          },
        }
      );
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath);
        this.items.shift();
        await fsPromise.unlink(videoPath);
        await databaseService.videoStatus
          .updateOne(
            {
              name: pathName,
            },
            {
              $set: {
                status: EncodingStatus.Success,
              },
              $currentDate: {
                updated_at: true,
              },
            }
          )
          .catch((err) => console.log(err));
        console.log(`Encoding video ${videoPath} successfully`);
      } catch (error) {
        await databaseService.videoStatus
          .updateOne(
            {
              name: pathName,
            },
            {
              $set: {
                status: EncodingStatus.Failed,
                message: 'Upload video failed',
              },
              $currentDate: {
                updated_at: true,
              },
            }
          )
          .catch((err) => console.log(err));
        console.log(`Encoding video ${videoPath} error: ${error}`);
      }
      this.encoding = false;
      this.processEncode();
    } else {
      console.log('Encoding is emty');
    }
  }
}

const queue = new Queue();

class MediaService {
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

  async uploadVideoHls(req: Request) {
    const file = await handleUploadVideo(req);

    const result = await Promise.all(
      file.map(async (file) => {
        const fileName = getNameFilePath(file.newFilename);
        queue.enqueue(file.filepath);

        return {
          url: isProduction
            ? `${envConfig.host}/static/video-hls/${fileName}`
            : `http://localhost:${envConfig.port}/static/video-hls/${fileName}`,
          type: MediaType.HLS,
        };
      })
    );
    return result;
  }

  async getVideoStatus(name: string) {
    const videoStatus = await databaseService.videoStatus.findOne({
      name,
    });
    if (!videoStatus) {
      throw new ErrorWithStatus({
        message: 'Video not found',
        status: 404,
      });
    }
    return videoStatus;
  }
}

const mediaService = new MediaService();
export default mediaService;
