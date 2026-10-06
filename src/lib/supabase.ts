import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Course = {
  id: string;
  title: string;
  description: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  content: string;
  position: number;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Equation = {
  id: string;
  lesson_id: string | null;
  course_id: string | null;
  title: string;
  latex: string;
  description: string;
  user_id: string;
  created_at: string;
};

export type GraphConfig = {
  functions: { expression: string; color: string; label: string }[];
  xRange: [number, number];
  yRange: [number, number];
  title: string;
  showGrid: boolean;
};

export type Graph = {
  id: string;
  lesson_id: string | null;
  course_id: string | null;
  title: string;
  config: GraphConfig;
  user_id: string;
  created_at: string;
};

export type Journal = {
  id: string;
  title: string;
  content: string;
  course_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  role: string;
  created_at: string;
  updated_at: string;
};
