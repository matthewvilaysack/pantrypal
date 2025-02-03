import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { supabase } from "@/services/auth/supabase"
import { withSetPropAction } from "./helpers/withSetPropAction"

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  name: string
  category: string
  quantity: string
  description?: string
  nutrition?: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }
  image_url?: string
}

export const WishlistItemModel = types
  .model("WishlistItem")
  .props({
    id: types.identifier,
    user_id: types.string,
    product_id: types.string,
    name: types.string,
    category: types.string,
    quantity: types.string,
    description: types.maybe(types.string),
    nutrition: types.maybe(types.model({
      calories: types.number,
      protein_g: types.number,
      carbs_g: types.number,
      fat_g: types.number
    })),
    image_url: types.maybe(types.string)
  })
  .actions((self) => ({
    setQuantity(quantity: string) {
      self.quantity = quantity
    }
  }))

export const WishlistStoreModel = types
  .model("WishlistStore")
  .props({
    items: types.array(WishlistItemModel),
    isLoading: types.optional(types.boolean, false)
  })
  .actions(withSetPropAction)
  .actions((store) => {
    const findItemById = (itemId: string) => {
      return store.items.find(item => item.id === itemId)
    }

    const findItemByProductId = (productId: string, userId: string) => {
      return store.items.find(item => item.product_id === productId && item.user_id === userId)
    }

    const formatItemData = (data: any) => ({
      ...data,
      quantity: String(data.quantity || "1"),
      nutrition: data.nutrition ? {
        calories: Number(data.nutrition.calories || 0),
        protein_g: Number(data.nutrition.protein_g || 0),
        carbs_g: Number(data.nutrition.carbs_g || 0),
        fat_g: Number(data.nutrition.fat_g || 0)
      } : undefined
    })

    return {
      findItemById,
      findItemByProductId,

      async loadWishlist(userId: string) {
        try {
          store.setProp("isLoading", true)
          const { data, error } = await supabase
            .from("user_wishlist")
            .select(`
              *,
              ingredients:product_id(*)
            `)
            .eq("user_id", userId)

          if (error) {
            console.error("Error loading wishlist:", error)
            return
          }

          // Format the data to match our model
          const formattedItems = (data || []).map(item => ({
            id: item.id,
            user_id: item.user_id,
            product_id: item.product_id,
            name: item.ingredients?.name || "",
            category: item.ingredients?.category || "",
            quantity: String(item.quantity || "1"),
            description: item.ingredients?.description || undefined,
            nutrition: item.ingredients?.nutrition ? {
              calories: Number(item.ingredients.nutrition.calories || 0),
              protein_g: Number(item.ingredients.nutrition.protein_g || 0),
              carbs_g: Number(item.ingredients.nutrition.carbs_g || 0),
              fat_g: Number(item.ingredients.nutrition.fat_g || 0)
            } : undefined,
            image_url: item.ingredients?.image_url || undefined
          }))

          store.setProp("items", formattedItems)
        } catch (error) {
          console.error("Error in loadWishlist:", error)
        } finally {
          store.setProp("isLoading", false)
        }
      },

      async addToWishlist(item: Partial<WishlistItem>) {
        try {
          // Check if item already exists
          const existingItem = findItemByProductId(item.product_id!, item.user_id!)
          
          if (existingItem) {
            // Update quantity of existing item
            const newQuantity = String(Number(existingItem.quantity) + 1)
            await this.updateItemQuantity(existingItem.id, newQuantity)
          } else {
            // Insert new item with all required fields
            const { data, error } = await supabase
              .from("user_wishlist")
              .insert([{
                user_id: item.user_id!,
                product_id: item.product_id!,
                name: item.name!,
                category: item.category!,
                quantity: "1",
                description: item.description || null,
                nutrition: item.nutrition || null,
                image_url: item.image_url || null
              }])
              .select()
              .single()

            if (error) {
              console.error("Error adding to wishlist:", error)
              return
            }

            if (data) {
              await this.loadWishlist(item.user_id!)
            }
          }
        } catch (error) {
          console.error("Error in addToWishlist:", error)
        }
      },

      async removeFromWishlist(itemId: string) {
        try {
          const item = findItemById(itemId)
          if (!item) return

          const { error } = await supabase
            .from("user_wishlist")
            .delete()
            .eq("id", itemId)
            .eq("user_id", item.user_id)

          if (error) throw error
          store.setProp("items", store.items.filter(i => i.id !== itemId))
        } catch (error) {
          console.error("Error in removeFromWishlist:", error)
        }
      },

      async updateItemQuantity(itemId: string, newQuantity: string) {
        try {
          const item = findItemById(itemId)
          if (!item) {
            console.error("Item not found")
            return
          }

          // Convert quantity to number for validation
          const numericQuantity = parseInt(newQuantity)
          if (numericQuantity <= 0) {
            // If quantity is 0 or negative, remove the item
            await this.removeFromWishlist(itemId)
            return
          }

          // Update in database
          const { data, error } = await supabase
            .from("user_wishlist")
            .update({ quantity: String(numericQuantity) })
            .eq("id", itemId)
            .eq("user_id", item.user_id)
            .select()
            .single()

          if (error) throw error

          // Update local state if database update was successful
          if (data) {
            item.setQuantity(String(numericQuantity))
          }
        } catch (error) {
          console.error("Error updating quantity:", error)
        }
      }
    }
  })
  .views((store) => ({
    get wishlist() {
      return store.items
    }
  }))

export interface WishlistStore extends Instance<typeof WishlistStoreModel> {}
export interface WishlistStoreSnapshot extends SnapshotOut<typeof WishlistStoreModel> {} 