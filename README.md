# فروشگاه نیگا (NIGA Store)

پروژهٔ کلاسی فروشگاه انیمه با **HTML، CSS، JavaScript و Node.js (Express)**.

## امکانات
- نمایش، جست‌وجو، دسته‌بندی و مرتب‌سازی محصولات
- سبد خرید
- ثبت‌نام و ورود با رمز هش‌شده و JWT
- ثبت سفارش و مشاهدهٔ سفارش‌های کاربر
- پنل مدیر برای افزودن محصول و تغییر وضعیت سفارش
- فرم تماس و ذخیرهٔ پیام‌ها
- ذخیرهٔ اطلاعات در فایل JSON محلی (بدون نیاز به نصب دیتابیس)

## اجرای پروژه
1. Node.js نسخهٔ 20 یا جدیدتر را نصب کن.
2. وارد پوشهٔ `backend` شو.
3. دستور `npm install` را اجرا کن.
4. فایل `.env.example` را به `.env` تغییر نام بده.
5. دستور `npm start` را اجرا کن.
6. سایت را در `http://localhost:3000` باز کن.

اطلاعات کاربران، محصولات، سفارش‌ها و پیام‌ها در `backend/data/db.json` ذخیره می‌شوند و فایل به‌صورت خودکار ساخته می‌شود.

## حساب مدیر نمایشی
- ایمیل: `admin@niga.local`
- رمز عبور: `Admin12345!`

این حساب فقط برای اجرای نمایشی پروژهٔ کلاسی است. اطلاعات آن را می‌توان در فایل `.env` تغییر داد.

## APIهای اصلی
- `GET /api/health` و `GET /api/products`
- `POST /api/auth/register` و `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/orders` و `GET /api/orders/me`
- `GET /api/admin/orders`
- `POST /api/admin/products`، `PUT /api/admin/products/:id` و `DELETE /api/admin/products/:id`
- `PATCH /api/admin/orders/:id/status`
- `POST /api/contact`

## نکته
GitHub Pages فقط پیش‌نمایش ظاهری را نمایش می‌دهد؛ بک‌اند Node.js با اجرای محلی فعال می‌شود و برای این پروژه نیازی به میزبانی آنلاین نیست. این پروژه درگاه بانکی یا پرداخت واقعی ندارد و صرفاً برای تمرین و ارائهٔ کلاسی است.
