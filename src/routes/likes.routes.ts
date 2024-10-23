import { Router } from 'express';
import { likeTweetController, unLikeTweetController } from '~/controllers/like.controller';
import { tweetIdValidator } from '~/middlewares/tweet.middlewares';
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/user.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const likeRouter = Router();

/**
 * Description: like tweet
 * Path: /
 * Method: POST
 * Body: likeReqBody
 */

likeRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapRequestHandler(likeTweetController)
);

/**
 * Description: Un like tweet
 * Path: /tweets/:tweetId
 * Method: POST
 * Body: UnlikeReqBody
 */

likeRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unLikeTweetController)
);

export default likeRouter;
