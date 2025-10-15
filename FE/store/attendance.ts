import { create } from 'zustand'

interface AttendanceState {
  consecutiveDays: number
  setConsecutiveDays: (days: number) => void
  refreshStats: () => void
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  consecutiveDays: 0,
  setConsecutiveDays: (days) => set({ consecutiveDays: days }),
  refreshStats: () => {
    // 이 함수는 DashboardPage에서 구현될 예정
    // 여기서는 플레이스홀더로만 정의
  },
})) 