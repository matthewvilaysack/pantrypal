## Database Schema for Aggregating User Preferences in Groups

This schema allows users to join groups, and their preferences (allergies and foods to avoid) will be aggregated for the group.

### **1. Create `groups` Table**
This table stores information about groups.

```sql
CREATE TABLE groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **2. Create `group_membership` Table**
This table links users to groups (many-to-many relationship).

```sql
CREATE TABLE group_membership (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_preferences(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id) -- Ensures a user can only join a group once
);
```

---

### **3. Create a View for Aggregating Preferences**
This view aggregates `foods_to_avoid` and `allergies` for each group by combining the preferences of all its members.

```sql
CREATE VIEW group_preferences AS
WITH expanded_allergies AS (
    SELECT
        gm.group_id,
        jsonb_array_elements_text(up.allergies) AS allergy
    FROM
        group_membership gm
    JOIN
        user_preferences up ON gm.user_id = up.user_id
),
expanded_foods_to_avoid AS (
    SELECT
        gm.group_id,
        jsonb_array_elements_text(up.foods_to_avoid) AS food
    FROM
        group_membership gm
    JOIN
        user_preferences up ON gm.user_id = up.user_id
)
SELECT
    gm.group_id,
    g.name AS group_name,
    ARRAY_AGG(DISTINCT gm.user_id) AS user_ids,
    ARRAY_AGG(DISTINCT ea.allergy) AS aggregated_allergies,
    ARRAY_AGG(DISTINCT efa.food) AS aggregated_foods_to_avoid
FROM
    group_membership gm
JOIN
    groups g ON gm.group_id = g.id
LEFT JOIN
    expanded_allergies ea ON gm.group_id = ea.group_id
LEFT JOIN
    expanded_foods_to_avoid efa ON gm.group_id = efa.group_id
GROUP BY
    gm.group_id, g.name;
```

---

### **Explanation**

1. **`groups` Table**:
   - Stores group metadata (e.g., `name`, `description`).

2. **`group_membership` Table**:
   - Establishes the many-to-many relationship between `users` and `groups`.
   - Links `user_id` from `user_preferences` to `group_id`.

3. **`group_preferences` View**:
   - Aggregates `user_id`, `foods_to_avoid`, and `allergies` for each group.
   - Uses `ARRAY_AGG` with `DISTINCT` to aggregate unique values.

---

### **Example Data Flow**

#### Insert Data

```sql
-- Add a group
INSERT INTO groups (id, name) VALUES ('group-id-1', 'Family Group');

-- Add users to user_preferences
INSERT INTO user_preferences (
    user_id, first_name, last_name, age, location, family_size, allergies, foods_to_avoid, onboarding_completed
)
VALUES
('user-id-1', 'John', 'Doe', 30, 'NY', '{"adults": 2}'::jsonb, '["Peanuts", "Dairy"]'::jsonb, '["Pork"]'::jsonb, true),
('user-id-2', 'Jane', 'Smith', 25, 'CA', '{"adults": 1}'::jsonb, '["Dairy", "Gluten"]'::jsonb, '["Seafood"]'::jsonb, true);

-- Add users to the group
INSERT INTO group_membership (group_id, user_id) VALUES
('group-id-1', 'user-id-1'),
('group-id-1', 'user-id-2');
```

#### Query the Aggregated Preferences

```sql
SELECT * FROM group_preferences WHERE group_id = 'group-id-1';
```

#### Result

| group_id    | group_name    | user_ids              | aggregated_allergies    | aggregated_foods_to_avoid |
|-------------|---------------|-----------------------|--------------------------|---------------------------|
| group-id-1  | Family Group  | ["user-id-1", "user-id-2"] | ["Peanuts", "Dairy", "Gluten"] | ["Pork", "Seafood"]       |

---

### **Notes**

1. **UUID Generation**:
   Ensure `uuid-ossp` extension is enabled in the database for UUID generation:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **JSONB Handling**:
   - Use `jsonb_array_elements_text` to expand JSON arrays for aggregation.

Let me know if you have further questions or need additional tweaks!
