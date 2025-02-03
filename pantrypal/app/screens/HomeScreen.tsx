import React, { FC, useState, useEffect, useCallback } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, View, FlatList, ImageStyle, TextStyle, Pressable, ActivityIndicator, Modal, Alert } from "react-native"
import { Screen, Text, AutoImage, Card, Button, Icon, TextField, CategoryTag, ListView } from "@/components"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { AppStackParamList } from "app/navigators"
import { colors, spacing } from "@/theme"
import { Ingredient, ingredientsApi } from "@/services/api/ingredients-api"
import { useStores } from "@/models"
import { useAuth } from "@/services/auth/useAuth"
import { supabase } from "@/services/auth/supabase"
import { debounce } from "lodash"
import { MapsApi, FoodBank } from "@/services/api/maps-api"
import { Api } from "@/services/api"

export interface HomeScreenProps extends NativeStackScreenProps<AppStackParamList, "Home"> {}

interface BundleAd {
  id: string
  title: string
  image: string
  type: string
}

const BUNDLES: BundleAd[] = [
  {
    id: "1",
    title: "Vegan Family Grocery Bundle",
    image: "https://placehold.co/600x400/png", // Replace with actual image
    type: "vegan",
  },
  {
    id: "2",
    title: "Protein Pack Bundle",
    image: "https://placehold.co/600x400/png", // Replace with actual image
    type: "protein",
  },
]

const CATEGORIES = [
  { id: "vegetables", name: "Vegetables", icon: "🥬" },
  { id: "meat", name: "Meat", icon: "🥩" },
  { id: "fruit", name: "Fruit", icon: "🍎" },
  { id: "dairy", name: "Dairy", icon: "🥛" },
  { id: "baked", name: "Bakery", icon: "🥖" },
]

export const HomeScreen: FC<HomeScreenProps> = observer(function HomeScreen(props) {
  const { groceryListStore, wishlistStore } = useStores()
  const { navigation } = props
  const [selectedLocation] = useState("Palo Alto Food Bank")
  const [newItems, setNewItems] = useState<Ingredient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isEndReached, setIsEndReached] = useState(false)
  const [visibleItems, setVisibleItems] = useState<Ingredient[]>([])
  const [allItems, setAllItems] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  const [foodBanks, setFoodBanks] = useState<FoodBank[]>([])
  const [error, setError] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showFoodBankModal, setShowFoodBankModal] = useState(false)
  const [selectedFoodBank, setSelectedFoodBank] = useState<FoodBank | null>(null)

  const mapsApi = new MapsApi(new Api())

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setDebouncedSearchQuery(text)
    }, 500),
    []
  )

  // Handle search input
  const handleSearch = (text: string) => {
    setSearchQuery(text)
    debouncedSearch(text)
  }

  // Use debounced search query for API calls
  useEffect(() => {
    loadNewItems(true)
  }, [debouncedSearchQuery, selectedCategory])

  const loadNewItems = async (reset = false) => {
    if (reset) {
      setIsLoading(true)
      setOffset(0)
      setHasMore(true)
      setAllItems([])
      setVisibleItems([])
      setIsEndReached(false)
    } else {
      if (!hasMore || isLoadingMore || !isEndReached) return
      setIsLoadingMore(true)
    }

    try {
      const { data, error } = await ingredientsApi.getIngredients({ 
        search: debouncedSearchQuery,
        category: selectedCategory,
        limit: 20,
        offset: reset ? 0 : offset
      })
      
      if (error) {
        console.error("Error loading ingredients:", error)
        return
      }

      if (data) {
        if (data.length < 20) {
          setHasMore(false)
        }
        
        const newItems = reset ? data : [...allItems, ...data]
        setAllItems(newItems)
        
        // Only show first 20 items initially or add next batch
        if (reset) {
          setVisibleItems(data.slice(0, 20))
        } else {
          setVisibleItems(newItems.slice(0, Math.min(newItems.length, visibleItems.length + 20)))
        }
        
        setOffset(reset ? 20 : offset + 20)
      }
    } catch (error) {
      console.error("Error loading ingredients:", error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      setIsEndReached(false)
    }
  }

  const keyExtractor = (item: Ingredient) => item.product_id

  const getItemLayout = (_: any, index: number) => ({
    length: 320, // Fixed height for each item
    offset: 320 * index,
    index,
  })

  const handleEndReached = () => {
    if (isLoading || !hasMore) return

    // If we've shown all loaded items, fetch more from API
    if (visibleItems.length === allItems.length) {
      setIsEndReached(true)
      loadNewItems(false)
    } else {
      // Show next batch from already loaded items
      const nextBatch = allItems.slice(0, Math.min(allItems.length, visibleItems.length + 20))
      setVisibleItems(nextBatch)
    }
  }

  const handleAddToGroceryList = async (item: Ingredient) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession?.user?.id) {
      console.error("No authenticated user found")
      return
    }

    // Only add if there are servings available
    const quantity = typeof item.quantity === 'string' ? item.quantity : String(item.quantity)
    if (!quantity || parseInt(quantity) <= 0) {
      console.error("No servings available")
      return
    }

    groceryListStore.addToGroceryList({
      name: item.name,
      category: item.category,
      quantity: quantity,
      product_id: item.product_id,
      description: item.description || "",
      nutrition: item.nutrition || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      image_url: item.image_url || "",
      user_id: currentSession.user.id,
    })
  }

  const handleAddToWishlist = async (item: Ingredient) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      console.error("No authenticated user found")
      return
    }

    // Only add if there are servings available
    const quantity = typeof item.quantity === 'string' ? item.quantity : String(item.quantity)
    if (!quantity || parseInt(quantity) <= 0) {
      console.error("No servings available")
      return
    }

    wishlistStore.addToWishlist({
      user_id: session.user.id,
      product_id: item.product_id,
      name: item.name,
      category: item.category,
      quantity: "1",
      description: item.description || undefined,
      nutrition: item.nutrition || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      image_url: item.image_url || undefined
    })
  }

  const handleCategoryPress = (categoryId: string) => {
    console.log("Category pressed:", categoryId)
    if (selectedCategory === categoryId) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(categoryId)
    }
  }

  const renderBundleAd = ({ item }: { item: BundleAd }) => (
    <Card
      style={$bundleCard}
      ContentComponent={
        <View>
          <AutoImage source={{ uri: item.image }} style={$bundleImage} />
          <View style={$bundleContent}>
            <Text text={item.title} style={$bundleTitle} weight="bold" />
            <View style={$bundleActions}>
              <Button
                text="reserve"
                style={$reserveButton}
                onPress={() => {}}
              />
              <Button
                preset="default"
                LeftAccessory={() => <Icon icon="heart" size={20} />}
                style={$wishlistButton}
                onPress={() => props.navigation.navigate("Wishlist", { initialView: "wishlist" })}
              />
            </View>
          </View>
        </View>
      }
    />
  )

  const renderCategory = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <Pressable
      style={[
        $categoryButton,
        selectedCategory === item.id && $categoryButtonActive
      ]}
      onPress={() => handleCategoryPress(item.id)}
    >
      <View style={[
        $categoryIcon,
        selectedCategory === item.id && $categoryIconActive
      ]}>
        <Text style={$categoryEmoji} text={item.icon} />
      </View>
      <Text 
        style={[
          $categoryText,
          selectedCategory === item.id && $categoryTextActive
        ]} 
        text={item.name} 
      />
    </Pressable>
  )

  const renderNewItem = ({ item }: { item: Ingredient }) => (
    <Card
      style={$newItemCard}
      ContentComponent={
        <Pressable 
          onPress={() => props.navigation.navigate("IngredientDetails", { id: item.product_id })}
        >
          <View>
            <AutoImage 
              source={{ uri: item.image_url || "https://placehold.co/400x400/png" }}
              style={$newItemImage} 
            />
            <View style={$newItemContent}>
              <Text text={item.name} style={$newItemTitle} weight="bold" />
              <CategoryTag category={item.category} />
              <Text text={`${item.quantity} servings left`} style={$servingsText} />
              <View style={$itemActions}>
                <Button
                  preset="default"
                  LeftAccessory={() => <Icon icon="heart" size={20} color={colors.palette.neutral800} />}
                  style={$itemWishlistButton}
                  onPress={() => handleAddToWishlist(item)}
                />
                <Button
                  preset="default"
                  LeftAccessory={() => <Icon icon="components" size={20} color={colors.palette.neutral800} />}
                  style={$itemWishlistButton}
                  onPress={() => handleAddToGroceryList(item)}
                />
                <Button
                  text="reserve"
                  style={$itemReserveButton}
                  textStyle={$reserveButtonText}
                  onPress={() => props.navigation.navigate("IngredientDetails", { id: item.product_id })}
                />
              </View>
            </View>
          </View>
        </Pressable>
      }
    />
  )

  const loadLocationsAndFoodBanks = async () => {
    setLoading(true)
    try {
      // Get preferred location for food bank search
      const preferredLocation = await mapsApi.getUserPreferredLocation()
      console.log('Preferred location:', preferredLocation)

      if (preferredLocation?.error) {
        setError("Could not load your preferred location. Please check your settings.")
      } else if (preferredLocation) {
        // Get current location for distance calculations
        const currentLoc = await mapsApi.getCurrentLocation()
        console.log('Current location:', currentLoc)

        // Search food banks near preferred location, but calculate distances from current location
        const { foodBanks: banks, error: searchError } = await mapsApi.searchNearbyFoodBanks(
          preferredLocation.lat,
          preferredLocation.lng,
          currentLoc.error ? undefined : currentLoc.lat,
          currentLoc.error ? undefined : currentLoc.lng
        )
        console.log('Food banks received:', banks)
        
        if (searchError) {
          console.error('Food bank search error:', searchError)
          setError(searchError)
        } else {
          setFoodBanks(banks)
          if (banks.length > 0 && !selectedFoodBank) {
            setSelectedFoodBank(banks[0])
          }
        }
      }
    } catch (e) {
      console.error('Error in loadLocationsAndFoodBanks:', e)
      setError("An error occurred while loading food banks.")
    } finally {
      setLoading(false)
    }
  }

  // Call loadLocationsAndFoodBanks when component mounts
  useEffect(() => {
    loadLocationsAndFoodBanks()
  }, [])

  const handleFoodBankSelect = (foodBank: FoodBank) => {
    setSelectedFoodBank(foodBank)
    setShowFoodBankModal(false)
  }

  const handleSchedulePickup = () => {
    if (selectedFoodBank) {
      props.navigation.navigate("SchedulePickup", {
        foodBankId: selectedFoodBank.place_id,
        foodBank: selectedFoodBank
      })
    } else {
      Alert.alert("Error", "Please select a food bank first")
    }
  }

  const renderFoodBankItem = ({ item }: { item: FoodBank }) => (
    <Pressable 
      style={[
        $foodBankItem,
        selectedFoodBank?.place_id === item.place_id && $foodBankItemSelected
      ]}
      onPress={() => handleFoodBankSelect(item)}
    >
      <View style={$foodBankItemContent}>
        <Text text={item.name} style={$foodBankName} />
        <Text text={item.vicinity} style={$foodBankAddress} />
        {item.distance && (
          <Text text={item.distance} style={$foodBankDistance} />
        )}
      </View>
    </Pressable>
  )

  const navigateToWishlist = () => {
    navigation.navigate("GroceryList", {
      initialView: "wishlist"
    })
  }

  return (
    <Screen
      preset="scroll"
      style={$root}
      contentContainerStyle={$screenContentContainer}
      safeAreaEdges={["top"]}
    >
      <View style={$header}>
        <AutoImage
          source={require("../../assets/images/logo.png")}
          style={$logo}
          resizeMode="contain"
        />
        <View style={$headerActions}>
          <Button
            preset="default"
            LeftAccessory={() => <Icon icon="components" size={24} color={colors.palette.neutral800} />}
            style={$iconButton}
            onPress={navigateToWishlist}
          />
          <Button
            preset="default"
            LeftAccessory={() => <Icon icon="bell" size={24} color={colors.palette.neutral800} />}
            style={$iconButton}
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={$searchContainer}>
        <TextField
          placeholder="Search for fruits, vegetables, groceries..."
          value={searchQuery}
          onChangeText={handleSearch}
          LeftAccessory={() => <Icon icon="view" size={20} color={colors.palette.neutral800} />}
          style={$searchField}
          containerStyle={$searchFieldContainer}
        />
      </View>

      <View style={$locationContainer}>
        <Icon icon="pin" size={20} color={colors.palette.neutral800} />
        <Text text="Pick up at" style={$pickupText} />
        <Button
          preset="default"
          text={selectedFoodBank?.name || "Select Food Bank"}
          RightAccessory={() => <Icon icon="caretRight" size={12} color={colors.palette.neutral800} />}
          style={$locationButton}
          textStyle={$locationButtonText}
          onPress={() => setShowFoodBankModal(true)}
        />
      </View>

      {/* Food Bank Selection Modal */}
      <Modal
        visible={showFoodBankModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFoodBankModal(false)}
      >
        <View style={$modalContainer}>
          <View style={$modalContent}>
            <View style={$modalHeader}>
              <Text preset="heading" text="Select Food Bank" />
              <Button
                preset="default"
                onPress={() => setShowFoodBankModal(false)}
                LeftAccessory={() => <Icon icon="x" size={24} />}
              />
            </View>
            
            {error ? (
              <Text style={$error} text={error} />
            ) : (
              <ListView<FoodBank>
                data={foodBanks}
                renderItem={renderFoodBankItem}
                estimatedItemSize={80}
                contentContainerStyle={$foodBankList}
                refreshing={loading}
                onRefresh={loadLocationsAndFoodBanks}
              />
            )}
          </View>
        </View>
      </Modal>

      <View style={$mainContent}>
        <FlatList
          data={visibleItems}
          renderItem={renderNewItem}
          keyExtractor={keyExtractor}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={10}
          updateCellsBatchingPeriod={100}
          numColumns={2}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={$itemsGrid}
          columnWrapperStyle={$columnWrapper}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <>
              <FlatList
                data={BUNDLES}
                renderItem={renderBundleAd}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={$bundleList}
                contentContainerStyle={$bundleListContent}
              />

              <Text preset="heading" text="Categories" style={$sectionTitle} />
              <FlatList
                data={CATEGORIES}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={$categoryList}
                contentContainerStyle={$categoryListContent}
              />

              <View style={$newItemsHeader}>
                <Text preset="heading" text="Available Items" style={$sectionTitle} />
              </View>
            </>
          }
          ListEmptyComponent={
            !isLoading ? (
              <Text
                text="No items found"
                style={$emptyText}
              />
            ) : null
          }
          ListFooterComponent={
            (isLoading || isLoadingMore) ? (
              <ActivityIndicator style={$loading} />
            ) : hasMore ? (
              <Text text="Scroll for more..." style={$loadMoreText} />
            ) : null
          }
        />
      </View>

      <Button
        text={selectedFoodBank ? "Schedule Pickup" : "Select a Food Bank"}
        onPress={handleSchedulePickup}
        style={$button}
        disabled={!selectedFoodBank || loading}
        preset="primary"
      />
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
}

const $screenContentContainer: ViewStyle = {
  flexGrow: 1,
}

const $header: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
}

const $logo: ImageStyle = {
  width: 120,
  height: 40,
}

const $headerActions: ViewStyle = {
  flexDirection: "row",
  gap: spacing.sm,
}

const $iconButton: ViewStyle = {
  minHeight: 44,
  minWidth: 44,
  paddingHorizontal: 0,
}

const $searchContainer: ViewStyle = {
  paddingHorizontal: spacing.md,
  marginBottom: spacing.sm,
}

const $searchButton: ViewStyle = {
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
}

const $locationContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  marginBottom: spacing.md,
}

const $pickupText: TextStyle = {
  marginLeft: spacing.xs,
  color: colors.textDim,
}

const $locationButton: ViewStyle = {
  marginLeft: spacing.xs,
  flex: 1,
}

const $bundleList: ViewStyle = {
  marginBottom: spacing.lg,
}

const $bundleListContent: ViewStyle = {
  paddingHorizontal: spacing.md,
  gap: spacing.sm,
}

const $bundleCard: ViewStyle = {
  width: 320,
  marginRight: spacing.sm,
}

const $bundleImage: ImageStyle = {
  width: "100%",
  height: 160,
  borderRadius: spacing.sm,
}

const $bundleContent: ViewStyle = {
  padding: spacing.sm,
}

const $bundleTitle: TextStyle = {
  fontSize: 18,
  marginBottom: spacing.xs,
}

const $bundleActions: ViewStyle = {
  flexDirection: "row",
  gap: spacing.xs,
}

const $reserveButton: ViewStyle = {
  flex: 1,
}

const $wishlistButton: ViewStyle = {
  aspectRatio: 1,
  paddingHorizontal: 0,
}

const $sectionTitle: TextStyle = {
  paddingHorizontal: spacing.md,
  marginBottom: spacing.sm,
}

const $categoryList: ViewStyle = {
  marginBottom: spacing.lg,
}

const $categoryListContent: ViewStyle = {
  paddingHorizontal: spacing.md,
  gap: spacing.sm,
}

const $categoryButton: ViewStyle = {
  alignItems: "center",
  marginRight: spacing.md,
}

const $categoryIcon: ViewStyle = {
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: colors.palette.neutral100,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.xs,
}

const $categoryIconActive: ViewStyle = {
  backgroundColor: colors.palette.primary100,
}

const $categoryEmoji: TextStyle = {
  fontSize: 32,
}

const $categoryText: TextStyle = {
  fontSize: 12,
  color: colors.textDim,
}

const $categoryTextActive: TextStyle = {
  color: colors.palette.primary500,
}

const $categoryButtonActive: ViewStyle = {
  opacity: 1,
}

const $newItemsHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingRight: spacing.md,
  marginBottom: spacing.sm,
}

const $seeMoreButton: ViewStyle = {
  minHeight: 36,
}

const $newItemsList: ViewStyle = {
  marginBottom: spacing.lg,
}

const $newItemsListContent: ViewStyle = {
  paddingHorizontal: spacing.md,
  gap: spacing.sm,
}

const $newItemCard: ViewStyle = {
  flex: 1,
  maxWidth: "50%",
  borderRadius: spacing.md,
  backgroundColor: colors.background,
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

const $newItemImage: ImageStyle = {
  width: "100%",
  height: 160,
  borderTopLeftRadius: spacing.md,
  borderTopRightRadius: spacing.md,
}

const $newItemContent: ViewStyle = {
  padding: spacing.sm,
}

const $newItemTitle: TextStyle = {
  fontSize: 16,
  marginBottom: spacing.xs,
  color: colors.text,
}

const $servingsText: TextStyle = {
  fontSize: 12,
  color: colors.textDim,
  marginBottom: spacing.xs,
}

const $itemActions: ViewStyle = {
  flexDirection: "row",
  gap: spacing.xs,
  marginTop: spacing.xs,
}

const $itemWishlistButton: ViewStyle = {
  aspectRatio: 1,
  paddingHorizontal: 0,
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.sm,
}

const $itemReserveButton: ViewStyle = {
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.sm,
}

const $reserveButtonText: TextStyle = {
  color: colors.palette.neutral800,
  fontSize: 14,
}

const $locationButtonText: TextStyle = {
  color: colors.text,
  fontSize: 14,
}

const $searchField: TextStyle = {
  flex: 1,
}

const $searchFieldContainer: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.sm,
  paddingHorizontal: spacing.sm,
}

const $loading: ViewStyle = {
  flex: 1,
  justifyContent: "center",
}

const $itemsGrid: ViewStyle = {
  padding: spacing.sm,
}

const $columnWrapper: ViewStyle = {
  gap: spacing.sm,
  justifyContent: "flex-start",
}

const $emptyText: TextStyle = {
  textAlign: "center",
  marginTop: spacing.lg,
}

const $mainContent: ViewStyle = {
  flex: 1,
  height: "100%",
}

const $loadMoreText: TextStyle = {
  textAlign: "center",
  marginVertical: spacing.md,
  color: colors.textDim,
}

const $modalContainer: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "flex-end",
}

const $modalContent: ViewStyle = {
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: spacing.lg,
  maxHeight: "80%",
}

const $modalHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.lg,
}

const $foodBankList: ViewStyle = {
  paddingBottom: spacing.xl,
}

const $foodBankItem: ViewStyle = {
  padding: spacing.md,
  borderRadius: 8,
  marginBottom: spacing.sm,
  backgroundColor: colors.palette.neutral100,
}

const $foodBankItemSelected: ViewStyle = {
  backgroundColor: colors.palette.primary100,
}

const $foodBankItemContent: ViewStyle = {
  gap: spacing.xs,
}

const $foodBankName: TextStyle = {
  fontWeight: "bold",
}

const $foodBankAddress: TextStyle = {
  fontSize: 14,
  color: colors.textDim,
}

const $foodBankDistance: TextStyle = {
  fontSize: 12,
  color: colors.textDim,
}

const $error: TextStyle = {
  color: colors.error,
  textAlign: "center",
}

const $button: ViewStyle = {
  marginTop: spacing.xl,
}
