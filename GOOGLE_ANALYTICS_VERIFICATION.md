# Google Analytics Verification Guide

## ✅ Code Status
- **Measurement ID**: G-6BEN7WTV0R
- **Stream URL**: https://www.pdfelitetools.com
- **Code Status**: ✅ Correctly deployed and live

## 🔍 Verification Steps

### Step 1: Browser Verification
1. Open: https://www.pdfelitetools.com
2. Press F12 (DevTools)
3. Go to Console tab
4. Type: `window.gtag`
   - Should show: `ƒ gtag() { [native code] }`
5. Type: `window.dataLayer`
   - Should show: `Array(1)` or similar

### Step 2: Network Tab Check
1. F12 → Network tab
2. Filter: "gtag" or "analytics"
3. Refresh page (F5)
4. Should see requests to:
   - `googletagmanager.com/gtag/js?id=G-6BEN7WTV0R`
   - `google-analytics.com/g/collect`

### Step 3: Google Tag Assistant
1. Install Chrome Extension: "Tag Assistant Legacy"
2. Visit: https://www.pdfelitetools.com
3. Click extension icon
4. Should show: "Google Analytics: Universal Analytics" or "GA4"

### Step 4: Google Analytics Real-Time
1. Go to: https://analytics.google.com
2. Select your property
3. Go to: Reports → Real-time
4. Visit: https://www.pdfelitetools.com
5. Should see your visit in real-time (within 30 seconds)

## ⏰ Timing
- CloudFront cache: 2-5 minutes
- Google verification: 1-5 minutes
- Total wait: Up to 10 minutes

## 🐛 Troubleshooting

### If still not detected:
1. **Wait 10 minutes** - CloudFront + Google propagation
2. **Clear all caches** - Browser + CloudFront
3. **Try different browser** - Incognito mode
4. **Check HTTPS** - Must be https:// (not http://)
5. **Check domain** - Must be exact: www.pdfelitetools.com

### Manual Verification:
Visit: https://www.pdfelitetools.com
Open Console (F12) and run:
```javascript
// Check if gtag is loaded
console.log('gtag:', typeof window.gtag);
console.log('dataLayer:', window.dataLayer);

// Manually trigger a pageview
if (window.gtag) {
  window.gtag('event', 'test_event', {
    'event_category': 'Verification',
    'event_label': 'Manual Test'
  });
  console.log('✅ Google Analytics is working!');
} else {
  console.log('❌ Google Analytics not loaded');
}
```

## 📝 Current Code Format
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-6BEN7WTV0R"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-6BEN7WTV0R');
</script>
```

✅ This matches Google's exact format!


