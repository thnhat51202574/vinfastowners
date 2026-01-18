# CORS Proxy Server Setup

The standalone control panel needs a proxy server to bypass CORS (Cross-Origin Resource Sharing) restrictions when making API calls to VinFast's servers.

## Why a Proxy is Needed

Browsers block direct requests from web pages to different domains (like Auth0) for security. The proxy server runs on your computer and forwards requests, bypassing this restriction.

## Quick Start

### Option 1: Node.js (Recommended)

1. **Make sure Node.js is installed:**
   ```bash
   node --version
   # Should show v12 or higher
   ```

2. **Navigate to the dashboards folder:**
   ```bash
   cd /Users/nhattruong/learn/vftest/home-assistant/dashboards
   ```

3. **Run the proxy server:**
   ```bash
   node proxy-server.js
   ```

4. **Open your browser:**
   ```
   http://localhost:3000/vinfast-control-panel-standalone.html
   ```

The server will show:
```
🚀 VinFast Control Panel Proxy Server
   Running on http://localhost:3000
   Open: http://localhost:3000/vinfast-control-panel-standalone.html
```

### Option 2: Python (Alternative)

If you don't have Node.js, you can use Python:

```bash
cd /Users/nhattruong/learn/vftest/home-assistant/dashboards
python3 proxy-server.py
```

*(Note: Python version needs to be created - currently only Node.js version exists)*

## How It Works

1. **Browser** → Makes request to `http://localhost:3000/api/auth/token`
2. **Proxy Server** → Forwards request to `https://vin3s.au.auth0.com/oauth/token`
3. **Auth0** → Returns token to proxy
4. **Proxy** → Adds CORS headers and returns to browser
5. **Browser** → Receives token (no CORS error!)

## Proxy Endpoints

The proxy provides these endpoints:

- `POST /api/auth/token` - Login to VinFast
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/vinfast/*` - Get data from VinFast API
- `POST /api/vinfast/*` - Post data to VinFast API
- `GET /` or `/*.html` - Serve the HTML control panel

## Security Notes

⚠️ **Important:**
- The proxy runs on **localhost only** (not accessible from network)
- CORS headers allow `*` (all origins) - this is safe for localhost
- **Never expose this proxy to the internet** - it's for local use only
- Credentials are passed through but not stored by the proxy

## Troubleshooting

### "Cannot find module 'http'"
- Node.js is not installed or wrong version
- Install Node.js from https://nodejs.org/

### "Port 3000 already in use"
- Another program is using port 3000
- Change PORT in `proxy-server.js` to a different number (e.g., 3001)
- Or stop the other program using port 3000

### "Connection refused"
- Make sure the proxy server is running
- Check that you're accessing `http://localhost:3000` (not 8080)

### Still getting CORS errors
- Make sure you're accessing the page through the proxy (`http://localhost:3000`)
- Don't open the HTML file directly (file://) - use the proxy URL
- Check browser console for specific error messages

## Running in Background

### macOS/Linux:
```bash
node proxy-server.js &
```

### Windows (PowerShell):
```powershell
Start-Process node -ArgumentList "proxy-server.js"
```

### Using PM2 (Production):
```bash
npm install -g pm2
pm2 start proxy-server.js
pm2 save
pm2 startup  # Auto-start on boot
```

## Stopping the Server

Press `Ctrl+C` in the terminal where it's running.

If running in background, find and kill the process:
```bash
# Find process
lsof -i :3000

# Kill it
kill <PID>
```

## Alternative: Browser Extension (Not Recommended)

You can use a browser extension to disable CORS, but this is **not recommended** for security reasons:

- Chrome: "CORS Unblock" extension
- Firefox: "CORS Everywhere" extension

**Better to use the proxy server** - it's safer and more reliable.

---

*The proxy server is required for the standalone version to work due to browser CORS restrictions.*
