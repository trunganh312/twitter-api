import axios from 'axios';
import { ObjectId } from 'mongodb';
import { envConfig } from '~/constants/config';
import { TokenType, UserVerifyStatus } from '~/constants/enums';
import { USERS_MESSAGES } from '~/constants/messages';
import { RegisterRequestBody, UpdateMeReqBody } from '~/models/requests/User.requests';
import { Follower } from '~/models/schemas/Follower.schema';
import { RefreshToken } from '~/models/schemas/RefreshToken.schema';
import User from '~/models/schemas/User.schema';
import { generatePass, hashPassword } from '~/utils/crypto';
import { signToken, verifyToken } from '~/utils/jwt';
import databaseService from './database.services';
class UserService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        type_token: TokenType.AccessToken,
        verify,
      },
      privateKey: envConfig.jwtSecretAccessToken,
      options: {
        expiresIn: envConfig.accessTokenExpiresIn,
      },
    });
  }

  private signRefreshToken({
    user_id,
    exp,
    verify,
  }: {
    user_id: string;
    exp?: number;
    verify: UserVerifyStatus;
  }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          exp,
          verify,
        },
        privateKey: envConfig.jwtSecretRefreshToken,
      });
    }
    return signToken({
      payload: {
        user_id,
        type_token: TokenType.RefreshToken,
        verify,
      },
      privateKey: envConfig.jwtSecretRefreshToken,
      options: {
        expiresIn: envConfig.refreshTokenExpiresIn,
      },
    });
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify,
      },
      privateKey: envConfig.jwtSecretEmailVerifyToken,
      options: {
        expiresIn: envConfig.emailVerifyTokenExpiresIn,
      },
    });
  }
  async register(payload: RegisterRequestBody) {
    const user_id = new ObjectId();
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
    });
    await databaseService.users.insertOne(
      new User({
        ...payload,
        username: `user${user_id.toString()}`,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        _id: user_id,
        email_verify_token,
      })
    );
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
    });
    const { iat, exp } = await this.decodeRefreshToken(refresh_token);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    );
    return {
      access_token,
      refresh_token,
    };
  }

  async registerWithGoogle({
    password,
    email,
    avatar,
    name,
  }: {
    password: string;
    avatar: string;
    name: string;
    email: string;
  }) {
    const user_id = new ObjectId();
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
    });
    await databaseService.users.insertOne(
      new User({
        username: `user${user_id.toString()}`,
        date_of_birth: new Date(),
        password,
        _id: user_id,
        email_verify_token,
        avatar,
        email,
        name,
      })
    );
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
    });
    const { iat, exp } = await this.decodeRefreshToken(refresh_token);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    );
    return {
      access_token,
      refresh_token,
    };
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id,
      verify,
    });
    const { iat, exp } = await this.decodeRefreshToken(refresh_token);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    );
    return {
      access_token,
      refresh_token,
    };
  }

  async logout(token: string) {
    await databaseService.refreshTokens.findOneAndDelete({ token });
    return {
      message: 'Logout success',
    };
  }

  async refreshToken({
    user_id,
    token,
    exp,
    iat,
    verify,
  }: {
    user_id: string;
    token: string;
    exp: number;
    iat: number;
    verify: UserVerifyStatus;
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, exp, verify }),
      databaseService.refreshTokens.deleteOne({ token }),
    ]);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token,
        iat,
        exp,
      })
    );
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token,
    };
  }

  async checkEmailExist(email: string) {
    const result = await databaseService.users.findOne({ email: email });
    return Boolean(result);
  }

  private async signAccessTokenAndRefreshToken({
    user_id,
    verify,
  }: {
    user_id: string;
    verify: UserVerifyStatus;
  }) {
    return await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify }),
    ]);
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: envConfig.jwtSecretRefreshToken,
    });
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessTokenAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified,
            updated_at: '$$NOW',
          },
        },
      ]),
    ]);
    const [access_token, refresh_token] = token;
    const { iat, exp } = await this.decodeRefreshToken(refresh_token);

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    );
    return {
      access_token,
      refresh_token,
    };
  }

  async resendVerifEmail(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
    if (!user) {
      return {
        message: USERS_MESSAGES.USER_NOT_FOUND,
      };
    }
    if (user.verify === UserVerifyStatus.Verified) {
      return {
        message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE,
      };
    }
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified,
    });

    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token,
          updated_at: '$$NOW',
        },
      },
    ]);

    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS,
    };
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPassword({ user_id, verify });
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW',
        },
      },
    ]);
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD,
    };
  }

  async signForgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return await signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify,
      },
      privateKey: envConfig.jwtSecretForgotPasswordToken,
      options: {
        expiresIn: envConfig.forgotPasswordTokenExpiresIn,
      },
    });
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: '$$NOW',
        },
      },
    ]);
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS,
    };
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
        },
      }
    );
    if (!user) {
      return {
        message: USERS_MESSAGES.USER_NOT_FOUND,
      };
    }
    return user;
  }

  async updateMe({ user_id, payload }: { user_id: string; payload: UpdateMeReqBody }) {
    const _payload = payload.date_of_birth
      ? { ...payload, date_of_birth: new Date(payload.date_of_birth) }
      : payload;

    const result = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      [
        {
          $set: {
            ..._payload,
            updated_at: '$$NOW',
          },
        },
      ],
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
        },
      }
    );
    return result.value;
  }

  async getUser(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
        },
      }
    );
    if (!user) {
      return {
        message: USERS_MESSAGES.USER_NOT_FOUND,
      };
    }
    return {
      message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
      user,
    };
  }

  async follow({ user_id, followed_user_id }: { user_id: string; followed_user_id: string }) {
    const result = await databaseService.follower.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id),
    });
    if (result) {
      return {
        message: USERS_MESSAGES.FOLLOWED,
      };
    }
    await databaseService.follower.insertOne(
      new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id),
      })
    );
    return {
      message: USERS_MESSAGES.FOLLOW_SUCCESS,
    };
  }

  async unFollow({ user_id, followed_user_id }: { user_id: string; followed_user_id: string }) {
    const result = await databaseService.follower.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id),
    });
    if (!result) {
      return {
        message: USERS_MESSAGES.ALREADY_UNFOLLOWED,
      };
    }
    await databaseService.follower.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id),
    });
    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS,
    };
  }

  async changePassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          updated_at: '$$NOW',
        },
      },
    ]);
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS,
    };
  }

  async oauthUser(code: string) {
    const token = await this.getOauthGooleToken(code);
    console.log(token.access_token);
    const { email, name, picture, verified_email } = await this.getGoogleUser({
      access_token: token.access_token,
      id_token: token.id_token,
    });
    const user = await databaseService.users.findOne({ email });
    // Nếu mà email đã tồn tại thì cho login vào
    if (user) {
      const { access_token, refresh_token } = await this.login({
        user_id: user._id.toString(),
        verify: user.verify,
      });
      return {
        access_token,
        refresh_token,
        newUser: 0, // Trả về 0 là user cũ đã có trong db, trả về 1 thì là user chưa có trong db
        verifyUser: user.verify === UserVerifyStatus.Verified ? 1 : 0,
      };
    } else {
      // Nếu mà không tồn tại email thì đăng ký 1 tài khoản với email của gg và password random

      const password = generatePass();
      const { access_token, refresh_token } = await this.registerWithGoogle({
        password,
        email,
        name,
        avatar: picture,
      });
      return {
        access_token,
        refresh_token,
        newUser: 1, // Trả về 0 là user cũ đã có trong db, trả về 1 thì là user chưa có trong db
        verifyUser: UserVerifyStatus.Unverified,
      };
    }
  }

  // Truyền vào code sau đó call đến https://oauth2.googleapis.com/token để lấy {id_token, access_token}
  async getOauthGooleToken(code: string) {
    console.log(code);
    const body = {
      code,
      client_id: envConfig.googleClientId,
      client_secret: envConfig.googleClientSecret,
      redirect_uri: envConfig.googleRedirectUri,
      grant_type: 'authorization_code',
    };
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return data as {
      id_token: string;
      access_token: string;
    };
  }

  async getGoogleUser({ id_token, access_token }: { id_token: string; access_token: string }) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json',
      },
      headers: {
        Authorization: `Bearer ${id_token}`,
      },
    });
    return data as {
      email: string;
      name: string;
      picture: string;
      verified_email: boolean;
    };
  }
}

const userService = new UserService();
export default userService;
