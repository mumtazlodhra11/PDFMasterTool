# Test Lambda Function in Browser Console

## Quick Test

1. Open: `http://localhost:9001/tools/word-to-pdf`
2. Open DevTools (F12) → Console tab
3. Paste this test code:

```javascript
fetch('https://euptkdl3fgsgyoud66lkiti54q0nnwbx.lambda-url.eu-west-1.on.aws/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    fileContent: 'UEsDBBQAAAAIAA==', 
    fileName: 'test.docx' 
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

## What to Look For

- **If it works**: You'll see response (success: true/false)
- **If it fails**: You'll see error details

## If Console Test Works But App Doesn't

The issue is in our frontend code. Check:
1. Network tab when app makes request
2. Compare with console request headers
3. Check if request is being made at all

## Common Issues

1. **CORS Preflight**: OPTIONS request fails
2. **Request Size**: Too large payload
3. **Browser Extension**: Blocking requests
4. **Network Policy**: Corporate firewall














