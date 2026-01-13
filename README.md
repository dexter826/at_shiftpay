<div align="center">
  <img src="public/logo_text.png" alt="Logo dự án" width="300"/>
  <h5>
    <i>Ứng dụng quản lý nhân sự và tính công lương theo ca làm việc</i>
  </h5>
</div>

## Tính năng chính

- **Quản lý nhân sự**:
  - Thêm, sửa, xóa hồ sơ nhân viên
  - Liên kết thông tin tài khoản ngân hàng
  - Hỗ trợ tìm kiếm và lọc/sắp xếp.
- **Quản lý địa điểm**:
  - Thêm, sửa, xóa địa điểm làm việc
  - Đánh giá và ghi chú cho từng địa điểm
- **Lịch tiệc & Sự kiện**:
  - Tạo và quản lý các sự kiện làm việc theo ngày.
  - Theo dõi trạng thái và doanh thu dự kiến của từng sự kiện.
  - Liên kết sự kiện với địa điểm cụ thể
- **Phân ca & Chấm công**:
  - Gán nhân viên vào ca (Sáng/Chiều) cho từng sự kiện.
  - Tự động tính toán chi phí lương dựa trên cấu hình.
- **Tài chính & Lương**:
  - **Theo dõi công nợ**: Tự động tính toán lương chưa thanh toán.
  - **Liên kết thanh toán**: Tích hợp và tạo mã QR chuyển khoản nhanh chóng với nội dung tạo sẵn (nếu nhân viên đã có thông tin tài khoản)
  - **Ứng lương**: Hỗ trợ nhân viên ứng trước lương (Advance Payment).
  - **Thanh toán lương**: Quyết toán lương chi tiết, lưu lịch sử giao dịch.
- **Báo cáo & Thống kê**:
  - **Dashboard**: Biểu đồ thu chi, nhắc nhở công nợ, thống kê tổng quan.
  - **Xuất báo cáo**: Xuất file CSV chi tiết bảng công và lương hàng tháng.
- **Giao diện & Tiện ích**:
  - Hỗ trợ Dark Mode / Light Mode.
  - Hoạt động Offline (mất kết nối mạng vẫn thao tác được).
  - Pull-to-refresh để cập nhật dữ liệu
  - Responsive design cho mobile và desktop
- **Bảo mật**: Xác thực tài khoản, hỗ trợ đổi mật khẩu, quên mật khẩu.

<img src="docs/images/mockup.jpg" alt="Mockup ứng dụng" width="100%">

## Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Styled Components
- **Backend**: Firebase (Firestore, Authentication)
- **State Management**: Zustand
- **Type Safety & Validation**: Zod (Runtime type validation)
- **Libraries**:
  - `framer-motion`: Animation và chuyển tiếp
  - `recharts`: Biểu đồ thống kê
  - `lucide-react`: Icon hệ thống
  - `lottie-react`: Hiệu ứng Splash Screen
  - `zod`: Runtime validation cho Firestore data
  - `zustand`: State management hiện đại và nhẹ
  - `styled-components`: Giải pháp CSS-in-JS cho các component phức tạp
  - `clsx` & `tailwind-merge`: Tiện ích tối ưu hóa và quản lý Class CSS
  - `react-easy-crop`: Công cụ cắt và canh chỉnh hình ảnh
  - `@ncdai/react-wheel-picker`: Bộ chọn vòng xoay (TimePicker) phong cách iOS

## Cài đặt

1. Clone repository:

```bash
git clone https://github.com/dexter826/at_shiftpay
cd at_shiftpay
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Tạo file `.env` và cấu hình Firebase:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_IMGBB_API_KEY=your_imgbb_api_key
```

4. Chạy ứng dụng:

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000` (hoặc port khác tùy cấu hình).

## Build production

```bash
npm run build
```

## Cấu trúc dự án

```
src/
├── components/
│   ├── auth/            # Màn hình đăng nhập, đổi mật khẩu, quên mật khẩu
│   ├── common/          # Component chung (Splashscreen, AppRouter, PullToRefresh...)
│   ├── layout/          # Layout chính (Navbar, OfflineIndicator...)
│   ├── modals/          # Các Modal (Sự kiện, Thanh toán, Xuất báo cáo, Chi tiết nhân viên...)
│   ├── pages/           # Các trang chính (Dashboard, Lịch, Nhân sự, Địa điểm, Bảng lương...)
│   └── ui/              # UI Components cơ bản (Button, Modal, Loading, Toast, Switch...)
├── stores/              # Zustand State Management (Theme, Auth, AppData)
├── hooks/               # Custom React Hooks (useThemeStyles...)
├── services/            # Service Layer (Modular architecture)
│   ├── employeeService.ts    # CRUD operations cho nhân viên
│   ├── eventService.ts       # CRUD operations cho sự kiện
│   ├── locationService.ts    # CRUD operations cho địa điểm
│   ├── shiftService.ts       # CRUD operations cho ca làm
│   ├── paymentService.ts     # CRUD operations cho thanh toán
│   ├── settingsService.ts    # CRUD operations cho cài đặt
│   ├── firebaseService.ts    # Helper functions (DRY, retry logic)
│   ├── index.ts              # Unified dbService export
│   ├── exportService.ts      # CSV export service
│   └── vietqrService.ts      # VietQR API integration
├── utils/               # Utility functions
│   ├── validation.ts    # Zod schemas & validation utilities
│   ├── compare.ts       # Sorting & comparison utilities
│   └── format.ts        # Utility format tiền tệ, ngày tháng
├── constants/           # Định nghĩa màu sắc, hằng số
│   └── colors.ts        # Color constants
├── animations/          # Framer Motion animation variants
│   └── variants.ts      # Animation configurations
├── assets/              # Static assets (Lottie animations...)
│   └── splashscreen.json # Splash screen animation
├── types.ts             # Định nghĩa TypeScript Interface
├── firebase.ts          # Cấu hình Firebase SDK với validation
└── App.tsx              # Component chính & Layout
```

<div align="center">
  <i>Ứng dụng được làm ra với mục đích phục vụ nội bộ và không nhằm mục đích thương mại.</i>
</div>

<div align="center">Made with ❤️ by <a href="https://github.com/dexter826">MOB</a></div>
