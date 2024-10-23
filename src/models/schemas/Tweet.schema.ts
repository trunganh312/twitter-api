import { ObjectId } from 'mongodb';
import { Media, TweetAudience, TweetType } from '~/constants/enums';

interface TweetContructor {
  _id?: ObjectId;
  user_id: ObjectId;
  type: TweetType;
  audience: TweetAudience;
  content: string;
  parent_id: null | string; //  chỉ null khi tweet gốc
  hashtags: ObjectId[];
  mentions: string[];
  medias: Media[];
  guest_views?: number;
  user_views?: number;
  created_at?: Date;
  updated_at?: Date;
}

export class Tweet {
  _id?: ObjectId;
  user_id: ObjectId;
  type: TweetType;
  audience: TweetAudience;
  content: string;
  parent_id: null | ObjectId; //  chỉ null khi tweet gốc
  hashtags: ObjectId[];
  mentions: ObjectId[];
  medias: Media[];
  guest_views?: number;
  user_views?: number;
  created_at?: Date;
  updated_at?: Date;
  constructor({
    audience,
    content,
    guest_views,
    hashtags,
    medias,
    mentions,
    parent_id,
    type,
    user_id,
    user_views,
    _id,
    created_at,
    updated_at,
  }: TweetContructor) {
    this._id = _id;
    this.audience = audience;
    this.content = content;
    this.guest_views = guest_views || 0;
    this.hashtags = hashtags;
    this.medias = medias;
    this.mentions = mentions.map((mention) => new ObjectId(mention));
    this.parent_id = parent_id ? new ObjectId(parent_id) : null;
    this.type = type;
    this.user_id = user_id;
    this.user_views = user_views || 0;
    this.created_at = created_at || new Date();
    this.updated_at = updated_at || new Date();
  }
}
