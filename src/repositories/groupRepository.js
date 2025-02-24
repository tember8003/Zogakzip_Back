import prisma from "../config/prisma.js";
import postRepository from "./postRepository.js";
import bcrypt from 'bcryptjs';

//이름으로 그룹 찾기
async function findByName(name) {
    return prisma.group.findUnique({
        where: {
            name,
        },
    });
}

//id로 그룹 찾기
async function findById(groupid) {
    return prisma.group.findUnique({
        where: {
            id: groupid,
        },
    });
}

//그룹 상세 목록 조회용 (id로 검사)
async function getDetail(group) {
    return prisma.group.findUnique({
        where: {
            id: group.id,
        },
        select: {
            id: true,
            name: true,
            isPublic: true,
            imageUrl: true,
            likeCount: true,
            Badge: {
                select: {
                    //공개 범위 id 제외용
                    name: true,
                }
            },
            postCount: true,
            createdAt: true,
            password: false, // password 필드 제외
            introduction: true,
        },
    });
}

//비밀번호 일치 여부 확인
async function checkPassword(groupid, groupPassword) {
    return prisma.group.findFirst({
        where: {
            id: groupid,
            password: groupPassword,
        },
    });
}

//그룹 수정
async function updateGroup(group) {
    const existingGroup = await findById(group.id);

    return prisma.group.update({
        where: {
            id: group.id
        },
        data: {
            name: group.name || existingGroup.name,
            imageUrl: group.imageUrl || existingGroup.imageUrl,
            isPublic: group.isPublic !== undefined ? group.isPublic : existingGroup.isPublic,
            introduction: group.introduction || existingGroup.introduction,
        },
    });
}


//그룹 생성하기
async function save(group) {
    //비밀번호 해싱 작업
    const hashedPassword = await bcrypt.hash(group.password, 10);

    const groupData = await prisma.group.create({
        data: {
            name: group.name,
            password: hashedPassword,
            isPublic: group.isPublic,
            imageUrl: group.imageUrl,
            likeCount: 0,
            postCount: 0,
            badgeCount: 0,
            introduction: group.introduction,
        },
    });
    return groupData;
}

//그룹 목록 조회용 조건에 맞게 그룹 찾기
async function getGroups(pageSkip, pageTake, orderBy, name, publicCheck) {
    const groups = await prisma.group.findMany({
        where: {
            isPublic: publicCheck,
            ...(name && { name: { contains: name } })
            //조건 선택으로 where절 조회하기
            //-> name 변수가 존재하고, 그룹 이름에 name이 포함되어 있으면 where절 포함
            //반대로 둘 중 하나라도 false인 경우엔 where절에 포함되지 않음 -> 이름을 통한 검색 X
        },
        orderBy: orderBy || undefined,
        skip: pageSkip, //시작 페이지 번호
        take: pageTake, //한 페이지당 나타날 그룹 수 
        select: {
            id: true,
            name: true,
            isPublic: true,
            likeCount: true,
            postCount: true,
            badgeCount: true,
            createdAt: true,
            password: false, // password 필드 제외
            introduction: true,
        },
    });
    return groups;
}

//게시글 목록 조회용
async function getPosts(skip, take, orderBy, name, publicCheck, groupId) {
    const posts = await prisma.post.findMany({
        where: {
            groupId: groupId, // 그룹 ID로 필터링
            isPublic: publicCheck, // 공개 여부 필터링
            ...(name && {
                title: { contains: name }, // 제목에 name 포함된 게시글 조회
            }),
        },
        orderBy: orderBy || undefined, // 정렬 옵션
        skip: skip, // 페이지 시작 번호
        take: take, // 페이지 크기
        include: { // ✅ `tags` 필드에 연결된 `tag.name` 가져오기
            tags: {
                include: {
                    tag: true, // ✅ `tag` 객체 전체 포함
                },
            },
        },
    });


    // ✅ `tags` 배열을 가공하여 `{ id, title, ..., tags: ["태그1", "태그2"] }` 형태로 변환
    return posts.map(post => ({
        id: post.id,
        nickname: post.nickname,
        title: post.title,
        imageUrl: post.imageUrl,
        location: post.location,
        moment: post.moment,
        isPublic: post.isPublic,
        likeCount: post.likeCount,
        commentCount: postRepository.countComments(post.id),
        createdAt: post.createdAt,
        tags: post.tags.map(tag => tag.tag.name), // ✅ `tag` 객체에서 `name`만 추출
    }));
}



//그룹 수 세기
async function countGroups(name, publicCheck) {
    const groups = prisma.group.count({
        where: {
            isPublic: publicCheck,
            ...(name & { name: { contains: name } }),
        },
    });
    return groups;
}

//게시글 개수 세기
async function countPosts(name, publicCheck, groupId) {
    const postCount = await prisma.post.count({
        where: {
            groupId: groupId, // 그룹 ID로 필터링
            isPublic: publicCheck, // 공개 여부 필터링
            ...(name && { // name 필터링이 있을 때만 적용
                title: {
                    contains: name, // 제목에 name을 포함하는 게시물만 조회
                },
            }),
        },
    });
    return postCount;
}


// 그룹 삭제 함수
async function deleteGroupById(group) {
	return await prisma.$transaction(async (prisma) => {
		// 1️⃣ 해당 그룹의 게시글 ID 목록 가져오기
		const posts = await prisma.post.findMany({
			where: { groupId: group.id },
			select: { id: true },
		});

		const postIds = posts.map(post => post.id);

		if (postIds.length > 0) {
			// 2️⃣ 게시글에 달린 댓글 삭제
			await prisma.comment.deleteMany({
				where: { postId: { in: postIds } },
			});

			// 3️⃣ 게시글 태그 연결 (`PostTag` 테이블) 삭제
			await prisma.postTag.deleteMany({
				where: { postId: { in: postIds } },
			});

			// 4️⃣ 게시글 삭제
			await prisma.post.deleteMany({
				where: { id: { in: postIds } },
			});
		}

		// 5️⃣ 그룹 삭제
		await prisma.group.delete({
			where: { id: group.id },
		});
	});
}


//그룹 공감 누르기
async function pushLike(group) {
    const likeGroup = await prisma.group.update({
        where: {
            id: group.id,
        },
        data: {
            likeCount: group.likeCount + 1,
        },
    });
    return likeGroup;
}

//배지 카운트 업데이트하기
async function updateBadgeCount(groupId) {
    const findCount = await prisma.badge.count({
        where: {
            groupId: groupId
        },
    });

    const updateCount = await prisma.group.update({
        where: {
            id: groupId
        },
        data: {
            badgeCount: findCount,
        },
    });

    return updateCount;
}


//공개 그룹인 그룹 가져오기
async function getPublic(groupId) {
    const foundGroup = await prisma.group.findUnique({
        where: {
            id: groupId,
        },
        select: {
            id: true,
            isPublic: true,
        },
    });
    return foundGroup;
}

//게시글 올리면 postCount + 1
async function plusPost(group) {
    const foundGroup = await prisma.group.update({
        where: {
            id: group.id,
        },
        data: {
            postCount: group.postCount + 1,
        },
    });
    return foundGroup;
}


export default {
    findByName,
    save,
    getDetail,
    getGroups,
    countGroups,
    updateGroup,
    findById,
    deleteGroupById,
    checkPassword,
    pushLike,
    getPublic,
    updateBadgeCount,
    plusPost,
    getPosts,
    countPosts,
}