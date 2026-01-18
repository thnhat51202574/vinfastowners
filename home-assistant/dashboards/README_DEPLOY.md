# Quick Deploy Guide

## 🚀 Fastest Way: Railway (5 minutes)

1. **Create `package.json`** (already created!)
2. **Upload to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

3. **Deploy on Railway:**
   - Go to https://railway.app
   - Sign up with GitHub
   - New Project → Deploy from GitHub repo
   - Select your repo
   - Railway auto-detects and deploys!

4. **Get your URL:**
   - Railway provides: `https://your-app.railway.app`
   - Update HTML: `const PROXY_URL = 'https://your-app.railway.app'`

5. **Access:**
   - `https://your-app.railway.app/vinfast-control-panel-standalone.html`

**That's it!** Railway handles everything automatically.

---

## 📦 Files Needed for Deployment

- ✅ `proxy-server.js` - Proxy server
- ✅ `vinfast-control-panel-standalone.html` - Control panel
- ✅ `package.json` - Node.js config (already created)

---

## 🔒 Optional: Add Security

Set environment variable in Railway:
- `PROXY_AUTH` = `your-secret-token-here`

Then update HTML to send auth header (if needed).

---

## 🌐 Alternative: Separate Hosting

**HTML on Vercel (free, fast):**
1. Go to https://vercel.com
2. Drag & drop `vinfast-control-panel-standalone.html`
3. Get URL: `https://your-app.vercel.app`
4. Update: `const PROXY_URL = 'https://your-proxy.railway.app'`

**Proxy on Railway:**
- Deploy `proxy-server.js` + `package.json`
- Get proxy URL
- Update HTML with proxy URL

---

## ✅ Checklist

- [ ] Created `package.json`
- [ ] Uploaded to GitHub
- [ ] Deployed to Railway (or other service)
- [ ] Got deployment URL
- [ ] Updated HTML with proxy URL
- [ ] Tested login
- [ ] (Optional) Added PROXY_AUTH for security

---

**Need help?** See `DEPLOYMENT.md` for detailed instructions.
