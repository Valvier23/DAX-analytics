// No credentials are persisted here. Supabase Auth owns password hashing and sessions.
export function validateConfig(config) {
  return typeof config?.url === 'string' &&
    /^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(config.url) &&
    typeof config.publishableKey === 'string' &&
    /^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey);
}

export function validatePassword(password) {
  if (typeof password !== 'string' || [...password].length < 12) return 'passwordLength';
  if (new TextEncoder().encode(password).length > 72) return 'passwordBytes';
  return null;
}

export function createAccountService(client, callback) {
  async function unwrap(request) {
    const result = await request;
    if (result.error) throw result.error;
    return result.data;
  }
  function checkPassword(password) {
    const error = validatePassword(password);
    if (error) throw new Error(error);
  }
  return {
    register(name, email, password, captchaToken) {
      return Promise.resolve().then(() => {
        if (!name.trim() || name.trim().length > 100) throw new Error('nameRequired');
        checkPassword(password);
        return unwrap(client.auth.signUp({email: email.trim(), password,
          options: {emailRedirectTo: callback, data: {full_name: name.trim()}, ...(captchaToken ? {captchaToken} : {})}}));
      });
    },
    login: (email, password, captchaToken) => unwrap(client.auth.signInWithPassword({email: email.trim(), password, ...(captchaToken ? {options:{captchaToken}} : {})})),
    recover: (email, captchaToken) => unwrap(client.auth.resetPasswordForEmail(email.trim(), {redirectTo: callback, ...(captchaToken ? {captchaToken} : {})})),
    logout: () => unwrap(client.auth.signOut({scope: 'global'})),
    user: () => unwrap(client.auth.getUser()),
    profile: user => unwrap(client.from('profiles').select('full_name, created_at').eq('id', user.id).single()),
    changePassword(password) {
      return Promise.resolve().then(() => {
        checkPassword(password);
        return unwrap(client.auth.updateUser({password}));
      });
    },
  };
}
