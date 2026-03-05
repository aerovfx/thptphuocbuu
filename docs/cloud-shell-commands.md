# Lệnh chạy trong Cloud Shell (project: gen-lang-client-0753799782)

Copy và dán **từng lệnh một** vào Cloud Shell (một dòng, không xuống dòng), rồi Enter.

---

## 1. Cho phép mọi người truy cập Cloud Run (bỏ 403)

```bash
gcloud run services add-iam-policy-binding thptphuocbuu \
  --region=asia-southeast1 \
  --project=gen-lang-client-0753799782 \
  --member=allUsers \
  --role=roles/run.invoker
```

Nếu lệnh chạy xong không báo lỗi → mở https://thptphuocbuu-880621524780.asia-southeast1.run.app sẽ không còn 403.

Nếu báo lỗi **FAILED_PRECONDITION** / **organization policy** → policy vẫn đang chặn `allUsers`. Thử mục 2 và 2a bên dưới.

---

## 2. Lỗi "do not belong to a permitted customer" – phải sửa Organization Policy

Lỗi này nghĩa là **exception cho project chưa được áp dụng**. Không có lệnh nào trong Cloud Shell (chạy với project `gen-lang-client-0753799782`) có thể ghi đè policy cấp Organization.

**Cách xử lý (bắt buộc):**

- **Option A – Console (khuyến nghị):** Admin tổ chức GCP (tài khoản có quyền Organization Policy) mở **Organization** (không chọn project/folder):
  1. Vào: https://console.cloud.google.com/iam-admin/orgpolicies  
  2. Ở dropdown chọn **Organization** (tên org của bạn), không chọn project.
  3. Tìm policy **"Restrict which customers can be in IAM policy"** hoặc **"Restrict allowed policy members in IAM allow policies"**.
  4. **Manage policy** → **Add exception** → chọn project **gen-lang-client-0753799782** → đặt **Not enforced** (hoặc Allow) → **Save**.

- **Option B – Nếu policy đang bật ở cấp Folder:** Trong orgpolicies chọn đúng **Folder** chứa project → tìm cùng policy → thêm exception cho project **gen-lang-client-0753799782** → Save.

Sau khi Save, đợi **5–10 phút** (policy có thể trễ) rồi chạy lại lệnh ở mục 1.

**2a. Vẫn lỗi "permitted customer" – Có thể còn policy khác (domain restriction)**

Lỗi *"do not belong to a permitted customer"* thường do constraint **Domain restricted sharing** / **Restrict which customers can be in IAM policy** (`iam.allowedPolicyMemberDomains`), không phải "Restrict allowed policy members". Cần thêm exception cho **cùng project** với policy đó:

1. Vào https://console.cloud.google.com/iam-admin/orgpolicies (chọn **Organization**).
2. Tìm policy tên dạng **"Restrict which customers can be in IAM policy"** hoặc **"Domain restricted sharing"** (constraint có thể là `iam.allowedPolicyMemberDomains`).
3. **Manage policy** → **Override parent's policy** cho project **thptphuocbuu** (gen-lang-client-0753799782) → **Not enforced** → **Save**.
4. Đợi 5–10 phút rồi chạy lại lệnh mục 1.

**2b. Ghi đè policy bằng gcloud (IAM API + Cloud Resource Manager API đã bật)**

Bạn có thể **ghi đè** policy ở **cấp project** bằng lệnh cho **một số** constraint. Trong **Cloud Shell** (project gen-lang-client-0753799782):

**Bước 1 – Policy domain (Restrict which customers…)** – thường đủ để hết lỗi "permitted customer":
```bash
cat > /tmp/allow-domains.yaml << 'EOF'
constraint: constraints/iam.allowedPolicyMemberDomains
listPolicy:
  allValues: ALLOW
EOF
gcloud resource-manager org-policies set-policy /tmp/allow-domains.yaml --project=gen-lang-client-0753799782
```

**Bước 2 – Constraint "Restrict allowed policy members" (allUsers)**  
Lệnh `set-policy` với constraint `iam.managed.allowedPolicyMembers` **có thể báo lỗi**:
`INVALID_ARGUMENT: constraints/iam.managed.allowedPolicyMembers constraint must be of the form: constraints/[service].[constraint name], e.g. constraints/serviceuser.services`  
→ Đây là **giới hạn của gcloud**: constraint này có hai dấu chấm, trong khi gcloud đang kiểm tra dạng một dấu chấm. **Không thể dùng gcloud** để override policy "Restrict allowed policy members in IAM allow policies" ở project.

**Cách xử lý:** Dùng **Console** (Option A / 2a ở trên): vào **Organization** → policy **"Restrict allowed policy members in IAM allow policies"** → **Manage policy** → **Add exception** cho project **gen-lang-client-0753799782** → **Not enforced** → **Save**. Chi tiết: xem file `docs/HUONG_DAN_THEM_EXCEPTION_ORG_POLICY.md`.

**Bước 3 – Đợi 5–10 phút** (policy có thể trễ), rồi chạy lại lệnh mục 1 (add-iam-policy-binding allUsers).

*(Cần quyền Organization Policy Administrator ở project hoặc org.)*

---

**2c. Thử cấp quyền qua Console (đôi khi khác với gcloud)**

Cloud Run → https://console.cloud.google.com/run?project=gen-lang-client-0753799782 → chọn service **thptphuocbuu** (region asia-southeast1) → tab **Permissions** → **Grant access** → New principals: `allUsers` → Role: **Cloud Run Invoker** → **Save**. Nếu vẫn báo lỗi policy thì tiếp tục làm 2a.

---

## 2b. Cấp role Organization Policy Administrator (một dòng, tránh lỗi copy)

**Chỉ chạy được nếu tài khoản có quyền ở Organization.** Dán **từng dòng một** (không có dấu `\` xuống dòng).

**Bước 1 – Lấy ID Organization (số 12 chữ số):**
```
gcloud organizations list
```
→ Ghi lại cột **ID** (ví dụ `123456789012`).

**Bước 2 – Cấp role (Org ID thptphuocbuu.edu.vn = 1005481284924). Chỉ tài khoản Owner/Admin Organization mới chạy được:**
```
gcloud organizations add-iam-policy-binding 1005481284924 --member="user:admin@thptphuocbuu.edu.vn" --role="roles/orgpolicy.policyAdmin"
```

---

## 3. Kiểm tra policy nào đang chặn (chạy trong Cloud Shell)

Lỗi "permitted customer" thường do **domain** restriction. Chạy hai lệnh sau để xem policy có đang enforce không:

```bash
gcloud resource-manager org-policies describe iam.allowedPolicyMemberDomains --project=gen-lang-client-0753799782
```

```bash
gcloud resource-manager org-policies describe iam.managed.allowedPolicyMembers --project=gen-lang-client-0753799782
```

- Nếu có `policy: rules: enforce: true` hoặc list `allowedValues`/`deniedValues` → policy đang bật. Cần vào Console → **Organization** (không phải project) → tìm đúng policy tên/constraint đó → **Override** cho project **gen-lang-client-0753799782** = **Not enforced**, rồi Save. Đợi 5–10 phút và chạy lại lệnh mục 1.

---

## 4. (Tùy chọn) Xem thông tin service Cloud Run

```bash
gcloud run services describe thptphuocbuu \
  --region=asia-southeast1 \
  --project=gen-lang-client-0753799782 \
  --format="value(status.url)"
```
