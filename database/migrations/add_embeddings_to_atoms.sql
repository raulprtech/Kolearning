-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to atoms table (Gemini embeddings are 768 dimensions)
ALTER TABLE public.atoms ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create a vector index for performance
CREATE INDEX IF NOT EXISTS atoms_embedding_idx ON public.atoms 
USING hnsw (embedding vector_cosine_ops);

-- Create a function for the AI to perform similarity searches
CREATE OR REPLACE FUNCTION match_atoms (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  user_id_param uuid
)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  question text,
  answer text,
  similarity float,
  project_title text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.project_id,
    a.question,
    a.answer,
    1 - (a.embedding <=> query_embedding) AS similarity,
    p.title as project_title
  FROM atoms a
  JOIN projects p ON a.project_id = p.id
  WHERE p.user_id = user_id_param
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
