import axios from 'axios'

// axios 인스턴스 생성 (공통 설정)
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터: JWT 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터: 에러 로깅 및 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

/**
 * 챗봇 운세 요청 인터페이스
 */
export interface FortuneRequest {
  userId: number
  zodiacSign: string
  birthDate: string
}

/**
 * 챗봇 운세 응답 인터페이스
 */
export interface FortuneResponse {
  todayFortune: string
  moneyFortune: string
  luckyColor: string
  luckyItem: string
  luckyNumber: string
  luckyTime: string
  luckyMessage: string
  zodiacSign: string
  zodiacEmoji: string
}

/**
 * 금융 단어 요청 인터페이스
 */
export interface FinancialWordRequest {
  userId: number
  userAge: number
  category?: string
}

/**
 * 금융 단어 응답 인터페이스
 */
export interface FinancialWordResponse {
  word: string
  pronunciation: string
  definition: string
  example: string
  category: string
  difficulty: string
  tip: string
  relatedWords: string
}

/**
 * 챗봇 API 클래스
 * 챗봇 관련 API 호출을 담당
 */
export class ChatbotApi {
  private static readonly BASE_URL = '/api/chatbot'

  /**
   * 오늘의 운세 생성 API 호출
   * 
   * @param request 운세 요청 정보
   * @returns 생성된 운세 정보
   */
  static async generateFortune(request: FortuneRequest): Promise<FortuneResponse> {
    try {
      console.log('🔮 운세 API 호출 시작:', request)
      console.log('🔮 API URL:', `${this.BASE_URL}/fortune`)
      
      const response = await apiClient.post<FortuneResponse>(
        `${this.BASE_URL}/fortune`,
        request
      )
      
      console.log('✅ 운세 API 호출 성공:', response.data)
      return response.data
      
    } catch (error: any) {
      console.error('❌ 운세 API 호출 실패:', error)
      console.error('❌ 에러 상세:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      })
      throw new Error(`운세 생성에 실패했습니다: ${error.message}`)
    }
  }

  /**
   * 금융 단어 생성 API 호출
   * 
   * @param request 금융 단어 요청 정보
   * @returns 생성된 금융 단어 정보
   */
  static async generateFinancialWord(request: FinancialWordRequest): Promise<FinancialWordResponse> {
    try {
      console.log('📚 금융 단어 API 호출 시작:', request)
      console.log('📚 API URL:', `${this.BASE_URL}/financial-word`)
      
      const response = await apiClient.post<FinancialWordResponse>(
        `${this.BASE_URL}/financial-word`,
        request
      )
      
      console.log('✅ 금융 단어 API 호출 성공:', response.data)
      return response.data
      
    } catch (error: any) {
      console.error('❌ 금융 단어 API 호출 실패:', error)
      console.error('❌ 에러 상세:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      })
      throw new Error(`금융 단어 생성에 실패했습니다: ${error.message}`)
    }
  }

  /**
   * 챗봇 서비스 상태 확인 API 호출
   * 
   * @returns 서비스 상태 메시지
   */
  static async healthCheck(): Promise<string> {
    try {
      const response = await apiClient.get<string>(`${this.BASE_URL}/health`)
      return response.data
    } catch (error) {
      console.error('❌ 챗봇 헬스체크 실패:', error)
      throw new Error('챗봇 서비스 상태 확인에 실패했습니다.')
    }
  }
}
