#!/bin/bash

echo "🚀 디지털북 개발 환경 시작하기"

# PostgreSQL과 Redis 시작
echo "📦 Docker 컨테이너 시작..."
docker-compose -f docker-compose.local.yml up -d

# 잠시 대기
echo "⏳ 데이터베이스 준비 중..."
sleep 5

# 백엔드 시작
echo "🔧 백엔드 서버 시작..."
cd backend
npm run dev &
BACKEND_PID=$!

# 프론트엔드 시작
echo "🎨 프론트엔드 서버 시작..."
cd ../
npm run dev &
FRONTEND_PID=$!

echo "✅ 개발 환경이 시작되었습니다!"
echo "- 프론트엔드: http://localhost:3000"
echo "- 백엔드 API: http://localhost:4000"
echo ""
echo "종료하려면 Ctrl+C를 누르세요."

# 종료 시그널 처리
trap "echo '🛑 서버 종료 중...'; kill $BACKEND_PID $FRONTEND_PID; docker-compose -f docker-compose.local.yml down; exit" INT

# 프로세스 대기
wait