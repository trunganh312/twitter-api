import { MongoClient, Db, Collection } from 'mongodb';
import { config } from 'dotenv';
import User from '~/models/schemas/User.schema';
import { envConfig } from '~/constants/config';
import { RefreshToken } from '~/models/schemas/RefreshToken.schema';
import { ApiKey } from '~/models/schemas/ApiKey.schema';
import { Follower } from '~/models/schemas/Follower.schema';
import { VideoStatus } from '~/models/schemas/VideoStatus.schema';
import { Tweet } from '~/models/schemas/Tweet.schema';
import { Hashtag } from '~/models/requests/Hashtag.requests';
import { Bookmark } from '~/models/schemas/Bookmark.schema';
import { Like } from '~/models/schemas/Like.schema';
import Conversation from '~/models/schemas/Conversations.schema';
config();

const uri = `mongodb+srv://${envConfig.dbUsername}:${envConfig.dbPassword}@twitter.sr2jkfm.mongodb.net/?retryWrites=true&w=majority&appName=Twitter`;
class DatabaseService {
  private client: MongoClient;
  private db: Db;
  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(envConfig.dbName);
  }
  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 });
      console.log('Pinged your deployment. You successfully connected to MongoDB!');
    } catch (error) {
      console.error(error);
    }
  }

  get users(): Collection<User> {
    return this.db.collection(envConfig.dbUsersCollection);
  }

  async indexUsers() {
    const exists = await this.users.indexExists(['email_1_password_1', 'email_1', 'username_1']);
    if (!exists) {
      this.users.createIndex({ email: 1, password: 1 });
      this.users.createIndex({ email: 1 }, { unique: true });
      this.users.createIndex({ username: 1 }, { unique: true });
      console.log('Indexed users created');
    }
  }

  async indexRefreshTokens() {
    const exists = await this.refreshTokens.indexExists(['token_1', 'exp_1']);
    if (!exists) {
      this.refreshTokens.createIndex({ token: 1 });
      this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 });
      console.log('Indexed refresh tokens created');
    }
  }

  async indexVideoStatus() {
    const exists = await this.videoStatus.indexExists(['name_1']);
    if (!exists) {
      this.videoStatus.createIndex({ name: 1 });
      console.log('Indexed video status created');
    }
  }

  async indexFollowers() {
    const exists = await this.follower.indexExists(['user_id_1_followed_user_id_1']);
    if (!exists) {
      this.follower.createIndex({ user_id: 1, followed_user_id: 1 });
      console.log('Indexed followers created');
    }
  }

  async indexTweets() {
    const exists = await this.tweets.indexExists(['content_text'])
    if (!exists) {
      this.tweets.createIndex({ content: 'text' }, { default_language: 'none' })
    }
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.dbRefreshTokensCollection);
  }

  get follower(): Collection<Follower> {
    return this.db.collection(envConfig.dbFollowersCollection);
  }

  get apiKeys(): Collection<ApiKey> {
    return this.db.collection(envConfig.dbApiKeyCollection);
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(envConfig.dbVideoStatusCollection);
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(envConfig.dbTweetsCollection);
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(envConfig.dbHashtagsCollection);
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(envConfig.dbBookmarksCollection);
  }

  get likes(): Collection<Like> {
    return this.db.collection(envConfig.dbLikesCollection);
  }
  get conversations(): Collection<Conversation> {
    return this.db.collection(envConfig.dbConversationCollection)
  }
}

const databaseService = new DatabaseService();
export default databaseService;
