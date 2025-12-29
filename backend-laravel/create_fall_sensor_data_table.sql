-- SQL para criar a tabela fall_sensor_data manualmente
-- Execute este arquivo se a migration do Laravel não funcionar
-- Uso: mysql -u root -p laravel < create_fall_sensor_data_table.sql

USE laravel;

CREATE TABLE IF NOT EXISTS fall_sensor_data (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    sensor_mac VARCHAR(17) NULL COMMENT 'MAC address format: XX:XX:XX:XX:XX:XX',
    posture ENUM('standing', 'sitting', 'lying_ventral', 'lying_dorsal', 'lying_lateral_right', 'lying_lateral_left', 'fall') DEFAULT 'standing',
    posture_pt VARCHAR(50) NULL COMMENT 'Nome da postura em português',
    acceleration_x DECIMAL(10, 6) NULL,
    acceleration_y DECIMAL(10, 6) NULL,
    acceleration_z DECIMAL(10, 6) NULL,
    gyro_x DECIMAL(10, 6) NULL,
    gyro_y DECIMAL(10, 6) NULL,
    gyro_z DECIMAL(10, 6) NULL,
    magnitude DECIMAL(10, 6) NULL COMMENT 'Magnitude da aceleração',
    is_fall_detected BOOLEAN DEFAULT FALSE,
    confidence DECIMAL(5, 2) NULL COMMENT 'Confiança da classificação (0-100)',
    sensor_timestamp TIMESTAMP NULL COMMENT 'Timestamp do sensor',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_group_id (group_id),
    INDEX idx_user_id (user_id),
    INDEX idx_posture (posture),
    INDEX idx_is_fall_detected (is_fall_detected),
    INDEX idx_sensor_timestamp (sensor_timestamp),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

