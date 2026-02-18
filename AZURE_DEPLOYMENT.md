# Azure Deployment Guide for STAAR Quest

## Prerequisites

1. Azure subscription
2. Existing App Service Plan (as mentioned)
3. Docker installed locally
4. Azure CLI installed

## Deployment Steps

### Step 1: Build and Test Locally

```bash
# Build the Docker image
docker build -t staar-quest .

# Test locally
docker run -p 8000:8000 staar-quest

# Visit http://localhost:8000 to verify it works
```

### Step 2: Create Azure Resources

```bash
# Login to Azure
az login

# Set your subscription
az account set --subscription "<your-subscription-id>"

# Create a resource group (if you don't have one)
az group create --name staar-quest-rg --location eastus

# Use existing Azure Container Registry
# Registry: AllPurposeACR
# Resource Group: AllPurpose
# (No need to create - already exists)

# Verify admin access is enabled
az acr update -n AllPurposeACR --admin-enabled true
```

### Step 3: Push Image to Azure Container Registry

```bash
# Login to ACR
az acr login --name AllPurposeACR

# Tag your image
docker tag staar-quest:latest allpurposeacr.azurecr.io/staar-quest:latest

# Push to ACR
docker push allpurposeacr.azurecr.io/staar-quest:latest
```

### Step 4: Deploy to Existing App Service

If you have an existing App Service Plan:

```bash
# Create a new Web App in your existing plan
az webapp create \
  --resource-group <your-resource-group> \
  --plan <your-app-service-plan> \
  --name staar-quest-app \
  --deployment-container-image-name allpurposeacr.azurecr.io/staar-quest:latest

# Configure the Web App to use ACR
az webapp config container set \
  --name staar-quest-app \
  --resource-group <your-resource-group> \
  --docker-custom-image-name allpurposeacr.azurecr.io/staar-quest:latest \
  --docker-registry-server-url https://allpurposeacr.azurecr.io

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name AllPurposeACR --resource-group AllPurpose --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name AllPurposeACR --resource-group AllPurpose --query passwords[0].value -o tsv)

# Set ACR credentials in Web App
az webapp config appsettings set \
  --resource-group <your-resource-group> \
  --name staar-quest-app \
  --settings \
    DOCKER_REGISTRY_SERVER_URL=https://allpurposeacr.azurecr.io \
    DOCKER_REGISTRY_SERVER_USERNAME=$ACR_USERNAME \
    DOCKER_REGISTRY_SERVER_PASSWORD=$ACR_PASSWORD \
    WEBSITES_PORT=8000

# Restart the app
az webapp restart --name staar-quest-app --resource-group <your-resource-group>
```

### Step 5: Configure App Settings (Optional)

```bash
# Add custom app settings
az webapp config appsettings set \
  --resource-group <your-resource-group> \
  --name staar-quest-app \
  --settings \
    PORT=8000 \
    PYTHONUNBUFFERED=1
```

### Step 6: Access Your App

```bash
# Get the app URL
az webapp show --name staar-quest-app --resource-group <your-resource-group> --query defaultHostName -o tsv
```

Visit `https://<your-app-name>.azurewebsites.net` to see your app!

## Adding Azure Cosmos DB (✅ Implemented)

✅ **STATUS**: Cosmos DB is now fully integrated and running in production.

To set up Cosmos DB for an existing deployment:

### Create Cosmos DB

```bash
# Create Cosmos DB account
az cosmosdb create \
  --name staar-quest-cosmos \
  --resource-group <your-resource-group> \
  --kind GlobalDocumentDB \
  --default-consistency-level Session

# Create database
az cosmosdb sql database create \
  --account-name staar-quest-cosmos \
  --resource-group <your-resource-group> \
  --name staarquest

# Create container
az cosmosdb sql container create \
  --account-name staar-quest-cosmos \
  --database-name staarquest \
  --resource-group <your-resource-group> \
  --name users \
  --partition-key-path "/user_id"

# Get connection info
COSMOS_ENDPOINT=$(az cosmosdb show --name staar-quest-cosmos --resource-group <your-resource-group> --query documentEndpoint -o tsv)
COSMOS_KEY=$(az cosmosdb keys list --name staar-quest-cosmos --resource-group <your-resource-group> --query primaryMasterKey -o tsv)

# Add to App Service
az webapp config appsettings set \
  --resource-group <your-resource-group> \
  --name staar-quest-app \
  --settings \
    COSMOS_ENDPOINT=$COSMOS_ENDPOINT \
    COSMOS_KEY=$COSMOS_KEY \
    COSMOS_DATABASE=staarquest \
    COSMOS_CONTAINER=users
```

## Continuous Deployment

For automated deployments when you update the code:

1. Push your code to GitHub
2. In Azure Portal, go to your Web App
3. Navigate to "Deployment Center"
4. Connect to your GitHub repository
5. Configure GitHub Actions for automated builds and deployments

## Monitoring

```bash
# View logs
az webapp log tail --name staar-quest-app --resource-group <your-resource-group>

# Enable Application Insights
az monitor app-insights component create \
  --app staar-quest-insights \
  --location eastus \
  --resource-group <your-resource-group>
```

## Troubleshooting

### App won't start
- Check logs: `az webapp log tail`
- Verify container is running: Check "Container settings" in Azure Portal
- Ensure WEBSITES_PORT is set to 8000

### Can't access the app
- Check if the app is running in Azure Portal
- Verify the URL is correct
- Check NSG and firewall rules

### Database connection issues
- Verify Cosmos DB credentials are correct
- Check network settings in Cosmos DB
- Ensure managed identity is configured if not using keys

## Cost Optimization

- Use **B1 or B2** tier for App Service Plan (suitable for development/testing)
- Use **Serverless** tier for Cosmos DB to pay only for what you use
- Enable **auto-pause** for development environments
- Consider using **Azure Container Apps** instead of App Service for better cost efficiency

## Security Best Practices

1. Enable managed identity instead of using keys
2. Store secrets in Azure Key Vault
3. Enable HTTPS only
4. Use latest container images
5. Enable Azure AD authentication for admin access
6. Regularly update dependencies

---

## Deployment Status

✅ **STAAR Quest is now deployed on Azure with Cosmos DB integration**

| Component | Status | Details |
|-----------|--------|----------|
| App Service | ✅ Running | `staar-quest-app` in West US 3 |
| Container Registry | ✅ Active | Image: `allpurposeacr.azurecr.io/staar-quest:latest` (AllPurpose RG) |
| Cosmos DB | ✅ Active | `staar-quest-cosmos` with `users` and `auth_users` containers |
| User Data Persistence | ✅ Live | All user progress stored in Cosmos DB |
| Frontend | ✅ Accessible | https://staar-quest-app.azurewebsites.net |

For details on Cosmos DB implementation, see [COSMOS_DB_INTEGRATION.md](COSMOS_DB_INTEGRATION.md).

For questions or issues, refer to [Azure App Service documentation](https://docs.microsoft.com/azure/app-service/).
