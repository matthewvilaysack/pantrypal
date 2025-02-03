import React, { FC } from "react"
import { ViewStyle, TextStyle, Pressable } from "react-native"
import { Text, Button } from "@/components"
import { colors, spacing } from "@/theme"
import { observer } from "mobx-react-lite"
import { useStores } from "@/models"
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated"

interface FoodsToAvoidStepProps {
  onNext: () => void
  onBack: () => void
}

const FOODS_TO_AVOID = [
  { id: "alcohol", label: "Alcohol" },
  { id: "pork", label: "Pork" },
  { id: "fish", label: "Fish" },
] as const

export const FoodsToAvoidStep: FC<FoodsToAvoidStepProps> = observer(function FoodsToAvoidStep({
  onNext,
  onBack,
}) {
  const { userPreferencesStore } = useStores()

  const toggleFood = (food: typeof FOODS_TO_AVOID[number]["id"]) => {
    const currentFoods = userPreferencesStore.foodsToAvoid
    if (currentFoods.includes(food)) {
      userPreferencesStore.setProp(
        "foodsToAvoid",
        currentFoods.filter((f) => f !== food)
      )
    } else {
      userPreferencesStore.setProp("foodsToAvoid", [...currentFoods, food])
    }
  }

  return (
    <Animated.View
      style={$container}
      entering={FadeInDown.duration(400)}
      exiting={FadeOut.duration(200)}
    >
      <Text text="Any foods to avoid?" preset="heading" style={$header} />

      <Animated.View style={$optionsContainer}>
        {FOODS_TO_AVOID.map((food) => {
          const isSelected = userPreferencesStore.foodsToAvoid.includes(food.id)
          return (
            <Pressable
              key={food.id}
              style={[
                $optionButton,
                isSelected && $optionButtonSelected,
              ]}
              onPress={() => toggleFood(food.id)}
            >
              <Text
                text={food.label}
                style={[
                  $optionText,
                  isSelected && $optionTextSelected,
                ]}
              />
            </Pressable>
          )
        })}
      </Animated.View>

      <Button
        text="Next"
        onPress={onNext}
        style={$nextButton}
      />
    </Animated.View>
  )
})

const $container: ViewStyle = {
  flex: 1,
  gap: spacing.lg,
}

const $header: TextStyle = {
  textAlign: "center",
  marginBottom: spacing.lg,
}

const $optionsContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
  justifyContent: "center",
}

const $optionButton: ViewStyle = {
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: spacing.sm,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
}

const $optionButtonSelected: ViewStyle = {
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
}

const $optionText: TextStyle = {
  color: colors.palette.neutral800,
  fontSize: 16,
}

const $optionTextSelected: TextStyle = {
  color: colors.palette.primary500,
}

const $nextButton: ViewStyle = {
  marginTop: "auto",
  marginBottom: spacing.xs,
}
