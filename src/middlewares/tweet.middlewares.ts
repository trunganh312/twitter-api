import { NextFunction, Request, Response } from 'express';
import { checkSchema } from 'express-validator';
import { isEmpty } from 'lodash';
import { ObjectId } from 'mongodb';
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums';
import HTTP_STATUS from '~/constants/httpStatus';
import { TWEETS_MESSAGES, USERS_MESSAGES } from '~/constants/messages';
import { Tweet } from '~/models/schemas/Tweet.schema';
import databaseService from '~/services/database.services';
import { ErrorWithStatus } from '~/utils/error';
import { wrapRequestHandler } from '~/utils/handlers';
import { enumToArrayNumber } from '~/utils/utils';
import { validate } from '~/utils/validation';

// interface TweetRequestBody {
//   type: TweetType;
//   audience: TweetAudience;
//   content: string;
//   parent_id: null | string; //  chỉ null khi tweet gốc, không thì là tweet_id cha dạng string
//   hashtags: string[]; // tên của hashtag dạng ['javascript', 'reactjs']
//   mentions: string[]; // user_id[]
//   medias: Media[];
// }

const tweetTypes = enumToArrayNumber(TweetType);
const tweetAudience = enumToArrayNumber(TweetAudience);
const mediaType = enumToArrayNumber(MediaType);

export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: TWEETS_MESSAGES.INVALID_TYPE,
      },
    },
    audience: {
      isIn: {
        options: [tweetAudience],
        errorMessage: TWEETS_MESSAGES.INVALID_AUDIENCE,
      },
    },
    content: {
      custom: {
        options: async (value, { req }) => {
          const type = req.body.type as TweetType;
          const hashtags = req.body.type as string[];
          const mentions = req.body.type as string[];
          // Nếu `type` là retweet thì `content` phải là `''`.
          if (TweetType.Retweet === type && value !== '') {
            throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_EMPTY_STRING);
          }
          // Nếu `type` là comment, quotetweet, tweet và không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng.
          if (
            [TweetType.Comment, TweetType.Tweet, TweetType.QuoteTweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mentions) &&
            value.trim() === ''
          ) {
            throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING);
          }
          return true;
        },
      },
    },
    parent_id: {
      custom: {
        options: async (value, { req }) => {
          const type = req.body.type as TweetType;
          // Nếu `type` là retweet, comment, quotetweet thì `parent_id` phải là `tweet_id` của tweet cha
          if (
            [TweetType.Comment, TweetType.Retweet, TweetType.QuoteTweet].includes(type) &&
            !ObjectId.isValid(value)
          ) {
            throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID);
          }
          // nếu `type` là tweet thì `parent_id` phải là `null`
          if (type === TweetType.Tweet && value !== null) {
            throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_NULL);
          }
          return true;
        },
      },
    },
    hashtags: {
      custom: {
        options: async (value, { req }) => {
          if (!value.every((item: any) => typeof item === 'string')) {
            throw new Error(TWEETS_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING);
          }
          return true;
        },
      },
    },
    mentions: {
      custom: {
        options: async (value, { req }) => {
          // `mentions` phải là mảng các string dạng id
          if (!value.every((item: any) => typeof item === 'string' && ObjectId.isValid(item))) {
            throw new Error(TWEETS_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID);
          }
          return true;
        },
      },
    },
    medias: {
      custom: {
        options: async (value, { req }) => {
          // `medias` phải là mảng các media object
          if (
            !value.every(
              (item: any) => typeof item.url === 'string' || mediaType.includes(item.type)
            )
          ) {
            throw new Error(TWEETS_MESSAGES.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT);
          }
          return true;
        },
      },
    },
  })
);

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: TWEETS_MESSAGES.INVALID_TWEET_ID,
                status: HTTP_STATUS.BAD_REQUEST,
              });
            }
            const tweet = (
              await databaseService.tweets
                .aggregate<Tweet>([
                  {
                    $match: {
                      _id: new ObjectId(value),
                    },
                  },
                  {
                    $lookup: {
                      from: 'hashtags',
                      localField: 'hashtags',
                      foreignField: '_id',
                      as: 'hashtags',
                    },
                  },
                  {
                    $lookup: {
                      from: 'users',
                      localField: 'mentions',
                      foreignField: '_id',
                      as: 'mentions',
                    },
                  },
                  {
                    $addFields: {
                      mentions: {
                        $map: {
                          input: '$mentions',
                          as: 'mention',
                          in: {
                            _id: '$$mention._id',
                            name: '$$mention.name',
                            username: '$$mention.username',
                            email: '$$mention.email',
                          },
                        },
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'bookmarks',
                      localField: '_id',
                      foreignField: 'tweet_id',
                      as: 'bookmarks',
                    },
                  },
                  {
                    $lookup: {
                      from: 'likes',
                      localField: '_id',
                      foreignField: 'tweet_id',
                      as: 'likes',
                    },
                  },
                  {
                    $lookup: {
                      from: 'tweets',
                      localField: '_id',
                      foreignField: 'parent_id',
                      as: 'tweet_children',
                    },
                  },
                  {
                    $addFields: {
                      bookmarks: {
                        $size: '$bookmarks',
                      },
                      likes: {
                        $size: '$likes',
                      },
                      retweet_count: {
                        $size: {
                          $filter: {
                            input: '$tweet_children',
                            as: 'item',
                            cond: {
                              $eq: ['$$item.type', TweetType.Retweet],
                            },
                          },
                        },
                      },
                      comment_count: {
                        $size: {
                          $filter: {
                            input: '$tweet_children',
                            as: 'item',
                            cond: {
                              $eq: ['$$item.type', TweetType.Comment],
                            },
                          },
                        },
                      },
                      quote_count: {
                        $size: {
                          $filter: {
                            input: '$tweet_children',
                            as: 'item',
                            cond: {
                              $eq: ['$$item.type', TweetType.QuoteTweet],
                            },
                          },
                        },
                      },
                    },
                  },
                  {
                    $project: {
                      tweet_children: 0,
                    },
                  },
                ])
                .toArray()
            )[0];

            if (!tweet) {
              throw new ErrorWithStatus({
                message: TWEETS_MESSAGES.TWEET_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
              });
            }
            req.tweet = tweet;
            return true;
          },
        },
      },
    },
    ['body', 'params']
  )
);

// Muốn sử dụng async await trong handler trong express thì phải có trycath
// Nếu không dùng trycath thì phải dùng wrappRequestHandler
export const audienceValidator = wrapRequestHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const tweet = req.tweet as Tweet;
    if (tweet.audience === TweetAudience.TwitterCircle) {
      // Kiểm tra xem người xem tweet này đã đăng nhập hay chưa
      if (!req.decoded_authorization) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED,
        });
      }
      // Kiểm tra xem tài khoản của tác giả có bị khóa hay bị xóa
      const author = await databaseService.users.findOne({
        _id: tweet.user_id,
      });
      if (!author || author.verify === UserVerifyStatus.Banned) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND,
        });
      }

      // Kiểm tra người xem tweet này có nằm trong Twitter Circle của tác giả hay không
      const { user_id } = req.decoded_authorization;
      const isInTwitterCircle = author.twitter_circle?.some((user_circle_id) =>
        user_circle_id.equals(user_id)
      );
      if (!isInTwitterCircle || !author._id.equals(user_id)) {
        throw new ErrorWithStatus({
          message: TWEETS_MESSAGES.TWEET_IS_NOT_PUBLIC,
          status: HTTP_STATUS.FORBIDDEN,
        });
      }
    }
    next();
  }
);

export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: TWEETS_MESSAGES.INVALID_TYPE,
        },
      },
    },
    ['query']
  )
);

export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: async (value, { req }) => {
            const num = Number(value);
            if (num > 100 || num < 1) {
              throw new Error('1 <= limit <= 100');
            }
            return true;
          },
        },
      },
      page: {
        isNumeric: true,
        custom: {
          options: async (value, { req }) => {
            const num = Number(value);
            if (num < 1) {
              throw new Error('page >= 1');
            }
            return true;
          },
        },
      },
    },
    ['query']
  )
);
