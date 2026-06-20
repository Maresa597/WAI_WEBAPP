CREATE USER IF NOT EXISTS 'wai_user'@'localhost' IDENTIFIED BY 'wai123';
GRANT ALL PRIVILEGES ON wai_system_db.* TO 'wai_user'@'localhost';
FLUSH PRIVILEGES;
