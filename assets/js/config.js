/* آدرس API در اجرای محلی به‌صورت خودکار تنظیم می‌شود. */
window.NIGA_API_BASE_URL = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? location.origin
  : "";
