import { UserPreferencesModel } from "./UserPreferencesStore"

describe("UserPreferences Store", () => {
  const mockUserData = {
    groupType: "create" as const,
    location: "San Francisco",
    name: { first: "John", last: "Doe" },
    familySize: {
      adults: 2,
      teenagers: 1,
      children: 1,
      infants: 0,
    },
    age: 35,
    allergies: ["dairy-free"] as const,
    foodsToAvoid: ["pork"] as const,
  }

  describe("Model Creation", () => {
    it("can be created with default values", () => {
      const instance = UserPreferencesModel.create({
        groupType: "create",
        location: "",
        name: { first: "", last: "" },
        familySize: { adults: 0, teenagers: 0, children: 0, infants: 0 },
        age: 0,
        allergies: [],
        foodsToAvoid: []
      })
      expect(instance).toBeTruthy()
      expect(instance.totalFamilySize).toBe(0)
    })

    it("can be created with mock data", () => {
      const instance = UserPreferencesModel.create(mockUserData)
      expect(instance).toBeTruthy()
      expect(instance.groupType).toBe("create")
      expect(instance.name.first).toBe("John")
      expect(instance.totalFamilySize).toBe(4)
    })
  })

  describe("Views", () => {
    it("computes fullName correctly", () => {
      const instance = UserPreferencesModel.create(mockUserData)
      expect(instance.fullName).toBe("John Doe")
    })

    it("computes totalFamilySize correctly", () => {
      const instance = UserPreferencesModel.create(mockUserData)
      expect(instance.totalFamilySize).toBe(4)
    })

    it("handles empty names in fullName", () => {
      const instance = UserPreferencesModel.create({
        ...mockUserData,
        name: { first: "", last: "" }
      })
      expect(instance.fullName).toBe("")
    })
  })

  describe("Actions", () => {
    describe("updateName", () => {
      it("updates first and last name", () => {
        const instance = UserPreferencesModel.create(mockUserData)
        instance.updateName("Jane", "Smith")
        expect(instance.name.first).toBe("Jane")
        expect(instance.name.last).toBe("Smith")
        expect(instance.fullName).toBe("Jane Smith")
      })

      it("handles empty strings", () => {
        const instance = UserPreferencesModel.create(mockUserData)
        instance.updateName("", "")
        expect(instance.name.first).toBe("")
        expect(instance.name.last).toBe("")
      })
    })

    describe("updateFamilySize", () => {
      it("updates individual family member counts", () => {
        const instance = UserPreferencesModel.create(mockUserData)
        instance.updateFamilySize("adults", 3)
        expect(instance.familySize.adults).toBe(3)
        expect(instance.totalFamilySize).toBe(5)
      })

      it("updates multiple family member types", () => {
        const instance = UserPreferencesModel.create(mockUserData)
        instance.updateFamilySize("adults", 3)
        instance.updateFamilySize("teenagers", 2)
        expect(instance.totalFamilySize).toBe(6)
      })
    })

    describe("Allergy Management", () => {
      it("can add new allergies", () => {
        const instance = UserPreferencesModel.create(mockUserData)
        instance.addAllergy("gluten-free")
        expect(instance.allergies).toContain("gluten-free")
        expect(instance.allergies).toHaveLength(2)
      })

      it("prevents duplicate allergies", () => {
        const instance = UserPreferencesModel.create(mockUserData)
        instance.addAllergy("dairy-free")
        expect(instance.allergies).toHaveLength(1)
      })

      it("can remove allergies", () => {
        const instance = UserPreferencesModel.create(mockUserData)
        instance.removeAllergy("dairy-free")
        expect(instance.allergies).not.toContain("dairy-free")
        expect(instance.allergies).toHaveLength(0)
      })

      it("handles removing non-existent allergies", () => {
        const instance = UserPreferencesModel.create(mockUserData)
        instance.removeAllergy("gluten-free")
        expect(instance.allergies).toHaveLength(1)
        expect(instance.allergies).toContain("dairy-free")
      })
    })
  })
}) 