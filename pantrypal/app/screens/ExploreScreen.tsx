import { FC, useState, useEffect, useCallback, useMemo } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, View, FlatList, ActivityIndicator, ImageStyle, TextStyle } from "react-native"
import { Screen, Text, Header, Card, TextField, EmptyState, AutoImage, Button } from "@/components"
import { ExploreStackScreenProps } from "@/navigators/MainNavigator"
import { spacing, colors } from "@/theme"
import { ingredientsApi, Ingredient } from "@/services/api/ingredients-api"
import debounce from "lodash.debounce"

interface ExploreScreenProps extends ExploreStackScreenProps<"ExploreMain"> {}

interface Category {
  id: string
  name: string
  icon: string
}

type SortOption = {
  label: string
  value: "name" | "calories" | "protein_g"
  order: "asc" | "desc"
}

const SORT_OPTIONS: SortOption[] = [
  { label: "Name (A-Z)", value: "name", order: "asc" },
  { label: "Name (Z-A)", value: "name", order: "desc" },
  { label: "Calories (High-Low)", value: "calories", order: "desc" },
  { label: "Calories (Low-High)", value: "calories", order: "asc" },
  { label: "Protein (High-Low)", value: "protein_g", order: "desc" },
  { label: "Protein (Low-High)", value: "protein_g", order: "asc" },
]

const CATEGORIES: Category[] = [
  { id: "1", name: "fruit", icon: "🍎" },
  { id: "2", name: "vegetables", icon: "🥕" },
  { id: "3", name: "dairy", icon: "🥛" },
  { id: "4", name: "meat", icon: "🥩" },
  { id: "5", name: "baked", icon: "🥖" },
]

export const ExploreScreen: FC<ExploreScreenProps> = observer(function ExploreScreen({
  navigation
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSort, setSelectedSort] = useState<SortOption>(SORT_OPTIONS[0])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIngredients = useCallback(async (loadMore = false) => {
    if (loadMore && (!hasMore || isLoadingMore)) return
    if (!loadMore && isLoading) return

    if (loadMore) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
      setError(null)
    }

    const offset = loadMore ? ingredients.length : 0

    const { data, error: fetchError, hasMore: moreAvailable } = await ingredientsApi.getIngredients({
      category: selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.name : undefined,
      search: searchQuery,
      sortBy: selectedSort.value,
      sortOrder: selectedSort.order,
      limit: 20,
      offset,
    })

    if (fetchError) {
      setError("Failed to load ingredients. Please try again.")
      if (!loadMore) setIngredients([])
    } else {
      setIngredients(prev => loadMore ? [...prev, ...(data || [])] : (data || []))
      setHasMore(moreAvailable)
    }

    if (loadMore) {
      setIsLoadingMore(false)
    } else {
      setIsLoading(false)
    }
  }, [selectedCategory, searchQuery, selectedSort, ingredients.length, hasMore, isLoading, isLoadingMore])

  const debouncedFetch = useMemo(
    () => debounce((shouldReset: boolean) => fetchIngredients(shouldReset), 500),
    [fetchIngredients]
  )

  useEffect(() => {
    debouncedFetch(false)
    return () => debouncedFetch.cancel()
  }, [searchQuery, selectedCategory, selectedSort])

  const handleEndReached = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchIngredients(true)
    }
  }, [fetchIngredients, isLoadingMore, hasMore])

  const renderCategory = ({ item }: { item: Category }) => (
    <Card
      style={[
        $categoryCard,
        selectedCategory === item.id && $selectedCategoryCard,
      ]}
      ContentComponent={
        <View style={$categoryContent}>
          <Text text={item.icon} size="xxl" />
          <Text text={item.name} size="xs" />
        </View>
      }
      onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
    />
  )

  const renderIngredient = ({ item }: { item: Ingredient }) => (
    <Card
      style={$ingredientCard}
      ContentComponent={
        <View style={$ingredientCardContent}>
          {item.image_url ? (
            <AutoImage
              source={{ uri: item.image_url }}
              maxWidth={120}
              maxHeight={120}
              style={$ingredientImage}
            />
          ) : (
            <View style={$placeholderImage}>
              <Text text="🥗" size="xxl" />
            </View>
          )}
          <Text text={item.name} size="md" weight="bold" style={$ingredientName} />
          {item.description && (
            <Text
              size="xs"
              text={item.description.substring(0, 50) + "..."}
              style={$ingredientDescription}
            />
          )}
          {item.nutrition && (
            <Text
              size="xs"
              text={`${item.nutrition.calories} cal | ${item.nutrition.protein_g}g protein`}
              style={$ingredientNutrition}
            />
          )}
        </View>
      }
      onPress={() => {
        navigation.navigate("IngredientDetails", { id: item.id })
      }}
    />
  )

  return (
    <Screen
      style={$root}
      preset="fixed"
      contentContainerStyle={$screenContentContainer}
      safeAreaEdges={["top"]}
    >
      <Header
        title="Explore"
        RightActionComponent={
          <View style={$headerRight}>
            <TextField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search ingredients..."
              style={$searchField}
            />
            <Button
              text={selectedSort.label}
              onPress={() => {
                // TODO: Show sort options modal
                const nextSortIndex = (SORT_OPTIONS.findIndex(opt => opt.value === selectedSort.value) + 1) % SORT_OPTIONS.length
                setSelectedSort(SORT_OPTIONS[nextSortIndex])
              }}
              style={$headerSortButton}
            />
          </View>
        }
      />

      <View style={$categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategory}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={$categoriesList}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={$loading} />
      ) : error ? (
        <EmptyState
          preset="generic"
          heading="Error"
          content={error}
          button="Try Again"
          buttonOnPress={() => fetchIngredients(false)}
          style={$emptyState}
        />
      ) : ingredients.length === 0 ? (
        <EmptyState
          preset="generic"
          heading="No Ingredients Found"
          content="Try adjusting your search or category filter"
          style={$emptyState}
        />
      ) : (
        <FlatList
          style={$ingredientsContainer}
          data={ingredients}
          renderItem={renderIngredient}
          keyExtractor={item => item.id}
          contentContainerStyle={$ingredientsList}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator style={$loadingMore} /> : null}
          showsVerticalScrollIndicator={true}
          numColumns={2}
          columnWrapperStyle={$columnWrapper}
        />
      )}
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
}

const $screenContentContainer: ViewStyle = {
  flex: 1,
}

const $searchField: ViewStyle = {
  flex: 1,
  minWidth: 120,
}

const $categoriesList: ViewStyle = {
  paddingHorizontal: spacing.sm,
  gap: spacing.xs,
}

const $categoryCard: ViewStyle = {
  width: 100,
  marginHorizontal: spacing.xxs,
}

const $selectedCategoryCard: ViewStyle = {
  borderColor: colors.tint,
  borderWidth: 2,
}

const $categoryContent: ViewStyle = {
  alignItems: "center",
  gap: spacing.xs,
  padding: spacing.xs,
}

const $loading: ViewStyle = {
  flex: 1,
  justifyContent: "center",
}

const $emptyState: ViewStyle = {
  flex: 1,
}

const $ingredientCard: ViewStyle = {
  flex: 1,
  margin: spacing.xs,
  maxWidth: "48%",
}

const $ingredientCardContent: ViewStyle = {
  alignItems: "center",
  padding: spacing.sm,
  gap: spacing.xs,
}

const $ingredientImage: ImageStyle = {
  width: 120,
  height: 120,
  borderRadius: spacing.sm,
  marginBottom: spacing.xs,
}

const $placeholderImage: ViewStyle = {
  width: 120,
  height: 120,
  borderRadius: spacing.sm,
  backgroundColor: colors.palette.neutral200,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.xs,
}

const $ingredientName: TextStyle = {
  textAlign: "center",
  marginBottom: spacing.xxs,
}

const $ingredientDescription: TextStyle = {
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.xxs,
}

const $ingredientNutrition: TextStyle = {
  color: colors.textDim,
  textAlign: "center",
}

const $columnWrapper: ViewStyle = {
  justifyContent: "flex-start",
}

const $ingredientsContainer: ViewStyle = {
  flex: 1,
}

const $ingredientsList: ViewStyle = {
  padding: spacing.xs,
}

const $loadingMore: ViewStyle = {
  paddingVertical: spacing.md,
}

const $headerRight: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  flex: 1,
}

const $headerSortButton: ViewStyle = {
  minWidth: 100,
}

const $categoriesContainer: ViewStyle = {
  backgroundColor: colors.background,
  paddingVertical: spacing.xs,
}
