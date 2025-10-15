export type CommunityCategory = 'investment' | 'education' | 'qna' | 'all'

export interface PostCreateRequest {
  title: string
  content: string
  category: CommunityCategory
  tags: string[]
}

export interface PostUpdateRequest extends PostCreateRequest {}

export interface PostResponse {
  id: number
  title: string
  content: string
  authorNickname: string
  authorId: number
  authorLevel: number
  category: 'INVESTMENT' | 'EDUCATION' | 'QNA'
  tags: string[]
  likeCount: number
  likedByMe: boolean
  commentCount: number
  createdAt: string
  updatedAt: string
  pollJson?: string
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface CommentCreateRequest {
  content: string
}

export interface CommentResponse {
  id: number
  postId: number
  authorId: number
  authorNickname: string
  content: string
  createdAt: string
}


