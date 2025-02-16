import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

//게시글 등록(닉네임, 제목, 이미지<한장>,본문,태그, 장소, 추억의 순간, 추억공개여부, 비밀번호 입력)
async function createPost(post, groupId) {
	const hashedPassword = await bcrypt.hash(post.password, 10);
	const tags = Array.isArray(post.tags) ? post.tags : [];

	return prisma.$transaction(async (prisma) => {
		// 1️⃣ 기존 태그 조회
		const existingTags = await prisma.tag.findMany({
			where: { name: { in: tags } }
		});

		// 2️⃣ 없는 태그 생성
		const existingTagNames = existingTags.map(tag => tag.name);
		const newTags = tags.filter(tagName => !existingTagNames.includes(tagName));

		const createdTags = await Promise.all(
			newTags.map(tagName => prisma.tag.create({ data: { name: tagName } }))
		);

		// 3️⃣ 모든 태그 합치기
		const allTags = [...existingTags, ...createdTags];

		// 4️⃣ Post 생성
		const createdPost = await prisma.post.create({
			data: {
				nickname: post.nickname,
				title: post.title,
				imageUrl: post.imageUrl || null,
				content: post.content,
				likeCount: 0,
				commentCount: 0,
				location: post.location,
				moment: post.moment,
				isPublic: post.isPublic,
				password: hashedPassword,
				groupId: groupId,
			},
		});

		// 5️⃣ PostTag 중간 테이블에 데이터 삽입
		await prisma.postTag.createMany({
			data: allTags.map(tag => ({
				postId: createdPost.id,
				tagId: tag.id,
			})),
		});

		return createdPost;
	});
}



async function findById(postId) {
	return prisma.post.findUnique({
		where: {
			id: postId,
		},
	});
}

//게시글 수정(비밀번호 입력하여 추억 수정)
async function updatePost(post) {
	const existingPost = await findById(post.id);

	// 게시글 업데이트
	return prisma.post.update({
		where: {
			id: post.id,
		},
		data: {
			nickname: post.nickname || existingPost.nickname,
			content: post.content || existingPost.content,
			title: post.title || existingPost.title,
			imageUrl: post.imageUrl || existingPost.imageUrl,
			//tags: post.tags ?? existingPost.tags,
			location: post.location || existingPost.location,
			isPublic: post.isPublic !== undefined ? post.isPublic : existingPost.isPublic,
		},
	});
}


// 게시글 삭제를 위한 함수
async function deletePostById(postId) {
	const deletedPost = await prisma.post.delete({
		where: {
			id: postId,
		},
	});

	return deletedPost;
}


// 게시글 상세 조회
async function getDetail(postId) {
	return prisma.post.findUnique({
		where: {
			id: postId,
		},
		select: {
			id: true,
			groupId: true,
			nickname: true,
			title: true,
			imageUrl: true,
			content: true,
			tags: true,
			location: true,
			moment: true,
			isPublic: true,
			likeCount: true,
			commentCount: true,
			createdAt: true,
		},
	});
}

//댓글 목록 조회용
async function getComments(skip, take, postId) {
	const comments = await prisma.comment.findMany({
		where: {
			postId: postId,  // postId를 기준으로 댓글 필터링
		},
		skip: skip,  // 페이지 시작 번호
		take: take,  // 페이지 크기
		select: {  // 필요한 필드 선택
			id: true,
			nickname: true,
			content: true,
			createdAt: true,
		},
	});
	return comments;
}

//댓글 개수 세기
async function countComments(postId) {
	const commentCount = await prisma.comment.count({
		where: {
			postId: postId,  // postId를 기준으로 필터링
		},
	});
	return commentCount;
}

// 공감 보내기
async function addLike(postId) {
	return prisma.post.update({
		where: {
			id: postId,
		},
		data: {
			likeCount: {
				increment: 1,
			},
		},
	});
}



//게시글 공개 여부 확인
async function checkPostPublicStatus(postId) {
	const foundPost = await prisma.post.findUnique({
		where: {
			id: postId,
		},
		select: {
			id: true,
			isPublic: true,
		},
	});
	return foundPost;
}

//댓글 달면 commentCount +1
async function plusComment(post) {
	const foundPost = await prisma.post.update({
		where: {
			id: post.id,
		},
		data: {
			commentCount: post.commentCount + 1,
		},
	});
	return foundPost;
}

export default {
	createPost,
	updatePost,
	findById,
	deletePostById,
	getDetail,
	addLike,
	checkPostPublicStatus,
	plusComment,
	countComments,
	getComments,
}