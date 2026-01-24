#!/bin/bash

# Dừng script nếu có lỗi
set -e

echo "🐳 Đang bắt đầu dọn dẹp Docker..."

# 1. Xóa tất cả các container đã dừng
echo "🧹 Đang xóa các container đã dừng..."
docker container prune -f

# 2. Xóa tất cả các image không được sử dụng bởi container nào (bao gồm cả dangling và unreferenced)
# Thêm -a để xóa tất cả image không dùng, không chỉ là dangling
echo "🧹 Đang xóa các image không sử dụng (dangling & unreferenced)..."
docker image prune -a -f

# 3. Xóa các network không sử dụng
echo "🧹 Đang xóa các network không sử dụng..."
docker network prune -f

# 4. Xóa build cache (giúp giải phóng rất nhiều dung lượng sau nhiều lần build)
echo "🧹 Đang xóa build cache..."
docker builder prune -f

# Tuỳ chọn: Xóa volumes (bỏ comment dòng dưới nếu muốn xóa cả dữ liệu volume không dùng)
# echo "🧹 Đang xóa volumes không sử dụng..."
# docker volume prune -f

echo "✨ Hoàn tất dọn dẹp Docker! Dung lượng đĩa đã được giải phóng."
docker system df
