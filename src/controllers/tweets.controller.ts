import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { TWEETS_MESSAGES } from '~/constants/messages';
import { Pagination, TweetQuery, TweetRequestBody } from '~/models/requests/Tweet.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import tweetService from '~/services/tweet.services';
export const createTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response
) => {
  console.log(req.body);
  const { user_id } = req.decoded_authorization as TokenPayload;
  const result = await tweetService.createTweet(user_id, req.body);
  return res.json({
    message: TWEETS_MESSAGES.CREATE_TWEET_SUCCESS,
    result,
  });
};

export const getTweetController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const result = await tweetService.increaseView(
    req.params.tweet_id,
    req.decoded_authorization?.user_id
  );
  const tweet = {
    ...req.tweet,
    user_views: result?.user_views,
    guest_views: result?.guest_views,
    updated_at: result?.updated_at,
  };
  return res.json({
    message: 'Get tweet successfully',
    tweet,
  });
};

export const getTweetChildrenController = async (
  req: Request<ParamsDictionary, any, any, TweetQuery>,
  res: Response
) => {
  const tweet_type = Number(req.query.tweet_type as string);
  const page = Number(req.query.page as string);
  const limit = Number(req.query.limit as string);
  const user_id = req.decoded_authorization?.user_id;
  const result = await tweetService.getTweetChildren({
    tweet_id: req.params.tweet_id,
    limit,
    page,
    tweet_type,
    user_id,
  });
  return res.json({
    message: 'Get tweet children successfully',
    result: {
      tweets: result.tweets,
      limit,
      page,
      tweet_type,
      total_pages: Math.ceil(result.total / limit),
    },
  });
};

export const getNewFeedsController = async (
  req: Request<ParamsDictionary, any, any, Pagination>,
  res: Response
) => {
  const user_id = req.decoded_authorization?.user_id as string;
  const { limit, page } = req.query;
  const result = await tweetService.getNewFeeds({
    user_id,
    limit: Number(limit),
    page: Number(page),
  });
  return res.json({
    message: 'Get new feeds successfully',
    result: {
      tweets: result.tweets,
      limit: Number(limit),
      page: Number(page),
      total_page: Math.ceil(result.total / Number(limit)),
    },
  });
};
