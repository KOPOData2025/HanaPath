// lib/api/news.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function fetchRecentNews(): Promise<News[]> {
    const res = await fetch(`${BASE_URL}/api/news/recent`)
    if (!res.ok) throw new Error("뉴스 불러오기 실패")
    return res.json()
}

// News 타입 정의
export type News = {
    id: string
    title: string
    category: string
    summary: string
    explanation: string
    source: string
    publishedAt: string
    url: string
    thumbnailUrl: string
    contentText: string
    contentHtml: string
}
