import { ObjectId } from 'mongodb';

interface LikeType {
  _id?: ObjectId;
  user_id: string;
  tweet_id: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Like {
  _id?: ObjectId;
  user_id: ObjectId;
  tweet_id: ObjectId;
  created_at?: Date;
  updated_at?: Date;
  constructor({ _id, created_at, tweet_id, user_id, updated_at }: LikeType) {
    this._id = _id || new ObjectId();
    this.tweet_id = new ObjectId(tweet_id);
    this.user_id = new ObjectId(user_id);
    this.created_at = created_at || new Date();
    this.updated_at = updated_at || new Date();
  }
}
