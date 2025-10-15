const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export interface QuizDto {
  id: number
  question: string
  points: number
}

export interface QuizStatusDto {
  hasCompletedToday: boolean
  todayQuiz: QuizDto | null
}

export interface QuizAnswerRequestDto {
  quizId: number
  userAnswer: boolean // true = O, false = X
}

export interface QuizAnswerResponseDto {
  isCorrect: boolean
  explanation: string
  difficultTerms: string | null // 어려운 단어 설명 (JSON 문자열)
  earnedPoints: number
  isFirstTimeToday: boolean
}

export const quizApi = {
  // 오늘의 퀴즈 상태 조회
  getTodayQuiz: async (): Promise<QuizStatusDto> => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('인증 토큰이 없습니다.')
    }

    const response = await fetch(`${API_BASE_URL}/api/quiz/today`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || '오늘의 퀴즈 조회에 실패했습니다.')
    }
    
    return response.json()
  },

  // 퀴즈 답변 제출
  submitQuizAnswer: async (request: QuizAnswerRequestDto): Promise<QuizAnswerResponseDto> => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('인증 토큰이 없습니다.')
    }

    const response = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || '퀴즈 답변 제출에 실패했습니다.')
    }
    
    return response.json()
  }
} 