import { Transform } from 'stream';

import { JsonStreamDataInterface, UserInterface } from '../types';
import { readUsers } from '../utils';
import { usersPath } from '../constants';
import { parser } from 'stream-json';
import { streamValues } from 'stream-json/streamers/StreamValues';

export const getUserChat = (id: string) => {
  const getChatInfo = (users: Array<UserInterface>) =>
    users.find(({ id: userId }) => id === userId)!.chat;

  const transform = new Transform({
    objectMode: true,
    transform(chunk: JsonStreamDataInterface, encoding, callback) {
      const chatInfo = getChatInfo(chunk.value);

      if (chatInfo) {
        callback(null, JSON.stringify(chatInfo));
      }
    },
  });

  return readUsers(usersPath)
    .pipe(parser())
    .pipe(streamValues())
    .pipe(transform);
};
