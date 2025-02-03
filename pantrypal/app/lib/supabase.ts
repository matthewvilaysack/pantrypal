import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tjltbquyxwntjbetzzyi.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbHRicXV5eHdudGpiZXR6enlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MjU4NTAsImV4cCI6MjA1MjMwMTg1MH0.TS-i52qiWtuYxUhiB-b2A2_QbNcnWZX-kTV_Mgr6Jb4"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})