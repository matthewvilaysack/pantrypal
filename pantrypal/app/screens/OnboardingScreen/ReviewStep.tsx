import React, { FC } from "react"
import { ViewStyle, TextStyle, View, ScrollView } from "react-native"
import { Text, Button, Card, Icon } from "@/components"
import { colors, spacing } from "@/theme"
import { observer } from "mobx-react-lite"
import { useStores } from "@/models"
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated"

interface ReviewStepProps {
  onNext: () => void
  onBack: () => void
}

export const ReviewStep: FC<ReviewStepProps> = observer(function ReviewStep({ onNext, onBack }) {
  const { userPreferencesStore } = useStores()

  const renderSection = (title: string, content: string | number | string[]) => {
    const displayContent = Array.isArray(content) ? content.join(", ") : content.toString()
    
    return (
      <Card
        preset="reversed"
        verticalAlignment="center"
        style={$section}
        HeadingComponent={
          <View style={$sectionHeader}>
            <Icon icon="view" size={20} color={colors.palette.neutral100} />
            <Text preset="subheading" text={title} style={$sectionTitle} />
          </View>
        }
        content={displayContent}
        contentStyle={$sectionContent}
        ContentTextProps={{
          size: "md",
          weight: "medium",
        }}
      />
    )
  }

  return (
    <Animated.View
      style={$container}
      entering={FadeInDown.duration(400)}
      exiting={FadeOut.duration(200)}
    >
      <Text 
        text="Review your information" 
        preset="heading" 
        style={$header} 
      />
      
      <ScrollView 
        style={$scrollView} 
        contentContainerStyle={$contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={$cardsContainer}>
          {renderSection("Group Type", userPreferencesStore.groupType)}
          {renderSection("Location", userPreferencesStore.location)}
          {renderSection("Name", `${userPreferencesStore.name.first} ${userPreferencesStore.name.last}`)}
          {renderSection("Age", userPreferencesStore.age)}
          {renderSection("Family Size", Object.entries(userPreferencesStore.familySize)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => `${value} ${key}`)
          )}
          {renderSection("Allergies", userPreferencesStore.allergies.length ? 
            userPreferencesStore.allergies : 
            "No allergies"
          )}
          {renderSection("Foods to Avoid", userPreferencesStore.foodsToAvoid.length ? 
            userPreferencesStore.foodsToAvoid : 
            "No food restrictions"
          )}
        </View>
      </ScrollView>

      <Button 
        text="Looks good!" 
        onPress={onNext} 
        style={$nextButton}
        preset="reversed"
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
  marginBottom: spacing.sm,
}

const $scrollView: ViewStyle = {
  flex: 1,
}

const $contentContainer: ViewStyle = {
  flexGrow: 1,
  paddingBottom: spacing.lg,
}

const $cardsContainer: ViewStyle = {
  gap: spacing.md,
  paddingHorizontal: spacing.xl,
  alignItems: "center",
}

const $section: ViewStyle = {
  width: "100%",
  maxWidth: 400,
  minHeight: 80,
  borderRadius: 12,
}

const $sectionHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
}

const $sectionTitle: TextStyle = {
  color: colors.palette.neutral100,
  fontSize: 16,
}

const $sectionContent: TextStyle = {
  fontSize: 16,
  color: colors.palette.neutral100,
  textAlign: "center",
  marginTop: spacing.xs,
}

const $nextButton: ViewStyle = {
  marginTop: spacing.xs,
  marginBottom: spacing.xs,
  marginHorizontal: spacing.xl,
}
