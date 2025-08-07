import { Router, Request, Response } from 'express'
import { resetDemoData } from '../utils/seed.demo'
import { logger } from '../utils/logger'

const router = Router()

// 데모 모드 체크 미들웨어
const isDemoMode = (req: Request, res: Response, next: Function) => {
  if (process.env.DEMO_MODE !== 'true') {
    return res.status(403).json({
      error: 'Demo mode is not enabled'
    })
  }
  next()
}

// 데모 데이터 리셋
router.post('/reset', isDemoMode, async (req: Request, res: Response) => {
  try {
    logger.info('Demo reset requested')
    
    // 비동기로 리셋 실행 (응답은 즉시 반환)
    resetDemoData().catch(error => {
      logger.error('Demo reset failed:', error)
    })
    
    res.json({
      success: true,
      message: 'Demo reset initiated',
      nextResetIn: 3600000, // 1시간
    })
  } catch (error) {
    logger.error('Demo reset error:', error)
    res.status(500).json({
      error: 'Failed to reset demo data'
    })
  }
})

// 데모 상태 확인
router.get('/status', async (req: Request, res: Response) => {
  res.json({
    demoMode: process.env.DEMO_MODE === 'true',
    features: {
      demoAccounts: process.env.DEMO_MODE === 'true',
      demoTours: process.env.DEMO_MODE === 'true',
      autoReset: process.env.DEMO_MODE === 'true',
    },
    resetInterval: 3600000,
    message: process.env.DEMO_MODE === 'true' 
      ? 'Demo mode is active. Data will be reset periodically.'
      : 'Production mode is active.',
  })
})

// 데모 계정 정보 (데모 모드일 때만)
router.get('/accounts', isDemoMode, async (req: Request, res: Response) => {
  res.json({
    teacher: {
      email: 'teacher1@demo.com',
      password: 'demo123!',
      hint: '교사 계정으로 로그인하여 교과서 생성 및 관리 기능을 체험하세요.',
    },
    student: {
      email: 'student1@demo.com',
      password: 'demo123!',
      hint: '학생 계정으로 로그인하여 학습 기능을 체험하세요.',
    },
    admin: {
      email: 'admin@demo.com',
      password: 'demo123!',
      hint: '관리자 계정으로 로그인하여 시스템 관리 기능을 체험하세요.',
    },
  })
})

export default router