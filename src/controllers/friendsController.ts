import { HandlerFunction } from '../types';
import * as FriendsModel from '../models/friendsModel';

export const getAllFriends: HandlerFunction = (req, res, next) => {
  const { id: userId } = req.params;

  FriendsModel.getAll(userId)
    .on('error', (error) => {
      res.status(500).send('Internal server error');
      next(error);
    })
    .pipe(res)
    .on('finish', () => {
      res.status(200);
    });
};

export const addFriend: HandlerFunction = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const { body } = req;
    const friend = await FriendsModel.addFriend(userId, body);
    res.status(201).send(friend);
  } catch (error) {
    res.status(500).send('Internal server error');
    next(error);
  }
};

export const deleteFriend: HandlerFunction = async (req, res, next) => {
  try {
    const { userId, friendId } = req.params;
    console.log({ userId, friendId });

    await FriendsModel.deleteFriend(userId, friendId);
    res.status(204).send('No content');
  } catch (error) {
    res.status(404).send('Bad request');
    next(error);
  }
};
