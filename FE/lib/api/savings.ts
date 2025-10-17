import axios from "axios";

// axios 인스턴스 생성 (공통 설정)
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
        console.error("Savings API Error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export interface SavingsGoal {
  id: number
  name: string
  memo?: string
  targetAmount: number
  currentAmount: number
  startDate: string
  targetDate: string
  paymentDay: number
  monthlyTarget: number
  category: string
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED'
  createdAt: string
  updatedAt: string
  progressPercentage: number
  remainingAmount: number
  completed: boolean
  daysLeft: number
}

export interface CreateSavingsGoalRequest {
  name: string
  memo?: string
  targetAmount: number
  targetDate: string
  paymentDay: number
  category: string
}

export interface SavingsTransaction {
  id: number
  savingsGoalId: number
  savingsGoalName: string
  amount: number
  transactionDate: string
  memo?: string
  type: 'DEPOSIT' | 'WITHDRAWAL'
  createdAt: string
}

// 사용자의 모든 목표 조회
export const getSavingsGoals = async (userId: number): Promise<SavingsGoal[]> => {
  const response = await api.get(`/api/savings/goals/${userId}`)
  return response.data
}

// 사용자의 활성 목표 조회
export const getActiveSavingsGoals = async (userId: number): Promise<SavingsGoal[]> => {
  const response = await api.get(`/api/savings/goals/${userId}/active`)
  return response.data
}

// 목표 상세 조회
export const getSavingsGoal = async (userId: number, goalId: number): Promise<SavingsGoal> => {
  const response = await api.get(`/api/savings/goals/${userId}/${goalId}`)
  return response.data
}

// 목표 생성
export const createSavingsGoal = async (userId: number, request: CreateSavingsGoalRequest): Promise<SavingsGoal> => {
  const response = await api.post(`/api/savings/goals/${userId}`, request)
  return response.data
}

// 목표 삭제
export const deleteSavingsGoal = async (userId: number, goalId: number): Promise<void> => {
  await api.delete(`/api/savings/goals/${userId}/${goalId}`)
}

// 사용자의 저축 거래 내역 조회
export const getSavingsTransactions = async (userId: number): Promise<SavingsTransaction[]> => {
  const response = await api.get(`/api/savings/transactions/${userId}`)
  return response.data
}

// 특정 목표의 거래 내역 조회
export const getSavingsGoalTransactions = async (userId: number, goalId: number): Promise<SavingsTransaction[]> => {
  const response = await api.get(`/api/savings/goals/${userId}/${goalId}/transactions`)
  return response.data
} 