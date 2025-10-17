#!/bin/bash

set -e

echo "======================================"
echo "SSL 인증서 설정"
echo "======================================"

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 설정
DOMAIN=${1}
EMAIL=${2}

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}사용법: ./setup-ssl.sh <도메인> <이메일>${NC}"
    echo "예시: ./setup-ssl.sh mydomain.com admin@mydomain.com"
    exit 1
fi

echo -e "${YELLOW}도메인: ${DOMAIN}${NC}"
echo -e "${YELLOW}이메일: ${EMAIL}${NC}"

# 디렉토리 생성
mkdir -p ./infrastructure/certbot/conf
mkdir -p ./infrastructure/certbot/www
mkdir -p ./infrastructure/ssl

echo -e "${YELLOW}Step 1: SSL 인증서 발급 중...${NC}"

# certbot을 사용하여 인증서 발급
docker run -it --rm \
    -v $(pwd)/infrastructure/certbot/conf:/etc/letsencrypt \
    -v $(pwd)/infrastructure/certbot/www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

echo -e "${YELLOW}Step 2: 인증서 복사 중...${NC}"

# nginx ssl 디렉토리로 인증서 복사
cp ./infrastructure/certbot/conf/live/$DOMAIN/fullchain.pem ./infrastructure/ssl/cert.pem
cp ./infrastructure/certbot/conf/live/$DOMAIN/privkey.pem ./infrastructure/ssl/key.pem

echo -e "${GREEN}======================================"
echo "SSL 인증서가 설치되었습니다!"
echo "======================================${NC}"
echo "인증서 갱신 명령어:"
echo "  docker-compose exec certbot certbot renew"

