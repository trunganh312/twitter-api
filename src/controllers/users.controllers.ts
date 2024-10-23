import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { envConfig } from '~/constants/config';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import {
  ChangePasswordReqBody,
  EmailVerifyTokenReqBody,
  FollowUserReqBody,
  ForgotPasswordReqBody,
  GetProfileReqParams,
  LogoutRequestBody,
  RefreshTokenReqBody,
  RegisterRequestBody,
  ResetPasswordReqBody,
  TokenPayload,
  UpdateMeReqBody,
  VerifyForgotPasswordTokenReqBody,
  unFollowUserReqParams,
} from '~/models/requests/User.requests';
import User from '~/models/schemas/User.schema';
import userService from '~/services/user.services';
export const loginController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { _id, verify } = req.user as User;
  const result = await userService.login({ user_id: _id?.toString() as string, verify });
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result,
  });
};
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res: Response
) => {
  const result = await userService.register(req.body);
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result,
  });
};

export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutRequestBody>,
  res: Response
) => {
  const { refresh_token } = req.body;
  const result = await userService.logout(refresh_token);
  return res.json(result);
};

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body;
  const { user_id, exp, iat, verify } = req.decoded_refresh_token as TokenPayload;
  const result = await userService.refreshToken({
    token: refresh_token,
    user_id: user_id,
    exp,
    iat,
    verify,
  });
  return res.json(result);
};

export const verifyEmailController = async (
  req: Request<ParamsDictionary, any, EmailVerifyTokenReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload;
  const result = await userService.verifyEmail(user_id);
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result,
  });
};

export const resendVerifyEmailController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;

  const result = await userService.resendVerifEmail(user_id);
  return res.json(result);
};

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  const { _id, verify } = req.user as User;
  const result = await userService.forgotPassword({ user_id: _id?.toString() as string, verify });
  return res.json(result);
};

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordTokenReqBody>,
  res: Response
) => {
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS,
  });
};

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload;
  const { password } = req.body;
  const result = await userService.resetPassword({ user_id, password });
  return res.json(result);
};

export const getMeController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const user = await userService.getMe(user_id);
  return res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    user,
  });
};

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const user = await userService.updateMe({ user_id, payload: req.body });
  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    user,
  });
};

export const getUserController = async (
  req: Request<GetProfileReqParams, any, any>,
  res: Response
) => {
  const { username } = req.params;
  const user = await userService.getUser(username);
  return res.json(user);
};

export const followUserController = async (
  req: Request<ParamsDictionary, any, FollowUserReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { followed_user_id } = req.body;
  if (user_id === followed_user_id) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: USERS_MESSAGES.DONT_FOLLOW_YOURSELF,
    });
  }
  const result = await userService.follow({ followed_user_id, user_id });
  return res.json(result);
};

export const unFollowUserController = async (
  req: Request<unFollowUserReqParams, any, any>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { followed_user_id } = req.params;
  if (user_id === followed_user_id) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: USERS_MESSAGES.DONT_UNFOLLOW_YOURSELF,
    });
  }
  const result = await userService.unFollow({ followed_user_id, user_id });
  return res.json(result);
};

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { new_password } = req.body;
  const result = await userService.changePassword({ user_id: user_id, password: new_password });
  return res.json(result);
};

export const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query;
  const { access_token, newUser, refresh_token, verifyUser } = await userService.oauthUser(
    code as string
  );
  const url = `${envConfig.clientRedirectCallback}?access_token=${access_token}&refresh_token=${refresh_token}&verify_user=${verifyUser}&new_user=${newUser}`;
  return res.redirect(url);
};
