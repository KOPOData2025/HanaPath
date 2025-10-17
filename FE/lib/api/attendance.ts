import { AttendanceDto } from '../../types/attendance'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export const attendanceApi = {
  // 출석체크
  checkIn: async (userId: number): Promise<AttendanceDto.AttendanceResponse> => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('인증 토큰이 없습니다.')
    }

    const response = await fetch(`${API_BASE_URL}/api/attendance/check-in?userId=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || '출석체크에 실패했습니다.')
    }
    
    return response.json()
  },

  // 월별 출석 데이터 조회
  getMonthlyAttendance: async (userId: number, year?: number, month?: number): Promise<AttendanceDto.MonthlyAttendanceResponse> => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('인증 토큰이 없습니다.')
    }

    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (month) params.append('month', month.toString())
    
    const response = await fetch(`${API_BASE_URL}/api/attendance/monthly/${userId}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || '월별 출석 데이터 조회에 실패했습니다.')
    }
    
    return response.json()
  },

  // 출석 통계 조회
  getAttendanceStats: async (userId: number): Promise<AttendanceDto.AttendanceStatsResponse> => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('인증 토큰이 없습니다.')
    }

    const response = await fetch(`${API_BASE_URL}/api/attendance/stats/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || '출석 통계 조회에 실패했습니다.')
    }
    
    return response.json()
  },

  // 오늘 출석 여부 확인
  checkTodayAttendance: async (userId: number): Promise<boolean> => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('인증 토큰이 없습니다.')
    }

    const response = await fetch(`${API_BASE_URL}/api/attendance/today/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || '오늘 출석 여부 확인에 실패했습니다.')
    }
    
    return response.json()
  },
} 