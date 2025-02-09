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

// CORS 설정
app.use(cors({
    origin: [
        'http://zogakzip.react.codeit.s3-website-ap-southeast-2.amazonaws.com',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}))

// JSON 본문 파싱 미들웨어
app.use(express.json());


// 기본 라우터
app.get('/', (req, res) => {
    res.status(201).json('Welcome');
    console.log("welcome!");
});

// API 라우터 등록
app.use('/api/groups', groupController);
app.use('/api/posts', postController);
app.use('/api/image', ImageController);
app.use('/api/comments', commentController);

// 정적 파일 서비스
app.use('/uploads', express.static(path.resolve('src/uploads')));

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
