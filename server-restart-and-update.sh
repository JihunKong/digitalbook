#!/bin/bash

echo "🚀 서버 재시작 및 교사 계정 업데이트 스크립트"
echo "==========================================="

# SSH 연결 및 명령 실행
ssh ubuntu@3.37.168.225 << 'ENDSSH'

echo "1️⃣ 서비스 캐시 삭제 및 재시작..."
echo "-----------------------------------"

# PM2 캐시 삭제 및 백엔드 재시작
echo "📦 백엔드 재시작 중..."
pm2 flush
pm2 restart backend --update-env

# systemd 서비스 재시작 (프론트엔드)
echo "🚀 프론트엔드 재시작 중..."
sudo systemctl restart digitalbook

# Nginx 캐시 삭제 및 재시작
echo "🌐 Nginx 캐시 삭제 및 재시작 중..."
sudo rm -rf /var/cache/nginx/*
sudo nginx -s reload

# Redis 캐시 플러시
echo "💾 Redis 캐시 플러시 중..."
docker exec digitalbook-redis-1 redis-cli FLUSHALL

echo ""
echo "2️⃣ 교사 계정 비밀번호 업데이트..."
echo "-----------------------------------"

cd /home/ubuntu/digitalbook/backend

# 교사 계정 업데이트 스크립트 생성
cat > update-teacher-password.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateTeacherPassword() {
  try {
    // 비밀번호를 teacher123!로 변경
    const hashedPassword = await bcrypt.hash('teacher123!', 10);
    
    const teacher = await prisma.user.update({
      where: {
        email: 'teacher1@test.com'
      },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Teacher password updated successfully!');
    console.log('   Email: teacher1@test.com');
    console.log('   Password: teacher123!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateTeacherPassword();
EOF

# 스크립트 실행
node update-teacher-password.js

echo ""
echo "3️⃣ 서비스 상태 확인..."
echo "-----------------------------------"
pm2 list
echo ""
sudo systemctl status digitalbook --no-pager | head -10
echo ""
sudo nginx -t

echo ""
echo "✅ 모든 작업 완료!"
echo "==================="
echo "📧 교사 계정: teacher1@test.com"
echo "🔑 비밀번호: teacher123!"
echo "🌐 URL: https://xn--220bu63c.com"

ENDSSH