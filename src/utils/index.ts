import fs from 'fs';
import { readFile, writeFile } from 'fs/promises';
import moment from 'moment';

import { UserInterface, UserMessageInterface } from '../types';
import { usersPath } from '../constants';

export const readUsers = (usersPath: string) => {
  const readStream = fs.createReadStream(usersPath, {
    encoding: 'utf8',
  });

  return readStream.on('end', () => {
    readStream.destroy();
  });
};

export const formatMessage = (message: string) => {
  const { text, userIdTo } = JSON.parse(message) as UserMessageInterface;

  return {
    userIdTo,
    text,
    time: moment(new Date()).format('h:mm a'),
  };
};

export const updateChatHistory = async (
  userIdFrom: string,
  userIdTo: string,
  { text, time }: { text: string; time: string },
) => {
  const users = await readFile(usersPath, { encoding: 'utf8' });
  const parsedUsers = JSON.parse(users) as Array<UserInterface>;

  const userInfoFrom = parsedUsers.find(({ id }) => id === userIdFrom)!;
  const userInfoTo = parsedUsers.find(({ id }) => id === userIdTo)!;

  const currentUser = parsedUsers.flatMap((user) => {
    if (user.id === userIdFrom) {
      const chatWithUserTo = user.chat.find(
        ({ senderId }) => senderId === userIdTo,
      );

      const { name, surname, profilePhoto } = userInfoTo;

      return chatWithUserTo
        ? {
            ...user,
            chat: user.chat.flatMap((chatWIthUser) =>
              userIdTo === chatWIthUser.senderId
                ? {
                    ...chatWIthUser,
                    history: [
                      ...chatWIthUser.history,
                      { text, time, isOwnMessage: true },
                    ],
                  }
                : chatWIthUser,
            ),
          }
        : {
            ...user,
            chat: [
              ...user.chat,
              {
                senderId: userIdTo,
                senderInfo: {
                  name,
                  surname,
                  profilePhoto,
                },
                history: [{ text, time, isOwnMessage: true }],
              },
            ],
          };
    } else if (user.id === userIdTo) {
      const chatWithUserFrom = user.chat.find(
        ({ senderId }) => senderId === userIdFrom,
      );

      const { name, surname, profilePhoto } = userInfoFrom;

      return chatWithUserFrom
        ? {
            ...user,
            chat: user.chat.flatMap((chatWIthUser) =>
              chatWIthUser.senderId === userIdFrom
                ? {
                    ...chatWIthUser,
                    history: [
                      ...chatWIthUser.history,
                      { text, time, isOwnMessage: false },
                    ],
                  }
                : chatWIthUser,
            ),
          }
        : {
            ...user,
            chat: [
              ...user.chat,
              {
                senderId: userIdFrom,
                senderInfo: { name, surname, profilePhoto },
                history: [{ text, time, isOwnMessage: false }],
              },
            ],
          };
    } else {
      return user;
    }
  });

  await writeFile(usersPath, JSON.stringify(currentUser));
};
