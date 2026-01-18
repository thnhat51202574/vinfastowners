# How to Get Pairing Keys from Home Assistant

To use vehicle controls in the standalone control panel, you need to import pairing keys from your Home Assistant integration.

## Step 1: Pair Your Device in Home Assistant

1. **Open Home Assistant**
2. Go to **Settings** → **Devices & Services**
3. Find **VinFast** integration
4. Click **Configure**
5. Select **"Pair Remote"** from the options menu
6. Follow the pairing flow:
   - Enter QR code from your vehicle (Settings → Remote Control → Pair New Device)
   - Enter OTP code sent to your email/phone
   - Pairing completes

## Step 2: Export Pairing Keys

### Method 1: From Home Assistant Config (Recommended)

1. **SSH into your Home Assistant** (or use Terminal add-on)
2. Navigate to config directory:
   ```bash
   cd /config
   ```
3. **Find your pairing keys:**
   ```bash
   # Keys are stored in .storage/core.config_entries
   # You can extract them using Python:
   ```
4. **Create a script to export keys:**
   ```python
   # export_pairing_keys.py
   import json
   
   with open('/config/.storage/core.config_entries', 'r') as f:
       data = json.load(f)
   
   # Find VinFast entry
   for entry in data.get('data', {}).get('entries', []):
       if entry.get('domain') == 'vinfast':
           options = entry.get('options', {})
           pairing_keys = options.get('pairing_keys')
           if pairing_keys:
               print(json.dumps(pairing_keys, indent=2))
               break
   ```
5. **Run the script:**
   ```bash
   python3 export_pairing_keys.py
   ```
6. **Copy the JSON output**

### Method 2: Using Home Assistant Developer Tools

1. **Open Home Assistant**
2. Go to **Developer Tools** → **YAML**
3. **Create a script** to export keys:
   ```yaml
   # In Developer Tools → Services
   service: system_log.write
   data:
     message: "{{ state_attr('config_entry.vinfast_xxxxx', 'options') }}"
   ```
4. **Check logs** for the pairing keys

### Method 3: Direct File Access

If you have file system access:

1. **Open:** `/config/.storage/core.config_entries`
2. **Search for:** `"domain": "vinfast"`
3. **Find:** `"pairing_keys"` in the options
4. **Copy the JSON object:**
   ```json
   {
     "private_key_pem": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "shared_key_b64": "...",
     "session_id": "..."
   }
   ```

## Step 3: Import Keys into Control Panel

1. **Open the standalone control panel**
2. **Log in** with your VinFast credentials
3. **Scroll to "Vehicle Controls" card**
4. **Paste the pairing keys JSON** into the textarea
5. **Click "Import Keys"**
6. **Controls should now be enabled!**

## Security Notes

⚠️ **Important:**
- Pairing keys are **cryptographic credentials** - treat them like passwords
- **Never share** your pairing keys publicly
- Keys are stored in browser localStorage (encrypted by browser)
- Keys are only used to sign commands - never sent to third parties
- If compromised, unpair and re-pair your device

## Troubleshooting

### "Invalid pairing keys format"
- Make sure you copied the complete JSON object
- Check that all three fields are present: `private_key_pem`, `shared_key_b64`, `session_id`
- Ensure JSON is valid (no trailing commas)

### "Command failed: Missing pairing keys"
- Make sure keys were imported successfully
- Check browser console for errors
- Try importing keys again

### "Command failed: Authentication error"
- Your access token may have expired
- Try logging out and logging back in
- Check that pairing keys match your current vehicle

## Alternative: Use Home Assistant Dashboard

If you prefer not to export keys, you can use the **Home Assistant dashboard version** (`vinfast-control-panel.yaml`) which automatically uses pairing keys from the integration.

---

*Pairing keys are required for vehicle control commands. They enable cryptographic signing of commands to ensure security.*
