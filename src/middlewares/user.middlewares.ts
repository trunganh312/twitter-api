import { Request, Response, NextFunction } from 'express';
import { ParamSchema, checkSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { capitalize } from 'lodash';
import { ObjectId } from 'mongodb';
import { envConfig } from '~/constants/config';
import { UserVerifyStatus } from '~/constants/enums';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { REGEX_USERNAME } from '~/constants/regex';
import { TokenPayload } from '~/models/requests/User.requests';
import databaseService from '~/services/database.services';
import userService from '~/services/users.services';
import { hashPassword } from '~/utils/crypto';
import { ErrorWithStatus } from '~/utils/error';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validation';

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED,
  },
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING,
  },
  isLength: {
    options: {
      min: 6,
      max: 50,
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG,
  },
};

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED,
  },
  isString: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING,
  },
  isLength: {
    options: {
      min: 6,
      max: 50,
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG,
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD);
      }
      return true;
    },
  },
};

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED,
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING,
  },
  trim: true,

  isLength: {
    options: {
      min: 1,
      max: 100,
    },
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100,
  },
};

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true,
    },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601,
  },
};

const forgotPasswordTokenSchema: ParamSchema = {
  custom: {
    options: async (value, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED,
        });
      }
      try {
        const [decoded_forgot_password_token, forgot_password_token] = await Promise.all([
          await verifyToken({
            token: value,
            secretOrPublicKey: envConfig.jwtSecretForgotPasswordToken,
          }),
          await databaseService.users.findOne({ forgot_password_token: value }),
        ]);
        if (!forgot_password_token) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.INVALID_FORGOT_PASSWORD_TOKEN,
            status: HTTP_STATUS.UNAUTHORIZED,
          });
        }
        req.decoded_forgot_password_token = decoded_forgot_password_token;
      } catch (error) {
        throw new ErrorWithStatus({
          message: capitalize((error as JsonWebTokenError).message),
          status: HTTP_STATUS.UNAUTHORIZED,
        });
      }

      return true;
    },
  },
};

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_STRING,
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400,
    },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH,
  },
};
const userIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.INVALID_USER_ID,
          status: HTTP_STATUS.NOT_FOUND,
        });
      }
      const followed_user = await databaseService.users.findOne({
        _id: new ObjectId(value),
      });

      if (followed_user === null) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND,
        });
      }
    },
  },
};

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID,
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password),
            });
            if (user === null) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT,
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            req.user = user;
            return true;
          },
        },
      },
      password: passwordSchema,
    },
    ['body']
  )
);

export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID,
        },
        trim: true,
        custom: {
          options: async (value) => {
            const isExistEmail = await userService.checkEmailExist(value);
            if (isExistEmail) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            return true;
          },
        },
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema,
    },
    ['body']
  )
);
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
        },
        custom: {
          options: async (value, { req }) => {
            const access_token = value.split(' ')[1];
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            const decoded_authorization = await verifyToken({
              token: access_token,
              secretOrPublicKey: envConfig.jwtSecretAccessToken,
            });
            req.decoded_authorization = decoded_authorization;
            return true;
          },
        },
      },
    },
    ['headers']
  )
);

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
        },
        custom: {
          options: async (value, { req }) => {
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                await verifyToken({
                  token: value,
                  secretOrPublicKey: envConfig.jwtSecretRefreshToken,
                }),
                await databaseService.refreshTokens.findOne({ token: value }),
              ]);
              if (!refresh_token) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED,
                });
              }
              req.decoded_refresh_token = decoded_refresh_token;
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            return true;
          },
        },
      },
    },
    ['body']
  )
);

export const verifyEmailValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
        },
        custom: {
          options: async (value, { req }) => {
            try {
              const [decoded_email_verify_token, email_verify_token] = await Promise.all([
                await verifyToken({
                  token: value,
                  secretOrPublicKey: envConfig.jwtSecretEmailVerifyToken,
                }),
                await databaseService.users.findOne({ email_verify_token: value }),
              ]);
              if (!email_verify_token) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE,
                  status: HTTP_STATUS.UNAUTHORIZED,
                });
              }
              req.decoded_email_verify_token = decoded_email_verify_token;
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            return true;
          },
        },
      },
    },
    ['body']
  )
);

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID,
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value });
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            req.user = user;
            return true;
          },
        },
      },
    },
    ['body']
  )
);

export const forgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema,
    },
    ['body']
  )
);

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgotPasswordTokenSchema,
    },
    ['body']
  )
);

export const verifyUserValidator = async (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload;
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_VERIFIED,
        status: HTTP_STATUS.UNAUTHORIZED,
      })
    );
  }
  next();
};

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        notEmpty: undefined,
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true,
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.BIO_MUST_BE_STRING,
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200,
          },
          errorMessage: USERS_MESSAGES.BIO_LENGTH,
        },
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_STRING,
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200,
          },
          errorMessage: USERS_MESSAGES.LOCATION_LENGTH,
        },
      },
      website: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_STRING,
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200,
          },
          errorMessage: USERS_MESSAGES.WEBSITE_LENGTH,
        },
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_STRING,
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!REGEX_USERNAME.test(value)) {
              throw Error(USERS_MESSAGES.USERNAME_INVALID);
            }
            const user = await databaseService.users.findOne({ username: value });
            // Nếu đã tồn tại username này trong db
            // thì chúng ta không cho phép update
            if (user) {
              throw Error(USERS_MESSAGES.USERNAME_EXISTED);
            }
          },
        },
      },
      avatar: imageSchema,
      cover_photo: imageSchema,
    },
    ['body']
  )
);

export const followUserValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema,
    },
    ['body', 'params']
  )
);

export const changePasswordValidator = validate(
  checkSchema(
    {
      new_password: passwordSchema,
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value: string, { req }) => {
            const user = await databaseService.users.findOne({
              _id: new ObjectId(req.decoded_authorization.user_id),
            });
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            if (hashPassword(value) !== user.password) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.OLD_PASSWORD_NOT_MATCH,
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
          },
        },
      },
      confirm_new_password: {
        ...confirmPasswordSchema,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.new_password) {
              throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD);
            }
            return true;
          },
        },
      },
    },
    ['body']
  )
);
