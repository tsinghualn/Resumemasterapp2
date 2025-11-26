# Database Admin Role Setup Guide

## Overview
This guide sets up admin role detection using a `role` column in your Supabase `users` table.

## Step-by-Step Setup

### Step 1: Add Role Column to Database

**Option A: Using Supabase Dashboard (Easiest)**

1. Go to: https://supabase.com/dashboard/project/jajntwuahdycjwmejdww
2. Click **Table Editor** in left sidebar
3. Find and open the **`users`** table
4. Click **Add Column** (or the + icon)
5. Configure the new column:
   - **Name:** `role`
   - **Type:** `text`
   - **Default Value:** `'user'`
   - **Nullable:** ✅ No (uncheck)
6. Click **Save**

**Option B: Using SQL Editor**

1. Go to: https://supabase.com/dashboard/project/jajntwuahdycjwmejdww
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Paste this SQL:

```sql
-- Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;

-- Add a check constraint to ensure only valid roles
ALTER TABLE users 
ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin'));

-- Create an index for faster role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add comment for documentation
COMMENT ON COLUMN users.role IS 'User role: user (default) or admin';
```

5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see: "Success. No rows returned"

### Step 2: Set Your User as Admin

**Find your user ID and email:**

```sql
-- Find your user
SELECT id, email, username, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

**Set yourself as admin:**

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, username, role 
FROM users 
WHERE email = 'your-email@example.com';
```

You should see your role is now `'admin'`.

### Step 3: Update Backend to Return Role

**File:** `src/supabase/functions/server/index.tsx`

Find the `/make-server-bc1c5df9/users/me` endpoint (around line 85-130) and update it:

**Find this:**
```typescript
app.get("/make-server-bc1c5df9/users/me", async (c) => {
  const authResult = await verifyUser(c.req.header('Authorization'));
  
  if (authResult.error) {
    return c.json({ error: authResult.error }, 401);
  }
  
  const user = authResult.user;
  
  // Fetch user profile from database
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('username, email, id')
    .eq('id', user.id)
    .single();
  
  // ... rest of code
});
```

**Update to:**
```typescript
app.get("/make-server-bc1c5df9/users/me", async (c) => {
  const authResult = await verifyUser(c.req.header('Authorization'));
  
  if (authResult.error) {
    return c.json({ error: authResult.error }, 401);
  }
  
  const user = authResult.user;
  
  // Fetch user profile from database INCLUDING ROLE
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('username, email, id, role')  // ← Added 'role' here
    .eq('id', user.id)
    .single();
  
  // ... rest of code stays the same
});
```

### Step 4: Update Frontend Admin Detection

**File:** `src/utils/adminConfig.ts`

Replace the entire file with:

```typescript
/**
 * Admin detection using database role
 * Role is fetched from the backend and stored in currentUser object
 */

/**
 * Check if a user object has admin role
 * @param user - The user object from currentUser state
 * @returns true if the user has admin role
 */
export function isAdminUser(user: any): boolean {
  if (!user) return false;
  
  // Check if user has role property and it's 'admin'
  return user.role === 'admin';
}

// No need for ADMIN_EMAILS array anymore!
```

**File:** `src/App.tsx`

Find the admin detection (around line 135) and update:

**Find this:**
```typescript
// Determine if current user is admin
const isAdmin = isAdminUser(currentUser?.email);
```

**Update to:**
```typescript
// Determine if current user is admin (checks role from database)
const isAdmin = isAdminUser(currentUser);
```

That's it! The `isAdminUser` function now checks `currentUser.role` instead of matching email addresses.

### Step 5: Test Everything

1. **Restart your dev server:**
```bash
# Press Ctrl+C in terminal to stop
npm run dev
```

2. **Clear browser cache and refresh:** http://localhost:3000

3. **Sign out if logged in**

4. **Sign in with your admin email**

5. **Check the header:**
   - Should see **"Admin"** badge next to your email
   - Should see **"AI Analysis Running..."** if analysis is active

6. **Check browser console (F12):**
```
🔍 Admin detected - polling for feedback analysis status
```

### Step 6: Verify Role is Being Returned

Open browser console (F12) after signing in and check:

```javascript
// The currentUser object should now have a 'role' property
console.log('Current user:', currentUser);
// Should show: { email: '...', username: '...', role: 'admin', ... }
```

---

## 🎯 Benefits of Database Role Approach

✅ **Scalable** - Easy to add/remove admins without code changes  
✅ **Flexible** - Can add more roles (moderator, editor, etc.)  
✅ **Secure** - Role stored in database, not hardcoded  
✅ **Auditable** - Can query who has admin access  
✅ **Professional** - Industry standard approach  

---

## 🔐 Security Best Practices

### Row Level Security (RLS)

Add RLS policy to prevent regular users from changing their own role:

```sql
-- Only allow users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Only allow users to update their own data EXCEPT role
CREATE POLICY "Users can update own data except role" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (role = (SELECT role FROM users WHERE id = auth.uid()))
  );

-- Only admins can update any user's role
CREATE POLICY "Admins can update any user role" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

---

## 🛠️ Managing Admins

### Promote User to Admin
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'new-admin@example.com';
```

### Demote Admin to Regular User
```sql
UPDATE users 
SET role = 'user' 
WHERE email = 'former-admin@example.com';
```

### List All Admins
```sql
SELECT id, email, username, role, created_at 
FROM users 
WHERE role = 'admin' 
ORDER BY created_at;
```

### Count Users by Role
```sql
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;
```

---

## 🧪 Testing Checklist

- [ ] Added `role` column to `users` table
- [ ] Set your user as admin in database
- [ ] Verified your role is 'admin' in database
- [ ] Updated backend to return role
- [ ] Updated `adminConfig.ts` to check role
- [ ] Updated `App.tsx` to pass user object instead of email
- [ ] Restarted dev server
- [ ] Signed in and see "Admin" badge
- [ ] See "AI Analysis Running..." message
- [ ] Checked console shows admin detection
- [ ] Tested with non-admin user (should NOT see admin features)

---

## 🆘 Troubleshooting

### "Admin" badge not showing

**Check 1: Is role in database?**
```sql
SELECT email, role FROM users WHERE email = 'your-email@example.com';
```
Should show `role: admin`

**Check 2: Is backend returning role?**
Open Network tab (F12 → Network), look for `/users/me` request, check response:
```json
{
  "username": "...",
  "email": "...",
  "role": "admin"  ← Should be here
}
```

**Check 3: Is currentUser object updated?**
Console: `console.log(currentUser)` should show `role: 'admin'`

### Backend not returning role

Make sure you:
1. Added `role` to the SELECT query in server/index.tsx
2. Redeployed backend if using Figma Make
3. Cleared browser cache

### Role shows as 'user' instead of 'admin'

Run SQL again:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## 📊 Future Enhancements

### Multiple Roles
```sql
-- Add more role types
ALTER TABLE users DROP CONSTRAINT valid_role;
ALTER TABLE users ADD CONSTRAINT valid_role 
  CHECK (role IN ('user', 'admin', 'moderator', 'editor'));
```

### Role-Based Permissions
```typescript
// src/utils/permissions.ts
export const PERMISSIONS = {
  admin: ['view_analytics', 'manage_users', 'manage_feedback', 'trigger_analysis'],
  moderator: ['manage_feedback', 'view_analytics'],
  editor: ['manage_content'],
  user: []
};

export function hasPermission(user: any, permission: string): boolean {
  const userRole = user?.role || 'user';
  return PERMISSIONS[userRole]?.includes(permission) || false;
}
```

---

## ✅ Summary

You've now set up a **professional, database-driven admin role system**:

1. ✅ Role stored in database (scalable)
2. ✅ Backend returns role with user data
3. ✅ Frontend detects admin from role property
4. ✅ Easy to manage admins via SQL
5. ✅ Can add more roles in future

**No more hardcoded emails!** 🎉

---

**Questions or issues?** Check the troubleshooting section or the console logs.


