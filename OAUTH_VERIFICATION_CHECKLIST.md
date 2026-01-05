# ✅ Google OAuth Configuration Checklist

**Ngày**: 2025-12-26
**Status**: Đang chờ Google propagate changes (5-10 phút)

---

## 📋 VERIFICATION CHECKLIST

### ✅ Step 1: Google Cloud Console Configuration

Vào: https://console.cloud.google.com/apis/credentials?project=in360project

**OAuth 2.0 Client ID:** `1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1`

#### Required Settings:

- [ ] **Application type**: Web application
- [ ] **Authorized JavaScript origins**:
  - [ ] `https://thptphuocbuu.edu.vn`
- [ ] **Authorized redirect URIs**:
  - [ ] `https://thptphuocbuu.edu.vn/api/auth/callback/google`

**Screenshot location**: Verify trong Google Console

---

### ✅ Step 2: Server Configuration (Already Done ✓)

Cloud Run environment variables:

- ✅ `NEXTAUTH_URL` = `https://thptphuocbuu.edu.vn`
- ✅ `GOOGLE_CLIENT_ID` = `1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1...`
- ✅ `GOOGLE_CLIENT_SECRET` = Set from Secret Manager

---

### ✅ Step 3: Test OAuth Flow

**Wait 5-10 minutes** after saving Google Console changes, then test:

#### Test 1: OAuth Providers Endpoint ✅
```bash
curl "https://thptphuocbuu.edu.vn/api/auth/providers"
```

**Expected result:**
```json
{
  "google": {
    "callbackUrl": "https://thptphuocbuu.edu.vn/api/auth/callback/google"
  }
}
```

**Status:** ✅ **PASSED** (tested at 22:54 UTC)

---

#### Test 2: Google OAuth Signin Redirect ⏳
```bash
curl -I "https://thptphuocbuu.edu.vn/api/auth/signin/google"
```

**Expected result:**
- HTTP 302 redirect to `accounts.google.com`
- OR HTTP 200 with redirect page

**Current result:**
- ❌ HTTP 400 (as of 22:54 UTC)
- **Reason**: Google changes not propagated yet

**Action**: Wait 5-10 minutes, then retry

---

#### Test 3: Web Login Page
Visit: https://thptphuocbuu.edu.vn/login

**Steps:**
1. Click "Sign in with Google" button
2. Should redirect to Google OAuth consent screen
3. After approving, redirect back to `https://thptphuocbuu.edu.vn/api/auth/callback/google`
4. Should create user account and login

**Current status:** ⏳ Waiting for Google propagation

---

### ✅ Step 4: Verify in Browser DevTools

After clicking "Sign in with Google":

1. Open Browser DevTools (F12) → Network tab
2. Should see redirect to:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1...
     &redirect_uri=https://thptphuocbuu.edu.vn/api/auth/callback/google
     &response_type=code
     &scope=openid%20email%20profile
   ```

3. After approving on Google:
   - Redirect to: `https://thptphuocbuu.edu.vn/api/auth/callback/google?code=...`
   - Should login successfully

**Expected errors if not configured:**
- ❌ `Error 400: redirect_uri_mismatch` → Check Authorized redirect URIs
- ❌ `Error 400: origin_mismatch` → Check Authorized JavaScript origins
- ❌ `AccessDenied` → Check NextAuth signIn callback in `lib/auth.ts`

---

## 🔍 DEBUGGING

### If still getting HTTP 400 after 10 minutes:

#### Check 1: Verify Google Console Settings

Screenshot the following from Google Console:

1. **Authorized JavaScript origins** section
2. **Authorized redirect URIs** section
3. Make sure you clicked **SAVE** button

#### Check 2: Test with Different Browser

- Try Incognito/Private mode
- Clear cookies for `thptphuocbuu.edu.vn`
- Test with different Google account

#### Check 3: Check NextAuth Callback

File: `lib/auth.ts:282-390`

Potential blocking reasons:
1. Email domain not in whitelist (line 346-348)
   - Allowed domains: `thptphuocbuu.edu.vn`, `gmail.com`
2. User status is SUSPENDED (line 301-304)
3. Database error

**Check logs:**
```bash
gcloud logging read \
  "resource.labels.service_name=thptphuocbuu360 AND \
   textPayload:~'signIn callback' OR textPayload:~'OAuth'" \
  --limit 50 \
  --format json
```

#### Check 4: Verify NEXTAUTH_URL

```bash
# Check Cloud Run env var
gcloud run services describe thptphuocbuu360 \
  --region asia-southeast1 \
  --format="value(spec.template.spec.containers[0].env)"
```

Should include:
```
NEXTAUTH_URL=https://thptphuocbuu.edu.vn
```

---

## ⏰ TIMELINE

| Time (UTC) | Action | Status |
|------------|--------|--------|
| 22:30 | Migrated to Neon PostgreSQL | ✅ Done |
| 22:38 | Seeded database with sample data | ✅ Done |
| 22:54 | Tested OAuth providers endpoint | ✅ Working |
| 22:54 | Tested OAuth signin (HTTP 400) | ❌ Not working yet |
| 22:55 | User added domain to Google Console | ✅ Done |
| **23:00-23:10** | **Wait for Google propagation** | ⏳ **WAITING** |
| **23:10+** | **Retest OAuth signin** | ⏳ **PENDING** |

---

## 📞 NEXT STEPS

### Immediate (within 10 minutes):

1. ⏳ **Wait 5-10 minutes** for Google to propagate changes
2. 🧪 **Test again** at ~23:05 UTC (10 minutes from now)
3. 🌐 **Try browser login**: https://thptphuocbuu.edu.vn/login

### If still not working after 10 minutes:

1. 📸 **Screenshot Google Console** → Send for verification
2. 🔍 **Check Cloud Run logs** for OAuth errors
3. 🧹 **Clear browser cache** and retry

### If working:

1. ✅ Test login with Google account
2. ✅ Verify user created in Neon database
3. ✅ Update documentation

---

## ✅ SUCCESS CRITERIA

OAuth is working when ALL of these pass:

- [ ] `curl -I "https://thptphuocbuu.edu.vn/api/auth/signin/google"` returns HTTP 302
- [ ] Browser redirects to Google OAuth consent screen
- [ ] After approving, redirects back to website
- [ ] User is logged in and redirected to dashboard
- [ ] New user created in database with Google account linked

---

**Current Status:** ⏳ **Waiting for Google propagation (5-10 minutes)**

**Next Test Time:** ~23:05 UTC (10 minutes from initial configuration)

**Test Command:**
```bash
# Quick test (run this in ~5 minutes)
curl -I "https://thptphuocbuu.edu.vn/api/auth/signin/google" 2>&1 | head -5
```

If you see **HTTP 302** or **Location: https://accounts.google.com** → ✅ **SUCCESS!**

If still **HTTP 400** → Check Google Console configuration again.
