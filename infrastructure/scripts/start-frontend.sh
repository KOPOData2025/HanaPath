#!/bin/sh

# Next.js 서버를 백그라운드로 시작
echo "Starting Next.js server..."
npm start &

# Next.js가 준비될 때까지 대기
echo "Waiting for Next.js to start..."
sleep 5

# Nginx를 포그라운드로 시작
echo "Starting Nginx..."
nginx -g 'daemon off;'
