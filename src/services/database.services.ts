import { MongoClient, Db, Collection } from 'mongodb';
import { config } from 'dotenv';
import User from '~/models/schemas/User.schema';
import { envConfig } from '~/constants/config';
import { RefreshToken } from '~/models/schemas/RefreshToken.schema';
import { ApiKey } from '~/models/schemas/ApiKey.schema';
import { Follower } from '~/models/schemas/Follower.schema';
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

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.dbRefreshTokensCollection);
  }

  get follower(): Collection<Follower> {
    return this.db.collection(envConfig.dbFollowersCollection);
  }

  get apiKeys(): Collection<ApiKey> {
    return this.db.collection(envConfig.dbApiKeyCollection);
  }
}

const databaseService = new DatabaseService();
export default databaseService;
