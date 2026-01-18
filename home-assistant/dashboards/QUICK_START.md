# Quick Start Guide - Control Panel

## 🚀 Fastest Way: Use Home Assistant Dashboard (No Extra Login!)

**No additional credentials needed** - uses your existing HA login.

### Steps:
1. Open Home Assistant → Log in (if not already)
2. Settings → Dashboards → Add Dashboard
3. Click ⋮ → Edit Dashboard → Raw configuration editor
4. Paste `vinfast-control-panel.yaml` content
5. Update entity IDs (find/replace `sensor.vinfast` with your prefix)
6. Save → Done!

**Access:** Dashboard appears in your HA sidebar

---

## 🌐 Alternative: Standalone HTML (Requires Token)

### Step 1: Get Access Token (One-Time Setup)

1. **Open Home Assistant** → Log in
2. **Click your profile** (bottom left) 👤
3. **Scroll down** to "Long-Lived Access Tokens"
4. **Click "Create Token"**
5. **Name it:** "VinFast Control Panel"
6. **Click OK**
7. **COPY THE TOKEN** (you won't see it again!)

### Step 2: Configure HTML File

Open `vinfast-control-panel.html` and find this section (around line 488):

```javascript
const HA_URL = 'http://homeassistant.local:8123'; // ← Change this
const HA_TOKEN = 'YOUR_LONG_LIVED_ACCESS_TOKEN'; // ← Paste token here
const VINFAST_ENTITY_PREFIX = 'sensor.vinfast'; // ← Change if different
const OCPP_ENTITY_PREFIX = 'sensor.charger'; // ← Change if different
```

**Update:**
- `HA_URL`: Your HA address (e.g., `http://192.168.1.100:8123`)
- `HA_TOKEN`: Paste the token from Step 1
- Entity prefixes: Check in HA → Developer Tools → States

### Step 3: Run

**Option A:** Double-click the HTML file (opens in browser)

**Option B:** Serve via web server:
```bash
# Python
python3 -m http.server 8080

# Then open: http://localhost:8080/vinfast-control-panel.html
```

---

## 🔍 Finding Your Entity Names

1. HA → Developer Tools → States
2. Search for "vinfast" or "vf8" or "vf9"
3. Look for: `sensor.vinfast_battery_level` (or similar)
4. Note the prefix: `sensor.vinfast` (everything before first `_`)

---

## ✅ Summary

| Method | Login? | Setup Time |
|--------|--------|------------|
| **HA Dashboard** | ✅ HA login only | 2 minutes |
| **HTML Standalone** | ✅ HA login + token | 5 minutes |

**Recommendation:** Use HA Dashboard if you just want it in Home Assistant. Use HTML if you want a standalone page.

---

*For detailed instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)*
