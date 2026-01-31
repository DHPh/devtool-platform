> **Historical document:** This file is retained for context only and may not match the current codebase. Use docs/INDEX.md for maintained guidance.

# Textarea và Input Border Improvements

## Mô tả

Đã cải thiện giao diện của textarea và input fields với các tính năng:

- Viền rõ ràng hơn (border-2 thay vì border-1)
- Nền khác biệt với nền trang
- Hiệu ứng hover và focus
- Bóng đổ nhẹ (shadow-sm)
- Chuyển đổi mượt mà (transition)

## Các Class CSS Được Cải Thiện

### 1. `.tool-textarea`

- **Nền**: `bg-gray-50` (light) / `bg-gray-800` (dark)
- **Viền**: `border-2` với màu `border-gray-300` (light) / `border-gray-600` (dark)
- **Focus**: Viền xanh và nền sáng hơn
- **Hover**: Viền đậm hơn
- **Bóng đổ**: `shadow-sm` và `shadow-md` khi focus

### 2. `.textarea-enhanced`

- Tương tự `.tool-textarea` nhưng dành cho Shadcn UI Textarea component
- Padding và line-height được tối ưu

### 3. `.tool-input`

- **Nền**: `bg-gray-50` (light) / `bg-gray-800` (dark)
- **Viền**: `border-2` với hiệu ứng tương tự textarea
- **Focus/Hover**: Tương tự textarea

### 4. `.tool-input-bordered` (Mới)

- Phiên bản có viền rõ ràng hơn của `.tool-input`
- Dành cho các trường hợp cần viền đậm hơn

### 5. `.code-input-enhanced` (Mới)

- Dành cho code input areas
- **Nền**: `bg-gray-100` (light) / `bg-gray-800` (dark)
- **Viền**: `border-2` với màu đậm hơn
- **Font**: Monospace font

### 6. `.tool-output`

- **Nền**: `bg-gray-100` (light) / `bg-gray-800` (dark)
- **Viền**: `border-2` với bóng đổ nhẹ

## Hiệu Ứng Được Thêm

### Transitions

```css
transition: border-color 0.2s ease, box-shadow 0.2s ease;
```

### Hover Effects

- Viền đậm hơn khi hover
- Chuyển đổi mượt mà

### Focus Effects

- Viền xanh (`border-blue-500`)
- Ring effect (`ring-2 ring-blue-500`)
- Nền sáng hơn khi focus (`bg-white` / `dark:bg-gray-700`)
- Bóng đổ rõ hơn (`shadow-md`)

## Cách Sử Dụng

### Textarea thông thường

```jsx
<textarea className="tool-textarea" />
```

### Shadcn UI Textarea

```jsx
<Textarea className="textarea-enhanced" />
```

### Input có viền rõ ràng

```jsx
<input className="tool-input-bordered" />
```

### Code input

```jsx
<textarea className="code-input-enhanced" />
```

## Lợi Ích

1. **Khả năng nhận biết tốt hơn**: Viền và nền rõ ràng giúp người dùng dễ dàng nhận biết vùng input
2. **Trải nghiệm người dùng**: Hiệu ứng hover và focus giúp tương tác mượt mà hơn
3. **Phân biệt với nền**: Nền khác biệt giúp textarea/input nổi bật hơn
4. **Tương thích dark mode**: Hoạt động tốt trên cả light và dark theme
5. **Accessibility**: Viền rõ ràng giúp người dùng có khuyết tật thị giác dễ nhận biết

## Tương Thích

- ✅ Light theme
- ✅ Dark theme
- ✅ Responsive design
- ✅ Keyboard navigation
- ✅ Screen readers
- ✅ Touch devices

## Ghi Chú

Tất cả các style đều sử dụng Tailwind CSS classes và tương thích với hệ thống design token của Shadcn UI.
