const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:securepassword123!@localhost:5432/textbook_db'
});

async function createAccounts() {
  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('alsk2004A!@#', 10);
    const teacherPassword = await bcrypt.hash('rhdwlgns85', 10);
    const studentPassword = await bcrypt.hash('student123!', 10);

    // Create admin account
    console.log('Creating admin account...');
    await pool.query(`
      INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      ON CONFLICT (email) 
      DO UPDATE SET 
        password = $2,
        role = $4,
        updated_at = NOW()
    `, ['purusil55@gmail.com', adminPassword, '관리자', 'ADMIN']);

    // Create teacher account
    console.log('Creating teacher account...');
    await pool.query(`
      INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      ON CONFLICT (email) 
      DO UPDATE SET 
        password = $2,
        role = $4,
        updated_at = NOW()
    `, ['purusil@naver.com', teacherPassword, '홍길동 선생님', 'TEACHER']);

    // Create student accounts
    const studentNames = ['김민수', '이서연', '박준호', '최지우', '정다은'];
    
    for (let i = 1; i <= 5; i++) {
      console.log(`Creating student${i} account...`);
      await pool.query(`
        INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        ON CONFLICT (email) 
        DO UPDATE SET 
          password = $2,
          role = $4,
          updated_at = NOW()
      `, [`student${i}@test.com`, studentPassword, studentNames[i-1], 'STUDENT']);
    }

    console.log('All accounts created successfully!');
    
    // Display created accounts
    const result = await pool.query('SELECT email, name, role FROM users ORDER BY role, email');
    console.log('\nCreated accounts:');
    console.table(result.rows);

  } catch (error) {
    console.error('Error creating accounts:', error);
  } finally {
    await pool.end();
  }
}

createAccounts();