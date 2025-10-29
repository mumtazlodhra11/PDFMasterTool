# GitHub Pages Setup Guide

## 🎯 Will Do After Backend is Deployed

### **Step 1: Install gh-pages**
```powershell
npm install -D gh-pages
```

### **Step 2: Update package.json**
Add this to scripts section:
```json
"deploy": "npm run build && gh-pages -d dist"
```

### **Step 3: Update astro.config.mjs**
```javascript
export default defineConfig({
  site: 'https://yourusername.github.io',
  base: '/PDFMasterTool/',
  // rest of config...
});
```

### **Step 4: Create .env.production**
```env
VITE_CLOUD_RUN_URL=https://YOUR-CLOUD-RUN-URL
```

### **Step 5: Deploy**
```powershell
npm run deploy
```

### **Step 6: Enable GitHub Pages**
1. Go to: https://github.com/mumtazlodhra11/PDFMasterTool/settings/pages
2. Source: `gh-pages` branch
3. Click Save

**Done!** Site will be live at:
```
https://mumtazlodhra11.github.io/PDFMasterTool
```

---

**Waiting for backend deployment first...**


