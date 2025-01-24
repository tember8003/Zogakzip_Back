import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';

import groupController from './controllers/groupController.js';
import ImageController from './controllers/ImageController.js';
import postController from './controllers/postController.js';
import errorHandler from './middlewares/errorHandler.js';
import commentController from './controllers/commentController.js';

const app = express();
//백엔드 코드 배포용 설정
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.options('*', cors());


app.get('/', (req, res) => {
    res.status(201).json('Welcome');
    console.log("welcome!");
});

app.use('/api/groups', groupController);

app.use(express.json());

app.use('/uploads', express.static(path.resolve('src/uploads')));
app.use('/api/posts', postController);
app.use('/api/image', ImageController);
app.use('/api/comments', commentController);

app.use(errorHandler);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});