import { Transform } from 'stream';
import { parser } from 'stream-json';
import { streamValues } from 'stream-json/streamers/StreamValues';
import { readFile, writeFile } from 'fs/promises';

import { JsonStreamDataInterface, UserInterface } from '../types';
import { readUsers } from '../utils';
import { usersPath } from '../constants';

export const getAllUsers = () => {
  return readUsers(usersPath);
};

export const findUserById = (id: string) => {
  const findUserByIdTransform = (users: Array<UserInterface>) =>
    users.find(({ id: userId }) => userId === id);
  const transform = new Transform({
    objectMode: true,
    transform(chunk: JsonStreamDataInterface, encoding, callback) {
      const user = findUserByIdTransform(chunk.value);

      if (user) {
        callback(null, JSON.stringify(user));
      } else {
        callback(new Error('User not found'));
      }
    },
  });

  return readUsers(usersPath)
    .pipe(parser())
    .pipe(streamValues())
    .pipe(transform);
};

export const addUser = async (body: UserInterface) => {
  const users = await readFile(usersPath, { encoding: 'utf8' });
  const updatedUsers = JSON.parse(users) as Array<UserInterface>;

  return writeFile(usersPath, JSON.stringify([...updatedUsers, body]));
};

export const deleteUser = async (id: string) => {
  const users = await readFile(usersPath, { encoding: 'utf8' });
  const updatedUsers = JSON.parse(users) as Array<UserInterface>;

  return writeFile(
    usersPath,
    JSON.stringify([...updatedUsers.filter(({ id: userId }) => id !== userId)]),
  );
};

export const login = (login: string, password: string) => {
  const isAllowToLogin = (users: Array<UserInterface>) =>
    users.find(
      ({ login: userLogin, password: userPassword }) =>
        userLogin === login && password === userPassword,
    );

  const transform = new Transform({
    objectMode: true,
    transform(chunk: JsonStreamDataInterface, encoding, callback) {
      const user = isAllowToLogin(chunk.value);

      if (user) {
        callback(null, JSON.stringify(user));
      } else {
        callback({
          message: 'Unauthorized',
          type: 'Unauthorized',
        } as unknown as Error);
      }
    },
  });

  return readUsers(usersPath)
    .on('error', (error) => {
      console.log(error);
    })
    .pipe(parser())
    .pipe(streamValues())
    .pipe(transform);
};

export const updateUser = async (id: string, body: UserInterface) => {
  try {
    const users = await readFile(usersPath, { encoding: 'utf8' });

    const parsedUsers = JSON.parse(users) as Array<UserInterface>;

    const updatedUsers = parsedUsers.flatMap((user) =>
      user.id === id ? body : user,
    );

    await writeFile(usersPath, JSON.stringify(updatedUsers));
  } catch (error) {
    console.log(error);
  }
};
