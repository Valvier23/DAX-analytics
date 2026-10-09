import {validateConfig, createAccountService} from './auth-core.mjs';
import {copy} from './auth-copy.mjs';
import {createDashboard} from './dashboard.mjs';

const $ = id => document.getElementById(id);
const dashboard = createDashboard($('account-dashboard'));
let language = 'es', mode = 'login', ready = false, busy = false, currentUser = null;
let statusKey = 'loading', statusError = false, service, client, revision = 0, recovering = false;
let captchaToken = '', captchaId;
try { language = localStorage.getItem('axzify-language') === 'en' ? 'en' : 'es'; } catch {}
const text = key => copy[language][key];
function message(key, error = false) {
  statusKey = key; statusError = error;
  $('account-status').textContent = text(key);
  $('account-status').dataset.error = String(error);
}
function setBusy(value) {
  busy = value;
  $('account-fields').disabled = value || !ready;
  document.querySelectorAll('[data-mode], #recover-button, #return-login, #logout-button').forEach(button => {button.disabled = value;});
  $('account-form').setAttribute('aria-busy', String(value));
}
function render() {
  const updating = mode === 'update', registering = mode === 'register', resetting = mode === 'recover';
  const profile = currentUser && !updating;
  document.querySelector('.account-shell').dataset.authenticated = String(!!profile);
  if (profile) dashboard.show(language); else dashboard.hide();
  $('account-title').textContent = text(profile ? 'account' : mode);
  $('auth-forms').hidden = !ready || !!profile;
  $('account-profile').hidden = !profile;
  $('account-switch').hidden = updating || resetting;
  $('name-field').hidden = !registering;
  $('full-name').required = registering;
  $('full-name').disabled = !registering;
  $('email-field').hidden = updating;
  $('email').required = !updating;
  $('email').disabled = updating;
  $('password-field').hidden = resetting;
  $('password').required = !resetting;
  $('password').disabled = resetting;
  $('password').autocomplete = registering || updating ? 'new-password' : 'current-password';
  $('password-hint').hidden = !(registering || updating);
  $('confirmation-field').hidden = !(registering || updating);
  $('password-confirmation').required = registering || updating;
  $('password-confirmation').disabled = !(registering || updating);
  $('registration-note').hidden = !registering;
  $('account-captcha').hidden = updating;
  $('recover-button').hidden = mode !== 'login';
  $('return-login').hidden = !resetting;
  $('submit-account').textContent = text(mode);
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  setBusy(busy);
}
function translate() {
  document.documentElement.lang = language;
  document.title = text('title');
  $('account-language').value = language;
  $('account-language').setAttribute('aria-label', text('language'));
  $('theme-select').setAttribute('aria-label', text('theme'));
  $('account-switch').setAttribute('aria-label', text('account'));
  document.querySelectorAll('[data-auth-copy]').forEach(node => {node.textContent = text(node.dataset.authCopy);});
  render(); message(statusKey, statusError);
}
function switchMode(next) {
  if (busy) return;
  mode = next;
  $('password').value = ''; $('password-confirmation').value = '';
  render(); message({login:'ready',register:'registerReady',recover:'recoverReady',update:'updateReady'}[mode]);
}
function errorKey(error, fallback = 'failed') {
  if (['passwordLength','passwordBytes','nameRequired','mismatch','captchaRequired'].includes(error?.message)) return error.message;
  if (error?.status === 429 || ['over_request_rate_limit','over_email_send_rate_limit'].includes(error?.code)) return 'rate';
  if (['otp_expired','flow_state_expired','flow_state_not_found'].includes(error?.code)) return 'expired';
  return fallback;
}
function clearProfile() {
  currentUser = null;
  dashboard.hide();
  for (const id of ['profile-name','profile-email','profile-last-login']) $(id).textContent = '';
}
async function refreshUser() {
  const ticket = ++revision;
  try {
    const {data: sessionData, error: sessionError} = await client.auth.getSession();
    if (ticket !== revision) return;
    if (sessionError) throw sessionError;
    if (!sessionData.session) { clearProfile(); recovering = false; sessionStorage.removeItem('axzify-recovery'); mode = 'login'; render(); return; }
    // getUser validates with the server; cached session data is never proof of identity.
    const {user} = await service.user();
    if (ticket !== revision) return;
    if (!user) throw new Error('missing user');
    currentUser = user;
    if (recovering) {mode = 'update';render();message('updateReady');return;}
    mode = 'login';
    $('profile-email').textContent = user.email || text('unknown');
    const date = new Date(user.last_sign_in_at);
    $('profile-last-login').textContent = Number.isNaN(date.getTime()) ? text('unknown') : date.toLocaleString(language);
    render(); message('welcome');
    try {
      const profile = await service.profile(user);
      if (ticket === revision) $('profile-name').textContent = profile.full_name;
    } catch { if (ticket === revision) { $('profile-name').textContent = text('unknown'); message('profileFailed', true); } }
  } catch (error) {
    if (ticket !== revision) return;
    clearProfile(); mode = 'login'; render(); message(errorKey(error), true);
  }
}

$('account-language').addEventListener('change', () => {
  language = $('account-language').value === 'en' ? 'en' : 'es';
  try {localStorage.setItem('axzify-language', language);} catch {}
  translate();
});
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => switchMode(button.dataset.mode)));
$('recover-button').addEventListener('click', () => switchMode('recover'));
$('return-login').addEventListener('click', () => switchMode('login'));
$('account-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!ready || busy) return;
  const submittedMode = mode;
  setBusy(true); message('working');
  try {
    if (mode !== 'update' && window.AxzifyAuthConfig.captchaSiteKey && !captchaToken) throw new Error('captchaRequired');
    if ((mode === 'register' || mode === 'update') && $('password').value !== $('password-confirmation').value) throw new Error('mismatch');
    if (mode === 'register') {
      await service.register($('full-name').value, $('email').value, $('password').value, captchaToken);
      message('registered');
    } else if (mode === 'recover') {
      await service.recover($('email').value, captchaToken); message('recovered');
    } else if (mode === 'update') {
      await service.changePassword($('password').value);
      recovering = false; sessionStorage.removeItem('axzify-recovery');
      try {
        await service.logout();
        ++revision; clearProfile(); mode = 'login'; render(); message('updated');
      } catch {
        // The SDK clears this tab even if global revocation fails. Do not report a failed password update.
        ++revision; clearProfile(); mode = 'login'; render(); message('updatedLogoutFailed', true);
      }
    } else {
      await service.login($('email').value, $('password').value, captchaToken);
      await refreshUser();
    }
  } catch (error) {
    // Avoid disclosing account existence during sign-up and recovery.
    if (submittedMode === 'register' && ['user_already_exists','email_exists'].includes(error?.code)) message('registered');
    else message(errorKey(error, submittedMode === 'login' ? 'invalid' : 'failed'), true);
  } finally {
    $('password').value = ''; $('password-confirmation').value = '';
    captchaToken = '';
    if (captchaId !== undefined) window.turnstile.reset(captchaId);
    setBusy(false);
  }
});
$('logout-button').addEventListener('click', async () => {
  if (busy) return;
  setBusy(true);
  try {
    await service.logout(); ++revision; clearProfile(); recovering = false;
    sessionStorage.removeItem('axzify-recovery'); $('account-form').reset(); mode = 'login'; render(); message('signedOut');
  } catch (error) {message(errorKey(error), true);} finally {setBusy(false);}
});

translate();
window.addEventListener('hashchange', () => {
  const params = new URLSearchParams(location.hash.slice(1));
  // Email links can target this already-open document without a full navigation.
  if (params.has('access_token') || params.has('error')) location.reload();
});
async function prepareCaptcha(sitekey) {
  if (!sitekey) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.onload = resolve; script.onerror = reject; document.head.append(script);
  });
  captchaId = window.turnstile.render('#account-captcha', {
    sitekey, theme:'auto', size:'compact', language,
    callback: token => {captchaToken = token;},
    'expired-callback': () => {captchaToken = '';},
    'error-callback': () => {captchaToken = '';message('captchaFailed',true);},
  });
}
async function start() {
  if (!validateConfig(window.AxzifyAuthConfig) || !window.supabase?.createClient) {message('unavailable');return;}
  if (!['localhost','127.0.0.1','[::1]'].includes(location.hostname) && !window.AxzifyAuthConfig.captchaSiteKey) {message('unavailable');return;}
  try {sessionStorage.setItem('axzify-storage-check','1');sessionStorage.removeItem('axzify-storage-check');}
  catch {message('storage',true);return;}
  const fragment = new URLSearchParams(location.hash.slice(1));
  const failedLink = fragment.has('error') || new URLSearchParams(location.search).has('error');
  recovering = fragment.get('type') === 'recovery' || sessionStorage.getItem('axzify-recovery') === '1';
  if (recovering) sessionStorage.setItem('axzify-recovery','1');
  try {
    const config = window.AxzifyAuthConfig;
    client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: {storage: sessionStorage, storageKey:'axzify-auth', flowType:'implicit', persistSession:true, autoRefreshToken:true, detectSessionInUrl:true},
    });
    // Fixed same-origin destination; user-supplied return URLs are never used.
    service = createAccountService(client, new URL('cuenta.html', location.href).origin + new URL('cuenta.html', location.href).pathname);
    client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {recovering = true;sessionStorage.setItem('axzify-recovery','1');}
      if (event === 'SIGNED_OUT') {++revision;clearProfile();recovering = false;sessionStorage.removeItem('axzify-recovery');mode = 'login';render();}
      // Do not await SDK calls inside its auth lock callback.
      if (ready && !busy && ['SIGNED_IN','TOKEN_REFRESHED','PASSWORD_RECOVERY'].includes(event)) setTimeout(refreshUser, 0);
    });
    const {error} = await client.auth.initialize();
    history.replaceState(null, '', location.pathname);
    await prepareCaptcha(config.captchaSiteKey);
    ready = true; render();
    if (error || failedLink) {recovering = false;sessionStorage.removeItem('axzify-recovery');switchMode('recover');message('expired',true);return;}
    message('ready'); await refreshUser();
  } catch {history.replaceState(null, '', location.pathname);message('failed',true);}
}
start();

