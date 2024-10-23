import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { BOOKMARK_MESSAGES, LIKE_MESSAGES } from '~/constants/messages';
import { LikeReqBody, UnLikeReqParams } from '~/models/requests/Like.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import bookmarkService from '~/services/bookmark.services';
import likeService from '~/services/like.services';

export const likeTweetController = async (
  req: Request<ParamsDictionary, any, LikeReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.body;
  const result = await likeService.likeTweet(user_id, tweet_id);
  return res.json({
    message: LIKE_MESSAGES.LIKE_SUCCESSFULLY,
    result,
  });
};

export const unLikeTweetController = async (
  req: Request<UnLikeReqParams, any, any>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.params;
  const result = await likeService.unLikeTweet(user_id, tweet_id);
  return res.json(result);
};
