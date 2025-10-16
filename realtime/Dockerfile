# 실시간 서비스 (주식 데이터 WebSocket) Dockerfile
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
COPY kis_ws_client.py .
COPY kis_chart_api.py .

# 보안을 위한 사용자 생성
RUN useradd -m -u 1001 rtuser && \
    chown -R rtuser:rtuser /app

USER rtuser

# 헬스 체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

EXPOSE 8001

# 서비스 실행
CMD ["python", "kis_ws_client.py"]

