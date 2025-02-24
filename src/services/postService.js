import postRepository from '../repositories/postRepository.js';
import groupRepository from '../repositories/groupRepository.js';

import bcrypt from 'bcryptjs';

//게시글 생성하기
async function createPost(post, groupId) {
    //id로 게시글 찾기
    const existedGroup = await groupRepository.findById(groupId);

    console.log(post);

    //그룹이 존재하지 않으면 에러처리
    if (!existedGroup) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: groupId };
        throw error;
    }

    console.log("DB 저장된 해시된 비밀번호:", existedGroup.password);
    console.log("입력된 비밀번호:", post.password);

    const check = await bcrypt.compare(post.password, existedGroup.password);
    if (!check) {
        const error = new Error('비밀번호가 틀렸습니다.');
        error.name = 'ForbiddenError';
        error.code = 403;
        throw error;
    }

    const createdPost = await postRepository.createPost(post, groupId);
    groupRepository.plusPost(existedGroup);
    return filterSensitiveGroupData(createdPost);
}

//password같은 중요 데이터는 해싱되어 저장되므로 가져오지 않음.
function filterSensitiveGroupData(post) {
    if (!post) {
		throw new Error("Post data is undefined");
	}
    const { password, ...rest } = post;
    return rest;
}

//게시글 수정하기
async function updatePost(post) {
    const existedPost = await postRepository.findById(post.id);

    //게시글이 존재하지 않으면 에러처리
    if (!existedPost) {
        console.log("존재 X");
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: post.id };
        throw error;
    }

    //해당 id를 가진 게시글의 비밀번호와 일치하는지 확인
    const check = await bcrypt.compare(post.password, existedPost.password);
    if (!check) {
        const error = new Error('비밀번호가 틀렸습니다.');
        error.name = 'ForbiddenError';
        error.code = 403;
        throw error;
    }

    const updatedPost = await postRepository.updatePost(post);
    return filterSensitiveGroupData(updatedPost);
}

//게시글 삭제하기
async function deletePost(postId, password) {
    //id를 통해 게시글 존재 여부 확인
    const existedPost = await postRepository.findById(postId);

    if (!existedPost) {
        const error = new Error('존재하지 않습니다.');
        error.name = 'NotFoundError';
        error.code = 404;
        throw error;
    }

    //해당 id를 가진 게시글의 비밀번호와 일치하는지 확인
    const check = await bcrypt.compare(password, existedPost.password);
    if (!check) {
        const error = new Error('비밀번호가 틀렸습니다.');
        error.name = 'ForbiddenError';
        error.code = 403;
        throw error;
    }

    //게시글 삭제
    return postRepository.deletePostById(postId);
}

//정렬 기준 선정
function getOrderBy(sortBy) {
    if (sortBy === 'latest') {
        return { createdAt: 'desc' };
    } else if (sortBy === 'comments') {
        return { commentCount: 'desc' };
    } else if (sortBy === 'likes') {
        return { likeCount: 'desc' };
    } else {
        return { createdAt: 'desc' }; // 기본 정렬: 최신순
    }
}

//페이지 목록 조회
async function getPosts(name, page, pageSize, sortBy, publicCheck, groupId) {
    const existedGroup = await groupRepository.findById(groupId);

    //게시글이 존재하지 않으면 에러처리
    if (!existedGroup) {
        console.log("존재 X");
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: groupId };
        throw error;
    }

    const skip = (page - 1) * pageSize; //페이지 시작 번호
    const take = pageSize; //한 페이지당 게시글 수

    const orderBy = getOrderBy(sortBy); //정렬 기준

    const [posts, totalCount] = await Promise.all([
        groupRepository.getPosts(skip, take, orderBy, name, publicCheck, groupId),
        groupRepository.countPosts(name, publicCheck, groupId),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize); //총 페이지 수

    return { currentPage: page, totalPages: totalPages, totalItemCount: totalCount, data: posts };
}


//게시글 상세 정보 조회
async function getDetail(postId) {
    const existedPost = await postRepository.findById(postId);

    if (!existedPost) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: postId };
        throw error;
    }

    existedPost.commentCount = await postRepository.countComments(postId);

    return await postRepository.getDetail(postId);
}

//id를 통해 게시글 찾고, 비밀번호 확인 -> 게시글 조회 권한 확인용
async function verifyPassword(postId, password) {
    const existedPost = await postRepository.findById(postId);

    if (!existedPost) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: postId };
        throw error;
    }

    if (existedPost.isPublic) {
        return { message: '공개 그룹입니다.' };
    }

    // 저장된 비밀번호와 제공된 비밀번호가 일치하는지 확인
    const check = await bcrypt.compare(password, existedPost.password);
    if (!check) {
        const error = new Error('비밀번호가 틀렸습니다.');
        error.name = 'ForbiddenError';
        error.code = 403;
        throw error;
    }
    return { message: '비밀번호가 확인되었습니다.' };
}

//게시글 공감 누르기
async function pushLike(postId) {
    const existedPost = await groupRepository.findById(postId);

    if (!existedPost) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: postId };
        throw error;
    }

    //추억 공감 1만 개 이상이면 배지 주기
    const likeCount = postLike(existedPost);
    if (likeCount) {
        const name = "추억 공감 1만개 이상";
        const existedBadge = await badgeRepository.findByName(name, existedPost.groupId);

        if (!existedBadge) {
            await badgeRepository.save({ name: name, groupId: existedPost.groupId });
        }
    }

    return await postRepository.addLike(postId);
}

function postLike(existedPost) {
    const postLike = existedPost.likeCount;
    if (postLike >= 10000) {
        return true;
    }
    else {
        return false;
    }
}

//게시글 공개 여부 확인용
async function getPublicStatus(postId) {
    const existedPost = await postRepository.checkPostPublicStatus(postId);

    if (!existedPost) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: postId };
        throw error;
    }

    return existedPost;
}


export default {
    createPost,
    getPosts,
    updatePost,
    deletePost,
    getDetail,
    verifyPassword,
    pushLike,
    getPublicStatus,
}