import { Request, Response, NextFunction } from 'express';
import databaseService from '~/services/database.services';

export const apiKeyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ message: 'API Key is required' });
  }

  try {
    const key = await databaseService.apiKeys.findOne({ key: apiKey });

    if (!key) {
      return res.status(401).json({ message: 'Invalid API Key' });
    }

    if (key.requestsUsed >= key.requestLimit) {
      return res.status(429).json({ message: 'API Key has reached its request limit' });
    }

    // Tăng số lượt request đã sử dụng lên 1 và lưu lại
    await databaseService.apiKeys.updateOne({ key: apiKey }, { $inc: { requestsUsed: 1 } });

    next();
  } catch (error) {
    console.error('Error validating API Key:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
