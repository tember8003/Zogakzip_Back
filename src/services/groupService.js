import groupRepository from "../repositories/groupRepository.js";
import badgeRepository from "../repositories/badgeRepository.js";
import bcrypt from 'bcryptjs';

//그룹 생성하기
async function createGroup(group) {
    //같은 이름이 있는지 확인
    const existedGroup = await groupRepository.findByName(group.name);

    //같은 이름의 그룹이 있으면 에러처리
    if (existedGroup) {
        const error = new Error('같은 이름의 그룹이 존재합니다.');
        error.code = 422;
        error.data = { name: group.name };
        throw error;
    }

    const createdGroup = await groupRepository.save(group);
    return filterSensitiveGroupData(createdGroup);
}

//password같은 중요 데이터는 해싱되어 저장되므로 가져오지 않음.
function filterSensitiveGroupData(group) {
    const { password, ...rest } = group;
    return rest;
}

//그룹 수정하기
async function updateGroup(group) {
    //id로 그룹 찾기
    const existedGroup = await groupRepository.findById(group.id);

    //그룹이 존재하지 않으면 에러처리
    if (!existedGroup) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: group.id };
        throw error;
    }

    //해당 id를 가진 그룹의 비밀번호와 일치하는지 확인
    const check = await bcrypt.compare(group.password, existedGroup.password);
    if (!check) {
        const error = new Error('비밀번호가 틀렸습니다.');
        error.name = 'ForbiddenError';
        error.code = 403;
        throw error;
    }

    const updatedGroup = await groupRepository.updateGroup(group);
    return filterSensitiveGroupData(updatedGroup);
}

//그룹 삭제하기
async function deleteGroup(group, password) {
    //id를 통해 그룹 존재 여부 확인
    const existedGroup = await groupRepository.findById(group.id);

    if (!existedGroup) {
        const error = new Error('존재하지 않습니다.');
        error.name = 'NotFoundError';
        error.code = 404;
        throw error;
    }

    //해당 id를 가진 그룹의 비밀번호와 일치하는지 확인
    const check = await bcrypt.compare(password, existedGroup.password);
    if (!check) {
        const error = new Error('비밀번호가 틀렸습니다.');
        error.name = 'ForbiddenError';
        error.code = 403;
        throw error;
    }

    //그룹 삭제
    return groupRepository.deleteGroupById(group);
}

//정렬 기준 선정
function getOrderBy(sortBy) {
    if (sortBy === 'latest') { //최근 기준
        return { createdAt: 'desc' };
    }
    else if (sortBy === 'mostPosted') { //포스트를 많이 올린 순서
        return { postCount: 'desc' };
    }
    else if (sortBy === 'mostLiked') { //좋아요를 많이 받은 순서
        return { likeCount: 'desc' };
    }
    else { //정렬 기준이 없다면? -> 신경 X
        return null;
    }
}

//페이지 목록 조회
async function getList(name, page, pageSize, sortBy, publicCheck) {
    const skip = (page - 1) * pageSize; //페이지 시작 번호
    const take = pageSize; //한 페이지당 그룹 수

    const orderBy = getOrderBy(sortBy); //정렬 기준

    const [groups, totalCount] = await Promise.all([
        groupRepository.getGroups(skip, take, orderBy, name, publicCheck),
        groupRepository.countGroups(name, publicCheck),
    ]); //비동기 병렬 작업으로 그룹 데이터 가져오고 그룹 수 세기

    const totalPages = Math.ceil(totalCount / pageSize); //총 페이지 수

    return { currentPage: page, totalPages: totalPages, totalItemCount: totalCount, data: groups };
}


//그룹 상세 정보 조회
async function getDetail(groupId) {
    const existedGroup = await groupRepository.findById(groupId);

    if (!existedGroup) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: groupId };
        throw error;
    }

    await grantBadge(groupId);

    return await groupRepository.getDetail(existedGroup);;
}

//id를 통해 그룹 찾고, 비밀번호 확인 -> 그룹 조회 권한 확인용
async function verifyPassword(groupId, password) {
    const existedGroup = await groupRepository.findById(groupId);

    if (!existedGroup) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: groupId };
        throw error;
    }

    if (existedGroup.isPublic) {
        return { message: '공개 그룹입니다.' };
    }

    // 저장된 비밀번호와 제공된 비밀번호가 일치하는지 확인
    const check = await bcrypt.compare(password, existedGroup.password);
    if (!check) {
        const error = new Error('비밀번호가 틀렸습니다.');
        error.name = 'ForbiddenError';
        error.code = 403;
        throw error;
    }
    return { message: '비밀번호가 확인되었습니다.' };
}

//그룹 공감 누르기
async function pushLike(groupId) {
    const existedGroup = await groupRepository.findById(groupId);

    if (!existedGroup) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: groupId };
        throw error;
    }

    //그룹 공감 1만 개 이상이면 배지 주기
    const likeCount = checkLike(existedGroup);
    if (likeCount) {
        const name = "그룹 공감 1만개 이상";
        const existedBadge = await badgeRepository.findByName(name, groupId);

        if (!existedBadge) {
            await badgeRepository.save({ name: name, groupId: groupId });
        }
    }

    return await groupRepository.pushLike(existedGroup);
}

//그룹 공개 여부 확인용
async function getPublic(groupId) {
    const group = await groupRepository.getPublic(groupId);

    if (!group) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: groupId };
        throw error;
    }

    return group;
}

//배지 수여하기
async function grantBadge(groupId) {
    const existedGroup = await groupRepository.findById(groupId);

    if (!existedGroup) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: groupId };
        throw error;
    }

    //그룹 생성 후 1년 배지
    const oneYearLater = checkYear(existedGroup);
    if (oneYearLater) {
        const name = "그룹 생성 후 1년 달성";
        const existedBadge = await badgeRepository.findByName(name, groupId);

        if (!existedBadge) {
            await badgeRepository.save({ name: name, groupId: groupId });
        }
    }

    //그룹 공감 1만 개 이상
    const likeCount = checkLike(existedGroup);
    if (likeCount) {
        const name = "그룹 공감 1만개 이상";
        const existedBadge = await badgeRepository.findByName(name, groupId);

        if (!existedBadge) {
            await badgeRepository.save({ name: name, groupId: groupId });
        }
    }

    //추억 수 20개 이상
    const postCount = checkPost(existedGroup);
    if (postCount) {
        const name = "추억 수 20개 이상 등록";
        const existedBadge = await badgeRepository.findByName(name, groupId);

        if (!existedBadge) {
            await badgeRepository.save({ name: name, groupId: groupId });
        }
    }

    await groupRepository.updateBadgeCount(groupId);
}

function checkPost(group) {
    const postCount = group.postCount;
    if (postCount >= 20) {
        return true;
    }
    else {
        return false;
    }
}

function checkLike(group) {
    const likeCount = group.likeCount;
    if (likeCount >= 10000) {
        return true;
    }
    else {
        return false;
    }
}

function checkYear(group) {
    const currentDate = new Date();
    const createdAt = group.createdAt;

    const oneYear = new Date(createdAt);

    //생성 날짜로부터 1년 추가
    oneYear.setFullYear(oneYear.getFullYear() + 1);

    //만약 1년 추가한 후 현재 날짜가 생성 날짜보다 크다면 1년보다 크므로 true
    if (currentDate >= oneYear) {
        return true;
    }
    else {
        return false;
    }
}

export default {
    createGroup,
    getList,
    updateGroup,
    deleteGroup,
    getDetail,
    verifyPassword,
    pushLike,
    getPublic,
}