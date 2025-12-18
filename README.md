<div align="center">
  <img src="/public/logo_text.png" alt="Logo dự án">
  <h5>Ứng dụng quản lý nhân sự và tính công lương theo ca làm việc.</h5>
</div>

## Tính năng chính

- **Quản lý nhân viên**: Thêm, sửa, xóa thông tin nhân viên (hỗ trợ ảnh đại diện)
- **Quản lý sự kiện (Dự án)**: Tạo và theo dõi các sự kiện làm việc theo lịch, hiển thị trạng thái và doanh thu dự kiến
- **Phân ca làm việc**: Gán nhân viên vào ca (sáng/chiều) cho từng sự kiện, tự động tính toán chi phí
- **Thanh toán lương**:
  - Theo dõi công nợ chi tiết cho từng nhân viên
  - Hỗ trợ thanh toán từng phần hoặc toàn bộ
  - Lưu lịch sử thanh toán
- **Dashboard**: Thống kê tổng quan, biểu đồ thu chi, nhắc nhở công nợ
- **Báo cáo**: Xuất báo cáo chi tiết lương và chấm công ra file Excel
- **Giao diện**: Hỗ trợ Dark Mode / Light Mode, Responsive Design
- **Offline support**: Hoạt động mượt mà ngay cả khi mất kết nối
- **Bảo mật**: Xác thực người dùng qua Email/Password, hỗ trợ đổi mật khẩu

<img src="docs/images/mockup.jpg" alt="Mockup ứng dụng" width="100%">

## Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Styled Components
- **Backend**: Firebase (Firestore, Authentication)
- **State Management & Data Fetching**: React Hooks, Real-time Listeners
- **Utilities**:
  - `exceljs`, `file-saver`: Xuất báo cáo Excel
  - `recharts`: Biểu đồ thống kê
  - `lucide-react`: Icon hệ thống
  - `lottie-react`: Hiệu ứng SplashScreen
  - `date-fns`: Xử lý thời gian

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
```

4. Chạy ứng dụng:

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## Build production

```bash
npm run build
```

## Cấu trúc dự án

```
├── components/          # Các component React
│   ├── ui/             # Component UI tái sử dụng (Button, Modal, Toast...)
│   ├── Dashboard.tsx    # Trang tổng quan
│   ├── CalendarView.tsx # Lịch làm việc & quản lý sự kiện
│   ├── EmployeeManager.tsx # Quản lý hồ sơ nhân viên
│   ├── PayrollView.tsx  # Quản lý & thanh toán lương
│   ├── SettingsView.tsx # Cài đặt hệ thống
│   └── ...
├── contexts/           # React Context (ThemeContext...)
├── services/           # Logic xử lý (Firebase, Excel service)
├── utils/              # Các hàm tiện ích (Format tiền tệ, ngày tháng...)
├── constants.ts        # Các hằng số (Cấu hình mặc định...)
├── types.ts           # Định nghĩa TypeScript Interface
├── firebase.ts        # Cấu hình Firebase SDK
└── App.tsx           # Component chính & Routing
```

## Hướng dẫn sử dụng

1. **Đăng nhập**: Sử dụng tài khoản email đã được cấp quyền.
2. **Quản lý nhân sự**: Vào tab "Nhân Sự" để thêm mới hồ sơ nhân viên.
3. **Lên lịch làm việc**:
   - Vào tab "Lịch", chọn ngày cần tạo sự kiện.
   - Nhập thông tin sự kiện và gán nhân viên vào các ca làm việc.
4. **Xuất báo cáo**:
   - Nhấn nút "Xuất báo cáo" trên thanh công cụ.
   - Chọn tháng/năm cần xuất và tải về file Excel.
5. **Thanh toán lương**:
   - Vào tab "Thanh Toán" để xem bảng công nợ.
   - Chọn nhân viên và nhập số tiền cần thanh toán để ghi nhận giao dịch.

---

<div align="center">Made with ❤️ by <a href="https://github.com/dexter826">MOB</a></div>
