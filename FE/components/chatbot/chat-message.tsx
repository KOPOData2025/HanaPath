"use client"

import { forwardRef } from "react"
import { cn, formatAccountNumber } from "@/lib/utils"
import { Bot, User, Star, DollarSign, Palette, Key, Hash, Lightbulb, Clover, Sparkles, Heart, Target, Zap, Clock, BookOpen, Tag, BarChart3, GraduationCap, TrendingUp, Brain, Award, Compass, Wallet, TrendingUp as TrendingUpIcon, Newspaper, ShoppingBag, Gift, Users, CreditCard, DollarSign as DollarSignIcon, Activity, HelpCircle, MessageCircleMore, Info, X, MessageCircleIcon, MessageCircleX, PiggyBank, Shield } from "lucide-react"
import Image from "next/image"

interface ChatMessageProps {
  message: string
  isBot: boolean
  timestamp?: string
  options?: string[]
  onOptionClick?: (option: string) => void
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(({ 
  message, 
  isBot, 
  timestamp, 
  options, 
  onOptionClick 
}, ref) => {
  // 운세 메시지인지 확인
  const isFortuneMessage = isBot && message.includes("오늘의 운세")
  
  // 금융 단어 메시지인지 확인
  const isFinancialWordMessage = isBot && message.includes("오늘의 금융 단어")
  
  // 하나패스 소개 메시지인지 확인
  const isHanaPathIntroMessage = isBot && message.includes("[HANAPATH_INTRO]")

  // 전자지갑 잔액 메시지인지 확인
  const isWalletBalanceMessage = isBot && message.includes("[WALLET_BALANCE]")
  
  // FAQ 메시지인지 확인
  const isFAQMessage = isBot && message.includes("자주 묻는 질문 (FAQ)")
  
  // FAQ 답변 메시지인지 확인 (실제 답변 첫 줄과 일치)
  const isFAQAnswerMessage = isBot && (
    message.includes("하나머니 활용 방법") ||
    message.includes("레벨업 방법") ||
    message.includes("하나머니 적립 방법") ||
    message.includes("모의 투자 계좌 재충전") ||
    message.includes("관계 등록") ||
    message.includes("용돈 자동 송금 설정")
  )

  // FAQ 메시지 렌더링 함수
  const renderFAQMessage = () => {
    return (
      <div className="space-y-4">
        <div className="text-center py-4 px-6">
          <div className="flex items-center justify-center gap-2">
            <MessageCircleMore className="w-5 h-5 text-emerald-600"/>
            <p className="text-sm">
              자주 묻는 질문들을 확인해보세요
            </p>
          </div>
        </div>
      </div>
    )
  }

  // FAQ 답변 메시지 렌더링 함수
  const renderFAQAnswerMessage = () => {
    const lines = message.split('\n').filter(line => line.trim())
    
    // 제목 추출 
    const title = (lines[0] || '').trim()
    
    // 아이콘 매핑
    const getIconForTitle = (title: string) => {
      if (title.includes('하나머니 활용')) return { icon: <Gift className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-200' }
      if (title.includes('레벨업')) return { icon: <Award className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-200' }
      if (title.includes('하나머니 적립')) return { icon: <PiggyBank className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-200' }
      if (title.includes('모의 투자')) return { icon: <TrendingUpIcon className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-200' }
      if (title.includes('관계 등록')) return { icon: <Users className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-200' }
      if (title.includes('용돈')) return { icon: <CreditCard className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-200' }
      return { icon: <HelpCircle className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-200' }
    }

    const iconInfo = getIconForTitle(title)
    
    // 섹션별로 파싱
    const sections: Array<{ header: string; content: string[] }> = []
    let currentSection: { header: string; content: string[] } | null = null
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      
      // 섹션 헤더 감지 (특정 키워드들로 감지)
      const isHeader = line.includes('주요 기능') || 
                      line.includes('경험치 획득 활동') || 
                      line.includes('레벨 구간별 명칭') ||
                      line.includes('일일 기본 활동') || 
                      line.includes('특별 활동 보너스') ||
                      line.includes('재충전 이용 조건') ||
                      line.includes('레벨별 재충전 금액') ||
                      line.includes('투자 가이드') ||
                      line.includes('등록 절차') ||
                      line.includes('등록 후 이용 가능한 기능') ||
                      line.includes('설정 방법') ||
                      line.includes('자동 송금 시스템')
      
      if (isHeader) {
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = {
          header: line.trim(),
          content: []
        }
      } else if (currentSection && line.trim()) {
        currentSection.content.push(line)
      } else if (!currentSection && line.trim()) {
        // 첫 번째 섹션이 없는 경우 일반 내용으로 처리
        if (!sections.length) {
          currentSection = {
            header: '내용',
            content: [line]
          }
        }
      }
    }
    
    if (currentSection) {
      sections.push(currentSection)
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 헤더 */}
        <div className={`flex items-center gap-3 p-5 ${iconInfo.bg}`}>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            {iconInfo.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">자세한 안내</p>
          </div>
        </div>

        {/* 섹션들 */}
        <div className="p-5 space-y-5">
          {sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                {section.header}
              </h4>
              <div className="space-y-2 ml-3.5">
                {section.content.map((item, itemIndex) => (
                  <p key={itemIndex} className="text-sm text-gray-600 leading-relaxed">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 금융 단어 메시지 렌더링 함수
  const renderFinancialWordMessage = () => {
    const lines = message.split('\n').filter(line => line.trim())
    
    // 메시지 구조 파싱 - 실제 형식에 맞게 수정
    const title = lines[0] || ''
    
    // 각 섹션을 찾기 위한 함수
    const findSection = (emoji: string) => {
      const lineIndex = lines.findIndex(line => line.includes(emoji))
      return lineIndex !== -1 ? lines[lineIndex + 1] || '' : ''
    }
    
    const definition = findSection('📖 정의')
    const example = findSection('💡 예시')
    const tip = findSection('💭 학습 팁')
    const relatedWords = lines.find(line => line.includes('🔗 관련 단어:')) || ''

    return (
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="relative p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-xl overflow-hidden">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center shadow-sm backdrop-blur-sm">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                오늘의 금융 단어 <span className="mx-0.5">❛</span><span className="text-lg">{title.replace('📚 오늘의 금융 단어: ', '').replace('📚 ', '')}</span><span className="mx-0.5">❜</span>
              </h3>
              <p className="text-emerald-100 text-xs mt-0.5">오늘의 학습</p>
            </div>
          </div>
        </div>

        {/* 정의 섹션 */}
        {definition && (
          <div className="bg-white p-3 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-3 h-3 text-teal-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">정의</h4>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {definition}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 예시 섹션 */}
        {example && (
          <div className="bg-white p-3 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-3 h-3 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">예시</h4>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {example}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 학습 팁 */}
        {tip && (
          <div className="bg-white p-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award className="w-3 h-3 text-orange-600" />              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">학습 팁</h4>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {tip}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 관련 단어 */}
        {relatedWords && (
          <div className="bg-white p-3 rounded-b-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">관련 단어</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {relatedWords.replace('🔗 관련 단어: ', '').trim().split(',').map((word, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-50 rounded-full text-xs text-gray-700 border border-gray-200"
                >
                  {word.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 하나패스 소개 메시지 렌더링 함수
  const renderHanaPathIntroMessage = () => {
    const lines = message.split('\n').filter(line => line.trim())
    
    // 메시지 구조 파싱
    const title = lines[0]?.replace('[HANAPATH_INTRO] ', '') || ''
    const description = lines[2] && !lines[2].includes('[FEATURES]') ? lines[2] : ''
    
    // 기능 섹션 파싱
    const featuresStartIndex = lines.findIndex(line => line.includes('[FEATURES]'))
    const featuresEndIndex = lines.findIndex((line, index) => index > featuresStartIndex && !line.startsWith('•'))
    const endIndex = featuresEndIndex === -1 ? lines.length - 1 : featuresEndIndex
    const features = lines.slice(featuresStartIndex + 1, endIndex).filter(line => line.trim() && !line.includes('[FEATURES]'))
    
    // 마지막 멘트 파싱
    const finalMessage = lines[lines.length - 1] || ''

          const getIcon = (type: string) => {
        switch (type) {
          case 'WALLET': return <Wallet className="w-4 h-4 text-emerald-600" />
          case 'INVESTMENT': return <TrendingUpIcon className="w-4 h-4 text-blue-600" />
          case 'SECURITY': return <Shield className="w-4 h-4 text-red-600" />
          case 'NEWS': return <Newspaper className="w-4 h-4 text-purple-600" />
          case 'STORE': return <ShoppingBag className="w-4 h-4 text-orange-600" />
          case 'HANAMONEY': return <Gift className="w-4 h-4 text-pink-600" />
          case 'COMMUNITY': return <Users className="w-4 h-4 text-gray-600" />
          case 'CHATBOT': return <Bot className="w-4 h-4 text-teal-600" />
          default: return <Compass className="w-4 h-4 text-gray-600" />
        }
      }

          return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Image 
                src="/hana-logo.png" 
                alt="Hana Logo" 
                width={24} 
                height={24}
                className="w-6 h-6"
              />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-sm">{title}</h3>
              <p className="text-emerald-600 text-xs mt-0.5">금융의 새로운 경험</p>
            </div>
          </div>

          {/* 설명 */}
          {description && (
            <div className="p-4 bg-white">
              <p className="text-gray-700 leading-relaxed text-sm">
                {description}
              </p>
            </div>
          )}

          {/* 기능 섹션 */}
          {features.length > 0 && (
            <div className="p-4 bg-white border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">주요 기능</h4>
              <div className="space-y-3">
                {features.map((feature, index) => {
                  const match = feature.match(/\[(\w+)\]\s*(.+)/)
                  if (match) {
                    const [, iconType, content] = match
                    // 기능명과 상세설명 분리 (하이픈 기준)
                    const parts = content.split(' - ')
                    const featureName = parts[0] || content
                    const description = parts[1] || ''
                    
                    return (
                      <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                          {getIcon(iconType)}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 text-sm font-semibold">{featureName}</p>
                          {description && (
                            <p className="text-gray-600 text-xs mt-1 leading-relaxed">{description}</p>
                          )}
                        </div>
                      </div>
                    )
                  }
                  return (
                    <p key={index} className="text-gray-700 text-sm ml-11">
                      {feature.replace(/^•\s*/, '')}
                    </p>
                  )
                })}
              </div>
            </div>
          )}

          {/* 마지막 멘트 */}
          {finalMessage && (
            <div className="px-4 py-3">
              <p className="text-gray-700 text-sm text-center">
                {finalMessage}
              </p>
            </div>
          )}
        </div>
      )
  }

  // 운세 메시지 렌더링 함수
  const renderFortuneMessage = () => {
    const lines = message.split('\n').filter(line => line.trim())
    
    // 실제 메시지 구조에 맞게 파싱
    const title = lines[0]
    const todayFortune = lines[1] || ''
    const fortuneItems = lines.slice(2, -1) // 마지막 줄(팁)을 제외한 항목들
    const tip = lines[lines.length - 1] || ''

    // 금전운과 다른 항목들 분리
    const moneyFortune = fortuneItems.find(item => item.includes('[금전운]'))
    const otherItems = fortuneItems.filter(item => !item.includes('[금전운]'))

    return (
      <div className="space-y-3">
        {/* 제목 */}
        <div className="flex items-center gap-2 text-base font-bold text-emerald-700">
          <Clover className="w-5 h-5" />
          <span>{title.replace('⭐ ', '')}</span>
        </div>

        {/* 오늘의 운세 */}
        {todayFortune && (
          <div className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg">
            {todayFortune}
          </div>
        )}

        {/* 금전운 섹션 */}
        {moneyFortune && (
          <div className="bg-gradient-to-r from-teal-50 to-cyan-100/50 p-4 rounded-xl border border-teal-100 shadow-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-teal-700" />
                <span className="text-base font-bold text-teal-800">금전운</span>
              </div>
              
              {/* 점수 부분 */}
              <div className="mb-3">
                <div className="text-base font-bold text-teal-700 mb-1">
                  {moneyFortune.match(/"(\d+)"점/)?.[1] || '75'}점
                </div>
                <div className="w-24 h-2 bg-teal-200 rounded-full mx-auto">
                  <div 
                    className="h-2 bg-teal-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, parseInt(moneyFortune.match(/"(\d+)"점/)?.[1] || '75'))) * 0.8}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* 메시지 부분 */}
              <div className="text-sm text-gray-700 leading-relaxed">
                {moneyFortune.replace(/\[금전운\]\s*"[^"]*"점\s*/, '').replace(/^[^']*'([^']*)'/, '$1').replace(/^[^[]*\[([^\]]*)\]\s*/, '').replace(/\d+점\s*/, '').replace(/[\[\]]/g, '').trim()}
              </div>
            </div>
          </div>
        )}

        {/* 운세 항목들 */}
        <div className="bg-white/70 p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            {otherItems.map((item, index) => {
              // 대괄호를 기준으로 라벨과 내용 분리
              const bracketIndex = item.indexOf(']')
              const label = bracketIndex !== -1 ? item.substring(0, bracketIndex + 1) : ''
              const content = bracketIndex !== -1 ? item.substring(bracketIndex + 1) : item
              
              // 각 항목별 배경색과 아이콘
              const cardStyles = [
                'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200',
                'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200',
                'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200',
                'bg-gradient-to-br from-pink-50 to-pink-100/50 border-pink-200'
              ]
              
              const icons = [Palette, Key, Hash, Clock]
              const Icon = icons[index] || Palette
              
              return (
                <div key={index} className={`p-3 rounded-lg border ${cardStyles[index]} shadow-sm hover:shadow-md transition-shadow duration-200`}>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-white/60 rounded-full flex items-center justify-center">
                        <Icon className="w-3 h-3 text-gray-600" />
                      </div>
                      <div className="text-sm font-semibold text-gray-600 whitespace-pre-line">
                        {label.replace(/[\[\]]/g, '').replace('행운의 ', '행운의\n')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-800 leading-relaxed">
                      {content}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 팁 */}
        {tip && (
          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
            <span>{tip.replace(/\[금융 습관 팁\]\s*/, '').replace(/[\[\]]/g, '')}</span>
          </div>
        )}
      </div>
    )
  }

  // 전자지갑 잔액 메시지 렌더링 함수
  const renderWalletBalanceMessage = () => {
    const lines = message.split('\n').filter(line => line.trim())
    
    // 메시지 구조 파싱
    const title = lines.find(line => line.includes('[WALLET_BALANCE]'))?.replace('[WALLET_BALANCE]', '').trim() || ''
    const accountInfoLines = lines.filter(line => line.includes('계좌번호:') || line.includes('현재 잔액:'))
    const finalMessage = lines.find(line => line.includes('[MESSAGE]'))?.replace('[MESSAGE]', '').trim() || ''

    // 계좌 정보 파싱
    const accountNumber = accountInfoLines.find(line => line.includes('계좌번호:'))?.replace('계좌번호:', '').trim() || ''
    const balance = accountInfoLines.find(line => line.includes('현재 잔액:'))?.replace('현재 잔액:', '').trim() || ''

    // 계좌번호 포맷팅
    const formattedAccountNumber = formatAccountNumber(accountNumber, 'wallet')

    return (
      <div className="space-y-3">
        {/* 헤더 */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-xl">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs">{title}</h3>
          </div>
        </div>

        {/* 계좌 정보 */}
        <div className="bg-white p-3 space-y-2">
          {/* 계좌번호 */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-3 h-3 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-600">계좌번호</p>
              <p className="font-mono text-xs font-semibold text-gray-900">{formattedAccountNumber}</p>
            </div>
          </div>

          {/* 잔액 */}
          <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
            <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSignIcon className="w-3 h-3 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-600">현재 잔액</p>
              <p className="text-xs font-bold text-emerald-700">{balance}</p>
            </div>
          </div>
        </div>

        {/* 하단 메시지 */}
        {finalMessage && (
          <div className="bg-white px-3 py-1 rounded-b-xl" style={{ marginBottom: '15px' }}>
            <p className="text-xs text-gray-700 text-center">
              {finalMessage}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      ref={ref}
      className={cn(
        "flex mb-4",
        isBot ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "flex",
        isBot ? 
          (isHanaPathIntroMessage || isFortuneMessage ? "flex-row max-w-[95%]" : "flex-row max-w-[85%]") : 
          "flex-row-reverse max-w-[80%]"
      )}>
        {/* 아바타 */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isBot 
            ? "bg-emerald-500 mr-3" 
            : "bg-gray-200 ml-3"
        )}>
          {isBot ? (
            <Bot className="w-4 h-4 text-white" />
          ) : (
            <User className="w-4 h-4 text-gray-600" />
          )}
        </div>

        {/* 메시지 컨테이너 */}
        <div className="flex flex-col">
                  {/* 메시지 버블 */}
        <div className={cn(
          "rounded-2xl shadow-sm overflow-hidden",
          isBot 
            ? (isHanaPathIntroMessage ? "bg-white text-gray-800" : "bg-white text-gray-800 rounded-bl-md")
            : "bg-emerald-500 text-white rounded-br-md"
        )}>
            {isFortuneMessage ? (
              <div className="px-4 py-3">
                {renderFortuneMessage()}
              </div>
            ) : isFinancialWordMessage ? (
              renderFinancialWordMessage()
            ) : isHanaPathIntroMessage ? (
              renderHanaPathIntroMessage()
            ) : isWalletBalanceMessage ? (
              renderWalletBalanceMessage()
            ) : isFAQMessage ? (
              renderFAQMessage()
            ) : isFAQAnswerMessage ? (
              renderFAQAnswerMessage()
            ) : (
              <div className="px-4 py-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message}
                </p>
              </div>
            )}
          </div>

          {/* 타임스탬프 */}
          {timestamp && (
            <span className={cn(
              "text-xs text-gray-400 mt-1",
              isBot ? "text-left" : "text-right"
            )}>
              {timestamp}
            </span>
          )}

          {/* 옵션 버튼들 */}
          {options && options.length > 0 && (
            <div className="mt-3 space-y-2">
              {options.map((option, index) => {
                // 아이콘과 색상 매핑
                const getOptionStyle = (optionText: string) => {
                  if (optionText.includes('하나패스')) {
                    return {
                      icon: <Info className="w-4 h-4" />,
                      bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50',
                      borderColor: 'border-green-200',
                      iconBg: 'bg-green-100',
                      iconColor: 'text-green-600',
                      textColor: 'text-green-700',
                      hoverBg: 'hover:from-green-100 hover:to-emerald-100'
                    }
                  } else if (optionText.includes('운세')) {
                    return {
                      icon: <Clover className="w-4 h-4" />,
                      bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50',
                      borderColor: 'border-green-200',
                      iconBg: 'bg-green-100',
                      iconColor: 'text-green-600',
                      textColor: 'text-green-700',
                      hoverBg: 'hover:from-green-100 hover:to-emerald-100'
                    }
                  } else if (optionText.includes('금융 단어')) {
                    return {
                      icon: <BookOpen className="w-4 h-4" />,
                      bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50',
                      borderColor: 'border-green-200',
                      iconBg: 'bg-green-100',
                      iconColor: 'text-green-600',
                      textColor: 'text-green-700',
                      hoverBg: 'hover:from-green-100 hover:to-emerald-100'
                    }
                  } else if (optionText.includes('FAQ') || optionText.includes('질문')) {
                    return {
                      icon: <MessageCircleMore className="w-4 h-4" />,
                      bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50',
                      borderColor: 'border-green-200',
                      iconBg: 'bg-green-100',
                      iconColor: 'text-green-600',
                      textColor: 'text-green-700',
                      hoverBg: 'hover:from-green-100 hover:to-emerald-100'
                    }
                  } else if (optionText.includes('사기')) {
                    return {
                      icon: <Activity className="w-4 h-4" />,
                      bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50',
                      borderColor: 'border-green-200',
                      iconBg: 'bg-green-100',
                      iconColor: 'text-green-600',
                      textColor: 'text-green-700',
                      hoverBg: 'hover:from-green-100 hover:to-emerald-100'
                    }
                  } else if (optionText.includes('다른 서비스') || optionText.includes('서비스 이용')) {
                    return {
                      icon: <MessageCircleIcon className="w-4 h-4" />,
                      bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50',
                      borderColor: 'border-green-200',
                      iconBg: 'bg-green-100',
                      iconColor: 'text-green-600',
                      textColor: 'text-green-700',
                      hoverBg: 'hover:from-green-100 hover:to-emerald-100'
                    }
                  } else if (optionText.includes('대화 종료') || optionText.includes('종료')) {
                    return {
                      icon: <MessageCircleX className="w-4 h-4" />,
                      bgColor: 'bg-gradient-to-r from-red-50 to-pink-50',
                      borderColor: 'border-red-200',
                      iconBg: 'bg-red-100',
                      iconColor: 'text-red-600',
                      textColor: 'text-red-700',
                      hoverBg: 'hover:from-red-100 hover:to-pink-100'
                    }
                  } else {
                    // F&Q 개별 질문들과 기타 옵션들
                    return {
                      icon: <HelpCircle className="w-4 h-4" />,
                      bgColor: 'bg-gradient-to-r from-gray-50 to-slate-50',
                      borderColor: 'border-gray-200',
                      iconBg: 'bg-gray-100',
                      iconColor: 'text-gray-600',
                      textColor: 'text-gray-700',
                      hoverBg: 'hover:from-gray-100 hover:to-slate-100'
                    }
                  }
                }

                const style = getOptionStyle(option)

                return (
                  <button
                    key={index}
                    onClick={() => onOptionClick?.(option)}
                    className={`w-full flex items-center gap-3 p-3 ${style.bgColor} ${style.hoverBg} border ${style.borderColor} rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md group`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 ${style.iconBg} rounded-xl flex items-center justify-center ${style.iconColor} group-hover:scale-105 transition-transform duration-200`}>
                      {style.icon}
                    </div>
                    <span className={`text-sm font-medium ${style.textColor} text-left flex-1`}>
                      {option}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

ChatMessage.displayName = "ChatMessage"
