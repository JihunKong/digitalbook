import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

// Predefined accounts since backend is not working
const PREDEFINED_ACCOUNTS = {
  'purusil55@gmail.com': {
    password: 'alsk2004A!@#',
    name: '관리자',
    role: 'ADMIN',
    id: '1'
  },
  'purusil@naver.com': {
    password: 'rhdwlgns85',
    name: '홍길동 선생님',
    role: 'TEACHER',
    id: '2'
  },
  'teacher1@test.com': {
    password: 'teacher123!',
    name: '테스트 교사',
    role: 'TEACHER',
    id: '8'
  },
  'teacher2@test.com': {
    password: 'Teacher123!',
    name: '박영희 선생님',
    role: 'TEACHER',
    id: '9'
  },
  'student1@test.com': {
    password: 'student123!',
    name: '김민수',
    role: 'STUDENT',
    id: '3'
  },
  'student2@test.com': {
    password: 'student123!',
    name: '이서연',
    role: 'STUDENT',
    id: '4'
  },
  'student3@test.com': {
    password: 'student123!',
    name: '박준호',
    role: 'STUDENT',
    id: '5'
  },
  'student4@test.com': {
    password: 'student123!',
    name: '최지우',
    role: 'STUDENT',
    id: '6'
  },
  'student5@test.com': {
    password: 'student123!',
    name: '정다은',
    role: 'STUDENT',
    id: '7'
  }
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-for-development'
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Check predefined accounts
    const account = PREDEFINED_ACCOUNTS[email as keyof typeof PREDEFINED_ACCOUNTS]
    
    if (!account || account.password !== password) {
      return NextResponse.json(
        { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = await new SignJWT({ 
      email,
      name: account.name,
      role: account.role,
      id: account.id
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    // Return user data with token
    return NextResponse.json({
      token,
      user: {
        id: account.id,
        email,
        name: account.name,
        role: account.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}