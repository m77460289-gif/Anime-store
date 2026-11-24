# فروشگاه نیگا (NIGA Store)

فروشگاه فارسی و راست‌چین با فرانت‌اند HTML/CSS/JavaScript و بک‌اند Java 21 + Spring Boot 4.0.10.

## قابلیت‌ها
- فهرست، جست‌وجو، دسته‌بندی و مرتب‌سازی محصولات
- سبد خرید سمت مرورگر
- ثبت‌نام و ورود با رمز هش‌شده BCrypt و توکن JWT
- ثبت سفارش با محاسبه قیمت در سمت سرور و ذخیره در دیتابیس
- نمایش سفارش‌های مشتری و پنل مدیریت محصولات/سفارش‌ها
- ذخیره پیام‌های فرم تماس
- PostgreSQL برای انتشار و H2 برای توسعه محلی
- Dockerfile و Blueprint برای میزبانی API در Render

## استقرار بک‌اند
GitHub Pages فقط فرانت‌اند را اجرا می‌کند و Java را اجرا نمی‌کند. فایل render.yaml در ریشه مخزن برای استقرار API و پایگاه داده در Render آماده شده است. بعد از انتشار API، آدرس آن را در assets/js/config.js در متغیر NIGA_API_BASE_URL قرار بده.

در متغیرهای محیطی سرویس Render مقادیر ADMIN_EMAIL و ADMIN_PASSWORD را محرمانه وارد کن تا حساب مدیر ساخته شود. JWT_SECRET به‌صورت خودکار ساخته می‌شود. FRONTEND_ORIGIN باید دامنه دقیق سایت Pages باشد.

## اجرای محلی
از پوشه backend دستور mvn spring-boot:run را اجرا کن. API در http://localhost:8080 اجرا می‌شود و از H2 حافظه‌ای استفاده می‌کند. مقدار NIGA_API_BASE_URL را در assets/js/config.js روی http://localhost:8080 بگذار.

## APIهای اصلی
- GET /api/health
- GET /api/products
- POST /api/auth/register و POST /api/auth/login
- GET /api/auth/me
- POST /api/orders و GET /api/orders/me
- GET /api/admin/orders
- POST /api/admin/products، PUT /api/admin/products/{id}، DELETE /api/admin/products/{id}
- PATCH /api/admin/orders/{id}/status
- POST /api/contact

## اطلاعات محصول
در مخزن فعلی دو محصول قابل‌شناسایی وجود داشت: قاب گوشی با قیمت ۵۵۰٬۰۰۰ تومان و پوستر بدون قیمت ثبت‌شده. قیمت پوستر عمداً صفر است تا قبل از تعیین قیمت سفارش اشتباه ثبت نشود. تصاویر آرشیو در گالری باقی مانده‌اند؛ برای فروش هر تصویر باید نام، قیمت و موجودی درست آن را از پنل مدیریت ثبت کنی.

## پرداخت
درگاه بانکی واقعی هنوز متصل نیست؛ سفارش‌ها فعلاً با وضعیت PENDING در دیتابیس ثبت می‌شوند. اتصال پرداخت آنلاین نیازمند حساب پذیرنده و کلیدهای رسمی درگاه است. اطلاعات بانکی محرمانه را در کد یا مخزن GitHub قرار نده.
