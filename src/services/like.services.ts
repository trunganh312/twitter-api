import { ObjectId } from 'mongodb';
import { BOOKMARK_MESSAGES, LIKE_MESSAGES } from '~/constants/messages';
import { Bookmark } from '~/models/schemas/Bookmark.schema';
import databaseService from '~/services/database.services';

class LikeService {
  async likeTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.likes.findOneAndUpdate(
      {
        tweet_id: new ObjectId(tweet_id),
        user_id: new ObjectId(user_id),
      },
      {
        $setOnInsert: new Bookmark({
          tweet_id,
          user_id,
        }),
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );
    return result.value;
  }

  async unLikeTweet(user_id: string, tweet_id: string) {
    await databaseService.likes.findOneAndDelete({
      tweet_id: new ObjectId(tweet_id),
      user_id: new ObjectId(user_id),
    });
    return {
      message: LIKE_MESSAGES.UNLIKE_SUCCESSFULLY,
    };
  }
}

const likeService = new LikeService();

export default likeService;
