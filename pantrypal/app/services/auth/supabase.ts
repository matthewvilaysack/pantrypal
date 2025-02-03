import { createClient } from "@supabase/supabase-js"
import * as SessionStorage from "app/utils/storage/SessionStorage"
import { AppState } from "react-native"

// Get these from your Supabase project settings -> API
const supabaseUrl = "https://tjltbquyxwntjbetzzyi.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbHRicXV5eHdudGpiZXR6enlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MjU4NTAsImV4cCI6MjA1MjMwMTg1MH0.TS-i52qiWtuYxUhiB-b2A2_QbNcnWZX-kTV_Mgr6Jb4"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SessionStorage,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export { type Session, type AuthError } from "@supabase/supabase-js"

/**
 * Tells Supabase to autorefresh the session while the application
 * is in the foreground.
 */
AppState.addEventListener("change", (nextAppState) => {
  if (nextAppState === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})