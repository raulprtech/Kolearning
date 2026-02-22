-- Migration for Paper Box feature
CREATE TABLE IF NOT EXISTS public.papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL DEFAULT '{}',
  year INTEGER,
  doi TEXT,
  journal_conference TEXT,
  url TEXT,
  pdf_status TEXT NOT NULL DEFAULT 'not_available' CHECK (pdf_status IN ('available', 'pending', 'not_available')),
  import_source TEXT NOT NULL DEFAULT 'manual' CHECK (import_source IN ('ArXiv', 'BibTeX', 'DOI', 'manual')),
  status TEXT NOT NULL DEFAULT 'in_box' CHECK (status IN ('in_box', 'assigned', 'processing', 'ready')),
  processing_percentage INTEGER NOT NULL DEFAULT 0,
  field_of_knowledge TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced')),
  paper_type TEXT CHECK (paper_type IN ('survey', 'experimental', 'theoretical', 'review')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  reading_status TEXT NOT NULL DEFAULT 'unread' CHECK (reading_status IN ('unread', 'in_progress', 'read')),
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own papers" ON public.papers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own papers" ON public.papers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own papers" ON public.papers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own papers" ON public.papers
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS papers_user_id_idx ON public.papers(user_id);
CREATE INDEX IF NOT EXISTS papers_project_id_idx ON public.papers(project_id);
CREATE INDEX IF NOT EXISTS papers_status_idx ON public.papers(status);
