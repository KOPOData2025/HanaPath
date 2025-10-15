import { HanaMoneyDto, HanaMoneyTransactionDto, HanaMoneyTransferRequestDto } from '@/types/hanamoney'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export interface HanaMoneyApiResponse<T> {
  data?: T
  error?: string
}

export const hanaMoneyApi = {
  // 현재 사용자의 하나머니 정보 조회
  async getHanaMoney(): Promise<HanaMoneyApiResponse<HanaMoneyDto>> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }

      const response = await fetch(`${API_BASE_URL}/api/hanamoney/my`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('하나머니 조회 실패:', error)
      return { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }
    }
  },

  // 현재 사용자의 거래 내역 조회 (페이징)
  async getTransactions(
    page: number = 0,
    size: number = 20
  ): Promise<HanaMoneyApiResponse<{ content: HanaMoneyTransactionDto[]; totalElements: number; totalPages: number }>> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hanamoney/my/transactions?page=${page}&size=${size}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('거래 내역 조회 실패:', error)
      return { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }
    }
  },

  // 현재 사용자의 거래 내역 조회 (날짜 범위)
  async getTransactionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<HanaMoneyApiResponse<HanaMoneyTransactionDto[]>> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hanamoney/my/transactions/range?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('날짜 범위 거래 내역 조회 실패:', error)
      return { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }
    }
  },

  // 출석 체크 적립
  async processAttendanceCheck(): Promise<HanaMoneyApiResponse<HanaMoneyTransactionDto>> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }

      const response = await fetch(`${API_BASE_URL}/api/hanamoney/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('출석 체크 처리 실패:', error)
      return { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }
    }
  },

  // 퀴즈 정답 적립
  async processQuizReward(
    quizId: string,
    isCorrect: boolean
  ): Promise<HanaMoneyApiResponse<HanaMoneyTransactionDto>> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hanamoney/quiz-reward?quizId=${quizId}&isCorrect=${isCorrect}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('퀴즈 보상 처리 실패:', error)
      return { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }
    }
  },

  // 뉴스 읽기 적립
  async processNewsReadReward(
    newsId: string
  ): Promise<HanaMoneyApiResponse<HanaMoneyTransactionDto>> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }

      const response = await fetch(
        `${API_BASE_URL}/api/news/${newsId}/reward`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('뉴스 읽기 보상 처리 실패:', error)
      return { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }
    }
  },

  // 스토어 상품 구매
  async processStorePurchase(
    productId: string,
    price: string,
    productName: string
  ): Promise<HanaMoneyApiResponse<HanaMoneyTransactionDto>> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hanamoney/store-purchase?productId=${productId}&price=${price}&productName=${encodeURIComponent(productName)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('스토어 구매 처리 실패:', error)
      return { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }
    }
  },

  // 계좌 이체 처리
  async processAccountTransfer(
    transferRequest: HanaMoneyTransferRequestDto
  ): Promise<HanaMoneyApiResponse<HanaMoneyTransactionDto>> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }

      const response = await fetch(`${API_BASE_URL}/api/hanamoney/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transferRequest),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('계좌 이체 처리 실패:', error)
      return { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }
    }
  },

  // 월별 통계 조회
  async getMonthlyStats(
    year: number,
    month: number
  ): Promise<HanaMoneyApiResponse<any>> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hanamoney/stats/monthly?year=${year}&month=${month}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('월별 통계 조회 실패:', error)
      return { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }
    }
  },
} 