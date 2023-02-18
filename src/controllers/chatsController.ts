import { HandlerFunction } from '../types';
import * as ChatsModel from '../models/chatsModel';

export const getUserChat: HandlerFunction = (req, res, next) => {
  const { id: userId } = req.params;

  ChatsModel.getUserChat(userId)
    .on('error', (error) => {
      res.status(500).send('Something went wrong');
      next(error);
    })
    .pipe(res)
    .on('finish', () => {
      res.status(200);
    });
};
