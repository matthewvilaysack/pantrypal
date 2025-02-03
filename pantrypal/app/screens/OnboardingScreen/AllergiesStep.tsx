import React, { FC } from "react"
import { ViewStyle, TextStyle, Pressable } from "react-native"
import { Text, Button } from "@/components"
import { colors, spacing } from "@/theme"
import { observer } from "mobx-react-lite"
import { useStores } from "@/models"
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated"

interface AllergiesStepProps {
  onNext: () => void
  onBack: () => void
}

const ALLERGIES = [
  { id: "dairy-free", label: "Dairy Free" },
  { id: "egg-free", label: "Egg Free" },
  { id: "gluten-free", label: "Gluten Free" },
] as const

export const AllergiesStep: FC<AllergiesStepProps> = observer(function AllergiesStep({
  onNext,
  onBack,
}) {
  const { userPreferencesStore } = useStores()

  const toggleAllergy = (allergy: typeof ALLERGIES[number]["id"]) => {
    if (userPreferencesStore.allergies.includes(allergy)) {
      userPreferencesStore.removeAllergy(allergy)
    } else {
      userPreferencesStore.addAllergy(allergy)
    }
  }

  return (
    <Animated.View
      style={$container}
      entering={FadeInDown.duration(400)}
      exiting={FadeOut.duration(200)}
    >
      <Text text="Do you have any allergies?" preset="heading" style={$header} />

      <Animated.View style={$optionsContainer}>
        {ALLERGIES.map((allergy) => {
          const isSelected = userPreferencesStore.allergies.includes(allergy.id)
          return (
            <Pressable
              key={allergy.id}
              style={[
                $optionButton,
                isSelected && $optionButtonSelected,
              ]}
              onPress={() => toggleAllergy(allergy.id)}
            >
              <Text
                text={allergy.label}
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
