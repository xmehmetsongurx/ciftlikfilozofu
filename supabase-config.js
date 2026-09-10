/*
  SUPABASE AYARLARI
  ----------------
  Supabase > Project Settings > API bölümündeki değerleri aşağıya yaz.
  Buraya yalnızca public/publishable (veya eski projelerde anon) key gelir.
  service_role anahtarını ASLA tarayıcı koduna koyma.
*/
window.CF_SUPABASE = {
  url: "https://pxhooqqhibfigdavphqa.supabase.co",
  key: "sb_publishable_zInPswwOkxaKE3I2VQhGZQ_K3b7GwrQ"
};

window.CF_HAS_SUPABASE = Boolean(
  window.CF_SUPABASE &&
  window.CF_SUPABASE.url &&
  window.CF_SUPABASE.key &&
  !window.CF_SUPABASE.url.startsWith('YOUR_') &&
  !window.CF_SUPABASE.key.startsWith('YOUR_')
);
