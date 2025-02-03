import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"

export const GroceryItemModel = types
  .model("GroceryItem")
  .props({
    id: types.identifier,
    user_id: types.string,
    product_id: types.string,
    name: types.string,
    category: types.string,
    quantity: types.string,
    description: types.maybeNull(types.string),
    nutrition: types.maybeNull(types.model({
      calories: types.number,
      protein_g: types.number,
      carbs_g: types.number,
      fat_g: types.number,
    })),
    image_url: types.maybeNull(types.string),
  })
  .actions((self) => ({
    setQuantity(quantity: string) {
      self.quantity = quantity
    }
  }))

export const GroceryListStoreModel = types
  .model("GroceryListStore")
  .props({
    items: types.array(GroceryItemModel),
    isLoading: types.optional(types.boolean, false),
  })
  .actions(withSetPropAction)
  .actions((self) => {
    // Helper function to format data
    const formatItemData = (data: any) => ({
      ...data,
      quantity: String(data.quantity || "1"),
      nutrition: data.nutrition ? {
        calories: Number(data.nutrition.calories || 0),
        protein_g: Number(data.nutrition.protein_g || 0),
        carbs_g: Number(data.nutrition.carbs_g || 0),
        fat_g: Number(data.nutrition.fat_g || 0),
      } : null
    })

    const findItemById = (itemId: string) => {
      return self.items.find(item => item.id === itemId)
    }

    const findItemByProductId = (productId: string, userId: string) => {
      return self.items.find(item => item.product_id === productId && item.user_id === userId)
    }

    return {
      findItemById,
      findItemByProductId,

      async removeFromGroceryList(itemId: string) {
        try {
          const item = findItemById(itemId)
          if (!item) return

          const { error } = await supabase
            .from("user_ingredients")
            .delete()
            .eq("id", itemId)
            .eq("user_id", item.user_id)

          if (error) throw error
          self.setProp("items", self.items.filter(i => i.id !== itemId))
        } catch (error) {
          console.error("Error removing from grocery list:", error)
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
            await this.removeFromGroceryList(itemId)
            return
          }

          // Update in database with proper user context
          const { data, error } = await supabase
            .from("user_ingredients")
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
          throw error
        }
      },

      async loadGroceryList(userId: string) {
        self.setProp("isLoading", true)
        try {
          console.log("Loading grocery list for user:", userId)
          const { data, error } = await supabase
            .from("user_ingredients")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })

          if (error) throw error
          console.log("Loaded grocery list:", data)
          
          // Format the data to match the expected types
          const formattedData = (data || []).map(formatItemData)
          
          self.setProp("items", formattedData)
        } catch (error) {
          console.error("Error loading grocery list:", error)
        } finally {
          self.setProp("isLoading", false)
        }
      },

      async addToGroceryList(item: Omit<SnapshotIn<typeof GroceryItemModel>, "id">) {
        try {
          console.log("Adding item to grocery list:", item)
          
          // Check if item already exists in the list for this user
          const existingItem = findItemByProductId(item.product_id, item.user_id)
          
          if (existingItem) {
            // Update quantity of existing item
            const newQuantity = String(Number(existingItem.quantity) + Number(item.quantity))
            await this.updateItemQuantity(existingItem.id, newQuantity)
          } else {
            // Insert new item
            const { data, error } = await supabase
              .from("user_ingredients")
              .insert([{
                user_id: item.user_id,
                product_id: item.product_id,
                name: item.name,
                category: item.category,
                quantity: String(item.quantity),
                description: item.description || null,
                nutrition: item.nutrition || null,
                image_url: item.image_url || null,
              }])
              .select()
              .single()

            if (error) throw error
            console.log("Added new item to grocery list:", data)
            
            if (data) {
              // Add new item to the store using setProp
              self.setProp("items", [...self.items, formatItemData(data)])
            }
          }
        } catch (error) {
          console.error("Error adding to grocery list:", error)
        }
      },
    }
  })
  .views((self) => ({
    get groceryList() {
      return self.items
    },

    getItemByProductId(productId: string) {
      return self.items.find(item => item.product_id === productId)
    },
  }))

export interface GroceryItem extends Instance<typeof GroceryItemModel> {}
export interface GroceryListStore extends Instance<typeof GroceryListStoreModel> {}
export interface GroceryListStoreSnapshot extends SnapshotOut<typeof GroceryListStoreModel> {}

export const createGroceryListStoreDefaultModel = () =>
  types.optional(GroceryListStoreModel, {
    items: [],
    isLoading: false,
  }) 