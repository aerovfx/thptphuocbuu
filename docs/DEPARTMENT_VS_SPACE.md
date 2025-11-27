# 📊 So sánh: Tổ Chuyên Môn (Department) vs Space

## 🎯 Tổng quan

Hệ thống có 2 module chính để tổ chức cấu trúc trường học:
- **Tổ Chuyên Môn (Department)**: Đơn vị tổ chức theo chức năng/chuyên môn
- **Space**: Không gian làm việc theo dự án/nhiệm vụ

---

## 📋 1. MỤC ĐÍCH SỬ DỤNG

### **Tổ Chuyên Môn (Department)**
- ✅ **Tổ chức theo chức năng**: Nhóm người theo bộ môn/chuyên môn
- ✅ **Cấu trúc cố định**: Tổ Toán, Tổ Văn, Tổ Hành chính, Ban Tài chính...
- ✅ **Quản lý thành viên**: Ai thuộc tổ nào
- ✅ **Có Trưởng tổ**: `leaderId` - người đứng đầu tổ
- ✅ **Có môn học**: `subject` - Toán, Văn, Lý, Hóa...

**Ví dụ:**
- Tổ Toán: Tất cả giáo viên dạy Toán
- Tổ Hành chính: Nhân viên hành chính
- Ban Tài chính: Nhân viên kế toán

### **Space**
- ✅ **Không gian làm việc**: Nơi làm việc, chia sẻ tài liệu
- ✅ **Cấu trúc linh hoạt**: Có thể tạo theo nhu cầu
- ✅ **Quản lý quyền truy cập**: RBAC (Role-Based Access Control)
- ✅ **Phân cấp**: Có parent-child (hierarchical)
- ✅ **Quản lý văn bản**: Gắn văn bản vào space

**Ví dụ:**
- School Hub: Không gian công khai chung
- BGH Space: Không gian riêng Ban Giám Hiệu
- Văn bản Space: Không gian quản lý văn bản DMS

---

## 🏗️ 2. CẤU TRÚC DỮ LIỆU

### **Department Model**
```prisma
model Department {
  id          String
  name        String        // "Tổ Toán"
  code        String        // "TO_TOAN"
  type        DepartmentType // TO_CHUYEN_MON, TO_HANH_CHINH, etc.
  
  // Quan hệ với Space
  spaceId     String?       // Space mà tổ này thuộc về
  space       Space?
  
  // Trưởng tổ
  leaderId    String?       // Trưởng tổ
  leader      User?
  
  // Môn học (cho Tổ Chuyên Môn)
  subject     String?       // "Toán", "Văn", "Lý"...
  
  // Thành viên
  members     DepartmentMember[]
  documents   DepartmentDocument[]
}
```

**Đặc điểm:**
- ❌ **KHÔNG có phân cấp** (không có parent-child)
- ✅ **Có Trưởng tổ** (`leaderId`)
- ✅ **Có môn học** (`subject`)
- ✅ **Thuộc về 1 Space** (`spaceId`)

### **Space Model**
```prisma
model Space {
  id          String
  name        String        // "School Hub"
  code        String        // "SCHOOL_HUB"
  type        SpaceType     // SCHOOL_HUB, BGH_SPACE, etc.
  visibility  SpaceVisibility // PUBLIC, INTERNAL, PRIVATE
  
  // Phân cấp
  parentId    String?       // Parent space
  parent      Space?
  children    Space[]       // Child spaces
  
  // Quyền truy cập
  members     SpaceMember[] // Với role: OWNER, ADMIN, MODERATOR, MEMBER, VIEWER
  
  // Quan hệ
  departments Department[]  // Các tổ trong space này
  documents   SpaceDocument[] // Văn bản trong space
}
```

**Đặc điểm:**
- ✅ **Có phân cấp** (parent-child hierarchy)
- ✅ **Có visibility** (PUBLIC, INTERNAL, PRIVATE)
- ✅ **Có RBAC** (Role-Based Access Control)
- ✅ **Chứa nhiều Departments**

---

## 👥 3. QUẢN LÝ THÀNH VIÊN

### **Department Member**
```prisma
model DepartmentMember {
  departmentId String
  userId       String
  role         String  // LEADER, DEPUTY, MEMBER
  isActive     Boolean
  joinedAt     DateTime
}
```

**Đặc điểm:**
- ✅ Role đơn giản: `LEADER`, `DEPUTY`, `MEMBER`
- ✅ Một người chỉ có 1 role trong tổ
- ✅ Không có quyền chi tiết (canRead, canWrite, canManage)

### **Space Member**
```prisma
model SpaceMember {
  spaceId   String
  userId    String
  role      String  // OWNER, ADMIN, MODERATOR, MEMBER, VIEWER
  canRead   Boolean
  canWrite  Boolean
  canManage Boolean
  joinedAt  DateTime
  invitedBy String?
}
```

**Đặc điểm:**
- ✅ Role chi tiết: `OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`, `VIEWER`
- ✅ Quyền chi tiết: `canRead`, `canWrite`, `canManage`
- ✅ Có `invitedBy` - ai mời vào space
- ✅ Linh hoạt hơn trong quản lý quyền

---

## 📄 4. QUẢN LÝ VĂN BẢN

### **Department Document**
```prisma
model DepartmentDocument {
  departmentId String
  documentId   String
  documentType String  // "OUTGOING" | "INCOMING"
  createdAt    DateTime
}
```

**Mục đích:**
- Gắn văn bản với **tổ cụ thể**
- Văn bản thuộc về tổ nào

### **Space Document**
```prisma
model SpaceDocument {
  spaceId     String
  documentId  String
  documentType String  // "OUTGOING" | "INCOMING"
  visibility  SpaceVisibility
  assignedAt  DateTime
}
```

**Mục đích:**
- Gắn văn bản với **không gian làm việc**
- Có `visibility` - mức độ hiển thị
- Quản lý theo không gian, không phải theo tổ

---

## 🔄 5. QUAN HỆ GIỮA CHÚNG

```
┌─────────────────────────────────────────┐
│           Space (Không gian)            │
│  - School Hub                           │
│  - BGH Space                            │
│  - Văn bản Space                        │
└─────────────────────────────────────────┘
              │
              │ chứa nhiều
              ▼
┌─────────────────────────────────────────┐
│      Department (Tổ Chuyên Môn)         │
│  - Tổ Toán (thuộc về TO_CHUYEN_MON_SPACE)│
│  - Tổ Văn (thuộc về TO_CHUYEN_MON_SPACE)│
│  - Tổ Hành chính (thuộc về TO_HANH_CHINH_SPACE)│
└─────────────────────────────────────────┘
```

**Quan hệ:**
- ✅ **1 Space có thể chứa nhiều Departments**
- ✅ **1 Department thuộc về 1 Space** (`spaceId`)
- ✅ **Space là container, Department là đơn vị tổ chức**

---

## 📊 6. BẢNG SO SÁNH

| Tiêu chí | **Tổ Chuyên Môn (Department)** | **Space** |
|----------|-------------------------------|-----------|
| **Mục đích** | Tổ chức theo chức năng/chuyên môn | Không gian làm việc |
| **Cấu trúc** | Phẳng (flat) | Phân cấp (hierarchical) |
| **Trưởng** | Có Trưởng tổ (`leaderId`) | Không có trưởng cố định |
| **Môn học** | Có (`subject`) | Không có |
| **Quyền truy cập** | Đơn giản (LEADER, MEMBER) | Chi tiết (RBAC) |
| **Visibility** | Không có | Có (PUBLIC, INTERNAL, PRIVATE) |
| **Parent-Child** | Không | Có |
| **Quan hệ** | Thuộc về 1 Space | Chứa nhiều Departments |
| **Văn bản** | DepartmentDocument | SpaceDocument (có visibility) |

---

## 🎯 7. KHI NÀO DÙNG GÌ?

### **Dùng Department khi:**
- ✅ Cần tổ chức theo **chức năng/chuyên môn**
- ✅ Cần **Trưởng tổ** để quản lý
- ✅ Cần phân loại theo **môn học** (Toán, Văn, Lý...)
- ✅ Cần cấu trúc **cố định**, ít thay đổi

**Ví dụ:**
- Tổ Toán, Tổ Văn, Tổ Lý...
- Tổ Hành chính, Ban Tài chính...

### **Dùng Space khi:**
- ✅ Cần **không gian làm việc** linh hoạt
- ✅ Cần **quản lý quyền truy cập** chi tiết
- ✅ Cần **phân cấp** (parent-child)
- ✅ Cần quản lý **văn bản** theo không gian
- ✅ Cần **visibility** (công khai, nội bộ, riêng tư)

**Ví dụ:**
- School Hub (công khai)
- BGH Space (riêng tư)
- Văn bản Space (nội bộ)
- Dự án đặc biệt (tạm thời)

---

## 💡 8. VÍ DỤ THỰC TẾ

### **Scenario 1: Tổ Toán**
```
Space: "TO_CHUYEN_MON_SPACE"
  └── Department: "Tổ Toán"
      ├── Leader: Nguyễn Văn A
      ├── Subject: "Toán"
      └── Members: [GV Toán 1, GV Toán 2, GV Toán 3]
```

### **Scenario 2: Văn bản DMS**
```
Space: "VAN_BAN_SPACE"
  ├── Documents: [Văn bản 1, Văn bản 2...]
  ├── Visibility: INTERNAL
  └── Members: [Admin, BGH, Ban TT...]
```

### **Scenario 3: BGH Space**
```
Space: "BGH_SPACE"
  ├── Visibility: PRIVATE
  ├── Members: [BGH 1, BGH 2] (OWNER role)
  └── Documents: [Văn bản nội bộ BGH]
```

---

## 🔑 9. TÓM TẮT

| | **Department** | **Space** |
|---|---|---|
| **Là gì?** | Đơn vị tổ chức theo chức năng | Không gian làm việc |
| **Cấu trúc** | Phẳng | Phân cấp |
| **Quyền** | Đơn giản | Chi tiết (RBAC) |
| **Mục đích** | Tổ chức người | Tổ chức công việc |
| **Quan hệ** | Thuộc về Space | Chứa Departments |

**Kết luận:**
- **Department** = "Ai thuộc tổ nào" (tổ chức người)
- **Space** = "Làm việc ở đâu" (tổ chức công việc)

---

## 📚 10. TÀI LIỆU LIÊN QUAN

- Schema: `prisma/schema.prisma` (dòng 1387-1532)
- API Routes:
  - Departments: `/api/departments`
  - Spaces: `/api/spaces`
- Pages:
  - Departments: `/dashboard/departments`
  - Spaces: `/dashboard/spaces`

