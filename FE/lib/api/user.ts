// lib/api/user.ts

import axios from "axios";

// axios 인스턴스 생성 (공통 설정)
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true, // 쿠키 전송 허용 (필요한 경우)
    headers: {
        "Content-Type": "application/json",
    },
});

// 요청 인터셉터: JWT 토큰 자동 첨부
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    console.log("API 요청 - URL:", config.url, "토큰:", token ? "있음" : "없음");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 응답 인터셉터: 에러 로깅 및 처리
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// 회원가입
export async function signup(formData: {
    userType: "TEEN" | "PARENT";
    name: string;
    nationalIdFront: string;
    nationalIdBackFirst: string;
    email: string;
    password: string;
    phone: string;
    termsAgreed: boolean;
}) {
    const res = await api.post("/api/users/signup", formData);
    return res.data; // "회원가입 성공"
}

// 로그인
export async function login(email: string, password: string) {
    const res = await api.post("/api/users/login", { email, password });
    return res.data; // { user: UserResponseDto, token: string } 반환
}

// 이메일 중복 확인
export async function checkEmailDuplicate(email: string): Promise<boolean> {
    console.log("🔍 API 호출 - 이메일 중복 확인:", email);
    const res = await api.get(`/api/users/check-email`, {
        params: { email },
    });
    console.log("📧 API 응답 - 이메일 중복 확인:", res.data);
    return res.data; // true or false
}

// 전화번호 중복 확인
export async function checkPhoneDuplicate(phone: string): Promise<boolean> {
    const res = await api.get(`/api/users/check-phone`, {
        params: { phone },
    });
    return res.data; // true or false
}

// 닉네임 중복 확인
export async function checkNicknameDuplicate(nickname: string): Promise<boolean> {
    const res = await api.get(`/api/users/check-nickname`, {
        params: { nickname },
    });
    return res.data; // true or false
}

// 사용자 정보 조회
export async function getUserInfo(userId: number) {
    const res = await api.get(`/api/users/${userId}`);
    return res.data;
}

// 사용자 정보 업데이트
export async function updateUser(userId: number, userData: { nickname?: string; phone?: string }) {
    const res = await api.put(`/api/users/${userId}`, userData);
    return res.data;
}

// 관계 요청 생성
export async function createRelationship(userId: number, relationshipData: {
    receiverPhone: string;
    type: "PARENT_CHILD" | "SIBLING" | "FRIEND";
    message?: string;
}) {
    const res = await api.post(`/api/users/${userId}/relationships`, relationshipData);
    return res.data;
}

// 받은 관계 요청 목록 조회
export async function getReceivedRequests(userId: number) {
    const res = await api.get(`/api/users/${userId}/relationships/received`);
    return res.data;
}

// 보낸 관계 요청 목록 조회
export async function getSentRequests(userId: number) {
    const res = await api.get(`/api/users/${userId}/relationships/sent`);
    return res.data;
}

// 모든 관계 조회
export async function getAllRelationships(userId: number) {
    const res = await api.get(`/api/users/${userId}/relationships`);
    return res.data;
}

// 관계 요청 상태 업데이트 (승인/거절)
export async function updateRelationshipStatus(userId: number, relationshipId: number, status: "ACCEPTED" | "REJECTED") {
    const res = await api.put(`/api/users/${userId}/relationships/status`, {
        relationshipId,
        status
    });
    return res.data;
}

// 관계 삭제
export async function deleteRelationship(userId: number, relationshipId: number) {
    const res = await api.delete(`/api/users/${userId}/relationships/${relationshipId}`);
    return res.data;
}

// 자녀 목록 조회 (부모 유저용)
export async function getChildrenList(userId: number) {
    const res = await api.get(`/api/users/${userId}/children`);
    return res.data;
}
