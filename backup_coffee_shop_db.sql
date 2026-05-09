-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th5 09, 2026 lúc 07:32 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `coffee_shop_db`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `admins`
--

INSERT INTO `admins` (`id`, `first_name`, `last_name`, `email`, `password`, `phone`, `address`, `role`, `created_at`, `updated_at`) VALUES
(1, 'Dieu', 'Châu', 'dieuchauzz@gmail.com', '$2a$10$y8it5DyIAq6Ea0Or5IHs4um4tRjP993nsHAsvVC5e4Gictau9ew8.', NULL, NULL, 'super_admin', '2026-05-09 10:11:00', '2026-05-09 15:50:19');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `banners`
--

CREATE TABLE `banners` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) NOT NULL,
  `link_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `banners`
--

INSERT INTO `banners` (`id`, `title`, `description`, `image`, `link_url`, `is_active`, `display_order`, `created_at`, `updated_at`) VALUES
('bn-1', 'Ưu đãi hôm nay', 'Giảm giá cho các món nước nổi bật', 'https://picsum.photos/seed/banner1/900/400', NULL, 1, 1, '2026-05-09 11:13:51', '2026-05-09 11:13:51'),
('bn-2', 'Meeple Coffee', 'Thưởng thức đồ uống yêu thích mỗi ngày', 'https://picsum.photos/seed/banner2/900/400', NULL, 1, 2, '2026-05-09 11:13:51', '2026-05-09 11:13:51');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `cart_items`
--

CREATE TABLE `cart_items` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `quantity` int(11) NOT NULL,
  `size` varchar(10) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `cart_items`
--

INSERT INTO `cart_items` (`id`, `user_id`, `product_id`, `quantity`, `size`, `created_at`, `updated_at`) VALUES
('1bf00fd0-5801-4681-8ee4-34d80359d797', 1, 'prd-berry-tea', 1, 'M', '2026-05-09 17:29:41', '2026-05-09 17:29:41'),
('1ef88e3a-6ef1-46ae-9f40-979d30ad2e1a', 1, 'prd-cappuccino', 1, 'M', '2026-05-09 17:29:44', '2026-05-09 17:29:44');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
('cat-coffee', 'Coffee', 'Các món cà phê', '2026-05-09 11:13:51', '2026-05-09 11:13:51'),
('cat-fruit-tea', 'Fruit Tea', 'Các món trà trái cây', '2026-05-09 11:13:51', '2026-05-09 11:13:51'),
('cat-milk-tea', 'Milk Tea', 'Các món trà sữa', '2026-05-09 11:13:51', '2026-05-09 11:13:51');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `favorites`
--

CREATE TABLE `favorites` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status_id` varchar(36) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `delivery_address` text NOT NULL,
  `payment_method_id` varchar(36) NOT NULL,
  `delivery_method` varchar(20) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `user_confirmed_transfer` tinyint(1) DEFAULT 0,
  `user_confirmed_transfer_at` datetime DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `customer_phone` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `order_date`, `status_id`, `total_amount`, `delivery_address`, `payment_method_id`, `delivery_method`, `notes`, `created_at`, `updated_at`, `user_confirmed_transfer`, `user_confirmed_transfer_at`, `customer_name`, `customer_phone`) VALUES
('a93c2273-2e43-47eb-a139-d50212c6743e', 1, '2026-05-09 17:27:47', 'st-delivered', 126900.00, '136 Hồ Tùng Mậu, Hà Nội', 'pm-cash', 'deliver', NULL, '2026-05-09 17:27:47', '2026-05-09 17:28:17', 0, NULL, 'Khách hàng', NULL),
('e0bba424-f4af-43a2-bffa-d1e07b82ccfb', 1, '2026-05-09 17:29:15', 'st-delivered', 69000.00, 'Shyse, Phường Nhật Tân, Quận Tây Hồ, Thành phố Hà Nội', 'pm-cash', 'deliver', NULL, '2026-05-09 17:29:15', '2026-05-09 17:29:34', 0, NULL, 'Khách hàng', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_history`
--

CREATE TABLE `order_history` (
  `id` varchar(36) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `status_id` varchar(36) NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` varchar(36) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `quantity` int(11) NOT NULL,
  `size` varchar(10) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `size`, `price`, `created_at`) VALUES
('3632aefd-cc12-4411-b8ac-f5ee7225c783', 'a93c2273-2e43-47eb-a139-d50212c6743e', 'prd-berry-tea', 2, 'M', 46000.00, '2026-05-09 17:27:47'),
('4b0a2d3c-9d48-481d-830b-bb36fbd1a3d8', 'e0bba424-f4af-43a2-bffa-d1e07b82ccfb', 'prd-matcha-milk-tea', 1, 'M', 52000.00, '2026-05-09 17:29:15'),
('bd2da915-755a-4dea-a374-0bc5d94749af', 'a93c2273-2e43-47eb-a139-d50212c6743e', 'prd-cappuccino', 1, 'M', 49000.00, '2026-05-09 17:27:47');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_status`
--

CREATE TABLE `order_status` (
  `id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_status`
--

INSERT INTO `order_status` (`id`, `name`, `description`) VALUES
('st-cancelled', 'cancelled', 'Đã hủy'),
('st-completed', 'completed', 'Hoàn thành'),
('st-confirmed', 'confirmed', 'Đã xác nhận'),
('st-delivered', 'delivered', 'Đã giao'),
('st-delivering', 'delivering', 'Đang giao'),
('st-pending', 'pending', 'Đang giao'),
('st-processing', 'processing', 'Đang xử lý');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `name`, `description`, `is_active`) VALUES
('pm-bank', 'banking', 'Chuyển khoản ngân hàng', 1),
('pm-cash', 'cash', 'Thanh toán khi nhận hàng', 1),
('pm-cod', 'COD', 'Thanh toán khi nhận hàng', 1),
('pm-momo', 'momo', 'Thanh toán qua MoMo', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `full_description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) NOT NULL,
  `category_id` varchar(36) NOT NULL,
  `rating` decimal(3,1) DEFAULT 0.0,
  `reviews_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `full_description`, `price`, `image`, `category_id`, `rating`, `reviews_count`, `created_at`, `updated_at`) VALUES
('prd-berry-tea', 'Berry Tea', 'Trà berry chua ngọt', 'Trà trái cây berry vị chua ngọt.', 46000.00, 'berry-tea.jpg', 'cat-fruit-tea', 4.5, 7, '2026-05-09 11:13:51', '2026-05-09 16:29:11'),
('prd-cappuccino', 'Cappuccino', 'Cappuccino đậm đà', 'Espresso kết hợp sữa nóng và bọt sữa.', 49000.00, 'cappuccino.jpg', 'cat-coffee', 4.7, 10, '2026-05-09 11:13:51', '2026-05-09 16:29:11'),
('prd-latte', 'Caffe Latte', 'Latte mềm vị', 'Cà phê latte với sữa tươi và lớp foam mịn.', 45000.00, 'latte.jpg', 'cat-coffee', 4.8, 12, '2026-05-09 11:13:51', '2026-05-09 16:29:11'),
('prd-matcha-milk-tea', 'Matcha Milk Tea', 'Trà sữa matcha', 'Trà sữa matcha thơm béo, dễ uống.', 52000.00, 'matcha.jpg', 'cat-milk-tea', 4.9, 18, '2026-05-09 11:13:51', '2026-05-09 16:29:12'),
('prd-peach-tea', 'Peach Tea', 'Trà đào mát lạnh', 'Trà đào thanh mát dùng lạnh.', 42000.00, 'peach-tea.jpg', 'cat-fruit-tea', 4.6, 9, '2026-05-09 11:13:51', '2026-05-09 16:29:11');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_sizes`
--

CREATE TABLE `product_sizes` (
  `product_id` varchar(36) NOT NULL,
  `size` varchar(10) NOT NULL,
  `price_modifier` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `product_sizes`
--

INSERT INTO `product_sizes` (`product_id`, `size`, `price_modifier`) VALUES
('prd-berry-tea', 'L', 10000.00),
('prd-berry-tea', 'M', 5000.00),
('prd-berry-tea', 'S', 0.00),
('prd-cappuccino', 'L', 10000.00),
('prd-cappuccino', 'M', 5000.00),
('prd-cappuccino', 'S', 0.00),
('prd-latte', 'L', 10000.00),
('prd-latte', 'M', 5000.00),
('prd-latte', 'S', 0.00),
('prd-matcha-milk-tea', 'L', 10000.00),
('prd-matcha-milk-tea', 'M', 5000.00),
('prd-matcha-milk-tea', 'S', 0.00),
('prd-peach-tea', 'L', 10000.00),
('prd-peach-tea', 'M', 5000.00),
('prd-peach-tea', 'S', 0.00);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reviews`
--

CREATE TABLE `reviews` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `avatar_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `phone`, `address`, `created_at`, `updated_at`, `avatar_url`) VALUES
(1, 'Thuy', 'Ly', 'lythuy2k5@gmail.com', '$2a$10$HiGNOCyRaZGClZUVJEQF.OhVxiyl.dkP98pbGeGT.7zsTG3ng9SpC', '03669464946', NULL, '2026-05-09 11:08:04', '2026-05-09 11:08:04', NULL);

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_admins_email` (`email`),
  ADD KEY `idx_admins_role` (`role`);

--
-- Chỉ mục cho bảng `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_banners_active` (`is_active`,`display_order`);

--
-- Chỉ mục cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `status_id` (`status_id`),
  ADD KEY `payment_method_id` (`payment_method_id`);

--
-- Chỉ mục cho bảng `order_history`
--
ALTER TABLE `order_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `status_id` (`status_id`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `order_status`
--
ALTER TABLE `order_status`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Chỉ mục cho bảng `product_sizes`
--
ALTER TABLE `product_sizes`
  ADD PRIMARY KEY (`product_id`,`size`);

--
-- Chỉ mục cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Các ràng buộc cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Các ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`status_id`) REFERENCES `order_status` (`id`),
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`);

--
-- Các ràng buộc cho bảng `order_history`
--
ALTER TABLE `order_history`
  ADD CONSTRAINT `order_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_history_ibfk_2` FOREIGN KEY (`status_id`) REFERENCES `order_status` (`id`);

--
-- Các ràng buộc cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Các ràng buộc cho bảng `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `product_sizes`
--
ALTER TABLE `product_sizes`
  ADD CONSTRAINT `product_sizes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
