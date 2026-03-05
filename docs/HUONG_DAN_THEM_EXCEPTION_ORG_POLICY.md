# Hướng dẫn thêm Exception cho policy "Restrict allowed policy members in IAM allow policies"

Làm lần lượt các bước sau trong **Google Cloud Console** (trình duyệt).

**Lưu ý:** Constraint này (`iam.managed.allowedPolicyMembers`) **không thể** override bằng lệnh `gcloud resource-manager org-policies set-policy` — lệnh đó báo lỗi *constraint must be of the form: constraints/[service].[constraint name]*. Cần dùng Console như hướng dẫn bên dưới.

---

## Nút "Manage policy" / "Edit" bị ẩn – Thiếu quyền

Nếu bạn thấy thông báo:

> The following permissions are required to edit organization policies: orgpolicy.policy.get, orgpolicy.policies.create, orgpolicy.policies.delete, and orgpolicy.policies.update.  
> The "Organization Policy Administrator" (roles/orgpolicy.policyAdmin) role is an example of a role that contains these permissions.

→ Nghĩa là tài khoản bạn **chưa có quyền** sửa Organization Policy. Cần được **cấp role** trước.

### Ai có thể cấp quyền?

- **Owner** hoặc **Admin** của **Organization** (cấp tổ chức), hoặc  
- Tài khoản đã có role **Organization Policy Administrator** (roles/orgpolicy.policyAdmin) ở cấp Organization.

### Cách 1: Admin cấp qua Console

1. Admin mở **IAM & Admin** → **IAM**: https://console.cloud.google.com/iam-admin/iam  
2. Ở dropdown **chọn resource**: chọn **Organization** (tên tổ chức), không chọn project.  
3. **Grant access** (hoặc **Add** principal).  
4. **New principals:** nhập email tài khoản cần được cấp (ví dụ `admin@thptphuocbuu.edu.vn`).  
5. **Role:** chọn **Organization Policy Administrator** (hoặc tìm "org policy").  
6. **Save.**

Sau khi lưu, tài khoản đó đăng nhập lại (hoặc refresh trang org policies) → nút **Manage policy** / **Edit** sẽ hiện và dùng được.

### Cách 2: Admin cấp qua Cloud Shell / gcloud

Admin (có quyền ở Organization) chạy:

         **Bước 1 – Lấy ID Organization (bắt buộc, không dùng chữ ORG_ID):**

```bash
gcloud organizations list
```

Kết quả có dạng:
```
ID              DISPLAY_NAME
123456789012    Ten to chuc
```
→ Lấy cột **ID** (số 12 chữ số, ví dụ `123456789012`).

**Bước 2 – Cấp role (thay 123456789012 bằng ID vừa lấy):**

```bash
gcloud organizations add-iam-policy-binding 123456789012 \
  --member="user:admin@thptphuocbuu.edu.vn" \
  --role="roles/orgpolicy.policyAdmin"
```

Lưu ý: Phải dùng **số ID** từ `gcloud organizations list`, không gõ chữ `ORG_ID`.

Sau khi được cấp role, vào lại trang Organization policies và thực hiện từ **Bước 1** bên dưới.

**Lưu ý:** Nếu bạn chạy lệnh bằng chính tài khoản `admin@thptphuocbuu.edu.vn` và gặp lỗi *"does not have permission to access organizations instance ... getIamPolicy"* → tài khoản đó **không có quyền** ở cấp Organization. Bạn **không thể tự cấp** role cho chính mình. Cần nhờ **Owner / Admin của Organization** (tài khoản khác, có quyền quản lý IAM ở Organization) đăng nhập và chạy lệnh cấp role cho bạn, hoặc họ vào Console IAM ở cấp Organization để thêm role **Organization Policy Administrator** cho `admin@thptphuocbuu.edu.vn`.

---

## Console báo: "Principals of type allUsers and allAuthenticatedUsers cannot be added to this resource"

Đây là **cùng** Organization Policy: policy đang **cấm** thêm principal `allUsers` và `allAuthenticatedUsers` vào mọi resource trong phạm vi (Organization hoặc project kế thừa). Console chỉ hiển thị rõ hơn thay vì lỗi "permitted customer".

**Cách xử lý:** Cần **Override** đúng policy ở cấp **Organization** cho **project** gen-lang-client-0753799782 = **Not enforced**, để project này **không** bị ràng buộc (được phép thêm allUsers). Nếu đã override rồi mà vẫn báo lỗi:

- Kiểm tra override áp dụng cho **project** "thptphuocbuu" / gen-lang-client-0753799782 và đã **Save**.
- Kiểm tra có **hai** policy IAM (ví dụ "Restrict allowed policy members" và "Restrict which customers...") thì **cả hai** đều cần override Not enforced cho project.
- Đợi 5–10 phút sau khi Save rồi thử lại (Console và lệnh gcloud).

Nếu tổ chức **không cho phép** bỏ ràng buộc cho allUsers (không có tùy chọn override / bị từ chối), khi đó **không thể** mở public Cloud Run; chỉ có thể dùng truy cập có đăng nhập (ví dụ cấp Cloud Run Invoker cho group/user trong domain).

---

## Bước 1: Mở Organization policies

1. Mở: **https://console.cloud.google.com/iam-admin/orgpolicies**
2. Ở dropdown **chọn resource** (góc trên): chọn **Organization** hoặc **Folder** chứa project `gen-lang-client-0753799782` (nơi đang bật policy "Restrict allowed policy members...").
3. Đảm bảo đang xem đúng cấp (Org hoặc Folder), không phải cấp Project.

---

## Bước 2: Vào policy "Restrict allowed policy members in IAM allow policies"

1. Trong danh sách policy, tìm dòng:
   - **Name:** Restrict allowed policy members in IAM allow policies  
   - **Constraint:** `iam.managed.allowedPolicyMembers`
2. Click vào **tên policy** (hoặc icon bên cạnh) để mở chi tiết.

---

## Bước 3: Manage policy / Edit

1. Trên trang chi tiết policy, bấm **"Manage policy"** hoặc **"Edit"** (hoặc **"Customize"**).
2. Nếu có **"Inherit parent's policy"**: chuyển sang **"Override parent's policy"** hoặc **"Customize"** để chỉnh.

---

## Bước 4: Thêm exception cho project

### Nếu màn hình có "Policy source" / "Applies to"

- **Applies to:** Giữ hoặc chọn **Project "thptphuocbuu"** (project gen-lang-client-0753799782).
- **Policy source:** Chọn **"Override parent's policy"** (ghi đè policy của parent, tức là không kế thừa ràng buộc từ Organization cho project này).
- Sau khi chọn Override, thường sẽ có thêm ô **Policy values** hoặc **Rules**:
  - Chọn **Not enforced** / **Allow all** (hoặc để trống danh sách allowed members tùy constraint) để project này được phép thêm mọi principal (kể cả allUsers).
- Bấm **"Set policy"** hoặc **"Save"**.

### Cách khác: Thêm exception theo project

1. Tìm mục **"Add exception"** / **"Exceptions"**.
2. **Scope:** project **gen-lang-client-0753799782** (hoặc "thptphuocbuu").
3. **Policy value** cho exception: **Not enforced** hoặc **Allow all**.
4. **Save**.

---

## Bước 5: Save

1. Kiểm tra lại: exception/override áp dụng cho project **gen-lang-client-0753799782**.
2. Bấm **"Save"** (hoặc **"Set policy"**) ở cuối trang.
3. Đợi vài giây để policy cập nhật.

---

## Bước 6: Cấp quyền public cho Cloud Run

Sau khi policy đã có exception, mở **terminal** trên máy bạn và chạy:

```bash
gcloud run services add-iam-policy-binding thptphuocbuu \
  --region=asia-southeast1 \
  --project=gen-lang-client-0753799782 \
  --member=allUsers \
  --role=roles/run.invoker
```

Nếu thành công, mở lại:

**https://thptphuocbuu-880621524780.asia-southeast1.run.app**

sẽ không còn 403.

---

## Lưu ý

- Cần tài khoản có quyền **Organization Policy Administrator** (hoặc tương đương) ở cấp Org/Folder.
- Nếu không thấy nút "Manage policy" / "Add exception", có thể policy đang ở cấp **Organization** — khi mở orgpolicies, chọn **Organization** (không chọn Folder/Project) rồi tìm lại policy và làm tương tự.
