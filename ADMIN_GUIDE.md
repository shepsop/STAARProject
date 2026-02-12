# Admin Password Reset & User Management Guide

This guide explains how to use the administrator functions in STAAR Quest to reset user passwords and manage system administration.

## 📋 Table of Contents

1. [Accessing the Admin Dashboard](#accessing-the-admin-dashboard)
2. [Admin Panel Features](#admin-panel-features)
3. [Resetting User Passwords](#resetting-user-passwords)
4. [Granting Admin Privileges](#granting-admin-privileges)
5. [Viewing Audit Logs](#viewing-audit-logs)
6. [Security Considerations](#security-considerations)

## Accessing the Admin Dashboard

### For Admin Users

1. **Log in** to your STAAR Quest account
2. Look for the **🔐 Admin** button in the top navigation bar (only visible to admin users)
3. Click the button to access the Admin Dashboard

### Making a User an Admin

Admin privileges must be granted by someone who already has admin status. Contact your system administrator to grant admin privileges to a new user.

## Admin Panel Features

The Admin Dashboard has two main tabs:

### 1. 👥 User Management
- View all registered users
- Search users by username
- View detailed user information and progress stats
- Reset user passwords
- Grant admin privileges to other users

### 2. 📋 Audit Logs
- View all admin actions performed on the system
- See who performed each action and when
- Track password resets, admin privilege grants, and other admin activities

## Resetting User Passwords

### Step-by-Step Instructions

1. Go to the **User Management** tab in the Admin Dashboard
2. Use the search box to find the user whose password you want to reset
3. Click on the user's card to select them
4. A details panel will appear on the right side
5. Scroll to the "Reset Password" section
6. Enter a new temporary password (minimum 4 characters)
7. Click the **🔑 Reset Password** button
8. Confirm the success message

### Important Notes

- **Inform the user**: Let the user know their new temporary password through a secure channel
- **Security**: The temporary password should be changed by the user on their first login
- **Audit trail**: All password resets are logged in the Audit Logs tab with admin name and timestamp
- **Your own password**: Use the change password feature in your user profile, not this admin tool

## Granting Admin Privileges

### How to Grant Admin Privileges

1. In the **User Management** tab, search for and select the user
2. In the user's details panel, scroll down
3. If the user is not already an admin, you'll see the **👑 Grant Admin Privileges** button
4. Click the button and confirm when prompted
5. The user will now have access to the Admin Dashboard on their next login

### Before Granting Admin Access

Consider:
- Does this person need admin access to perform their role?
- Have you verified their identity and trustworthiness?
- Do you want to restrict admin access to certain functions?

## Viewing Audit Logs

### Understanding the Audit Logs

The **📋 Audit Logs** tab shows all administrative actions performed on the system:

**Log Entries Include:**
- 🔑 **password_reset**: When an admin resets a user's password
- 👑 **grant_admin**: When admin privileges are granted to a user
- Timestamp of when the action occurred
- Which admin performed the action
- The target user affected by the action

### Using Audit Logs for Accountability

- **Review regularly**: Check logs periodically to ensure proper system usage
- **Investigate anomalies**: Look for unexpected password resets or privilege grants
- **Compliance**: Keep records of all admin actions for compliance purposes
- **Refresh logs**: Click the **🔄 Refresh Logs** button to see the latest entries

## Security Considerations

### Best Practices

1. **Strong Admin Passwords**
   - Use a complex, unique password for your admin account
   - Change your password regularly
   - Never share your admin credentials with anyone

2. **Password Reset Policy**
   - Only reset passwords when absolutely necessary
   - Always inform users of password changes through a secure channel
   - Ask users to change temporary passwords on first login
   - Never reset your own password using the admin tool

3. **Audit Trail Review**
   - Regularly review the audit logs
   - Document why password resets were necessary
   - Investigate suspicious activity
   - Keep records for at least 30 days

4. **Admin Access Control**
   - Limit the number of admin users
   - Only grant admin privileges to trusted individuals
   - Revoke admin privileges when no longer needed
   - Rotate admin responsibilities periodically

5. **Data Protection**
   - Never share system logs or audit trails with unauthorized users
   - Protect your admin credentials as you would protect sensitive data
   - Use HTTPS/SSL in production environments
   - Keep your session secure and log out when finished

### Compliance & Legal

- **FERPA Compliance** (if handling student data):
  - Only access student records for legitimate educational purposes
  - Keep detailed audit trails
  - Ensure data privacy and security
  - Follow school district policies

- **COPPA Compliance** (if students are under 13):
  - Obtain proper parental consent
  - Implement strict data protection measures
  - Limit data collection and retention
  - Provide transparency to parents/guardians

## Troubleshooting

### "Admin privileges required" Error
- Your account doesn't have admin status
- Contact your system administrator to request admin access

### Password Reset Failed
- Ensure the username is spelled correctly
- The new password must be at least 4 characters
- Check your internet connection

### User Not Found
- Verify the exact spelling of the username
- The user account may have been deleted
- Try refreshing the user list

### Audit Logs Not Showing
- Initial system setup may not have any logs yet
- Click the **🔄 Refresh Logs** button to load the latest entries
- Logs are limited to the most recent 50 actions

## API Reference (for developers)

### Admin Endpoints

All admin endpoints require an `Authorization` header with a valid JWT token from an admin user.

**List All Users:**
```
GET /api/admin/users?limit=100
```

**Get User Details:**
```
GET /api/admin/user/<username>
```

**Reset User Password:**
```
POST /api/admin/reset-password
Content-Type: application/json
{
  "username": "student_username",
  "new_password": "temporaryPassword123"
}
```

**Grant Admin Privileges:**
```
POST /api/admin/make-admin
Content-Type: application/json
{
  "username": "target_username"
}
```

**Get Audit Logs:**
```
GET /api/admin/audit-logs?limit=50
```

**Check Admin Status:**
```
GET /api/admin/check
```

---

## Support & Questions

For more information about user management or security concerns:
1. Review this guide again
2. Check the main [README.md](README.md)
3. Contact your system administrator
4. Review [QUICK_START.md](QUICK_START.md) for general app usage

---

**Remember**: With great power comes great responsibility. Use admin privileges wisely and always prioritize user privacy and security! 🔐
