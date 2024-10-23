import { Router } from 'express';
import {
  getVideoStatusController,
  uploadImageController,
  uploadVideoController,
  uploadVideoHlsController,
} from '~/controllers/medias.controllers';
import { accessTokenValidator } from '~/middlewares/user.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const mediasRouter = Router();

mediasRouter.post('/upload-image', accessTokenValidator, wrapRequestHandler(uploadImageController));
mediasRouter.post('/upload-video', accessTokenValidator, wrapRequestHandler(uploadVideoController));
mediasRouter.post(
  '/upload-video-hls',
  accessTokenValidator,
  wrapRequestHandler(uploadVideoHlsController)
);
mediasRouter.get(
  '/video-status/:name',
  accessTokenValidator,
  wrapRequestHandler(getVideoStatusController)
);

export default mediasRouter;
