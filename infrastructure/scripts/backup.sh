#!/bin/bash

set -e

echo "======================================"
echo "HanaPath 데이터베이스 백업"
echo "======================================"

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 백업 디렉토리
BACKUP_DIR="./backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# 환경 변수 로드
set -a
source .env
set +a

echo -e "${YELLOW}백업 생성 중...${NC}"

# MySQL 백업
echo -e "${YELLOW}MySQL 백업 중...${NC}"
docker exec hanapath-mysql mysqldump \
    -u${MYSQL_USER} \
    -p${MYSQL_PASSWORD} \
    ${MYSQL_DATABASE} > $BACKUP_DIR/mysql_backup.sql
echo -e "${GREEN}✓ MySQL 백업 완료${NC}"

# MongoDB 백업
echo -e "${YELLOW}MongoDB 백업 중...${NC}"
docker exec hanapath-mongodb mongodump \
    --username=${MONGO_ROOT_USERNAME} \
    --password=${MONGO_ROOT_PASSWORD} \
    --db=${MONGO_DATABASE} \
    --archive=/backup/mongodb_backup.archive
docker cp hanapath-mongodb:/backup/mongodb_backup.archive $BACKUP_DIR/
echo -e "${GREEN}✓ MongoDB 백업 완료${NC}"

# 백업 압축
echo -e "${YELLOW}백업 파일 압축 중...${NC}"
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

echo -e "${GREEN}======================================"
echo "백업이 완료되었습니다!"
echo "백업 위치: $BACKUP_DIR.tar.gz"
echo "======================================${NC}"

