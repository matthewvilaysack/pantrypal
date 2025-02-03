import React, { FC, useState, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen } from "@/components"
import { useStores } from "@/models"
import { spacing } from "@/theme"
import { useHeader } from "@/utils/useHeader"
import { GroupTypeStep } from "./GroupTypeStep"
import { LocationStep } from "./LocationStep"
import { NameStep } from "./NameStep"
import { FamilySizeStep } from "./FamilySizeStep"
import { AgeStep } from "./AgeStep"
import { AllergiesStep } from "./AllergiesStep"
import { FoodsToAvoidStep } from "./FoodsToAvoidStep"
import { ReviewStep } from "./ReviewStep"
import { SuccessStep } from "./SuccessStep"
import { Api } from "@/services/api"
import { useAuth } from "@/services/auth/useAuth"
import { GeneralApiProblem, getGeneralApiProblem } from "@/services/api/apiProblem"
import type { UserPreferences } from "@/services/api/api.types"
import { supabase } from "@/services/auth/supabase"

interface OnboardingScreenProps extends AppStackScreenProps<"Onboarding"> {}

export const OnboardingScreen: FC<OnboardingScreenProps> = observer(
  function OnboardingScreen({ navigation }) {
    const { userPreferencesStore } = useStores()
    const { token } = useAuth()
    const [currentStep, setCurrentStep] = useState(0)
    const api = new Api()

    const handleBack = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1)
      } else {
        navigation.goBack()
      }
    }

    const handleClose = () => {
      navigation.replace("SignIn")
    }

    useEffect(() => {
      // Reset to first step for new users
      setCurrentStep(0)
    }, [])

    const handleComplete = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) {
          throw new Error("No user ID found")
        }

        // Save preferences to Supabase
        const preferences = {
          user_id: session.user.id,
          first_name: userPreferencesStore.name.first,
          last_name: userPreferencesStore.name.last,
          age: userPreferencesStore.age,
          location: userPreferencesStore.location,
          family_size: {
            adults: userPreferencesStore.familySize.adults,
            teenagers: userPreferencesStore.familySize.teenagers,
            children: userPreferencesStore.familySize.children,
            infants: userPreferencesStore.familySize.infants
          },
          allergies: Array.from(userPreferencesStore.allergies),
          foods_to_avoid: Array.from(userPreferencesStore.foodsToAvoid),
          onboarding_completed: true
        }
        console.log("Sending preferences to Supabase:", JSON.stringify(preferences, null, 2))
        const response = await api.saveUserPreferences(preferences)
        console.log("Raw Supabase response:", response)
        if (response.kind === "ok") {
          userPreferencesStore.completeOnboarding()
          navigation.navigate("Welcome")
        } else {
          console.error("Failed to save preferences. Response:", response)
        }
      } catch (error) {
        console.error("Error saving preferences:", error)
      }
    }

    useHeader({
      title: "Welcome",
      leftIcon: currentStep > 0 ? "caretLeft" : undefined,
      onLeftPress: currentStep > 0 ? handleBack : undefined,
      rightIcon: "x",
      onRightPress: handleClose,
    })

    const renderCurrentStep = () => {
      switch (currentStep) {
        case 0:
          return <GroupTypeStep onNext={() => setCurrentStep(1)} onBack={handleBack} />
        case 1:
          return <LocationStep onNext={() => setCurrentStep(2)} onBack={handleBack} />
        case 2:
          return <NameStep onNext={() => setCurrentStep(3)} onBack={handleBack} />
        case 3:
          return <FamilySizeStep onNext={() => setCurrentStep(4)} onBack={handleBack} />
        case 4:
          return <AgeStep onNext={() => setCurrentStep(5)} onBack={handleBack} />
        case 5:
          return <AllergiesStep onNext={() => setCurrentStep(6)} onBack={handleBack} />
        case 6:
          return <FoodsToAvoidStep onNext={() => setCurrentStep(7)} onBack={handleBack} />
        case 7:
          return <ReviewStep onNext={() => setCurrentStep(8)} onBack={handleBack} />
        case 8:
          return <SuccessStep onNext={handleComplete} onBack={handleBack} />
        default:
          return null
      }
    }

    return (
      <Screen style={$root} preset="scroll">
        {renderCurrentStep()}
      </Screen>
    )
  }
)

const $root: ViewStyle = {
  flex: 1,
  padding: spacing.md,
}
