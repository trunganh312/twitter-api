import { Router } from 'express'
import { getConversationsController } from '~/controllers/conversations.controllers'
import { paginationValidator } from '~/middlewares/tweet.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import { accessTokenValidator, getConversationsValidator, verifiedUserValidator } from '~/middlewares/user.middlewares';

const conversationsRouter = Router()

conversationsRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  getConversationsValidator,
  wrapRequestHandler(getConversationsController)
)

export default conversationsRouter
