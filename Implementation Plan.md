# Kế hoạch triển khai: Quản lý và Đánh giá Địa điểm (Location Management)

Hệ thống sẽ chuyển đổi từ việc lưu trữ thông tin địa điểm và đánh giá trực tiếp trên từng Sự kiện (`Event`) sang một thực thể độc lập là `Location`. Điều này cho phép quản lý danh sách địa điểm tập trung và theo dõi chất lượng (Review) của từng địa điểm.

## 1. Thay đổi Mô hình Dữ liệu (`src/types.ts`)

### Thêm interface `Location`

```typescript
export interface Location {
  id: string;
  name: string;
  review?: "high" | "low"; // Đánh giá chung cho địa điểm
  reviewNote?: string;
  createdAt: string;
}
```

### Cập nhật interface `Event`

- Loại bỏ: `review`, `reviewNote`.
- Cập nhật: `location` (string) sẽ được giữ lại hoặc đổi tên thành `locationName` để hiển thị nhanh, và thêm `locationId` để liên kết chính xác với bảng `Location`.

## 2. Lớp Dịch vụ (`src/services/locationService.ts`)

Tạo mới service để xử lý:

- **CRUD**: Thêm, sửa, xóa, liệt kê địa điểm.
- **FindOrCreate**: Tìm địa điểm theo tên, nếu không thấy thì tự động tạo mới (phục vụ luồng tạo sự kiện nhanh).
- **UpdateReview**: Cập nhật đánh giá cho địa điểm.

## 3. Thay đổi Giao diện và Logic

### A. Thay thế `ReviewsView` bằng `LocationManager`

- Xóa file `src/components/pages/ReviewsView.tsx`.
- Tạo `src/components/pages/LocationManager.tsx`:
  - Hiển thị danh sách địa điểm kèm trạng thái đánh giá (`high`/`low`).
  - Cho phép chỉnh sửa thông tin địa điểm (Tên, Địa chỉ, Ghi chú, Đánh giá).
  - Tìm kiếm địa điểm.
    ánh giá, Ghi chú đ

### B. Cập nhật `EventModal.tsx` (Quan trọng)

- **Ô nhập Location**: Giữ nguyên `input` nhưng tích hợp thêm gợi ý (autocomplete) từ danh sách `Location` hiện có.
- **Logic Lưu**:
  1. Khi lưu sự kiện, kiểm tra tên địa điểm người dùng nhập.
  2. Nếu tên chưa có trong DB: Tạo mới `Location` với tên đó + lưu `review`/`reviewNote` vào bản ghi mới này.
  3. Nếu tên đã có: Cập nhật `review`/`reviewNote` cho `Location` hiện tại.
  4. Lưu `Event` với `locationId` tương ứng.
- **Review**: Các trường đánh giá trong Modal sự kiện bây giờ sẽ tác động trực tiếp đến dữ liệu của `Location` được chọn.

### C. Cập nhật `EventDetailModal.tsx`

- Hiển thị thông tin địa điểm và đánh giá bằng cách truy vấn từ `locationId`.

## 4. Điều hướng và Menu

- **`Navbar.tsx`**: Đổi "Đánh giá" thành "Địa điểm", thay icon `Star` bằng `MapPin`.
- **`AppRouter.tsx`**: Cập nhật route để dẫn vào `LocationManager`.

## 5. Kế hoạch Chuyển đổi Dữ liệu (Migration)

- Viết một script chạy một lần để:
  1. Quét tất cả `Event` hiện có.
  2. Gom nhóm các `location` trùng tên.
  3. Tạo các bản ghi `Location` tương ứng.
  4. Chuyển `review` và `reviewNote` từ `Event` sang `Location` (lấy đánh giá mới nhất).
  5. Cập nhật `locationId` cho các `Event`.

---

**Bạn hãy xem xét kế hoạch này. Nếu cần điều chỉnh logic "tự động tạo/cập nhật đánh giá từ Event", hãy cho tôi biết nhé!**
