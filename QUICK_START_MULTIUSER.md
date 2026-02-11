# Quick Start - Multi-User Testing

This guide helps you quickly test the new multi-user authentication system locally.

## What's New?

- ✅ User registration/login system
- ✅ Secure password hashing with bcrypt
- ✅ JWT token authentication
- ✅ User data isolation
- ✅ Ready for Azure Cosmos DB

## 1. Setup Backend

```bash
cd backend

# If you haven't already, create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install updated requirements (includes bcrypt and PyJWT)
pip install -r requirements.txt

# Create .env file for local development
cat > .env << EOF
JWT_SECRET_KEY=dev-secret-key-local-only
FLASK_ENV=development
DEBUG=True
EOF

# Run backend
python app.py
```

The backend will start on `http://localhost:8000`

## 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
REACT_APP_API_URL=http://localhost:8000
EOF

# Start development server
npm start
```

The frontend will open at `http://localhost:3000`

## 3. Test Multi-User Flows

### Create First Student Account

1. Click "Create New Account"
2. Enter:
   - Username: `student_emily`
   - Password: `test1234`
3. Click "Create Account"
4. You're now logged in as Emily

### Play Some Questions

1. Click "Math" to select subject
2. Click "Level 1" to start
3. Answer 2-3 questions correctly to earn points
4. Watch the points appear in header

### Create Second Student Account

1. Click "Logout" button in header (top right)
2. Click "Create New Account"
3. Enter:
   - Username: `student_marcus`
   - Password: `test1234`
4. Play questions to earn different points

### Verify Data Isolation

1. Log out as Marcus
2. Log in as Emily with username `student_emily`
3. Verify Emily's points are preserved
4. Switch back to Marcus - his points should be different

## 4. Test Login/Logout

1. Logout
2. Click account menu or type username from before
3. Log back in with same credentials
4. Your progress should be restored

## 5. Test Error Handling

### Invalid Login
- Try username: `fake_user`, password: `wrong`
- Should show error: "Invalid username or password"

### Weak Password
- Try registering with username: `test`, password: `ab`
- Should show error: "Password must be at least 4 characters"

### Username Exists
- Try registering with username: `student_emily`
- Should show error: "Username already exists"

## 6. Check Backend Logs

Watch the backend terminal to see:
- Registration requests
- Login attempts
- User progress updates
- JWT token validation

Example log output:
```
 * Running on http://0.0.0.0:8000
127.0.0.1 - - [11/Feb/2025 15:30:45] "POST /api/register HTTP/1.1" 201 -
127.0.0.1 - - [11/Feb/2025 15:30:50] "POST /api/login HTTP/1.1" 200 -
127.0.0.1 - - [11/Feb/2025 15:30:52] "GET /api/user/uuid... HTTP/1.1" 200 -
```

## 7. Local Data Storage

During development, user data is stored in memory (not persisted between restarts):

- `backend/app.py` has `users_data = {}` dictionary
- Data resets when you restart the backend
- For persistence, configure Cosmos DB (see MULTI_USER_DEPLOYMENT.md)

## Common Issues

### "Failed to connect to API"
- Is backend running on port 8000?
- Check: `curl http://localhost:8000/api/health`

### "Invalid token" error
- Try logging out and logging back in
- Clear browser localStorage: Dev Tools > Application > localStorage > Delete

### Password hashing errors
- Make sure bcrypt is installed: `pip install bcrypt`
- Restart backend after installing dependencies

### Cosmos DB errors (when configured)
- This is expected if COSMOS_ENDPOINT not set
- App automatically falls back to in-memory storage
- See logs: "Cosmos DB not available, using in-memory storage"

## Next Steps

1. ✅ Test local multi-user flows
2. ✅ Verify login/logout works
3. ✅ Check data isolation
4. 📋 Follow MULTI_USER_DEPLOYMENT.md for Azure setup
5. 📋 Configure Cosmos DB for production persistence

## Test Data Reset

To reset all test data and start fresh:

```bash
# Just restart the backend - it clears in-memory storage
# Ctrl+C to stop the server
python app.py  # Starts fresh with no users
```
