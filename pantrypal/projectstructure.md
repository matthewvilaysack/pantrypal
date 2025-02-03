---
sidebar_position: 125
---

# Ingredient Shopping Flow with MobX-State-Tree

This documentation outlines the steps, folder structure, and component flow needed to build an MVP React Native application for managing ingredients using the Ignite boilerplate and **MobX-State-Tree (MST)** for state management.

---

## Why MobX-State-Tree?

If you've used Ignite Andross (the first Ignite stack), you know we formerly used Redux for state management, as does much of the community. However, we encountered some pain points with Redux and searched for a different solution. We landed on `mobx-state-tree` (MST), which serves as a great middle-ground between completely structured (like Redux) and completely freestyle (like MobX). It brings more than just state management to the table (e.g., dependency injection, serialization, and lifecycle events).

### Some Highlights of MST

MST is...

- **Intuitive**
  - Concepts like `props` and `actions` feel familiar for React developers.
  - Updating your data means calling functions on objects, rather than dispatching actions.
  - It feels similar to relational databases, with concepts like `identifiers` (primary keys), `references` (foreign keys), and `views` (calculated fields).
  
- **Streamlined**
  - No more `actionTypes`, `actionCreators`, or `reducers`.
  - You don't have to declare usage intentions with `mapStateToProps`; they are inferred.
  - Side-effects are built-in; no need for libraries like `redux-saga` or `redux-thunk`.
  - Immutability is built-in - no need for `immutable.js` or `seamless-immutable`.

- **More than State Management**
  - Lifecycle hooks like `afterCreate`, `preProcessSnapshot`, and `beforeDestroy` provide control over your data at various points in its lifecycle.

- **Performant**
  - Computed values (`views`) are only calculated when needed.
  - `mobx-react-lite` makes React "MobX-aware" and only re-renders when absolutely necessary.

- **Customizable**
  - MST ships with pre-built middlewares, including one for Redux interoperability.

---

## Folder Structure

This is the recommended folder structure for the project:

```
/src
  /api                 # API functions for Supabase and nutrition data
    supabase.js
    nutritionApi.js
  /models              # MST models and stores
    RootStore.js
    IngredientStore.js
    UserStore.js
  /components          # Reusable UI components
    IngredientCard.js
    CategoryCard.js
  /navigation          # Navigation structure for the app
    AppNavigator.js
  /screens             # Main screens for the app
    HomeScreen.js
    ExploreScreen.js
    GroceryListScreen.js
    ProfileScreen.js
    BundleDetailsScreen.js
    FoodDetailsScreen.js
    SchedulePickupScreen.js
    PickupConfirmationScreen.js
  /services            # Service functions for logic
    IngredientService.js
  /theme               # Theming and styling files
    colors.js
    spacing.js
  App.js               # Entry point for the application
```

---

## State Management with MobX-State-Tree

### **RootStore**
The `RootStore` is the entry point for all models.

```javascript
import { types } from "mobx-state-tree";
import { IngredientStore } from "./IngredientStore";
import { UserStore } from "./UserStore";

export const RootStore = types.model("RootStore", {
  ingredientStore: IngredientStore,
  userStore: UserStore,
});
```

### **IngredientStore**
Manages the state for ingredients.

```javascript
import { types, flow } from "mobx-state-tree";
import { fetchIngredients, addIngredient, deleteIngredient } from "../api/supabase";

export const IngredientStore = types
  .model("IngredientStore", {
    ingredients: types.array(
      types.model({
        id: types.identifier,
        name: types.string,
        category: types.string,
      })
    ),
  })
  .actions((self) => ({
    loadIngredients: flow(function* () {
      try {
        const data = yield fetchIngredients();
        self.ingredients = data;
      } catch (error) {
        console.error("Failed to load ingredients", error);
      }
    }),

    addIngredient: flow(function* (ingredient) {
      try {
        const data = yield addIngredient(ingredient);
        self.ingredients.push(data);
      } catch (error) {
        console.error("Failed to add ingredient", error);
      }
    }),

    deleteIngredient: flow(function* (id) {
      try {
        yield deleteIngredient(id);
        self.ingredients = self.ingredients.filter((item) => item.id !== id);
      } catch (error) {
        console.error("Failed to delete ingredient", error);
      }
    }),
  }));
```

---

## Screen Implementations

### **Home Screen**
Displays categories and featured bundles.

```javascript
import React from "react";
import { View, Text, FlatList } from "react-native";
import CategoryCard from "../components/CategoryCard";

const HomeScreen = ({ navigation }) => {
  const categories = ["Vegetables", "Meat", "Fruit", "Dairy", "Baked"];

  return (
    <View>
      <Text>Categories</Text>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <CategoryCard category={item} onPress={() => navigation.navigate("Explore", { category: item })} />
        )}
        keyExtractor={(item) => item}
      />
    </View>
  );
};

export default HomeScreen;
```

---

### **Explore Screen**
Displays ingredients by category.

```javascript
import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../models/RootStore";
import { View, FlatList } from "react-native";
import IngredientCard from "../components/IngredientCard";

const ExploreScreen = observer(({ route, navigation }) => {
  const { category } = route.params;
  const { ingredientStore } = useStores();

  useEffect(() => {
    ingredientStore.loadIngredients();
  }, []);

  const filteredIngredients = ingredientStore.ingredients.filter(
    (ingredient) => ingredient.category === category
  );

  return (
    <View>
      <FlatList
        data={filteredIngredients}
        renderItem={({ item }) => (
          <IngredientCard
            ingredient={item}
            onDetailPress={() => navigation.navigate("FoodDetails", { ingredient: item })}
            onAddPress={() => ingredientStore.addIngredient(item)}
          />
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
});

export default ExploreScreen;
```

---

### **Food Details Screen**
Displays detailed information and nutrition facts.

```javascript
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { fetchNutritionInfo } from "../api/nutritionApi";

const FoodDetailsScreen = ({ route }) => {
  const { ingredient } = route.params;
  const [nutritionInfo, setNutritionInfo] = useState(null);

  useEffect(() => {
    const loadNutritionInfo = async () => {
      const data = await fetchNutritionInfo(ingredient.name);
      setNutritionInfo(data);
    };
    loadNutritionInfo();
  }, [ingredient]);

  return (
    <View>
      <Text>{ingredient.name}</Text>
      {nutritionInfo ? (
        <Text>Calories: {nutritionInfo.calories}</Text>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
};

export default FoodDetailsScreen;
```

---

## Next Steps

1. Add animations for button interactions.
2. Style components to match the design mockups.
3. Use the nutrition API to dynamically fetch ingredient details.
4. Implement validation for scheduling and confirming pickups.

Let me know if you need further refinements!

