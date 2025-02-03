export interface ConfigBaseType {
  API_URL: string
  persistNavigation: "always" | "dev" | "prod" | "never"
  catchErrors: "always" | "dev" | "prod" | "never"
  exitRoutes: string[]
  supabaseUrl: string
  supabaseAnonKey: string
  MAPBOX_TOKEN: string
  GOOGLE_PLACES_API_KEY: string
}

export type PersistNavigationConfig = ConfigBaseType["persistNavigation"]

// Debug logging
console.log('Environment variables:', {
  MAPBOX_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
  GOOGLE_PLACES_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
})

const BaseConfig: ConfigBaseType = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || "https://api.pantrypal.com",
  // This feature is particularly useful in development mode, but
  // can be used in production as well if you prefer.
  persistNavigation: "dev",

  /**
   * Only enable if we're catching errors in the right environment
   */
  catchErrors: "always",

  /**
   * This is a list of all the route names that will exit the app if the back button
   * is pressed while in that screen. Only affects Android.
   */
  exitRoutes: ["welcome"],
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  MAPBOX_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string,
  GOOGLE_PLACES_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY as string,
}

// Debug logging
console.log('Config loaded:', {
  MAPBOX_TOKEN: BaseConfig.MAPBOX_TOKEN ? '[PRESENT]' : '[MISSING]',
  GOOGLE_PLACES_API_KEY: BaseConfig.GOOGLE_PLACES_API_KEY ? '[PRESENT]' : '[MISSING]'
})

export default BaseConfig
