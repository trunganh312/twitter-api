import { Request, Response } from 'express';
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
