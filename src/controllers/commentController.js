import express from 'express';
import commentService from '../services/commentService.js';


const commentController = express.Router();


//댓글 수정
commentController.put('/:id', async (req, res, next) => {
	try {
		const id = parseInt(req.params.id, 10);
		const { nickname, password, content } = req.body;

		const commentData = {
			id,
			nickname,
			password,
			content,
		}

		if (!password || !content) {
			return res.status(400).json({ message: '잘못된 요청입니다. 비밀번호와 댓글 내용을 제공해야 합니다.' });
		}


		const updatedComment = await commentService.updateComment(commentData);

		return res.status(200).json(updatedComment);

	} catch (error) {
		if (error.code === 404) {
			return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
		} else if (error.code === 403) {
			return res.status(403).json({ message: '비밀번호가 틀렸습니다.' });
		} else {
			return next(error);
		}
	}
});


//댓글 삭제
commentController.delete('/:id', async (req, res, next) => {
	try {
		const commentId = parseInt(req.params.id, 10);
		const password = req.body.password;

		if (!commentId || !password) {
			return res.status(400).json({ message: '잘못된 요청입니다.' });
		}

		console.log("삭제용으로 입력한 비밀번호:" + password);

		const result = await commentService.deleteComment(commentId, password);

		if (result) {
			console.log("삭제 성공!");
			return res.status(200).json({ message: '답글 삭제 성공' });
		} else {
			return res.status(403).json({ message: '비밀번호가 틀렸습니다.' });
		}
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



export default commentController;