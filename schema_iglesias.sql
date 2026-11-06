-- =============================================================================
-- BASE DE DATOS: iglesias (MySQL 8.0+)
-- Proyecto: Casa Viva (Gestión Eclesiástica)
-- Ejecución: mysql> source c:/iglesias_merida/schema_iglesias.sql;
-- =============================================================================

USE iglesias;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. TABLA: churches (Sedes Parroquiales)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS church_history_timeline;
DROP TABLE IF EXISTS church_schedules;
DROP TABLE IF EXISTS attendance_details;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS ministry_members;
DROP TABLE IF EXISTS ministries;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS churches;

CREATE TABLE churches (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(80) NOT NULL,
    address VARCHAR(255) NOT NULL,
    colonia VARCHAR(100) NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    pastor VARCHAR(150) NOT NULL,
    founded VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    mission TEXT NOT NULL,
    logo LONGTEXT NULL,
    
    -- Variables de paleta de colores para el tema
    theme_primary VARCHAR(20) NOT NULL DEFAULT '#8A5A2B',
    theme_deep VARCHAR(20) NOT NULL DEFAULT '#2A1E13',
    theme_accent VARCHAR(20) NOT NULL DEFAULT '#D8B36A',
    theme_soft VARCHAR(20) NOT NULL DEFAULT '#F3E8D5',
    theme_tint VARCHAR(20) NOT NULL DEFAULT '#EFE0C8',
    
    -- Fotografía y créditos Wikimedia
    photo_src VARCHAR(500) NULL,
    photo_alt VARCHAR(255) NULL,
    photo_credit VARCHAR(100) NULL,
    photo_license VARCHAR(50) NULL,
    photo_source VARCHAR(500) NULL,
    photo_position VARCHAR(50) NULL,
    
    -- Reseña histórica
    history_summary TEXT NULL,
    history_architecture TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLA: church_schedules (Horarios de cultos/misas de la sede)
-- -----------------------------------------------------------------------------
CREATE TABLE church_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id VARCHAR(50) NOT NULL,
    day VARCHAR(20) NOT NULL,
    time VARCHAR(10) NOT NULL,
    label VARCHAR(120) NOT NULL,
    CONSTRAINT fk_schedules_church FOREIGN KEY (church_id) 
        REFERENCES churches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: church_history_timeline (Hitos históricos de la iglesia)
-- -----------------------------------------------------------------------------
CREATE TABLE church_history_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id VARCHAR(50) NOT NULL,
    year VARCHAR(30) NOT NULL,
    event TEXT NOT NULL,
    CONSTRAINT fk_timeline_church FOREIGN KEY (church_id) 
        REFERENCES churches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLA: users (Usuarios del sistema y permisos RBAC)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    church_id VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('administrador', 'pastor', 'secretario', 'tesorero', 'coordinador') NOT NULL DEFAULT 'coordinador',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_church FOREIGN KEY (church_id) 
        REFERENCES churches(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- -----------------------------------------------------------------------------
-- 5. TABLA: password_resets (Recuperación de contraseña)
-- -----------------------------------------------------------------------------
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reset_email_code (email, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA: members (Feligreses / Miembros de la congregación)
-- -----------------------------------------------------------------------------
CREATE TABLE members (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    church_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    birth_date DATE NULL,
    joined_at DATE NOT NULL,
    address VARCHAR(255) NULL,
    notes TEXT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_members_church FOREIGN KEY (church_id) 
        REFERENCES churches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_members_name ON members(first_name, last_name);
CREATE INDEX idx_members_church_active ON members(church_id, active);

-- -----------------------------------------------------------------------------
-- 7. TABLA: ministries (Ministerios / Grupos Pastorales)
-- -----------------------------------------------------------------------------
CREATE TABLE ministries (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    church_id VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#B4553B',
    coordinator_id VARCHAR(50) NOT NULL,
    meeting_day VARCHAR(20) NOT NULL,
    meeting_time VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ministries_church FOREIGN KEY (church_id) 
        REFERENCES churches(id) ON DELETE CASCADE,
    CONSTRAINT fk_ministries_coordinator FOREIGN KEY (coordinator_id) 
        REFERENCES members(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ministries_church ON ministries(church_id);

-- -----------------------------------------------------------------------------
-- 8. TABLA PIVOTE: ministry_members (Relación N:M Miembro <-> Ministerio)
-- -----------------------------------------------------------------------------
CREATE TABLE ministry_members (
    ministry_id VARCHAR(50) NOT NULL,
    member_id VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ministry_id, member_id),
    CONSTRAINT fk_mm_ministry FOREIGN KEY (ministry_id) 
        REFERENCES ministries(id) ON DELETE CASCADE,
    CONSTRAINT fk_mm_member FOREIGN KEY (member_id) 
        REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_mm_member ON ministry_members(member_id);

-- -----------------------------------------------------------------------------
-- 9. TABLA: events (Eventos, Cultos, Misas y Actividades)
-- -----------------------------------------------------------------------------
CREATE TABLE events (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    church_id VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    type ENUM('culto', 'reunion', 'actividad', 'administrativo') NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    place VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    responsible_id VARCHAR(50) NOT NULL,
    ministry_id VARCHAR(50) NULL,
    status ENUM('programado', 'finalizado', 'cancelado') NOT NULL DEFAULT 'programado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_church FOREIGN KEY (church_id) 
        REFERENCES churches(id) ON DELETE CASCADE,
    CONSTRAINT fk_events_responsible FOREIGN KEY (responsible_id) 
        REFERENCES members(id) ON DELETE RESTRICT,
    CONSTRAINT fk_events_ministry FOREIGN KEY (ministry_id) 
        REFERENCES ministries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_events_church_date ON events(church_id, date);
CREATE INDEX idx_events_status ON events(status);

-- -----------------------------------------------------------------------------
-- 10. TABLA: attendance_records (Cabecera de lista de asistencia)
-- -----------------------------------------------------------------------------
CREATE TABLE attendance_records (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    church_id VARCHAR(50) NOT NULL,
    event_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    notes TEXT NULL,
    recorded_by VARCHAR(50) NOT NULL,
    recorded_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_att_church FOREIGN KEY (church_id) 
        REFERENCES churches(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_event FOREIGN KEY (event_id) 
        REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_recorder FOREIGN KEY (recorded_by) 
        REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_att_church_date ON attendance_records(church_id, date);

-- -----------------------------------------------------------------------------
-- 11. TABLA: attendance_details (Detalle de presentes o ausentes)
-- -----------------------------------------------------------------------------
CREATE TABLE attendance_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attendance_id VARCHAR(50) NOT NULL,
    member_id VARCHAR(50) NOT NULL,
    status ENUM('presente', 'ausente') NOT NULL,
    CONSTRAINT fk_ad_attendance FOREIGN KEY (attendance_id) 
        REFERENCES attendance_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_ad_member FOREIGN KEY (member_id) 
        REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT uq_att_member UNIQUE (attendance_id, member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ad_member_status ON attendance_details(member_id, status);

-- -----------------------------------------------------------------------------
-- 12. TABLA: donations (Ofrendas, Diezmos y Donaciones)
-- -----------------------------------------------------------------------------
CREATE TABLE donations (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    church_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    concept VARCHAR(150) NOT NULL,
    method ENUM('efectivo', 'transferencia', 'tarjeta', 'deposito') NOT NULL,
    anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    member_id VARCHAR(50) NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_donations_church FOREIGN KEY (church_id) 
        REFERENCES churches(id) ON DELETE CASCADE,
    CONSTRAINT fk_donations_member FOREIGN KEY (member_id) 
        REFERENCES members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_donations_church_date ON donations(church_id, date);
CREATE INDEX idx_donations_method ON donations(method);
CREATE INDEX idx_donations_concept ON donations(concept);

-- -----------------------------------------------------------------------------
-- 13. TABLA: announcements (Avisos parroquiales y boletines)
-- -----------------------------------------------------------------------------
CREATE TABLE announcements (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    church_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    category ENUM('general', 'evento', 'servicio', 'urgente') NOT NULL DEFAULT 'general',
    published_at DATE NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    author_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcements_church FOREIGN KEY (church_id) 
        REFERENCES churches(id) ON DELETE CASCADE,
    CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) 
        REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_announcements_church_pub ON announcements(church_id, published_at);
CREATE INDEX idx_announcements_pinned ON announcements(pinned);

-- -----------------------------------------------------------------------------
-- VISTAS ANALÍTICAS (Para reportes y paneles)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_event_attendance_summary AS
SELECT 
    ar.id AS attendance_id,
    ar.church_id,
    ar.event_id,
    e.title AS event_title,
    e.type AS event_type,
    ar.date AS attendance_date,
    COUNT(CASE WHEN ad.status = 'presente' THEN 1 END) AS total_present,
    COUNT(CASE WHEN ad.status = 'ausente' THEN 1 END) AS total_absent,
    COUNT(ad.id) AS total_evaluated,
    ROUND((COUNT(CASE WHEN ad.status = 'presente' THEN 1 END) / NULLIF(COUNT(ad.id), 0)) * 100, 1) AS attendance_rate_percent,
    u.name AS recorded_by_name
FROM attendance_records ar
JOIN events e ON ar.event_id = e.id
JOIN users u ON ar.recorded_by = u.id
LEFT JOIN attendance_details ad ON ar.id = ad.attendance_id
GROUP BY ar.id, ar.church_id, ar.event_id, e.title, e.type, ar.date, u.name;

CREATE OR REPLACE VIEW v_monthly_donations AS
SELECT 
    church_id,
    DATE_FORMAT(date, '%Y-%m') AS year_month,
    concept,
    method,
    COUNT(id) AS donation_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS average_amount
FROM donations
GROUP BY church_id, DATE_FORMAT(date, '%Y-%m'), concept, method;

CREATE OR REPLACE VIEW v_members_with_ministries AS
SELECT 
    m.id,
    m.church_id,
    CONCAT(m.first_name, ' ', m.last_name) AS full_name,
    m.email,
    m.phone,
    m.active,
    m.joined_at,
    GROUP_CONCAT(min.name ORDER BY min.name SEPARATOR ', ') AS ministries_list,
    COUNT(mm.ministry_id) AS total_ministries
FROM members m
LEFT JOIN ministry_members mm ON m.id = mm.member_id
LEFT JOIN ministries min ON mm.ministry_id = min.id
GROUP BY m.id, m.church_id, m.first_name, m.last_name, m.email, m.phone, m.active, m.joined_at;

-- Reactivar revisión de llaves foráneas
SET FOREIGN_KEY_CHECKS = 1;

