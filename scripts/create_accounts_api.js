const axios = require('axios');

const API_URL = 'https://xn--220bu63c.com/api';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createAccount(userData) {
  try {
    const response = await axios.post(`${API_URL}/auth/signup`, userData);
    console.log(`✅ Account created: ${userData.email}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️  Account already exists: ${userData.email}`);
    } else {
      console.error(`❌ Failed to create ${userData.email}:`, error.response?.data?.message || error.message);
    }
  }
}

async function createAllAccounts() {
  console.log('🚀 Starting account creation...\n');

  const accounts = [
    // Admin account
    {
      email: 'purusil55@gmail.com',
      password: 'alsk2004A!@#',
      name: '관리자',
      role: 'TEACHER' // API might not support ADMIN role directly
    },
    // Teacher account
    {
      email: 'purusil@naver.com',
      password: 'rhdwlgns85',
      name: '홍길동 선생님',
      role: 'TEACHER'
    },
    // Student accounts
    {
      email: 'student1@test.com',
      password: 'student123!',
      name: '김민수',
      role: 'STUDENT'
    },
    {
      email: 'student2@test.com',
      password: 'student123!',
      name: '이서연',
      role: 'STUDENT'
    },
    {
      email: 'student3@test.com',
      password: 'student123!',
      name: '박준호',
      role: 'STUDENT'
    },
    {
      email: 'student4@test.com',
      password: 'student123!',
      name: '최지우',
      role: 'STUDENT'
    },
    {
      email: 'student5@test.com',
      password: 'student123!',
      name: '정다은',
      role: 'STUDENT'
    }
  ];

  for (const account of accounts) {
    await createAccount(account);
    await delay(1000); // Wait 1 second between requests
  }

  console.log('\n✨ Account creation process completed!');
  console.log('\n📋 Account Summary:');
  console.log('===================');
  console.log('Admin/Teacher: purusil55@gmail.com / alsk2004A!@#');
  console.log('Teacher: purusil@naver.com / rhdwlgns85');
  console.log('Students: student1-5@test.com / student123!');
}

// Run if called directly
if (require.main === module) {
  createAllAccounts().catch(console.error);
}

module.exports = { createAccount, createAllAccounts };