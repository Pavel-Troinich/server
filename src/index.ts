import express, {
  NextFunction,
  Request,
  Response,
  json,
  urlencoded,
} from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';

import * as UserController from './controllers/usersController';
import * as PostsController from './controllers/postsController';
import * as ChatsController from './controllers/chatsController';
import * as FriendsController from './controllers/friendsController';
import { formatMessage, updateChatHistory } from './utils';

const PORT = process.env.PORT ?? 6969;

const app = express();

const server = http.createServer(app);

const wss = new Server(server, { cors: { ...cors() } });

wss.on('connection', (socket) => {
  const users = Array.from(wss.of('/').sockets.entries()).map(
    ([id, socket]) => ({
      userSocketId: id,
      userId: socket.handshake.auth.userId,
    }),
  );
  socket.emit('users', users);

  socket.broadcast.emit('user connected', {
    userSocketId: socket.id,
    userId: socket.handshake.auth.userId,
  });

  socket.on('chatMessage', async ({ to, ...rest }) => {
    const userIdFrom = users.find((user) => user.userSocketId === to)?.userId;
    const { text, time, userId } = formatMessage(rest);

    await updateChatHistory(`${userIdFrom}`, `${userId}`, { text, time });

    socket.broadcast.to(to).emit('message', { text, time });
  });
});

app.use(cors());
app.use(urlencoded({ extended: false }));
app.use(json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('charset', 'utf8');
  res.setHeader('Content-Type', 'application/json');
  next();
});

app.use(
  (
    error: Record<string, string>,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    console.log('Path: ', req.path);
    console.error('Error: ', error);

    if (error.type == 'redirect') {
      res.redirect('/error');
    } else if (error.type === 'time-out') {
      res.status(408).send(error.message);
    } else {
      console.log(error);
      res.status(500).send(error.message);
    }
  },
);

app.get('/newsfeed/:id', PostsController.getPostById);
app.get('/newsfeed', PostsController.getAllPosts);
app.get('/users/chat/:id', ChatsController.getUserChat);
app.get('/users/:id', UserController.findUserById);
app.get('/users', UserController.getAll);
app.get('/friends/:id', FriendsController.getAllFriends);

app.post('/newsfeed', PostsController.addPost);
app.post('/user', UserController.addUser);
app.post('/user/login', UserController.login);
app.post('/friends/:id', FriendsController.addFriend);

app.put('/newsfeed/:id', PostsController.updatePost);
app.put('/users/:id', UserController.updateUser);

app.delete('/newsfeed/:id', PostsController.deletePost);
app.delete('/:id', UserController.deleteUser);
app.delete('/friends/:userId/:friendId', FriendsController.deleteFriend);

server.listen(PORT, () => {
  console.log(`Server listen on port ${PORT}`);
});
