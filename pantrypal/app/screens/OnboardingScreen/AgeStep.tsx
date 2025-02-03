import React, { FC } from "react"
import { ViewStyle, TextStyle, View, Platform } from "react-native"
import { Text, Button } from "@/components"
import { colors, spacing } from "@/theme"
import { observer } from "mobx-react-lite"
import { useStores } from "@/models"
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated"
import Slider from "@react-native-community/slider"

interface AgeStepProps {
  onNext: () => void
  onBack: () => void
}

const AGE_RANGE = {
  min: 13,
  max: 100,
}

export const AgeStep: FC<AgeStepProps> = observer(function AgeStep({ onNext, onBack }) {
  const { userPreferencesStore } = useStores()

  const handleAgeChange = (value: number) => {
    userPreferencesStore.setProp("age", Math.round(value))
  }

  const canProceed = userPreferencesStore.age >= AGE_RANGE.min

  return (
    <Animated.View
      style={$container}
      entering={FadeInDown.duration(400)}
      exiting={FadeOut.duration(200)}
      testID="age-step"
    >
      <Text text="What is your age?" preset="heading" style={$header} />

      <View style={$sliderContainer}>
        <View style={$labelContainer}>
          <Text text="Age" style={$label} />
          <Text text={userPreferencesStore.age.toString()} style={$value} />
        </View>
        <Slider
          style={$slider}
          value={userPreferencesStore.age}
          onValueChange={handleAgeChange}
          minimumValue={AGE_RANGE.min}
          maximumValue={AGE_RANGE.max}
          step={1}
          minimumTrackTintColor={colors.palette.primary500}
          maximumTrackTintColor={colors.palette.neutral300}
          thumbTintColor={colors.palette.primary500}
          tapToSeek={Platform.OS === "web"}
          testID="age-slider"
        />
      </View>

      <Button text="Next" onPress={onNext} style={$nextButton} disabled={!canProceed} testID="next-button" />
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

const $sliderContainer: ViewStyle = {
  gap: spacing.md,
  paddingHorizontal: spacing.lg,
}

const $labelContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $label: TextStyle = {
  fontSize: 16,
  color: colors.text,
}

const $value: TextStyle = {
  fontSize: 16,
  color: colors.palette.primary500,
  fontWeight: "600",
}

const $slider: ViewStyle = {
  height: 40,
  width: "100%",
}

const $nextButton: ViewStyle = {
  marginTop: "auto",
  marginBottom: spacing.xs,
}
