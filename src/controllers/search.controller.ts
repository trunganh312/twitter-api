import { ParamsDictionary } from 'express-serve-static-core';
import { Request, Response } from 'express';
import { SearchQuery } from '~/models/requests/Search.requests';
import searchService from '~/services/search.services';

export const searchController = async (
  req: Request<ParamsDictionary, any, any, SearchQuery>,
  res: Response
) => {
  const limit = Number(req.query.limit) || 20;
  const page = Number(req.query.page) || 1;
  const result = await searchService.search({
    content: req.query.content,
    limit,
    page,
    user_id: req.decoded_authorization?.user_id as string,
  });
  res.json({
    message: 'Search request successfully',
    result: {
      tweets: result.tweets,
      limit: limit,
      page: page,
      total: result.total,
      total_page: Math.ceil(result.total / Number(limit)),
    },
  });
};
