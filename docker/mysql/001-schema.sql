CREATE TABLE IF NOT EXISTS users (
 id VARCHAR(36) PRIMARY KEY, googleId VARCHAR(255) NOT NULL UNIQUE,
 email VARCHAR(255) NOT NULL UNIQUE, name TEXT NOT NULL, image TEXT NOT NULL,
 createdAt VARCHAR(30) NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS sessions (
 id VARCHAR(36) PRIMARY KEY, ownerUserId VARCHAR(36) NOT NULL,
 title VARCHAR(120) NOT NULL, description TEXT NOT NULL, presenter VARCHAR(80) NOT NULL,
 date VARCHAR(40) NOT NULL, active BOOLEAN NOT NULL DEFAULT FALSE,
 allowQuestions BOOLEAN NOT NULL DEFAULT TRUE, createdAt VARCHAR(30) NOT NULL, updatedAt VARCHAR(30) NOT NULL,
 FOREIGN KEY (ownerUserId) REFERENCES users(id) ON DELETE CASCADE,
 INDEX sessions_owner (ownerUserId, createdAt)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS questions (
 id VARCHAR(36) PRIMARY KEY, sessionId VARCHAR(36) NOT NULL, name VARCHAR(255) NOT NULL,
 question TEXT NOT NULL, emoji VARCHAR(16) NOT NULL, color VARCHAR(16) NOT NULL,
 status ENUM('pending','approved','hidden','pinned') NOT NULL DEFAULT 'approved', createdAt VARCHAR(30) NOT NULL,
 FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
 INDEX questions_session (sessionId, createdAt)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
