import express from 'express';
import postService from '../services/postService.js'; // 게시글 서비스
import commentService from '../services/commentService.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; // 파일 시스템 모듈
import { title } from 'process';

const postController = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = path.resolve(__dirname, '../uploads');

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

//게시글 수정
postController.put('/:id', upload.single('PutImage'), async (req, res, next) => {
	try {
		const postId = parseInt(req.params.id, 10);
		const inputPassword = req.body.password;

		if (!inputPassword) {
			return res.status(404).json({ message: '잘못된 요청입니다.' });
		}
		// String 타입의 isPublic을 Boolean으로 변환
		let isPublic = req.body.isPublic;
		if (typeof isPublic === 'string') {
			isPublic = isPublic.toLowerCase() === 'true'; // 문자열 "true"는 true, 나머지는 false
		}

		const imageUrl = req.file
            ? `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(req.file.filename)}`
            : null;

		const postData = { ...req.body, isPublic, imageUrl, password: inputPassword, id: postId };

		const post = await postService.updatePost(postData);
		return res.status(201).json(post);
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

// 게시글 삭제
postController.delete('/:id', async (req, res, next) => {
	try {
		// 게시글 ID
		const postId = parseInt(req.params.id, 10);

		// 요청 본문에서 비밀번호 추출
		const password = req.body.password;

		console.log(req.body);

		// 게시글 ID와 비밀번호가 제공되었는지 확인
		if (!postId || !password) {
			return res.status(400).json({ message: '잘못된 요청입니다. 게시글 ID와 비밀번호는 필수입니다.' });
		}

		// 게시글 삭제 서비스 호출
		const result = await postService.deletePost(postId, password);

		if (result) {
			return res.status(200).json({ message: '게시글 삭제 성공' });
		} else {
			return res.status(403).json({ message: '비밀번호가 틀렸습니다.' });
		}
	} catch (error) {
		if (error.code === 404) {
			return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
		} else if (error.code === 403) {
			return res.status(403).json({ message: '비밀번호가 틀렸습니다.' });
		} else {
			return next(error);
		}
	}
});

// 게시글 상세 정보 조회
postController.get('/:id', async (req, res, next) => {
	try {
		// 추억(게시글) ID
		const postId = parseInt(req.params.id, 10);

		const post = await postService.getDetail(postId);


		return res.status(200).json({
			post
		});
	} catch (error) {
		if (error.code === 404) {
			return res.status(404).json({ message: "존재하지 않습니다." });
		} else {
			return next(error);
		}
	}
});

//비밀번호 맞는지 확인
postController.post('/:id/verify-password', async (req, res, next) => {
	try {
		const postId = parseInt(req.params.id, 10);
		const password = req.body.password;

		if (!postId || !password) {
			return res.status(400).json({ message: '잘못된 요청입니다. 게시글 ID와 비밀번호는 필수입니다.' });
		}

		const message = await postService.verifyPassword(postId, password);

		res.status(200).json(message);
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
})

// 게시글 공감하기
postController.post('/:id/like', async (req, res, next) => {
	try {
		const postId = parseInt(req.params.id, 10);

		// 게시글에 공감을 추가하는 서비스 호출
		const result = await postService.pushLike(postId);

		if (result) {
			res.status(200).json({ message: "게시글 공감하기 성공" });
		} else {
			res.status(500).json({ message: "게시글 공감하기 실패" });
		}
	} catch (error) {
		if (error.code === 404) {
			res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
		} else {
			return next(error);
		}
	}
});

// 게시글 공개 여부 확인하기
postController.get('/:id/is-public', async (req, res, next) => {
	try {
		const postId = parseInt(req.params.id, 10);

		// 게시글의 공개 여부를 확인하는 서비스 호출
		const post = await postService.getPublicStatus(postId);

		return res.status(200).json(post);
	} catch (error) {
		if (error.code === 404) {
			res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
		} else {
			return next(error);
		}
	}
});

//댓글 등록
postController.post('/:id/comments', async (req, res, next) => {
	try {
		const id = parseInt(req.params.id, 10);
		console.log(req.body);

		const { nickname, password, content } = req.body;

		if (!nickname || !password || !content) {
			return res.status(404).json({ message: '잘못된 요청입니다. - 닉네임과 비밀번호, 내용은 필수사항입니다.' });
		}

		const commentData = {
			nickname,
			password,
			content,
		}

		const comment = await commentService.addComment(commentData, id);
		return res.status(201).json(comment);
	} catch (error) {
		if (error.code === 422) {
			res.status(422).json({ message: "댓글 등록 중 오류 발생" })
		} else {
			return next(error);
		}
	}
});


//댓글 상세 목록
postController.get('/:id/comments', async (req, res, next) => {
	try {
		const postId = parseInt(req.params.id, 10);
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.pageSize) || 5;

		const result = await commentService.getComment(page, pageSize, postId);


		return res.json(result);

	} catch (error) {

		return next(error);
	}
});



export default postController;