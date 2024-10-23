import { Router } from 'express';
import {
  createTweetController,
  getNewFeedsController,
  getTweetChildrenController,
  getTweetController,
} from '~/controllers/tweets.controller';
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator,
  tweetIdValidator,
} from '~/middlewares/tweet.middlewares';
import {
  accessTokenValidator,
  isUserLoggedInValidator,
  verifyUserValidator,
} from '~/middlewares/user.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const tweetRouter = Router();

/**
 * Description: Create Tweet
 * Path: /
 * Method: POST
 * Body: TweetRequestBody
 */

tweetRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
);

/**
 * Description: Get Tweet detail
 * Path: /:tweet_id
 * Method: GET
 * Header: {Authorization?: Bearer token}
 */

tweetRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
);

/**
 * Description: Get Tweet Children
 * Path: /:tweet_id/children
 * Method: GET
 * Header: {Authorization?: Bearer token}
 * Query: {limit: number, page: number, tweet_type: TweetType}
 */

tweetRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  paginationValidator,
  getTweetChildrenValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
);

/**
 * Description: Get new feeds
 * Path: /
 * Method: GET
 * Header: {Authorization?: Bearer token}
 * Query: {limit: number, page: number}
 */

tweetRouter.get(
  '/',
  paginationValidator,
  accessTokenValidator,
  verifyUserValidator,
  wrapRequestHandler(getNewFeedsController)
);

export default tweetRouter;
