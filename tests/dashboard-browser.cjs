// Integration check with a simulated Auth provider; never uses real credentials.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../docs');
const mock=`window.supabase={createClient(){let user=null,callback;return {auth:{
 onAuthStateChange(fn){callback=fn}, initialize:async()=>({error:null}),
 getSession:async()=>({data:{session:user?{user}:null},error:null}),
 getUser:async()=>({data:{user},error:null}),
 signInWithPassword:async()=>{user={id:'demo',email:'demo@example.invalid',last_sign_in_at:'2025-01-01'};callback('SIGNED_IN');return {data:{user},error:null}},
 signOut:async()=>{user=null;callback('SIGNED_OUT');return {data:{},error:null}},
 updateUser:async()=>({data:{user},error:null}),
 },from(){return {select(){return this},eq(){return this},single:async()=>({data:{full_name:'Demo'},error:null})}}}}};
 `;
async function run(){
 const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(error,content)=>{if(error){res.writeHead(404);res.end();return;}const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.csv':'text/csv'})[ext]||'text/plain');res.end(content);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.DASHBOARD_BROWSER_PATH?{executablePath:process.env.DASHBOARD_BROWSER_PATH}:{})});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/auth-config.js*',route=>route.fulfill({contentType:'text/javascript',body:"window.AxzifyAuthConfig={url:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_test'};"}));
  await page.route('**/vendor/supabase.js*',route=>route.fulfill({contentType:'text/javascript',body:mock}));
  const url='http://127.0.0.1:'+server.address().port+'/cuenta.html';
  await page.goto(url);
  try {await page.locator('#email').waitFor({state:'visible',timeout:10000});}
  catch(error){console.error('Auth status:',await page.locator('#account-status').textContent(),'Page errors:',errors);throw error;}
  assert.equal(await page.locator('#account-dashboard').isVisible(),false);
  await page.fill('#email','demo@example.invalid');await page.fill('#password','a long demo password');await page.click('#submit-account');
  await page.locator('.analytics-kpis').waitFor();
  assert.equal(await page.locator('[data-filter=year]').inputValue(),'2025');
  assert.equal(await page.locator('.analytics-kpis article').count(),4);
  assert.ok(await page.locator('.analytics-chart svg').count()>=2,'Overview must contain SVG charts');
  assert.equal(await page.locator('.analytics-chart progress').count(),0,'Progress bars must be replaced with real charts');
  const point=page.locator('[data-chart-point]').first();await point.focus();
  assert.equal(await page.locator('.chart-tooltip:not([hidden])').count(),1);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.chart-tooltip:not([hidden])').count(),0,'Escape must dismiss a chart tooltip');
  await page.setViewportSize({width:900,height:900});
  await page.waitForFunction(()=>document.querySelector('.analytics-tabs')?.getAttribute('aria-orientation')==='horizontal');
  assert.equal(await page.locator('.analytics-tabs').getAttribute('aria-orientation'),'horizontal');
  await page.setViewportSize({width:1280,height:900});
  await page.waitForFunction(()=>document.querySelector('.analytics-tabs')?.getAttribute('aria-orientation')==='vertical');
  await page.screenshot({path:path.resolve(__dirname,'../dashboard-overview-light.png'),fullPage:true});
  await page.locator('[data-department="Ventas"]').first().click();
  assert.equal(await page.locator('[data-filter=department]').inputValue(),'Ventas');
  await page.click('[data-reset-filters]');
  assert.equal(await page.locator('[data-filter=department]').inputValue(),'');
  const initial=await page.locator('.analytics-kpis strong').first().textContent();
  await page.selectOption('[data-filter=department]','Ventas');
  assert.notEqual(await page.locator('.analytics-kpis strong').first().textContent(),initial);
  await page.selectOption('[data-filter=center]','Madrid');
  const segment=await page.locator('.analytics-kpis').textContent();
  await page.selectOption('[data-filter=year]','2024');
  assert.notEqual(await page.locator('.analytics-kpis').textContent(),segment);
  await page.click('#analytics-tab-workforce');assert.equal(await page.locator('.analytics-chart').count(),3);
  assert.ok(await page.locator('.department-table tbody tr').count()>0);
  await page.click('#analytics-tab-absence');assert.match(await page.locator('.analytics-kpis').textContent(),/Días de baja médica/);
  assert.equal(await page.locator('.analytics-chart').count(),3,'Absence should pair day volume with department rates');
  await page.selectOption('#account-language','en');assert.match(await page.locator('.analytics-kpis').textContent(),/Medical absence days/);
  assert.equal(await page.locator('[data-filter=department]').inputValue(),'Ventas');
  await page.selectOption('#theme-select','dark');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.setViewportSize({width:375,height:812});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.resolve(__dirname,'../dashboard-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});await page.click('#analytics-tab-summary');
  await page.screenshot({path:path.resolve(__dirname,'../dashboard-desktop.png'),fullPage:true});
  // Visual and responsive coverage for every view, not just a filtered absence chart.
  await page.click('[data-reset-filters]');await page.selectOption('[data-filter=year]','2025');
  await page.selectOption('#account-language','es');
  for(const theme of ['light','dark']){
   await page.selectOption('#theme-select',theme);
   for(const width of [1440,375,320]){
    await page.setViewportSize({width,height:900});
    for(const view of ['summary','workforce','absence']){
     await page.click('#analytics-tab-'+view);
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,view+' overflows at '+width+'px');
     if(width!==320)await page.screenshot({path:path.resolve(__dirname,'../dashboard-'+view+'-'+theme+'-'+width+'.png'),fullPage:true});
    }
   }
  }
  await page.click('#logout-button');assert.equal(await page.locator('#account-dashboard').isVisible(),false);
  assert.equal(await page.locator('#account-dashboard').textContent(),'');
  // Recovery sessions must show the password form, never the dashboards.
  await page.evaluate(()=>sessionStorage.setItem('axzify-recovery','1'));
  await page.route('**/vendor/supabase.js*',route=>route.fulfill({contentType:'text/javascript',body:mock.replace('let user=null','let user={id:"demo",email:"demo@example.invalid"}')}));
  await page.reload();await page.locator('#password-confirmation').waitFor({state:'visible'});
  assert.equal(await page.locator('#account-dashboard').isVisible(),false);
  await page.evaluate(()=>sessionStorage.removeItem('axzify-recovery'));
  // Cached sessions do not reveal the dashboard when server verification fails.
  await page.route('**/vendor/supabase.js*',route=>route.fulfill({contentType:'text/javascript',body:mock.replace('let user=null','let user={id:"demo"}').replace('getUser:async()=>({data:{user},error:null})','getUser:async()=>({data:{},error:{message:"invalid session"}})')}));
  await page.reload();await page.locator('#email').waitFor({state:'visible'});
  assert.equal(await page.locator('#account-dashboard').isVisible(),false);
  // Sample CSV failures have a visible retry path.
  await page.route('**/vendor/supabase.js*',route=>route.fulfill({contentType:'text/javascript',body:mock}));
  await page.route('**/data/*.csv',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.reload();await page.locator('#email').waitFor({state:'visible'});
  await page.fill('#email','demo@example.invalid');await page.fill('#password','a long demo password');await page.click('#submit-account');
  await page.locator('#account-dashboard button').waitFor({state:'visible'});
  await page.unroute('**/data/*.csv');await page.locator('#account-dashboard button').click();
  await page.locator('.analytics-kpis').waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: login, dashboards, filters, language, theme, mobile, logout and recovery');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
