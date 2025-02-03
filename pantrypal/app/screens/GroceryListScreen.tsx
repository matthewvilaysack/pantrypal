import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { FlatList, View, ViewStyle, ActivityIndicator, TextStyle, ImageStyle, Pressable, Alert } from "react-native"
import { Button, Screen, Text, AutoImage, CategoryTag, Card } from "@/components"
import { useStores } from "@/models"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import { supabase } from "@/services/auth/supabase"
import { colors, spacing } from "@/theme"
import { Icon } from "@/components/Icon"
import { GroceryItem } from "@/models/GroceryListStore"
import { WishlistItem } from "@/models/WishlistStore"
import { FoodListItem } from "@/components/FoodListItem"
import { MapsApi } from "@/services/api/maps-api"
import { Api } from "@/services/api"

type ListType = "grocery" | "wishlist"

type GroceryListScreenProps = MainTabScreenProps<"GroceryList"> | MainTabScreenProps<"Wishlist">

export const GroceryListScreen = observer(function GroceryListScreen(props: GroceryListScreenProps) {
  const { navigation, route } = props
  const { groceryListStore, wishlistStore } = useStores()
  const [isLoading, setIsLoading] = useState(false)
  const [activeList, setActiveList] = useState<ListType>(
    route.params?.initialView || "grocery"
  )
  const mapsApi = new MapsApi(new Api())

  useEffect(() => {
    if (route.params?.initialView) {
      setActiveList(route.params.initialView)
    }
  }, [route.params])

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        console.log("No authenticated user found")
        return
      }
      
      setIsLoading(true)
      await Promise.all([
        groceryListStore.loadGroceryList(session.user.id),
        wishlistStore.loadWishlist(session.user.id)
      ])
    } catch (error) {
      console.error("Error loading lists:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (activeList === "grocery") {
      await groceryListStore.removeFromGroceryList(itemId)
    } else {
      await wishlistStore.removeFromWishlist(itemId)
    }
    await loadLists()
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: string) => {
    try {
      if (parseInt(newQuantity) <= 0) {
        await handleRemoveItem(itemId)
        return
      }

      if (activeList === "grocery") {
        await groceryListStore.updateItemQuantity(itemId, newQuantity)
      } else {
        await wishlistStore.updateItemQuantity(itemId, newQuantity)
      }
      await loadLists()
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
  }

  const moveToGroceryList = async (item: WishlistItem) => {
    try {
      await groceryListStore.addToGroceryList({
        ...item,
        user_id: item.user_id,
        product_id: item.product_id,
      })
      await wishlistStore.removeFromWishlist(item.id)
      await loadLists()
    } catch (error) {
      console.error("Error moving item to grocery list:", error)
    }
  }

  const renderItem = ({ item }: { item: GroceryItem | WishlistItem }) => (
    <FoodListItem
      imageUrl={item.image_url || undefined}
      name={item.name}
      quantity={item.quantity}
      onUpdateQuantity={(newQuantity) => handleUpdateQuantity(item.id, newQuantity)}
      onRemove={() => handleRemoveItem(item.id)}
      familyMembers={[]}
      style={$itemCard}
    />
  )

  const navigateToSchedulePickup = async () => {
    try {
      const preferredLocation = await mapsApi.getUserPreferredLocation()
      if (!preferredLocation || preferredLocation.error) {
        Alert.alert("Error", "Please set your preferred location in settings")
        return
      }

      const { foodBanks, error } = await mapsApi.searchNearbyFoodBanks(
        preferredLocation.lat,
        preferredLocation.lng
      )

      if (error || !foodBanks.length) {
        Alert.alert("Error", "No food banks found near your location")
        return
      }

      const nearestFoodBank = foodBanks[0]
      navigation.navigate("HomeStack", {
        screen: "SchedulePickup",
        params: {
          foodBankId: nearestFoodBank.place_id,
          foodBank: {
            place_id: nearestFoodBank.place_id,
            name: nearestFoodBank.name,
            vicinity: nearestFoodBank.vicinity,
            geometry: nearestFoodBank.geometry,
            available_times: nearestFoodBank.available_times || []
          }
        }
      })
    } catch (error) {
      console.error("Error navigating to schedule pickup:", error)
      Alert.alert("Error", "Unable to find nearby food banks. Please try again.")
    }
  }

  const navigateToHome = () => {
    navigation.navigate("HomeStack", {
      screen: "Home"
    })
  }

  const currentItems = activeList === "grocery" ? groceryListStore.items : wishlistStore.items

  return (
    <Screen preset="scroll" style={$root} contentContainerStyle={$container} safeAreaEdges={["top"]}>
      <View style={$header}>
        <View style={$listTabs}>
          <Pressable 
            style={[
              $listTab, 
              activeList === "wishlist" && $activeListTab
            ]} 
            onPress={() => setActiveList("wishlist")}
          >
            <Text 
              text="Wishlist" 
              style={[
                $listTabText, 
                activeList === "wishlist" && $activeListTabText
              ]} 
            />
          </Pressable>
          <Pressable 
            style={[
              $listTab, 
              activeList === "grocery" && $activeListTab
            ]} 
            onPress={() => setActiveList("grocery")}
          >
            <Text 
              text="Grocery List" 
              style={[
                $listTabText, 
                activeList === "grocery" && $activeListTabText
              ]} 
            />
          </Pressable>
        </View>
        <Text text={`${currentItems.length} items`} style={$subtitle} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={$loading} />
      ) : currentItems.length === 0 ? (
        <View style={$emptyState}>
          <Text text={`No items in your ${activeList === "grocery" ? "grocery list" : "wishlist"}`} style={$emptyText} />
          <Button
            text="Browse Items"
            onPress={navigateToHome}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={currentItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={$listContent}
            ItemSeparatorComponent={() => <View style={$separator} />}
          />
          <Button
            text="Schedule Pickup"
            onPress={navigateToSchedulePickup}
            style={$scheduleButton}
            preset="default"
          />
        </>
      )}
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
}

const $container: ViewStyle = {
  padding: 16,
}

const $header: ViewStyle = {
  marginBottom: 16,
}

const $listTabs: ViewStyle = {
  flexDirection: "row",
  marginBottom: 8,
  gap: 16,
}

const $listTab: ViewStyle = {
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 20,
  backgroundColor: colors.palette.neutral200,
}

const $activeListTab: ViewStyle = {
  backgroundColor: colors.palette.primary500,
}

const $listTabText: TextStyle = {
  fontSize: 16,
  color: colors.text,
}

const $activeListTabText: TextStyle = {
  color: colors.palette.neutral100,
  fontWeight: "bold",
}

const $itemCard: ViewStyle = {
  marginVertical: spacing.xs,
  marginHorizontal: spacing.md,
  padding: spacing.sm,
  backgroundColor: colors.background,
  borderRadius: spacing.md,
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

const $itemContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
}

const $itemLeftSection: ViewStyle = {
  marginRight: spacing.md,
}

const $itemImagePlaceholder: ViewStyle = {
  width: 60,
  height: 60,
  borderRadius: spacing.sm,
  backgroundColor: colors.palette.neutral200,
  justifyContent: "center",
  alignItems: "center",
}

const $itemMainContent: ViewStyle = {
  flex: 1,
}

const $itemHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xs,
}

const $itemTitle: TextStyle = {
  fontSize: 16,
  fontWeight: "bold",
}

const $quantityControls: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginVertical: spacing.xs,
  gap: spacing.xs,
}

const $quantityButton: ViewStyle = {
  minHeight: 36,
  minWidth: 36,
  padding: 0,
  backgroundColor: colors.palette.neutral200,
  borderRadius: spacing.sm,
}

const $quantityText: TextStyle = {
  fontSize: 16,
  marginHorizontal: spacing.sm,
}

const $familyMembersSection: ViewStyle = {
  flexDirection: "row",
  marginTop: spacing.xs,
  gap: spacing.xs,
}

const $familyMemberAvatar: ViewStyle = {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: colors.palette.neutral200,
  justifyContent: "center",
  alignItems: "center",
}

const $emptyState: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  gap: 16,
}

const $subtitle: TextStyle = {
  fontSize: 14,
  color: colors.textDim,
}

const $loading: ViewStyle = {
  marginTop: 16,
}

const $listContent: ViewStyle = {
  paddingBottom: 16,
}

const $separator: ViewStyle = {
  height: 1,
  backgroundColor: colors.border,
}

const $scheduleButton: ViewStyle = {
  marginHorizontal: spacing.md,
  marginBottom: spacing.lg,
}

const $emptyText: TextStyle = {
  fontSize: 16,
  fontWeight: "bold",
  marginBottom: 10,
}
