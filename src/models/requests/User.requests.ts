import { ParamsDictionary } from 'express-serve-static-core';
import { JwtPayload } from 'jsonwebtoken';
import { TokenType, UserVerifyStatus } from '~/constants/enums';

export interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  date_of_birth: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface LogoutRequestBody {
  refresh_token: string;
}

export interface RefreshTokenReqBody {
  refresh_token: string;
}

export interface EmailVerifyTokenReqBody {
  email_verify_token: string;
}

export interface TokenPayload extends JwtPayload {
  user_id: string;
  token_type: TokenType;
  verify: UserVerifyStatus;
  exp: number;
  iat: number;
}

export interface ForgotPasswordReqBody {
  email: string;
}

export interface VerifyForgotPasswordTokenReqBody {
  forgot_password_token: string;
}

export interface ResetPasswordReqBody {
  forgot_password_token: string;
  password: string;
  confirm_password: string;
}

export interface UpdateMeReqBody {
  name?: string;
  date_of_birth?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  cover_photo?: string;
}

export interface GetProfileReqParams extends ParamsDictionary {
  username: string;
}

export interface FollowUserReqBody {
  followed_user_id: string;
}

export interface unFollowUserReqParams extends ParamsDictionary {
  followed_user_id: string;
}

export interface ChangePasswordReqBody {
  new_password: string;
  old_password: string;
  confirm_new_password: string;
}
