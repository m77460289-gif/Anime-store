(function () {
  "use strict";
  const URL = "https://hnalacqigtzqpriourft.supabase.co";
  const KEY = "sb_publishable_u_t9zsRmpmYE1TgaMicEww_sOti7l-R";
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase JS did not load.");
    window.nigaSupabaseError = "کتابخانه اتصال به سرور بارگذاری نشد. صفحه را تازه‌سازی کن.";
    return;
  }
  window.nigaSupabase = window.supabase.createClient(URL, KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
})();