export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          profession: string | null
          company: string | null
          age: string | null
          additional_info: string | null
          total_mastery_points: number
          global_cognitive_credits: number
          daily_streak: number
          last_session_date: string | null
          learner_rank: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          profession?: string | null
          company?: string | null
          age?: string | null
          additional_info?: string | null
          total_mastery_points?: number
          global_cognitive_credits?: number
          daily_streak?: number
          last_session_date?: string | null
          learner_rank?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          profession?: string | null
          company?: string | null
          age?: string | null
          additional_info?: string | null
          total_mastery_points?: number
          global_cognitive_credits?: number
          daily_streak?: number
          last_session_date?: string | null
          learner_rank?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          mastery: number
          icon: string
          categories: string[]
          best_streak: number
          total_answers: number
          correct_answers: number
          is_public: boolean
          is_archived: boolean
          is_completed: boolean
          full_learning_plan_markdown: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          mastery?: number
          icon?: string
          categories?: string[]
          best_streak?: number
          total_answers?: number
          correct_answers?: number
          is_public?: boolean
          is_archived?: boolean
          is_completed?: boolean
          full_learning_plan_markdown?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          mastery?: number
          icon?: string
          categories?: string[]
          best_streak?: number
          total_answers?: number
          correct_answers?: number
          is_public?: boolean
          is_archived?: boolean
          is_completed?: boolean
          full_learning_plan_markdown?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sources: {
        Row: {
          id: string
          project_id: string
          name: string
          type: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          type: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          type?: string
          content?: string
          created_at?: string
        }
      }
      atoms: {
        Row: {
          id: string
          project_id: string
          question: string
          answer: string
          difficulty: number
          stability: number
          last_reviewed: string | null
          retrievability: number | null
          incorrect_answers: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          question: string
          answer: string
          difficulty?: number
          stability?: number
          last_reviewed?: string | null
          retrievability?: number | null
          incorrect_answers?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          question?: string
          answer?: string
          difficulty?: number
          stability?: number
          last_reviewed?: string | null
          retrievability?: number | null
          incorrect_answers?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      learning_path_items: {
        Row: {
          id: string
          project_id: string
          session_number: number
          topic: string
          session_type: string
          questions: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          session_number: number
          topic: string
          session_type: string
          questions: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          session_number?: number
          topic?: string
          session_type?: string
          questions?: string
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          project_id: string
          session_number: number
          type: string
          questions: string | null
          duration: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          session_number: number
          type: string
          questions?: string | null
          duration?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          session_number?: number
          type?: string
          questions?: string | null
          duration?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      session_atoms: {
        Row: {
          id: string
          session_id: string
          atom_id: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          atom_id: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          atom_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      project_details: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          mastery: number
          icon: string
          categories: string[]
          best_streak: number
          total_answers: number
          correct_answers: number
          is_public: boolean
          is_archived: boolean
          is_completed: boolean
          full_learning_plan_markdown: string | null
          created_at: string
          updated_at: string
          atom_count: number
          session_count: number
          source_count: number
          user_name: string
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}