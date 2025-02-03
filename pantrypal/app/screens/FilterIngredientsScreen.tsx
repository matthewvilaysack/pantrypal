import { FC } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, View, ScrollView, TextStyle } from "react-native"
import { ExploreStackScreenProps } from "@/navigators/MainNavigator"
import { Screen, Text, Header, Card, Button } from "@/components"
import { colors, spacing } from "@/theme"

interface FilterIngredientsScreenProps extends ExploreStackScreenProps<"FilterIngredients"> {}

const SORT_OPTIONS = [
  { id: "name_asc", label: "Name (A-Z)" },
  { id: "name_desc", label: "Name (Z-A)" },
  { id: "calories_asc", label: "Calories (Low to High)" },
  { id: "calories_desc", label: "Calories (High to Low)" },
]

const CATEGORIES = [
  { id: "vegetables", label: "Vegetables", icon: "🥕" },
  { id: "meat", label: "Meat", icon: "🥩" },
  { id: "fruit", label: "Fruit", icon: "🍎" },
  { id: "dairy", label: "Dairy", icon: "🥛" },
  { id: "baked", label: "Baked", icon: "🥖" },
]

export const FilterIngredientsScreen: FC<FilterIngredientsScreenProps> = observer(
  function FilterIngredientsScreen({ navigation, route }) {
    const handleApplyFilters = () => {
      // TODO: Apply filters and pass back to previous screen
      navigation.goBack()
    }

    return (
      <Screen style={$root} preset="fixed">
        <Header 
          title="Filter" 
          leftIcon="x"
          onLeftPress={() => navigation.goBack()}
          RightActionComponent={
            <Button
              text="Apply"
              preset="reversed"
              onPress={handleApplyFilters}
            />
          }
        />

        <ScrollView style={$container} contentContainerStyle={$contentContainer}>
          <View style={$section}>
            <Text text="Sort By" preset="heading" style={$sectionTitle} />
            <View style={$optionsContainer}>
              {SORT_OPTIONS.map((option) => (
                <Card
                  key={option.id}
                  style={$optionCard}
                  ContentComponent={
                    <Text text={option.label} style={$optionText} />
                  }
                  onPress={() => {}}
                />
              ))}
            </View>
          </View>

          <View style={$section}>
            <Text text="Categories" preset="heading" style={$sectionTitle} />
            <View style={$optionsContainer}>
              {CATEGORIES.map((category) => (
                <Card
                  key={category.id}
                  style={$optionCard}
                  ContentComponent={
                    <View style={$categoryContent}>
                      <Text text={category.icon} style={$categoryIcon} />
                      <Text text={category.label} style={$optionText} />
                    </View>
                  }
                  onPress={() => {}}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </Screen>
    )
  },
)

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
}

const $container: ViewStyle = {
  flex: 1,
}

const $contentContainer: ViewStyle = {
  padding: spacing.md,
  gap: spacing.xl,
}

const $section: ViewStyle = {
  gap: spacing.sm,
}

const $sectionTitle: ViewStyle = {
  marginBottom: spacing.xs,
}

const $optionsContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
}

const $optionCard: ViewStyle = {
  minWidth: "45%",
  flex: 1,
  padding: spacing.xs,
}

const $optionText: TextStyle = {
  textAlign: "center",
}

const $categoryContent: ViewStyle = {
  alignItems: "center",
  gap: spacing.xs,
}

const $categoryIcon: TextStyle = {
  fontSize: 24,
}
