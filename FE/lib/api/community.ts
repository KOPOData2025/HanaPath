import { CommentCreateRequest, CommentResponse, CommunityCategory, PagedResponse, PostCreateRequest, PostResponse, PostUpdateRequest } from '@/types/community'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  if (!token) throw new Error('인증 토큰이 없습니다.')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && init.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json')
  }
  const resp = await fetch(input, { ...init, headers })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(text || `HTTP ${resp.status}`)
  }
  return resp
}

export const communityApi = {
  async listPosts(category: CommunityCategory = 'all', page = 0, size = 20): Promise<PagedResponse<PostResponse>> {
    const url = `${API_BASE_URL}/api/community/posts?category=${category}&page=${page}&size=${size}`
    const r = await authFetch(url)
    return r.json()
  },

  async getPost(postId: number): Promise<PostResponse> {
    const r = await authFetch(`${API_BASE_URL}/api/community/posts/${postId}`)
    return r.json()
  },

  async createPost(req: PostCreateRequest & { poll?: any }): Promise<PostResponse> {
    // Backend currently ignores poll; reserved for future use
    const body = {
      title: req.title,
      content: req.content,
      category: req.category === 'investment' ? 'INVESTMENT' : req.category === 'education' ? 'EDUCATION' : 'QNA',
      tags: req.tags ?? [],
      pollJson: req.poll ? JSON.stringify(req.poll) : undefined,
    }
    const r = await authFetch(`${API_BASE_URL}/api/community/posts`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return r.json()
  },

  async updatePost(postId: number, req: PostUpdateRequest & { poll?: any }): Promise<PostResponse> {
    const body = {
      title: req.title,
      content: req.content,
      category: req.category === 'investment' ? 'INVESTMENT' : req.category === 'education' ? 'EDUCATION' : 'QNA',
      tags: req.tags ?? [],
      pollJson: (req as any).poll ? JSON.stringify((req as any).poll) : undefined,
    }
    const r = await authFetch(`${API_BASE_URL}/api/community/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    return r.json()
  },

  async deletePost(postId: number): Promise<void> {
    await authFetch(`${API_BASE_URL}/api/community/posts/${postId}`, { method: 'DELETE' })
  },

  async toggleLike(postId: number): Promise<boolean> {
    const r = await authFetch(`${API_BASE_URL}/api/community/posts/${postId}/like`, { method: 'POST' })
    return r.json()
  },

  async listComments(postId: number): Promise<CommentResponse[]> {
    const r = await authFetch(`${API_BASE_URL}/api/community/posts/${postId}/comments`)
    return r.json()
  },

  async createComment(postId: number, req: CommentCreateRequest): Promise<CommentResponse> {
    const r = await authFetch(`${API_BASE_URL}/api/community/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(req) })
    return r.json()
  },

  async deleteComment(commentId: number): Promise<void> {
    await authFetch(`${API_BASE_URL}/api/community/comments/${commentId}`, { method: 'DELETE' })
  },

  async getPoll(postId: number): Promise<any> {
    const r = await authFetch(`${API_BASE_URL}/api/community/posts/${postId}/poll`)
    return r.json()
  },

  async upsertPoll(postId: number, payload: { question: string; allowMultiple: boolean; endsAt?: string; options: string[] }): Promise<any> {
    // LocalDateTime 호환을 위해 endsAt을 'YYYY-MM-DDTHH:mm:ss' 로 정규화 (timezone 제거)
    let endsAt = payload.endsAt
    if (endsAt) {
      const d = new Date(endsAt)
      const pad = (n: number) => String(n).padStart(2, '0')
      const normalized = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      endsAt = normalized
    }
    const r = await authFetch(`${API_BASE_URL}/api/community/posts/${postId}/poll`, { method: 'POST', body: JSON.stringify({
      question: payload.question,
      allowMultiple: payload.allowMultiple,
      endsAt,
      options: payload.options,
    }) })
    return r.json()
  },

  async vote(postId: number, optionIds: number[]): Promise<any> {
    const r = await authFetch(`${API_BASE_URL}/api/community/posts/${postId}/poll/votes`, { method: 'POST', body: JSON.stringify({ optionIds }) })
    return r.json()
  },
}


