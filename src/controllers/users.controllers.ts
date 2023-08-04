import { Request, Response } from 'express';
import userService from '~/services/users.services';
import { ParamsDictionary } from 'express-serve-static-core';
import { RegisterRequestBody } from '~/models/requests/User.requests';
export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'trung@gmail.com' && password === '123') {
    return res.json({
      message: 'Login successful',
    });
  }
  return res.status(401).json({
    message: 'Login failed',
  });
};
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res: Response
) => {
  try {
    const result = await userService.register(req.body);
    return res.status(200).json({
      message: 'Register successful',
      result,
    });
  } catch (error) {
    return res.status(401).json({
      message: 'Register failed',
    });
  }
};
