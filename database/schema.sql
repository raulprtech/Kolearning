-- Kolearning Database Schema for Supabase
-- This file contains the complete database schema for the Kolearning platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  profession TEXT,
  company TEXT,
  age TEXT,
  additional_info TEXT,
  total_mastery_points INTEGER DEFAULT 170,
  global_cognitive_credits INTEGER DEFAULT 500,
  daily_streak INTEGER DEFAULT 0,
  last_session_date DATE,
  learner_rank TEXT DEFAULT 'G',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  mastery INTEGER DEFAULT 0,
  icon TEXT DEFAULT 'Book',
  categories TEXT[] DEFAULT '{}',
  best_streak INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  full_learning_plan_markdown TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sources table (for project materials)
CREATE TABLE sources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Atoms table (knowledge atoms for each project)
CREATE TABLE atoms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  -- FSRS Metrics
  difficulty DECIMAL(3,2) DEFAULT 0.3,
  stability DECIMAL(10,2) DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  retrievability INTEGER, -- FSRS rating 1-4
  incorrect_answers TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Learning path items
CREATE TABLE learning_path_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  session_number INTEGER NOT NULL,
  topic TEXT NOT NULL,
  session_type TEXT NOT NULL,
  questions TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sessions table
CREATE TABLE sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  session_number INTEGER NOT NULL,
  type TEXT NOT NULL,
  questions TEXT,
  duration TEXT DEFAULT '20 min',
  status TEXT DEFAULT 'Locked' CHECK (status IN ('Completed', 'Continue', 'Locked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Session atoms (many-to-many relationship between sessions and atoms)
CREATE TABLE session_atoms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  atom_id UUID REFERENCES atoms(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_is_archived ON projects(is_archived);
CREATE INDEX idx_projects_is_completed ON projects(is_completed);
CREATE INDEX idx_projects_is_public ON projects(is_public);
CREATE INDEX idx_sources_project_id ON sources(project_id);
CREATE INDEX idx_atoms_project_id ON atoms(project_id);
CREATE INDEX idx_atoms_last_reviewed ON atoms(last_reviewed);
CREATE INDEX idx_learning_path_items_project_id ON learning_path_items(project_id);
CREATE INDEX idx_sessions_project_id ON sessions(project_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_session_atoms_session_id ON session_atoms(session_id);
CREATE INDEX idx_session_atoms_atom_id ON session_atoms(atom_id);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE atoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_atoms ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public projects" ON projects FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Sources policies
CREATE POLICY "Users can manage sources of own projects" ON sources FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = sources.project_id AND projects.user_id = auth.uid())
);

-- Atoms policies  
CREATE POLICY "Users can manage atoms of own projects" ON atoms FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = atoms.project_id AND projects.user_id = auth.uid())
);

-- Learning path items policies
CREATE POLICY "Users can manage learning path of own projects" ON learning_path_items FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = learning_path_items.project_id AND projects.user_id = auth.uid())
);

-- Sessions policies
CREATE POLICY "Users can manage sessions of own projects" ON sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = sessions.project_id AND projects.user_id = auth.uid())
);

-- Session atoms policies
CREATE POLICY "Users can manage session atoms of own projects" ON session_atoms FOR ALL USING (
  EXISTS (
    SELECT 1 FROM sessions 
    JOIN projects ON projects.id = sessions.project_id 
    WHERE sessions.id = session_atoms.session_id AND projects.user_id = auth.uid()
  )
);

-- Functions to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_atoms_updated_at BEFORE UPDATE ON atoms FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Views for easier querying
CREATE VIEW project_details AS
SELECT 
  p.*,
  COALESCE(atom_count.count, 0) as atom_count,
  COALESCE(session_count.count, 0) as session_count,
  COALESCE(source_count.count, 0) as source_count,
  profiles.name as user_name
FROM projects p
LEFT JOIN (SELECT project_id, COUNT(*) as count FROM atoms GROUP BY project_id) atom_count ON p.id = atom_count.project_id  
LEFT JOIN (SELECT project_id, COUNT(*) as count FROM sessions GROUP BY project_id) session_count ON p.id = session_count.project_id
LEFT JOIN (SELECT project_id, COUNT(*) as count FROM sources GROUP BY project_id) source_count ON p.id = source_count.project_id
LEFT JOIN profiles ON p.user_id = profiles.id;