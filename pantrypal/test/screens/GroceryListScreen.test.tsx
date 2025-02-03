import React from "react"
import { fireEvent, render, waitFor } from "@testing-library/react-native"
import { GroceryListScreen } from "@/screens"
import { RootStoreProvider, RootStore } from "@/models"
import { NavigationContainer } from "@react-navigation/native"

describe("GroceryListScreen", () => {
  const mockGroceryItems = [
    {
      id: "1",
      product_id: "prod1",
      name: "Apples",
      quantity: "2",
      category: "fruits",
      assigned_to: ["user1"],
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      product_id: "prod2",
      name: "Milk",
      quantity: "1",
      category: "dairy",
      assigned_to: ["user2"],
      created_at: new Date().toISOString(),
    },
  ]

  const TestNavigator = ({ store = new RootStore() }) => (
    <RootStoreProvider value={store}>
      <NavigationContainer>
        <GroceryListScreen />
      </NavigationContainer>
    </RootStoreProvider>
  )

  it("shows loading state initially", () => {
    const store = new RootStore()
    store.groceryListStore.setProp("isLoading", true)
    
    const { getByTestId } = render(<TestNavigator store={store} />)
    expect(getByTestId("loading-spinner")).toBeTruthy()
  })

  it("shows empty state when no items exist", () => {
    const store = new RootStore()
    store.groceryListStore.setProp("isLoading", false)
    store.groceryListStore.setProp("items", [])
    
    const { getByText } = render(<TestNavigator store={store} />)
    expect(getByText("No Items")).toBeTruthy()
    expect(getByText("Add ingredients from the Explore tab")).toBeTruthy()
  })

  it("renders grocery items correctly", () => {
    const store = new RootStore()
    store.groceryListStore.setProp("isLoading", false)
    store.groceryListStore.setProp("items", mockGroceryItems)
    
    const { getByText } = render(<TestNavigator store={store} />)
    expect(getByText("Apples")).toBeTruthy()
    expect(getByText("2")).toBeTruthy()
    expect(getByText("Milk")).toBeTruthy()
    expect(getByText("1")).toBeTruthy()
  })

  it("switches between list and wishlist tabs", () => {
    const store = new RootStore()
    store.groceryListStore.setProp("isLoading", false)
    store.groceryListStore.setProp("items", mockGroceryItems)
    
    const { getByText } = render(<TestNavigator store={store} />)
    
    fireEvent.press(getByText("Wishlist"))
    expect(getByText("No Wishlist Items")).toBeTruthy()
    
    fireEvent.press(getByText("Grocery List"))
    expect(getByText("Apples")).toBeTruthy()
  })

  it("removes item on long press", async () => {
    const store = new RootStore()
    store.groceryListStore.setProp("isLoading", false)
    store.groceryListStore.setProp("items", mockGroceryItems)
    
    const { getByText, queryByText } = render(<TestNavigator store={store} />)
    
    fireEvent(getByText("Apples"), "onLongPress")
    
    await waitFor(() => {
      expect(queryByText("Apples")).toBeNull()
    })
  })

  it("shows schedule pickup button when items exist", () => {
    const store = new RootStore()
    store.groceryListStore.setProp("isLoading", false)
    store.groceryListStore.setProp("items", mockGroceryItems)
    
    const { getByText } = render(<TestNavigator store={store} />)
    expect(getByText("Schedule Pickup")).toBeTruthy()
  })

  it("hides schedule pickup button when no items exist", () => {
    const store = new RootStore()
    store.groceryListStore.setProp("isLoading", false)
    store.groceryListStore.setProp("items", [])
    
    const { queryByText } = render(<TestNavigator store={store} />)
    expect(queryByText("Schedule Pickup")).toBeNull()
  })
}) 