// Read-only checks against the configured project. Does not create users or send emails.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {validateConfig} from '../docs/auth-core.mjs';
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../docs/auth-config.js',import.meta.url),'utf8'),context);
const config=context.window.AxzifyAuthConfig;
assert.ok(validateConfig(config),'Public project configuration missing or invalid');
const headers={apikey:config.publishableKey};
const settingsResponse=await fetch(config.url+'/auth/v1/settings',{headers});
assert.equal(settingsResponse.status,200,'Auth settings endpoint unavailable');
const settings=await settingsResponse.json();
assert.equal(settings.external.email,true,'Email provider must be enabled');
assert.equal(settings.mailer_autoconfirm,false,'Email confirmation must be required');
const profileResponse=await fetch(config.url+'/rest/v1/profiles?select=id&limit=1',{headers});
assert.ok([401,403].includes(profileResponse.status),'Anonymous users must not access profiles');
console.log(JSON.stringify({project:new URL(config.url).hostname,emailEnabled:true,emailConfirmationRequired:true,anonymousProfilesDenied:true,profileHttpStatus:profileResponse.status,readOnly:true}));
