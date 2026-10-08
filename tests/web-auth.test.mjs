import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateConfig, validatePassword, createAccountService} from '../docs/auth-core.mjs';

const config={url:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_test'};
test('only public keys and Supabase HTTPS origins are accepted',()=>{
 assert.equal(validateConfig(config),true);
 for(const bad of [{}, {...config,url:'http://example.com'}, {...config,url:config.url+'/evil'}, {...config,publishableKey:'sb_secret_private'}, {...config,publishableKey:'eyJservice_role'}]) assert.equal(validateConfig(bad),false);
});
test('password policy counts UTF-8 bytes and never truncates',()=>{
 assert.equal(validatePassword('short'),'passwordLength');
 assert.equal(validatePassword('a'.repeat(12)),null);
 assert.equal(validatePassword('a'.repeat(72)),null);
 assert.equal(validatePassword('a'.repeat(73)),'passwordBytes');
 assert.equal(validatePassword('🔒'.repeat(19)),'passwordBytes');
});
function harness(){
 const calls=[];
 const auth=new Proxy({}, {get:(_,method)=>async (...input)=>{calls.push([method,...input]);return {data:{user:{id:'u1',email:'test@example.invalid'}},error:null};}});
 const db={select(columns){calls.push(['select',columns]);return this;},eq(column,value){calls.push(['eq',column,value]);return this;},async single(){return {data:{full_name:'Test'},error:null};}};
 const client={auth,from(table){calls.push(['from',table]);return db;}};
 return {calls,client,service:createAccountService(client,'https://axzify.com/cuenta.html')};
}
test('signup sends password only to Auth and fixed callback with trimmed profile',async()=>{
 const {service,calls}=harness();await service.register(' Alice ',' A@example.com ','long password example');
 assert.deepEqual(calls,[['signUp',{email:'A@example.com',password:'long password example',options:{emailRedirectTo:'https://axzify.com/cuenta.html',data:{full_name:'Alice'}}}]]);
});
test('invalid registration does not send any credentials',async()=>{
 const {service,calls}=harness();await assert.rejects(service.register('','a@b.com','long password example'),/nameRequired/);
 await assert.rejects(service.register('Alice','a@b.com','short'),/passwordLength/);assert.equal(calls.length,0);
});
test('login, reset and logout use official Auth methods',async()=>{
 const {service,calls}=harness();await service.login(' a@b.com ','untouched');await service.recover(' a@b.com ');await service.logout();
 assert.deepEqual(calls,[['signInWithPassword',{email:'a@b.com',password:'untouched'}],['resetPasswordForEmail','a@b.com',{redirectTo:'https://axzify.com/cuenta.html'}],['signOut',{scope:'global'}]]);
});
test('profile lookup is constrained to verified user ID and propagates database errors',async()=>{
 const {service,calls,client}=harness();assert.equal((await service.profile({id:'u1'})).full_name,'Test');
 assert.deepEqual(calls,[['from','profiles'],['select','full_name, created_at'],['eq','id','u1']]);
 client.from=()=>({select(){return this;},eq(){return this;},single:async()=>({error:new Error('denied')})});
 await assert.rejects(service.profile({id:'u2'}),/denied/);
});
test('API errors never become successful logins',async()=>{
 const {service,client}=harness();client.auth={signInWithPassword:async()=>({error:new Error('invalid login')})};
 await assert.rejects(service.login('a@b.com','bad'),/invalid login/);
});
test('password update validates before making request',async()=>{
 const {service,calls}=harness();await assert.rejects(service.changePassword('short'),/passwordLength/);
 await service.changePassword('a longer password');assert.deepEqual(calls,[['updateUser',{password:'a longer password'}]]);
});
test('captcha tokens are supplied to signup, login and recovery',async()=>{
 const {service,calls}=harness();await service.register('Test','a@b.com','a longer password','one');await service.login('a@b.com','a longer password','two');await service.recover('a@b.com','three');
 assert.equal(calls[0][1].options.captchaToken,'one');assert.equal(calls[1][1].options.captchaToken,'two');assert.equal(calls[2][2].captchaToken,'three');
});
