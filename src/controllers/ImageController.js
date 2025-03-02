import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs'; // 파일 시스템 모듈

const ImageController = express.Router();
//이미지 URL 추출용 Controller

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadPath = path.resolve(__dirname, '../uploads');


// 서버 시작 시 uploads 폴더가 없으면 생성
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`업로드 폴더가 생성되었습니다: ${uploadPath}`);
}

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const uploadPath = path.resolve(__dirname, '../uploads');
        callback(null, uploadPath);
    },
    filename: function (req, file, callback) {
        // 파일 이름을 현재 시간 기반으로 짧게 설정
        const sanitizedFilename = Date.now() + '-' + path.extname(file.originalname);
        console.log("생성된 파일 이름:", sanitizedFilename);
        callback(null, sanitizedFilename);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, callback) => {
        console.log("Multer - 요청 처리 중입니다.");
        console.log("Multer - 파일 정보:", file);
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            console.log("Multer - 허용된 파일 형식입니다:", file.mimetype);
            callback(null, true);
        } else {
            console.error("Multer - 지원하지 않는 파일 형식입니다:", file.mimetype);
            callback(new Error('지원하지 않는 파일 형식입니다.'), false);
        }
    }
});

const uploadMiddleware = upload.single('image');

//이미지 업로드시 폴더 저장 후 URL 추출
ImageController.post('/', uploadMiddleware, (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({ message: '이미지가 업로드되지 않았습니다.' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(req.file.filename)}`;

        return res.status(201).json({ imageUrl });
    } catch (error) {
        return res.status(500).json({ message: '이미지 업로드 중 오류가 발생했습니다.', error });
    }
});

export default ImageController;