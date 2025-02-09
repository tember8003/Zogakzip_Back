
import prisma from "../config/prisma.js";

// 배지 생성하기
async function save(badge) {
    return prisma.badge.create({
        data: {
            name: badge.name,
            groupId: badge.groupId,
        }
    });
}

//그룹 아이디 , 이름으로 배지 찾기
async function findByName(name, groupId) {
    return prisma.badge.findFirst({
        where: {
            name: name,
            groupId: groupId,
        },
    });
}

//배지 정보 가져오기
async function getBadges(groupId) {
    return prisma.badge.findMany({
        where: {
            groupId: groupId,
        },
        select: {
            id: false,
            name: true,
            groupId: true,
        }
    });
}

export default {
    save,
    findByName,
    getBadges,
}