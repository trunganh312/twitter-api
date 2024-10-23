import express from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema';
import { EntityError, ErrorWithStatus } from './error';
import HTTP_STATUS from '~/constants/httpStatus';
// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validation.run(req);
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const errorObjects = errors.mapped();
    const entityError = new EntityError({ errors: errorObjects });
    for (const key in errorObjects) {
      if (Object.prototype.hasOwnProperty.call(errorObjects, key)) {
        const { msg } = errorObjects[key];
        if (msg instanceof ErrorWithStatus && msg.status != HTTP_STATUS.UNPROCESSABLE_ENTITY) {
          return next(msg);
        }
        // next(new ErrorWithStatus({ message: msg, status: HTTP_STATUS.UNPROCESSABLE_ENTITY }));
        next(entityError);
      }
    }
  };
};
