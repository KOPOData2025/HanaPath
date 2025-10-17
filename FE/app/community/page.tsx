"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import PollView, { type PollViewData } from "@/components/community/poll-view"
import PostCreateModal from "@/components/community/post-create-modal"
import {
  MessageSquare,
  ThumbsUp,
  Edit,
  TrendingUp,
  Clock,
  Users,
  BookOpen,
  HelpCircle,
  Search,
  Filter,
  Flame,
  Heart,
  Flag,
  Share2,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Target,
  Trash2,
  BarChart3,
  Vote,
  BadgeCheck,
} from "lucide-react"
import Image from "next/image"
import React from "react"
import { communityApi } from "@/lib/api/community"
import type { PostResponse } from "@/types/community"
import { useAuthStore } from "@/store/auth"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { useScrollPosition } from "@/hooks/use-scroll-position"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const communityCategories = [
  {
    id: "all",
    label: "전체",
    icon: Users,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "investment",
    label: "투자 토론",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "education",
    label: "금융 교육",
    icon: BookOpen,
    color: "from-purple-500 to-violet-600",
  },
  {
    id: "qna",
    label: "자유 게시판",
    icon: HelpCircle,
    color: "from-orange-500 to-red-600",
  },
]

const levelColors = {
  1: "from-green-400 to-green-600",
  2: "from-blue-400 to-blue-600",
  3: "from-purple-400 to-purple-600",
  4: "from-orange-400 to-orange-600",
  5: "from-yellow-400 to-yellow-600",
}

const levelEmojis = {
  1: "🌰",
  2: "🌱",
  3: "🌿",
  4: "🍏",
  5: "🌳",
}

const levelLabels = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
}

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.6, ease: "easeOut" },
}

const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PostResponse | null>(null)
  // list page에서는 모달 댓글 대신 상세 페이지에서 표시
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [likingPostId, setLikingPostId] = useState<number | null>(null)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const currentUserId = useAuthStore((s) => s.user?.id ?? null)
  const router = useRouter()
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { isFooterVisible, footerHeight } = useScrollPosition()
  
  // 디버깅용
  console.log('isFooterVisible:', isFooterVisible, 'footerHeight:', footerHeight)

  const targetRef = React.useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const heroImageY = useTransform(scrollYProgress, [0, 1], [24, -76])
  const heroImageScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])
  const defaultModalCategory = (['investment','education','qna'] as const).includes(activeCategory as any)
    ? (activeCategory as 'investment'|'education'|'qna')
    : 'investment'

  const loadPosts = async () => {
    try {
      setLoadingPosts(true)
      const page = await communityApi.listPosts(activeCategory as any, pageIndex, 4)
      setPosts(page.content)
      setTotalPages(page.totalPages)
    } catch (e) {
      console.error(e)
      toast.error('게시글 로드 실패', { description: '잠시 후 다시 시도해주세요.' })
    } finally {
      setLoadingPosts(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [activeCategory, pageIndex])

  useEffect(() => {
    setPageIndex(0)
  }, [activeCategory])

  useEffect(() => {
    const onFocus = () => {
      // 돌아왔을 때 최신 카운트 반영
      loadPosts()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  return (
    <div ref={targetRef} className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="container mx-auto p-6 max-w-7xl">
        <motion.div initial="initial" animate="animate" variants={staggerContainer}>
          {/* Hero Section */}
          <motion.div variants={fadeInUp} className="mb-16">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#009178] via-[#00a085] to-[#004E42] rounded-3xl shadow-2xl">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg fill%3D%22none%22 fillRule%3D%22evenodd%22%3E%3Cg fill%3D%22%23ffffff%22 fillOpacity%3D%220.1%22%3E%3Ccircle cx%3D%2230%22 cy%3D%2230%22 r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
              </div>

              <div className="relative p-8 lg:p-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Text Content */}
                  <motion.div variants={slideInLeft} className="space-y-8">
                    <div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6"
                      >
                        <Sparkles className="w-4 h-4" />
                        함께 배우고 성장하는 공간
                      </motion.div>
                      <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-6">금융 커뮤니티</h1>
                      <p className="text-xl text-white/90 leading-relaxed max-w-lg">
                        HanaPath 친구들과 함께 금융 지식을 나누고, <br /> 투자 경험을 공유하며, 서로 도움을 주고받아요.

                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        size="lg"
                        className="bg-white text-[#009178] hover:bg-white/90 text-lg px-8 py-6 rounded-full font-bold group shadow-xl"
                        onClick={() => setIsPostModalOpen(true)}
                      >
                        <Edit className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                        글쓰기
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="text-white border-white/30 hover:bg-white/10 text-lg px-8 py-6 rounded-full font-bold bg-transparent"
                      >
                        인기글 보기
                      </Button>
                    </div>
                  </motion.div>

                  {/* Hero Image */}
                  <motion.div
                    style={{ y: heroImageY, scale: heroImageScale }}
                    className="relative lg:h-[500px] flex items-center justify-center overflow-visible"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                      className="relative w-[500px] h-[500px] flex items-center justify-center"
                    >
                      <Image
                        src="/community-hero.png"
                        alt="커뮤니티 3D 일러스트"
                        width={500}
                        height={500}
                        className="object-contain drop-shadow-2xl"
                        priority
                      />
                      {/* Floating Elements */}
                      <motion.div
                        animate={{
                          y: [-10, 10, -10],
                          rotate: [-2, 2, -2],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                        className="absolute -top-6 -left-6 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center z-10"
                      >
                        <MessageSquare className="w-5 h-5 text-white" />
                      </motion.div>
                      <motion.div
                        animate={{
                          y: [10, -10, 10],
                          rotate: [2, -2, 2],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                          delay: 1,
                        }}
                        className="absolute -bottom-3 -right-3 w-14 h-14 bg-yellow-400/20 backdrop-blur-sm rounded-xl flex items-center justify-center z-10"
                      >
                        <Heart className="w-6 h-6 text-yellow-400" />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search and Filter */}
          <motion.div variants={fadeInUp} className="mb-12">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="궁금한 내용을 검색해보세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white shadow-lg border-0 rounded-2xl text-base focus:ring-2 focus:ring-[#009178]/20"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl bg-white shadow-lg border-0 hover:bg-gray-50">
                  <Filter className="w-4 h-4 mr-2" />
                  필터
                </Button>
                <Button variant="outline" className="rounded-xl bg-white shadow-lg border-0 hover:bg-gray-50">
                  <Target className="w-4 h-4 mr-2" />
                  정렬
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Category Tabs */}
          <motion.div variants={fadeInUp}>
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-12 bg-white shadow-xl h-16 rounded-2xl p-2">
                {communityCategories.map((category) => {
                  const Icon = category.icon
                  return (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="flex flex-col items-center gap-1 data-[state=active]:bg-[#009178] data-[state=active]:text-white rounded-xl font-bold text-sm transition-all duration-300 h-full"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="hidden sm:inline">{category.label}</span>
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {communityCategories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-6">
                  <div className="space-y-6">
                    {loadingPosts && (
                      <div className="text-sm text-gray-500">불러오는 중...</div>
                    )}
                    {(!loadingPosts && posts.length === 0) && (
                      <div className="text-sm text-gray-400">게시글이 없습니다. 첫 글을 작성해보세요!</div>
                    )}
                    {posts.map((post, index: number) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        onClick={() => router.push(`/community/${post.id}`)}
                      >
                        <Card className="hover:shadow-2xl transition-all duration-500 cursor-pointer group border-0 bg-white shadow-lg overflow-hidden">
                          
                          <CardContent className="p-8">
                            <div className="space-y-6">
                              {/* Author Info */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl shadow-lg">
                                      {levelEmojis[post.authorLevel as keyof typeof levelEmojis] || "👤"}
                                    </div>
                                    <div
                                      className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br ${levelColors[post.authorLevel as keyof typeof levelColors] || "from-gray-400 to-gray-600"} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                                    >
                                      {levelLabels[post.authorLevel as keyof typeof levelLabels] || "?"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-gray-800 text-lg truncate">
                                        {post.title || '(제목 없음)'}
                                      </span>
                                      <Badge variant="outline" className="text-xs border-gray-200 bg-gray-50">
                                        {post.category === 'INVESTMENT' ? '투자 토론' : post.category === 'EDUCATION' ? '금융 교육' : '자유 게시판'}
                                      </Badge>
                                      {post.pollJson ? (
                                        <Badge
                                          variant="secondary"
                                          className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 border border-teal-200"
                                        >
                                          <BadgeCheck className="w-3 h-3" /> 투표 포함
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                      <span className="text-gray-700 font-medium">{post.authorNickname ?? '익명'}</span>
                                      <span className="text-gray-300">·</span>
                                      <Clock className="w-3 h-3" />
                                      <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {currentUserId && post.authorId === currentUserId ? (
                                    <>
                                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditTarget(post); setIsPostModalOpen(true) }}>수정</Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="삭제"
                                        onClick={(e) => { e.stopPropagation(); setDeleteTargetId(post.id) }}
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </Button>
                                    </>
                                  ) : null}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="min-h-[72px]">
                                <p
                                  className="text-gray-800 text-base leading-relaxed group-hover:text-[#009178] transition-colors whitespace-pre-line"
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical' as any,
                                  }}
                                >
                                  {post.content}
                                </p>
                              </div>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-2">
                                {(post.tags?.slice(0, 3) || []).map((tag: string, tagIndex: number) => (
                                  <motion.div key={tagIndex} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs bg-[#009178]/10 text-[#009178] hover:bg-[#009178]/20 cursor-pointer transition-colors"
                                    >
                                      #{tag}
                                    </Badge>
                                  </motion.div>
                                ))}
                                {post.tags && post.tags.length > 3 ? (
                                  <Badge variant="outline" className="text-xs text-gray-500 border-gray-200 bg-gray-50">
                                    외 {post.tags.length - 3}개
                                  </Badge>
                                ) : null}
                              </div>



                              {/* Actions */}
                              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-6">
                                  <motion.button
                                    className={`flex items-center gap-2 transition-colors group/btn ${post.likedByMe ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} ${likingPostId === post.id ? 'opacity-70 pointer-events-none' : ''}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      if (likingPostId) return
                                      try {
                                        setLikingPostId(post.id)
                                        const active = await communityApi.toggleLike(post.id)
                                        setPosts((prev) => prev.map((p) => {
                                          if (p.id !== post.id) return p
                                          const nextCount = Math.max(0, p.likeCount + (active ? 1 : -1))
                                          return { ...p, likedByMe: active, likeCount: nextCount }
                                        }))
                                      } catch (e) {
                                        console.error(e)
                                        toast.error('좋아요 실패', { description: '잠시 후 다시 시도해주세요.' })
                                      } finally {
                                        setLikingPostId(null)
                                      }
                                    }}
                                  >
                                    <Heart className={`w-5 h-5 transition-all ${post.likedByMe ? 'fill-current' : 'group-hover/btn:fill-current'}`} />
                                    <span className="font-medium">{post.likeCount}</span>
                                  </motion.button>
                                   <motion.button
                                    className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                     onClick={(e) => { e.stopPropagation(); router.push(`/community/${post.id}#comments`) }}
                                  >
                                    <MessageCircle className="w-5 h-5" />
                                    <span className="font-medium">{post.commentCount}</span>
                                  </motion.button>

                                </div>
                                <div className="flex items-center gap-4">
                                  <motion.button
                                    className="flex items-center gap-2 text-gray-400 hover:text-amber-600 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); toast.success('신고 완료', { description: '해당 게시글 신고가 접수되었습니다.' }) }}
                                  >
                                    <Flag className="w-4 h-4" />
                                    <span className="text-sm font-medium">신고</span>
                                  </motion.button>
                                  
                                  <motion.button
                                    className="flex items-center gap-2 text-gray-400 hover:text-[#009178] transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); navigator?.share?.({ title: post.title || '커뮤니티 게시글', text: post.content.slice(0, 120), url: typeof window !== 'undefined' ? window.location.origin + `/community/${post.id}` : undefined }).catch(() => {}) }}
                                  >
                                    <Share2 className="w-4 h-4" />
                                    <span className="text-sm font-medium">공유</span>
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={pageIndex === 0}
                          onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                        >
                          이전
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                          const half = Math.floor(5 / 2)
                          let start = Math.max(0, pageIndex - half)
                          if (start + 5 > totalPages) start = Math.max(0, totalPages - 5)
                          const pageNum = start + i
                          if (pageNum >= totalPages) return null
                          const isActive = pageNum === pageIndex
                          return (
                            <Button
                              key={pageNum}
                              variant={isActive ? 'default' : 'outline'}
                              size="sm"
                              className={`rounded-full ${isActive ? 'bg-[#009178] hover:bg-[#004E42] text-white' : ''}`}
                              onClick={() => setPageIndex(pageNum)}
                            >
                              {pageNum + 1}
                            </Button>
                          )
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={pageIndex >= totalPages - 1}
                          onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                        >
                          다음
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>

          {/* Floating Action Button */}
          <div 
            className={cn(
              "fixed bottom-24 right-6 z-50 transition-all duration-500 ease-in-out",
              isFooterVisible 
                ? "opacity-0 scale-95 pointer-events-none" 
                : "opacity-100 scale-100 pointer-events-auto"
            )}
          >
            <Button
              onClick={() => setIsPostModalOpen(true)}
              size="lg"
              className={cn(
                "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110",
                "bg-gradient-to-br from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600",
                "border-2 border-emerald-300"
              )}
            >
              <Edit className="h-6 w-6 text-white" />
            </Button>
          </div>
          {/* Modals */}
          <PostCreateModal
            isOpen={isPostModalOpen}
            onClose={() => { setIsPostModalOpen(false); setEditTarget(null) }}
            defaultCategory={defaultModalCategory}
            mode={editTarget ? 'edit' : 'create'}
            initialValue={editTarget ? {
              title: editTarget.title,
              content: editTarget.content,
              category: editTarget.category === 'INVESTMENT' ? 'investment' : editTarget.category === 'EDUCATION' ? 'education' : 'qna',
              tags: editTarget.tags,
            } : undefined}
            submitLabel={editTarget ? '수정' : '등록'}
            onSubmit={async (payload: any) => {
              if (editTarget) {
                const updated = await communityApi.updatePost(editTarget.id, payload)
                // 투표가 포함되어 있으면 백엔드 Poll 생성/수정 호출
                try {
                  if (payload?.poll) {
                    await communityApi.upsertPoll(editTarget.id, {
                      question: payload.poll.question,
                      allowMultiple: !!payload.poll.allowMultiple,
                      endsAt: payload.poll.endsAt,
                      options: (payload.poll.options || []).map((o: any) => String(o.text ?? '')),
                    })
                  }
                } catch (e) {
                  console.error(e)
                  toast.error('투표 생성/수정 실패', { description: '게시글은 수정되었지만 투표 반영에 실패했습니다.' })
                }
                setPosts((prev) => prev.map((p) => p.id === editTarget.id ? updated : p))
                setEditTarget(null)
                toast.success('수정 완료', { description: '게시글이 수정되었습니다.' })
              } else {
                const created = await communityApi.createPost(payload)
                // 투표가 포함되어 있으면 백엔드 Poll 생성 호출
                try {
                  if (payload?.poll) {
                    await communityApi.upsertPoll(created.id, {
                      question: payload.poll.question,
                      allowMultiple: !!payload.poll.allowMultiple,
                      endsAt: payload.poll.endsAt,
                      options: (payload.poll.options || []).map((o: any) => String(o.text ?? '')),
                    })
                  }
                } catch (e) {
                  console.error(e)
                  toast.error('투표 생성 실패', { description: '게시글은 등록되었지만 투표 생성에 실패했습니다.' })
                }
                setPosts((prev) => [created, ...prev])
                toast.success('게시글 등록', { description: '등록되었습니다.' })
              }
            }}
          />
          {/* Delete Confirm */}
          <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
                <AlertDialogDescription>정말 이 게시글을 삭제하시겠어요? 되돌릴 수 없어요.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleting}
                  onClick={async () => {
                    if (!deleteTargetId) return
                    try {
                      setDeleting(true)
                      await communityApi.deletePost(deleteTargetId)
                      setPosts((prev) => prev.filter((p) => p.id !== deleteTargetId))
                      toast.success('게시글 삭제 완료', { description: '게시글이 정상적으로 삭제되었습니다.' })
                      setDeleteTargetId(null)
                    } catch (e) {
                      console.error(e)
                      toast.error('삭제 실패', { description: '본인이 작성한 글만 삭제할 수 있습니다.' })
                    } finally {
                      setDeleting(false)
                    }
                  }}
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </div>
      {null}
    </div>
  )
}
