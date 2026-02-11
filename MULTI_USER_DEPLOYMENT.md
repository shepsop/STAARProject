# Multi-User Deployment Guide

This guide explains how to set up the STAAR Quest app with multi-user support and deploy it to Azure.

## Overview of Changes

The app has been updated to support multiple users with secure authentication:

- **User Registration/Login**: Parents or teachers can create student accounts
- **Secure Passwords**: Passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based API authentication
- **User Isolation**: Each user's data is securely isolated in Cosmos DB
- **Session Management**: Users can log in/out on any device

## Architecture

### Backend Components

1. **Authentication Endpoints**
   - `POST /api/register` - Create new user account
   - `POST /api/login` - Authenticate user and get JWT token
   - `GET /api/user/<user_id>` - Get user progress (requires valid token)
   - `POST /api/user/<user_id>/progress` - Update user progress (requires valid token)

2. **Data Storage**
   - **In-Memory**: For local development (fallback)
   - **Azure Cosmos DB**: For production with user data isolation per user_id

3. **Security Features**
   - Password hashing with bcrypt
   - JWT token validation on protected endpoints
   - Token expiration (7 days default)
   - User data isolation by partition key

### Frontend Components

1. **New Pages**
   - `Login.js` - User login with username/password
   - `Register.js` - New user registration
   - `Auth.css` - Styling for authentication pages

2. **Updated Components**
   - `App.js` - Manages authentication state and token
   - Includes automatic logout on token expiration
   - Shows username in header
   - Redirects to login if not authenticated

## Local Development Setup

### 1. Install Dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create `.env` file in backend directory:
```
JWT_SECRET_KEY=dev-key-change-in-production
FLASK_ENV=development
DEBUG=True
```

Create `.env.local` file in frontend directory:
```
REACT_APP_API_URL=http://localhost:8000
```

### 3. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
cd frontend
npm start
```

Visit http://localhost:3000 and create a test account.

## Testing Multi-User Setup

1. Register first student:
   - Username: `student1`
   - Password: `test1234`
   
2. Play a few questions and earn points

3. Logout (click logout button in header)

4. Register second student:
   - Username: `student2`
   - Password: `test1234`

5. Verify they have separate progress and points

6. Log back in as student1 to verify their data is preserved

## Azure Deployment

### Prerequisites

- Azure Account with Cosmos DB enabled
- Azure App Service with Docker/Python support
- Azure CLI installed locally

### Step 1: Create Azure Resources

```bash
# Set variables
RESOURCE_GROUP="staar-resources"
LOCATION="eastus"
COSMOS_ACCOUNT="staar-cosmos-$(date +%s)"
APP_NAME="staar-quest-app"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Cosmos DB Account
az cosmosdb create \
  --resource-group $RESOURCE_GROUP \
  --name $COSMOS_ACCOUNT \
  --kind GlobalDocumentDB \
  --default-consistency-level Session \
  --locations regionName=$LOCATION failoverPriority=0

# Get connection details
az cosmosdb keys list \
  --resource-group $RESOURCE_GROUP \
  --name $COSMOS_ACCOUNT \
  --type connection-strings
```

### Step 2: Create Cosmos DB Database and Containers

```bash
# Create database
az cosmosdb sql database create \
  --resource-group $RESOURCE_GROUP \
  --account-name $COSMOS_ACCOUNT \
  --name staar

# Create users container
az cosmosdb sql container create \
  --resource-group $RESOURCE_GROUP \
  --account-name $COSMOS_ACCOUNT \
  --database-name staar \
  --name users \
  --partition-key-path "/user_id"

# Create auth_users container
az cosmosdb sql container create \
  --resource-group $RESOURCE_GROUP \
  --account-name $COSMOS_ACCOUNT \
  --database-name staar \
  --name auth_users \
  --partition-key-path "/username"
```

### Step 3: Create App Service

```bash
# Create service plan
az appservice plan create \
  --name staar-plan \
  --resource-group $RESOURCE_GROUP \
  --sku B2 \
  --is-linux

# Create web app
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan staar-plan \
  --name $APP_NAME \
  --runtime "PYTHON|3.11"

# Configure Git deployment
az webapp deployment source config-local-git \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME
```

### Step 4: Set Environment Variables

Get your Cosmos DB connection string and set app settings:

```bash
# Get Cosmos connection string
COSMOS_ENDPOINT=$(az cosmosdb show \
  --resource-group $RESOURCE_GROUP \
  --name $COSMOS_ACCOUNT \
  --query documentEndpoint -o tsv)

COSMOS_KEY=$(az cosmosdb keys list \
  --resource-group $RESOURCE_GROUP \
  --name $COSMOS_ACCOUNT \
  --query primaryMasterKey -o tsv)

# Generate JWT secret
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Set app settings
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    JWT_SECRET_KEY="$JWT_SECRET" \
    COSMOS_ENDPOINT="$COSMOS_ENDPOINT" \
    COSMOS_KEY="$COSMOS_KEY" \
    COSMOS_DATABASE="staar" \
    COSMOS_CONTAINER="users" \
    FLASK_ENV="production" \
    DEBUG="False"
```

### Step 5: Build and Deploy

```bash
# Build Docker image for deployment
docker build -t staar-quest:latest .

# Login to Azure Container Registry (if using)
az acr login --name <registry-name>

# Tag and push image
docker tag staar-quest:latest <registry-name>.azurecr.io/staar-quest:latest
docker push <registry-name>.azurecr.io/staar-quest:latest

# Deploy to App Service
az webapp deployment container config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name <registry-name>.azurecr.io/staar-quest:latest \
  --docker-registry-server-url https://<registry-name>.azurecr.io

# Or use Git deployment
git config user.email "your-email@example.com"
git config user.name "Your Name"
git remote add azure <git-clone-url-from-azure>
git branch -M main
git push azure main
```

### Step 6: Verify Deployment

```bash
# Check app status
az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME

# View logs
az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME

# Test health check
curl https://$APP_NAME.azurewebsites.net/api/health
```

## Monitoring and Maintenance

### Check Cosmos DB Usage

```bash
# List all containers
az cosmosdb sql container list \
  --resource-group $RESOURCE_GROUP \
  --account-name $COSMOS_ACCOUNT \
  --database-name staar

# Monitor RU consumption
az monitor metrics list \
  --resource /subscriptions/{subscriptionId}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DocumentDb/databaseAccounts/$COSMOS_ACCOUNT \
  --metric "NormalizedRUConsumption"
```

### Scaling

For production with many users, scale Cosmos DB:

```bash
# Scale RUs (Request Units)
az cosmosdb sql database throughput update \
  --resource-group $RESOURCE_GROUP \
  --account-name $COSMOS_ACCOUNT \
  --name staar \
  --throughput 10000
```

## Troubleshooting

### Users see "Invalid token" error

- Check JWT_SECRET_KEY matches between deployments
- Verify Cosmos DB credentials are correct
- Check App Service logs: `az webapp log tail ...`

### Cosmos DB connection errors

- Verify COSMOS_ENDPOINT and COSMOS_KEY are set correctly
- Check firewall rules in Cosmos DB (allow App Service IP)
- Ensure containers are created with correct partition keys

### Users can't register

- Check /api/register returns 201 status
- Verify auth_users container exists in Cosmos DB
- Check app logs for bcrypt errors

## Database Schema

### Users Container

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "username": "student1",
  "total_points": 1250,
  "current_level": 3,
  "streak_days": 5,
  "longest_streak": 14,
  "questions_answered": 47,
  "correct_answers": 42,
  "badges": [...],
  "last_played": "2025-02-11T15:30:00Z",
  "last_played_date": "2025-02-11",
  "perfect_games": 2,
  "subjects_completed": {"math": 8, "reading": 5},
  "created_at": "2025-02-01T10:00:00Z"
}
```

### Auth Users Container

```json
{
  "id": "student1",
  "username": "student1",
  "password_hash": "bcrypt_hash",
  "user_id": "uuid",
  "created_at": "2025-02-01T10:00:00Z"
}
```

## Security Considerations

1. **HTTPS Only**: Azure App Service enforces HTTPS by default ✓

2. **Password Security**:
   - Passwords hashed with bcrypt (10 rounds)
   - Never stored in plain text
   - Never transmitted without HTTPS

3. **JWT Tokens**:
   - 7-day expiration
   - Refresh token rotation recommended for long-term

4. **Cosmos DB**:
   - Partition by user_id for isolation
   - Network rules to restrict access
   - Encryption at rest enabled by default

5. **Recommendations**:
   - Rotate JWT_SECRET_KEY periodically
   - Use Azure Key Vault for secrets
   - Enable Cosmos DB backup
   - Monitor unusual login patterns
   - Implement rate limiting for login attempts

## Next Steps

1. ✅ Implementation complete - multi-user authentication added
2. ✅ Cosmos DB integration - ready for Azure
3. 📋 Test in local development
4. 📋 Deploy to Azure following Step 1-6
5. 📋 Monitor user adoption and scaling needs
6. 📋 Implement additional features:
   - Email verification
   - Parent account linking
   - Password reset via email
   - Admin dashboard for teachers
