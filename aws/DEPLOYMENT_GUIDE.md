# 🚀 Deploy Remaining 3 Lambda Functions

## Current Status

✅ **Deployed (2 functions):**
- `pdfmastertool-word-to-pdf`
- `pdfmastertool-pdf-to-word`

❌ **Not Deployed (3 functions):**
- `pdfmastertool-pdf-to-excel`
- `pdfmastertool-pdf-to-ppt`
- `pdfmastertool-ppt-to-pdf`

---

## 📦 Quick Manual Deployment

### Step 1: Create Function (Repeat 3 times)

1. Go to AWS Lambda Console: https://console.aws.amazon.com/lambda
2. Click **"Create function"** (orange button)
3. Choose **"Author from scratch"**
4. Fill in:
   - **Function name**: `pdfmastertool-pdf-to-excel`
   - **Runtime**: Node.js 20.x
   - **Architecture**: x86_64
5. Click **"Create function"**

### Step 2: Upload Code

1. In the **Code** tab
2. Click **"Upload from"** → **.zip file**
3. Select: `lambda/pdf-to-excel.zip`
4. Click **"Save"**

### Step 3: Configure Settings

1. Go to **Configuration** → **General configuration** → **Edit**
2. Set:
   - **Memory**: 2048 MB
   - **Timeout**: 2 min 0 sec
3. Click **"Save"**

### Step 4: Add Environment Variables

1. Go to **Configuration** → **Environment variables** → **Edit**
2. Add these variables:
   ```
   Key: S3_BUCKET
   Value: your-bucket-name
   
   Key: AWS_REGION
   Value: eu-west-1
   ```
3. Click **"Save"**

### Step 5: Enable Function URL

1. Go to **Configuration** → **Function URL** → **Create function URL**
2. Settings:
   - **Auth type**: NONE
   - **Configure cross-origin resource sharing (CORS)**: ✅ Enable
   - **Allow origin**: *
   - **Allow methods**: *
   - **Allow headers**: *
3. Click **"Save"**
4. **Copy the Function URL** (you'll need this!)

### Step 6: Add Permissions

1. Go to **Configuration** → **Permissions**
2. Click on the **Role name**
3. In IAM console, click **"Add permissions"** → **"Attach policies"**
4. Search and attach:
   - `AmazonS3FullAccess` (or custom S3 policy)
5. Click **"Add permissions"**

---

## 🔄 Repeat for All 3 Functions

Do the above steps for:
1. ✅ `pdfmastertool-pdf-to-excel`
2. ✅ `pdfmastertool-pdf-to-ppt`
3. ✅ `pdfmastertool-ppt-to-pdf`

---

## 🔗 Update .env File

After deployment, add the Function URLs to your `.env`:

```env
# Existing (already working)
PUBLIC_LAMBDA_PDF_TO_WORD=https://xxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_WORD_TO_PDF=https://xxxxx.lambda-url.eu-west-1.on.aws/

# Add these new ones:
PUBLIC_LAMBDA_PDF_TO_EXCEL=https://xxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PDF_TO_PPT=https://xxxxx.lambda-url.eu-west-1.on.aws/
PUBLIC_LAMBDA_PPT_TO_PDF=https://xxxxx.lambda-url.eu-west-1.on.aws/
```

---

## ✅ Test Your Functions

After deployment, test each function:

```bash
# Test PDF to Excel
curl -X POST https://your-function-url.lambda-url.eu-west-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"fileKey":"test.pdf","fileName":"test.pdf"}'
```

---

## 🎯 Expected Result

After deploying all 3, your AWS Lambda will have:

```
Total Functions: 7

PDFMasterTool (5):
✅ pdfmastertool-word-to-pdf
✅ pdfmastertool-pdf-to-word
✅ pdfmastertool-pdf-to-excel (NEW)
✅ pdfmastertool-pdf-to-ppt (NEW)
✅ pdfmastertool-ppt-to-pdf (NEW)

Others (2):
⚪ contact-form-handler
⚪ ssl-certificate-checker
```

---

## 💡 Tips

- Use the same IAM role as `word-to-pdf` and `pdf-to-word`
- Function URLs should have CORS enabled
- Test each function after deployment
- Keep Function URLs private - don't commit to Git

---

## 🚨 Troubleshooting

### Issue: "Role doesn't exist"
- Use existing role from `word-to-pdf` function
- Or create new role with S3 access

### Issue: "Timeout"
- Increase timeout to 120 seconds
- Increase memory to 2048 MB

### Issue: "S3 Access Denied"
- Check IAM role has S3 permissions
- Verify S3_BUCKET environment variable

---

**Estimated Time: 15 minutes** (5 min per function)

Good luck! 🚀









