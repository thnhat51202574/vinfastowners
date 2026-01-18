# Standalone Control Panel - Direct VinFast Login

This version allows you to login directly to VinFast's service **without needing Home Assistant** or any access tokens.

## 🎯 What This Version Does

- **Direct VinFast Login** - Uses your VinFast account credentials (email/password)
- **No Home Assistant Required** - Works completely standalone
- **No Access Tokens Needed** - Just login with your VinFast account
- **Automatic Token Management** - Handles authentication tokens automatically
- **Persistent Login** - Remembers your session (stored locally in browser)

## 🚀 How to Use

### Step 1: Open the File

Simply open `vinfast-control-panel-standalone.html` in your web browser:
- Double-click the file, OR
- Right-click → Open With → Browser

### Step 2: Login

1. **Select your region:**
   - United States
   - Europe
   - Vietnam

2. **Enter your VinFast credentials:**
   - Email (the one you use for VinFast app)
   - Password (your VinFast account password)

3. **Click "Login"**

### Step 3: View Your Vehicle Data

Once logged in, you'll see:
- Connection status
- Vehicle information (battery, range, odometer)
- Charging status
- Lock status
- Speed and gear
- Temperature (inside/outside)
- Tire pressure (all 4 tires)

## 🔒 Security & Privacy

- **Credentials are NOT stored** - Only the authentication token is saved locally
- **Direct connection** - Connects directly to VinFast's servers
- **Local storage only** - Token stored in browser's localStorage (not sent anywhere)
- **HTTPS encryption** - All API calls use secure HTTPS

## 📱 Features

### Automatic Refresh
- Data refreshes every 60 seconds automatically
- Click "Refresh Data" button for manual refresh

### Persistent Session
- Login once, stays logged in (until you logout)
- Token automatically refreshes when expired
- Works across browser sessions

### Region Support
- United States (US)
- Europe (EU)
- Vietnam (VN)

## 🔧 Troubleshooting

### "Invalid credentials" Error
- Double-check your email and password
- Make sure you're using the same credentials as the VinFast app
- Try logging into the VinFast app first to verify credentials work

### "No vehicles found" Error
- Make sure you have a vehicle registered to your VinFast account
- The account must be the primary owner of the vehicle

### Data Not Updating
- Vehicle may be in sleep mode - try refreshing
- Check that vehicle has sent recent telemetry data
- Some data points may not be available if vehicle is off

### "Failed to load telemetry" Error
- Vehicle may be offline or in sleep mode
- Wait a few minutes and try refreshing
- Some telemetry data requires the vehicle to be awake

## 💡 Tips

1. **Keep Browser Open** - The page will auto-refresh data every minute
2. **Check Region** - Make sure you select the correct region for your account
3. **Logout When Done** - Click logout to clear stored tokens
4. **Clear Browser Data** - If you have issues, clear browser localStorage

## 🆚 Comparison: Standalone vs HA Version

| Feature | Standalone | HA Version |
|---------|-----------|------------|
| **Login** | VinFast credentials | HA access token |
| **Home Assistant** | Not required | Required |
| **Setup** | Just open file | Configure HA token |
| **OCPP Control** | ❌ Not available | ✅ Available |
| **Climate Control** | ❌ Not available | ✅ Available (if paired) |
| **Automations** | ❌ Not available | ✅ Available |
| **Multi-vehicle** | ⚠️ First vehicle only | ✅ Via HA |

## 📝 Notes

- This version connects **directly to VinFast's API**
- No data goes through Home Assistant
- Works on any device with a modern browser
- Can be saved as a bookmark for easy access
- Mobile-friendly responsive design

## 🚨 Limitations

- **Read-only** - Can view data but cannot control vehicle
- **No OCPP integration** - Charger control not available
- **No climate control** - Remote climate commands not available
- **First vehicle only** - Shows data for first vehicle in account
- **No automations** - Cannot create automations or triggers

For full control features, use the Home Assistant integration version.

---

*This standalone version is perfect for quick status checks without needing Home Assistant setup.*
