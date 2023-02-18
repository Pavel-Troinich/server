import { Transform } from 'stream';
import { parser } from 'stream-json';
import { streamValues } from 'stream-json/streamers/StreamValues';
import { readFile, writeFile } from 'fs/promises';

import {
  JsonStreamDataInterface,
  FriendInterface,
  UserInterface,
} from '../types';
import { readUsers } from '../utils';
import { usersPath } from '../constants';

export const getAll = (id: string) => {
  const getFriends = (users: Array<UserInterface>): Array<FriendInterface> =>
    users.find(({ id: userId }) => id === userId)?.friends ?? [];

  const transform = new Transform({
    objectMode: true,
    transform(chunk: JsonStreamDataInterface, encoding, callback) {
      const friends = getFriends(chunk.value);

      if (friends) {
        callback(null, JSON.stringify(friends));
      } else {
        callback(new Error('Friends not found '));
      }
    },
  });

  return readUsers(usersPath)
    .pipe(parser())
    .pipe(streamValues())
    .pipe(transform);
};

export const addFriend = async (
  userId: string,
  { id }: Pick<FriendInterface, 'id'>,
): Promise<FriendInterface | void> => {
  try {
    const users = await readFile(usersPath, { encoding: 'utf8' });
    const parsedUsers = JSON.parse(users) as Array<UserInterface>;

    const { name, surname, profilePhoto } = parsedUsers.find(
      (user) => user.id === id,
    )!;

    const updatedUsers = parsedUsers.flatMap((user) =>
      user.id === userId
        ? {
            ...user,
            friends: [...user.friends, { name, surname, profilePhoto, id }],
          }
        : user,
    );

    await writeFile(usersPath, JSON.stringify(updatedUsers));

    return { name, surname, profilePhoto, id };
  } catch (error) {
    console.log(error);
  }
};

export const deleteFriend = async (userId: string, friendId: string) => {
  try {
    const users = await readFile(usersPath, { encoding: 'utf8' });
    const parsedUsers = JSON.parse(users) as Array<UserInterface>;

    const updatedUsers = parsedUsers.flatMap((user) =>
      user.id === userId
        ? {
            ...user,
            friends: [
              ...user.friends.filter((friend) => friend.id !== friendId),
            ],
          }
        : user,
    );

    await writeFile(usersPath, JSON.stringify(updatedUsers));
  } catch (error) {
    console.log(error);
  }
};
