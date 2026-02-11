# Multi-User Setup Environment Variables

## Backend (.env file)

Create a `.env` file in the backend directory with these variables:

```
# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-this-in-production

# Azure Cosmos DB Configuration
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_KEY=your-primary-key-from-azure
COSMOS_DATABASE=staar
COSMOS_CONTAINER=users

# Flask Configuration
FLASK_ENV=production
DEBUG=False
PORT=8000
```

## Frontend (.env.local file)

Create a `.env.local` file in the frontend directory:

```
# For local development (backend runs on localhost:8000)
REACT_APP_API_URL=http://localhost:8000

# For Azure deployment, use your App Service URL
# REACT_APP_API_URL=https://your-app-service.azurewebsites.net
```

## Azure Deployment

When deploying to Azure, set these environment variables in Azure App Service:

### Using Azure Portal:
1. Go to your App Service
2. Settings → Configuration
3. Add Application Settings:

| Name | Value |
|------|-------|
| JWT_SECRET_KEY | Generate a secure key (use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`) |
| COSMOS_ENDPOINT | `https://your-cosmos-account.documents.azure.com:443/` |
| COSMOS_KEY | Primary key from Cosmos DB |
| COSMOS_DATABASE | staar |
| COSMOS_CONTAINER | users |
| FLASK_ENV | production |
| DEBUG | False |

### Using Azure CLI:
```bash
az webapp config appsettings set \
  --resource-group <resource-group> \
  --name <app-service-name> \
  --settings \
    JWT_SECRET_KEY="your-secret-key" \
    COSMOS_ENDPOINT="https://your-cosmos.documents.azure.com:443/" \
    COSMOS_KEY="your-key" \
    COSMOS_DATABASE="staar" \
    COSMOS_CONTAINER="users" \
    FLASK_ENV="production" \
    DEBUG="False"
```

## Security Best Practices

1. **JWT_SECRET_KEY**: Use a strong, randomly generated key
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Never commit .env files** - Add to .gitignore:
   ```
   .env
   .env.local
   ```

3. **Use Azure Key Vault** for sensitive data:
   ```bash
   # Store secret in Key Vault
   az keyvault secret set --vault-name myKeyVault --name jwt-secret --value "your-secret-key"
   
   # Configure App Service to use Key Vault reference
   # Format: @Microsoft.KeyVault(SecretUri=...)
   ```
