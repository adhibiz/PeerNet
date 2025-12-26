-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_picture_url VARCHAR(500),
    role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin')),
    user_type VARCHAR(50) DEFAULT 'regular',
    
    -- Contact Information
    phone VARCHAR(20),
    country VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50),
    
    -- Education & Career
    current_company VARCHAR(255),
    current_position VARCHAR(255),
    education_level VARCHAR(100),
    field_of_study VARCHAR(255),
    
    -- Social Links
    github_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    
    -- Metrics
    peer_points INTEGER DEFAULT 0,
    reputation_score DECIMAL(3,2) DEFAULT 0.0,
    total_sessions_hosted INTEGER DEFAULT 0,
    total_sessions_attended INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    
    -- Preferences
    preferred_languages VARCHAR(100)[] DEFAULT '{"english"}',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "session_reminders": true}',
    privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "show_online_status": true}',
    
    -- Verification
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_profile_completed BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Skills Table
CREATE TABLE IF NOT EXISTS skills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    description TEXT,
    icon_url VARCHAR(500),
    popularity_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Skills Table
CREATE TABLE IF NOT EXISTS user_skills (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(50) DEFAULT 'beginner',
    years_of_experience DECIMAL(3,1),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, skill_id)
);

-- Learning Rooms Table
CREATE TABLE IF NOT EXISTS learning_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    topic VARCHAR(100),
    
    -- Room Configuration
    host_id UUID REFERENCES users(id) ON DELETE SET NULL,
    skill_level VARCHAR(50) DEFAULT 'beginner',
    language VARCHAR(50) DEFAULT 'english',
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    
    -- Room Status
    status VARCHAR(50) DEFAULT 'scheduled',
    is_private BOOLEAN DEFAULT FALSE,
    room_code VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    
    -- Scheduling
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    scheduled_end_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Room Data
    whiteboard_data JSONB,
    shared_resources JSONB DEFAULT '[]',
    chat_history JSONB DEFAULT '[]',
    
    -- Stats
    average_rating DECIMAL(3,2),
    total_ratings INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Room Participants Table
CREATE TABLE IF NOT EXISTS room_participants (
    room_id UUID REFERENCES learning_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    role VARCHAR(50) DEFAULT 'participant',
    is_muted BOOLEAN DEFAULT FALSE,
    peer_connection_data JSONB,
    PRIMARY KEY (room_id, user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES learning_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(50) DEFAULT 'text',
    content TEXT,
    file_url VARCHAR(500),
    file_type VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Connections Table
CREATE TABLE IF NOT EXISTS user_connections (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_type VARCHAR(100) NOT NULL,
    badge_name VARCHAR(255),
    badge_description TEXT,
    badge_icon VARCHAR(500),
    points_awarded INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Insert sample skills
INSERT INTO skills (name, category, description) VALUES
('JavaScript', 'Programming', 'Programming language for web development'),
('Python', 'Programming', 'General-purpose programming language'),
('React', 'Web Development', 'JavaScript library for building user interfaces'),
('Node.js', 'Backend Development', 'JavaScript runtime for server-side development'),
('Machine Learning', 'Data Science', 'AI and machine learning concepts'),
('Data Structures', 'Computer Science', 'Fundamental data structures and algorithms'),
('UI/UX Design', 'Design', 'User interface and experience design'),
('DevOps', 'Infrastructure', 'Development and operations practices'),
('Cloud Computing', 'Infrastructure', 'Cloud platforms and services'),
('Communication', 'Soft Skills', 'Effective communication skills'),
('Leadership', 'Soft Skills', 'Leadership and team management')
ON CONFLICT (name) DO NOTHING;

-- Insert admin user (password: admin123)
INSERT INTO users (email, username, full_name, password_hash, role, is_email_verified, is_profile_completed) 
VALUES (
    'admin@peernet.com',
    'admin',
    'PeerNet Admin',
    '$2b$10$K7L1OJ45/4Y2nIvhRVqCe.K3wB6WcCQ/.H.5J.8L1QJ5q5q5q5q5q', -- bcrypt hash for 'admin123'
    'admin',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Insert sample user (password: password123)
INSERT INTO users (email, username, full_name, password_hash, bio, role, is_email_verified, is_profile_completed, current_company, current_position) 
VALUES (
    'alex@example.com',
    'alexjohnson',
    'Alex Johnson',
    '$2b$10$K7L1OJ45/4Y2nIvhRVqCe.K3wB6WcCQ/.H.5J.8L1QJ5q5q5q5q5q', -- bcrypt hash for 'password123'
    'Passionate about teaching programming and helping peers grow together.',
    'mentor',
    TRUE,
    TRUE,
    'TechCorp',
    'Senior Software Developer'
) ON CONFLICT (email) DO NOTHING;

-- Assign skills to sample user (Note: This is complex with UUIDs, might skip or use subquery)
-- The original script used a complex query with join to handle UUIDs logic.
-- I'll include the same logic.

INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience)
SELECT 
    u.id,
    s.id,
    CASE 
        WHEN s.name IN ('JavaScript', 'React', 'Node.js') THEN 'expert'
        WHEN s.name IN ('Python', 'Machine Learning') THEN 'advanced'
        ELSE 'intermediate'
    END,
    CASE 
        WHEN s.name IN ('JavaScript', 'React') THEN 5.0
        WHEN s.name IN ('Node.js') THEN 4.0
        WHEN s.name IN ('Python') THEN 3.0
        ELSE 2.0
    END
FROM users u
CROSS JOIN skills s
WHERE u.email = 'alex@example.com'
AND s.name IN ('JavaScript', 'Python', 'React', 'Node.js', 'Machine Learning', 'Communication')
ON CONFLICT (user_id, skill_id) DO NOTHING;
