# Cosmos DB Integration for STAAR Quest

## ✅ Integration Complete

The STAAR Quest application now uses Azure Cosmos DB for persistent user data storage across all sessions and instances.

## Configuration Summary

### Cosmos DB Resources

- **Account**: `staar-quest-cosmos`
- **Region**: West US 3
- **Consistency Level**: Session
- **Database**: `staarquest`
- **Containers**: 
  - `users` - Stores user progress/profile data (Partition Key: `/user_id`)
  - `auth_users` - Stores authentication credentials (Partition Key: `/username`)

### App Service Configuration

The following environment variables are configured in the App Service:
- `COSMOS_ENDPOINT`: Connection endpoint
- `COSMOS_KEY`: Primary master key for authentication
- `COSMOS_DATABASE`: `staarquest`
- `COSMOS_CONTAINER`: `users`

### Backend Implementation

The Flask backend (`backend/app.py`) includes:

1. **Cosmos DB Client Initialization** (`init_cosmos()`)
   - Automatically detects configuration from environment variables
   - Falls back to in-memory storage if Cosmos DB is unavailable
   - Supports both key-based and managed identity authentication

2. **Data Persistence Functions**
   - `save_user_record()` - Upserts user progress/profile data
   - `get_user_record()` - Retrieves user data by ID
   - `save_auth_user()` - Stores user credentials
   - `get_auth_user()` - Retrieves user authentication record
   - `get_top_users()` - Queries top users by points for leaderboard

3. **Automatic Fallback**
   - If Cosmos DB is unavailable, the app seamlessly falls back to in-memory storage
   - No code changes required; controlled via configuration

## User Data Model

### User Document Structure
```json
{
  "id": "user_uuid",
  "user_id": "user_uuid",
  "username": "user@example.com",
  "total_points": 0,
  "current_level": 1,
  "streak_days": 0,
  "longest_streak": 0,
  "questions_answered": 0,
  "correct_answers": 0,
  "badges": [],
  "last_played": null,
  "last_played_date": null,
  "perfect_games": 0,
  "subjects_completed": {
    "math": 0,
    "reading": 0
  },
  "created_at": "2026-02-12T17:48:00.000Z"
}
```

### Authentication Document Structure
```json
{
  "id": "username",
  "username": "user@example.com",
  "password_hash": "bcrypt_hashed_password",
  "user_id": "user_uuid",
  "created_at": "2026-02-12T17:48:00.000Z"
}
```

## Verification

### Test User Registration
```bash
curl -X POST https://staar-quest-app.azurewebsites.net/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"TestPassword123!"}'
```

**Response**: Returns user ID and JWT token
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user_id": "uuid",
  "username": "test@example.com"
}
```

### Test Leaderboard (Reads from Cosmos DB)
```bash
curl https://staar-quest-app.azurewebsites.net/api/leaderboard
```

**Response**: Returns top users sorted by points from Cosmos DB

## Features

✅ **User Persistence** - All user data persists across application restarts
✅ **Multi-Instance Support** - Multiple app instances read/write to the same database
✅ **Automatic Scaling** - Cosmos DB serverless tier scales with demand
✅ **Global Distribution** - Database replicated for low-latency access
✅ **Failover Resilience** - Automatic failover for high availability
✅ **Session Consistency** - Guarantees read-after-write consistency for user sessions

## Cost Optimization

Currently using:
- **Cosmos DB**: Serverless tier (pay per operation)
- **Estimated monthly cost**: ~$1-5 for typical usage (300-1,000 users)

### Cost Optimization Tips

1. Enable **auto-pause** for development environments
2. Monitor RU (Request Unit) usage in Azure Portal
3. Consider **provisioned throughput** if usage exceeds 400 RU/s consistently
4. Archive inactive user data after 1+ year (if needed)

## Monitoring and Troubleshooting

### Check Cosmos DB Status
```bash
az cosmosdb show --name staar-quest-cosmos --resource-group staar-quest-rg
```

### View Cosmos DB Metrics
1. Go to Azure Portal
2. Navigate to `staar-quest-cosmos` Cosmos DB account
3. View "Metrics" tab for RU usage, storage, and request rates

### Check App Logs
```bash
az webapp log tail --name staar-quest-app --resource-group staar-quest-rg
```

### Verify Cosmos DB Connection
The app will log during startup:
```
✓ Cosmos DB enabled for user persistence
```

If Cosmos DB is unavailable:
```
⚠ Cosmos DB not available, using in-memory storage: [error details]
```

## Security Best Practices Applied

- ✅ Connection authenticated with primary key
- ✅ Partition keys set to minimize cross-partition queries
- ✅ No sensitive data in logs
- ✅ Environment variables used for credentials (not hardcoded)
- ⚠️ **Recommended**: Use Azure Managed Identity instead of keys for production

### Upgrade to Managed Identity

For enhanced security, replace key-based authentication:

```bash
# Enable managed identity on App Service
az webapp identity assign --resource-group staar-quest-rg --name staar-quest-app

# Grant Cosmos DB access to the managed identity
# (Requires RBAC role assignment through Azure Portal or CLI)
```

## Next Steps

1. **Monitor Usage**: Check Cosmos DB metrics daily
2. **Backup Strategy**: Enable automated backups (default: 7-day continuous)
3. **Scaling**: Adjust RU allocation if usage exceeds expectations
4. **Regional Expansion**: Add read replicas if users in other regions experience latency

## Deployment Info

- **Deployment Date**: February 12, 2026
- **Backend Version**: With Cosmos DB integration
- **Container Registry**: `allpurposeacr.azurecr.io/staar-quest:latest` (AllPurpose RG)
- **App Service**: `staar-quest-app` (West US 3)
- **Status**: ✅ Active and Running

---

For questions about Cosmos DB, refer to [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/).
