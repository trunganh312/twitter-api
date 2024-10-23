import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { BOOKMARK_MESSAGES } from '~/constants/messages';
import { BookmarkReqBody, UnBookmarkReqParams } from '~/models/requests/Bookmark.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import bookmarkService from '~/services/bookmark.services';

export const bookMarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.body;
  const result = await bookmarkService.bookMarkTweet(user_id, tweet_id);
  return res.json({
    message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESSFULLY,
    result,
  });
};

export const unBookMarkTweetController = async (
  req: Request<UnBookmarkReqParams, any, any>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.params;
  const result = await bookmarkService.unBookMarkTweet(user_id, tweet_id);
  return res.json(result);
};
