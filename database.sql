-- Legacy relational schema reference
-- 当前项目默认使用 data/app-data.json 作为本地持久化存储。
-- 如果未来迁移到 MySQL，可参考下面的通用表结构。

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_color VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL
);

CREATE TABLE game_data (
    user_id INT PRIMARY KEY,
    stats_json JSON NOT NULL,
    achievements_json JSON NOT NULL,
    settings_json JSON NOT NULL,
    sensitivity_json JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_game_data_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
