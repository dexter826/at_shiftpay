<div align="center">
  <img src="/public/logo_text.png" alt="Logo dự án">
  <h5>Ứng dụng quản lý nhân sự và tính công lương theo ca làm việc.</h5>
</div>

## Tính năng chính

- **Quản lý nhân viên**: Thêm, sửa, xóa thông tin nhân viên
- **Quản lý sự kiện**: Tạo và theo dõi các sự kiện làm việc theo lịch
- **Phân ca làm việc**: Gán nhân viên vào ca sáng/chiều cho từng sự kiện
- **Thanh toán lương**: Theo dõi và thanh toán công nợ cho nhân viên
- **Dashboard**: Thống kê tổng quan với biểu đồ trực quan
- **Offline support**: Hoạt động được khi mất kết nối

## Công nghệ sử dụng

- **React 19** - Thư viện UI
- **TypeScript** - Ngôn ngữ lập trình
- **Firebase** - Backend (Firestore, Authentication)
- **Vite** - Build tool
- **Recharts** - Biểu đồ thống kê
- **Lucide React** - Icon
- **Lottie React** - SplashScreen

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
│   ├── Dashboard.tsx    # Trang tổng quan
│   ├── CalendarView.tsx # Lịch và sự kiện
│   ├── EmployeeManager.tsx # Quản lý nhân viên
│   ├── PayrollView.tsx  # Thanh toán lương
│   └── ui/             # Component UI tái sử dụng
├── contexts/           # React Context (Theme)
├── services/           # Firebase services
├── types.ts           # TypeScript types
├── firebase.ts        # Firebase config
└── App.tsx           # Component chính
```

## Hướng dẫn sử dụng

1. **Đăng nhập**: Sử dụng email đã xác thực
2. **Thêm nhân viên**: Vào tab "Nhân Sự" → Nhấn "Thêm mới"
3. **Tạo sự kiện**: Vào tab "Lịch" → Chọn ngày → Nhấn "+"
4. **Phân ca**: Khi tạo sự kiện, chọn nhân viên và ca làm việc
5. **Thanh toán**: Vào tab "Thanh Toán" → Chọn nhân viên → Xác nhận thanh toán

---

<div align="center">Made with ❤️ by <a href="https://github.com/dexter826">MOB</a></div>
