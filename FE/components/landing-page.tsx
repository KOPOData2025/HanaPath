"use client"

import React from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Wallet, TrendingUp, BookOpen, Shield, Users, Award, Search } from "lucide-react"
import Image from "next/image"

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export function LandingPage() {
  const targetRef = React.useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, -200])
  const heroImageScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])

  return (
    <div ref={targetRef} className="bg-white text-gray-800 overflow-hidden">
      {/* Hero Section */}
      <section className="min-h-screen relative bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Text Content */}
            <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-8 lg:pr-8">
              <motion.div variants={fadeInUp}>
                <span className="inline-block px-4 py-2 bg-[#009178]/10 text-[#009178] rounded-full text-sm font-medium mb-6">
                  청소년을 위한 스마트 금융 플랫폼
                </span>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                처음 만나는 금융, <span className="text-[#009178]">HanaPath</span> 
                </h1>
              </motion.div>
              <motion.p variants={fadeInUp} className="text-xl text-gray-600 leading-relaxed max-w-lg">
              여러분의 금융 길잡이가 되어, 함께 걷겠습니다. <br></br>
                HanaPath와 함께 금융의 첫걸음을 시작하세요.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-[#009178] hover:bg-[#004E42] text-lg px-8 py-6 rounded-full group">
                  지금 시작하기
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 rounded-full border-2 hover:bg-gray-50 bg-transparent"
                >
                  더 알아보기
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              style={{ y: heroImageY, scale: heroImageScale }}
              className="relative lg:h-[600px] flex items-center justify-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className="relative"
              >
                <Image
                  src="/hanapath-hero.png"
                  alt="HanaPath 금융 여정"
                  width={600}
                  height={600}
                  className="object-contain drop-shadow-2xl"
                  priority
                />
                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="absolute -top-4 -left-4 w-16 h-16 bg-[#009178]/20 rounded-full"
                />
                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-8 -right-8 w-24 h-24 bg-teal-400/15 rounded-full"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { number: "10,000+", label: "가입 학생" },
              { number: "₩50억+", label: "모의 투자 거래액" },
              { number: "24/7", label: "안전한 서비스" },
              { number: "사용자의", label: "높은 만족도" },
            ].map((stat, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <div className="text-3xl md:text-4xl font-bold text-[#009178] mb-2">{stat.number}</div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why HanaPath Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
              왜 HanaPath일까요?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-gray-600 leading-relaxed">
            HanaPath는 단순한 서비스가 아닙니다. <br></br>
            청소년이 스스로 금융을 배우고, 올바른 금융 습관을 형성하며, <br></br>
            안전한 금융 경험을 쌓을 수 있도록 설계된 스마트 금융 플랫폼입니다.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Shield,
                title: "100% 안전",
                description: "하나패스의 보안 시스템으로\n여러분의 정보를 안전하게 보호합니다.",
                gradient: "from-emerald-500 to-teal-600",
                bgGradient: "from-emerald-50 to-teal-50",
                borderColor: "border-emerald-200",
                shadowColor: "shadow-emerald-100",
              },
              {
                icon: Users,
                title: "청소년 맞춤",
                description: "청소년의 눈높이에 맞춘\nUI/UX와 교육 콘텐츠를 제공합니다.",
                gradient: "from-green-500 to-emerald-600",
                bgGradient: "from-green-50 to-emerald-50",
                borderColor: "border-green-200",
                shadowColor: "shadow-green-100",
              },
              {
                icon: Award,
                title: "검증된 교육",
                description: "전문가 인증 교육 과정 바탕의\n체계적인 학습을 제공합니다.",
                gradient: "from-teal-500 to-cyan-600",
                bgGradient: "from-teal-50 to-cyan-50",
                borderColor: "border-teal-200",
                shadowColor: "shadow-teal-100",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.25, 
                  ease: [0.25, 0.46, 0.45, 0.94] 
                }}
                className={`group relative overflow-hidden text-center p-8 bg-gradient-to-br ${item.bgGradient} rounded-3xl border ${item.borderColor} hover:shadow-2xl transition-transform duration-300 hover:-translate-y-2 cursor-pointer`}
                style={{
                  boxShadow: `0 10px 40px -10px ${item.shadowColor}`,
                }}
              >
                {/* 배경 장식 요소 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/20 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
                
                {/* 아이콘 컨테이너 */}
                <div className={`relative w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <div className="absolute inset-0 bg-white/20 rounded-3xl"></div>
                  <item.icon className="w-10 h-10 text-white relative z-10" />
                </div>
                
                {/* 제목 */}
                <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-gray-900 transition-colors duration-300">
                  {item.title}
                </h3>
                
                {/* 설명 */}
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 whitespace-pre-line">
                  {item.description}
                </p>
                
                {/* 호버 효과를 위한 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-white/10 transition-all duration-500 rounded-3xl"></div>
                
                {/* 하단 액센트 라인 */}
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r ${item.gradient} group-hover:w-1/2 transition-all duration-500 rounded-full`}></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Floating Background Elements */}
        <motion.div
          animate={{ 
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Number.POSITIVE_INFINITY, 
            ease: "easeInOut" 
          }}
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-[#009178]/10 to-teal-400/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ 
            y: [20, -20, 20],
            x: [10, -10, 10],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 10, 
            repeat: Number.POSITIVE_INFINITY, 
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ 
            y: [-15, 15, -15],
            x: [-15, 15, -15],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 12, 
            repeat: Number.POSITIVE_INFINITY, 
            ease: "easeInOut",
            delay: 4
          }}
          className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-br from-pink-400/10 to-orange-400/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ 
            y: [15, -15, 15],
            x: [15, -15, 15],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            duration: 9, 
            repeat: Number.POSITIVE_INFINITY, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-yellow-400/10 to-green-400/10 rounded-full blur-xl"
        />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              <span className="text-[#009178]">HanaPath</span>의 핵심 기능
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              청소년을 위한 맞춤형 금융 서비스로 더 스마트한 금융 생활을 경험하세요
            </p>
          </motion.div>

          {/* Interactive Features Carousel */}
          <FeaturesCarousel />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?width=100&height=100&text=pattern')] opacity-5" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
              금융으로 여는 무한한 가능성
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-gray-300 mb-8 leading-relaxed">
              지금 HanaPath와 함께 금융 여정을 시작하고, 여러분의 미래를 직접 디자인하세요.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button
                size="lg"
                className="bg-white text-[#009178] hover:bg-gray-100 text-lg px-12 py-6 rounded-full font-semibold group"
              >
                무료로 시작하기
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

const FeatureSection = ({
  icon: Icon,
  title,
  description,
  features,
  imageUrl,
  reverse = false,
}: {
  icon: React.ElementType
  title: string
  description: string
  features: string[]
  imageUrl: string
  reverse?: boolean
}) => {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      variants={staggerContainer}
      className={`flex flex-col lg:flex-row items-center gap-16 ${reverse ? "lg:flex-row-reverse" : ""}`}
    >
      <motion.div variants={fadeInUp} className="lg:w-1/2 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{title}</h3>
          </div>
          <div className="relative">
            <blockquote className="pl-6 text-lg text-gray-600 leading-relaxed italic border-l-4 border-teal-700/30">
              {description}
            </blockquote>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-2 h-2 bg-teal-700 rounded-full flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">{feature}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div variants={fadeInUp} className="lg:w-1/2 flex justify-center">
        <motion.div
          animate={title === "나만의 디지털 지갑" ? {
            y: [0, -15, 0],
            scale: [1, 1.05, 1],
            rotate: [0, 2, 0]
          } : title === "실전 같은 모의 투자" ? {
            y: [0, -20, 0],
            scale: [1, 1.08, 1],
            rotate: [0, -3, 0],
            x: [0, 5, 0]
          } : {
            y: [0, -12, 0],
            scale: [1, 1.03, 1],
            rotate: [0, 1, 0],
            x: [0, -3, 0]
          }}
          transition={{ 
            duration: title === "나만의 디지털 지갑" ? 3 : title === "실전 같은 모의 투자" ? 4 : 2.5,
            repeat: Number.POSITIVE_INFINITY, 
            ease: "easeInOut",
            repeatDelay: title === "나만의 디지털 지갑" ? 1 : title === "실전 같은 모의 투자" ? 0.5 : 1.5
          }}
          className="relative"
        >
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            width={350}
            height={350}
            className="w-full h-auto object-contain drop-shadow-2xl"
          />
          {/* Floating particles around the image - different for each section */}
          {title === "나만의 디지털 지갑" && (
            <>
              <motion.div
                animate={{ 
                  y: [-5, 5, -5],
                  x: [-5, 5, -5],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Number.POSITIVE_INFINITY, 
                  ease: "easeInOut" 
                }}
                className="absolute -top-2 -left-2 w-4 h-4 bg-[#009178]/30 rounded-full"
              />
              <motion.div
                animate={{ 
                  y: [5, -5, 5],
                  x: [5, -5, 5],
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Number.POSITIVE_INFINITY, 
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -bottom-3 -right-3 w-6 h-6 bg-teal-400/20 rounded-full"
              />
            </>
          )}
          {title === "실전 같은 모의 투자" && (
            <>
              <motion.div
                animate={{ 
                  y: [-8, 8, -8],
                  x: [-8, 8, -8],
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.9, 0.4]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Number.POSITIVE_INFINITY, 
                  ease: "easeInOut" 
                }}
                className="absolute -top-3 -left-3 w-5 h-5 bg-blue-400/25 rounded-full"
              />
              <motion.div
                animate={{ 
                  y: [8, -8, 8],
                  x: [8, -8, 8],
                  rotate: [0, 180, 0],
                  opacity: [0.2, 0.7, 0.2]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Number.POSITIVE_INFINITY, 
                  ease: "easeInOut",
                  delay: 2
                }}
                className="absolute -bottom-4 -right-4 w-7 h-7 bg-purple-400/20 rounded-full"
              />
              <motion.div
                animate={{ 
                  y: [-3, 3, -3],
                  x: [3, -3, 3],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Number.POSITIVE_INFINITY, 
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute top-1/2 -right-4 w-3 h-3 bg-green-400/25 rounded-full"
              />
            </>
          )}
          {title === "재미있는 금융 교육" && (
            <>
              <motion.div
                animate={{ 
                  y: [-6, 6, -6],
                  x: [-6, 6, -6],
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3.5, 
                  repeat: Number.POSITIVE_INFINITY, 
                  ease: "easeInOut" 
                }}
                className="absolute -top-2 -left-2 w-4 h-4 bg-orange-400/30 rounded-full"
              />
              <motion.div
                animate={{ 
                  y: [6, -6, 6],
                  x: [6, -6, 6],
                  opacity: [0.4, 0.8, 0.4],
                  rotate: [0, 90, 0]
                }}
                transition={{ 
                  duration: 4.5, 
                  repeat: Number.POSITIVE_INFINITY, 
                  ease: "easeInOut",
                  delay: 1.5
                }}
                className="absolute -bottom-2 -right-2 w-5 h-5 bg-pink-400/25 rounded-full"
              />
              <motion.div
                animate={{ 
                  y: [-4, 4, -4],
                  x: [4, -4, 4],
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0.9, 0.5]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Number.POSITIVE_INFINITY, 
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="absolute top-1/3 -right-3 w-3 h-3 bg-yellow-400/30 rounded-full"
              />
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// Features Carousel Component
const FeaturesCarousel = () => {
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true)
  const [progress, setProgress] = React.useState(0)
  const carouselRef = React.useRef<HTMLDivElement>(null)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const currentSlideRef = React.useRef(0)
  const progressCycleRef = React.useRef(0) 

  const features = [
    {
      icon: Wallet,
      title: "나만의 디지털 지갑",
      description: "용돈을 받고, 쓰고, 모으는 모든 과정을 한눈에 관리하세요. 소비 습관을 분석하고, 똑똑한 지출 계획을 세울 수 있습니다.",
      features: ["실시간 잔액 확인", "소비 패턴 분석", "목표 저축 관리", "안전한 송금 기능"],
      imageUrl: "/wallet_icon.png",
      theme: "emerald",
      particles: [
        { color: "#10B981", size: 16, delay: 0, x: 20, y: 30 },
        { color: "#34D399", size: 12, delay: 1.2, x: 80, y: 25 },
        { color: "#6EE7B7", size: 20, delay: 2.5, x: 60, y: 70 },
        { color: "#A7F3D0", size: 8, delay: 3.8, x: 30, y: 80 },
        { color: "#10B981", size: 14, delay: 5.1, x: 90, y: 60 }
      ]
    },
    {
      icon: TrendingUp,
      title: "실전 같은 모의 투자",
      description: "실제 주식 시장 데이터를 기반으로, 위험 부담 없이\n투자를 배우고 경험하세요. 나만의 포트폴리오를 만들고,\n수익률을 관리하며 투자 감각을 키울 수 있습니다.",
      features: ["실시간 주식 데이터", "포트폴리오 관리", "수익률 분석", "투자 교육 콘텐츠"],
      imageUrl: "/investment-icon.png",
      theme: "blue",
      particles: [
        { color: "#3B82F6", size: 18, delay: 0, x: 25, y: 20 },
        { color: "#60A5FA", size: 14, delay: 1.5, x: 75, y: 35 },
        { color: "#93C5FD", size: 22, delay: 3, x: 50, y: 75 },
        { color: "#DBEAFE", size: 10, delay: 4.5, x: 15, y: 65 },
        { color: "#3B82F6", size: 12, delay: 2.2, x: 85, y: 80 }
      ]
    },
    {
      icon: BookOpen,
      title: "재미있는 금융 교육",
      description: "금융 지식을 쌓고, 보상으로 하나머니를 받아보세요.\n커뮤니티에서 금융 정보를 공유하고, 소통하며 성장해 봐요!",
      features: ["일일 퀴즈", "쉬운 금융 뉴스", "학습 보상 시스템", "레벨업 시스템"],
      imageUrl: "/news-quiz-icon.png",
      theme: "orange",
      particles: [
        { color: "#F59E0B", size: 20, delay: 0, x: 30, y: 20 },
        { color: "#FBBF24", size: 16, delay: 1.8, x: 70, y: 40 },
        { color: "#FCD34D", size: 24, delay: 3.5, x: 20, y: 75 },
        { color: "#FEF3C7", size: 12, delay: 5.2, x: 80, y: 85 },
        { color: "#F59E0B", size: 14, delay: 2.7, x: 50, y: 60 }
      ]
    },
    {
      icon: Search,
      title: "AI 금융 길잡이",
      description: "AI 챗봇에게 궁금한 건 뭐든 물어보고,\n개인 맞춤형 금융 조언을 받아보세요.\n의심스러운 메시지는 스미싱 탐지로 확인해 보세요.",
      features: ["스미싱 탐지", "개인 맞춤 조언", "금융 용어 해설", "24시간 금융 상담"],
      imageUrl: "/chatbot.png",
      theme: "purple",
      particles: [
        { color: "#8B5CF6", size: 22, delay: 0, x: 25, y: 30 },
        { color: "#A78BFA", size: 16, delay: 1.5, x: 75, y: 25 },
        { color: "#C4B5FD", size: 26, delay: 3, x: 45, y: 80 },
        { color: "#DDD6FE", size: 10, delay: 4.5, x: 80, y: 70 },
        { color: "#8B5CF6", size: 14, delay: 2.3, x: 15, y: 50 }
      ]
    }
  ]

  const nextSlide = () => {
    const newSlide = (currentSlideRef.current + 1) % features.length
    currentSlideRef.current = newSlide
    setCurrentSlide(newSlide)
    setProgress(0)
    progressCycleRef.current = 0
  }

  const prevSlide = () => {
    const newSlide = (currentSlideRef.current - 1 + features.length) % features.length
    currentSlideRef.current = newSlide
    setCurrentSlide(newSlide)
    setProgress(0)
    progressCycleRef.current = 0
  }

  const goToSlide = (index: number) => {
    currentSlideRef.current = index
    setCurrentSlide(index)
    setProgress(0)
    progressCycleRef.current = 0
  }

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
    setProgress(0)
    progressCycleRef.current = 0
  }

  // 자동 슬라이드 로직
  React.useEffect(() => {
    if (isAutoPlaying) {
      // 슬라이드 변경을 위한 타이머
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => {
          const next = (prev + 1) % features.length
          currentSlideRef.current = next
          return next
        })
        setProgress(0)
      }, 5000) // 5초마다 슬라이드 변경

      // 진행률 업데이트를 위한 타이머
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0
          }
          return prev + 1 // 5초 동안 100%까지 (50ms * 100번 = 5000ms)
        })
      }, 50)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [isAutoPlaying, features.length])

  // 컴포넌트 언마운트 시 정리
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="relative overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100/50"
      >
        {/* Slides */}
        <motion.div
          className="flex"
          animate={{ x: `-${currentSlide * 100}%` }}
          transition={{ 
            type: "tween",
            ease: "easeInOut",
            duration: 0.5
          }}
        >
          {features.map((feature, index) => {
            const themeColors = {
              emerald: "from-emerald-50 via-green-50/50 to-teal-50/30",
              blue: "from-blue-50 via-indigo-50/50 to-cyan-50/30", 
              orange: "from-orange-50 via-amber-50/50 to-yellow-50/30",
              purple: "from-purple-50 via-violet-50/50 to-indigo-50/30"
            }
            
            return (
            <div
              key={index}
              className="w-full flex-shrink-0 min-h-[500px] lg:min-h-[600px]"
            >
              <div className={`h-full bg-gradient-to-br ${themeColors[feature.theme as keyof typeof themeColors]} p-8 lg:p-16 relative overflow-hidden`}>
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                  <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${
                    feature.theme === 'emerald' ? 'from-emerald-200/20' :
                    feature.theme === 'blue' ? 'from-blue-200/20' :
                    feature.theme === 'orange' ? 'from-orange-200/20' :
                    'from-purple-200/20'
                  } via-transparent to-transparent`}></div>
                </div>

                {/* Floating Particles */}
                {feature.particles.map((particle, particleIndex) => {
                  // 고정된 랜덤 값 생성 (particleIndex 기반)
                  const randomX1 = (particleIndex * 0.3 - 0.5) * 20
                  const randomX2 = (particleIndex * 0.7 - 0.5) * 30
                  
                  return (
                    <motion.div
                      key={particleIndex}
                      initial={{ opacity: 0, scale: 0, rotate: 0 }}
                      animate={{ 
                        opacity: [0, 0.8, 0.6, 0.3, 0],
                        scale: [0, 1.2, 1, 0.8, 0],
                        y: [0, -20, -40, -60, -80],
                        x: [0, randomX1, randomX2, randomX1 * 0.5],
                        rotate: [0, 90, 180, 270, 360]
                      }}
                      transition={{ 
                        duration: 8,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: particle.delay,
                        ease: "easeInOut"
                      }}
                      className="absolute"
                      style={{
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        top: `${particle.y}%`,
                        left: `${particle.x}%`,
                        filter: 'blur(0.3px)',
                        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}50`
                      }}
                    >
                      {/* 네잎클로버 SVG */}
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2C12 2 8 6 8 10C8 12 10 14 12 14C14 14 16 12 16 10C16 6 12 2 12 2Z"
                          fill={particle.color}
                        />
                        <path
                          d="M22 12C22 12 18 8 14 8C12 8 10 10 10 12C10 14 12 16 14 16C18 16 22 12 22 12Z"
                          fill={particle.color}
                        />
                        <path
                          d="M12 22C12 22 16 18 16 14C16 12 14 10 12 10C10 10 8 12 8 14C8 18 12 22 12 22Z"
                          fill={particle.color}
                        />
                        <path
                          d="M2 12C2 12 6 16 10 16C12 16 14 14 14 12C14 10 12 8 10 8C6 8 2 12 2 12Z"
                          fill={particle.color}
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2"
                          fill={particle.color}
                        />
                      </svg>
                    </motion.div>
                  )
                })}

                <div className="grid lg:grid-cols-2 gap-10 items-center h-full relative z-10">
                  {/* Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="space-y-8 pl-8"
                  >
                    {/* Icon & Title Section */}
                    <div className="space-y-6">
                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        className={`w-20 h-20 rounded-3xl p-5 shadow-xl ${
                          feature.theme === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                          feature.theme === 'blue' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                          feature.theme === 'orange' ? 'bg-gradient-to-br from-orange-500 to-amber-600' :
                          'bg-gradient-to-br from-purple-500 to-violet-600'
                        }`}
                      >
                        <feature.icon className="w-full h-full text-white" />
                      </motion.div>
                      
                      <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                        {feature.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-lg lg:text-xl text-gray-700 leading-relaxed max-w-lg whitespace-pre-line">
                      {feature.description}
                    </p>

                    {/* Features List */}
                    <div className="space-y-4">
                      {feature.features.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                          className="flex items-center space-x-4 group"
                        >
                          <div className={`w-3 h-3 rounded-full group-hover:scale-125 transition-transform duration-200 ${
                            feature.theme === 'emerald' ? 'bg-emerald-500' :
                            feature.theme === 'blue' ? 'bg-blue-500' :
                            feature.theme === 'orange' ? 'bg-orange-500' :
                            'bg-purple-500'
                          }`} />
                          <span className="text-gray-700 font-medium text-base">{item}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Image */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="relative flex items-center justify-center"
                  >
                    <div className="relative group">
                      {/* Subtle background glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#009178]/5 to-transparent rounded-3xl blur-2xl scale-110 group-hover:scale-125 transition-transform duration-500" />
                      
                      <Image
                        src={feature.imageUrl}
                        alt={feature.title}
                        width={350}
                        height={350}
                        className="object-contain w-full h-auto relative z-10 group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
            )
          })}
        </motion.div>

        {/* Navigation Arrows */}
        <button
          onClick={() => {
            prevSlide()
            setIsAutoPlaying(false) // 수동 조작 시 자동 재생 중지
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 group z-10"
        >
          <motion.div
            whileHover={{ x: -1 }}
            className="w-5 h-5 text-gray-600 group-hover:text-gray-800"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.div>
        </button>

        <button
          onClick={() => {
            nextSlide()
            setIsAutoPlaying(false) // 수동 조작 시 자동 재생 중지
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 group z-10"
        >
          <motion.div
            whileHover={{ x: 1 }}
            className="w-5 h-5 text-gray-600 group-hover:text-gray-800"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
          {features.map((feature, index) => (
            <button
              key={index}
              onClick={() => {
                goToSlide(index)
                setIsAutoPlaying(false) // 수동 조작 시 자동 재생 중지
              }}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentSlide 
                  ? `scale-125 ${
                      feature.theme === 'emerald' ? 'bg-emerald-500' :
                      feature.theme === 'blue' ? 'bg-blue-500' :
                      feature.theme === 'orange' ? 'bg-orange-500' :
                      'bg-purple-500'
                    }` 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Auto-play Controls */}
      <div className="flex items-center justify-center gap-6 mt-8">
        {/* 토글 스위치 */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">자동 재생</span>
          <button
            onClick={toggleAutoPlay}
            className="relative w-16 h-6 rounded-full transition-all duration-300 focus:outline-none"
            style={{
              backgroundColor: isAutoPlaying ? 
                (features[currentSlide].theme === 'emerald' ? '#10b981' :
                 features[currentSlide].theme === 'blue' ? '#3b82f6' :
                 features[currentSlide].theme === 'orange' ? '#f59e0b' :
                 '#8b5cf6') : '#d1d5db'
            }}
          >
            <motion.div
              className="absolute top-1 w-5 h-4 bg-white rounded-full shadow-md"
              animate={{ x: isAutoPlaying ? 40 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
            {/* ON/OFF 텍스트 */}
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <span className={`text-xs font-black transition-colors duration-300 ${
                isAutoPlaying ? 'text-white ml-0.5' : 'text-transparent'
              }`}>
                ON
              </span>
              <span className={`text-xs font-black transition-colors duration-300 ${
                !isAutoPlaying ? 'text-gray-400 mr-0.5' : 'text-transparent'
              }`}>
                OFF
              </span>
            </div>
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-40 h-2 bg-gray-200/60 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className={`h-full rounded-full shadow-sm ${
                features[currentSlide].theme === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                features[currentSlide].theme === 'blue' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                features[currentSlide].theme === 'orange' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                'bg-gradient-to-r from-purple-400 to-purple-600'
              }`}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
          {/* 진행률 바 글로우 효과 */}
          <div className={`absolute inset-0 rounded-full opacity-30 blur-sm ${
            features[currentSlide].theme === 'emerald' ? 'bg-emerald-500' :
            features[currentSlide].theme === 'blue' ? 'bg-blue-500' :
            features[currentSlide].theme === 'orange' ? 'bg-orange-500' :
            'bg-purple-500'
          }`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}
