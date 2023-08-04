import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import userService from '~/services/users.services';
import { validate } from '~/utils/validation';
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: 'Missing email or password',
    });
  }
  next();
};

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: { min: 3, max: 20 },
      },
      trim: true,
    },
    email: {
      notEmpty: true,
      isEmail: true,
      trim: true,
      custom: {
        options: async (value) => {
          const isEmailExist = await userService.checkEmailExist(value);
          if (isEmailExist) {
            throw new Error('Email already exist');
          }
          return true;
        },
      },
    },
    password: {
      notEmpty: true,
      isLength: {
        options: { min: 6 },
      },
      isString: true,
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        },
      },
      errorMessage:
        'Password must be at least 6 characters long and contain at least one lowercase letter, one uppercase letter, one number and one symbol',
    },
    confirm_password: {
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Passwords do not match');
          }
          return true;
        },
      },
      notEmpty: true,
      isLength: {
        options: { min: 6 },
      },
      isString: true,
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        },
      },
      errorMessage:
        'Password must be at least 6 characters long and contain at least one lowercase letter, one uppercase letter, one number and one symbol',
    },
    date_of_birth: {
      notEmpty: true,
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true,
        },
      },
    },
  })
);
