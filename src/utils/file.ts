import { Request } from 'express';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';
import { isEmptyObject } from './utils';
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir';
export const initFolder = () => {
  const uploadFolderPath = path.resolve(UPLOAD_IMAGE_TEMP_DIR);
  [UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((file) => {
    if (!fs.existsSync(file)) {
      fs.mkdirSync(file, {
        recursive: true, // Nested folders
      });
    }
  });
};

export const handleUploadImage = (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_IMAGE_TEMP_DIR),
    keepExtensions: true,
    maxFileSize: 300 * 1024, // 300KB
    maxTotalFileSize: 300 * 1024 * 4,
    maxFiles: 4,
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'));
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any); // optional make form.parse error
      }

      return valid;
    },
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (isEmptyObject(files)) {
        return reject(new Error('File is empty'));
      }
      if (err) {
        return reject(err);
      }
      return resolve(files.image as File[]);
    });
  });
};

export const handleUploadVideo = (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_VIDEO_DIR),
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    multiples: false,
    maxFiles: 1,
    filter: ({ name, originalFilename, mimetype }) => {
      const valid =
        name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'));
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any); // optional make form.parse error
      }

      return valid;
    },
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (isEmptyObject(files)) {
        return reject(new Error('File is empty'));
      }
      if (err) {
        return reject(err);
      }
      return resolve(files.video as File[]);
    });
  });
};

export const getNameFilePath = (name: string) => {
  const namearr = name.split('.');
  return namearr[0];
};
