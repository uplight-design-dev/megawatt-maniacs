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
      games: {
        Row: {
          id: string
          title: string
          description: string | null
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          created_at?: string
          is_active?: boolean
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          id: string
          user_id: string
          game_id: string
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          score?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          score?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      question_bank: {
        Row: {
          id: string
          Category: string
          Question: string
          A: string
          B: string
          C: string
          "Correct Answer": string
          "Source (Include a url)": string | null
          created_at: string
        }
        Insert: {
          id?: string
          Category: string
          Question: string
          A: string
          B: string
          C: string
          "Correct Answer": string
          "Source (Include a url)"?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          Category?: string
          Question?: string
          A?: string
          B?: string
          C?: string
          "Correct Answer"?: string
          "Source (Include a url)"?: string | null
          created_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          game_id: string
          round_id: string | null
          question_text: string
          answer_a: string
          answer_b: string
          answer_c: string
          answer_d: string
          correct_answer: string
          explanation: string | null
          question_type: string
          question_image_url: string | null
          image_caption: string | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          round_id?: string | null
          question_text: string
          answer_a: string
          answer_b: string
          answer_c: string
          answer_d: string
          correct_answer: string
          explanation?: string | null
          question_type?: string
          question_image_url?: string | null
          image_caption?: string | null
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          round_id?: string | null
          question_text?: string
          answer_a?: string
          answer_b?: string
          answer_c?: string
          answer_d?: string
          correct_answer?: string
          explanation?: string | null
          question_type?: string
          question_image_url?: string | null
          image_caption?: string | null
          category?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          }
        ]
      }
      rounds: {
        Row: {
          id: string
          game_id: string
          title: string
          round_number: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          title: string
          round_number: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          title?: string
          round_number?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          total_score: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          total_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          total_score?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
