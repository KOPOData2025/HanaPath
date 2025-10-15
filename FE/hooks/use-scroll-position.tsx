"use client"

import { useState, useEffect } from 'react'

export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0)
  const [isFooterVisible, setIsFooterVisible] = useState(false)
  const [footerHeight, setFooterHeight] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)

      // 푸터바가 보이기 시작하는지 확인
      const footer = document.querySelector('footer')
      if (footer) {
        const footerRect = footer.getBoundingClientRect()
        const windowHeight = window.innerHeight
        
        // 푸터바 높이 저장
        setFooterHeight(footerRect.height)
        
        // 푸터바가 화면에 보이는 비율 계산 (0~1)
        const footerVisiblePercentage = Math.max(0, Math.min(1, (windowHeight - footerRect.top) / footerRect.height))
        
        // 푸터바가 50% 이상 보이면 위로, 50% 미만이면 아래로
        // 중간 과정에서는 움직이지 않도록 boolean 값으로 처리
        const shouldMoveUp = footerVisiblePercentage > 0.5
        
        setIsFooterVisible(shouldMoveUp)
      }
    }

    // 초기 실행
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return { scrollY, isFooterVisible, footerHeight }
}
