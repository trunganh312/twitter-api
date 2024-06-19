import { ObjectId } from 'mongodb';
import { ApiKeyStatus } from '~/constants/enums';

interface ApiKeyType {
  _id?: ObjectId;
  key: string;
  requestLimit: number;
  requestsUsed: number;
  expirationDate: Date;
  status: ApiKeyStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
export class ApiKey {
  _id: ObjectId;
  key: string;
  requestLimit: number;
  requestsUsed: number;
  expirationDate: Date;
  status: ApiKeyStatus;
  createdAt?: Date;
  updatedAt?: Date;
  constructor({
    _id,
    key,
    requestLimit,
    requestsUsed,
    expirationDate,
    createdAt,
    status,
    updatedAt,
  }: ApiKeyType) {
    this._id = _id || new ObjectId();
    this.key = key;
    this.requestLimit = requestLimit;
    this.requestsUsed = requestsUsed;
    this.expirationDate = expirationDate;
    this.status = status;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}
