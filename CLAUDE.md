# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Korean Digital Textbook Platform - an AI-powered educational platform with separate teacher and student interfaces. The project uses a Next.js frontend with a Node.js/Express backend, PostgreSQL database, and Redis for caching.

## Common Development Commands

### Frontend (Next.js)
```bash
# Development
npm run dev          # Start development server on port 3000

# Building & Production
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run Jest unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run Playwright tests with UI

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
```

### Backend (Node.js/Express)
```bash
cd backend

# Development
npm run dev          # Start development server with hot reload (tsx watch)

# Building & Production
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server

# Database
npm run migrate      # Run Prisma migrations
npm run seed         # Seed database with initial data
npm run test:seed    # Seed test data

# Testing
npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run test:e2e     # Run E2E tests only
npm run test:coverage # Run tests with coverage
```

### Docker Commands
```bash
# Development
docker-compose up -d                    # Start all services
docker-compose -f docker-compose.dev.yml up -d  # Development mode

# Production
docker-compose -f docker-compose.prod.yml up -d # Production mode

# Deployment
./scripts/deploy.sh                     # Deploy to production server
```

## Architecture Overview

### Frontend Architecture
- **Framework**: Next.js 14 with App Router
- **State Management**: Zustand for global state, React Query for server state
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with CSS-in-JS for animations (Framer Motion)
- **Authentication**: JWT-based with custom hooks
- **Real-time Features**: Socket.io for chat and live updates

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and performance optimization
- **Authentication**: JWT tokens (access + refresh)
- **File Storage**: Local filesystem with planned CDN integration
- **AI Integration**: OpenAI API for content generation and analysis

### Key API Endpoints
- `/api/auth/*` - Authentication (login, signup, refresh)
- `/api/textbooks/*` - Textbook CRUD operations
- `/api/ai/*` - AI features (chat, content generation, image generation)
- `/api/multimedia/*` - File upload and media management
- `/api/analytics/*` - Learning analytics and reporting
- `/api/guest/*` - Guest access features

## Database Schema (Prisma)

The main models include:
- **User**: Teachers, Students, and Admins with role-based access
- **Textbook**: AI-generated textbooks with structured content
- **Class**: Virtual classrooms with members and resources
- **Assignment**: Homework and tasks with submissions
- **StudyRecord**: Tracking student progress and interactions
- **GuestAccess**: Temporary access for non-registered users

## Environment Variables

Key environment variables needed:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/digitalbook

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# AI Services
OPENAI_API_KEY=your-openai-api-key

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Testing Strategy

- **Unit Tests**: Jest for both frontend and backend
- **E2E Tests**: Playwright for frontend user flows
- **API Tests**: Supertest for backend endpoint testing
- **Test Database**: Separate test database with automatic seeding

## Deployment Process

1. The project uses Docker for containerization
2. Production deployment via `scripts/deploy.sh` to AWS Lightsail
3. Nginx as reverse proxy with SSL/TLS via Let's Encrypt
4. PostgreSQL and Redis containers for data persistence
5. Automated backups and health checks

## Server Restart Process (IMPORTANT)

### Server Information
- **AWS Lightsail Instance**: 3.37.168.225
- **Domain**: 내책.com (Punycode: xn--220bu63c.com)
- **SSH Access**: `ssh -i Korean-Text-Book.pem ubuntu@3.37.168.225`
- **Memory Limitation**: 914MB RAM (insufficient for Next.js builds)

### Critical Notes on Server Restart
1. **Memory Constraint**: The server has only 914MB RAM, which is insufficient for building Next.js applications. Always build locally and deploy the built files.

2. **Current Architecture**:
   - Frontend: Next.js app running on port 3000 (managed by systemd service `digitalbook`)
   - Backend: Express API on port 4000 (managed by PM2 as `backend`)
   - Nginx: Reverse proxy on ports 80/443 with SSL certificates
   - Database: PostgreSQL in Docker container
   - Cache: Redis in Docker container

### Deployment Process (Due to Memory Constraints)
```bash
# 1. Build locally
cd /Users/jihunkong/DigitalBook
rm -rf .next
npm install --legacy-peer-deps
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# 2. Create deployment package
tar -czf digitalbook-build.tar.gz \
    .next public package.json package-lock.json \
    next.config.js app components lib styles \
    --exclude='node_modules' --exclude='.git'

# 3. Deploy to server
scp -i Korean-Text-Book.pem digitalbook-build.tar.gz ubuntu@3.37.168.225:/tmp/
ssh -i Korean-Text-Book.pem ubuntu@3.37.168.225
cd /home/ubuntu/digitalbook
tar -xzf /tmp/digitalbook-build.tar.gz
npm install --production --legacy-peer-deps
sudo systemctl restart digitalbook
```

### Service Management Commands
```bash
# Frontend service (systemd)
sudo systemctl status digitalbook
sudo systemctl restart digitalbook
sudo journalctl -u digitalbook -f  # View logs

# Backend service (PM2)
pm2 list
pm2 restart backend
pm2 logs backend

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t  # Test configuration

# Docker services
docker ps
docker-compose ps
```

### Troubleshooting 502 Errors
1. Check if app is running: `sudo systemctl status digitalbook`
2. Check nginx logs: `sudo tail -100 /var/log/nginx/error.log`
3. Verify ports: `sudo ss -tlnp | grep -E ':80|:443|:3000|:4000'`
4. Check app logs: `sudo journalctl -u digitalbook -n 100`
5. Ensure .next directory exists and has correct permissions

### SSL Certificate Management
- Certificates are managed by Let's Encrypt via certbot
- Auto-renewal is configured
- Manual renewal: `sudo certbot renew`

### Important Scripts Created
- `/Users/jihunkong/DigitalBook/build-and-deploy-locally.sh` - Automated local build and deploy
- `/Users/jihunkong/DigitalBook/configure-ssl-auto.sh` - SSL configuration helper

## AI Integration Features

- **Text Generation**: Using GPT-4 for content creation
- **Image Generation**: DALL-E 3 for educational illustrations  
- **AI Tutor**: Real-time chat assistance for students
- **Content Analysis**: Automatic question generation and difficulty assessment
- **Writing Evaluation**: AI-powered essay grading and feedback

## Performance Optimizations

- Redis caching for frequently accessed data
- Database query optimization with Prisma
- Image optimization with Sharp
- Rate limiting on API endpoints
- CDN integration for static assets (planned)

## Security Measures

- JWT-based authentication with refresh tokens
- Rate limiting to prevent abuse
- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM
- XSS protection with React's automatic escaping
- CORS configuration for API access
- xn--220bu63c.com
 3.37.168.225. 도커를 사용합니다.
 다만 서버의 env 계열, yml계열, md계열 파일을 커밋 푸시할 때는 불필요한 정보가 들어갈 수 있으니 이그노어 처리를 하는 것을 잊지 마십시오. 민감정보의 경우 pem 키를 활용해 ssh로 직접 입력합니다.
절대 불필요하게 yml, env, md, sh, py 파일들을 추가로 생성하지 마세요. 테스트를 위해 생성했다면 사용 후에는 반드시 삭제하세요.
ultra think, 적절한 agent를 배치하세요. mcp에서 context7 등을 활용해 최신 코드들을 확인하세요. 깃 CLI를 설치하여 깃에서 푸시하는 방법을 활용하세요.