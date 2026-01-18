# How to Run the VinFast Control Panel

This guide explains how to run the web control panel and obtain the necessary credentials.

## Two Ways to Run the Control Panel

### Option 1: Home Assistant Dashboard (Recommended - No Login Needed)

**Best for:** Users who want native HA integration

**Authentication:** Uses your existing Home Assistant login (no additional credentials needed)

**Steps:**

1. **Open Home Assistant** in your browser
2. **Log in** with your HA credentials (the same login you use for HA)
3. Go to **Settings** → **Dashboards**
4. Click **Add Dashboard** → **New dashboard from scratch**
5. Click the three dots (⋮) → **Edit Dashboard** → **Raw configuration editor**
6. Copy the entire contents of `vinfast-control-panel.yaml`
7. Paste into the editor
8. **Update entity IDs** to match your setup:
   - Find and replace `sensor.vinfast_*` with your actual entity names
   - Find and replace `sensor.charger_*` with your actual OCPP entity names
   - Example: If your battery sensor is `sensor.vf8_battery_level`, replace all instances
9. Click **Save**
10. Access the dashboard from the sidebar or dashboard menu

**That's it!** No additional login or credentials needed - it uses your HA session.

---

### Option 2: Standalone HTML Page (Requires Access Token)

**Best for:** Users who want a standalone page or want to embed it elsewhere

**Authentication:** Requires a Long-Lived Access Token from Home Assistant

#### Step 1: Get Your Home Assistant Access Token

1. **Open Home Assistant** in your browser
2. **Log in** with your HA credentials
3. Click on your **profile icon** (bottom left corner)
4. Scroll down to **"Long-Lived Access Tokens"** section
5. Click **"Create Token"**
6. Give it a name (e.g., "VinFast Control Panel")
7. Click **"OK"**
8. **IMPORTANT:** Copy the token immediately - you won't be able to see it again!
   - It will look like: `eyJ0eXAiOiJKV1QiLCJhbGc...` (very long string)

#### Step 2: Configure the HTML File

1. Open `vinfast-control-panel.html` in a text editor (VS Code, Notepad++, etc.)
2. Find the configuration section (around line 460):
   ```javascript
   // Configuration - UPDATE THESE for your Home Assistant instance
   const HA_URL = 'http://homeassistant.local:8123'; // Change to your HA URL
   const HA_TOKEN = 'YOUR_LONG_LIVED_ACCESS_TOKEN'; // Get from HA Profile → Long-Lived Access Tokens
   const VINFAST_ENTITY_PREFIX = 'sensor.vinfast'; // Change to match your entity prefix
   const OCPP_ENTITY_PREFIX = 'sensor.charger'; // Change to match your OCPP entity prefix
   ```
3. **Update these values:**
   - `HA_URL`: Your Home Assistant URL
     - Local: `http://homeassistant.local:8123` or `http://192.168.1.100:8123`
     - Remote: `https://your-ha-domain.duckdns.org:8123`
   - `HA_TOKEN`: Paste the token you copied in Step 1
   - `VINFAST_ENTITY_PREFIX`: Your VinFast entity prefix (check in HA → Developer Tools → States)
     - Common: `sensor.vinfast`, `sensor.vf8`, `sensor.vf9`
   - `OCPP_ENTITY_PREFIX`: Your OCPP entity prefix (if you have OCPP)
     - Common: `sensor.charger`, `sensor.autel_charger`
4. Save the file

#### Step 3: Run the HTML File

**Method A: Open Directly in Browser**
1. Double-click `vinfast-control-panel.html`
2. It will open in your default browser
3. The page will automatically connect to Home Assistant

**Method B: Serve via Web Server (Better for remote access)**

Using Python:
```bash
# Navigate to the dashboards folder
cd /path/to/home-assistant/dashboards

# Python 3
python3 -m http.server 8080

# Then open: http://localhost:8080/vinfast-control-panel.html
```

Using Node.js:
```bash
# Install http-server globally (one time)
npm install -g http-server

# Navigate to the dashboards folder
cd /path/to/home-assistant/dashboards

# Start server
http-server -p 8080

# Then open: http://localhost:8080/vinfast-control-panel.html
```

Using PHP:
```bash
# Navigate to the dashboards folder
cd /path/to/home-assistant/dashboards

# Start server
php -S localhost:8080

# Then open: http://localhost:8080/vinfast-control-panel.html
```

---

## Finding Your Entity Names

To configure the control panel correctly, you need to know your entity names:

1. Open Home Assistant
2. Go to **Developer Tools** (in sidebar, or Settings → Developer Tools)
3. Click **States** tab
4. Search for your VinFast entities:
   - Type "vinfast" or "vf8" or "vf9" in the search box
   - Look for entities like:
     - `sensor.vinfast_battery_level`
     - `sensor.vinfast_range`
     - `sensor.vinfast_odometer`
     - etc.
5. Note the prefix (everything before the first underscore)
   - Example: If you see `sensor.vf8_battery_level`, your prefix is `sensor.vf8`

---

## Authentication Summary

| Method | Login Required? | How Authentication Works |
|--------|----------------|-------------------------|
| **HA Dashboard** | ✅ Yes (HA login) | Uses your existing Home Assistant session - no additional credentials |
| **HTML Standalone** | ✅ Yes (HA login once) | Requires Long-Lived Access Token (obtained from HA Profile) |

**Important Notes:**
- The HTML version doesn't have its own login page - it uses the token to authenticate with HA
- The token gives full access to your HA instance - keep it secure!
- If you lose the token, just create a new one
- Tokens don't expire (unless you revoke them)

---

## Troubleshooting

### "Error: API call failed" or "401 Unauthorized"
- **Check HA_URL:** Make sure it's correct and accessible
- **Check HA_TOKEN:** Verify the token is correct (create a new one if needed)
- **Check HA is running:** Make sure Home Assistant is accessible

### "Entity not found" or entities show "--"
- **Check entity prefixes:** Update `VINFAST_ENTITY_PREFIX` and `OCPP_ENTITY_PREFIX`
- **Verify entities exist:** Check in Developer Tools → States
- **Check entity names:** Make sure they match exactly (case-sensitive)

### HTML file opens but shows "Checking..." forever
- **Check browser console:** Press F12 → Console tab for errors
- **Check CORS:** If HA is on a different domain, you may need to configure CORS
- **Check network:** Open Network tab (F12) to see if API calls are failing

### Can't access HA from remote location
- **For HTML version:** Use your remote HA URL (e.g., `https://your-domain.duckdns.org`)
- **For HA Dashboard:** Access via HA mobile app or remote HA URL

---

## Security Best Practices

1. **Protect your access token:**
   - Don't commit it to git
   - Don't share it publicly
   - Store it securely

2. **Use HTTPS when possible:**
   - Especially for remote access
   - Configure SSL in Home Assistant

3. **Revoke unused tokens:**
   - Go to Profile → Long-Lived Access Tokens
   - Delete tokens you're no longer using

4. **For production use:**
   - Consider using the HA Dashboard version (more secure)
   - Or implement additional authentication for the HTML version

---

## Quick Start Checklist

**For HA Dashboard:**
- [ ] Logged into Home Assistant
- [ ] Created new dashboard
- [ ] Pasted YAML configuration
- [ ] Updated entity IDs
- [ ] Saved dashboard

**For HTML Standalone:**
- [ ] Logged into Home Assistant
- [ ] Created Long-Lived Access Token
- [ ] Copied token
- [ ] Updated HA_URL in HTML file
- [ ] Updated HA_TOKEN in HTML file
- [ ] Updated entity prefixes in HTML file
- [ ] Opened HTML file in browser or served via web server

---

*Need help? Check the main README or open an issue on GitHub.*
