-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- bcrypt로 해시된 비밀번호 (실제로는 API를 통해 해시해야 하지만, 임시로 사용)
-- 관리자 계정
INSERT INTO users (email, password, name, role, is_active) VALUES
('purusil55@gmail.com', '$2a$10$YourHashedPasswordHere1', '관리자', 'ADMIN', true)
ON CONFLICT (email) DO NOTHING;

-- 교사 계정
INSERT INTO users (email, password, name, role, is_active) VALUES
('purusil@naver.com', '$2a$10$YourHashedPasswordHere2', '홍길동 선생님', 'TEACHER', true)
ON CONFLICT (email) DO NOTHING;

-- 학생 계정들
INSERT INTO users (email, password, name, role, is_active) VALUES
('student1@test.com', '$2a$10$YourHashedPasswordHere3', '김민수', 'STUDENT', true),
('student2@test.com', '$2a$10$YourHashedPasswordHere3', '이서연', 'STUDENT', true),
('student3@test.com', '$2a$10$YourHashedPasswordHere3', '박준호', 'STUDENT', true),
('student4@test.com', '$2a$10$YourHashedPasswordHere3', '최지우', 'STUDENT', true),
('student5@test.com', '$2a$10$YourHashedPasswordHere3', '정다은', 'STUDENT', true)
ON CONFLICT (email) DO NOTHING;