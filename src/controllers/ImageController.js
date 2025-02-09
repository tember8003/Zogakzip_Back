import express from 'express';
import multer from 'multer';
import path from 'path';
import { func } from 'superstruct';

const ImageController = express.Router();
//이미지 URL 추출용 Controller


//이미지 저장소 설정
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads/');
    },
    filename(req, file, callback) {
        callback(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const uploadMiddleware = upload.single('image');

//이미지 업로드시 폴더 저장 후 URL 추출
ImageController.post('/', uploadMiddleware, (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({ message: '이미지가 업로드되지 않았습니다.' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        return res.status(201).json({ imageUrl });
    } catch (error) {
        return res.status(500).json({ message: '이미지 업로드 중 오류가 발생했습니다.', error });
    }
});

export default ImageController;