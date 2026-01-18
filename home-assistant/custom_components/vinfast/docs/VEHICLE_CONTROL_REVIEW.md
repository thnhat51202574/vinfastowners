# Vehicle Control Implementation Review

This document reviews where and how vehicle control commands (like air conditioning) are implemented in the VinFast integration.

## Overview

Vehicle control requires **remote control pairing** - a cryptographic authentication process that pairs your Home Assistant instance with your vehicle. Once paired, you can send commands like:
- Climate control (AC on/off, temperature)
- Door lock/unlock
- Horn
- Lights
- Charge port control

---

## Key Files for Vehicle Control

### 1. `pairing.py` - Core Control Implementation

**Location:** `custom_components/vinfast/pairing.py`

**Purpose:** Handles pairing process and command signing/sending

#### Key Components:

**A. Pairing Process:**
```python
# Lines 57-95: QR Code Parsing
parse_qr_code(qr_content) -> dict
validate_qr_for_vehicle(qr_params, vin, user_id) -> bool

# Lines 97-120: Key Generation
generate_keypair() -> (private_key, public_key_pem)
generate_csr(vin, device_id, device_name) -> str
encrypt_csr(csr, public_key_b64, vin) -> (encrypted_csr, seed)

# Lines 190-217: Session Verification
verify_session(access_token, session_id, email/phone) -> bool
# Triggers OTP to be sent to user

# Lines 218-264: Pairing Completion
send_pair_data(access_token, encrypted_csr, otp, seed, session_id) -> dict
# Completes pairing, returns encrypted certificate and shared key
```

**B. Command Sending:**
```python
# Lines 285-334: Command Signing
sign_command(message_name, message_content, user_id, session_id) -> dict
# Creates cryptographically signed payload

# Lines 336-381: Send Command
send_command(access_token, message_name, device_key, value, user_id, session_id) -> bool
# Sends signed command to vehicle
```

**C. Control Aliases (Lines 419-427):**
```python
CONTROL_ALIASES = {
    "CLIMATE_CONTROL_AIR_CONDITION_ENABLE": "3416_0_5850",
    "CLIMATE_CONTROL_TARGET_TEMPERATURE": "3416_0_5851",
    "VEHICLE_CONTROL_DOOR_LOCK": "3415_0_5850",
    "VEHICLE_CONTROL_DOOR_UNLOCK": "3415_0_5851",
    "VEHICLE_CONTROL_HORN": "3417_0_5850",
    "VEHICLE_CONTROL_LIGHTS": "3417_0_5851",
}
```

**D. API Endpoints:**
```python
PAIRING_BASE = "https://ccarapi.vinfast.com"
VERIFY_SESSION_ENDPOINT = "/ccaraccessmgmt/api/v1/pairing/app/verify-session"
SEND_PAIR_DATA_ENDPOINT = "/ccaraccessmgmt/api/v1/pairing/app/send-pair-data"
COMMAND_ENDPOINT = "/ccaraccessmgmt/api/v2/remote/app/command"  # ← Commands sent here
```

---

### 2. `switch.py` - Climate Control Switch

**Location:** `custom_components/vinfast/switch.py`

**Purpose:** Home Assistant switch entity for climate control

#### Key Methods:

**A. Setup (Lines 23-37):**
```python
async_setup_entry()
# Only creates climate switch if pairing_keys exist in config entry
```

**B. Climate Control (Lines 112-163):**
```python
async def async_turn_on(self, **kwargs):
    """Turn on climate control."""
    await self._send_climate_command(1)

async def async_turn_off(self, **kwargs):
    """Turn off climate control."""
    await self._send_climate_command(0)

async def _send_climate_command(self, value: int):
    """Send climate control command."""
    # 1. Re-authenticate to get fresh token
    # 2. Get device key from CONTROL_ALIASES
    # 3. Call pairing.send_command()
    # 4. Update state if successful
```

**Flow:**
1. User toggles switch in Home Assistant
2. `async_turn_on()` or `async_turn_off()` called
3. `_send_climate_command()` authenticates and gets fresh token
4. Calls `pairing.send_command()` with:
   - `message_name`: "CLIMATE_CONTROL_AIR_CONDITION_ENABLE"
   - `device_key`: "3416_0_5850"
   - `value`: 1 (on) or 0 (off)
5. Command sent to `https://ccarapi.vinfast.com/ccaraccessmgmt/api/v2/remote/app/command`

---

### 3. `config_flow.py` - Pairing Setup UI

**Location:** `custom_components/vinfast/config_flow.py`

**Purpose:** User interface for pairing process

#### Key Steps:

**A. Options Flow (Lines 130-157):**
```python
async_step_init()
# Shows menu: "configure_polling", "pair_remote", "unpair"
```

**B. Pairing Flow (Lines 230-306):**
```python
async_step_pair_remote()
# Step 1: User enters QR code from vehicle
# - Parses QR code
# - Validates VIN matches
# - Generates keypair and CSR
# - Encrypts CSR
# - Triggers OTP via verify_session()
# - Moves to OTP step

async_step_enter_otp()
# Step 2: User enters OTP from email/phone
# - Sends pairing data with OTP
# - Stores pairing keys in config entry options
# - Completes pairing
```

**C. Unpairing (Lines 357-373):**
```python
async_step_unpair()
# Removes pairing keys from config entry
```

---

## Command Flow Diagram

```
User Action (HA Switch)
    ↓
switch.py: async_turn_on()
    ↓
switch.py: _send_climate_command(value=1)
    ↓
api.py: authenticate() → Get fresh access_token
    ↓
pairing.py: send_command(
    access_token,
    message_name="CLIMATE_CONTROL_AIR_CONDITION_ENABLE",
    device_key="3416_0_5850",
    value=1
)
    ↓
pairing.py: sign_command() → Create signed payload
    ↓
POST https://ccarapi.vinfast.com/ccaraccessmgmt/api/v2/remote/app/command
    ↓
Vehicle receives and executes command
```

---

## How to Add New Controls

### Example: Add Door Lock/Unlock

**Step 1: Add to `switch.py`**

Create new switch entities:

```python
class VinFastDoorLockSwitch(CoordinatorEntity, SwitchEntity):
    """Door lock switch."""
    
    async def async_turn_on(self, **kwargs):
        """Lock doors."""
        await self._send_lock_command(1)  # 1 = lock
    
    async def async_turn_off(self, **kwargs):
        """Unlock doors."""
        await self._send_lock_command(0)  # 0 = unlock
    
    async def _send_lock_command(self, value: int):
        """Send door lock/unlock command."""
        if not self._pairing or not self._pairing.is_paired:
            return
        
        # Re-authenticate
        api = VinFastApi(session)
        await api.authenticate(...)
        
        # Get device key
        device_key = CONTROL_ALIASES.get(
            "VEHICLE_CONTROL_DOOR_LOCK" if value == 1 
            else "VEHICLE_CONTROL_DOOR_UNLOCK"
        )
        
        # Send command
        await self._pairing.send_command(
            access_token=api._access_token,
            message_name="VEHICLE_CONTROL_DOOR_LOCK" if value == 1 
                        else "VEHICLE_CONTROL_DOOR_UNLOCK",
            device_key=device_key,
            value=value,
            user_id=api.user_id,
            session_id=self._pairing._session_id,
        )
```

**Step 2: Register in `async_setup_entry()`**

```python
async def async_setup_entry(...):
    pairing_keys = entry.options.get(CONF_PAIRING_KEYS)
    if pairing_keys:
        entities = [
            VinFastClimateSwitch(coordinator, entry),
            VinFastDoorLockSwitch(coordinator, entry),  # Add this
        ]
        async_add_entities(entities)
```

**Step 3: Add to `CONTROL_ALIASES` (if not already there)**

Already exists in `pairing.py`:
```python
"VEHICLE_CONTROL_DOOR_LOCK": "3415_0_5850",
"VEHICLE_CONTROL_DOOR_UNLOCK": "3415_0_5851",
```

---

## Available Control Commands

Based on `CONTROL_ALIASES` in `pairing.py`:

| Command | Device Key | Value | Description |
|---------|-----------|-------|-------------|
| `CLIMATE_CONTROL_AIR_CONDITION_ENABLE` | `3416_0_5850` | 0/1 | AC on/off |
| `CLIMATE_CONTROL_TARGET_TEMPERATURE` | `3416_0_5851` | temp (°C) | Set target temp |
| `VEHICLE_CONTROL_DOOR_LOCK` | `3415_0_5850` | 1 | Lock doors |
| `VEHICLE_CONTROL_DOOR_UNLOCK` | `3415_0_5851` | 1 | Unlock doors |
| `VEHICLE_CONTROL_HORN` | `3417_0_5850` | 1 | Honk horn |
| `VEHICLE_CONTROL_LIGHTS` | `3417_0_5851` | 0/1 | Lights on/off |

---

## Security Architecture

### Pairing Process:
1. **QR Code** - Contains encrypted public key from vehicle
2. **OTP Verification** - Two-factor authentication
3. **Key Exchange** - RSA + shared secret (HMAC)
4. **Certificate** - Encrypted certificate from server

### Command Signing:
1. **RSA Signature** - Private key signs command
2. **HMAC Signature** - Shared key for additional verification
3. **Timestamp** - Prevents replay attacks
4. **User ID Hash** - Ensures command from authorized user

### Key Storage:
- Stored in Home Assistant config entry options
- Encrypted by Home Assistant
- Never exposed in logs or UI

---

## Current Implementation Status

✅ **Implemented:**
- Climate control (AC on/off) - `switch.py`
- Pairing flow - `config_flow.py`
- Command signing/sending - `pairing.py`

❌ **Not Yet Implemented (but infrastructure exists):**
- Door lock/unlock switches
- Horn control
- Lights control
- Temperature setting
- Charge port control

**To add these:** Follow the pattern in `switch.py` for climate control.

---

## Testing Commands

### Via Home Assistant:
1. Pair device (Settings → Devices & Services → VinFast → Configure → Pair Remote)
2. Toggle `switch.vinfast_climate` entity
3. Check logs for command status

### Via Python (for testing):
```python
from custom_components.vinfast.pairing import VinFastPairing, CONTROL_ALIASES

pairing = VinFastPairing(session)
pairing.import_keys(pairing_keys_from_config)

success = await pairing.send_command(
    access_token=token,
    message_name="CLIMATE_CONTROL_AIR_CONDITION_ENABLE",
    device_key=CONTROL_ALIASES["CLIMATE_CONTROL_AIR_CONDITION_ENABLE"],
    value=1,  # 1 = on, 0 = off
    user_id=user_id,
    session_id=session_id,
)
```

---

## API Endpoints Summary

| Endpoint | Purpose | Method |
|----------|---------|--------|
| `/ccaraccessmgmt/api/v1/pairing/app/verify-session` | Trigger OTP | POST |
| `/ccaraccessmgmt/api/v1/pairing/app/send-pair-data` | Complete pairing | POST |
| `/ccaraccessmgmt/api/v2/remote/app/command` | **Send commands** | POST |

**Base URL:** `https://ccarapi.vinfast.com`

---

## Key Takeaways

1. **Control requires pairing** - Must complete QR code + OTP flow first
2. **Commands are cryptographically signed** - Uses RSA + HMAC
3. **All commands go through** `pairing.send_command()`
4. **Device keys are in** `CONTROL_ALIASES` dictionary
5. **Command endpoint:** `/ccaraccessmgmt/api/v2/remote/app/command`
6. **To add new controls:** Follow `switch.py` pattern

---

*This review covers the complete vehicle control implementation. All control commands follow the same pattern: authenticate → get device key → sign command → send to API endpoint.*
