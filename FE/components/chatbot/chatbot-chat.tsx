"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Bot, Sparkles, Star, DollarSign, Palette, Key, Hash, Lightbulb, Heart, Target, Zap, Compass, Wallet, TrendingUp, Newspaper, ShoppingBag, Gift, Users, CreditCard, DollarSign as DollarSignIcon, Activity, HelpCircle, Shield } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { cn } from "@/lib/utils"
import { ChatbotApi, FortuneResponse, FinancialWordResponse } from "@/lib/api/chatbot"
import { useAuthStore } from "@/store/auth"
import { getWalletBalance } from "@/lib/api/wallet"

interface Message {
  id: string
  text: string
  isBot: boolean
  timestamp: string
  options?: string[]
}

interface ChatbotChatProps {
  isOpen: boolean
  onClose: () => void
  userBirthDate?: string
}

const zodiacSigns = [
  { name: "물병자리", emoji: "♒", dateRange: "1월 20일 ~ 2월 18일" },
  { name: "물고기자리", emoji: "♓", dateRange: "2월 19일 ~ 3월 20일" },
  { name: "양자리", emoji: "♈", dateRange: "3월 21일 ~ 4월 19일" },
  { name: "황소자리", emoji: "♉", dateRange: "4월 20일 ~ 5월 20일" },
  { name: "쌍둥이자리", emoji: "♊", dateRange: "5월 21일 ~ 6월 21일" },
  { name: "게자리", emoji: "♋", dateRange: "6월 22일 ~ 7월 22일" },
  { name: "사자자리", emoji: "♌", dateRange: "7월 23일 ~ 8월 22일" },
  { name: "처녀자리", emoji: "♍", dateRange: "8월 23일 ~ 9월 22일" },
  { name: "천칭자리", emoji: "♎", dateRange: "9월 23일 ~ 10월 22일" },
  { name: "전갈자리", emoji: "♏", dateRange: "10월 23일 ~ 11월 21일" },
  { name: "사수자리", emoji: "♐", dateRange: "11월 22일 ~ 12월 21일" },
  { name: "염소자리", emoji: "♑", dateRange: "12월 22일 ~ 1월 19일" },
]

export function ChatbotChat({ isOpen, onClose, userBirthDate }: ChatbotChatProps) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // 메시지 시작 부분으로 스크롤하는 함수 (살짝 위로 여백 추가)
  const scrollToMessageStart = (messageId: string) => {
    const messageElement = messageRefs.current[messageId]
    if (messageElement) {
      // 메시지보다 살짝 위로 스크롤하여 여백 확보
      const container = messageElement.closest('.overflow-y-auto')
      if (container) {
        const messageTop = messageElement.offsetTop
        const containerTop = container.scrollTop
        const offset = 10 // 위쪽 여백 10px
        
        container.scrollTo({
          top: messageTop - offset,
          behavior: "smooth"
        })
      } else {
        // fallback: 기본 scrollIntoView 사용
        messageElement.scrollIntoView({ 
          behavior: "smooth", 
          block: "start"
        })
      }
    }
  }

  // 기존 scrollToBottom 함수는 유지 (필요시 사용)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 새 메시지가 추가될 때 스크롤 처리
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      // 봇 메시지인 경우, 사용자가 보낸 메시지의 시작 부분으로 스크롤
      if (lastMessage.isBot && messages.length > 1) {
        // 사용자가 보낸 메시지 찾기 (바로 이전 메시지)
        const userMessage = messages[messages.length - 2]
        if (userMessage && !userMessage.isBot) {
          // DOM 업데이트 후 스크롤 실행을 위해 다음 프레임에서 실행
          setTimeout(() => {
            scrollToMessageStart(userMessage.id)
          }, 100)
        }
      }
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // 초기 메시지
      const welcomeMessage: Message = {
        id: "1",
        text: "안녕하세요! \n저는 하나패스의 길잡이에요🧭 \n무엇을 도와드릴까요?",
        isBot: true,
        timestamp: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        options: ["하나패스 알아보기", "오늘의 운세 보기", "오늘의 금융 단어", "FAQ"]
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen])

  const getZodiacSign = (date: string) => {
    const birthDate = new Date(date)
    const month = birthDate.getMonth() + 1
    const day = birthDate.getDate()

    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return zodiacSigns[0]
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return zodiacSigns[1]
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return zodiacSigns[2]
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return zodiacSigns[3]
    if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return zodiacSigns[4]
    if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return zodiacSigns[5]
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return zodiacSigns[6]
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return zodiacSigns[7]
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return zodiacSigns[8]
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return zodiacSigns[9]
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return zodiacSigns[10]
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return zodiacSigns[11]

    return null
  }

  /**
   * 생년월일로부터 나이 계산
   */
  const calculateAge = (birthDate: string): number => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  // 금융 용어 배열을 한 번만 정의하여 재사용
  const FINANCIAL_TERMS = [
    "복리", "단리", "수익률", "원금", "이자", "금리", "주식", "펀드", "채권", "보험",
    "신용카드", "체크카드", "대출", "예치", "적금", "예금", "투자", "저축", "자산",
    "부채", "순자산", "자본", "손익", "손실", "수익", "매수", "매도", "시장가", "호가",
    "금융", "경제", "체결", "지정가", "거래", "증권", "코스피", "코스닥", "배당", "배당금", "배당률",
    "PER", "PBR", "ROE", "ROA", "EPS", "BPS", "시가총액", "유동비율", "부채비율",
    "자기자본비율", "영업이익", "순이익", "매출", "매출액", "현금", "현금흐름",
    "재무제표", "손익계산서", "재무상태표", "현금흐름표", "주요지표", "예산", "지출",
    "용돈", "계획", "목표", "소비", "절약", "관리"
  ] as const

  /**
   * 운세 관련 키워드 감지 함수
   */
  const isFortuneKeyword = (message: string): boolean => {
    const fortuneKeywords = [
      '운세', '운', '오늘의 운세', '오늘 운세', '오늘 운', '운세 보여줘', '운세 알려줘',
      '운세 궁금해', '운이 어때', '운이 어떠냐', '운세 봐줘', '운세 보기',
      '점성술', '별자리 운세', '오늘 점성술', '오늘 별자리', '운세 확인',
      'fortune', 'zodiac', 'horoscope'
    ]
    
    const normalizedMessage = message.toLowerCase().trim()
    return fortuneKeywords.some(keyword => 
      normalizedMessage.includes(keyword.toLowerCase())
    )
  }

  /**
   * 하나패스 관련 키워드 감지 함수
   */
  const isHanaPathKeyword = (message: string): boolean => {
    const hanaPathKeywords = [
      "하나패스", "hanapath", "하나 패스", "하나path", "하나 path",
      "하나패스가 뭐야", "하나패스가 뭔가요", "하나패스가 무엇인가요",
      "하나패스에 대해", "하나패스에 대해서", "하나패스 알려줘",
      "하나패스 소개", "하나패스 설명", "하나패스 기능", "하나패스 특징",
      "금융 플랫폼", "청소년 금융", "스마트 금융", "금융 앱"
    ]
    
    const normalizedMessage = message.toLowerCase().trim()
    return hanaPathKeywords.some(keyword => 
      normalizedMessage.includes(keyword.toLowerCase())
    )
  }

  /**
   * 금융 단어 관련 키워드 감지 함수
   */
  const isFinancialWordKeyword = (message: string): boolean => {
    const normalizedMessage = message.toLowerCase().trim()
    
    // 설명 요청 패턴들
    const explanationPatterns = [
      "에 대해서 설명해줘", "에 대해 설명해줘", "에 대해서 설명해주세요", "에 대해 설명해주세요",
      "이 뭐야", "이 뭔가요", "이 무엇인가요", "이 무엇이야", "이 뭐예요",
      "알려줘", "알려주세요", "가르쳐줘", "가르쳐주세요", "설명해줘", "설명해주세요",
      "무엇인가요", "무엇이야", "무엇예요", "뭐야", "뭔가요", "뭐예요",
      "뭔지", "무엇인지", "뭔지 알려줘", "무엇인지 알려줘"
    ]
    
    // 금융 키워드가 있는지 확인
    const hasFinancialKeyword = FINANCIAL_TERMS.some(keyword => 
      normalizedMessage.includes(keyword.toLowerCase())
    )
    
    // 설명 요청 패턴이 있는지 확인
    const hasExplanationPattern = explanationPatterns.some(pattern => 
      normalizedMessage.includes(pattern.toLowerCase())
    )
    
    console.log("🔍 금융 키워드 포함:", hasFinancialKeyword)
    console.log("🔍 설명 요청 패턴 포함:", hasExplanationPattern)
    
    // 금융 키워드만 있어도 감지
    if (hasFinancialKeyword) {
      return true
    }
    
    // 금융 키워드 + 설명 요청 패턴이 있으면 감지
    if (hasFinancialKeyword && hasExplanationPattern) {
      return true
    }
    
    // 특정 금융 용어들에 대한 설명 요청도 감지
    const hasSpecificTerm = FINANCIAL_TERMS.some(term => 
      normalizedMessage.includes(term.toLowerCase())
    )
    
    console.log("🔍 특정 금융 용어 포함:", hasSpecificTerm)
    
    return hasSpecificTerm && hasExplanationPattern
  }

  /**
   * 전자지갑 잔액 관련 키워드 감지
   */
  const isWalletBalanceKeyword = (message: string): boolean => {
    const normalizedMessage = message.toLowerCase().trim()
    
    const walletBalanceKeywords = [
      "전자지갑", "전자 지갑", "지갑", "wallet", "잔액", "잔고", "잔액 조회", "잔고 조회",
      "전자지갑 잔액", "전자지갑 잔고", "지갑 잔액", "지갑 잔고", "잔액 보여줘", "잔고 보여줘",
      "전자지갑 잔액 보여줘", "전자지갑 잔고 보여줘", "지갑 잔액 보여줘", "지갑 잔고 보여줘",
      "잔액 확인", "잔고 확인", "전자지갑 잔액 확인", "전자지갑 잔고 확인",
      "지갑 잔액 확인", "지갑 잔고 확인", "얼마 있어", "돈 얼마", "현재 잔액", "현재 잔고"
    ]
    
    return walletBalanceKeywords.some(keyword => normalizedMessage.includes(keyword))
  }

  /**
   * FAQ 관련 키워드 감지
   */
  const isFAQKeyword = (message: string): boolean => {
    const normalizedMessage = message.toLowerCase().trim()
    
    const faqKeywords = [
      "faq", "자주 묻는 질문", "자주묻는질문", "질문", "궁금해", "궁금한 것", "궁금한게",
      "어떻게", "무엇을", "무엇", "뭘", "뭐를", "어디서", "언제", "왜",
      "하나머니", "레벨", "레벨업", "모의투자", "모의 투자", "투자 계좌", "투자계좌",
      "부모", "자녀", "관계", "용돈"
    ]
    
    return faqKeywords.some(keyword => normalizedMessage.includes(keyword))
  }

  /**
   * FAQ 답변 생성
   */
  const getFAQAnswers = () => {
    return [

      {
        question: "관계 등록은 어떻게 하나요?",
        answer: `관계 등록

등록 절차
1. 마이페이지에서 설정 탭으로 이동
2. '관계 정보 관리' 메뉴 선택
3. 상대방 정보 입력
4. 상대방에게 관계 등록 요청 전송
5. 상대방이 요청을 수락하면 등록 완료

등록 후 이용 가능한 기능
• 자녀 용돈 자동 송금 설정
• 가족 간 안전하고 편리한 송금


가족 모두 하나패스 회원이어야 관계 등록이 가능합니다. 등록 후에는 더욱 다양한 가족 맞춤 서비스를 이용하실 수 있어요!`
      },
      {
        question: "용돈 설정은 어떻게 하나요?",
        answer: `용돈 자동 송금 설정

설정 방법
1. 마이페이지의 설정 탭 접속
2. '용돈 설정' 메뉴 선택
3. 용돈을 받을 자녀 선택
4. 매월 송금할 용돈 금액 입력
5. 매월 송금 날짜 지정 

자동 송금 시스템
• 매월 지정한 날짜에 자동으로 송금 실행
• 부모 전자지갑 잔액이 부족할 경우 송금 실패 알림
• 송금 완료 시 부모와 자녀 모두에게 알림 발송
• 모든 송금 내역은 거래 기록에서 확인 가능

사전에 가족 관계 등록이 완료되어야 용돈 자동 송금 기능을 사용할 수 있습니다.`
      }, 

      {
        question: "하나머니는 어떻게 적립할 수 있나요?",
        answer: `하나머니 적립 방법

일일 기본 활동
• 출석 체크 
• 퀴즈 정답 
• 뉴스 읽기

특별 활동 보너스
• 친구 초대
• 이벤트 참여 
• 하나패스 기능 이용

꾸준한 활동이 가장 확실한 적립 방법이에요!`
      },

      {
        question: "하나머니로 무엇을 할 수 있나요?",
        answer: `하나머니 활용 방법

주요 기능
• 하나패스 스토어에서 다양한 상품 구매
• 내 실제 계좌로 직접 이체 가능
• 하나패스 내 모든 서비스에서 결제 수단으로 활용

하나머니는 하나패스에서만 사용할 수 있는 전용 포인트입니다. 실제 현금과 동일하게 사용할 수 있어 매우 유용해요!`
      },
      {
        question: "어떻게 하면 레벨이 오르나요?",
        answer: `레벨업 방법

경험치 획득 활동
• 매일 출석 체크 
• 일일 퀴즈 정답
• 금융 뉴스 학습
• 커뮤니티 활동
• 친구 초대
• 다양한 하나패스 서비스 이용

레벨 구간별 명칭
• Lv.1 씨앗 - 첫걸음 단계
• Lv.2 새싹 - 성장 시작 단계
• Lv.3 나무 - 뿌리 내린 단계
• Lv.4 열매 - 성과의 단계
• Lv.5 거목 - 완성의 단계

매일 꾸준히 활동하시면 자연스럽게 레벨업됩니다!`
      },
    
      {
        question: "모의 투자 계좌 충전이 가능한가요?",
        answer: `모의 투자 계좌 재충전

재충전 이용 조건
• 하루 1회 제한
• 레벨 2 이상부터 이용 가능

레벨별 재충전 금액
• Lv.2 새싹 - 50,000원
• Lv.3 나무 - 100,000원
• Lv.4 열매 - 300,000원
• Lv.5 거목 - 500,000원

투자 가이드
모의 투자는 실제 투자 경험을 쌓는 학습 도구입니다. 신중하게 투자 결정을 내리고, 손실이 발생해도 좌절하지 말고 배움의 기회로 활용해보세요.`
      },
     
    ]
  }

  /**
   * 메시지에서 금융 용어 추출
   */
  const extractFinancialTerm: (message: string) => string | null = (message: string): string | null => {
    const normalizedMessage: string = message.toLowerCase().trim()
    
    // 메시지에서 금융 용어 찾기
    for (const term of FINANCIAL_TERMS) {
      if (normalizedMessage.includes(term.toLowerCase())) {
        return term
      }
    }
    
    return null
  }



  /**
   * API 응답을 포맷팅하여 메시지로 변환
   */
  const formatFortuneMessage = (fortune: FortuneResponse) => {
    const userName = user?.name || "사용자"
    return `${fortune.zodiacSign}인 ${userName}님의 오늘의 운세

${fortune.todayFortune}

${fortune.moneyFortune}
${fortune.luckyColor}
${fortune.luckyItem}
${fortune.luckyNumber}
${fortune.luckyTime}

${fortune.luckyMessage}`
  }

  /**
   * 금융 단어 응답을 포맷팅하여 메시지로 변환
   */
  const formatFinancialWordMessage = (financialWord: FinancialWordResponse) => {
    return `📚 오늘의 금융 단어: ${financialWord.word}

📖 정의
${financialWord.definition}

💡 예시
${financialWord.example}

💭 학습 팁
${financialWord.tip}

🔗 관련 단어: ${financialWord.relatedWords}`
  }

  const addMessage = (text: string, isBot: boolean, options?: string[]) => {
    // 빈 메시지 방지
    const trimmedText = text.trim()
    if (!trimmedText) return
    
    setMessages(prev => {
      const newMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: trimmedText,
        isBot,
        timestamp: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        options
      }
      
      return [...prev, newMessage]
    })
  }

      const handleOptionClick = async (option: string) => {
    // 사용자 선택 메시지 추가
    addMessage(option, false)

    setIsTyping(true)

    // 타이핑 효과를 위한 지연
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (option === "오늘의 운세 보기") {
      console.log("🔮 운세 요청 - userBirthDate:", userBirthDate)
      
      if (userBirthDate && user?.id) {
        const sign = getZodiacSign(userBirthDate)
        console.log("🔮 계산된 별자리:", sign)
        
        if (sign) {
          try {
            // 운세 생성
            const fortuneResponse = await ChatbotApi.generateFortune({
              userId: user.id,
              zodiacSign: sign.name,
              birthDate: userBirthDate
            })
            
            // 새로운 운세 형식으로 메시지 구성
            const fortuneMessage = formatFortuneMessage(fortuneResponse)
            addMessage(fortuneMessage, true, ["다른 서비스 이용하기", "대화 종료"])
            
          } catch (error) {
            console.error("❌ 운세 생성 실패:", error)
            // 실패 시 기본 메시지 표시
            addMessage(
              "죄송해요. 운세 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
              true,
              ["다른 서비스 이용하기", "대화 종료"]
            )
          }
        } else {
          console.log("❌ 별자리 계산 실패")
          addMessage(
            "죄송해요. 회원정보에서 생년월일을 찾을 수 없어요.\n마이페이지에서 생년월일 정보를 확인해주세요.",
            true,
            ["다른 서비스 이용하기", "대화 종료"]
          )
        }
      } else {
        console.log("❌ userBirthDate 또는 user.id가 비어있음")
        addMessage(
          "죄송해요. 회원정보에서 생년월일을 찾을 수 없어요.\n마이페이지에서 생년월일 정보를 확인해주세요.",
          true,
          ["다른 서비스 이용하기", "대화 종료"]
        )
      }
    } else if (option === "오늘의 금융 단어") {
      console.log("📚 금융 단어 요청 - userBirthDate:", userBirthDate)
      
      if (userBirthDate && user?.id) {
        const userAge = calculateAge(userBirthDate)
        console.log("📚 계산된 나이:", userAge)
        
        try {
          // 금융 단어 생성
          const financialWordResponse = await ChatbotApi.generateFinancialWord({
            userId: user.id,
            userAge: userAge,
            category: undefined // 카테고리는 추후 확장 가능
          })
          
          // 금융 단어 메시지 구성
          const financialWordMessage = formatFinancialWordMessage(financialWordResponse)
          addMessage(financialWordMessage, true, ["다른 서비스 이용하기", "대화 종료"])
          
        } catch (error) {
          console.error("❌ 금융 단어 생성 실패:", error)
          // 실패 시 기본 메시지 표시
          addMessage(
            "죄송해요. 금융 단어 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
            true,
            ["다른 서비스 이용하기", "대화 종료"]
          )
        }
      } else {
        console.log("❌ userBirthDate 또는 user.id가 비어있음")
        addMessage(
          "죄송해요. 회원정보에서 생년월일을 찾을 수 없어요.\n\n금융 단어를 보려면 마이페이지에서 주민등록번호 정보를 입력해주세요.",
          true,
          ["다른 서비스 이용하기", "대화 종료"]
        )
      }
    } else if (option === "하나패스 알아보기") {
      addMessage(
        `[HANAPATH_INTRO] HanaPath 소개

하나패스는 청소년을 위한 스마트 금융 플랫폼이에요!

[FEATURES] 제공하는 기능
• [WALLET] 전자 지갑 - 용돈 관리, 송금, 소비 내역 분석
• [INVESTMENT] 모의 투자 - 실시간 주식 데이터, 포트폴리오 관리
• [SECURITY] 보안 검색 - AI 스미싱 탐지, 사기 피해 조회
• [NEWS] 뉴스 및 퀴즈 - 금융 뉴스 해설, 일일 퀴즈
• [STORE] 스토어 - 하나머니로 상품 구매
• [HANAMONEY] 하나머니 - 출석, 퀴즈 보상 시스템
• [COMMUNITY] 커뮤니티 - 금융 토론, 정보 공유
• [CHATBOT] 챗봇 - 24시간 금융 상담 및 도우미 서비스

하나패스는 여러분의 금융 첫걸음을 함께해요!🐾`,
        true,
        ["다른 서비스 이용하기", "대화 종료"]
      )
    } else if (option === "FAQ") {
      // FAQ 메뉴 표시
      const faqList = getFAQAnswers()
      const faqMenu = `❓ 자주 묻는 질문 (FAQ)`

      addMessage(
        faqMenu,
        true,
        faqList.map(faq => faq.question).concat(["다른 서비스 이용하기", "대화 종료"])
      )
    } else if (option === "다른 서비스 이용하기") {
      addMessage(
        "무엇을 도와드릴까요?",
        true,
        ["하나패스 알아보기", "오늘의 운세 보기", "오늘의 금융 단어", "FAQ"]
      )
    } else if (option === "대화 종료") {
      addMessage(
        "감사합니다! \n도움이 필요하실 땐 언제든 말씀해 주세요.",
        true
      )
    } else if (option === "다른 질문 보기") {
      // FAQ 메뉴 다시 표시
      const faqList = getFAQAnswers()
      const faqMenu = `❓ 자주 묻는 질문 (FAQ)

다른 궁금한 질문을 선택해주세요:

${faqList.map((faq, index) => `${index + 1}. ${faq.question}`).join('\n')}`

      addMessage(
        faqMenu,
        true,
        faqList.map(faq => faq.question).concat(["다른 서비스 이용하기", "대화 종료"])
      )
    } else {
      // FAQ 질문 답변 처리
      const faqList = getFAQAnswers()
      const selectedFAQ = faqList.find(faq => faq.question === option)
      
      if (selectedFAQ) {
        addMessage(
          selectedFAQ.answer,
          true,
          ["다른 질문 보기", "다른 서비스 이용하기", "대화 종료"]
        )
      }
    }

    setIsTyping(false)
  }

  const handleSendMessage = async (message: string) => {
    // 중복 방지를 위해 빈 메시지나 이미 처리된 메시지인지 확인
    if (!message.trim()) return
    
    addMessage(message, false)
    
    // 운세 관련 키워드 감지
    if (isFortuneKeyword(message)) {
      setIsTyping(true)
      
      // 타이핑 효과를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 안내 메시지 추가
      addMessage("운세를 확인해드릴게요! 🥠", true)
      
      // 기존 운세 로직 실행
      console.log("🔮 운세 키워드 감지 - userBirthDate:", userBirthDate)
      console.log("🔮 사용자 정보:", user)
      
      if (userBirthDate && user?.id) {
        const sign = getZodiacSign(userBirthDate)
        console.log("🔮 계산된 별자리:", sign)
        
        if (sign) {
          try {
            // 운세 생성
            const fortuneResponse = await ChatbotApi.generateFortune({
              userId: user.id,
              zodiacSign: sign.name,
              birthDate: userBirthDate
            })
            
            // 새로운 운세 형식으로 메시지 구성
            const fortuneMessage = formatFortuneMessage(fortuneResponse)
            addMessage(fortuneMessage, true, ["다른 서비스 이용하기", "대화 종료"])
            
          } catch (error) {
            console.error("❌ 운세 생성 실패:", error)
            // 실패 시 기본 메시지 표시
            addMessage(
              "죄송해요. 운세 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
              true,
              ["다른 서비스 이용하기", "대화 종료"]
            )
          }
        } else {
          console.log("❌ 별자리 계산 실패 - userBirthDate:", userBirthDate)
          addMessage(
            "죄송해요. 생년월일 정보가 올바르지 않아요.\n마이페이지에서 주민등록번호 정보를 확인해주세요.",
            true,
            ["다른 서비스 이용하기", "대화 종료"]
          )
        }
      } else {
        console.log("❌ userBirthDate 또는 user.id가 비어있음")
        console.log("❌ userBirthDate:", userBirthDate)
        console.log("❌ user.id:", user?.id)
        addMessage(
          "죄송해요. 회원정보에서 생년월일을 찾을 수 없어요.\n\n운세를 보려면 마이페이지에서 주민등록번호 정보를 입력해주세요.",
          true,
          ["다른 서비스 이용하기", "대화 종료"]
        )
      }
      
      setIsTyping(false)
      return
    }
    
    // 하나패스 관련 키워드 감지
    console.log("하나패스 키워드 감지 결과:", isHanaPathKeyword(message))
    
    if (isHanaPathKeyword(message)) {
      setIsTyping(true)
      
      // 타이핑 효과를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 안내 메시지 추가
      addMessage("하나패스에 대해 알려드릴게요! 📍", true)
      
      addMessage(
        `[HANAPATH_INTRO] HanaPath 소개

하나패스는 청소년을 위한 스마트 금융 플랫폼이에요!

[FEATURES] 제공하는 기능
• [WALLET] 전자 지갑 - 용돈 관리, 송금, 소비 내역 분석
• [INVESTMENT] 모의 투자 - 실시간 주식 데이터, 포트폴리오 관리
• [SECURITY] 보안 검색 - AI 스미싱 탐지, 사기 피해 조회
• [NEWS] 뉴스 및 퀴즈 - 금융 뉴스 해설, 일일 퀴즈
• [STORE] 스토어 - 하나머니로 상품 구매
• [HANAMONEY] 하나머니 - 출석, 퀴즈 보상 시스템
• [COMMUNITY] 커뮤니티 - 금융 토론, 정보 공유
• [CHATBOT] 챗봇 - 24시간 금융 상담 및 도우미 서비스

하나패스는 여러분의 금융 첫걸음을 함께해요!🐾`,
        true,
        ["다른 서비스 이용하기", "대화 종료"]
      )
      
      setIsTyping(false)
      return
    }
    
    // 금융 단어 관련 키워드 감지
    console.log("🔍 메시지 분석:", message)
    console.log("🔍 금융 단어 키워드 감지 결과:", isFinancialWordKeyword(message))
    
    if (isFinancialWordKeyword(message)) {
      setIsTyping(true)
      
      // 타이핑 효과를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 안내 메시지 추가
      addMessage("금융 단어를 찾아드릴게요! 📚", true)
      
      console.log("📚 금융 단어 키워드 감지 - userBirthDate:", userBirthDate)
      console.log("📚 사용자 정보:", user)
      
      if (userBirthDate && user?.id) {
        const userAge = calculateAge(userBirthDate)
        const extractedTerm = extractFinancialTerm(message)
        console.log("📚 계산된 나이:", userAge)
        console.log("📚 추출된 금융 용어:", extractedTerm)
        
        try {
          // 금융 단어 생성
          const financialWordResponse = await ChatbotApi.generateFinancialWord({
            userId: user.id,
            userAge: userAge,
            category: extractedTerm || undefined // 추출된 용어를 카테고리로 사용
          })
          
          // 금융 단어 메시지 구성
          const financialWordMessage = formatFinancialWordMessage(financialWordResponse)
          addMessage(financialWordMessage, true, ["다른 서비스 이용하기", "대화 종료"])
          
        } catch (error) {
          console.error("❌ 금융 단어 생성 실패:", error)
          // 실패 시 기본 메시지 표시
          addMessage(
            "죄송해요. 금융 단어 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
            true,
            ["다른 서비스 이용하기", "대화 종료"]
          )
        }
      } else {
        console.log("❌ userBirthDate 또는 user.id가 비어있음")
        addMessage(
          "죄송해요. 회원정보에서 생년월일을 찾을 수 없어요.\n\n금융 단어를 보려면 마이페이지에서 주민등록번호 정보를 입력해주세요.",
          true,
          ["다른 서비스 이용하기", "대화 종료"]
        )
      }
      
      setIsTyping(false)
      return
    }
    
    // 전자지갑 잔액 관련 키워드 감지
    console.log("💰 전자지갑 잔액 키워드 감지 결과:", isWalletBalanceKeyword(message))
    
    if (isWalletBalanceKeyword(message)) {
      setIsTyping(true)
      
      // 타이핑 효과를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 안내 메시지 추가
      addMessage("전자지갑 잔액을 확인해드릴게요! 💰", true)
      
      if (user?.id) {
        try {
          // 전자지갑 잔액 조회
          const walletBalance = await getWalletBalance(user.id)
          
          // 잔액 메시지 구성
          const balanceMessage = `[WALLET_BALANCE] ${user?.name || '사용자'}님의 전자지갑

[ACCOUNT_INFO]
계좌번호: ${walletBalance.accountNumber}
현재 잔액: ${walletBalance.balance.toLocaleString()}원

[MESSAGE] 전자지갑에서 용돈 관리와 송금을 이용해보세요!`
          
          addMessage(balanceMessage, true, ["다른 서비스 이용하기", "대화 종료"])
          
        } catch (error) {
          console.error("❌ 전자지갑 잔액 조회 실패:", error)
          addMessage(
            "전자지갑 잔액 조회에 실패했어요.\n전자지갑이 아직 생성되지 않았거나, \n일시적인 오류일 수 있습니다. \n잠시 후 다시 시도해주세요.",
            true,
            ["다른 서비스 이용하기", "대화 종료"]
          )
        }
      } else {
        console.log("❌ user.id가 비어있음")
        addMessage(
          "로그인이 필요해요.\n\n전자지갑 잔액을 확인하려면 먼저 로그인해주세요.",
          true,
          ["다른 서비스 이용하기", "대화 종료"]
        )
      }
      
      setIsTyping(false)
      return
    }
    
    // FAQ 관련 키워드 감지
    console.log("❓ FAQ 키워드 감지 결과:", isFAQKeyword(message))
    
    if (isFAQKeyword(message)) {
      setIsTyping(true)
      
      // 타이핑 효과를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 안내 메시지 추가
      addMessage("자주 묻는 질문을 확인해드릴게요! ❓", true)
      
      // FAQ 메뉴 표시
      const faqList = getFAQAnswers()
      
      // 특정 키워드에 맞는 답변 찾기
      let matchedFAQ = null
      for (const faq of faqList) {
        if (message.includes("하나머니") && faq.question.includes("하나머니")) {
          matchedFAQ = faq
          break
        } else if ((message.includes("레벨") || message.includes("레벨업")) && faq.question.includes("레벨")) {
          matchedFAQ = faq
          break
        } else if ((message.includes("모의투자") || message.includes("모의 투자") || message.includes("투자")) && faq.question.includes("모의 투자")) {
          matchedFAQ = faq
          break
        } else if ((message.includes("부모") || message.includes("자녀") || message.includes("관계")) && faq.question.includes("관계")) {
          matchedFAQ = faq
          break
        } else if (message.includes("용돈") && faq.question.includes("용돈")) {
          matchedFAQ = faq
          break
        }
      }
      
      if (matchedFAQ) {
        // 특정 질문에 대한 답변 표시
        addMessage(
          matchedFAQ.answer,
          true,
          ["다른 질문 보기", "다른 서비스 이용하기", "대화 종료"]
        )
      } else {
        // 전체 FAQ 메뉴 표시
        const faqMenu = `❓ 자주 묻는 질문 (FAQ)`

        addMessage(
          faqMenu,
          true,
          faqList.map(faq => faq.question).concat(["다른 서비스 이용하기", "대화 종료"])
        )
      }
      
      setIsTyping(false)
      return
    }
    
    // 모든 키워드가 감지되지 않은 경우 기본 응답
    console.log("❌ 모든 키워드가 감지되지 않음 - 기본 응답")
    
    const responseMessage = "죄송해요. 아직 지원하지 않는 기능이에요. \n위의 옵션 중에서 선택해주세요! 😊"
    const responseOptions = ["하나패스 알아보기", "오늘의 운세 보기", "오늘의 금융 단어", "FAQ"]
    
    // 즉시 응답 추가
    addMessage(responseMessage, true, responseOptions)
  }

  const handleFileUpload = (file: File) => {
    // 파일 업로드 메시지 추가
    addMessage(`📎 ${file.name} (${(file.size / 1024).toFixed(1)}KB)`, false)
    
    // 파일 업로드 응답
    const fileResponseMessage = "📎 파일이 업로드되었습니다!\n\n현재 파일 업로드 기능은 준비 중입니다.\n곧 업데이트될 예정이니 기대해주세요! ✨"
    const fileResponseOptions = ["다른 서비스 이용하기", "대화 종료"]
    
    setTimeout(() => {
      setMessages(prev => {
        // 이미 동일한 응답 메시지가 있는지 확인
        const hasResponse = prev.some(msg => 
          msg.isBot && 
          msg.text === fileResponseMessage
        )
        
        if (hasResponse) {
          return prev
        }
        
        const newMessage: Message = {
          id: `file-response-${Date.now()}`,
          text: fileResponseMessage,
          isBot: true,
          timestamp: new Date().toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          options: fileResponseOptions
        }
        
        return [...prev, newMessage]
      })
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mr-24 mt-10">
        <Card className="w-[400px] sm:w-[430px] max-w-[calc(100vw-2rem)] h-[85vh] max-h-[850px] shadow-2xl border-0 bg-white flex flex-col rounded-[32px] overflow-hidden">
          {/* 헤더 */}
          <CardHeader className="pb-3 border-b border-gray-100 bg-white shrink-0 sticky top-0 z-10 rounded-t-[32px]">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Compass className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent font-extrabold flex items-center gap-1">
                    Path Navi
                    {/* <Compass className="w-4 h-4 text-emerald-600" /> */}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs text-emerald-600">온라인</span>
                  </div>
                </div>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          {/* 채팅 영역 */}
          <CardContent className="p-0 flex-1 flex flex-col relative">
            <div className="flex-1 overflow-y-auto p-4 pb-8 bg-gray-50 min-h-0 max-h-[calc(85vh-160px)]">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.text}
                  isBot={message.isBot}
                  timestamp={message.timestamp}
                  options={message.options}
                  onOptionClick={handleOptionClick}
                  ref={(el) => { messageRefs.current[message.id] = el }}
                />
              ))}
              
              {/* 타이핑 인디케이터 */}
              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="flex max-w-[80%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 mr-3 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
            
          {/* 입력 영역 */}
          <ChatInput 
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            placeholder="메시지를 입력하세요..."
          />
        </Card>
      </div>
    </div>
  )
}
