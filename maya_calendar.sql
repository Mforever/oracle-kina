
USE maya_calendar;

-- Таблица знаков майя
CREATE TABLE maya_tones (
    id INT PRIMARY KEY,
    name_ru VARCHAR(100) NOT NULL,
    name_original VARCHAR(100) NOT NULL,
    glyph_emoji VARCHAR(10),
    short_text VARCHAR(400) NOT NULL,
    full_text TEXT NOT NULL,
    quality_score INT DEFAULT 5,
    source VARCHAR(50) DEFAULT 'generated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Таблица зодиакальных комбинаций
CREATE TABLE zodiac_combos (
    id INT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    short_text VARCHAR(400) NOT NULL,
    full_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Таблица для хранения email-подписок
CREATE TABLE subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    source VARCHAR(50) DEFAULT 'landing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;