# VinFast Control Panel

A comprehensive web-based control panel for managing your VinFast Home Assistant integration settings and controls.

**📖 Quick Start:** See [QUICK_START.md](QUICK_START.md) for the fastest setup  
**📚 Detailed Guide:** See [SETUP_GUIDE.md](SETUP_GUIDE.md) for complete instructions

## Overview

The control panel provides an intuitive interface to:
- Monitor connection status and update intervals
- Configure polling intervals (normal and charging)
- Control OCPP charger (start/stop, availability, max current)
- Control climate (if remote control is paired)
- View vehicle information at a glance
- Trigger manual data refreshes

## Two Versions Available

### 1. Standalone HTML Page (`vinfast-control-panel.html`)

A self-contained HTML page that can be:
- Opened directly in a browser
- Served from a web server
- Embedded in an iframe
- Used on mobile devices

**Features:**
- Beautiful glassmorphism UI design
- Real-time status updates
- Full OCPP charger control
- Climate control (if paired)
- Responsive design (mobile-friendly)

**Setup:**
1. Open `vinfast-control-panel.html` in a text editor
2. Update configuration at the top of the `<script>` section:
   ```javascript
   const HA_URL = 'http://homeassistant.local:8123'; // Your HA URL
   const HA_TOKEN = 'YOUR_LONG_LIVED_ACCESS_TOKEN'; // Get from HA Profile
   const VINFAST_ENTITY_PREFIX = 'sensor.vinfast'; // Your entity prefix
   const OCPP_ENTITY_PREFIX = 'sensor.charger'; // Your OCPP entity prefix
   ```
3. Get a Long-Lived Access Token:
   - Go to Home Assistant → Profile (bottom left)
   - Scroll to "Long-Lived Access Tokens"
   - Click "Create Token"
   - Copy the token and paste it in the HTML file
4. Save and open in a browser

**Usage:**
- Open the HTML file in any modern browser
- The page will automatically connect to Home Assistant
- All controls are interactive and update in real-time
- Status refreshes every 30 seconds automatically

### 2. Home Assistant Dashboard (`vinfast-control-panel.yaml`)

A native Home Assistant dashboard that integrates seamlessly with your HA instance.

**Features:**
- Native Home Assistant integration
- No API tokens needed (uses HA authentication)
- Works with HA mobile app
- Supports all HA features (themes, custom cards, etc.)

**Setup:**
1. Go to **Settings** → **Dashboards**
2. Click **Add Dashboard** → **New dashboard from scratch**
3. Click the three dots (⋮) → **Edit Dashboard** → **Raw configuration editor**
4. Copy the entire contents of `vinfast-control-panel.yaml`
5. Paste into the editor
6. **Important:** Update entity IDs to match your setup:
   - Replace `sensor.vinfast_*` with your actual entity names
   - Replace `sensor.charger_*` with your actual OCPP entity names
7. Save

**Required Custom Cards:**
- Install via HACS → Frontend:
  - `button-card` by custom-cards

**Optional Enhancements:**
- Add `input_number` entities for polling interval display:
  ```yaml
  input_number:
    vinfast_normal_interval:
      name: "Normal Polling Interval"
      min: 3600
      max: 43200
      step: 3600
      initial: 9000
      unit_of_measurement: "seconds"
  ```

## Features Comparison

| Feature | HTML Version | HA Dashboard |
|---------|-------------|--------------|
| Connection Status | ✅ | ✅ |
| Polling Configuration | ✅ (local) | ✅ (via HA) |
| OCPP Charger Control | ✅ | ✅ |
| Climate Control | ✅ | ✅ |
| Vehicle Information | ✅ | ✅ |
| Manual Refresh | ✅ | ✅ |
| Mobile Friendly | ✅ | ✅ |
| HA Authentication | ❌ (uses token) | ✅ (native) |
| HA Themes | ❌ | ✅ |
| Custom Cards | ❌ | ✅ |

## Control Panel Features

### Connection Status
- Real-time connection status indicator
- Last update timestamp
- Next update countdown
- Current polling interval display
- OCPP charger connection status

### Polling Configuration
- **Normal Interval:** How often to poll when vehicle is idle
  - Options: 1 hour to 12 hours
  - Recommended: 2.5 hours (~10 polls/day)
- **Charging Interval:** How often to poll when charging
  - Options: 5, 10, 15, or 30 minutes
  - Recommended: 5 minutes
- **OCPP Entity:** Entity to monitor for charging state
- **Charging State:** State value that indicates charging

**Note:** HTML version saves locally. To actually change HA settings, use the HA dashboard or go to Integration Options.

### OCPP Charger Control
- **Status Display:** Current charger status
- **Power & Energy:** Real-time charging metrics
- **Availability Toggle:** Enable/disable charger
- **Charge Control Toggle:** Start/stop charging
- **Max Current Setting:** Adjust maximum charging current (6-48A)

**Requirements:**
- OCPP integration must be installed and configured
- Charger must be connected and reporting status

### Climate Control
- **Temperature Display:** Inside and outside temperatures
- **Climate Toggle:** Turn climate on/off remotely

**Requirements:**
- Remote control must be paired (via Integration Options)
- Pairing requires QR code from vehicle + OTP verification

### Vehicle Information
- Battery level (with gauge)
- Range estimate
- Odometer reading
- Charging status
- Lock status
- Speed and gear position

## Troubleshooting

### HTML Version

**"Error: API call failed"**
- Check that `HA_URL` is correct and accessible
- Verify `HA_TOKEN` is valid (create a new one if needed)
- Ensure Home Assistant is running and accessible

**"Entity not found"**
- Update `VINFAST_ENTITY_PREFIX` to match your entity names
- Check entity names in Developer Tools → States
- Common prefixes: `sensor.vinfast`, `sensor.vf8`, etc.

**Controls not working**
- Verify entity IDs are correct
- Check browser console for errors (F12)
- Ensure entities are not in "unavailable" state

### HA Dashboard Version

**Cards not showing**
- Verify entity IDs match your setup
- Check that required custom cards are installed
- Look for errors in HA logs

**Conditional cards not appearing**
- OCPP card only shows if `sensor.charger_status_connector` exists
- Climate card only shows if `switch.vinfast_climate` exists
- Check entity names in Developer Tools → States

**Button cards not working**
- Ensure `button-card` is installed via HACS
- Clear browser cache (Ctrl+Shift+R)
- Restart Home Assistant

## Customization

### HTML Version
- Edit CSS in `<style>` section for colors/theming
- Modify JavaScript functions for custom behavior
- Add/remove cards by editing HTML structure

### HA Dashboard Version
- Add/remove cards in YAML
- Use HA themes for styling
- Add custom cards from HACS
- Modify entity IDs to match your setup

## Security Notes

### HTML Version
- **Long-Lived Access Tokens:** Store securely, never commit to git
- **HTTPS:** Use HTTPS when accessing HA remotely
- **Token Permissions:** Tokens have full HA access - protect them

### HA Dashboard Version
- Uses native HA authentication (secure)
- No additional tokens needed
- Respects HA user permissions

## Advanced Usage

### Embedding HTML Version
```html
<iframe src="vinfast-control-panel.html" width="100%" height="800px"></iframe>
```

### Serving HTML Version
```bash
# Python
python3 -m http.server 8080

# Node.js
npx http-server -p 8080

# Then access: http://localhost:8080/vinfast-control-panel.html
```

### Mobile App Integration
- HTML version: Add to home screen (works offline for viewing)
- HA dashboard: Access via HA mobile app (full integration)

## Support

For issues or questions:
1. Check entity IDs match your setup
2. Verify required integrations are installed
3. Check Home Assistant logs for errors
4. Review main README for integration setup

## License

Same as main project - GPL-3.0

---

*Created for the VinFast Owners community*
