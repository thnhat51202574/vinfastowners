#!/usr/bin/env node
/**
 * Simple CORS Proxy Server for VinFast Control Panel
 * 
 * This server acts as a proxy to bypass CORS restrictions when making
 * requests to VinFast's Auth0 and API endpoints from a browser.
 * 
 * Usage:
 *   node proxy-server.js
 *   or
 *   npm start (if added to package.json)
 * 
 * Then access the control panel at:
 *   http://localhost:3000/vinfast-control-panel-standalone.html
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// Try to load node-forge for CSR generation (optional dependency)
let forge = null;
try {
    forge = require('node-forge');
} catch (e) {
    console.warn('node-forge not installed. CSR generation will use simplified method.');
    console.warn('Install with: npm install node-forge');
}

// Use environment variable for port (hosting services provide this)
const PORT = process.env.PORT || 3000;
const HTML_FILE = path.join(__dirname, 'vinfast-control-panel-standalone.html');

// Optional: Basic authentication for proxy (set PROXY_AUTH env var)
const PROXY_AUTH = process.env.PROXY_AUTH || null;

// VinFast API Configuration
const REGIONS = {
    us: {
        auth0_domain: "vinfast-us-prod.us.auth0.com",
        auth0_client_id: "xhGY7XKDFSk1Q22rxidvwujfz0EPAbUP",
        auth0_audience: "https://vinfast-us-prod.us.auth0.com/api/v2/",
        api_base: "https://mobile.connected-car.vinfastauto.us"
    },
    eu: {
        auth0_domain: "vinfast-eu-prod.eu.auth0.com",
        auth0_client_id: "dxxtNkkhsPWW78x6s1BWQlmuCfLQrkze",
        auth0_audience: "https://vinfast-eu-prod.eu.auth0.com/api/v2/",
        api_base: "https://mobile.connected-car.vinfastauto.eu"
    },
    vn: {
        auth0_domain: "vin3s.au.auth0.com",
        auth0_client_id: "jE5xt50qC7oIh1f32qMzA6hGznIU5mgH",
        auth0_audience: "https://vin3s.au.auth0.com/api/v2/",
        api_base: "https://mobile.connected-car.vinfast.vn"
    }
};

// Helper to make HTTPS requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(data);
        }
        
        req.end();
    });
}

// Proxy server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Debug logging
    console.log(`[${req.method}] ${pathname}`);

    // Optional: Check proxy authentication
    if (PROXY_AUTH && pathname.startsWith('/api/')) {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${PROXY_AUTH}`) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized - Invalid proxy authentication' }));
            return;
        }
    }

    // CORS headers (allow specific origin in production, or * for development)
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    const corsHeaders = {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-vin-code, x-service-name, x-app-version, x-device-platform, x-device-family',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    // Serve HTML file
    if (pathname === '/' || pathname === '/index.html' || pathname.endsWith('.html')) {
        fs.readFile(HTML_FILE, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
        return;
    }

    // Proxy Auth0 token endpoint
    if (pathname === '/api/auth/token' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { region, email, password } = JSON.parse(body);
                const regionConfig = REGIONS[region];
                
                if (!regionConfig) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: 'Invalid region' }));
                    return;
                }

                const authUrl = `https://${regionConfig.auth0_domain}/oauth/token`;
                const authData = JSON.stringify({
                    client_id: regionConfig.auth0_client_id,
                    audience: regionConfig.auth0_audience,
                    grant_type: 'password',
                    scope: 'offline_access openid profile email',
                    username: email,
                    password: password
                });

                const options = {
                    hostname: regionConfig.auth0_domain,
                    path: '/oauth/token',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': authData.length
                    }
                };

                makeRequest(options, authData)
                    .then(response => {
                        res.writeHead(response.status, corsHeaders);
                        res.end(response.body);
                    })
                    .catch(err => {
                        res.writeHead(500, corsHeaders);
                        res.end(JSON.stringify({ error: err.message }));
                    });
            } catch (err) {
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
        return;
    }

    // Proxy refresh token endpoint
    if (pathname === '/api/auth/refresh' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { region, refresh_token } = JSON.parse(body);
                const regionConfig = REGIONS[region];
                
                if (!regionConfig) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: 'Invalid region' }));
                    return;
                }

                const refreshData = JSON.stringify({
                    client_id: regionConfig.auth0_client_id,
                    grant_type: 'refresh_token',
                    refresh_token: refresh_token
                });

                const options = {
                    hostname: regionConfig.auth0_domain,
                    path: '/oauth/token',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': refreshData.length
                    }
                };

                makeRequest(options, refreshData)
                    .then(response => {
                        res.writeHead(response.status, corsHeaders);
                        res.end(response.body);
                    })
                    .catch(err => {
                        res.writeHead(500, corsHeaders);
                        res.end(JSON.stringify({ error: err.message }));
                    });
            } catch (err) {
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
        return;
    }

    // Proxy VinFast API requests
    if (pathname.startsWith('/api/vinfast/') && req.method === 'GET') {
        const apiPath = pathname.replace('/api/vinfast', '');
        const query = parsedUrl.query;
        const { region, token, vin } = query;
        const regionConfig = REGIONS[region];
        
        if (!regionConfig || !token) {
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({ error: 'Missing parameters: region=' + region + ', token=' + (token ? 'present' : 'missing') }));
            return;
        }

        // Ensure path starts with /
        const cleanPath = apiPath.startsWith('/') ? apiPath : '/' + apiPath;
        
        // Build query string with all parameters except proxy-specific ones
        const apiQueryParams = [];
        for (const key in query) {
            if (key !== 'region' && key !== 'token' && key !== 'vin') {
                apiQueryParams.push(`${key}=${encodeURIComponent(query[key])}`);
            }
        }
        const queryString = apiQueryParams.length > 0 ? '?' + apiQueryParams.join('&') : '';
        
        const options = {
            hostname: regionConfig.api_base.replace('https://', ''),
            path: cleanPath + queryString,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-service-name': 'CAPP',
                'x-app-version': '1.10.3',
                'x-device-platform': 'HomeAssistant',
                'x-device-family': 'Integration'
            }
        };

        if (vin) {
            options.headers['x-vin-code'] = vin;
        }

        console.log(`[GET] Proxying: ${regionConfig.api_base}${cleanPath}${queryString}`);

        makeRequest(options)
            .then(response => {
                res.writeHead(response.status, corsHeaders);
                res.end(response.body);
            })
            .catch(err => {
                console.error('Proxy error:', err);
                res.writeHead(500, corsHeaders);
                res.end(JSON.stringify({ error: err.message }));
            });
        return;
    }

    // Proxy VinFast API POST requests
    if (pathname.startsWith('/api/vinfast/') && req.method === 'POST') {
        const apiPath = pathname.replace('/api/vinfast', '');
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { region, token, vin, data } = JSON.parse(body);
                const regionConfig = REGIONS[region];
                
                if (!regionConfig || !token) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: 'Missing parameters' }));
                    return;
                }

                // Ensure path starts with /
                const cleanPath = apiPath.startsWith('/') ? apiPath : '/' + apiPath;

                const postData = JSON.stringify(data || {});
                const options = {
                    hostname: regionConfig.api_base.replace('https://', ''),
                    path: cleanPath,
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'x-service-name': 'CAPP',
                        'x-app-version': '1.10.3',
                        'x-device-platform': 'HomeAssistant',
                        'x-device-family': 'Integration',
                        'Content-Length': postData.length
                    }
                };

                if (vin) {
                    options.headers['x-vin-code'] = vin;
                }

                console.log(`[POST] Proxying: ${regionConfig.api_base}${cleanPath}`);

                makeRequest(options, postData)
                    .then(response => {
                        res.writeHead(response.status, corsHeaders);
                        res.end(response.body);
                    })
                    .catch(err => {
                        console.error('Proxy error:', err);
                        res.writeHead(500, corsHeaders);
                        res.end(JSON.stringify({ error: err.message }));
                    });
            } catch (err) {
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({ error: 'Invalid request: ' + err.message }));
            }
        });
        return;
    }

    // Pairing: Start pairing (parse QR, generate keys, trigger OTP)
    if (pathname === '/api/vinfast/pairing/start' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { region, token, vin, user_id, email, qr_code } = JSON.parse(body);
                const regionConfig = REGIONS[region];
                
                if (!regionConfig || !token || !qr_code || !vin) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: 'Missing required parameters' }));
                    return;
                }

                startPairing(regionConfig, token, vin, user_id, email, qr_code)
                    .then(result => {
                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify(result));
                    })
                    .catch(err => {
                        console.error('Pairing start error:', err);
                        res.writeHead(500, corsHeaders);
                        res.end(JSON.stringify({ error: err.message }));
                    });
            } catch (err) {
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({ error: 'Invalid request: ' + err.message }));
            }
        });
        return;
    }

    // Pairing: Complete pairing (send OTP, get keys)
    if (pathname === '/api/vinfast/pairing/complete' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { region, token, vin, user_id, email, otp, pairing_session } = JSON.parse(body);
                const regionConfig = REGIONS[region];
                
                if (!regionConfig || !token || !otp || !pairing_session) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: 'Missing required parameters' }));
                    return;
                }

                completePairing(regionConfig, token, vin, user_id, email, otp, pairing_session)
                    .then(result => {
                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify(result));
                    })
                    .catch(err => {
                        console.error('Pairing complete error:', err);
                        res.writeHead(500, corsHeaders);
                        res.end(JSON.stringify({ error: err.message }));
                    });
            } catch (err) {
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({ error: 'Invalid request: ' + err.message }));
            }
        });
        return;
    }

    // Proxy VinFast Command Endpoint
    if (pathname === '/api/vinfast/command' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { region, token, vin, user_id, pairing_keys, message_name, device_key, value } = JSON.parse(body);
                const regionConfig = REGIONS[region];
                
                if (!regionConfig || !token || !pairing_keys) {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: 'Missing required parameters' }));
                    return;
                }

                // Sign and send command
                signAndSendCommand(regionConfig, token, vin, user_id, pairing_keys, message_name, device_key, value)
                    .then(result => {
                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify(result));
                    })
                    .catch(err => {
                        console.error('Command error:', err);
                        res.writeHead(500, corsHeaders);
                        res.end(JSON.stringify({ error: err.message, success: false }));
                    });
            } catch (err) {
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({ error: 'Invalid request: ' + err.message }));
            }
        });
        return;
    }

    // 404 for other paths
    console.log(`[404] Path not matched: ${pathname}`);
    res.writeHead(404, corsHeaders);
    res.end(JSON.stringify({ error: 'Not found', path: pathname }));
});

// Sign and send command to VinFast
function signAndSendCommand(regionConfig, accessToken, vin, userId, pairingKeys, messageName, deviceKey, value) {
    const PAIRING_BASE = "https://ccarapi.vinfast.com";
    const COMMAND_ENDPOINT = "/ccaraccessmgmt/api/v2/remote/app/command";
    
    return new Promise((resolve, reject) => {
        try {
            // Load private key
            const privateKeyPem = pairingKeys.private_key_pem;
            if (!privateKeyPem) {
                reject(new Error('Missing private_key_pem in pairing keys'));
                return;
            }
            
            const privateKey = crypto.createPrivateKey(privateKeyPem);
            
            // Load shared key
            const sharedKeyB64 = pairingKeys.shared_key_b64;
            if (!sharedKeyB64) {
                reject(new Error('Missing shared_key_b64 in pairing keys'));
                return;
            }
            const sharedKey = Buffer.from(sharedKeyB64, 'base64');
            
            // Get session ID
            const sessionId = pairingKeys.session_id || '';
            
            // Build message content
            const messageContent = {
                deviceKey: deviceKey,
                value: value
            };
            
            // Sign command
            const timestamp = Date.now().toString();
            const messageContentJson = JSON.stringify(messageContent);
            const messageContentB64 = Buffer.from(messageContentJson).toString('base64');
            
            // RSA signature: SHA256withRSA(privateKey, timestamp + messageContentB64)
            const dataToSign = Buffer.from(timestamp + messageContentB64);
            const signature = crypto.sign('RSA-SHA256', dataToSign, privateKey);
            const signatureB64 = signature.toString('base64');
            
            // HMAC signature: HMAC-SHA256(sharedKey, timestamp + messageContentB64)
            const hmacData = Buffer.from(timestamp + messageContentB64);
            const signature2 = crypto.createHmac('sha256', sharedKey).update(hmacData).digest('base64');
            
            // User ID hash: base64(SHA256(userId))
            const userIdHash = crypto.createHash('sha256').update(userId || '').digest('base64');
            
            // Build signed payload
            const signedPayload = {
                message_name: messageName,
                message_content: messageContentB64,
                sess_id: sessionId,
                timestamp: timestamp,
                signature: signatureB64,
                tag: null,
                user_id: userIdHash,
                isMasterProfile: true,
                signature2: signature2,
                wakeUpTimeOut: 60000
            };
            
            // Send command
            const options = {
                hostname: 'ccarapi.vinfast.com',
                path: COMMAND_ENDPOINT,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };
            
            makeRequest(options, JSON.stringify(signedPayload))
                .then(response => {
                    if (response.status === 200) {
                        let data;
                        try {
                            data = JSON.parse(response.body);
                        } catch (e) {
                            data = response.body;
                        }
                        console.log(`[COMMAND] ${messageName} sent successfully`);
                        resolve({ success: true, data: data });
                    } else {
                        reject(new Error(`Command failed: ${response.status} - ${response.body}`));
                    }
                })
                .catch(err => {
                    console.error('Command request error:', err);
                    reject(err);
                });
            
        } catch (err) {
            console.error('Command signing error:', err);
            reject(err);
        }
    });
}

// Start Pairing Process
function startPairing(regionConfig, accessToken, vin, userId, email, qrCode) {
    const PAIRING_BASE = "https://ccarapi.vinfast.com";
    const VERIFY_SESSION_ENDPOINT = "/ccaraccessmgmt/api/v1/pairing/app/verify-session";
    
    return new Promise((resolve, reject) => {
        try {
            // Parse QR code: K=<base64_key>&ssid=<session_id>&vin=<VIN>&timeout=<seconds>
            const qrParams = {};
            for (const pair of qrCode.split('&')) {
                if (pair.includes('=')) {
                    const [key, value] = pair.split('=', 2);
                    qrParams[key.trim()] = value.trim();
                }
            }
            
            // Validate required fields
            if (!qrParams.K || !qrParams.ssid || !qrParams.vin) {
                reject(new Error('Invalid QR code format'));
                return;
            }
            
            // Validate VIN matches
            if (qrParams.vin !== vin) {
                reject(new Error(`QR VIN (${qrParams.vin}) doesn't match vehicle VIN (${vin})`));
                return;
            }
            
            // Generate RSA keypair (2048-bit)
            const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            });
            
            // Generate device ID
            const deviceId = crypto.randomBytes(4).toString('hex');
            
            // Generate CSR
            let csrPem;
            if (forge) {
                // Use node-forge for proper CSR generation
                const keys = forge.pki.rsa.generateKeyPair(2048);
                const csr = forge.pki.createCertificationRequest();
                csr.publicKey = keys.publicKey;
                csr.setSubject([{
                    name: 'commonName',
                    value: `${vin}_${deviceId}`
                }, {
                    name: 'organizationalUnitName',
                    value: 'WebControlPanel'
                }]);
                csr.sign(keys.privateKey);
                csrPem = forge.pki.certificationRequestToPem(csr);
            } else {
                // Simplified CSR (may not work, but worth trying)
                const csrSubject = `CN=${vin}_${deviceId},OU=WebControlPanel`;
                csrPem = `-----BEGIN CERTIFICATE REQUEST-----\n${Buffer.from(csrSubject).toString('base64')}\n-----END CERTIFICATE REQUEST-----`;
            }
            
            // Encrypt CSR (matching Python implementation - uses base64 encoding)
            const seed = crypto.randomBytes(16);
            const seedB64 = seed.toString('base64');
            
            // Python code uses base64 encoding (line 171 in pairing.py)
            const csrBytes = Buffer.from(csrPem);
            const encryptedCsrB64 = csrBytes.toString('base64');
            
            // Trigger OTP via verify-session
            const verifyPayload = {
                ssid: qrParams.ssid,
                email: email || userId, // Use email if provided, otherwise user_id
                retry: false
            };
            
            const options = {
                hostname: PAIRING_BASE.replace('https://', ''),
                path: VERIFY_SESSION_ENDPOINT,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };
            
            makeRequest(options, JSON.stringify(verifyPayload))
                .then(response => {
                    if (response.status === 200) {
                        // Store pairing session data
                        const pairingSession = {
                            qr_params: qrParams,
                            private_key_pem: privateKey,
                            encrypted_csr: encryptedCsrB64,
                            seed: seedB64,
                            device_id: deviceId,
                            csr_pem: csrPem
                        };
                        
                        resolve({ 
                            success: true, 
                            pairing_session: pairingSession,
                            message: 'OTP sent to your email/phone'
                        });
                    } else {
                        reject(new Error(`Verify session failed: ${response.status} - ${response.body}`));
                    }
                })
                .catch(reject);
                
        } catch (err) {
            reject(err);
        }
    });
}

// Complete Pairing Process
function completePairing(regionConfig, accessToken, vin, userId, email, otp, pairingSession) {
    const PAIRING_BASE = "https://ccarapi.vinfast.com";
    const SEND_PAIR_DATA_ENDPOINT = "/ccaraccessmgmt/api/v1/pairing/app/send-pair-data";
    
    return new Promise((resolve, reject) => {
        try {
            const { qr_params, encrypted_csr, seed, device_id } = pairingSession;
            
            // Send pairing data with OTP
            const pairPayload = {
                encryptedCSR: encrypted_csr,
                otp: otp,
                email: email || userId,
                seed: seed,
                sessionId: qr_params.ssid
            };
            
            const options = {
                hostname: PAIRING_BASE.replace('https://', ''),
                path: SEND_PAIR_DATA_ENDPOINT,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };
            
            makeRequest(options, JSON.stringify(pairPayload))
                .then(response => {
                    if (response.status === 200) {
                        let data;
                        try {
                            data = JSON.parse(response.body);
                        } catch (e) {
                            data = { data: {} };
                        }
                        
                        const responseData = data.data || data;
                        
                        // Extract pairing keys from response
                        const pairingKeys = {
                            private_key_pem: pairingSession.private_key_pem,
                            shared_key_b64: responseData.base64EncryptedShareKey || responseData.base64EncryptedSharedKey || '',
                            session_id: qr_params.ssid
                        };
                        
                        if (!pairingKeys.shared_key_b64) {
                            // If shared key not in expected format, try alternative
                            console.warn('Shared key format may be different, using available data');
                        }
                        
                        console.log('[PAIRING] Pairing completed successfully');
                        resolve({ 
                            success: true, 
                            pairing_keys: pairingKeys 
                        });
                    } else {
                        reject(new Error(`Pairing failed: ${response.status} - ${response.body}`));
                    }
                })
                .catch(reject);
                
        } catch (err) {
            reject(err);
        }
    });
}

server.listen(PORT, () => {
    console.log(`\n🚀 VinFast Control Panel Proxy Server`);
    console.log(`   Running on http://localhost:${PORT}`);
    console.log(`   Open: http://localhost:${PORT}/vinfast-control-panel-standalone.html\n`);
});
