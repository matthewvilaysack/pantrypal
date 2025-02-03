import { UserPreferencesModel } from "../../app/models/UserPreferencesStore"
import { Instance } from "mobx-state-tree"

describe("UserPreferences Store", () => {
  let store: Instance<typeof UserPreferencesModel>

  beforeEach(() => {
    store = UserPreferencesModel.create({
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
    })
  })

  it("can be created", () => {
    expect(store).toBeTruthy()
  })

  describe("group management", () => {
    it("can set group type", () => {
      store.setProp("groupType", "join")
      expect(store.groupType).toBe("join")
    })

    it("can set group name", () => {
      store.setProp("groupName", "Test Group")
      expect(store.groupName).toBe("Test Group")
    })
  })

  describe("location management", () => {
    it("can set location", () => {
      store.setProp("location", "Stanford, CA, USA")
      expect(store.location).toBe("Stanford, CA, USA")
    })
  })

  describe("name management", () => {
    it("can update name", () => {
      store.updateName("John", "Doe")
      expect(store.name.first).toBe("John")
      expect(store.name.last).toBe("Doe")
    })

    it("returns correct full name", () => {
      store.updateName("John", "Doe")
      expect(store.fullName).toBe("John Doe")
    })

    it("handles empty name fields", () => {
      store.updateName("", "")
      expect(store.fullName).toBe("")
    })
  })

  describe("family size management", () => {
    it("can update family size", () => {
      store.updateFamilySize("adults", 2)
      store.updateFamilySize("teenagers", 1)
      expect(store.familySize.adults).toBe(2)
      expect(store.familySize.teenagers).toBe(1)
    })

    it("calculates total family size correctly", () => {
      store.updateFamilySize("adults", 2)
      store.updateFamilySize("teenagers", 1)
      store.updateFamilySize("children", 2)
      store.updateFamilySize("infants", 1)
      expect(store.totalFamilySize).toBe(6)
    })
  })

  describe("allergies management", () => {
    it("can add allergies", () => {
      store.addAllergy("dairy-free")
      store.addAllergy("egg-free")
      expect(store.allergies).toContain("dairy-free")
      expect(store.allergies).toContain("egg-free")
    })

    it("prevents duplicate allergies", () => {
      store.addAllergy("dairy-free")
      store.addAllergy("dairy-free")
      expect(store.allergies.length).toBe(1)
    })

    it("can remove allergies", () => {
      store.addAllergy("dairy-free")
      store.removeAllergy("dairy-free")
      expect(store.allergies).not.toContain("dairy-free")
    })
  })

  describe("onboarding status", () => {
    it("can complete onboarding", () => {
      store.completeOnboarding()
      expect(store.onboardingCompleted).toBe(true)
    })

    it("can reset onboarding", () => {
      store.completeOnboarding()
      store.resetOnboarding()
      expect(store.onboardingCompleted).toBe(false)
    })
  })
}) 