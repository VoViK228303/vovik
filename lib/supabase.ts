
import { createClient } from '@supabase/supabase-js';

// Эти переменные должны быть установлены в настройках Vercel (Settings -> Environment Variables)
// Мы используем заглушки, чтобы предотвратить ошибку "supabaseUrl is required" при первом запуске
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
