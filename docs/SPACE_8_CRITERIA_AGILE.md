# Space 10 Detailed Criteria & Agile/Scrum Framework

## Tổng quan

Space module đã được cập nhật để hỗ trợ 10 tiêu chí chi tiết (8 cốt lõi + 2 bổ sung) và vận hành theo quy trình Agile/Scrum framework.

## 10 Tiêu chí chi tiết

### 8 Tiêu chí cốt lõi

### 1. Mission & Scope (Mục tiêu & phạm vi hoạt động)
- **Model**: `SpaceMission`
- **Nội dung**:
  - **Vision** (Tầm nhìn)
  - **Mission** (Sứ mệnh) - Space được tạo ra để làm gì?
  - **Scope** (Phạm vi) - Đang phụ trách mảng/nhánh nào trong hệ thống?
  - **Expected Output** (Kết quả đầu ra) - Kết quả đầu ra mong muốn là gì?
  - **Objectives** (Mục tiêu) - JSON array
  - **Values** (Giá trị) - JSON array
  - **Description** (Mô tả chi tiết)
- **Ví dụ**: "Space phụ trách sản xuất nội dung truyền thông của trường THPT Phước Bửu, bao gồm hình ảnh, video, bài viết và quản trị tài khoản mạng xã hội."

### 2. Members & Roles (Thành viên & vai trò)
- **Model**: `SpaceMember`
- **Chức năng**:
  - Quản lý thành viên trong space
  - Phân quyền (OWNER, ADMIN, MODERATOR, MEMBER, VIEWER, LEADER, DESIGNER, EDITOR, WRITER, etc.)
  - **Role Description** - Mô tả vai trò cụ thể
  - Quyền truy cập (canRead, canWrite, canManage, canApprove, canPublish)
- **Ví dụ**:
  - Leader: Nguyễn Văn A – Quản lý tiến độ & phê duyệt nội dung
  - Designer: Nguyễn Văn B – Thiết kế hình ảnh
  - Video Editor: Trần Văn C – Dựng video
  - Writer: Mai Văn D – Viết nội dung

### 3. Workflow/SOP (Quy trình làm việc chuẩn)
- **Model**: `SpaceWorkflow`
- **Hỗ trợ**:
  - SCRUM
  - KANBAN
  - CUSTOM
  - SOP (Standard Operating Procedure)
- **Cấu hình**:
  - **SOP Content** - Nội dung quy trình chi tiết (Markdown)
  - **Diagram URL** - Link đến sơ đồ quy trình
  - **Workflow Steps** - Các bước chi tiết (JSON)
  - Sprint duration (mặc định 14 ngày)
  - Daily standup time
  - Sprint planning day
  - Retrospective day
- **Các bước quy trình**:
  1. Nhận yêu cầu
  2. Lên ý tưởng / phê duyệt
  3. Thực thi (viết, thiết kế, dựng video…)
  4. Kiểm duyệt
  5. Xuất bản / bàn giao
  6. Lưu trữ (Google Drive / Notion / DMS)

### 4. Tools & Platforms (Công cụ sử dụng)
- **Model**: `SpaceTool`
- **Thông tin**:
  - Name, Category, Description
  - URL, Icon (đính kèm link để tiện truy cập)
  - Configuration (JSON)
- **Categories**: DEVELOPMENT, COMMUNICATION, PROJECT_MANAGEMENT, DESIGN, VIDEO_EDITING, etc.
- **Ví dụ**:
  - Space / ChatGPT Team
  - Google Drive / Sheet
  - DMS văn bản
  - Social Media Planner
  - Figma, Canva, CapCut, Premiere

### 5. Rules (Quy tắc phối hợp & chuẩn giao tiếp)
- **Model**: `SpaceRule`
- **Nội dung**:
  - Title, Description, Category
  - Content (Markdown) - Quy tắc cụ thể
  - Is Required, Priority
- **Categories**: COMMUNICATION, FILE_MANAGEMENT, REPORTING, CODE_REVIEW, COMMIT, MEETING, etc.
- **Ví dụ**:
  - Nhắn việc => tag đúng người
  - Không spam nhiều nhóm
  - Mọi file phải lưu vào thư mục chuẩn
  - Báo cáo tiến độ trước khi hết ngày

### 6. KPIs (Chỉ số đánh giá / Output Metrics)
- **Model**: `SpaceKPI` + `SpaceKPIHistory`
- **Metrics**:
  - Target value, Current value
  - Unit, Measurement period
  - Formula, Data source
- **Categories**: VELOCITY, QUALITY, EFFICIENCY, SATISFACTION, OUTPUT, etc.
- **History tracking**: Lưu lịch sử giá trị KPI theo thời gian
- **Ví dụ**:
  - Số bài viết/tuần
  - Số video đã sản xuất
  - Tỷ lệ hoàn thành deadline
  - Lượng tương tác (nếu Space truyền thông)

### 7. Timeline (Lịch làm việc & deadline cố định)
- **Model**: `SpaceTimeline`
- **Types**: MILESTONE, EVENT, DEADLINE, RELEASE, MEETING, REPORT, PUBLISH_CYCLE
- **Thông tin**:
  - Start date, End date, Due date
  - **Is Recurring** - Lặp lại định kỳ
  - **Recurrence Pattern** - Pattern lặp lại (WEEKLY, MONTHLY, DAILY)
  - Status (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)
  - Link to sprint, tasks
- **Ví dụ**:
  - Lịch họp cố định (hàng tuần)
  - Thời gian gửi báo cáo (hàng tháng)
  - Chu kỳ đăng bài (hàng ngày/tuần)
  - Hạn chót sản xuất nội dung

### 8. Resources (Tài liệu quan trọng / Mẫu biểu)
- **Model**: `SpaceResource`
- **Types**: DOCUMENT, LINK, TOOL, TEMPLATE, BRAND_GUIDE, POLICY
- **Metadata**:
  - **Template Type** - Loại template (WRITING_TEMPLATE, REPORT_TEMPLATE, etc.)
  - **Usage** - Hướng dẫn sử dụng template
  - Category, Tags
  - URL, File URL
  - Is Public
- **Ví dụ**:
  - Template viết bài
  - Template báo cáo
  - Bộ nhận diện thương hiệu
  - Quy chế làm việc

### 8. Activity Log (Dòng thời gian hoạt động)
- **Model**: `SpaceActivityLog`
- **Chức năng**:
  - Ghi nhận hoạt động hàng tuần/tháng
  - Việc đã hoàn thành
  - Việc đang xử lý
  - Việc sắp làm
- **Types**: UPDATE, COMPLETED, IN_PROGRESS, PLANNED, MILESTONE
- **Period**: WEEK, MONTH, QUARTER, YEAR

### 9. Security & Access (Quy định bảo mật & quyền truy cập)
- **Model**: `SpaceSecurity`
- **Nội dung**:
  - **Confidentiality Level** - Mức độ bảo mật (PUBLIC, INTERNAL, CONFIDENTIAL, SECRET)
  - **Data Sharing Rules** - Quy định chia sẻ dữ liệu
  - **Approval Required** - Cần phê duyệt trước khi xuất bản
  - **Approval Roles** - Ai được phép phê duyệt
  - **Publish Roles** - Ai được phép xuất bản
  - **External Sharing Rules** - Quy định chia sẻ với bên ngoài
- **Ví dụ**:
  - Nội dung nội bộ không được chia sẻ ngoài Space
  - Chỉ ADMIN và LEADER được phép phê duyệt/xuất bản

### 10. Templates & Resources (Tài liệu quan trọng / Mẫu biểu)
- **Model**: `SpaceResource`
- **Types**: DOCUMENT, LINK, TOOL, TEMPLATE, BRAND_GUIDE, POLICY
- **Thông tin**:
  - **Template Type** - Loại template (WRITING_TEMPLATE, REPORT_TEMPLATE, etc.)
  - **Usage** - Hướng dẫn sử dụng template
  - Category, Tags, URL, File URL
- **Ví dụ**:
  - Template viết bài
  - Template báo cáo
  - Bộ nhận diện thương hiệu
  - Quy chế làm việc


## Agile/Scrum Framework

### Sprint Management
- **Model**: `SpaceSprint`
- **Thông tin Sprint**:
  - Name, Number, Description
  - Start date, End date, Actual end date
  - Goal, User stories
  - Status (PLANNED, ACTIVE, COMPLETED, CANCELLED)
- **Metrics**:
  - Planned velocity (Story points)
  - Actual velocity
  - Burndown data (JSON)

### Space Configuration
- **Framework**: AGILE, SCRUM, KANBAN, WATERFALL
- **Sprint Duration**: Mặc định 14 ngày (có thể tùy chỉnh)
- **Current Sprint**: Link đến sprint đang active

## Database Schema

### New Models
1. `SpaceMission` - 1:1 với Space
2. `SpaceWorkflow` - 1:N với Space
3. `SpaceTool` - 1:N với Space
4. `SpaceRule` - 1:N với Space
5. `SpaceKPI` - 1:N với Space
6. `SpaceKPIHistory` - 1:N với SpaceKPI
7. `SpaceResource` - 1:N với Space
8. `SpaceTimeline` - 1:N với Space
9. `SpaceSprint` - 1:N với Space

### Updated Space Model
- Thêm `framework` field
- Thêm `sprintDuration` field
- Thêm `currentSprintId` field
- Thêm relations đến 8 tiêu chí

## API Endpoints (Cần implement)

### Mission
- `GET /api/spaces/[id]/mission` - Lấy mission
- `PUT /api/spaces/[id]/mission` - Cập nhật mission

### Workflow
- `GET /api/spaces/[id]/workflows` - Lấy danh sách workflows
- `POST /api/spaces/[id]/workflows` - Tạo workflow
- `PUT /api/spaces/[id]/workflows/[workflowId]` - Cập nhật workflow

### Tools
- `GET /api/spaces/[id]/tools` - Lấy danh sách tools
- `POST /api/spaces/[id]/tools` - Thêm tool
- `DELETE /api/spaces/[id]/tools/[toolId]` - Xóa tool

### Rules
- `GET /api/spaces/[id]/rules` - Lấy danh sách rules
- `POST /api/spaces/[id]/rules` - Tạo rule
- `PUT /api/spaces/[id]/rules/[ruleId]` - Cập nhật rule

### KPIs
- `GET /api/spaces/[id]/kpis` - Lấy danh sách KPIs
- `POST /api/spaces/[id]/kpis` - Tạo KPI
- `POST /api/spaces/[id]/kpis/[kpiId]/record` - Ghi nhận giá trị KPI
- `GET /api/spaces/[id]/kpis/[kpiId]/history` - Lấy lịch sử KPI

### Resources
- `GET /api/spaces/[id]/resources` - Lấy danh sách resources
- `POST /api/spaces/[id]/resources` - Thêm resource
- `DELETE /api/spaces/[id]/resources/[resourceId]` - Xóa resource

### Timeline
- `GET /api/spaces/[id]/timeline` - Lấy timeline
- `POST /api/spaces/[id]/timeline` - Thêm timeline item
- `PUT /api/spaces/[id]/timeline/[timelineId]` - Cập nhật timeline

### Sprints
- `GET /api/spaces/[id]/sprints` - Lấy danh sách sprints
- `POST /api/spaces/[id]/sprints` - Tạo sprint
- `PUT /api/spaces/[id]/sprints/[sprintId]` - Cập nhật sprint
- `POST /api/spaces/[id]/sprints/[sprintId]/start` - Bắt đầu sprint
- `POST /api/spaces/[id]/sprints/[sprintId]/complete` - Hoàn thành sprint

## Next Steps

1. **Chạy migration**:
   ```bash
   npx prisma migrate dev
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Implement API endpoints** cho từng tiêu chí

4. **Tạo UI components** để quản lý 8 tiêu chí

5. **Tích hợp Agile/Scrum features**:
   - Sprint planning
   - Daily standup
   - Sprint review
   - Retrospective

## Ví dụ sử dụng

### Tạo Space với Mission
```typescript
const space = await prisma.space.create({
  data: {
    name: "Development Team",
    code: "DEV_TEAM",
    framework: "SCRUM",
    sprintDuration: 14,
    mission: {
      create: {
        vision: "Trở thành team phát triển hàng đầu",
        mission: "Xây dựng sản phẩm chất lượng cao",
        objectives: JSON.stringify(["Objective 1", "Objective 2"]),
        values: JSON.stringify(["Quality", "Innovation"])
      }
    }
  }
})
```

### Tạo Sprint
```typescript
const sprint = await prisma.spaceSprint.create({
  data: {
    spaceId: space.id,
    name: "Sprint 1",
    number: 1,
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-01-14"),
    goal: "Hoàn thành tính năng X",
    plannedVelocity: 20
  }
})
```

### Ghi nhận KPI
```typescript
await prisma.spaceKPIHistory.create({
  data: {
    kpiId: kpi.id,
    value: 85.5,
    notes: "Sprint 1 completion"
  }
})
```

