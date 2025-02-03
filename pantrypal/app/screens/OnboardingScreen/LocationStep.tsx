import React, { FC } from "react"
import { ViewStyle, TextStyle, Pressable } from "react-native"
import { Text, Button } from "@/components"
import { colors, spacing } from "@/theme"
import { observer } from "mobx-react-lite"
import { useStores } from "@/models"
import Animated, { 
  FadeInDown, 
  FadeOut,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  Layout,
} from "react-native-reanimated"
import { ScrollView } from "react-native-gesture-handler"

interface LocationStepProps {
  onNext: () => void
  onBack: () => void
}

const LOCATIONS = [
  "Stanford, CA, USA",
  "Palo Alto, CA, USA",
  "San Jose, CA, USA",
  "San Francisco, CA, USA",
]

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const LocationStep: FC<LocationStepProps> = observer(function LocationStep({ onNext, onBack }) {
  const { userPreferencesStore } = useStores()
  const pressAnimations = LOCATIONS.map(() => useSharedValue(1))

  const handleLocationSelect = (location: string) => {
    userPreferencesStore.setProp("location", location)
  }

  const getAnimatedStyle = (index: number) => {
    return useAnimatedStyle(() => ({
      transform: [{ scale: pressAnimations[index].value }],
      backgroundColor: userPreferencesStore.location === LOCATIONS[index] 
        ? colors.palette.primary100 
        : colors.palette.neutral100,
      borderColor: userPreferencesStore.location === LOCATIONS[index]
        ? colors.palette.primary500
        : colors.palette.neutral300,
    }))
  }

  const handlePressIn = (index: number) => {
    pressAnimations[index].value = withSpring(0.95, { damping: 15 })
  }

  const handlePressOut = (index: number) => {
    pressAnimations[index].value = withSpring(1, { damping: 15 })
  }

  return (
    <Animated.View 
      style={$container}
      entering={FadeInDown.duration(400)}
      exiting={FadeOut.duration(200)}
      layout={Layout.duration(300)}
      testID="location-step"
    >
      <Text text="What is your location?" preset="heading" style={$header} />
      
      <ScrollView 
        style={$scrollView} 
        contentContainerStyle={$optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {LOCATIONS.map((location, index) => {
          const isSelected = userPreferencesStore.location === location
          return (
            <AnimatedPressable
              key={location}
              style={[
                $optionButton,
                getAnimatedStyle(index),
              ]}
              onPressIn={() => handlePressIn(index)}
              onPressOut={() => handlePressOut(index)}
              onPress={() => handleLocationSelect(location)}
              testID={`location-option-${index}`}
            >
              <Animated.Text
                style={[
                  $optionText,
                  isSelected && $optionTextSelected,
                ]}
              >
                {location}
              </Animated.Text>
            </AnimatedPressable>
          )
        })}
      </ScrollView>

      <Button
        text="Next"
        onPress={onNext}
        style={$nextButton}
        disabled={!userPreferencesStore.location}
        testID="next-button"
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

const $scrollView: ViewStyle = {
  flex: 1,
}

const $optionsContainer: ViewStyle = {
  flexDirection: "column",
  gap: spacing.sm,
  paddingBottom: spacing.lg,
}

const $optionButton: ViewStyle = {
  padding: spacing.md,
  borderRadius: spacing.sm,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
}

const $optionText: TextStyle = {
  color: colors.palette.neutral800,
  textAlign: "center",
  fontSize: 16,
  fontWeight: "500",
}

const $optionTextSelected: TextStyle = {
  color: colors.palette.primary500,
}

const $nextButton: ViewStyle = {
  marginTop: "auto",
  marginBottom: spacing.xs,
}
