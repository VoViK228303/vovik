
import { createClient } from '@supabase/supabase-js';

// Используем переменные окружения. Если их нет, ставим пустые строки, 
// чтобы приложение не падало, но мы могли показать предупреждение в UI.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Проверка: является ли URL валидным (не заглушкой)
export const isSupabaseConfigured = supabaseUrl !== '' && !supabaseUrl.includes('your-project');

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co', 
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder'
);
