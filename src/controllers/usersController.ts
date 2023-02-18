import { v4 } from 'uuid';

import * as UsersModel from '../models/usersModel';
import { HandlerFunction, UserInterface } from '../types';

export const getAll: HandlerFunction = (req, res, next) => {
  try {
    UsersModel.getAllUsers()
      .pipe(res)
      .on('finish', () => {
        res.status(200);
      });
  } catch (error) {
    next(error);
  }
};

export const findUserById: HandlerFunction = (req, res, next) => {
  const { id } = req.params;

  UsersModel.findUserById(id)
    .on('error', (error) => {
      res.status(404).send(error.message);
      next(error);
    })
    .pipe(res)
    .on('finish', () => {
      res.status(200);
    });
};

export const addUser: HandlerFunction = async (req, res, next) => {
  try {
    const { body } = req;

    const userWithId: UserInterface = { ...body, id: v4(), chat: [] };

    await UsersModel.addUser(userWithId);

    res.status(201).send(userWithId);
  } catch (error) {
    res.status(500).send('Cannot add user');
    next(error);
  }
};

export const deleteUser: HandlerFunction = async (req, res, next) => {
  try {
    const { id } = req.params;

    await UsersModel.deleteUser(id);

    res.status(204).send({});
  } catch (error) {
    next(error);
    res.status(400).send('bad request');
  }
};

export const login: HandlerFunction = (req, res, next) => {
  const {
    body: { login, password },
  } = req;

  UsersModel.login(login, password)
    .on('error', (error) => {
      res.status(401).send(error.message);
    })
    .pipe(res)
    .on('end', () => {
      res.status(200).send({});
    });
};

export const updateUser: HandlerFunction = async (req, res, next) => {
  const { id: userId } = req.params;
  const { body } = req;

  await UsersModel.updateUser(userId, body);
};
