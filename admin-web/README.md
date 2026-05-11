# Meeple Coffee Admin Web Panel

Web quản lý cho ứng dụng mobile Meeple Coffee.

## Tính năng

- ✅ Dashboard với thống kê tổng quan
- ✅ Quản lý sản phẩm (CRUD)
- ✅ Quản lý đơn hàng (xem, cập nhật trạng thái)
- ✅ Quản lý người dùng (xem, cập nhật role, xóa)
- ✅ Biểu đồ thống kê doanh thu và đơn hàng
- ✅ Top sản phẩm bán chạy

## Cài đặt

```bash
cd admin-web
npm install
```

## Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3001`

## Cấu hình

Đảm bảo backend đang chạy tại `http://localhost:3000` hoặc cập nhật proxy trong `vite.config.js`.

## Tài khoản Super Admin mặc định & luồng tạo admin

1. Backend tự động đảm bảo tài khoản super admin mặc định tồn tại ngay khi khởi động:
   - Email: `dieuchauzz@gmail.com@gmail.com`
   - Mật khẩu: `123456A@`
   - Role: `super_admin`

2. Đăng nhập admin web bằng tài khoản trên, chuyển tới trang **Người dùng** (chỉ hiện với super admin).

3. Dùng form “Tạo tài khoản admin mới” để tạo các admin khác (nhập họ tên, email, mật khẩu tạm).

4. Các admin mới chỉ có quyền vận hành (dashboard, đơn hàng, sản phẩm...). Chỉ super admin được tạo/cập nhật/xóa admin khác.

> 📌 Có thể tùy chỉnh thông tin super admin qua biến môi trường (`SUPER_ADMIN_*`) hoặc tắt auto seed bằng `AUTO_SEED_SUPER_ADMIN=false`. Nhớ đổi mật khẩu super admin ngay sau khi triển khai.



