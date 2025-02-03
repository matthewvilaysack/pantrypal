import React, { FC } from "react"
import { ViewStyle, TextStyle, View, Platform } from "react-native"
import { Text, Button } from "@/components"
import { colors, spacing } from "@/theme"
import { observer } from "mobx-react-lite"
import { useStores } from "@/models"
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated"
import Slider from "@react-native-community/slider"

interface FamilySizeStepProps {
  onNext: () => void
  onBack: () => void
}

interface FamilyGroupConfig {
  key: keyof typeof FamilyGroups
  label: string
  range: [number, number]
}

const FamilyGroups = {
  adults: "adults (18+)",
  teenagers: "teenagers (13-18)",
  children: "children (2-12)",
  infants: "infant (0-2)",
}

const GROUPS: FamilyGroupConfig[] = [
  { key: "adults", label: FamilyGroups.adults, range: [0, 5] },
  { key: "teenagers", label: FamilyGroups.teenagers, range: [0, 5] },
  { key: "children", label: FamilyGroups.children, range: [0, 5] },
  { key: "infants", label: FamilyGroups.infants, range: [0, 5] },
]

export const FamilySizeStep: FC<FamilySizeStepProps> = observer(function FamilySizeStep({
  onNext,
  onBack,
}) {
  const { userPreferencesStore } = useStores()

  const handleSliderChange = (type: keyof typeof FamilyGroups, value: number) => {
    userPreferencesStore.updateFamilySize(type, Math.round(value))
  }

  const canProceed = userPreferencesStore.totalFamilySize > 0

  return (
    <Animated.View
      style={$container}
      entering={FadeInDown.duration(400)}
      exiting={FadeOut.duration(200)}
    >
      <Text text="What is your family size?" preset="heading" style={$header} />

      <View style={$slidersContainer}>
        {GROUPS.map((group) => (
          <View key={group.key} style={$sliderRow}>
            <View style={$labelContainer}>
              <Text text={group.label} style={$label} />
              <Text text={userPreferencesStore.familySize[group.key].toString()} style={$value} />
            </View>
            <Slider
              style={$slider}
              minimumValue={group.range[0]}
              maximumValue={group.range[1]}
              value={userPreferencesStore.familySize[group.key]}
              onValueChange={(value) => handleSliderChange(group.key, value)}
              minimumTrackTintColor={colors.palette.primary500}
              maximumTrackTintColor={colors.palette.neutral300}
              thumbTintColor={colors.palette.primary500}
              step={1}
              tapToSeek={Platform.OS === "web"}
            />
          </View>
        ))}
      </View>

      <Button text="Next" onPress={onNext} style={$nextButton} disabled={!canProceed} />
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

const $slidersContainer: ViewStyle = {
  gap: spacing.lg,
}

const $sliderRow: ViewStyle = {
  gap: spacing.xs,
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
