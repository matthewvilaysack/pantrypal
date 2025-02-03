/**
 * These types indicate the shape of the data you expect to receive from your
 * API endpoint, assuming it's a JSON object like we have.
 */
export interface EpisodeItem {
  title: string
  pubDate: string
  link: string
  guid: string
  author: string
  thumbnail: string
  description: string
  content: string
  enclosure: {
    link: string
    type: string
    length: number
    duration: number
    rating: { scheme: string; value: string }
  }
  categories: string[]
}

export interface ApiFeedResponse {
  status: string
  feed: {
    url: string
    title: string
    link: string
    author: string
    description: string
    image: string
  }
  items: EpisodeItem[]
}

/**
 * The options used to configure apisauce.
 */
export interface ApiConfig {
  /**
   * The URL of the api.
   */
  url: string

  /**
   * Milliseconds before we timeout the request.
   */
  timeout: number
}

export interface ApiResponse<T> {
  kind: "ok" | "bad-data" | "unauthorized" | "forbidden" | "not-found" | "server" | "connection" | "timeout" | "cancel" | "unknown"
  data?: T
  message?: string
}

export interface Group {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface GroupMembership {
  id: string
  group_id: string
  user_id: string
  joined_at: string
}

export interface GroupPreferences {
  group_id: string
  group_name: string
  user_ids: string[]
  aggregated_allergies: string[]
  aggregated_foods_to_avoid: string[]
}

export interface UserPreferences {
  id?: string
  user_id: string
  first_name: string
  last_name: string
  age: number
  location: string | {
    lat: number
    lng: number
  }
  family_size: {
    adults: number
    teenagers: number
    children: number
    infants: number
  }
  allergies: string[]
  foods_to_avoid: string[]
  onboarding_completed: boolean
  created_at?: string
  updated_at?: string
}
