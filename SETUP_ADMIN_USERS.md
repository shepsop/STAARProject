# Setting Up Admin Users

## Overview

Admin users have access to the Admin Dashboard where they can reset user passwords, grant admin privileges to others, and view audit logs of all admin actions.

## Methods to Create/Enable Admin Users

### Method 1: Direct Database Update (Cosmos DB)

**For Azure Cosmos DB:**

1. Go to Azure Portal → Your Cosmos DB Account
2. Navigate to "Data Explorer"
3. Find the "auth_users" container
4. Locate the user record you want to make admin
5. Edit the JSON document and add: `"is_admin": true`
6. Save the changes

**Example document:**
```json
{
  "id": "username",
  "username": "username",
  "password_hash": "hashed_password_here",
  "user_id": "uuid-here",
  "is_admin": true,  // <-- Add this line
  "created_at": "2026-02-12T10:00:00"
}
```

### Method 2: Direct Database Update (In-Memory)

If you're using in-memory storage (development), you'll need to:

1. Stop the application
2. Edit the backend code to add admin user creation on startup
3. Or use the admin endpoint (see Method 4)

### Method 3: Bootstrap Script (Recommended for First Admin)

Create a `backend/bootstrap_admin.py` script:

```python
#!/usr/bin/env python3
"""Bootstrap script to create the first admin user"""
import os
import sys
from app import (
    cosmos_enabled, cosmos_users_container, auth_users_data, 
    hash_password, save_auth_user
)
import uuid

# Initialize Cosmos if needed
if cosmos_enabled:
    from app import init_cosmos
    init_cosmos()

def create_admin_user(username, password):
    """Create an admin user"""
    # Check if user exists
    if cosmos_enabled and cosmos_users_container:
        try:
            existing = cosmos_users_container.read_item(item=username, partition_key=username)
            print(f"❌ User '{username}' already exists!")
            return False
        except:
            pass
    else:
        if username in auth_users_data:
            print(f"❌ User '{username}' already exists!")
            return False
    
    # Create admin user
    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    
    try:
        save_auth_user(username, password_hash, user_id, is_admin=True)
        print(f"✅ Admin user '{username}' created successfully!")
        print(f"   User ID: {user_id}")
        print(f"   Password: {password}")
        return True
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python bootstrap_admin.py <username> <password>")
        print("Example: python bootstrap_admin.py admin password123")
        sys.exit(1)
    
    username = sys.argv[1].lower()
    password = sys.argv[2]
    
    if len(username) < 3:
        print("❌ Username must be at least 3 characters")
        sys.exit(1)
    
    if len(password) < 4:
        print("❌ Password must be at least 4 characters")
        sys.exit(1)
    
    create_admin_user(username, password)
```

**Usage:**
```bash
cd backend
python bootstrap_admin.py myusername mypassword
```

### Method 4: Using Admin Endpoint (Once You Have One Admin)

Once you have one admin user, they can grant admin privileges to others:

```bash
curl -X POST http://localhost:8000/api/admin/make-admin \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"username": "new_admin_username"}'
```

## Verification Steps

### Verify Admin Status via API

```bash
# After logging in as the admin user, you'll get a JWT token
# Use that token in this call:

curl -X GET http://localhost:8000/api/admin/check \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Response should show:
# {
#   "is_admin": true,
#   "user_id": "uuid...",
#   "username": "admin_username"
# }
```

### Verify Admin Access in UI

1. Log in with the admin account
2. Look for the **🔐 Admin** button in the top navigation bar
3. Click it to access the Admin Dashboard
4. Verify you can see the User Management tab

## Troubleshooting

### Admin button not appearing
- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Verify `is_admin` field is `true` (not `"true"` as a string) in database
- Log out and log back in
- Check browser console for errors (F12)

### Unable to call admin endpoints
- Verify JWT token is valid and hasn't expired
- Verify user's `is_admin` field is `true` in database
- Check that the Authorization header format is correct: `Authorization: Bearer <token>`

### Password reset endpoint returns 403 Forbidden
- User doesn't have admin privileges
- JWT token is expired
- User is trying to reset their own password (use change password instead)

## Production Deployment

For Azure App Service deployment:

1. **Create first admin before deploying**
   - Use Method 1 or 3 above
   - Test locally first

2. **After deployment**
   - First admin can use the UI to grant privileges to others
   - Use the Admin Dashboard for user management
   - Monitor audit logs regularly

3. **Security recommendations**
   - Change JWT_SECRET_KEY in Azure App Service settings
   - Store admin password securely
   - Limit the number of admin users
   - Review audit logs regularly

## Database Queries

### Check Who Is Admin (Cosmos DB)

```sql
SELECT c.username, c.is_admin FROM c WHERE c.is_admin = true
```

### View All Admin Actions

```sql
SELECT * FROM c ORDER BY c.timestamp DESC
```

### Check Recent Admin Actions for Specific User

```sql
SELECT * FROM c WHERE c.target_user = "student_username"
```

---

For more information, see:
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Admin user guide
- [ADMIN_IMPLEMENTATION.md](ADMIN_IMPLEMENTATION.md) - Implementation details
- [README.md](README.md) - General project information
