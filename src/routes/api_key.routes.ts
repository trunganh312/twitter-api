import { NextFunction, Request, Response, Router } from 'express';
import { ApiKeyStatus } from '~/constants/enums';
import { ApiKey } from '~/models/schemas/ApiKey.schema';
import databaseService from '~/services/database.services';
import { generateApiKey } from '~/utils/utils';

const apiKeyRouter = Router();

apiKeyRouter.post('/create-api-key', async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = generateApiKey();
  const result = await databaseService.apiKeys.insertOne(
    new ApiKey({
      key: apiKey,
      expirationDate: new Date(),
      requestLimit: 10,
      requestsUsed: 0,
      status: ApiKeyStatus.Active,
    })
  );
  return res.status(200).json({
    result,
  });
});

export default apiKeyRouter;
