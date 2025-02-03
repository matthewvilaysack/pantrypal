import React, { FC } from "react"
import { ViewStyle, TextStyle } from "react-native"
import { Text, TextField, Button } from "@/components"
import { colors, spacing } from "@/theme"
import { observer } from "mobx-react-lite"
import { useStores } from "@/models"
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated"

interface NameStepProps {
  onNext: () => void
  onBack: () => void
}

export const NameStep: FC<NameStepProps> = observer(function NameStep({ onNext, onBack }) {
  const { userPreferencesStore } = useStores()

  const handleFirstNameChange = (value: string) => {
    userPreferencesStore.updateName(value, userPreferencesStore.name.last)
  }

  const handleLastNameChange = (value: string) => {
    userPreferencesStore.updateName(userPreferencesStore.name.first, value)
  }

  const canProceed = userPreferencesStore.name.first.trim().length > 0 && 
                     userPreferencesStore.name.last.trim().length > 0

  return (
    <Animated.View 
      style={$container}
      entering={FadeInDown.duration(400)}
      exiting={FadeOut.duration(200)}
      testID="name-step"
    >
      <Text text="What's your name?" preset="heading" style={$header} />
      
      <TextField
        label="First Name"
        value={userPreferencesStore.name.first}
        onChangeText={handleFirstNameChange}
        containerStyle={$textField}
        autoCapitalize="words"
        placeholder="Enter your first name"
        testID="first-name-input"
      />

      <TextField
        label="Last Name"
        value={userPreferencesStore.name.last}
        onChangeText={handleLastNameChange}
        containerStyle={$textField}
        autoCapitalize="words"
        placeholder="Enter your last name"
        testID="last-name-input"
      />

      <Button
        text="Next"
        onPress={onNext}
        style={$nextButton}
        disabled={!canProceed}
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

const $textField: ViewStyle = {
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
}

const $nextButton: ViewStyle = {
  marginTop: "auto",
  marginBottom: spacing.xs,
}
