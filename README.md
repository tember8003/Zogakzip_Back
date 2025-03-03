# 조각집

### 코드잇 부스트 1기 백엔드 프로젝트입니다!

- 제목: 조각집
- 소개: 기억 저장 및 공유 서비스

## 📆프로젝트 기간
**24.08.04-24.09.07 + 25.01.24-25.03.02 (오류 수정)**

## 📖기술 스택
## 🚀 Tech Stack & Tools

### 📌 Stacks  
| 기술 | 설명 |
|------|------|
| ![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat-square&logo=html5&logoColor=white) | HTML |
| ![CSS](https://img.shields.io/badge/CSS(SCSS)-1572B6?style=flat-square&logo=css3&logoColor=white) | CSS(SCSS) |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) | JavaScript |
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white) | Node.js |
| ![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white) | Express.js |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white) | PostgreSQL |

### 🔧 Tools  
| 도구 | 설명 |
|------|------|
| ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) | Git |

### 🤝 Collaboration  
| 도구 | 설명 |
|------|------|
| ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white) | GitHub |
| ![Notion](https://img.shields.io/badge/Notion-000000?style=flat-square&logo=notion&logoColor=white) | Notion |
| ![Discord](https://img.shields.io/badge/Discord-5865F2?style=flat-square&logo=discord&logoColor=white) | Discord |

## 📌 API 명세

### 🟦 그룹 API
| 메소드  | URI                                   | 기능                  |
|---------|--------------------------------------|----------------------|
| <span style="color:#FF5733;"><b>POST</b></span>  | `/api/groups`                           | 그룹 등록             |
| <span style="color:#3498DB;"><b>GET</b></span>   | `/api/groups`                           | 그룹 목록 조회        |
| <span style="color:#F39C12;"><b>PUT</b></span>   | `/api/groups/{groupId}`                 | 그룹 수정             |
| <span style="color:#E74C3C;"><b>DELETE</b></span> | `/api/groups/{groupId}`                 | 그룹 삭제             |
| <span style="color:#3498DB;"><b>GET</b></span>   | `/api/groups/{groupId}`                 | 그룹 상세 정보 조회   |
| <span style="color:#FF5733;"><b>POST</b></span>  | `/api/groups/{groupId}/verify-password` | 그룹 조회 권한 확인   |
| <span style="color:#FF5733;"><b>POST</b></span>  | `/api/groups/{groupId}/like`            | 그룹 공감하기         |
| <span style="color:#3498DB;"><b>GET</b></span>   | `/api/groups/{groupId}/is-public`       | 그룹 공개 여부 확인   |

### 🟩 게시글 API
| 메소드  | URI                                   | 기능                  |
|---------|--------------------------------------|----------------------|
| <span style="color:#FF5733;"><b>POST</b></span>  | `/api/groups/{groupId}/posts`           | 게시글 등록           |
| <span style="color:#3498DB;"><b>GET</b></span>   | `/api/groups/{groupId}/posts`           | 게시글 목록 조회      |
| <span style="color:#F39C12;"><b>PUT</b></span>   | `/api/posts/{postId}`                   | 게시글 수정           |
| <span style="color:#E74C3C;"><b>DELETE</b></span> | `/api/posts/{postId}`                   | 게시글 삭제           |
| <span style="color:#3498DB;"><b>GET</b></span>   | `/api/posts/{postId}`                   | 게시글 상세 정보 조회 |
| <span style="color:#FF5733;"><b>POST</b></span>  | `/api/posts/{postId}/verify-password`   | 게시글 조회 권한 확인 |
| <span style="color:#FF5733;"><b>POST</b></span>  | `/api/posts/{postId}/like`              | 게시글 공감하기       |
| <span style="color:#3498DB;"><b>GET</b></span>   | `/api/posts/{postId}/is-public`         | 게시글 공개 여부 확인 |

### 🟨 댓글 API
| 메소드  | URI                                   | 기능                  |
|---------|--------------------------------------|----------------------|
| <span style="color:#FF5733;"><b>POST</b></span>  | `/api/posts/{postId}/comments`          | 댓글 등록             |
| <span style="color:#3498DB;"><b>GET</b></span>   | `/api/posts/{postId}/comments`          | 댓글 목록 조회        |
| <span style="color:#F39C12;"><b>PUT</b></span>   | `/api/comments/{commentId}`             | 댓글 수정             |
| <span style="color:#E74C3C;"><b>DELETE</b></span> | `/api/comments/{commentId}`             | 댓글 삭제             |

### 🟧 이미지 API
| 메소드  | URI                                   | 기능                  |
|---------|--------------------------------------|----------------------|
| <span style="color:#FF5733;"><b>POST</b></span>  | `/api/image`                            | 이미지 URL 생성       |

=======
## ERD (prisma-erd-generator)
<img src="https://github.com/user-attachments/assets/59643b90-0d7c-4d4e-8b0b-0b47409f2387" width="600px">


## 기본 실행 예시

### **메인 페이지**
<img src="https://github.com/user-attachments/assets/f688d7ad-4b90-43bf-85ee-0aeee314bf78" width="500px">

### **그룹 등록**
<img src="https://github.com/user-attachments/assets/9b72aab5-6310-4251-ab8c-7c90093c88ad" width="400px">
<img src="https://github.com/user-attachments/assets/c4b08ca6-40ec-4cd2-91aa-690507f0b89b" width="400px">

### **게시글 등록**
<img src="https://github.com/user-attachments/assets/89a6d74f-47cb-4d25-a825-184870577d48" width="500px">

### **댓글 등록**
<img src="https://github.com/user-attachments/assets/36da6582-3044-459c-b04d-01020656c5fc" width="450px">


