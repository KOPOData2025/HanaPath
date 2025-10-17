import { toast } from "sonner"

export interface AllowanceSchedule {
  id: number
  parentId: number
  parentName: string
  childId: number
  childName: string
  amount: number
  paymentDay: number
  status: string
  lastPaymentDate: string
  nextPaymentDate: string
  createdAt: string
}

export interface CreateAllowanceScheduleRequest {
  parentId?: number // 백엔드에서 자동 설정하므로 선택적
  childId: number
  amount: number
  paymentDay: number
}

export interface UpdateAllowanceScheduleStatusRequest {
  scheduleId: number
  status: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

/**
 * 용돈 스케줄 생성
 */
export async function createAllowanceSchedule(request: CreateAllowanceScheduleRequest): Promise<AllowanceSchedule> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/allowance-schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "용돈 스케줄 생성에 실패했습니다")
    }

    return await response.json()
  } catch (error) {
    console.error("용돈 스케줄 생성 오류:", error)
    throw error
  }
}

/**
 * 부모의 모든 용돈 스케줄 조회
 */
export async function getParentSchedules(): Promise<AllowanceSchedule[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/allowance-schedules/parent`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "용돈 스케줄 조회에 실패했습니다")
    }

    return await response.json()
  } catch (error) {
    console.error("용돈 스케줄 조회 오류:", error)
    throw error
  }
}

/**
 * 자식의 모든 용돈 스케줄 조회
 */
export async function getChildSchedules(childId: number): Promise<AllowanceSchedule[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/allowance-schedules/child/${childId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "용돈 스케줄 조회에 실패했습니다")
    }

    return await response.json()
  } catch (error) {
    console.error("용돈 스케줄 조회 오류:", error)
    throw error
  }
}

/**
 * 용돈 스케줄 상태 업데이트
 */
export async function updateAllowanceScheduleStatus(request: UpdateAllowanceScheduleStatusRequest): Promise<AllowanceSchedule> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/allowance-schedules/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "용돈 스케줄 상태 업데이트에 실패했습니다")
    }

    return await response.json()
  } catch (error) {
    console.error("용돈 스케줄 상태 업데이트 오류:", error)
    throw error
  }
}

/**
 * 용돈 스케줄 삭제 (취소)
 */
export async function deleteAllowanceSchedule(scheduleId: number, userId: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/allowance-schedules/${scheduleId}?userId=${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "용돈 스케줄 삭제에 실패했습니다")
    }
  } catch (error) {
    console.error("용돈 스케줄 삭제 오류:", error)
    throw error
  }
} 