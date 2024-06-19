import { Router } from 'express';
import {
  changePasswordController,
  followUserController,
  forgotPasswordController,
  getMeController,
  getUserController,
  loginController,
  logoutController,
  oauthController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  unFollowUserController,
  updateMeController,
  verifyEmailController,
  verifyForgotPasswordController,
} from '~/controllers/users.controllers';
import { filterMiddleware } from '~/middlewares/common.middlewares';
import {
  accessTokenValidator,
  changePasswordValidator,
  followUserValidator,
  forgotPasswordTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator,
  verifyEmailValidator,
  verifyUserValidator,
} from '~/middlewares/user.middlewares';
import { UpdateMeReqBody } from '~/models/requests/User.requests';
import { wrapRequestHandler } from '~/utils/handlers';
const usersRouter = Router();

/**
 * Description: Register a new user
 * METHOD: POST
 * Path: /login
 * Body: { email: string, password: string}
 */

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController));
/**
 * Description: Register a new user
 * METHOD: POST
 * Path: /register
 * Body: {name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601}
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController));

/**
 * Description: Logout user
 * METHOD: POST
 * Path: /logout
 * Header: {Authorization: Bearer access_token}
 * body: {refresh_token: string}
 */
usersRouter.post(
  '/logout',
  accessTokenValidator,
  refreshTokenValidator,
  wrapRequestHandler(logoutController)
);

/**
 * Description:  Refresh token
 * METHOD: POST
 * Path: /refresh-token
 * body: {refresh_token: string}
 */
usersRouter.post(
  '/refresh-token',
  refreshTokenValidator,
  wrapRequestHandler(refreshTokenController)
);

/**
 * Description. Verify email when user client click on the link in email
 * Path: /verify-email
 * Method: POST
 * Body: { email_verify_token: string }
 */
usersRouter.post('/verify-email', verifyEmailValidator, wrapRequestHandler(verifyEmailController));

/**
 * Description. Resend verify email when user client click on the button resend email
 * Path: /resend-verify-email
 * Method: POST
 */
usersRouter.post(
  '/resend-verify-email',
  accessTokenValidator,
  wrapRequestHandler(resendVerifyEmailController)
);

/**
 * Description. When user forgot passwor, send email to server
 * Path: /forgot-password
 * Method: POST
 * Body: { email: string }
 */
usersRouter.post(
  '/forgot-password',
  forgotPasswordValidator,
  wrapRequestHandler(forgotPasswordController)
);

/**
 * Description: When the user clicks on the link, it takes the user to a page to enter a new password
 * Path: /verify-forgot-password
 * Method: POST
 * Body: { forgot_password_token: string }
 */
usersRouter.post(
  '/verify-forgot-password',
  forgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
);

/**
 * Description: Reset password
 * Path: /reset-password
 * Method: POST
 * Body: { password: string, confirm_password: string, forgot_password_token: string }
 */
usersRouter.post(
  '/reset-password',
  resetPasswordValidator,
  wrapRequestHandler(resetPasswordController)
);

/**
 * Description: Get profile information
 * Path: /me
 * Method: GET
 * * Header: {Authorization: Bearer access_token}
 */
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController));

/**
 * Description: Update profile information
 * Path: /me
 * Method: patch
 * * Header: {Authorization: Bearer access_token}
 * * body: UserSchema
 */
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifyUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo',
  ]),
  wrapRequestHandler(updateMeController)
);

/**
 * Description: Get user information
 * Path: /:username
 * Method: GET
 * Parameters: username
 */
usersRouter.get('/:username', wrapRequestHandler(getUserController));

/**
 * Description: Follow user
 * Path: /follow
 * Method: POST
 * body:{ followed_user_id: string }
 */
usersRouter.post(
  '/follow',
  accessTokenValidator,
  // verifyUserValidator,
  followUserValidator,
  wrapRequestHandler(followUserController)
);

/**
 * Description: Unfollow user
 * Path: /follow/:followed_user_id
 * Method: GET
 * params:{ followed_user_id: string }
 */
usersRouter.delete(
  '/follow/:followed_user_id',
  accessTokenValidator,
  // verifyUserValidator,
  followUserValidator,
  wrapRequestHandler(unFollowUserController)
);

/**
 * Description: change-password
 * Path: /change-password
 * Method: put
 * body:{ new_password: string, confirm_new_password: string ,old_password: string}
 */
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
);

/**
 * Description: Oauth google
 * Path: /change-password
 * Method: put
 * body:{ new_password: string, confirm_new_password: string ,old_password: string}
 */
usersRouter.get('/oauth/google', wrapRequestHandler(oauthController));

export default usersRouter;
