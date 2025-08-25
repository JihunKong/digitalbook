const { PrismaClient } = require('@prisma/client');
const { createTeacher } = require('./create-teacher');
const { createStudents } = require('./create-students');

const prisma = new PrismaClient();

// Generate a unique 6-character class code
function generateClassCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

async function setupClass() {
  try {
    console.log('🏫 Setting up class...\n');
    
    // Step 1: Ensure teacher exists
    console.log('Step 1: Creating/verifying teacher account...');
    const teacher = await createTeacher();
    
    // Get teacher profile
    const teacherWithProfile = await prisma.user.findUnique({
      where: { id: teacher.id },
      include: { teacherProfile: true }
    });
    
    if (!teacherWithProfile.teacherProfile) {
      throw new Error('Teacher profile not found');
    }
    
    // Step 2: Create students
    console.log('\nStep 2: Creating/verifying student accounts...');
    const students = await createStudents();
    
    // Step 3: Check if class already exists
    console.log('\nStep 3: Creating class...');
    let classRoom = await prisma.class.findFirst({
      where: {
        teacherId: teacherWithProfile.teacherProfile.id,
        name: '5학년 1반 국어'
      }
    });
    
    if (!classRoom) {
      // Generate unique class code
      let classCode;
      let codeExists = true;
      
      while (codeExists) {
        classCode = generateClassCode();
        const existing = await prisma.class.findUnique({
          where: { code: classCode }
        });
        codeExists = !!existing;
      }
      
      // Create the class
      classRoom = await prisma.class.create({
        data: {
          code: classCode,
          name: '5학년 1반 국어',
          description: 'PDF 기반 국어 수업입니다. AI 튜터와 함께 학습하고 다양한 활동을 수행합니다.',
          teacherId: teacherWithProfile.teacherProfile.id,
          subject: '국어',
          grade: '5',
          semester: '1학기',
          isActive: true,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        }
      });
      
      console.log(`✅ Class created with code: ${classRoom.code}`);
    } else {
      console.log(`✓ Class already exists with code: ${classRoom.code}`);
    }
    
    // Step 4: Enroll students in the class
    console.log('\nStep 4: Enrolling students in class...');
    
    for (const student of students) {
      if (!student.studentProfile) {
        // Get student profile
        const studentWithProfile = await prisma.user.findUnique({
          where: { id: student.id },
          include: { studentProfile: true }
        });
        
        if (!studentWithProfile.studentProfile) {
          console.log(`⚠️ No student profile for ${student.name}, skipping...`);
          continue;
        }
        
        student.studentProfile = studentWithProfile.studentProfile;
      }
      
      // Check if already enrolled
      const existingEnrollment = await prisma.classEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId: classRoom.id,
            studentId: student.studentProfile.id
          }
        }
      });
      
      if (!existingEnrollment) {
        await prisma.classEnrollment.create({
          data: {
            classId: classRoom.id,
            studentId: student.studentProfile.id,
            isActive: true
          }
        });
        console.log(`✅ Enrolled ${student.name} in class`);
      } else {
        console.log(`✓ ${student.name} already enrolled`);
      }
    }
    
    // Step 5: Display summary
    console.log('\n🎉 ===================================');
    console.log('📚 CLASS SETUP COMPLETE!');
    console.log('===================================\n');
    
    console.log('👩‍🏫 TEACHER ACCOUNT:');
    console.log('  Email: teacher@digitalbook.com');
    console.log('  Password: Teacher123!');
    console.log('  Name:', teacherWithProfile.name);
    
    console.log('\n📖 CLASS INFORMATION:');
    console.log('  Name:', classRoom.name);
    console.log('  Subject:', classRoom.subject);
    console.log('  Grade:', classRoom.grade);
    console.log('  Access Code:', classRoom.code);
    console.log('  Class ID:', classRoom.id);
    
    console.log('\n👥 ENROLLED STUDENTS:');
    students.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.name} (${student.email})`);
    });
    console.log('  Password for all students: Student123!');
    
    console.log('\n📝 NEXT STEPS:');
    console.log('  1. Teacher can login and upload PDF materials');
    console.log('  2. Students can login and join with code:', classRoom.code);
    console.log('  3. Activities will be auto-generated from uploaded PDFs');
    console.log('  4. AI tutor will provide context-aware help');
    
    console.log('\n===================================\n');
    
    return {
      teacher: teacherWithProfile,
      students,
      class: classRoom
    };
  } catch (error) {
    console.error('❌ Error setting up class:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  setupClass()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { setupClass };