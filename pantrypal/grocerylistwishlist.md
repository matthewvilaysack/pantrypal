# Database Schema Blueprint

## Overview
This schema defines two tables:
1. **`user_ingredients`**: Stores the ingredients that a user has added to their grocery list.
2. **`user_wishlist`**: Stores the items that a user has added to their wishlist.

Both tables reference the `profiles` table for user data and the `ingredients` table for product details.

---

## Table: `user_ingredients`
This table tracks ingredients added by a user to their grocery list.

```sql
CREATE TABLE IF NOT EXISTS user_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,                -- Unique identifier for each entry
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- References the user from the profiles table
    product_id UUID NOT NULL REFERENCES ingredients(product_id) ON DELETE CASCADE, -- References the product from the ingredients table
    quantity INT NOT NULL DEFAULT 1,                             -- Quantity requested by the user
    name TEXT NOT NULL,                                           -- Name of the ingredient
    category TEXT,                                                -- Category of the ingredient (e.g., vegetable, fruit, etc.)
    description TEXT,                                             -- Detailed description of the ingredient
    nutrition JSONB,                                              -- JSON object storing nutritional information
    image_url TEXT,                                               -- URL of the ingredient image (optional)
    created_at TIMESTAMP DEFAULT NOW()                            -- Timestamp for when the record was created
);
```

---

## Table: `user_wishlist`
This table tracks items that a user has added to their wishlist.

```sql
CREATE TABLE IF NOT EXISTS user_wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,                -- Unique identifier for each entry
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- References the user from the profiles table
    product_id UUID NOT NULL REFERENCES ingredients(product_id) ON DELETE CASCADE, -- References the product from the ingredients table
    quantity INT NOT NULL DEFAULT 1,                             -- Quantity the user wishes to add to their wishlist
    name TEXT NOT NULL,                                           -- Name of the ingredient
    category TEXT,                                                -- Category of the ingredient (e.g., vegetable, fruit, etc.)
    description TEXT,                                             -- Detailed description of the ingredient
    nutrition JSONB,                                              -- JSON object storing nutritional information
    image_url TEXT,                                               -- URL of the ingredient image (optional)
    created_at TIMESTAMP DEFAULT NOW()                            -- Timestamp for when the record was created
);
```

---

## Relationships
- **`user_id`**: Links to the `profiles` table, representing the user.
- **`product_id`**: Links to the `ingredients` table, representing the product.

---

## Notes
1. **Data Integrity**: Cascade deletes ensure that if a user or product is deleted, the associated records in `user_ingredients` and `user_wishlist` are also removed.
2. **Optional Fields**:
   - `image_url` is optional and can be null.
3. **Default Values**:
   - `quantity` defaults to `1` but can be updated as needed.

This schema is designed to handle user-specific interactions with ingredients efficiently while maintaining strong relationships between tables.

