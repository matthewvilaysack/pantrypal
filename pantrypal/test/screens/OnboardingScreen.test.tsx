import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import { OnboardingScreen } from "../../app/screens/OnboardingScreen/OnboardingScreen"
import { Api } from "../../app/services/api"
import { UserPreferencesModel } from "../../app/models/UserPreferencesStore"
import { Instance } from "mobx-state-tree"
import { AppStackParamList } from "../../app/navigators"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { create } from "apisauce"
import { RootStoreModel, RootStoreProvider } from "../../app/models"

// Mock dependencies
jest.mock("@/services/api")
jest.mock("@/services/auth/useAuth", () => ({
  useAuth: () => ({ token: "test-token" })
}))

// Mock react-native-keyboard-controller
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardAwareScrollView: jest.fn((props) => props.children),
}))

const Stack = createNativeStackNavigator<AppStackParamList>()

const TestNavigator = ({ children, store }: { children: React.ReactNode; store: Instance<typeof RootStoreModel> }) => (
  <RootStoreProvider value={store}>
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Onboarding">{() => children}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  </RootStoreProvider>
)

describe("OnboardingScreen", () => {
  let store: Instance<typeof RootStoreModel>
  
  beforeEach(() => {
    // Setup store with initial state
    store = RootStoreModel.create({
      userPreferencesStore: {
        groupType: "create",
        groupName: "",
        location: "",
        name: { first: "", last: "" },
        familySize: {
          adults: 0,
          teenagers: 0,
          children: 0,
          infants: 0
        },
        age: 0,
        allergies: [],
        foodsToAvoid: [],
        onboardingCompleted: false
      }
    })

    // Mock API
    const apisauceInstance = create({
      baseURL: "",
      timeout: 0,
    })
    
    const mockApi = new Api()
    mockApi.apisauce = apisauceInstance
    mockApi.saveUserPreferences = jest.fn().mockResolvedValue({ ok: true })
    jest.mocked(Api).mockImplementation(() => mockApi)
  })

  it("completes the onboarding flow successfully", async () => {
    const { getByTestId, getByText } = render(
      <TestNavigator store={store}>
        <OnboardingScreen />
      </TestNavigator>
    )

    // Group Type Step
    expect(getByTestId("group-type-step")).toBeTruthy()
    fireEvent.press(getByTestId("group-type-create"))
    fireEvent.changeText(getByTestId("group-name-input"), "Test Group")
    fireEvent.press(getByTestId("next-button"))

    // Location Step
    expect(getByTestId("location-step")).toBeTruthy()
    fireEvent.press(getByTestId("location-option-0")) // Stanford, CA
    fireEvent.press(getByTestId("next-button"))

    // Name Step
    expect(getByTestId("name-step")).toBeTruthy()
    fireEvent.changeText(getByTestId("first-name-input"), "John")
    fireEvent.changeText(getByTestId("last-name-input"), "Doe")
    fireEvent.press(getByTestId("next-button"))

    // Age Step
    expect(getByTestId("age-step")).toBeTruthy()
    fireEvent(getByTestId("age-slider"), "valueChange", 25)
    fireEvent.press(getByTestId("next-button"))

    // Complete remaining steps
    while (getByTestId("next-button")) {
      fireEvent.press(getByTestId("next-button"))
    }

    // Success Step
    expect(getByTestId("success-step")).toBeTruthy()
    fireEvent.press(getByTestId("get-started-button"))

    await waitFor(() => {
      expect(store.userPreferencesStore.onboardingCompleted).toBe(true)
      expect(store.userPreferencesStore.name.first).toBe("John")
      expect(store.userPreferencesStore.name.last).toBe("Doe")
      expect(store.userPreferencesStore.location).toBe("Stanford, CA, USA")
      expect(store.userPreferencesStore.groupType).toBe("create")
      expect(store.userPreferencesStore.groupName).toBe("Test Group")
      expect(store.userPreferencesStore.age).toBe(25)
    })
  })

  it("handles back navigation correctly", async () => {
    const { getByTestId, getByText } = render(
      <TestNavigator store={store}>
        <OnboardingScreen />
      </TestNavigator>
    )

    // Move to second step
    expect(getByTestId("group-type-step")).toBeTruthy()
    fireEvent.press(getByTestId("group-type-create"))
    fireEvent.changeText(getByTestId("group-name-input"), "Test Group")
    fireEvent.press(getByTestId("next-button"))
    
    // Press back
    fireEvent.press(getByTestId("back-button"))
    
    // Should be back at first step
    expect(getByTestId("group-type-step")).toBeTruthy()
  })

  it("handles API errors gracefully", async () => {
    // Mock API error
    const apisauceInstance = create({
      baseURL: "",
      timeout: 0,
    })
    
    const mockApi = new Api()
    mockApi.apisauce = apisauceInstance
    mockApi.saveUserPreferences = jest.fn().mockResolvedValue({ 
      ok: false, 
      problem: "SERVER_ERROR" 
    })
    jest.mocked(Api).mockImplementation(() => mockApi)

    const { getByTestId } = render(
      <TestNavigator store={store}>
        <OnboardingScreen />
      </TestNavigator>
    )

    // Complete all steps
    // Group Type Step
    fireEvent.press(getByTestId("group-type-create"))
    fireEvent.changeText(getByTestId("group-name-input"), "Test Group")
    fireEvent.press(getByTestId("next-button"))

    // Location Step
    fireEvent.press(getByTestId("location-option-0"))
    fireEvent.press(getByTestId("next-button"))

    // Name Step
    fireEvent.changeText(getByTestId("first-name-input"), "John")
    fireEvent.changeText(getByTestId("last-name-input"), "Doe")
    fireEvent.press(getByTestId("next-button"))

    // Complete remaining steps
    while (getByTestId("next-button")) {
      fireEvent.press(getByTestId("next-button"))
    }

    // Try to complete
    fireEvent.press(getByTestId("get-started-button"))

    await waitFor(() => {
      expect(store.userPreferencesStore.onboardingCompleted).toBe(false)
    })
  })
}) 