import { ObjectId } from 'mongodb';
import { BOOKMARK_MESSAGES } from '~/constants/messages';
import { Bookmark } from '~/models/schemas/Bookmark.schema';
import databaseService from '~/services/database.services';

class BookMarkService {
  async bookMarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
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

  async unBookMarkTweet(user_id: string, tweet_id: string) {
    await databaseService.bookmarks.findOneAndDelete({
      tweet_id: new ObjectId(tweet_id),
      user_id: new ObjectId(user_id),
    });
    return {
      message: BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESSFULLY,
    };
  }
}

const bookmarkService = new BookMarkService();

export default bookmarkService;
