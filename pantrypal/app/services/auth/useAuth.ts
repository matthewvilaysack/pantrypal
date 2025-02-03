import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
  useEffect,
} from "react"
import { Session, supabase } from "./supabase"
import { AuthResponse, AuthTokenResponsePassword, User } from "@supabase/supabase-js"
import { useStores } from "../../models"
import { Api } from "../api"
import type { UserPreferences } from "../api/api.types"

export interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  isOnboarded: boolean
  signIn: (email: string, password: string) => Promise<AuthTokenResponsePassword>
  signUp: (email: string, password: string) => Promise<AuthResponse>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isOnboarded: false,
  signIn: async () => { throw new Error("Not implemented") },
  signUp: async () => { throw new Error("Not implemented") },
  signOut: async () => { throw new Error("Not implemented") },
})

export function useAuth() {
  const { userPreferencesStore } = useStores()
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return {
    ...context,
    isOnboarded: userPreferencesStore.onboardingCompleted,
  }
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const { userPreferencesStore } = useStores()
  const api = new Api()

  useEffect(() => {
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          // Load user preferences
          const response = await api.getUserPreferences(session.user.id)
          if (response.data) {
            userPreferencesStore.setProp("onboardingCompleted", response.data.onboarding_completed)
          }
        }
      } catch (error) {
        console.error('Error checking auth session:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_OUT') {
        userPreferencesStore.resetOnboarding()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (result.data?.user) {
        setUser(result.data.user)
        // Load user preferences
        const response = await api.getUserPreferences(result.data.user.id)
        if (response.data) {
          userPreferencesStore.setProp("onboardingCompleted", response.data.onboarding_completed)
        }
      }
      return result
    },
    [userPreferencesStore]
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      const result = await supabase.auth.signUp({
        email,
        password,
      })
      if (result.data?.user) {
        setUser(result.data.user)
        // Initialize user preferences for new users
        userPreferencesStore.setProp("groupType", "create")
        userPreferencesStore.setProp("groupName", "")
        userPreferencesStore.setProp("location", "")
        userPreferencesStore.setProp("name", { first: "", last: "" })
        userPreferencesStore.setProp("familySize", {
          adults: 0,
          teenagers: 0,
          children: 0,
          infants: 0
        })
        userPreferencesStore.setProp("age", 0)
        userPreferencesStore.setProp("allergies", [])
        userPreferencesStore.setProp("foodsToAvoid", [])
        userPreferencesStore.setProp("onboardingCompleted", false)
        // Save to Supabase
        await api.saveUserPreferences({
          user_id: result.data.user.id,
          first_name: userPreferencesStore.name.first,
          last_name: userPreferencesStore.name.last,
          age: userPreferencesStore.age,
          location: userPreferencesStore.location,
          family_size: {
            adults: userPreferencesStore.familySize.adults,
            teenagers: userPreferencesStore.familySize.teenagers,
            children: userPreferencesStore.familySize.children,
            infants: userPreferencesStore.familySize.infants
          },
          allergies: Array.from(userPreferencesStore.allergies),
          foods_to_avoid: Array.from(userPreferencesStore.foodsToAvoid),
          onboarding_completed: false
        })
      }
      return result
    },
    [userPreferencesStore]
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    userPreferencesStore.resetOnboarding()
  }, [userPreferencesStore])

  // Don't render until we've checked for a session
  if (!isInitialized) {
    return null
  }

  const value = {
    isAuthenticated: !!user,
    user,
    isOnboarded: userPreferencesStore.onboardingCompleted,
    signIn,
    signUp,
    signOut,
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}