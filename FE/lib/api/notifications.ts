import axios from "axios";

// axios 인스턴스 생성
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// 요청 인터셉터: JWT 토큰 자동 첨부
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
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

export interface Notification {
  id: number
  title: string
  description: string
  type: string
  category: string
  isRead: boolean
  createdAt: string
  timeAgo: string
  relatedData?: string
}

export interface NotificationResponse {
  count: number
}

/**
 * 사용자별 알림 조회
 */
export const getNotifications = async (userId: number): Promise<Notification[]> => {
  const response = await api.get(`/api/notifications/${userId}`)
  return response.data
}

/**
 * 사용자별 미읽은 알림 조회
 */
export const getUnreadNotifications = async (userId: number): Promise<Notification[]> => {
  const response = await api.get(`/api/notifications/${userId}/unread`)
  return response.data
}

/**
 * 사용자별 카테고리별 알림 조회
 */
export const getNotificationsByCategory = async (userId: number, category: string): Promise<Notification[]> => {
  const response = await api.get(`/api/notifications/${userId}/category/${category}`)
  return response.data
}

/**
 * 알림 읽음 처리
 */
export const markNotificationAsRead = async (notificationId: number, userId: number): Promise<void> => {
  await api.put(`/api/notifications/${notificationId}/read?userId=${userId}`)
}

/**
 * 모든 알림 읽음 처리
 */
export const markAllNotificationsAsRead = async (userId: number): Promise<void> => {
  await api.put(`/api/notifications/${userId}/read-all`)
}

/**
 * 미읽은 알림 개수 조회
 */
export const getUnreadNotificationCount = async (userId: number): Promise<number> => {
  const response = await api.get(`/api/notifications/${userId}/unread-count`)
  return response.data.count
}
