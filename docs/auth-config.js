// Public configuration ONLY. Never put sb_secret_, service_role, passwords or SMTP keys here.
// Supabase Auth validates Turnstile server-side; see ../supabase/README.md.
window.AxzifyAuthConfig = Object.freeze({
  url: 'https://atjijfqmzbyckhzkschp.supabase.co',
  publishableKey: 'sb_publishable_ML4E-g9ayQ2zzkREW0uVdw_6l77ppfD',
  captchaSiteKey: '0x4AAAAAAFRcCTHQXy2c6qOw', // Public Turnstile site key. Secret is only in Supabase.
});
