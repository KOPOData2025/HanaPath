"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { HanaLogo } from "@/components/hana-logo"
import { useAuthStore } from "@/store/auth"
import { User, Mail, MailOpen, LogOut, Settings, UserCircle, UserRound, CircleUser, Sun, Moon, Languages, ChevronRight, Compass, UserCheck } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { getUnreadNotificationCount } from "@/lib/api/notifications"

export function MainNav() {
  const pathname = usePathname()
  const { isLoggedIn, logout, user } = useAuthStore()
  const [isMessageOpen, setIsMessageOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true) // true = 라이트 모드 on 상태로 표시
  const [currentLanguage, setCurrentLanguage] = useState('한국어') // 기본값: 한국어
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // 읽지 않은 알림 개수 가져오기
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (isLoggedIn && user?.id) {
        try {
          const count = await getUnreadNotificationCount(user.id)
          setUnreadCount(count)
        } catch (error) {
          console.error('읽지 않은 알림 개수 조회 실패:', error)
          setUnreadCount(0)
        }
      } else {
        setUnreadCount(0)
      }
    }

    fetchUnreadCount()
  }, [isLoggedIn, user?.id])

  // 알림 드롭다운이 열릴 때마다 최신 읽지 않은 개수 가져오기
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (isLoggedIn && user?.id && isMessageOpen) {
        try {
          const count = await getUnreadNotificationCount(user.id)
          setUnreadCount(count)
        } catch (error) {
          console.error('읽지 않은 알림 개수 조회 실패:', error)
        }
      }
    }

    fetchUnreadCount()
  }, [isLoggedIn, user?.id, isMessageOpen])

  // 사용자 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 테마 토글 함수
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    // 실제 테마 변경 로직은 여기에 구현
    document.documentElement.classList.toggle('dark')
  }

  // 언어 변경 함수
  const toggleLanguage = () => {
    setCurrentLanguage(currentLanguage === '한국어' ? 'English (US)' : '한국어')
  }

  const navItems = [
    { href: "/", label: "홈" },
    { href: "/investment", label: user?.userType === "PARENT" ? "투자" : "모의 투자" },
    { href: "/news", label: "뉴스" },
    { href: "/store", label: "스토어" },
    { href: "/community", label: "커뮤니티" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 ml-10">
          <HanaLogo size={36} />
          <span className="text-xl font-black text-[#057D69]">HanaPath</span>
        </Link>

        {/* Center Navigation - 중앙 고정 */}
        <nav className="hidden md:flex items-center gap-20 absolute left-1/2 transform -translate-x-1/2 -ml-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-base font-medium transition-colors hover:text-[#009178] relative",
                pathname === item.href ? "text-[#009178]" : "text-gray-600",
              )}
            >
              {item.label}
              {pathname === item.href && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#009178] rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right Side - User Actions */}
        <div className="flex items-center gap-2 mr-10">
          {isLoggedIn ? (
            <>
              {/* 알림 아이콘 */}
              <div className="relative">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                  onClick={() => setIsMessageOpen(!isMessageOpen)}
                >
                  <div className="relative w-6 h-6 perspective-1000 flex items-center justify-center">
                    <Mail 
                      className={`w-6 h-6 text-gray-600 transition-all duration-700 ease-out ${
                        isMessageOpen 
                          ? 'opacity-0 scale-y-0 scale-x-75 rotate-x-90 origin-top' 
                          : 'opacity-100 scale-y-100 scale-x-100 rotate-x-0 origin-top'
                      }`}
                      style={{
                        transformStyle: 'preserve-3d'
                      }}
                      strokeWidth={1.5}
                    />
                    <MailOpen 
                      className={`absolute top-0 left-0 w-6 h-6 text-gray-600 transition-all duration-700 ease-out ${
                        isMessageOpen 
                          ? 'opacity-100 scale-y-100 scale-x-100 rotate-x-0 origin-top' 
                          : 'opacity-0 scale-y-0 scale-x-75 -rotate-x-90 origin-top'
                      }`}
                      style={{
                        transformStyle: 'preserve-3d'
                      }}
                      strokeWidth={1.5}
                    />
                  </div>
                </button>
                {/* 알림 배지 - 읽지 않은 알림이 있을 때만 표시 */}
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></span>
                )}
                
                {/* 알림 드롭다운 */}
                <NotificationDropdown 
                  isOpen={isMessageOpen} 
                  onClose={() => setIsMessageOpen(false)}
                  onUnreadCountChange={setUnreadCount}
                />
              </div>
              
              {/* 사용자 프로필 드롭다운 */}
              <div className="relative" ref={userDropdownRef}>
                <button 
                  className="flex items-center gap-2 text-base font-medium hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <div className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-gray-700">{user?.name || '사용자'} 님</span>
                </button>
                
                {/* 사용자 드롭다운 메뉴 */}
                <div className={`absolute -right-10 top-full mt-2 w-auto min-w-[220px] bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 transition-all duration-300 ease-out ${
                  isUserDropdownOpen 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}>
                  {/* 타이틀 헤더 */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Compass className="w-6 h-6 text-[#009178] animate-pulse" strokeWidth={2.5} />
                      <h3 className="text-base font-black text-gray-700">My Path</h3>
                    </div>
                  </div>
                  
                  {/* 메뉴 아이템들 */}
                  <div className="py-1">
                    <Link 
                      href="/mypage" 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>마이페이지</span>
                    </Link>
                    
                    <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {isDarkMode ? (
                          <Sun className="w-4 h-4" />
                        ) : (
                          <Moon className="w-4 h-4" />
                        )}
                        <span>{isDarkMode ? '라이트 모드' : '다크 모드'}</span>
                      </div>
                      <button
                        className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                          isDarkMode ? 'bg-[#009178]' : 'bg-gray-300'
                        }`}
                        onClick={() => {
                          toggleTheme()
                        }}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                            isDarkMode ? 'translate-x-[18px]' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Languages className="w-4 h-4" />
                        <span>{currentLanguage}</span>
                      </div>
                      <button
                        onClick={() => {
                          toggleLanguage()
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mx-4 my-1 h-px bg-gray-100"></div>
                    
                    <button 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      onClick={() => {
                        logout()
                        setIsUserDropdownOpen(false)
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="default" asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button className="bg-[#009178] hover:bg-[#004E42]" size="default" asChild>
                <Link href="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
