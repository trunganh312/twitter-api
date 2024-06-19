import express, { NextFunction } from 'express';
import { Request, Response } from 'express';
import usersRouter from '~/routes/users.routes';
import databaseService from './services/database.services';
import { envConfig } from './constants/config';
import { defaultErrorHandler } from './middlewares/error.middlewares';
import { apiKeyMiddleware } from './middlewares/api_key.middlewares';
import apiKeyRouter from './routes/api_key.routes';
import mediasRouter from './routes/medias.routes';
import { initFolder } from './utils/file';
import path from 'path';
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir';
import staticRouter from './routes/static.routes';
const app = express();
const port = envConfig.port;

// Kết nối DB
databaseService.connect();

// app.use(apiKeyMiddleware);

// Chuyển sang kiểu json
app.use(express.json());

initFolder();
app.use('/static', staticRouter);
// Router
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use('/api-key', apiKeyRouter);

// Bắt lỗi tập trung
app.use(defaultErrorHandler);

// Khởi động server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
