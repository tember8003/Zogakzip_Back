import commentRepository from "../repositories/commentRepository.js";
import postRepository from "../repositories/postRepository.js";
import bcrypt from 'bcryptjs';

//댓글 추가
async function addComment(comment, postId) {
    const existedPost = await postRepository.findById(postId);
    if (!existedPost) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: postId };
        throw error;
    }

    const createdComment = await commentRepository.createComment(comment, postId);
    postRepository.plusComment(existedPost);

    return filterSensitiveCommentData(createdComment);
};

//password같은 중요 데이터는 해싱되어 저장되므로 가져오지 않음.
function filterSensitiveCommentData(comment) {
    const { password, postId, ...rest } = comment;
    return rest;
}


//댓글 목록 조회
async function getComment(page, pageSize, postId) {
    const existedPost = await postRepository.findById(postId);

    //게시글이 존재하지 않으면 에러처리
    if (!existedPost) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: postId };
        throw error;
    }

    const skip = (page - 1) * pageSize; //페이지 시작 번호
    const take = pageSize; //한 페이지당 댓글 수


    const [comments, totalCount] = await Promise.all([
        postRepository.getComments(skip, take, postId),
        postRepository.countComments(postId),
    ]);
    console.log(comments, totalCount);

    const totalPages = Math.ceil(totalCount / pageSize); //총 페이지 수

    return { currentPage: page, totalPages: totalPages, totalItemCount: totalCount, data: comments };
}

//댓글 수정하기
async function updateComment(comment) {
    const existedComment = await commentRepository.findById(comment.id);

    if (!existedComment) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: postId };
        throw error;
    }

    //해당 id를 가진 댓글의 비밀번호와 일치하는지 확인
    const check = await bcrypt.compare(comment.password, existedComment.password);
    if (!check) {
        const error = new Error('비밀번호가 틀렸습니다.');
        error.name = 'ForbiddenError';
        error.code = 403;
        throw error;
    }

    const updatedComment = await commentRepository.updateComment(comment);

    return filterSensitiveCommentData(updatedComment);
}

//댓글 삭제하기
async function deleteComment(commentId, password) {

    const existedComment = await commentRepository.findById(commentId);

    if (!existedComment) {
        const error = new Error('존재하지 않습니다.');
        error.name = 'NotFoundError';
        error.code = 404;
        throw error;
    }

    //해당 id를 가진 댓글의 비밀번호와 일치하는지 확인
    const check = await bcrypt.compare(password, existedComment.password);
    if (!check) {
        const error = new Error('비밀번호가 틀렸습니다.');
        error.name = 'ForbiddenError';
        error.code = 403;
        throw error;
    }

    return commentRepository.deleteCommentById(commentId);
}



export default {
    addComment,
    updateComment,
    deleteComment,
    getComment,
}