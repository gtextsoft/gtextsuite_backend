# Render Deployment Guide for Backend

## Root Directory Configuration

Since this is a monorepo with both frontend (`gtextsuite/`) and backend (`gtextsuite_backend/`), you need to configure Render to use the backend directory as the root.

## Render Dashboard Configuration

### For Web Service (Backend API)

1. **Root Directory**: Set to:
   ```
   gtextsuite_backend
   ```

2. **Build Command**: 
   ```
   npm install && npm run build
   ```

3. **Start Command**:
   ```
   npm start
   ```

4. **Environment**: 
   - Node: `20.x` or `18.x` (recommended)

## Environment Variables

Make sure to set these in Render's Environment Variables section:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret_key
FRONTEND_URL=https://gtextsuite.vercel.app
```

## Alternative: Using render.yaml

You can also create a `render.yaml` file in the repository root for Infrastructure as Code:

```yaml
services:
  - type: web
    name: gtextsuite-backend
    rootDir: gtextsuite_backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false  # Set manually in dashboard
      - key: JWT_SECRET_KEY
        sync: false  # Set manually in dashboard
```

## Important Notes

1. **Root Directory**: `gtextsuite_backend` (relative to repo root)
2. **Auto-deploy**: Only triggers when files in `gtextsuite_backend/` change
3. **Build**: Runs `npm install` and `npm run build` from the backend directory
4. **Start**: Runs `npm start` which executes `node dist/index.js`

## Verification

After deployment, check:
- ✅ Build logs show TypeScript compilation
- ✅ Server starts on the configured PORT
- ✅ Database connection is successful
- ✅ API endpoints are accessible

## Troubleshooting

### Build fails
- Check that Root Directory is set to `gtextsuite_backend`
- Verify `package.json` exists in that directory
- Check build logs for TypeScript errors

### Server won't start
- Verify `dist/` folder exists after build
- Check that `dist/index.js` exists
- Review environment variables are set correctly

### Auto-deploy not working
- Ensure Root Directory is set correctly
- Check that changes are being made in `gtextsuite_backend/` directory
- Verify git push is working

