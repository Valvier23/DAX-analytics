// Isolated browser tests. All Supabase requests are intercepted; no real accounts or emails.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve('docs');let configured=false,captchaEnabled=false;
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/auth-config.js') {res.setHeader('Content-Type','text/javascript');res.end(`window.AxzifyAuthConfig=${JSON.stringify(configured?{url:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_test',captchaSiteKey:captchaEnabled?'test-site-key':''}:{})}`);return;}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'})[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try {
  browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page=await browser.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
  const origin=`http://127.0.0.1:${server.address().port}`,url=origin+'/cuenta.html';
  const user={id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',email:'test@example.invalid',email_confirmed_at:new Date().toISOString(),last_sign_in_at:new Date().toISOString(),user_metadata:{full_name:'Test'},app_metadata:{provider:'email'}};
  const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'},'signature'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.');
  const session={access_token:token,token_type:'bearer',expires_in:3600,refresh_token:'test-refresh',user};
  let failLogin=false,failProfile=false,failLogout=false;
  await page.route('https://challenges.cloudflare.com/**',route=>route.fulfill({contentType:'text/javascript',body:`window.turnstile={render(selector,options){window.testCaptchaOptions=options;options.callback('test-captcha-token');return 'test-widget';},reset(){window.testCaptchaOptions.callback('test-captcha-token');}};`}));
  await page.route('https://abcdefghijklmnopqrst.supabase.co/**',async route=>{
   const req=route.request(),p=new URL(req.url()).pathname;requests.push({path:p,method:req.method(),body:req.postDataJSON(),url:req.url()});
   let status=200,body={};
   if(p.endsWith('/token')){body=session;if(failLogin){status=400;body={code:'invalid_credentials',msg:'Invalid login credentials'};}}
   else if(p.endsWith('/signup'))body={user,session:null};
   else if(p.endsWith('/user'))body=user;
   else if(p.endsWith('/logout')&&failLogout){status=500;body={message:'offline'};}
   else if(p.endsWith('/profiles')){body={full_name:'<img src=x onerror=alert(1)>',created_at:new Date().toISOString()};if(failProfile){status=403;body={message:'denied'};}}
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(url);await page.getByText('El acceso todavía no está disponible.',{exact:false}).waitFor();
  assert.equal(await page.locator('#auth-forms').isVisible(),false);assert.equal(requests.length,0);
  configured=true;await page.reload();await page.locator('#account-fields:not([disabled])').waitFor();
  for(const width of [320,390,850,1280])for(const lang of ['es','en'])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:900});await page.selectOption('#account-language',lang);await page.selectOption('#theme-select',theme);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${width}/${lang}/${theme}`);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.ok(!(await page.locator('body').innerText()).includes('undefined'));
  }
  await page.selectOption('#account-language','es');await page.selectOption('#theme-select','light');
  await page.locator('[data-mode=register]').click();await page.fill('#full-name','Test');await page.fill('#email','test@example.invalid');
  await page.fill('#password','a secure password');await page.fill('#password-confirmation','different password');await page.locator('#submit-account').click();
  await page.getByText('Las contraseñas no coinciden.',{exact:true}).waitFor();assert.equal(requests.filter(x=>x.path.endsWith('/signup')).length,0);
  await page.fill('#password','a secure password');await page.fill('#password-confirmation','a secure password');await page.locator('#submit-account').click();
  await page.getByText('Si el correo puede registrarse,',{exact:false}).waitFor();
  const signup=requests.find(x=>x.path.endsWith('/signup'));assert.equal(signup.body.data.full_name,'Test');assert.equal(new URL(signup.url).searchParams.get('redirect_to'),url);
  assert.equal(await page.inputValue('#password'),'');
  await page.locator('[data-mode=login]').click();await page.locator('#recover-button').click();await page.locator('#submit-account').click();
  await page.getByText('Si hay una cuenta asociada',{exact:false}).waitFor();assert.equal(new URL(requests.find(x=>x.path.endsWith('/recover')).url).searchParams.get('redirect_to'),url);
  await page.locator('#return-login').click();failLogin=true;await page.fill('#password','wrong password');await page.locator('#submit-account').click();
  await page.getByText('No se ha podido iniciar sesión.',{exact:false}).waitFor();assert.equal(await page.locator('#account-profile').isVisible(),false);
  failLogin=false;await page.fill('#password','a secure password');await page.locator('#submit-account').click();
  await page.locator('#profile-name').filter({hasText:'<img'}).waitFor();assert.equal(await page.locator('#profile-name img').count(),0);
  assert.ok(requests.find(x=>x.path.endsWith('/profiles')).url.includes(`id=eq.${user.id}`));
  await page.reload();await page.locator('#account-profile').waitFor({state:'visible'});
  await page.locator('#logout-button').click();await page.getByText('Has cerrado la sesión.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('axzify-auth')),null);
  await page.goto(url+'#access_token='+token+'&refresh_token=test-refresh&expires_in=3600&token_type=bearer&type=recovery');
  await page.getByText('Elige una nueva contraseña para tu cuenta.',{exact:true}).waitFor();assert.equal(page.url(),url);
  await page.reload();await page.getByText('Elige una nueva contraseña para tu cuenta.',{exact:true}).waitFor();
  await page.fill('#password','new secure password');await page.fill('#password-confirmation','new secure password');await page.locator('#submit-account').click();
  await page.getByText('Contraseña actualizada.',{exact:false}).waitFor();assert.ok(requests.some(x=>x.path.endsWith('/user')&&x.method==='PUT'&&x.body.password==='new secure password'));
  await page.goto(url+'#error=access_denied&error_code=otp_expired&error_description=Expired');
  await page.getByText('El enlace no es válido o ha caducado.',{exact:false}).waitFor();assert.equal(page.url(),url);
  await page.locator('#return-login').click();failProfile=true;await page.fill('#email','test@example.invalid');await page.fill('#password','a secure password');await page.locator('#submit-account').click();
  await page.getByText('No se ha podido cargar tu perfil.',{exact:false}).waitFor();assert.equal(await page.locator('#logout-button').isVisible(),true);
  await page.locator('#logout-button').click();
  failProfile=false;failLogout=true;
  await page.goto(url+'#access_token='+token+'&refresh_token=test-refresh&expires_in=3600&token_type=bearer&type=recovery');
  await page.getByText('Elige una nueva contraseña para tu cuenta.',{exact:true}).waitFor();
  await page.fill('#password','another secure password');await page.fill('#password-confirmation','another secure password');await page.locator('#submit-account').click();
  await page.getByText('Tu contraseña se ha actualizado, pero',{exact:false}).waitFor();assert.equal(await page.locator('#auth-forms').isVisible(),true);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('axzify-auth')),null);
  failLogout=false;
  captchaEnabled=true;await page.reload();await page.locator('#account-fields:not([disabled])').waitFor();
  await page.evaluate(()=>window.testCaptchaOptions['expired-callback']());
  await page.fill('#email','test@example.invalid');await page.fill('#password','a secure password');await page.locator('#submit-account').click();
  await page.getByText('Completa la comprobación de seguridad para continuar.',{exact:true}).waitFor();
  await page.fill('#password','a secure password');await page.locator('#submit-account').click();await page.locator('#account-profile').waitFor({state:'visible'});
  assert.equal(requests.filter(x=>x.path.endsWith('/token')).at(-1).body.gotrue_meta_security.captcha_token,'test-captcha-token');
  await page.locator('#logout-button').click();await page.getByText('Has cerrado la sesión.',{exact:true}).waitFor();
  fs.mkdirSync('outputs/auth-review',{recursive:true});
  await page.locator('[data-mode=register]').click();await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'outputs/auth-review/register-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.selectOption('#theme-select','dark');await page.screenshot({path:'outputs/auth-review/register-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: unconfigured fail-closed, 16 responsive/language/theme cases, registration, mismatch, recovery request, failed login, login, profile XSS, session reload, logout, recovery callback + reload + update, expired link, profile error. Supabase network mocked.');
 } finally {await browser?.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
