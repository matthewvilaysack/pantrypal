import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

/**
 * Model description for UserPreferences
 */
export const UserPreferencesModel = types
  .model("UserPreferences")
  .props({
    groupType: types.enumeration(["create", "join"]),
    groupName: types.optional(types.string, ""),
    location: types.string,
    name: types.model({
      first: types.string,
      last: types.string,
    }),
    familySize: types.model({
      adults: types.number,
      teenagers: types.number,
      children: types.number,
      infants: types.number,
    }),
    age: types.number,
    allergies: types.array(types.enumeration(["dairy-free", "egg-free", "gluten-free"])),
    foodsToAvoid: types.array(types.enumeration(["alcohol", "pork", "fish"])),
    onboardingCompleted: types.optional(types.boolean, false)
  })
  .actions(withSetPropAction)
  .views((self) => ({
    get fullName() {
      const first = self.name.first.trim()
      const last = self.name.last.trim()
      if (!first && !last) return ""
      return [first, last].filter(Boolean).join(" ")
    },
    get totalFamilySize() {
      return self.familySize.adults + 
             self.familySize.teenagers + 
             self.familySize.children + 
             self.familySize.infants
    }
  }))


  // Actions
  .actions((self) => ({
    updateName(first: string, last: string) {
      self.setProp("name", { first, last })
    },
    updateFamilySize(type: keyof typeof self.familySize, count: number) {
      self.setProp("familySize", { ...self.familySize, [type]: count })
    },
    addAllergy(allergy: typeof self.allergies[number]) {
      if (!self.allergies.includes(allergy)) {
        self.allergies.push(allergy)
      }
    },
    removeAllergy(allergy: typeof self.allergies[number]) {
      const index = self.allergies.indexOf(allergy)
      if (index > -1) {
        self.allergies.splice(index, 1)
      }
    },
    completeOnboarding() {
      self.setProp("onboardingCompleted", true)
    },
    resetOnboarding() {
      self.setProp("onboardingCompleted", false)
    }
  }))

export interface UserPreferences extends Instance<typeof UserPreferencesModel> {}
export interface UserPreferencesSnapshotOut extends SnapshotOut<typeof UserPreferencesModel> {}
export interface UserPreferencesSnapshotIn extends SnapshotIn<typeof UserPreferencesModel> {} 