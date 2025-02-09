import prisma from "../config/prisma.js";
import bcrypt from 'bcryptjs';

//id로 댓글 찾기
async function findById(commentId) {
    return prisma.comment.findUnique({
        where: {
            id: commentId,
        },
    });
}

async function getCommentsByPostId(postId) {
    return prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' },
        select: {
            nickname: true,
            content: true,
            createdAt: true,
        },
    });
}

//비밀번호 일치 여부 확인
async function checkPassword(commentid, commentPassword) {
    return prisma.comment.findFirst({
        where: {
            id: commentid,
            password: commentPassword,
        },
    });
}

//댓글 수정
async function updateComment(comment) {
    const existingComment = await findById(comment.id);

    return prisma.comment.update({
        where: {
            id: comment.id
        },
        data: {
            nickname: comment.nickname || existingComment.nickname,
            content: comment.content || existingComment.content,
        },
    });
}

//댓글 생성하기
async function createComment(comment, postId) {
    //비밀번호 해싱 작업
    const hashedPassword = await bcrypt.hash(comment.password, 10);

    return prisma.comment.create({
        data: {
            nickname: comment.nickname,
            password: hashedPassword,
            content: comment.content,
            postId: postId
        },
    });
}

// 댓글 상세 목록 조회용 (id로 검사)
async function getDetail(commentId) {
    return prisma.comment.findUnique({
        where: {
            id: commentId,
        },
        select: {
            nickname: true,
            createdAt: true,
            password: false,
            content: true,
        },
    });
}



//id를 통해 댓글 삭제하기
async function deleteCommentById(commentId) {
    const deletedComment = await prisma.comment.delete({
        where: {
            id: commentId,
        },
    });

    return deletedComment;
}


export default {
    createComment,
    updateComment,
    deleteCommentById,
    checkPassword,
    getDetail,
    getCommentsByPostId,
    findById,
}