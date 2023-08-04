import User from '~/models/schemas/User.schema';
import databaseService from './database.services';
import { RegisterRequestBody } from '~/models/requests/User.requests';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType } from '~/constants/enums';
class UserService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        type_token: TokenType.AccessToken,
      },
    });
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        type_token: TokenType.RefreshToken,
      },
    });
  }
  async register(payload: RegisterRequestBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
      })
    );
    const user_id = result.insertedId.toString();
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id),
    ]);
    return {
      access_token,
      refresh_token,
    };
  }

  async checkEmailExist(email: string) {
    const result = await databaseService.users.findOne({ email });
    return Boolean(result);
  }
}

const userService = new UserService();
export default userService;
