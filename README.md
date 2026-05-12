# Ứng dụng đặt đồ uống Coffee - Meeple Coffee

## 1. Tên đề tài

**Xây dựng ứng dụng đặt đồ uống Coffee trên thiết bị di động**

## 2. Giới thiệu hệ thống

Meeple Coffee là hệ thống đặt đồ uống trực tuyến gồm ứng dụng mobile cho khách hàng, backend API và trang quản trị admin web.

Người dùng có thể đăng ký, đăng nhập, xem danh sách đồ uống, tìm kiếm sản phẩm, thêm vào giỏ hàng, thanh toán, xem lịch sử đơn hàng, quản lý danh sách yêu thích và thông tin cá nhân.

Admin có thể quản lý sản phẩm, danh mục, banner, đơn hàng, khách hàng và quản trị viên thông qua trang quản trị web.

## 3. Danh sách thành viên

| STT | Họ và tên | MSSV | Vai trò |
|---|---|---|---|
| 1 | Lý Văn Thủy | 23810310226 | Trưởng nhóm |
| 2 | Nguyễn Thị Diệu Châu | 23810310183 | Thành viên |

## 4. Phân công nhiệm vụ

| Thành viên | Nhiệm vụ |
|---|---|
| Lý Văn Thủy | Xây dựng app mobile, xử lý giao diện người dùng, giỏ hàng, đặt hàng, lịch sử đơn hàng |
| Nguyễn Thị Diệu Châu | Xây dựng admin web, hỗ trợ backend, quản lý sản phẩm, danh mục và đơn hàng |

## 5. Công nghệ sử dụng

- React Native Expo
- TypeScript
- ReactJS
- Node.js
- ExpressJS
- MySQL
- XAMPP
- GitHub
- Visual Studio Code


#  6. Cấu trúc project📂

```text
app_dat_do_uong_coffee
├── backend
├── react-native-app
├── admin-web
├── database/
└── README.md


```

---

# ⚙️ Cài đặt dự án

## Clone project

```bash
git clone https://github.com/nhommobile-app/app_dat_do_uong_coffee.git
cd app_dat_do_uong_coffee
```

## Cài đặt Backend

 Cấu hình backend
```bash
Trong thư mục backend, tạo file .env với nội dung:

PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=coffee_shop_db
DB_PORT=3306

JWT_SECRET=your_secret_key
JWT_EXPIRE=24h

EMAIL_ENABLED=false

SUPER_ADMIN_EMAIL=dieuchauzz@gmail.com
SUPER_ADMIN_PASSWORD=123456A@
```

Chạy backend
```bash
cd backend
npm install
npm run dev
```
Chạy admin web
```bash
cd admin-web
npm install
npm run dev
```

Chạy Mobile App
```bash
cd react-native-app
npm install
npx expo start -c
```
Import Database
```bash
- Tạo database: `coffee_shop_db`
- Import file `backup_coffee_shop_db.sql`
```
---

# 🔑 Tài khoản Admin mặc định

```text
Email: dieuchauzz@gmail.com
Password: 123456A@
```

---



  Các chức năng chính
```text

Ứng dụng mobile
Đăng ký tài khoản
Đăng nhập
Xem danh sách sản phẩm
Xem chi tiết sản phẩm
Tìm kiếm sản phẩm
Thêm sản phẩm vào yêu thích
Thêm sản phẩm vào giỏ hàng
Thanh toán và đặt hàng
Xem lịch sử đơn hàng
Xem và chỉnh sửa hồ sơ cá nhân
Đăng xuất
Trang quản trị admin web
Đăng nhập admin
Quản lý sản phẩm
Quản lý danh mục
Quản lý banner
Quản lý đơn hàng
Quản lý khách hàng
Quản lý quản trị viên
```

# 🚀 Hướng phát triển

- Tích hợp thanh toán online
- Push notification
- Triển khai server online
---

# Một số màn hình giao diện
<img width="1200" height="2664" alt="image" src="https://github.com/user-attachments/assets/5de3b903-cb3b-40ce-b64b-699622abfb6f" />
<img width="1200" height="2664" alt="image" src="https://github.com/user-attachments/assets/33bbcb17-ec93-4c28-afa0-d92a10c60304" />
<img width="1200" height="2664" alt="image" src="https://github.com/user-attachments/assets/d16a26f7-cfe3-4bf0-8936-aa2b7072b871" />
<img width="997" height="6568" alt="image" src="https://github.com/user-attachments/assets/cd2e7e81-ef05-4b31-a18c-54b0a8a55e7c" />
<img width="1200" height="3110" alt="image" src="https://github.com/user-attachments/assets/b54da0ff-02e0-4ae5-a62e-156d90b30a0a" />
<img width="1200" height="2664" alt="image" src="https://github.com/user-attachments/assets/eb46f39b-2b50-4d33-af92-e4e8944971f7" />
<img width="1200" height="2664" alt="image" src="https://github.com/user-attachments/assets/d9c21b28-3dc5-4259-b0ac-72d6122181c5" />
<img width="1153" height="2560" alt="image" src="https://github.com/user-attachments/assets/fc491570-b82d-436d-9727-4618e2037055" />
<img width="1200" height="2664" alt="image" src="https://github.com/user-attachments/assets/8a9b53e0-8d33-4f05-ac38-a3b886d6c85f" />
<img width="1200" height="2664" alt="image" src="https://github.com/user-attachments/assets/363dfc2f-7e79-4b41-bbef-4c184366a9a3" />
<img width="1200" height="2664" alt="image" src="https://github.com/user-attachments/assets/c3f743be-2ac0-469d-bd6e-9fa895be1273" />
<img width="1200" height="3311" alt="image" src="https://github.com/user-attachments/assets/13a00e33-30e3-4771-bd3a-d169e102bb80" />
<img width="1200" height="2664" alt="image" src="https://github.com/user-attachments/assets/688a701b-1ef4-49f3-b714-5e2297516367" />
<img width="1200" height="3120" alt="image" src="https://github.com/user-attachments/assets/9b6310e4-3d7e-413d-a65b-0cb0fbebc747" />

# 📌 GitHub Repository

https://github.com/nhommobile-app/app_dat_do_uong_coffee
