// app/models/RootStore.ts
import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { AuthenticationStoreModel } from "./AuthenticationStore" 
import { EpisodeStoreModel } from "./EpisodeStore" 
import { UserPreferencesModel } from "./UserPreferencesStore"
import { createGroceryListStoreDefaultModel } from "./GroceryListStore"
import { WishlistStoreModel } from "./WishlistStore"

/**
 * A RootStore model.
 */
export const RootStoreModel = types.model("RootStore").props({
  authenticationStore: types.optional(AuthenticationStoreModel, {}), 
  episodeStore: types.optional(EpisodeStoreModel, {}),
  userPreferencesStore: types.optional(UserPreferencesModel, {
    groupType: "create",
    location: "",
    name: { first: "", last: "" },
    familySize: { adults: 0, teenagers: 0, children: 0, infants: 0 },
    age: 0,
    allergies: [],
    foodsToAvoid: [],
    onboardingCompleted: false
  }),
  groceryListStore: createGroceryListStoreDefaultModel(),
  wishlistStore: types.optional(WishlistStoreModel, {})
})

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}