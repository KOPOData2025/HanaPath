"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

// 도넛 차트용 색상 배열 정의 
const donutColors = [
  '#FF6B6B', // 코랄 레드
  '#4ECDC4', // 터콰이즈
  '#45B7D1', // 스카이 블루
  '#96CEB4', // 민트 그린
  '#FFEAA7', // 소프트 옐로우
  '#DDA0DD', // 플럼
  '#98D8C8', // 아쿠아 그린
  '#F7DC6F', // 골든 옐로우
  '#BB8FCE', // 라벤더
  '#85C1E9'  // 라이트 블루
]

interface DonutChartData {
  category: string
  amount: number
  percentage: number
  color: string
}

interface ModernDonutChartProps {
  data: DonutChartData[]
  size?: number
  strokeWidth?: number
}

// 모던 도넛 차트 컴포넌트
export default function ModernDonutChart({ data, size = 200, strokeWidth = 20 }: ModernDonutChartProps) {
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const svgRef = React.useRef<SVGSVGElement>(null)

  // 퍼센트 정규화 (100%로 맞추기)
  const totalPercentage = data.reduce((sum, item) => sum + item.percentage, 0)
  const normalizedData = data.map(item => ({
    ...item,
    percentage: (item.percentage / totalPercentage) * 100
  }))

  // 마우스 좌표를 이용한 호버 감지 - 빨간선 축 기준 대칭
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    
    const rect = svgRef.current.getBoundingClientRect()
    
    // 마우스 위치 저장 (툴팁용)
    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    })
    
    let mouseX = event.clientX - rect.left - center
    let mouseY = event.clientY - rect.top - center
    
    // 빨간선 축(대각선) 기준으로 좌표 대칭 - X와 Y를 서로 바꿈
    const tempX = mouseX
    mouseX = mouseY
    mouseY = tempX
    
    // 도넛 영역 확인
    const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY)
    const innerRadius = radius - strokeWidth / 2
    const outerRadius = radius + strokeWidth / 2
    
    if (distance < innerRadius || distance > outerRadius) {
      setHoveredItem(null)
      return
    }
    
    // 각도 계산 - 12시 방향을 0도로, 시계방향으로 증가
    let angle = Math.atan2(-mouseY, mouseX) * (180 / Math.PI)
    // 12시 방향을 0도로 맞추기 위해 90도 더하기
    angle = angle + 90
    if (angle < 0) angle += 360
    if (angle >= 360) angle -= 360
    
    // 세그먼트 찾기
    let cumulativePercentage = 0
    for (let i = 0; i < normalizedData.length; i++) {
      const startAngle = (cumulativePercentage / 100) * 360
      const endAngle = ((cumulativePercentage + normalizedData[i].percentage) / 100) * 360
      
      if (angle >= startAngle && angle < endAngle) {
        if (hoveredItem !== i) {
          setHoveredItem(i)
        }
        return
      }
      
      cumulativePercentage += normalizedData[i].percentage
    }
    
    setHoveredItem(null)
  }

  const handleMouseLeave = () => {
    setHoveredItem(null)
  }

  // 각 세그먼트의 정확한 위치 계산 (금액 순으로 정렬)
  let cumulativePercentage = 0
  const segments = normalizedData
    .sort((a, b) => b.amount - a.amount) // 금액이 큰 순서대로 정렬
    .map((item, index) => {
      const startPercentage = cumulativePercentage
      const endPercentage = cumulativePercentage + item.percentage
      cumulativePercentage += item.percentage
      
      return {
        ...item,
        index,
        startPercentage,
        endPercentage,
        strokeColor: donutColors[index % donutColors.length]
      }
    })

  return (
    <div className="relative" style={{ padding: '20px' }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className="overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
      >
        {/* 배경 원 (전체 100% 채우기) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
        />
        
        {segments.map((segment, index) => {
          const { startPercentage, endPercentage, strokeColor, percentage } = segment
          
          // 실제 도넛 원호의 경로 계산
          const circumference = 2 * Math.PI * radius
          const strokeLength = (percentage / 100) * circumference
          const strokeOffset = -((startPercentage / 100) * circumference)
          
          // 호버 시 확대 효과
          const isHovered = hoveredItem === index
          const hoverStrokeWidth = isHovered ? strokeWidth + 6 : strokeWidth
          const hoverRadius = isHovered ? radius : radius
          
          return (
            <motion.circle
              key={`segment-${index}`}
              cx={center}
              cy={center}
              r={hoverRadius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={hoverStrokeWidth}
              strokeDasharray={`${strokeLength} ${circumference}`}
              strokeDashoffset={strokeOffset}
              strokeLinecap="butt"
              style={{
                transformOrigin: `${center}px ${center}px`,
                opacity: 0.9
              }}
              initial={{ 
                strokeDashoffset: strokeOffset - circumference,
                opacity: 0,
                scale: 0.8
              }}
              animate={{
                strokeDashoffset: strokeOffset,
                opacity: 0.9,
                scale: 1,
                strokeWidth: hoverStrokeWidth,
                r: hoverRadius
              }}
              transition={{
                strokeDashoffset: {
                  duration: 1.2,
                  delay: index * 0.2,
                  ease: "easeOut"
                },
                opacity: {
                  duration: 0.6,
                  delay: index * 0.2
                },
                scale: {
                  duration: 0.8,
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                },
                strokeWidth: {
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  mass: 0.6
                }
              }}
            />
          )
        })}
        
        {/* 호버된 세그먼트를 다시 그려서 최상단에 표시 */}
        {hoveredItem !== null && (
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segments[hoveredItem].strokeColor}
            strokeWidth={strokeWidth + 8}
            strokeDasharray={`${(segments[hoveredItem].percentage / 100) * 2 * Math.PI * radius} ${2 * Math.PI * radius}`}
            strokeDashoffset={-((segments[hoveredItem].startPercentage / 100) * 2 * Math.PI * radius)}
            strokeLinecap="butt"
            style={{
              transformOrigin: `${center}px ${center}px`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </svg>
      
      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ padding: '20px' }}>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">
              {data.reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}원
            </div>
            <div className="text-sm text-gray-500 font-medium">총 지출</div>
          </div>
      </div>

      {/* 호버 툴팁 - 마우스 커서 위치에 표시 */}
      <AnimatePresence>
        {hoveredItem !== null && data[hoveredItem] && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${mousePosition.x - 50}px`,
              top: `${mousePosition.y - 60}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
              <div 
                className="text-gray-800 text-sm font-semibold px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,1) 100%)`,
                  border: `2px solid ${segments[hoveredItem].strokeColor}`,
                  boxShadow: `0 12px 35px rgba(0,0,0,0.2), 0 0 0 1px ${segments[hoveredItem].strokeColor}40, inset 0 2px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.05)`
                }}
              >
              {/* 배경 그라데이션 오버레이 */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{ 
                  background: `linear-gradient(135deg, ${segments[hoveredItem].strokeColor}20, ${segments[hoveredItem].strokeColor}30)`
                }}
              ></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: segments[hoveredItem].strokeColor
                    }}
                  ></div>
                  <span className="font-bold text-gray-800 text-sm">{data[hoveredItem].category}</span>
                  <span className="text-gray-500 text-sm">•</span>
                  <span className="font-bold text-gray-800 text-sm">{data[hoveredItem].percentage.toFixed(1)}%</span>
                </div>
                <div className="text-xs text-gray-600 font-medium text-right">
                  {data[hoveredItem].amount.toLocaleString()}원
                </div>
              </div>
            </div>
            
             {/* 커서를 향하는 화살표 */}
             <div 
               className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-5 border-r-5 border-t-5 border-transparent"
               style={{ 
                 borderTopColor: 'rgba(248,250,252,1)',
                 filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))'
               }}
             ></div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
