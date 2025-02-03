import { supabase } from "../auth/supabase"

export interface Ingredient {
  product_id: string
  name: string
  category: string
  nutrition: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  } | null
  description: string | null
  image_url: string | null
  quantity: number
}

export const ingredientsApi = {
  async getIngredients(options?: {
    category?: string | null
    search?: string
    limit?: number
    offset?: number
  }) {
    let query = supabase.from("ingredients").select("*")

    if (options?.category) {
      query = query.eq("category", options.category)
    }

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit || 20) - 1)
    }

    return query
  },

  async getIngredientById(id: string) {
    return supabase
      .from("ingredients")
      .select("*")
      .eq("product_id", id)
      .single()
  },
} 