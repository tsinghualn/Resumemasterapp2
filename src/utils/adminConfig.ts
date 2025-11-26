/**
 * Admin detection using database role
 * Role is fetched from the backend and stored in currentUser object
 * 
 * Setup Instructions:
 * 1. Add 'role' column to users table: ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
 * 2. Set your user as admin: UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
 * 3. Update backend to return role in /users/me endpoint
 * 4. Restart dev server and sign in
 * 
 * See DATABASE_ADMIN_SETUP.md for detailed instructions
 */

/**
 * Check if a user object has admin role
 * @param user - The user object from currentUser state (should include role property)
 * @returns true if the user has admin role from database
 */
export function isAdminUser(user: any): boolean {
  if (!user) return false;
  
  // Check if user has role property and it's 'admin'
  return user.role === 'admin';
}

