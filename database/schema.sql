CREATE DATABASE IF NOT EXISTS taskmaster_db;
USE taskmaster_db;

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('TO_DO', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'TO_DO',
    due_date DATE
);

-- Insert mock data
INSERT INTO tasks (title, description, status, due_date) VALUES
('Set up Project Structure', 'Initialize the Java project structure and setup directories.', 'COMPLETED', '2026-07-15'),
('Create Database Schema', 'Define taskmaster_db and tasks table structure.', 'IN_PROGRESS', '2026-07-22'),
('Implement JDBC Connection', 'Write Java code to connect to the MySQL database.', 'TO_DO', '2026-07-25');
