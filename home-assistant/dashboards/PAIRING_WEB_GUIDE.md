# Pairing Your Vehicle from the Web Control Panel

You can now pair your vehicle directly from the web control panel without needing Home Assistant!

## Prerequisites

**Install node-forge (for proper CSR generation):**
```bash
cd /path/to/dashboards
npm install node-forge
```

**Note:** The proxy server will work without node-forge, but pairing may fail. Install it for best results.

## How to Pair

### Step 1: Log In
1. Open the control panel: `http://localhost:3000/vinfast-control-panel-standalone.html`
2. Log in with your VinFast credentials
3. Wait for vehicle data to load

### Step 2: Get QR Code from Vehicle
1. **Go to your VinFast vehicle**
2. **Open Settings** → **Remote Control** → **Pair New Device**
3. **A QR code will appear on the screen**
4. **The QR code contains text** - you need to enter this text (not scan it)

**QR Code Format:**
```
K=<base64_key>&ssid=<session_id>&vin=<VIN>&timeout=<seconds>
```

**How to get the text:**
- Some vehicles show the text below the QR code
- Or use a QR code scanner app to read it
- The text will look like: `K=abc123...&ssid=xyz789...&vin=VF8...&timeout=300`

### Step 3: Enter QR Code in Control Panel
1. **Scroll to "Vehicle Controls" card**
2. **Enter the QR code text** in the "Enter QR Code Content" field
3. **Click "Start Pairing"**
4. **OTP will be sent** to your email/phone

### Step 4: Enter OTP
1. **Check your email or phone** for the OTP code
2. **Enter the 6-digit OTP** in the control panel
3. **Click "Complete Pairing"**
4. **Pairing keys will be saved** automatically

### Step 5: Use Controls
Once paired, all control buttons will be enabled:
- ❄️ Climate Control (AC on/off)
- 🔒 Lock Doors
- 🔓 Unlock Doors
- 🔊 Honk Horn

## Troubleshooting

### "Invalid QR code format"
- Make sure you copied the **entire** QR code text
- Include all parts: `K=...&ssid=...&vin=...&timeout=...`
- Check for any missing characters

### "QR VIN doesn't match vehicle VIN"
- Make sure you're pairing with the correct vehicle
- The QR code VIN must match the vehicle you're logged into

### "Verify session failed"
- Check that you're logged in with the correct account
- The account must be the primary owner of the vehicle
- Try logging out and logging back in

### "Pairing failed: Invalid OTP"
- Make sure you entered the OTP correctly
- OTP codes expire quickly (usually 5-10 minutes)
- Request a new OTP by starting pairing again

### "Command failed: Missing pairing keys"
- Make sure pairing completed successfully
- Check browser console for errors
- Try pairing again if keys weren't saved

## Alternative: Import Keys from Home Assistant

If you've already paired in Home Assistant, you can import those keys:

1. **Export pairing keys** from Home Assistant (see `PAIRING_KEYS_GUIDE.md`)
2. **Paste the JSON** into the "Import Pairing Keys" textarea
3. **Click "Import Keys"**

This is faster if you've already paired in HA.

## Security Notes

- **Pairing keys are stored in browser localStorage** (encrypted by browser)
- **Keys are never sent to third parties** - only used to sign commands
- **If you lose keys**, just pair again
- **Keys are specific to your vehicle** - can't be used for other vehicles

## What Happens During Pairing

1. **QR Code Parsing** - Extracts session ID, encryption key, VIN
2. **Key Generation** - Creates RSA 2048-bit keypair
3. **CSR Generation** - Creates certificate signing request
4. **OTP Verification** - Sends OTP to your email/phone
5. **Pairing Completion** - Exchanges keys with VinFast servers
6. **Key Storage** - Saves keys for future commands

All cryptographic operations happen securely on the proxy server.

---

*Pairing enables remote vehicle control. Once paired, you can control your vehicle from anywhere!*
