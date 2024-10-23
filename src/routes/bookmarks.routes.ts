import { Router } from 'express';
import {
  bookMarkTweetController,
  unBookMarkTweetController,
} from '~/controllers/bookmark.controller';
import { createTweetController } from '~/controllers/tweets.controller';
import {
  bookMarkTweetValidator,
  unBookMarkTweetValidator,
} from '~/middlewares/bookmarks.middlewares';
import { createTweetValidator } from '~/middlewares/tweet.middlewares';
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/user.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const bookmarkRouter = Router();

/**
 * Description: Bookmark tweet
 * Path: /
 * Method: POST
 * Body: BookmarkReqBody
 */

bookmarkRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  bookMarkTweetValidator,
  wrapRequestHandler(bookMarkTweetController)
);

/**
 * Description: Un Bookmark tweet
 * Path: /tweets/:tweetId
 * Method: POST
 * Body: UnBookmarkReqBody
 */

bookmarkRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifyUserValidator,
  unBookMarkTweetValidator,
  wrapRequestHandler(unBookMarkTweetController)
);

export default bookmarkRouter;
