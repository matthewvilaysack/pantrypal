import React, { FC } from "react"
import { ViewStyle, TextStyle } from "react-native"
import { Text, Button } from "@/components"
import { colors, spacing } from "@/theme"
import { observer } from "mobx-react-lite"
import { useStores } from "@/models"
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated"

interface SuccessStepProps {
  onNext: () => void
  onBack: () => void
}

export const SuccessStep: FC<SuccessStepProps> = observer(function SuccessStep({ onNext }) {
  const { userPreferencesStore } = useStores()

  return (
    <Animated.View
      style={$container}
      entering={FadeInDown.duration(400)}
      exiting={FadeOut.duration(200)}
      testID="success-step"
    >
      <Text text="Welcome to PantryPal!" preset="heading" style={$header} />
      
      <Text
        text={`Great to have you here, ${userPreferencesStore.name.first}! Your preferences have been saved and you're all set to start using PantryPal.`}
        style={$message}
      />

      <Button
        text="Get Started"
        onPress={onNext}
        style={$nextButton}
        testID="get-started-button"
      />
    </Animated.View>
  )
})

const $container: ViewStyle = {
  flex: 1,
  gap: spacing.xl,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
}

const $header: TextStyle = {
  textAlign: "center",
  color: colors.palette.primary500,
  fontSize: 28,
}

const $message: TextStyle = {
  textAlign: "center",
  fontSize: 16,
  lineHeight: 24,
  color: colors.text,
}

const $nextButton: ViewStyle = {
  marginTop: spacing.xl,
}
