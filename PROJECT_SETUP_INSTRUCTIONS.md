# Google Cloud Project Setup

## ✅ Current Status
- gcloud CLI: Installed ✅
- Authentication: Logged in as mumtaz.lodhra11@gmail.com ✅
- Project: Need to create 📋

---

## 🎯 Next Steps

### Option 1: Console se Project Banao (EASIER)

1. Open: https://console.cloud.google.com/
2. Top left corner: "Select a project" dropdown
3. Click: "NEW PROJECT"
4. Project Name: `pdfmastertool`
5. Click: "CREATE"
6. Project ID copy karo (e.g., `pdfmastertool-123456`)

---

### Option 2: CLI se Project Banao

Try different project ID with numbers:

```powershell
gcloud projects create pdfmastertool-$(Get-Random -Maximum 999999)
```

Example output:
- Project ID: pdfmastertool-437816
- Project Number: 123456789012

---

## After Project Created

### Get Project ID:
```powershell
gcloud projects list
```

### Set Project:
```powershell
gcloud config set project pdfmastertool-XXXXXX
```

### Verify:
```powershell
gcloud config get-value project
```

---

## Then Deploy

```powershell
cd google-cloud-run
.\deploy.ps1
```

---

**Action:** Console se project banao aur project ID bhejo!


