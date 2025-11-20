/**
 * Tooltip Help Texts
 * 
 * Tập trung tất cả các text tooltip giúp đỡ để dễ quản lý và cập nhật
 */

import React from 'react'

export const helpTexts = {
  documentType: {
    title: 'Loại văn bản',
    content: (
      <div className="space-y-2">
        <p className="font-semibold mb-2">Các loại văn bản chính:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>CV</strong> - Công văn (phổ biến nhất)</li>
          <li><strong>QĐ</strong> - Quyết định</li>
          <li><strong>TB</strong> - Thông báo</li>
          <li><strong>BC</strong> - Báo cáo</li>
          <li><strong>TT</strong> - Tờ trình</li>
          <li><strong>KH</strong> - Kế hoạch</li>
        </ul>
        <p className="text-xs text-gray-400 mt-2">
          Hệ thống sẽ tự động phân loại dựa trên nội dung nếu bạn không chọn.
        </p>
      </div>
    ),
  },

  title: {
    title: 'Tiêu đề văn bản',
    content: 'Nhập tiêu đề đầy đủ của văn bản. Tiêu đề sẽ được sử dụng để tìm kiếm và phân loại tự động.',
  },

  sender: {
    title: 'Người/nơi gửi',
    content: 'Nhập tên người gửi hoặc đơn vị/cơ quan gửi văn bản. Thông tin này giúp theo dõi nguồn gốc văn bản.',
  },

  recipient: {
    title: 'Người/nơi nhận',
    content: 'Nhập tên người nhận hoặc đơn vị/cơ quan nhận văn bản. Thông tin này quan trọng cho văn bản đi.',
  },

  priority: {
    title: 'Mức độ ưu tiên',
    content: (
      <div className="space-y-1 text-xs">
        <p><strong>Khẩn:</strong> Cần xử lý ngay trong ngày</p>
        <p><strong>Cao:</strong> Cần xử lý trong 1-2 ngày</p>
        <p><strong>Bình thường:</strong> Xử lý theo quy trình thông thường</p>
        <p><strong>Thấp:</strong> Có thể xử lý sau</p>
      </div>
    ),
  },

  deadline: {
    title: 'Hạn xử lý',
    content: 'Ngày giờ hạn chót cần hoàn thành xử lý văn bản. Hệ thống sẽ gửi nhắc nhở trước deadline.',
  },

  sendDate: {
    title: 'Ngày gửi',
    content: 'Ngày dự kiến gửi văn bản đi. Để trống nếu chưa xác định.',
  },

  content: {
    title: 'Nội dung văn bản',
    content: 'Nhập nội dung đầy đủ của văn bản. Bạn có thể sử dụng AI để gợi ý nội dung tự động.',
  },

  notes: {
    title: 'Ghi chú',
    content: 'Thông tin bổ sung, ghi chú nội bộ hoặc hướng dẫn xử lý. Chỉ hiển thị nội bộ, không gửi ra ngoài.',
  },

  fileUpload: {
    title: 'File văn bản',
    content: (
      <div className="space-y-1 text-xs">
        <p><strong>Định dạng hỗ trợ:</strong> PDF, DOC, DOCX, JPG, PNG</p>
        <p><strong>Kích thước tối đa:</strong> 10MB</p>
        <p className="mt-2 text-gray-400">
          Hệ thống sẽ tự động OCR và phân loại văn bản sau khi upload.
        </p>
      </div>
    ),
  },

  aiClassification: {
    title: 'Phân loại tự động bằng AI',
    content: 'Hệ thống sử dụng AI để tự động phân loại văn bản dựa trên tiêu đề và nội dung. Độ chính xác cao với các văn bản chuẩn.',
  },

  aiDraft: {
    title: 'Gợi ý soạn thảo bằng AI',
    content: 'AI sẽ tạo bản nháp văn bản theo chuẩn Nghị định 30/2020/NĐ-CP dựa trên thông tin bạn cung cấp.',
  },

  documentNumber: {
    title: 'Số văn bản',
    content: 'Số văn bản theo quy định. Hệ thống có thể tự động trích xuất từ nội dung văn bản.',
  },

  status: {
    title: 'Trạng thái văn bản',
    content: (
      <div className="space-y-1 text-xs">
        <p><strong>Chờ xử lý:</strong> Văn bản mới nhận, chưa được xử lý</p>
        <p><strong>Đang xử lý:</strong> Đang được phân công và xử lý</p>
        <p><strong>Đã phê duyệt:</strong> Đã được phê duyệt</p>
        <p><strong>Từ chối:</strong> Bị từ chối, cần xem xét lại</p>
        <p><strong>Hoàn thành:</strong> Đã hoàn tất xử lý</p>
        <p><strong>Lưu trữ:</strong> Đã lưu trữ</p>
      </div>
    ),
  },

  assignment: {
    title: 'Phân công xử lý',
    content: 'Chọn người được phân công xử lý văn bản. Người này sẽ nhận thông báo và chịu trách nhiệm xử lý.',
  },

  workflow: {
    title: 'Luồng phê duyệt',
    content: 'Tạo luồng phê duyệt nhiều cấp cho văn bản. Mỗi cấp cần phê duyệt trước khi chuyển sang cấp tiếp theo.',
  },
}

