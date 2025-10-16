# Next.js 애플리케이션을 위한 멀티 스테이지 빌드
FROM node:20-alpine AS base

# 의존성 설치 단계
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 의존성 패키지 설치
COPY package.json package-lock.json ./
RUN npm ci

# 소스 코드 빌드 단계
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 환경 변수 설정
ENV NEXT_TELEMETRY_DISABLED 1

# Next.js 애플리케이션 빌드
RUN npm run build

# Nginx를 포함한 프로덕션 이미지
FROM nginx:alpine AS runner
WORKDIR /app

# Next.js 실행을 위한 Node.js 설치
RUN apk add --no-cache nodejs

# SSL 인증서 디렉토리 생성
RUN mkdir -p /etc/nginx/ssl

# Next.js 빌드 결과물 복사
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 80 443 3000

CMD ["npm", "start"]
