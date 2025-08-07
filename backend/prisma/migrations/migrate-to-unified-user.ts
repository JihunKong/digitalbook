/**
 * 데이터 마이그레이션 스크립트
 * 기존 Teacher/Student 모델에서 통합 User 모델로 데이터 이전
 * 
 * 실행 방법:
 * cd backend
 * npx tsx prisma/migrations/migrate-to-unified-user.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// 기존 스키마용 Prisma Client (마이그레이션 전)
const oldPrisma = new PrismaClient();
// 새 스키마용 Prisma Client (마이그레이션 후)
const newPrisma = new PrismaClient();

interface MigrationResult {
  teachersMigrated: number;
  studentsMigrated: number;
  adminCreated: number;
  errors: string[];
}

async function migrateData(): Promise<MigrationResult> {
  const result: MigrationResult = {
    teachersMigrated: 0,
    studentsMigrated: 0,
    adminCreated: 0,
    errors: []
  };

  console.log('🚀 데이터 마이그레이션 시작...');
  
  try {
    // 트랜잭션으로 안전하게 처리
    await newPrisma.$transaction(async (tx) => {
      
      // 1. Admin 계정 생성 (존재하지 않는 경우)
      console.log('📌 Step 1: Admin 계정 생성');
      try {
        const existingAdmin = await tx.user.findFirst({
          where: { email: 'admin@xn--220bu63c.com' }
        });

        if (!existingAdmin) {
          const hashedPassword = await bcrypt.hash('Admin123!@#', 12);
          const admin = await tx.user.create({
            data: {
              email: 'admin@xn--220bu63c.com',
              password: hashedPassword,
              name: '시스템 관리자',
              role: 'ADMIN',
              isActive: true,
              adminProfile: {
                create: {
                  department: '시스템 관리부',
                  permissions: {
                    users: ['create', 'read', 'update', 'delete'],
                    system: ['manage', 'monitor', 'configure'],
                    content: ['moderate', 'approve', 'delete']
                  }
                }
              }
            }
          });
          console.log('✅ Admin 계정 생성 완료:', admin.email);
          result.adminCreated++;
        }
      } catch (error) {
        console.error('❌ Admin 생성 실패:', error);
        result.errors.push(`Admin 생성 실패: ${error}`);
      }

      // 2. Teacher 데이터 마이그레이션
      console.log('📌 Step 2: Teacher 데이터 마이그레이션');
      try {
        // @ts-ignore - 기존 스키마 접근
        const teachers = await oldPrisma.teacher.findMany({
          include: {
            classes: true
          }
        });

        for (const teacher of teachers) {
          try {
            // User 생성
            const user = await tx.user.create({
              data: {
                email: teacher.email,
                password: teacher.password,
                name: teacher.name,
                role: 'TEACHER',
                isActive: true,
                createdAt: teacher.createdAt,
                updatedAt: teacher.updatedAt,
                teacherProfile: {
                  create: {
                    school: '서울초등학교', // 기본값
                    subject: '국어', // 기본값
                    grade: '5학년' // 기본값
                  }
                }
              }
            });

            console.log(`✅ Teacher 마이그레이션 완료: ${user.email}`);
            result.teachersMigrated++;

            // Classes 관계 업데이트는 별도 처리 필요
            // (새 스키마에서는 TeacherProfile과 연결)
            
          } catch (error) {
            console.error(`❌ Teacher 마이그레이션 실패 (${teacher.email}):`, error);
            result.errors.push(`Teacher ${teacher.email}: ${error}`);
          }
        }
      } catch (error) {
        console.error('❌ Teacher 조회 실패:', error);
        result.errors.push(`Teacher 조회 실패: ${error}`);
      }

      // 3. Student 데이터 마이그레이션
      console.log('📌 Step 3: Student 데이터 마이그레이션');
      try {
        // @ts-ignore - 기존 스키마 접근
        const students = await oldPrisma.student.findMany({
          include: {
            class: true,
            questions: true
          }
        });

        for (const student of students) {
          try {
            // 학생은 비밀번호 없을 수 있음
            const defaultPassword = await bcrypt.hash('Student123!', 12);
            
            // User 생성
            const user = await tx.user.create({
              data: {
                email: `${student.studentId}@student.xn--220bu63c.com`,
                password: defaultPassword,
                name: student.name,
                role: 'STUDENT',
                isActive: true,
                createdAt: student.joinedAt,
                updatedAt: student.lastActiveAt,
                studentProfile: {
                  create: {
                    studentId: student.studentId,
                    school: '서울초등학교', // 기본값
                    grade: '5학년', // 기본값
                    className: student.class?.name || '미배정'
                  }
                }
              }
            });

            console.log(`✅ Student 마이그레이션 완료: ${user.email}`);
            result.studentsMigrated++;

          } catch (error) {
            console.error(`❌ Student 마이그레이션 실패 (${student.studentId}):`, error);
            result.errors.push(`Student ${student.studentId}: ${error}`);
          }
        }
      } catch (error) {
        console.error('❌ Student 조회 실패:', error);
        result.errors.push(`Student 조회 실패: ${error}`);
      }

      // 4. Session 데이터 마이그레이션
      console.log('📌 Step 4: Session 데이터 정리');
      try {
        // 기존 세션 정리 (선택사항)
        // @ts-ignore
        await oldPrisma.session.deleteMany({
          where: {
            expiresAt: {
              lt: new Date()
            }
          }
        });
        console.log('✅ 만료된 세션 정리 완료');
      } catch (error) {
        console.error('❌ Session 정리 실패:', error);
        result.errors.push(`Session 정리 실패: ${error}`);
      }

    });

    console.log('\n✨ 마이그레이션 완료!');
    console.log('📊 결과:');
    console.log(`  - Admin 생성: ${result.adminCreated}`);
    console.log(`  - Teacher 마이그레이션: ${result.teachersMigrated}`);
    console.log(`  - Student 마이그레이션: ${result.studentsMigrated}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ 오류 발생:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }

  return result;
}

// 테스트 데이터 시딩 함수
async function seedTestData() {
  console.log('\n🌱 테스트 데이터 시딩 시작...');
  
  try {
    // 테스트 계정 생성
    const testAccounts = [
      // Admin
      { email: 'admin@test.com', password: 'Admin123!@#', name: '테스트관리자', role: 'ADMIN' },
      // Teachers
      { email: 'teacher1@test.com', password: 'Teacher123!', name: '김민정', role: 'TEACHER' },
      { email: 'teacher2@test.com', password: 'Teacher123!', name: '박영희', role: 'TEACHER' },
      // Students
      { email: 'student1@test.com', password: 'Student123!', name: '김학생', role: 'STUDENT' },
      { email: 'student2@test.com', password: 'Student123!', name: '이학생', role: 'STUDENT' },
      { email: 'student3@test.com', password: 'Student123!', name: '박학생', role: 'STUDENT' },
    ];

    for (const account of testAccounts) {
      try {
        const hashedPassword = await bcrypt.hash(account.password, 12);
        
        const user = await newPrisma.user.upsert({
          where: { email: account.email },
          update: {},
          create: {
            email: account.email,
            password: hashedPassword,
            name: account.name,
            role: account.role as any,
            isActive: true,
            // 역할별 프로필 생성
            ...(account.role === 'ADMIN' && {
              adminProfile: {
                create: {
                  department: '테스트부서'
                }
              }
            }),
            ...(account.role === 'TEACHER' && {
              teacherProfile: {
                create: {
                  school: '테스트초등학교',
                  subject: '국어',
                  grade: '5학년'
                }
              }
            }),
            ...(account.role === 'STUDENT' && {
              studentProfile: {
                create: {
                  studentId: `2024${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                  school: '테스트초등학교',
                  grade: '5학년',
                  className: '1반'
                }
              }
            })
          }
        });
        
        console.log(`✅ 테스트 계정 생성: ${user.email}`);
      } catch (error) {
        console.error(`❌ 테스트 계정 생성 실패 (${account.email}):`, error);
      }
    }

    // 테스트 수업 생성
    const teacher = await newPrisma.user.findFirst({
      where: { email: 'teacher1@test.com' },
      include: { teacherProfile: true }
    });

    if (teacher?.teacherProfile) {
      const testClass = await newPrisma.class.create({
        data: {
          code: 'TEST01',
          name: '테스트 국어 수업',
          description: '테스트용 국어 수업입니다',
          teacherId: teacher.teacherProfile.id,
          subject: '국어',
          grade: '5학년',
          semester: '1학기'
        }
      });
      console.log(`✅ 테스트 수업 생성: ${testClass.name}`);
    }

    console.log('✨ 테스트 데이터 시딩 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 데이터 시딩 실패:', error);
    throw error;
  }
}

// 메인 실행 함수
async function main() {
  console.log('=====================================');
  console.log('한국 디지털 교과서 플랫폼');
  console.log('데이터 마이그레이션 스크립트');
  console.log('=====================================\n');

  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'migrate':
        await migrateData();
        break;
      case 'seed':
        await seedTestData();
        break;
      case 'all':
        await migrateData();
        await seedTestData();
        break;
      default:
        console.log('사용법:');
        console.log('  npx tsx migrate-to-unified-user.ts migrate  # 데이터 마이그레이션만');
        console.log('  npx tsx migrate-to-unified-user.ts seed     # 테스트 데이터만');
        console.log('  npx tsx migrate-to-unified-user.ts all      # 모두 실행');
    }
  } catch (error) {
    console.error('실행 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  });