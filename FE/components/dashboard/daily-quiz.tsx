"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Lightbulb, ArrowRight, CheckCircle, X, Brain, Award, Calendar, Clock, Sparkles, HelpCircle, BookOpen, Star } from "lucide-react"
import { quizApi, QuizDto, QuizStatusDto, QuizAnswerRequestDto, QuizAnswerResponseDto } from "@/lib/api/quiz"

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring" as const, 
      stiffness: 300, 
      damping: 25 
    } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: 20,
    transition: { 
      duration: 0.2 
    } 
  }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

interface DailyQuizProps {
  isOpen: boolean
  onClose: () => void
  quizData: QuizDto | null
  onQuizCompleted: () => void
}

export function DailyQuizModal({ isOpen, onClose, quizData, onQuizCompleted }: DailyQuizProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [explanation, setExplanation] = useState("")
  const [difficultTerms, setDifficultTerms] = useState<string | null>(null)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // 어려운 단어 설명을 파싱하는 함수
  const parseDifficultTerms = (termsJson: string | null) => {
    if (!termsJson) return null
    try {
      return JSON.parse(termsJson)
    } catch (error) {
      console.error('어려운 단어 파싱 실패:', error)
      return null
    }
  }

  const handleSubmit = async () => {
    if (selectedAnswer !== null && quizData) {
      setIsLoading(true)
      try {
        const request: QuizAnswerRequestDto = {
          quizId: quizData.id,
          userAnswer: selectedAnswer
        }
        
        const response: QuizAnswerResponseDto = await quizApi.submitQuizAnswer(request)
        
        setIsSubmitted(true)
        setIsCorrect(response.isCorrect)
        setExplanation(response.explanation)
        setDifficultTerms(response.difficultTerms)
        setEarnedPoints(response.earnedPoints)
        
        if (response.isCorrect) {
          toast.success("정답입니다!", {
            description: `하나머니 ${response.earnedPoints}P가 적립되었습니다.`,
          })
        } else {
          toast.error("틀렸습니다", {
            description: "다시 한번 생각해보세요!",
          })
        }
        
        // 해설이 표시되면 사용자가 직접 닫기 버튼을 눌러야 함
      } catch (error) {
        console.error('퀴즈 제출 실패:', error)
        toast.error("퀴즈 제출에 실패했습니다", {
          description: "잠시 후 다시 시도해주세요.",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleClose = () => {
    if (!isSubmitted) {
      setSelectedAnswer(null)
    }
    onClose()
  }

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedAnswer(null)
        setIsSubmitted(false)
        setIsCorrect(false)
        setExplanation("")
        setDifficultTerms(null)
        setEarnedPoints(0)
      }, 200)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0 shadow-2xl bg-transparent">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <Card className="w-full shadow-2xl border-0 overflow-hidden bg-white">
                {/* 헤더 */}
                <DialogHeader className="bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700 text-white relative overflow-hidden p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                  
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-xl font-bold tracking-tight">오늘의 금융 퀴즈</DialogTitle>
                      <p className="text-teal-50 text-sm mt-1 font-medium">O/X로 간단하게 퀴즈를 풀어보세요!</p>
                    </div>
                  </div>
                </DialogHeader>

                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* 퀴즈 질문 */}
                    <motion.div 
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      className="bg-gradient-to-br from-slate-50 to-gray-50 p-5 rounded-2xl border border-gray-100"
                    >
                      {quizData ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs text-teal-700 font-medium">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                            <span>정답 시 {quizData.points}P 적립</span>
                          </div>
                          <h3 className="text-base font-semibold text-gray-800 leading-relaxed">
                            Q. {quizData.question}
                          </h3>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <div className="animate-pulse">
                            <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-3"></div>
                            <div className="text-sm text-gray-500">오늘의 퀴즈를 불러오는 중...</div>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* 답변 선택 버튼 */}
                    {quizData && (
                      <motion.div 
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 gap-3"
                      >
                        <Button
                          variant="outline"
                          className={`h-14 text-base font-bold transition-all duration-300 rounded-2xl border-2 ${
                            isSubmitted
                              ? isCorrect && selectedAnswer === true
                                ? "border-teal-600 bg-teal-50 text-teal-800 shadow-lg"
                                : selectedAnswer === true && !isCorrect
                                  ? "border-red-400 bg-red-50 text-red-600 shadow-lg"
                                  : "border-gray-200 bg-gray-50 text-gray-400"
                              : selectedAnswer === true
                                ? "border-teal-600 bg-teal-50 text-teal-800 shadow-lg hover:shadow-xl"
                                : "hover:bg-gray-50 hover:border-gray-300 bg-white border-gray-200 hover:shadow-md"
                          }`}
                          onClick={() => !isSubmitted && setSelectedAnswer(true)}
                          disabled={isSubmitted || isLoading}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">O</span>
                            {isSubmitted && isCorrect && selectedAnswer === true && <CheckCircle className="h-5 w-5 text-teal-600" />}
                            {isSubmitted && selectedAnswer === true && !isCorrect && <X className="h-5 w-5 text-red-500" />}
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className={`h-14 text-base font-bold transition-all duration-300 rounded-2xl border-2 ${
                            isSubmitted
                              ? isCorrect && selectedAnswer === false
                                ? "border-teal-600 bg-teal-50 text-teal-800 shadow-lg"
                                : selectedAnswer === false && !isCorrect
                                  ? "border-red-400 bg-red-50 text-red-600 shadow-lg"
                                  : "border-gray-200 bg-gray-50 text-gray-400"
                              : selectedAnswer === false
                                ? "border-teal-600 bg-teal-50 text-teal-800 shadow-lg hover:shadow-xl"
                                : "hover:bg-gray-50 hover:border-gray-300 bg-white border-gray-200 hover:shadow-md"
                          }`}
                          onClick={() => !isSubmitted && setSelectedAnswer(false)}
                          disabled={isSubmitted || isLoading}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">X</span>
                            {isSubmitted && isCorrect && selectedAnswer === false && <CheckCircle className="h-5 w-5 text-teal-600" />}
                            {isSubmitted && selectedAnswer === false && !isCorrect && <X className="h-5 w-5 text-red-500" />}
                          </div>
                        </Button>
                      </motion.div>
                    )}

                    {/* 제출 버튼 */}
                    {!isSubmitted && quizData && (
                      <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 }}
                      >
                        <Button
                          className="w-full h-12 bg-gradient-to-r from-teal-700 to-cyan-700 hover:from-teal-800 hover:to-cyan-800 text-white font-semibold shadow-lg transition-all duration-300 rounded-2xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleSubmit}
                          disabled={selectedAnswer === null || isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              제출 중...
                            </>
                          ) : (
                            <>
                              정답 제출하기 <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}

                    {/* 해설 */}
                    {isSubmitted && explanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                      >

                        {/* 해설 내용 */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                            <h4 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                              <HelpCircle className="w-4 h-4 text-blue-500" />
                              해설
                            </h4>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">
                              {explanation}
                            </p>
                            
                            {/* 어려운 단어 설명 */}
                            {difficultTerms && parseDifficultTerms(difficultTerms) && (
                              <div className="pt-3 border-t border-gray-100 space-y-1.5">
                                {Object.entries(parseDifficultTerms(difficultTerms)!).map(([term, definition]) => (
                                  <div key={term} className="flex items-baseline gap-2 text-xs">
                                    <span className="font-semibold text-gray-800 min-w-fit flex-shrink-0">
                                      {term}:
                                    </span>
                                    <span className="text-gray-600 leading-relaxed">
                                      {definition as string}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          onClick={onQuizCompleted}
                          className="w-full h-11 bg-gradient-to-r from-teal-700 to-cyan-700 hover:from-teal-800 hover:to-cyan-800 text-white font-medium text-sm shadow-lg transition-all duration-300 rounded-2xl hover:shadow-xl"
                        >
                          확인하고 닫기
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

// 퀴즈 카드 컴포넌트
export function DailyQuizCard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasCompletedToday, setHasCompletedToday] = useState(false)
  const [todayQuiz, setTodayQuiz] = useState<QuizDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 오늘 퀴즈 상태 조회
  useEffect(() => {
    const loadTodayQuiz = async () => {
      try {
        setIsLoading(true)
        const status: QuizStatusDto = await quizApi.getTodayQuiz()
        setHasCompletedToday(status.hasCompletedToday)
        setTodayQuiz(status.todayQuiz)
      } catch (error) {
        console.error('오늘의 퀴즈 조회 실패:', error)
        toast.error("퀴즈 정보를 불러오는데 실패했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    loadTodayQuiz()
  }, [])

  const handleQuizClick = () => {
    if (hasCompletedToday) {
      toast.info("오늘의 퀴즈는 이미 완료했습니다!", {
        description: "내일 다시 도전해보세요.",
      })
    } else if (todayQuiz) {
      setIsModalOpen(true)
    } else {
      toast.error("오늘의 퀴즈를 불러올 수 없습니다")
    }
  }

  const handleQuizCompleted = () => {
    setHasCompletedToday(true)
    setIsModalOpen(false)
  }

  return (
    <>
      <motion.div variants={cardVariants}>
        <Card 
          className="w-full shadow-xl border-0 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] bg-white group"
          onClick={handleQuizClick}
        >
          <CardHeader className="bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700 text-white relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <CardTitle className="text-lg font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                오늘의 금융 퀴즈
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">OX 퀴즈를 풀고</div>
                  <div className="text-base font-bold text-gray-800">하나머니를 받아봐요!</div>
                </div>
                <div className="w-40 h-40">
                  <img 
                    src="/quiz.png" 
                    alt="퀴즈 아이콘" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <Button
                className="w-full h-10 bg-gradient-to-r from-teal-700 to-cyan-700 hover:from-teal-800 hover:to-cyan-800 text-white font-medium shadow-lg transition-all duration-300 rounded-xl hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={hasCompletedToday || isLoading}
              >
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      로딩 중...
                    </>
                  ) : hasCompletedToday ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      오늘 퀴즈 완료!
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4" />
                      퀴즈 시작하기
                    </>
                  )}
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <DailyQuizModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        quizData={todayQuiz}
        onQuizCompleted={handleQuizCompleted}
      />
    </>
  )
}
