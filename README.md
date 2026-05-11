# ☕ Coffee Shop Mobile App

Ứng dụng đặt đồ uống được xây dựng bằng React Native kết hợp Node.js, Express và MySQL.  
Hệ thống hỗ trợ người dùng xem sản phẩm, tìm kiếm, thêm vào giỏ hàng, đặt hàng và theo dõi lịch sử đơn hàng. Ngoài ra dự án còn có trang Admin Web để quản lý sản phẩm, banner và đơn hàng.

---

# 📱 Chức năng chính

## Người dùng
- Đăng ký, đăng nhập, quên mật khẩu bằng OTP
- Xem danh sách sản phẩm
- Tìm kiếm sản phẩm
- Xem chi tiết sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Quản lý sản phẩm yêu thích
- Đặt hàng
- Xem lịch sử đơn hàng
- Cập nhật thông tin cá nhân
- Upload ảnh đại diện

## Admin Web
- Quản lý sản phẩm
- Quản lý danh mục
- Quản lý banner
- Quản lý đơn hàng
- Quản lý người dùng

---

# 🛠 Công nghệ sử dụng

## Mobile App
- React Native
- TypeScript
- Expo
- Axios
- AsyncStorage

## Backend
- Node.js
- Express.js
- JWT Authentication
- Multer Upload

## Database
- MySQL
- XAMPP
- phpMyAdmin

## Khác
- GitHub
- RESTful API

---

# 📂 Cấu trúc dự án

```bash
mobile-app-main/
│
├── backend/
├── react-native-app/
├── admin-web/
├── db.sql
└── backup_coffee_shop_db.sql
```

---

# ⚙️ Cài đặt dự án

## Clone project

```bash
git clone https://github.com/nhommobile-app/app_dat_do_uong_coffee.git
```

## Cài đặt Backend

```bash
cd backend
npm install
npm run dev
```

## Import Database

- Tạo database: `coffee_shop_db`
- Import file `db.sql`

## Chạy Mobile App

```bash
cd react-native-app
npm install
npx expo start -c
```

## Chạy Admin Web

```bash
cd admin-web
npm install
npm run dev
```

---

# 🔑 Tài khoản Admin mặc định

```text
Email: admin@gmail.com
Password: 123456
```

---

# 🚀 Hướng phát triển

- Tích hợp thanh toán online
- Push notification
- Triển khai server online

---

# 📌 GitHub Repository

https://github.com/nhommobile-app/app_dat_do_uong_coffee
