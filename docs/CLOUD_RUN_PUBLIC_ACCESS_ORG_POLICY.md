# Cloud Run 403 – Organization Policy chặn public (allUsers)

## Triệu chứng

- Deploy thành công, service chạy tại: `https://thptphuocbuu-880621524780.asia-southeast1.run.app`
- Mở URL trên trình duyệt bị **403 Forbidden**: "Your client does not have permission to get URL..."
- Lệnh thêm quyền public báo lỗi:
  ```text
  FAILED_PRECONDITION: One or more users named in the policy do not belong to a permitted customer,
  perhaps due to an organization policy.
  ```

## Nguyên nhân

Project nằm dưới **Google Cloud Organization** có **Organization Policy** giới hạn thành viên IAM, thường là:

- **Constraint:** `iam.allowedPolicyMemberDomains` (hoặc tương đương)
- **Ý nghĩa:** Chỉ cho phép gán IAM cho user/service thuộc domain được phép (ví dụ `@thptphuocbuu.edu.vn`).
- **allUsers** (truy cập công khai, không đăng nhập) không thuộc domain nào → bị chặn.

## Hướng xử lý

### 1. Cho phép public (cần quyền Admin tổ chức)

Policy thường gặp: **"Restrict which customers can be in IAM policy"** (constraint: `iam.allowedPolicyMemberDomains`). Để cho phép `allUsers` trên Cloud Run, cần **thêm exception** cho project.

#### Cách 1: Console (khuyến nghị)

1. Mở [Organization policies](https://console.cloud.google.com/iam-admin/orgpolicies) (chọn đúng Organization hoặc Folder chứa project).
2. Trong danh sách, tìm **"Restrict which customers can be in IAM policy"** (hoặc **Domain restricted sharing** / IAM-related).
3. Click vào policy đó → **Manage policy**.
4. Trong **Policy values**:
   - Nếu đang **Enforced**: thêm **Exception** (Add exception).
   - Chọn **Inheritance**: chọn **Override** và scope = project `gen-lang-client-0753799782` (hoặc folder chứa nó).
   - Hoặc thêm **Exception** với **Target**: project ID `gen-lang-client-0753799782`, và đặt policy value cho exception = **Not enforced** (hoặc Allow all — tùy giao diện).
5. **Save**.

*(Tên nút/option có thể là "Add exception", "Override", "Customize" tùy phiên bản Console.)*

#### Cách 2: gcloud (Admin có quyền `orgpolicy.policy.set`)

Lấy ID organization hoặc folder, rồi set policy cho project (ví dụ):

```bash
# Xem policy hiện tại (constraint iam.allowedPolicyMemberDomains)
gcloud resource-manager org-policies describe iam.allowedPolicyMemberDomains \
  --project=gen-lang-client-0753799782

# Để thêm exception thường phải dùng set-policy với file yaml:
# policy.yaml có thể đặt rules với condition/exception cho project.
# Chi tiết: https://cloud.google.com/resource-manager/docs/organization-policy/restricting-domains
```

Sau khi policy đã nới (exception cho project):

```bash
gcloud run services add-iam-policy-binding thptphuocbuu \
  --region=asia-southeast1 \
  --project=gen-lang-client-0753799782 \
  --member=allUsers \
  --role=roles/run.invoker
```

### 2. Giữ policy, không cho public

Nếu tổ chức **không** cho phép `allUsers`:

- Cloud Run service **chỉ** có thể gọi bởi identity được cấp `roles/run.invoker` (user/service account trong domain).
- Để “người trong trường” truy cập: cấp **Cloud Run Invoker** cho group (ví dụ `group@thptphuocbuu.edu.vn`) hoặc từng user; họ phải **đăng nhập Google** (gcloud auth login hoặc dùng ứng dụng dùng ADC) rồi mới gọi được URL.
- Trình duyệt truy cập trực tiếp (unauthenticated) sẽ tiếp tục 403.

### 3. Dùng Load Balancer + domain (vẫn phụ thuộc IAM)

Có thể đặt Load Balancer trước Cloud Run và map domain (ví dụ `thptphuocbuu.edu.vn`). Truy cập công khai qua URL đó **vẫn** phải có `allUsers` (hoặc tương đương) trên Cloud Run; nếu org policy chặn `allUsers` thì vẫn 403. Chỉ khi policy được nới (mục 1) thì mới có public thật.

## Tóm tắt

| Mục đích              | Hành động |
|-----------------------|-----------|
| Cho mọi người mở URL  | Admin org nới policy, sau đó chạy lệnh `add-iam-policy-binding` với `allUsers` (mục 1). |
| Chỉ user trong trường | Giữ policy, cấp `roles/run.invoker` cho group/user trong domain; họ dùng đăng nhập Google để gọi service (mục 2). |

Script deploy (`deploy-phuocbuu-cloud-run.sh`) đã được chỉnh: nếu bước thêm `allUsers` thất bại vì org policy thì chỉ in cảnh báo và tiếp tục; deploy vẫn hoàn tất, nhưng URL sẽ 403 cho đến khi policy được nới và bạn chạy lệnh trên thủ công.
