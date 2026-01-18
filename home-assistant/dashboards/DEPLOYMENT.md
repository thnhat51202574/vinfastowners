# Deploying VinFast Control Panel to Free Hosting

This guide explains how to deploy the standalone control panel and proxy server to free hosting services.

## ⚠️ Security Warning

**Important:** The proxy server handles authentication tokens. When deploying:
- **Never commit tokens or credentials to git**
- Use environment variables for sensitive data
- Consider adding authentication to the proxy itself
- The proxy should ideally require authentication to prevent abuse

## Deployment Options

### Option 1: Railway (Recommended - Easiest)

**Railway** offers free tier with Node.js support.

#### Steps:

1. **Create Railway Account:**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or "Empty Project")

3. **Add Files:**
   - Upload `proxy-server.js`
   - Create `package.json`:
   ```json
   {
     "name": "vinfast-control-panel",
     "version": "1.0.0",
     "main": "proxy-server.js",
     "scripts": {
       "start": "node proxy-server.js"
     },
     "engines": {
       "node": ">=18"
     }
   }
   ```

4. **Configure:**
   - Railway auto-detects Node.js
   - Set `PORT` environment variable (Railway provides this automatically)
   - Deploy!

5. **Get URL:**
   - Railway provides a URL like: `https://your-app.railway.app`
   - Update HTML file: `const PROXY_URL = 'https://your-app.railway.app'`

6. **Deploy HTML:**
   - Upload HTML to Railway's static files or use Netlify/Vercel (see below)

**Railway Free Tier:**
- $5 credit/month (usually enough for small apps)
- Auto-deploys from GitHub
- HTTPS included

---

### Option 2: Render (Free Tier Available)

**Render** offers free tier with some limitations.

#### Steps:

1. **Create Account:**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service:**
   - New → Web Service
   - Connect your GitHub repo or upload files

3. **Configure:**
   - Build Command: (leave empty)
   - Start Command: `node proxy-server.js`
   - Environment: Node

4. **Environment Variables:**
   - `PORT` (Render provides automatically)
   - Deploy!

**Render Free Tier:**
- Free tier available (spins down after inactivity)
- HTTPS included
- Custom domain support

---

### Option 3: Vercel (For Static + Serverless)

**Vercel** is great for static files + serverless functions.

#### Steps:

1. **Create `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "proxy-server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/proxy-server.js"
       },
       {
         "src": "/(.*)",
         "dest": "/$1"
       }
     ]
   }
   ```

2. **Modify proxy-server.js for Vercel:**
   - Use `module.exports` instead of `http.createServer`
   - See Vercel serverless function format

3. **Deploy:**
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel`
   - Or connect GitHub repo

**Vercel Free Tier:**
- Unlimited static hosting
- Serverless functions
- HTTPS included
- Custom domains

---

### Option 4: Netlify (Static + Functions)

**Netlify** is excellent for static sites with serverless functions.

#### Steps:

1. **Create `netlify.toml`:**
   ```toml
   [build]
     functions = "netlify/functions"
     publish = "."

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/proxy"
     status = 200
   ```

2. **Create Netlify Function:**
   - Create `netlify/functions/proxy.js`
   - Convert proxy-server.js to Netlify function format

3. **Deploy:**
   - Drag & drop HTML file
   - Or connect GitHub repo

**Netlify Free Tier:**
- 100GB bandwidth/month
- Serverless functions
- HTTPS included

---

### Option 5: Glitch (Easiest for Testing)

**Glitch** is perfect for quick prototypes.

#### Steps:

1. **Go to https://glitch.com**
2. **New Project → Import from GitHub** (or start fresh)
3. **Upload files:**
   - `proxy-server.js`
   - `vinfast-control-panel-standalone.html`
   - `package.json`
4. **Auto-deploys!**

**Glitch Free Tier:**
- Always-on apps (with limitations)
- HTTPS included
- Easy sharing

---

## Combined Deployment (HTML + Proxy)

### Option A: Single Server (Railway/Render)

1. **Modify proxy-server.js** to serve HTML from same server:
   ```javascript
   // Already does this! Just upload both files
   ```

2. **Deploy both files together**
3. **Access:** `https://your-app.railway.app/vinfast-control-panel-standalone.html`

### Option B: Separate (HTML on Vercel/Netlify, Proxy on Railway)

1. **Deploy HTML to Vercel/Netlify** (static hosting)
2. **Deploy proxy to Railway/Render** (backend)
3. **Update HTML:** `const PROXY_URL = 'https://your-proxy.railway.app'`

---

## Required Changes for Production

### 1. Update Proxy Server for Production

Modify `proxy-server.js`:

```javascript
// Use environment variable for port
const PORT = process.env.PORT || 3000;

// Add basic authentication (optional but recommended)
const PROXY_AUTH = process.env.PROXY_AUTH || null; // Set in hosting env vars

// In request handler, add auth check:
if (PROXY_AUTH && req.headers.authorization !== `Bearer ${PROXY_AUTH}`) {
    res.writeHead(401, corsHeaders);
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
}
```

### 2. Update HTML for Production

```javascript
// Use environment-based URL
const PROXY_URL = window.location.origin; // If same domain
// OR
const PROXY_URL = 'https://your-proxy.railway.app'; // If separate
```

### 3. Add package.json

```json
{
  "name": "vinfast-control-panel",
  "version": "1.0.0",
  "description": "VinFast Control Panel with CORS proxy",
  "main": "proxy-server.js",
  "scripts": {
    "start": "node proxy-server.js"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": ["vinfast", "ev", "control-panel"],
  "author": "",
  "license": "GPL-3.0"
}
```

---

## Quick Deploy Scripts

### Railway (Easiest)

1. **Create `package.json`** (see above)
2. **Upload to GitHub**
3. **Connect Railway to GitHub repo**
4. **Deploy!**

### Render

1. **Create `package.json`**
2. **Upload files**
3. **Create Web Service**
4. **Deploy!**

---

## Environment Variables

Set these in your hosting platform:

- `PORT` - Usually auto-provided
- `PROXY_AUTH` (optional) - Basic auth token for proxy protection
- `NODE_ENV=production` - Production mode

---

## CORS Considerations

The proxy sets `Access-Control-Allow-Origin: *` which works but:
- **For production:** Consider restricting to your domain:
  ```javascript
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*'
  ```

---

## Cost Comparison

| Service | Free Tier | Best For |
|---------|-----------|----------|
| **Railway** | $5 credit/month | Full-stack apps |
| **Render** | Free (with limits) | Simple deployments |
| **Vercel** | Unlimited static | Static + serverless |
| **Netlify** | 100GB bandwidth | Static + functions |
| **Glitch** | Always-on (limited) | Quick prototypes |

---

## Recommended Setup

**For Production:**
1. **HTML:** Deploy to Vercel/Netlify (free, fast CDN)
2. **Proxy:** Deploy to Railway (reliable, easy)

**For Testing:**
- Use Glitch (easiest to get started)

---

## Troubleshooting

### "Cannot find module"
- Make sure `package.json` exists
- Check Node.js version (need >= 18)

### "Port already in use"
- Use environment variable `PORT` (hosting provides this)

### CORS errors
- Make sure proxy URL is correct in HTML
- Check proxy is running and accessible

### Authentication fails
- Check proxy is receiving requests
- Verify CORS headers are set
- Check browser console for errors

---

## Security Best Practices

1. **Add authentication to proxy** (prevent abuse)
2. **Use HTTPS only** (all hosting services provide this)
3. **Rate limiting** (prevent abuse)
4. **Environment variables** (never hardcode secrets)
5. **Monitor usage** (watch for abuse)

---

*Choose the hosting service that best fits your needs. Railway is recommended for easiest deployment.*
