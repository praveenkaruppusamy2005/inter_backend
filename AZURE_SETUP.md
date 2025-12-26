# Azure App Service Configuration

## Required Environment Variables

Configure these in Azure Portal > App Service > Configuration > Application Settings:

### PhonePe Configuration
```
PHONEPE_CLIENT_ID=SU2512242001037736999403
PHONEPE_CLIENT_SECRET=cdc56e0c-5a44-46d7-993d-e9b3c23e96de
PHONEPE_CLIENT_VERSION=1
PHONEPE_ENV=PRODUCTION
```

### Database Configuration
```
MONGODB_URI=mongodb+srv://ipraveen982005_db_user:jT2Jwg9Wrzlp3uMS@user.ckoc9vn.mongodb.net/?appName=user
```

### Backend Configuration
```
BACKEND_URL=https://interview-pro-e3apb5g4g7h9fhf0.centralindia-01.azurewebsites.net
NODE_ENV=production
```

### Webhook Configuration (Use same as PhonePe Client credentials)
```
PHONEPE_WEBHOOK_USERNAME=praveen
PHONEPE_WEBHOOK_PASSWORD=Praveen0132P
```

## Deployment Steps

1. Push code to GitHub (already done)
2. Configure environment variables in Azure Portal
3. Restart the App Service
4. Test the health endpoint: `/health`

## Troubleshooting

- Check Application Logs in Azure Portal
- Verify all environment variables are set
- Ensure `phonepe-pg-sdk-node` package is installed from PhonePe's repository
- Test locally with `npm run test`
- If deployment fails, check that the correct PhonePe SDK URL is used in package.json