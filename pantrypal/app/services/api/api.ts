/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://docs.infinite.red/ignite-cli/boilerplate/app/services/#backend-api-integration)
 * documentation for more details.
 */
import {
  ApiResponse, 
  ApisauceInstance,
  create,
} from "apisauce"
import Config from "../../config"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem" 
import type {
  ApiConfig,
  ApiFeedResponse,
  UserPreferences,
  Group,
  GroupMembership,
  GroupPreferences
} from "./api.types"
import type { EpisodeSnapshotIn } from "../../models/Episode" 
import { supabase } from "../auth/supabase"

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  
  /**
   * Gets a list of recent React Native Radio episodes.
   */
  async getEpisodes(): Promise<{ kind: "ok"; episodes: EpisodeSnapshotIn[] } | GeneralApiProblem> {
    // make the api call
    const response: ApiResponse<ApiFeedResponse> = await this.apisauce.get(
      `api.json?rss_url=https%3A%2F%2Ffeeds.simplecast.com%2FhEI_f9Dx`,
    )

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const rawData = response.data

      // This is where we transform the data into the shape we expect for our MST model.
      const episodes: EpisodeSnapshotIn[] =
        rawData?.items.map((raw) => ({
          ...raw,
        })) ?? []

      return { kind: "ok", episodes }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }
  
  async getUserPreferences(userId: string): Promise<{ kind: "ok" | "bad-data", data?: UserPreferences }> {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error) throw error

      return { kind: "ok", data }
    } catch (error) {
      return { kind: "bad-data" }
    }
  }

  async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<{ kind: "ok" | "bad-data", data?: UserPreferences, error?: string }> {
    try {
      console.log("Making Supabase request with:", JSON.stringify(preferences, null, 2))
      
      // First check if a record exists
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", preferences.user_id)
        .single()

      let result
      if (existing) {
        // Update existing record
        result = await supabase
          .from("user_preferences")
          .update(preferences)
          .eq("user_id", preferences.user_id)
          .select()
          .single()
      } else {
        // Insert new record
        result = await supabase
          .from("user_preferences")
          .insert(preferences)
          .select()
          .single()
      }

      const { data, error } = result
      if (error) {
        console.error("Supabase error:", error)
        return { kind: "bad-data", error: error.message }
      }

      return { kind: "ok", data }
    } catch (error) {
      console.error("Error in saveUserPreferences:", error)
      return { kind: "bad-data", error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  /**
   * Creates a new group and automatically adds the creator as a member.
   * @param name The name of the group
   * @param userId The ID of the user creating the group
   * @returns The created group and membership details
   */
  async createGroupWithMembership(name: string, userId: string): Promise<{ kind: "ok" | "bad-data", data?: { group: Group, membership: GroupMembership }, error?: string }> {
    try {
      console.log("Creating group with name:", name, "for user:", userId)
      
      // First ensure user exists in user_preferences
      const { data: userPrefs, error: userError } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (userError) {
        // Create user preferences if they don't exist
        const { error: createError } = await supabase
          .from("user_preferences")
          .insert({ 
            user_id: userId,
            first_name: "Temp",  // Temporary name, will be updated during onboarding
            last_name: "User",   // Temporary name, will be updated during onboarding
            age: 0,              // Will be updated during onboarding
            location: "",        // Will be updated during onboarding
            family_size: {       // Will be updated during onboarding
              adults: 0,
              teenagers: 0,
              children: 0,
              infants: 0
            },
            allergies: [],
            foods_to_avoid: [],
            onboarding_completed: false
          })

        if (createError) {
          console.error("Error creating user preferences:", createError)
          return { kind: "bad-data", error: "Failed to create user profile" }
        }
      }

      // Start a Supabase transaction
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({ name })
        .select()
        .single()

      if (groupError) {
        console.error("Error creating group:", groupError)
        return { kind: "bad-data", error: groupError.message }
      }

      console.log("Group created successfully:", group)

      // Add creator to the group
      const { data: membership, error: membershipError } = await supabase
        .from("group_membership")
        .insert({ group_id: group.id, user_id: userId })
        .select()
        .single()

      if (membershipError) {
        console.error("Error adding user to group:", membershipError)
        return { kind: "bad-data", error: membershipError.message }
      }

      console.log("Membership created successfully:", membership)
      return { kind: "ok", data: { group, membership } }
    } catch (error) {
      console.error("Error in createGroupWithMembership:", error)
      return { kind: "bad-data", error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  /**
   * Attempts to join a user to a group. Checks for existing membership first.
   * @param groupId The ID of the group to join
   * @param userId The ID of the user joining
   * @returns The group and membership details if successful
   */
  async joinGroupWithValidation(groupId: string, userId: string): Promise<{ kind: "ok" | "bad-data", data?: { group: Group, membership: GroupMembership }, error?: string }> {
    try {
      console.log("Attempting to join group:", groupId, "for user:", userId)
      
      // First ensure user exists in user_preferences
      const { data: userPrefs, error: userError } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (userError) {
        // Create user preferences if they don't exist
        const { error: createError } = await supabase
          .from("user_preferences")
          .insert({ 
            user_id: userId,
            first_name: "Temp",  // Temporary name, will be updated during onboarding
            last_name: "User",   // Temporary name, will be updated during onboarding
            age: 0,              // Will be updated during onboarding
            location: "",        // Will be updated during onboarding
            family_size: {       // Will be updated during onboarding
              adults: 0,
              teenagers: 0,
              children: 0,
              infants: 0
            },
            allergies: [],
            foods_to_avoid: [],
            onboarding_completed: false
          })

        if (createError) {
          console.error("Error creating user preferences:", createError)
          return { kind: "bad-data", error: "Failed to create user profile" }
        }
      }

      // First check if the group exists
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single()

      if (groupError) {
        console.error("Group not found:", groupError)
        return { kind: "bad-data", error: "Group not found" }
      }

      console.log("Found group:", group)

      // Check if user is already in any group
      const { data: existingMemberships, error: membershipError } = await supabase
        .from("group_membership")
        .select("*")
        .eq("user_id", userId)

      if (membershipError) {
        console.error("Error checking existing memberships:", membershipError)
        return { kind: "bad-data", error: membershipError.message }
      }

      console.log("Existing memberships:", existingMemberships)

      if (existingMemberships && existingMemberships.length > 0) {
        console.log("User already in a group")
        return { kind: "bad-data", error: "User is already a member of a group" }
      }

      // Add user to group
      const { data: membership, error: joinError } = await supabase
        .from("group_membership")
        .insert({ group_id: groupId, user_id: userId })
        .select()
        .single()

      if (joinError) {
        console.error("Error joining group:", joinError)
        return { kind: "bad-data", error: joinError.message }
      }

      console.log("Successfully joined group. Membership:", membership)
      return { kind: "ok", data: { group, membership } }
    } catch (error) {
      console.error("Error in joinGroupWithValidation:", error)
      return { kind: "bad-data", error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  /**
   * Gets all groups that a user is a member of, with full group details.
   * @param userId The ID of the user
   * @returns Array of groups the user is a member of
   */
  async getUserGroups(userId: string): Promise<{ kind: "ok" | "bad-data", data?: Group[], error?: string }> {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          group_membership!inner(*)
        `)
        .eq("group_membership.user_id", userId)

      if (error) {
        console.error("Error fetching user groups:", error)
        throw error
      }

      return { kind: "ok", data }
    } catch (error) {
      console.error("Error in getUserGroups:", error)
      return { kind: "bad-data", error: "Failed to fetch user groups" }
    }
  }

  async getGroupPreferences(groupId: string): Promise<{ kind: "ok" | "bad-data", data?: GroupPreferences }> {
    try {
      const { data, error } = await supabase
        .from("group_preferences")
        .select("*")
        .eq("group_id", groupId)
        .single()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      return { kind: "ok", data }
    } catch (error) {
      console.error("Error in getGroupPreferences:", error)
      return { kind: "bad-data" }
    }
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
