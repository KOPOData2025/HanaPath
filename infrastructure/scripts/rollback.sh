#!/bin/bash

set -e

echo "======================================"
echo "HanaPath 롤백"
echo "======================================"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 롤백할 커밋 해시 가져오기
COMMIT_HASH=${1}

if [ -z "$COMMIT_HASH" ]; then
    echo -e "${RED}오류: 롤백할 커밋 해시를 제공해주세요${NC}"
    echo "사용법: ./rollback.sh <commit-hash>"
    exit 1
fi

echo -e "${YELLOW}커밋으로 롤백 중: ${COMMIT_HASH}${NC}"

# 롤백 확인
read -p "정말 롤백하시겠습니까? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "롤백이 취소되었습니다."
    exit 1
fi

echo -e "${YELLOW}Step 1: 현재 컨테이너 중지 중...${NC}"
docker-compose down

echo -e "${YELLOW}Step 2: 이전 버전으로 체크아웃 중...${NC}"
git checkout $COMMIT_HASH

echo -e "${YELLOW}Step 3: Docker 이미지 빌드 중...${NC}"
docker-compose build

echo -e "${YELLOW}Step 4: 컨테이너 시작 중...${NC}"
docker-compose up -d

echo -e "${YELLOW}Step 5: 서비스 대기 중...${NC}"
sleep 10

echo -e "${GREEN}======================================"
echo "롤백이 완료되었습니다!"
echo "======================================${NC}"
echo ""
echo "상태 확인: docker-compose ps"
echo "로그 확인: docker-compose logs -f"

