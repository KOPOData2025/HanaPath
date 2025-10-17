export namespace AttendanceDto {
  export interface AttendanceResponse {
    id?: number
    userId?: number
    attendanceDate?: string
    pointsEarned?: number
    bonusMultiplier?: number
    message?: string
  }

  export interface MonthlyAttendanceResponse {
    year: number
    month: number
    attendedDays: number[]
    totalPoints: number
    consecutiveDays: number
    todayAttended: boolean
  }

  export interface AttendanceStatsResponse {
    totalAttendanceDays: number
    currentMonthPoints: number
    consecutiveDays: number
    totalPoints: number
  }

  export interface CheckInRequest {
    userId: number
  }
} 