"use client"

import { Bell, Users, Gift, PiggyBank, X, Mails } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth"
import { 
  getNotifications, 
  getNotificationsByCategory, 
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification 
} from "@/lib/api/notifications"
import { updateRelationshipStatus } from "@/lib/api/user"
import { toast } from "sonner"

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  onUnreadCountChange?: (count: number) => void
}

type NotificationType = 'other' | 'relationship' | 'gift' | 'savings'

export function NotificationDropdown({ isOpen, onClose, onUnreadCountChange }: NotificationDropdownProps) {
  const { user } = useAuthStore()
  const [activeFilter, setActiveFilter] = useState<NotificationType>('other')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFilterChanging, setIsFilterChanging] = useState(false)
  const [notificationCache, setNotificationCache] = useState<Record<string, Notification[]>>({})
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState({
    total: 0,
    relationship: 0,
    gift: 0,
    savings: 0
  })
  const [acceptingNotifications, setAcceptingNotifications] = useState<Set<number>>(new Set())
  const [rejectingNotifications, setRejectingNotifications] = useState<Set<number>>(new Set())
  
  // 초기 알림 데이터 로드 (모든 알림)
  useEffect(() => {
    if (isOpen && user?.id && isInitialLoad) {
      loadAllNotifications()
    }
  }, [isOpen, user?.id, isInitialLoad])

  // 필터 변경 시 캐시된 데이터 사용
  useEffect(() => {
    if (isOpen && user?.id && !isInitialLoad) {
      filterNotifications()
    }
  }, [activeFilter])

  const loadAllNotifications = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const allNotifications = await getNotifications(user.id)
      setNotifications(allNotifications)
      
      // 카테고리별로 캐시 저장
      const cache: Record<string, Notification[]> = {
        'other': allNotifications
      }
      
      // 각 카테고리별로 필터링해서 캐시에 저장
      const categories = ['relationship', 'gift', 'savings'] as const
      for (const category of categories) {
        cache[category] = allNotifications.filter(notif => notif.category === category)
      }
      
      setNotificationCache(cache)
      calculateUnreadCounts(allNotifications)
      setIsInitialLoad(false)
    } catch (error) {
      console.error('알림 로드 실패:', error)
      setNotifications([])
      setIsInitialLoad(false)
    } finally {
      setIsLoading(false)
    }
  }

  const filterNotifications = () => {
    setIsFilterChanging(true)
    // 약간의 지연을 주어 부드러운 전환 효과
    setTimeout(() => {
      const cachedData = notificationCache[activeFilter]
      if (cachedData) {
        setNotifications(cachedData)
      }
      setIsFilterChanging(false)
    }, 100)
  }

  // 읽지 않은 알림 개수 계산
  const calculateUnreadCounts = (allNotifications: Notification[]) => {
    const counts = {
      total: allNotifications.filter(n => !n.isRead).length,
      relationship: allNotifications.filter(n => !n.isRead && n.category === 'relationship').length,
      gift: allNotifications.filter(n => !n.isRead && n.category === 'gift').length,
      savings: allNotifications.filter(n => !n.isRead && n.category === 'savings').length
    }
    setUnreadCounts(counts)
    // 부모 컴포넌트에 총 읽지 않은 개수 전달
    onUnreadCountChange?.(counts.total)
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return
    
    try {
      await markAllNotificationsAsRead(user.id)
      // 캐시와 현재 상태 모두 업데이트
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
      setNotificationCache(prev => {
        const newCache = { ...prev }
        Object.keys(newCache).forEach(key => {
          newCache[key] = newCache[key].map(notif => ({ ...notif, isRead: true }))
        })
        return newCache
      })
      // 읽지 않은 개수 초기화
      setUnreadCounts({ total: 0, relationship: 0, gift: 0, savings: 0 })
      // 네비게이션 바의 빨간 점도 사라지도록 부모 컴포넌트에 알림
      onUnreadCountChange?.(0)
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!user?.id || notification.isRead) return
    
    try {
      await markNotificationAsRead(notification.id, user.id)
      // 로컬 상태와 캐시 모두 업데이트
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notification.id 
            ? { ...notif, isRead: true }
            : notif
        )
      )
      setNotificationCache(prev => {
        const newCache = { ...prev }
        Object.keys(newCache).forEach(key => {
          newCache[key] = newCache[key].map(notif => 
            notif.id === notification.id 
              ? { ...notif, isRead: true }
              : notif
          )
        })
        return newCache
      })
      // 읽지 않은 개수 다시 계산
      const updatedNotifications = notificationCache['other']?.map(notif => 
        notif.id === notification.id ? { ...notif, isRead: true } : notif
      ) || []
      calculateUnreadCounts(updatedNotifications)
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
    }
  }

  // 관계 요청 승인/거절 처리
  const handleRelationshipAction = async (notification: Notification, action: 'ACCEPTED' | 'REJECTED') => {
    if (!user?.id || !notification.relatedData) return
    
    try {
      // 관계 ID 파싱
      const relatedData = JSON.parse(notification.relatedData)
      const relationshipId = relatedData.relationshipId
      
      if (!relationshipId) {
        toast.error('관계 정보를 찾을 수 없습니다.')
        return
      }
      
      // 처리 중 상태 설정
      if (action === 'ACCEPTED') {
        setAcceptingNotifications(prev => new Set(prev).add(notification.id))
      } else {
        setRejectingNotifications(prev => new Set(prev).add(notification.id))
      }
      
      // 관계 상태 업데이트 (로딩 시간 보장)
      await Promise.all([
        updateRelationshipStatus(user.id, relationshipId, action),
        new Promise(resolve => setTimeout(resolve, 1000))
      ])
      
      // 성공 토스트 메시지
      const actionText = action === 'ACCEPTED' ? '승인' : '거절'
      toast.success(`관계 요청을 ${actionText}했습니다.`)
      
      // 관계 설정 탭에 업데이트 알림을 보내기 위한 커스텀 이벤트 발생
      window.dispatchEvent(new CustomEvent('relationshipUpdated', { 
        detail: { 
          action, 
          relationshipId,
          notificationId: notification.id 
        } 
      }))
      
      // 알림을 읽음 처리
      await markNotificationAsRead(notification.id, user.id)
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notification.id 
            ? { ...notif, isRead: true }
            : notif
        )
      )
      setNotificationCache(prev => {
        const newCache = { ...prev }
        Object.keys(newCache).forEach(key => {
          newCache[key] = newCache[key].map(notif => 
            notif.id === notification.id 
              ? { ...notif, isRead: true }
              : notif
          )
        })
        return newCache
      })
      
      // 읽지 않은 개수 다시 계산
      const updatedNotifications = notificationCache['other']?.map(notif => 
        notif.id === notification.id ? { ...notif, isRead: true } : notif
      ) || []
      calculateUnreadCounts(updatedNotifications)
      
    } catch (error) {
      console.error('관계 요청 처리 실패:', error)
      toast.error('요청 처리 중 오류가 발생했습니다.')
    } finally {
      // 처리 중 상태 해제
      if (action === 'ACCEPTED') {
        setAcceptingNotifications(prev => {
          const newSet = new Set(prev)
          newSet.delete(notification.id)
          return newSet
        })
      } else {
        setRejectingNotifications(prev => {
          const newSet = new Set(prev)
          newSet.delete(notification.id)
          return newSet
        })
      }
    }
  }

  // filteredNotifications는 이제 notifications 자체가 이미 필터링된 상태
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'relationship':
        return <Users className="w-4 h-4" />
      case 'gift':
        return <Gift className="w-4 h-4" />
      case 'savings':
        return <PiggyBank className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  return (
    <div className={`absolute top-full -right-1 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 transition-all duration-300 ease-out ${
      isOpen 
        ? 'opacity-100 scale-100 translate-y-0' 
        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
    }`}>
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Mails className="w-5 h-5 text-gray-600 mt-0.5" />
            <h3 className="text-lg font-semibold text-gray-700">알림</h3>
          </div>
          <button 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            onClick={onClose}
            title="닫기"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        {/* 모두 읽음 버튼 */}
        <div className="flex justify-end mb-3">
          <button 
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 hover:bg-gray-50 rounded-md"
            onClick={handleMarkAllAsRead}
          >
            모두 읽음
          </button>
        </div>
        
        {/* 필터 버튼들 */}
        <div className="flex gap-3">
          {[
            { key: 'other', label: '전체', icon: <Bell className="w-4 h-4" />, count: unreadCounts.total },
            { key: 'relationship', label: '관계', icon: <Users className="w-4 h-4" />, count: unreadCounts.relationship },
            { key: 'gift', label: '기프티콘', icon: <Gift className="w-4 h-4" />, count: unreadCounts.gift },
            { key: 'savings', label: '저축·용돈', icon: <PiggyBank className="w-4 h-4" />, count: unreadCounts.savings }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as NotificationType)}
              className={`flex-1 h-9 rounded-full flex items-center justify-center transition-all font-medium text-sm relative ${
                activeFilter === filter.key
                  ? filter.key === 'other' 
                    ? 'bg-teal-600/90 text-white shadow-sm'
                    : filter.key === 'relationship'
                    ? 'bg-emerald-500/90 text-white shadow-sm'
                    : filter.key === 'gift'
                    ? 'bg-teal-500/90 text-white shadow-sm'
                    : 'bg-cyan-500/90 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={filter.label}
            >
              {filter.icon}
              {filter.count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold animate-in zoom-in-50 duration-200 bg-red-500 text-white shadow-md">
                  {filter.count > 99 ? '99+' : filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* 알림 리스트 */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className={`transition-opacity duration-200 ${isFilterChanging ? 'opacity-50' : 'opacity-100'}`}>
            {notifications.length > 0 ? (
          notifications.map((notification, index) => {
            // 백엔드에서 소문자로 변환되므로 소문자로 비교
            const isRelationshipRequest = notification.type === 'relationship_request' && notification.relatedData
            const isAccepting = acceptingNotifications.has(notification.id)
            const isRejecting = rejectingNotifications.has(notification.id)
            
            
            return (
              <div 
                key={notification.id}
                className={`px-5 py-4 hover:bg-gray-50/80 transition-all duration-200 group ${
                  index < notifications.length - 1 ? 'border-b border-gray-100/60' : ''
                } ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                onClick={() => !isRelationshipRequest && handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  {/* 상태 인디케이터 */}
                  <div className="flex items-center mt-1">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${
                      notification.category === 'other' ? 'bg-cyan-500' :
                      notification.category === 'relationship' ? 'bg-teal-500' :
                      notification.category === 'gift' ? 'bg-emerald-500' :
                      notification.category === 'savings' ? 'bg-teal-600' :
                      'bg-gray-500'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold mb-1.5 leading-snug text-gray-700">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {notification.description}
                        </p>
                      </div>
                      
                      {/* 시간 표시 */}
                      <div className="flex-shrink-0">
                        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-full">
                          {notification.timeAgo}
                        </span>
                      </div>
                    </div>
                    
                    {/* 관계 요청 알림에 승인/거절 버튼 추가 - 맨 아래 오른쪽 */}
                    {isRelationshipRequest && !notification.isRead && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRelationshipAction(notification, 'ACCEPTED')
                          }}
                          className="bg-[#009178] hover:bg-[#007A6B] text-white transition-all duration-200 border-0 rounded-full h-8 px-4"
                        >
                          {isAccepting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {/* <div className="w-1.5 h-1.5 bg-white rounded-full"></div> */}
                              <span className="text-xs font-medium">승인</span>
                            </div>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRelationshipAction(notification, 'REJECTED')
                          }}
                          className="bg-gradient-to-r from-slate-200 to-gray-200 hover:from-slate-300 hover:to-gray-300 text-slate-800 transition-all duration-200 rounded-full h-8 px-4"
                        >
                          {isRejecting ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {/* <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div> */}
                              <span className="text-xs font-medium">거절</span>
                            </div>
                          )}
                        </button>
                      </div>
                    )}
                    
                  </div>
                </div>
              </div>
            )
          })
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-gray-400">
                    {getCategoryIcon(activeFilter)}
                  </div>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {activeFilter === 'other' ? '새로운 알림이 없습니다' : `${activeFilter === 'relationship' ? '관계' : activeFilter === 'gift' ? '기프티콘' : '저축'} 알림이 없습니다`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 푸터 */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button className="w-full text-center text-sm text-gray-600 hover:text-gray-800 transition-colors">
          모든 알림 보기
        </button>
      </div>
    </div>
  )
}
