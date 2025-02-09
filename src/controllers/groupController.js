import express from 'express';
import groupService from '../services/groupService.js';
import postService from '../services/postService.js';
import badgeRepository from '../repositories/badgeRepository.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; // 파일 시스템 모듈

const groupController = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = path.resolve(__dirname, '../uploads');

// 서버 시작 시 uploads 폴더가 없으면 생성
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`업로드 폴더가 생성되었습니다: ${uploadPath}`);
}

//console.log("현재 파일 저장 경로:", uploadPath);

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

groupController.post('/', upload.single('Image'), async (req, res, next) => {
    try {
        console.log("Multer - req.file:", req.file); // 업로드된 파일 정보
        console.log("Multer - req.body:", req.body); // 요청 본문 데이터

        if (!req.file) {
            console.error("Multer - 파일이 업로드되지 않았습니다.");
            return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
        }

        const { name, password, isPublic, introduction } = req.body;

        if (!name || !password) {
            return res.status(400).json({ message: '이름과 비밀번호는 필수 사항입니다.' });
        }
        const isPublicBoolean = isPublic === "true";

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(req.file.filename)}`;
        const groupData = { name, password, isPublic: isPublicBoolean, introduction, imageUrl };

        const group = await groupService.createGroup(groupData);

        return res.status(201).json(group);
    } catch (error) {
        if (error.code === 422) {
            res.status(422).json({ message: "동일한 이름의 그룹이 이미 존재합니다." })
        } else {
            console.error("에러 발생:", error.message);
            next(error);
        }
    }
});

//그룹 목록 조회
groupController.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1; //현재 페이지
        const pageSize = parseInt(req.query.pageSize) || 100; //1페이지당 보여줄 페이지 수
        const sortBy = req.query.sortBy || null; //정렬 기준

        let isPublic = true; //공개 비공개 확인용
        //공개 비공개가 주어지지 않았다면 기본값으로 true
        if (req.query.isPublic !== undefined) {
            isPublic = req.query.isPublic === 'true';
        }
        const name = req.query.keyword || null; //키워드 설정

        //Service에 그룹 목록 조회 요청
        const result = await groupService.getList(name, page, pageSize, sortBy, isPublic);
        return res.json(result); //결과 반환

    } catch (error) {
        return next(error);
    }
});

//그룹 수정
groupController.put('/:id', upload.single('image'), async (req, res, next) => {
    try {
        console.log("Multer - req.file:", req.file); // 업로드된 파일 정보
        console.log("Multer - req.body:", req.body); // 요청 본문 데이터

        const groupId = parseInt(req.params.id, 10);

        const inputPassword = req.body.password;
        if (!inputPassword) {
            return res.status(404).json({ message: '잘못된 요청입니다.' });
        }
        const isPublicBoolean = req.body.isPublic === "true";
        const imageUrl = req.file
            ? `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(req.file.filename)}`
            : null;
        console.log(groupId + "님의 수정 요청이 있습니다! 비밀번호:" + inputPassword);

        const groupData = { ...req.body, password: inputPassword, imageUrl: imageUrl, isPublic: isPublicBoolean, id: groupId };

        const group = await groupService.updateGroup(groupData);
        return res.status(201).json({
            message: "그룹이 성공적으로 수정되었습니다.",
            group
        });
    } catch (error) {
        if (error.code === 404) {
            res.status(404).json({ message: "존재하지 않습니다." });
        } else if (error.code === 403) {
            res.status(403).json({ message: "비밀번호가 틀렸습니다." });
        } else {
            return next(error);
        }
    }
});

//그룹 삭제
groupController.delete('/:id', async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const password = req.body.password;

        if (!groupId || !password) {
            return res.status(400).json({ message: '잘못된 요청입니다.' });
        }

        console.log(groupId + "님의 삭제 요청이 있습니다! 비밀번호:" + password);

        const deletedGroup = await groupService.deleteGroup({ id: groupId }, password);

        return res.status(200).json({ message: '그룹 삭제 성공' });
    } catch (error) {
        if (error.code === 404) {
            res.status(404).json({ message: "존재하지 않습니다." });
        } else if (error === 403) {
            res.status(403).json({ message: "비밀번호가 틀렸습니다." });
        } else {
            return next(error);
        }
    }
});

//그룹 상세 정보 조회
groupController.get('/:id', async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const group = await groupService.getDetail(groupId);

        //배지 목록 업데이트하기
        await badgeRepository.getBadges(groupId);

        return res.status(200).json(group);
    } catch (error) {
        if (error.code === 404) {
            res.status(404).json({ message: "존재하지 않습니다." });
        } else {
            return next(error);
        }
    }
});

//그룹 조회 권한 확인 
//!--주의--! 메시지는 나오도록 설정됐지만, 다른 기능은 없음. -> 잘 구현됐는지 미지수
groupController.post('/:id/verify-password', async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);

        console.log('Request Body:', req.body);

        // 요청 본문에서 비밀번호 추출
        const password = req.body.password;

        if (!password) {
            return res.status(400).json({ message: '잘못된 요청입니다.' });
        }
        // 서비스 호출하여 비밀번호 확인
        const { message } = await groupService.verifyPassword(groupId, password);

        res.status(200).json({ message });
    } catch (error) {
        if (error.code === 403) {
            res.status(403).json({ message: "비밀번호가 틀렸습니다." });
        } else if (error.code === 404) {
            res.status(404).json({ message: "존재하지 않습니다." });
        }
        else {
            return next(error);
        }
    }
});

//그룹 공감하기
groupController.post('/:id/like', async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);

        const result = await groupService.pushLike(groupId);
        if (result) {
            res.json({ message: "그룹 공감하기 성공" });
        }
    } catch (error) {
        if (error.code === 404) {
            res.status(404).json({ message: "존재하지 않습니다." });
        } else {
            return next(error);
        }
    }
})

//그룹 공개 여부 확인하기
groupController.get('/:id/is-public', async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);

        const group = await groupService.getPublic(groupId);
        return res.status(200).json(group);
    } catch (error) {
        if (error.code === 404) {
            res.status(404).json({ message: "존재하지 않습니다." });
        } else {
            return next(error);
        }
    }
})

groupController.post('/:id/posts', upload.single('image'), async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        console.log(`${groupId}님의 게시글 요청이 있습니다~\n${JSON.stringify(req.body, null, 2)}`);

        const { nickname, title, content, location, moment, isPublic, tags } = req.body;

        const password = req.body.password;
        const isPublicBoolean = isPublic === "true";

        // 필수 입력값 확인
        if (!nickname || !title || !password || !content) {
            return res.status(400).json({ message: '잘못된 요청입니다. - 닉네임, 제목, 비밀번호는 필수사항입니다.' });
        }

        // ✅ tags 변환: 문자열인지 확인하고 처리
        let tagArray = [];
        if (tags) {
            if (Array.isArray(tags)) {
                tagArray = tags; // 이미 배열인 경우 그대로 사용
            } else if (typeof tags === 'string') {
                tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
        }

        const imageUrl = req.file
            ? `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(req.file.filename)}`
            : null;

        // 입력 데이터 정리
        const postData = {
            nickname,
            title,
            imageUrl,
            content,
            tags: tagArray, // 변환된 태그 배열
            location,
            moment: new Date(moment),
            isPublic: isPublicBoolean,
            password,
        };

        // 추억 등록 서비스 호출
        const post = await postService.createPost(postData, groupId);
        console.log("새로 생성된 게시글 데이터:", post);

        return res.status(201).json(post);
    } catch (error) {
        if (error.code === 404) {
            return res.status(404).json({ message: '잘못된 요청입니다.' });
        } else {
            return next(error);
        }
    }
});


// 게시글 목록 조회
groupController.get('/:id/posts', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1; // 페이지 번호
        const pageSize = parseInt(req.query.pageSize, 10) || 5; // 페이지당 항목 수
        const sortBy = req.query.sortBy || 'latest'; // 정렬 기준 (기본값: 최신순)

        const groupId = parseInt(req.params.id, 10);

        let isPublic = true; // 공개 비공개 확인용
        if (req.query.isPublic !== undefined) {
            // 쿼리 파라미터에 따라 공개/비공개 설정
            isPublic = req.query.isPublic === 'true';
        }

        // 검색 키워드 (제목, 태그)
        const name = req.query.keyword || null;

        // 게시글 목록 조회 서비스 호출
        const result = await postService.getPosts(
            name,
            page,
            pageSize,
            sortBy,
            isPublic,
            groupId
        );

        return res.status(200).json(result);

    } catch (error) {
        return next(error);
    }
});

export default groupController;