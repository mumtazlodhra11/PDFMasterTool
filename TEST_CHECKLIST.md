# 🧪 Local Testing Checklist

## Testing Plan - PDFMasterTool

**Date:** October 26, 2025  
**Environment:** Local Development (http://localhost:9001)

---

## 🎯 Priority Testing

### ✅ Server-Side Tools (NEW - Lambda)
These are newly deployed, test first:

1. **Word to PDF** - `/tools/word-to-pdf`
   - [ ] Page loads
   - [ ] Upload .docx file
   - [ ] Conversion successful
   - [ ] Download works

2. **PDF to Word** - `/tools/pdf-to-word`
   - [ ] Page loads
   - [ ] Upload .pdf file
   - [ ] Conversion successful
   - [ ] Download works

3. **PDF to Excel** - `/tools/pdf-to-excel` (NEW)
   - [ ] Page loads
   - [ ] Upload .pdf file
   - [ ] Conversion successful
   - [ ] Download works

4. **PDF to PowerPoint** - `/tools/pdf-to-ppt` (NEW)
   - [ ] Page loads
   - [ ] Upload .pdf file
   - [ ] Conversion successful
   - [ ] Download works

5. **PowerPoint to PDF** - `/tools/powerpoint-to-pdf` (NEW)
   - [ ] Page loads
   - [ ] Upload .pptx file
   - [ ] Conversion successful
   - [ ] Download works

---

## ✅ Client-Side Tools (Spot Check)

### Essential Tools:
6. **Merge PDF** - `/tools/merge-pdf`
   - [ ] Upload multiple PDFs
   - [ ] Merge successful
   - [ ] Download works

7. **Compress PDF** - `/tools/compress-pdf`
   - [ ] Upload large PDF
   - [ ] Compression works
   - [ ] File size reduced

8. **Image to PDF** - `/tools/image-to-pdf`
   - [ ] Upload images (JPG/PNG)
   - [ ] Conversion successful
   - [ ] Download works

---

## 🖥️ UI/UX Testing

### Homepage:
- [ ] Loads correctly
- [ ] All 30 tools listed
- [ ] Navigation works
- [ ] Dark mode toggle works
- [ ] Responsive on mobile (dev tools)

### Tool Pages:
- [ ] File uploader works
- [ ] Drag & drop works
- [ ] Progress bars show
- [ ] Error handling works
- [ ] Success modal displays
- [ ] Download button works

---

## 📱 Mobile Responsiveness

Test in Chrome DevTools:
- [ ] iPhone 12 Pro (390x844)
- [ ] iPad (768x1024)
- [ ] Desktop (1920x1080)

Check:
- [ ] Layout adapts
- [ ] Buttons accessible
- [ ] Text readable
- [ ] File upload works
- [ ] No horizontal scroll

---

## ⚡ Performance Testing

- [ ] Page load < 3 seconds
- [ ] First contentful paint < 1.5s
- [ ] Tools respond quickly
- [ ] No console errors
- [ ] No network errors

---

## 🔍 Browser Testing

Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if available)

---

## 🐛 Error Scenarios

- [ ] Upload invalid file type
- [ ] Upload oversized file (>150MB)
- [ ] Upload without file
- [ ] Network disconnect during upload
- [ ] Lambda timeout handling

---

## 📊 Lambda Function Testing

### Test API Directly:

```bash
# Test Word to PDF
curl -X POST https://v3vc24ms56xk3rrh326mhjdjfi0xhsoo.lambda-url.eu-west-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"test":"health-check"}'

# Test PDF to Word
curl -X POST https://6c4qcjkoki7ophbnahx33vdbne0iwncr.lambda-url.eu-west-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"test":"health-check"}'
```

---

## ✅ Success Criteria

All checks must pass:
- ✅ All 5 Lambda tools work
- ✅ No console errors
- ✅ File upload/download works
- ✅ UI responsive on all devices
- ✅ No broken links
- ✅ Performance acceptable

---

## 🚨 Known Issues (Track Here)

- None yet

---

## 📝 Test Results

### Server Running:
```
Dev Server: http://localhost:9001
Status: ⏳ Starting...
```

### Environment:
```
✅ .env configured
✅ Lambda URLs set
✅ Node.js running
```

---

**Status:** Ready for testing! 🧪

Open browser: http://localhost:9001











