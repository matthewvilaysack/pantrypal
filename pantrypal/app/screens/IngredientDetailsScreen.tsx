import { FC, useState, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, View, TextStyle, ImageStyle, Pressable, ActivityIndicator } from "react-native"
import { Screen, Text, AutoImage, Icon, Button, CategoryTag } from "@/components"
import { HomeStackScreenProps } from "@/navigators/MainNavigator"
import { colors, spacing } from "@/theme"
import { useStores } from "@/models"
import { Ingredient, ingredientsApi } from "@/services/api/ingredients-api"
import { supabase } from "@/services/auth/supabase"

interface IngredientDetailsScreenProps extends HomeStackScreenProps<"IngredientDetails"> {}

interface RelatedItem {
  id: string
  name: string
  image_url: string
  servings_left: number
}

const MOCK_RELATED: RelatedItem[] = [
  {
    id: "1",
    name: "Peppers",
    image_url: "https://placehold.co/400x400/png",
    servings_left: 10
  },
  {
    id: "2",
    name: "Yams",
    image_url: "https://placehold.co/400x400/png",
    servings_left: 40
  }
]

export const IngredientDetailsScreen: FC<IngredientDetailsScreenProps> = observer(function IngredientDetailsScreen({ 
  route,
  navigation 
}) {
  const { groceryListStore } = useStores()
  const [activeTab, setActiveTab] = useState<"Description" | "Nutrition facts">("Description")
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [ingredient, setIngredient] = useState<Ingredient | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch ingredient data when component mounts
  useEffect(() => {
    const fetchIngredient = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await ingredientsApi.getIngredientById(route.params.id)
        if (error) {
          console.error("Error fetching ingredient:", error)
          return
        }
        if (data) {
          setIngredient(data)
          // Check if item is already in cart and set initial quantity
          const cartItem = groceryListStore.getItemByProductId(data.product_id)
          if (cartItem) {
            setQuantity(Number(cartItem.quantity))
          }
        }
      } catch (error) {
        console.error("Error fetching ingredient:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchIngredient()
  }, [route.params.id, groceryListStore])

  const handleAddToGroceryList = async () => {
    if (!ingredient) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      console.error("No authenticated user found")
      return
    }

    groceryListStore.addToGroceryList({
      name: ingredient.name,
      category: ingredient.category,
      quantity: String(quantity),
      product_id: ingredient.product_id,
      description: ingredient.description || "",
      nutrition: ingredient.nutrition || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      image_url: ingredient.image_url || "",
      user_id: session.user.id,
    })
    navigation.goBack()
  }

  const incrementQuantity = () => {
    if (ingredient && quantity < ingredient.quantity) {
      setQuantity(q => q + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1)
    }
  }

  if (isLoading || !ingredient) {
    return (
      <Screen
        preset="scroll"
        style={$root}
        contentContainerStyle={[$container, $loadingContainer]}
        safeAreaEdges={["top"]}
      >
        <ActivityIndicator size="large" />
      </Screen>
    )
  }

  return (
    <Screen
      preset="scroll"
      style={$root}
      contentContainerStyle={$container}
      safeAreaEdges={["top"]}
    >
      <View style={$header}>
        <Button
          preset="default"
          LeftAccessory={() => <Icon icon="caretLeft" size={24} color={colors.palette.neutral800} />}
          style={$backButton}
          onPress={() => navigation.goBack()}
        />
        <Button
          preset="default"
          LeftAccessory={() => <Icon icon="bell" size={24} color={colors.palette.neutral800} />}
          style={$notificationButton}
          onPress={() => {}}
        />
      </View>

      <View style={$imageContainer}>
        <AutoImage
          source={{ uri: ingredient.image_url || "https://placehold.co/400x400/png" }}
          style={$image}
          resizeMode="cover"
        />
        <View style={$imageDots}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                $dot,
                currentImageIndex === index && $dotActive
              ]}
            />
          ))}
        </View>
      </View>

      <View style={$content}>
        <CategoryTag category={ingredient.category} />

        <Text text={ingredient.name} style={$title} weight="bold" />
        <Text text={`${ingredient.quantity} servings left`} style={$servings} />

        <View style={$tabs}>
          <Pressable
            style={[$tab, activeTab === "Description" && $tabActive]}
            onPress={() => setActiveTab("Description")}
          >
            <Text
              text="Description"
              style={[$tabText, activeTab === "Description" && $tabTextActive]}
            />
          </Pressable>
          <Pressable
            style={[$tab, activeTab === "Nutrition facts" && $tabActive]}
            onPress={() => setActiveTab("Nutrition facts")}
          >
            <Text
              text="Nutrition facts"
              style={[$tabText, activeTab === "Nutrition facts" && $tabTextActive]}
            />
          </Pressable>
        </View>

        <View style={$tabContent}>
          {activeTab === "Description" ? (
            <Text text={ingredient.description || ""} style={$description} />
          ) : (
            <View style={$nutritionFacts}>
              <View style={$nutritionItem}>
                <Text text={`${ingredient.nutrition?.calories || 0}`} style={$nutritionValue} />
                <Text text="calories" style={$nutritionLabel} />
              </View>
              <View style={$nutritionItem}>
                <Text text={`${ingredient.nutrition?.protein_g || 0}g`} style={$nutritionValue} />
                <Text text="protein" style={$nutritionLabel} />
              </View>
              <View style={$nutritionItem}>
                <Text text={`${ingredient.nutrition?.carbs_g || 0}g`} style={$nutritionValue} />
                <Text text="carbs" style={$nutritionLabel} />
              </View>
              <View style={$nutritionItem}>
                <Text text={`${ingredient.nutrition?.fat_g || 0}g`} style={$nutritionValue} />
                <Text text="fat" style={$nutritionLabel} />
              </View>
            </View>
          )}
        </View>

        <Text text="Related Produce" style={$relatedTitle} weight="bold" />
        <View style={$relatedList}>
          {MOCK_RELATED.map((item) => (
            <Pressable
              key={item.id}
              style={$relatedItem}
              onPress={() => navigation.replace("IngredientDetails", { id: item.id })}
            >
              <AutoImage source={{ uri: item.image_url }} style={$relatedImage} />
              <View style={$relatedInfo}>
                <Text text={item.name} style={$relatedName} />
                <Text text={`${item.servings_left} servings left`} style={$relatedServings} />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={$footer}>
          <View style={$quantitySelector}>
            <Button
              preset="default"
              text="-"
              style={$quantityButton}
              textStyle={$quantityButtonText}
              onPress={decrementQuantity}
            />
            <Text text={quantity.toString()} style={$quantity} />
            <Button
              preset="default"
              text="+"
              style={$quantityButton}
              textStyle={$quantityButtonText}
              onPress={incrementQuantity}
            />
          </View>
          <Button
            text="reserve"
            style={$reserveButton}
            onPress={handleAddToGroceryList}
          />
          <Button
            preset="default"
            LeftAccessory={() => <Icon icon="heart" size={24} color={colors.palette.neutral800} />}
            style={$wishlistButton}
            onPress={() => {}}
          />
        </View>
      </View>
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
}

const $container: ViewStyle = {
  flexGrow: 1,
}

const $header: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  position: "absolute",
  top: spacing.md,
  left: spacing.md,
  right: spacing.md,
  zIndex: 1,
}

const $backButton: ViewStyle = {
  minHeight: 44,
  minWidth: 44,
  paddingHorizontal: 0,
  backgroundColor: colors.background,
}

const $notificationButton: ViewStyle = {
  minHeight: 44,
  minWidth: 44,
  paddingHorizontal: 0,
  backgroundColor: colors.background,
}

const $imageContainer: ViewStyle = {
  height: 400,
  width: "100%",
  position: "relative",
}

const $image: ImageStyle = {
  width: "100%",
  height: "100%",
}

const $imageDots: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
  position: "absolute",
  bottom: spacing.lg,
  left: 0,
  right: 0,
  gap: spacing.sm,
}

const $dot: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.palette.neutral300,
}

const $dotActive: ViewStyle = {
  backgroundColor: colors.palette.primary500,
}

const $content: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  marginTop: -20,
  padding: spacing.lg,
}

const $title: TextStyle = {
  fontSize: 24,
  marginBottom: spacing.xs,
}

const $servings: TextStyle = {
  fontSize: 14,
  color: colors.textDim,
  marginBottom: spacing.md,
}

const $tabs: ViewStyle = {
  flexDirection: "row",
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
  marginBottom: spacing.md,
}

const $tab: ViewStyle = {
  paddingVertical: spacing.sm,
  marginRight: spacing.xl,
}

const $tabActive: ViewStyle = {
  borderBottomWidth: 2,
  borderBottomColor: colors.palette.primary500,
}

const $tabText: TextStyle = {
  fontSize: 16,
  color: colors.textDim,
}

const $tabTextActive: TextStyle = {
  color: colors.text,
}

const $tabContent: ViewStyle = {
  marginBottom: spacing.xl,
}

const $description: TextStyle = {
  fontSize: 14,
  lineHeight: 20,
  color: colors.textDim,
}

const $nutritionFacts: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
}

const $nutritionItem: ViewStyle = {
  alignItems: "center",
}

const $nutritionValue: TextStyle = {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: spacing.xxs,
}

const $nutritionLabel: TextStyle = {
  fontSize: 12,
  color: colors.textDim,
}

const $relatedTitle: TextStyle = {
  fontSize: 18,
  marginBottom: spacing.md,
}

const $relatedList: ViewStyle = {
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.xl,
}

const $relatedItem: ViewStyle = {
  flex: 1,
}

const $relatedImage: ImageStyle = {
  width: "100%",
  height: 100,
  borderRadius: spacing.sm,
  marginBottom: spacing.xs,
}

const $relatedInfo: ViewStyle = {
  gap: spacing.xxs,
}

const $relatedName: TextStyle = {
  fontSize: 14,
  fontWeight: "bold",
}

const $relatedServings: TextStyle = {
  fontSize: 12,
  color: colors.textDim,
}

const $footer: ViewStyle = {
  flexDirection: "row",
  gap: spacing.sm,
  paddingTop: spacing.sm,
  borderTopWidth: 1,
  borderTopColor: colors.palette.neutral200,
}

const $quantitySelector: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.sm,
  paddingHorizontal: spacing.sm,
}

const $quantityButton: ViewStyle = {
  minHeight: 44,
  minWidth: 44,
  paddingHorizontal: 0,
}

const $quantityButtonText: TextStyle = {
  fontSize: 20,
  color: colors.palette.neutral800,
}

const $quantity: TextStyle = {
  fontSize: 16,
  marginHorizontal: spacing.sm,
}

const $reserveButton: ViewStyle = {
  flex: 1,
}

const $wishlistButton: ViewStyle = {
  aspectRatio: 1,
  paddingHorizontal: 0,
}

const $loadingContainer: ViewStyle = {
  justifyContent: "center",
  alignItems: "center",
} 