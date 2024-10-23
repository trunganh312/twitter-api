import { ObjectId } from 'mongodb';
import { TweetType } from '~/constants/enums';
import { SearchQuery } from '~/models/requests/Search.requests';
import databaseService from '~/services/database.services';

class SearchService {
  async search({
    content,
    user_id,
    limit,
    page,
  }: {
    content: string;
    user_id: string;
    limit: number;
    page: number;
  }) {
    const [tweets, total] = await Promise.all([
      await databaseService.tweets
        .aggregate([
          {
            $match:
              /**
               * query: The query in MQL.
               */
              {
                $text: {
                  $search: content,
                },
              },
          },
          {
            $lookup:
              /**
               * from: The target collection.
               * localField: The local join field.
               * foreignField: The target join field.
               * as: The name for the results.
               * pipeline: Optional pipeline to run on the foreign collection.
               * let: Optional variables to use in the pipeline field stages.
               */
              {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
              },
          },
          {
            $unwind:
              /**
               * path: Path to the array field.
               * includeArrayIndex: Optional name for index.
               * preserveNullAndEmptyArrays: Optional
               *   toggle to unwind null and empty values.
               */
              {
                path: '$user',
              },
          },
          {
            $match:
              /**
               * query: The query in MQL.
               */
              {
                $or: [
                  {
                    audience: 0,
                  },
                  {
                    $and: [
                      {
                        audience: 1,
                      },
                      {
                        'user.twitter_circle': {
                          $in: [new ObjectId(user_id)],
                        },
                      },
                    ],
                  },
                ],
              },
          },
          {
            $lookup:
              /**
               * from: The target collection.
               * localField: The local join field.
               * foreignField: The target join field.
               * as: The name for the results.
               * pipeline: Optional pipeline to run on the foreign collection.
               * let: Optional variables to use in the pipeline field stages.
               */
              {
                from: 'hashtags',
                localField: 'hashtags',
                foreignField: '_id',
                as: 'hashtags',
              },
          },
          {
            $lookup:
              /**
               * from: The target collection.
               * localField: The local join field.
               * foreignField: The target join field.
               * as: The name for the results.
               * pipeline: Optional pipeline to run on the foreign collection.
               * let: Optional variables to use in the pipeline field stages.
               */
              {
                from: 'users',
                localField: 'mentions',
                foreignField: '_id',
                as: 'mentions',
              },
          },
          {
            $addFields:
              /**
               * specifications: The fields to
               *   include or exclude.
               */
              {
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
            $lookup:
              /**
               * from: The target collection.
               * localField: The local join field.
               * foreignField: The target join field.
               * as: The name for the results.
               * pipeline: Optional pipeline to run on the foreign collection.
               * let: Optional variables to use in the pipeline field stages.
               */
              {
                from: 'bookmarks',
                localField: '_id',
                foreignField: 'tweet_id',
                as: 'bookmarks',
              },
          },
          {
            $lookup:
              /**
               * from: The target collection.
               * localField: The local join field.
               * foreignField: The target join field.
               * as: The name for the results.
               * pipeline: Optional pipeline to run on the foreign collection.
               * let: Optional variables to use in the pipeline field stages.
               */
              {
                from: 'likes',
                localField: '_id',
                foreignField: 'tweet_id',
                as: 'likes',
              },
          },
          {
            $lookup:
              /**
               * from: The target collection.
               * localField: The local join field.
               * foreignField: The target join field.
               * as: The name for the results.
               * pipeline: Optional pipeline to run on the foreign collection.
               * let: Optional variables to use in the pipeline field stages.
               */
              {
                from: 'tweets',
                localField: '_id',
                foreignField: 'parent_id',
                as: 'tweet_children',
              },
          },
          {
            $addFields:
              /**
               * newField: The new field name.
               * expression: The new field expression.
               */
              {
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
                views: {
                  $add: ['$user_views', '$guest_views'],
                },
              },
          },
          {
            $project:
              /**
               * specifications: The fields to
               *   include or exclude.
               */
              {
                tweet_children: 0,
                user: {
                  password: 0,
                  forgot_password_token: 0,
                  email_verify_token: 0,
                  date_of_birth: 0,
                },
              },
          },
          {
            $skip: limit * (page - 1),
          },
          {
            $limit: limit,
          },
        ])
        .toArray(),
      await databaseService.tweets
        .aggregate([
          {
            $match:
              /**
               * query: The query in MQL.
               */
              {
                $text: {
                  $search: content,
                },
              },
          },
          {
            $lookup:
              /**
               * from: The target collection.
               * localField: The local join field.
               * foreignField: The target join field.
               * as: The name for the results.
               * pipeline: Optional pipeline to run on the foreign collection.
               * let: Optional variables to use in the pipeline field stages.
               */
              {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
              },
          },
          {
            $unwind:
              /**
               * path: Path to the array field.
               * includeArrayIndex: Optional name for index.
               * preserveNullAndEmptyArrays: Optional
               *   toggle to unwind null and empty values.
               */
              {
                path: '$user',
              },
          },
          {
            $match:
              /**
               * query: The query in MQL.
               */
              {
                $or: [
                  {
                    audience: 0,
                  },
                  {
                    $and: [
                      {
                        audience: 1,
                      },
                      {
                        'user.twitter_circle': {
                          $in: [new ObjectId(user_id)],
                        },
                      },
                    ],
                  },
                ],
              },
          },
          {
            $count: 'total',
          },
        ])
        .toArray(),
    ]);
    const tweet_id = tweets.map((tweet) => tweet._id as ObjectId);
    const inc = { user_views: 1 };
    const date = new Date();
    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweet_id,
        },
      },
      {
        $inc: inc,
        $set: {
          updated_at: date,
        },
      }
    ),
      tweets.forEach((tweet) => {
        tweet.updated_at = date;
        tweet.user_views += 1;
      });
    return {
      tweets,
      total: total[0].total,
    };
  }
}

const searchService = new SearchService();

export default searchService;
