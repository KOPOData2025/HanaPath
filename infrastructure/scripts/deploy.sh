#!/bin/bash

set -e

echo "======================================"
echo "HanaPath"
echo "======================================"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 환경 설정
ENVIRONMENT=${1:-production}
echo -e "${GREEN}환경: ${ENVIRONMENT}${NC}"

# .env 파일 확인
if [ ! -f ".env" ]; then
    echo -e "${RED}오류: .env 파일을 찾을 수 없습니다.${NC}"
    echo ".env 파일을 생성하고 설정해주세요."
    exit 1
fi

# 환경 변수 로드
set -a
source .env
set +a

echo -e "${YELLOW}Step 1: Git에서 최신 변경사항 가져오기...${NC}"
git pull origin main

echo -e "${YELLOW}Step 2: Docker 이미지 빌드 중...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}Step 3: 기존 컨테이너 중지 중...${NC}"
docker-compose down

echo -e "${YELLOW}Step 4: 컨테이너 시작 중...${NC}"
docker-compose up -d

echo -e "${YELLOW}Step 5: 서비스가 준비될 때까지 대기 중...${NC}"
sleep 10

# 서비스 헬스 체크
echo -e "${YELLOW}Step 6: 서비스 상태 확인 중...${NC}"

check_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s "$url" > /dev/null; then
            echo -e "${GREEN}✓ $service is healthy${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        echo "Waiting for $service... ($attempt/$max_attempts)"
        sleep 2
    done

    echo -e "${RED}✗ $service failed to start${NC}"
    return 1
}

check_service "백엔드" "http://localhost:8080/actuator/health" || true
check_service "AI 서비스" "http://localhost:8000/health" || true
check_service "실시간 서비스" "http://localhost:8001/health" || true

echo -e "${YELLOW}Step 7: 사용하지 않는 Docker 이미지 정리 중...${NC}"
docker image prune -f

echo -e "${GREEN}======================================"
echo "배포가 성공적으로 완료되었습니다!"
echo "======================================${NC}"
echo ""
echo "모든 서비스가 정상적으로 시작되었습니다."
echo ""
echo "유용한 명령어:"
echo "  - 로그 확인: docker-compose logs -f [서비스명]"
echo "  - 상태 확인: docker-compose ps"
echo "  - 서비스 중지: docker-compose down"

