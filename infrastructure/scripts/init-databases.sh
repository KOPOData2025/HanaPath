#!/bin/bash

set -e

echo "======================================"
echo "데이터베이스 초기화"
echo "======================================"

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 환경 변수 로드
set -a
source .env
set +a

echo -e "${YELLOW}데이터베이스 준비 대기 중...${NC}"
sleep 15

# MySQL 초기화
echo -e "${YELLOW}MySQL 데이터베이스 초기화 중...${NC}"
docker exec -i hanapath-mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} <<EOF
-- 필요한 경우 테이블 생성
CREATE TABLE IF NOT EXISTS system_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50),
    initialized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_info (version) VALUES ('1.0.0');
EOF
echo -e "${GREEN}✓ MySQL 초기화 완료${NC}"

# MongoDB 초기화
echo -e "${YELLOW}MongoDB 데이터베이스 초기화 중...${NC}"
docker exec -i hanapath-mongodb mongosh \
    -u ${MONGO_ROOT_USERNAME} \
    -p ${MONGO_ROOT_PASSWORD} \
    --authenticationDatabase admin \
    ${MONGO_DATABASE} <<EOF
db.system_info.insertOne({
    version: "1.0.0",
    initializedAt: new Date()
});
EOF
echo -e "${GREEN}✓ MongoDB 초기화 완료${NC}"

echo -e "${GREEN}======================================"
echo "데이터베이스 초기화가 완료되었습니다!"
echo "======================================${NC}"

