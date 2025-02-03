import { UserPreferencesModel } from "./UserPreferencesStore"

describe("UserPreferences Store", () => {
  const getStore = () =>
    UserPreferencesModel.create({
      groupType: "create",
      location: "San Francisco",
      name: { first: "John", last: "Doe" },
      familySize: { adults: 2, teenagers: 1, children: 1, infants: 0 },
      age: 35,
      allergies: ["dairy-free"],
      foodsToAvoid: ["pork"]
    })

  it("creates a store with initial values", () => {
    const store = getStore()
    expect(store.groupType).toBe("create")
    expect(store.location).toBe("San Francisco")
    expect(store.name.first).toBe("John")
    expect(store.name.last).toBe("Doe")
    expect(store.age).toBe(35)
    expect(store.allergies).toEqual(["dairy-free"])
    expect(store.foodsToAvoid).toEqual(["pork"])
  })

  it("calculates fullName correctly", () => {
    const store = getStore()
    expect(store.fullName).toBe("John Doe")

    store.updateName("Jane", "Smith")
    expect(store.fullName).toBe("Jane Smith")
  })

  it("calculates totalFamilySize correctly", () => {
    const store = getStore()
    expect(store.totalFamilySize).toBe(4) // 2 adults + 1 teenager + 1 child + 0 infants

    store.updateFamilySize("adults", 3)
    expect(store.totalFamilySize).toBe(5)
  })

  it("manages allergies correctly", () => {
    const store = getStore()
    
    store.addAllergy("gluten-free")
    expect(store.allergies).toContain("gluten-free")
    
    store.removeAllergy("dairy-free")
    expect(store.allergies).not.toContain("dairy-free")
    
    // Should not add duplicate allergies
    store.addAllergy("gluten-free")
    expect(store.allergies.filter(a => a === "gluten-free").length).toBe(1)
  })

  it("updates name correctly", () => {
    const store = getStore()
    store.updateName("Jane", "Smith")
    expect(store.name.first).toBe("Jane")
    expect(store.name.last).toBe("Smith")
  })

  it("updates family size correctly", () => {
    const store = getStore()
    store.updateFamilySize("adults", 3)
    store.updateFamilySize("teenagers", 2)
    expect(store.familySize.adults).toBe(3)
    expect(store.familySize.teenagers).toBe(2)
  })

  it("manages onboarding state correctly", () => {
    const store = getStore()
    expect(store.onboardingCompleted).toBe(false)

    store.completeOnboarding()
    expect(store.onboardingCompleted).toBe(true)

    store.resetOnboarding()
    expect(store.onboardingCompleted).toBe(false)
  })
}) 