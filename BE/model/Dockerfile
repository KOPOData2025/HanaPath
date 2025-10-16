# AI 서비스 (스미싱 탐지) Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# requirements 파일 복사
COPY requirements.txt .

# Python 의존성 설치
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 파일 복사
COPY smishing_detection_service.py .
COPY run_service.py .
COPY save_tokenizer.py .
COPY smishingmodel.h5 .
COPY tokenizer.pkl .
COPY max_len.txt .

# 보안을 위한 사용자 생성
RUN useradd -m -u 1001 aiuser && \
    chown -R aiuser:aiuser /app

USER aiuser

# 헬스 체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

# 서비스 실행
CMD ["python", "smishing_detection_service.py"]

