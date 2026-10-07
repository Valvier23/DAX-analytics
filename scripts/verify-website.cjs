// Isolated headless browser, serving only the local website; no desktop interaction.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve('docs'),out=path.resolve('outputs/website-review');fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}/?campaign=qa#demo`;
  await page.goto(url);await page.locator('[data-area="ausencias"]').click();
  await page.locator('#preguntas details').first().evaluate(e=>e.open=true);
  let cases=0;
  for(const width of [320,390,850,1280])for(const lang of ['es','en'])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:900});await page.selectOption('#theme-select',theme);await page.selectOption('#language-select',lang);
   assert.equal(page.url(),url);assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('html').getAttribute('data-theme'),theme);assert.equal(await page.locator('[data-area="ausencias"]').getAttribute('aria-selected'),'true');
   assert.equal(await page.locator('#preguntas details').first().evaluate(e=>e.open),true);
   assert.match(await page.locator('[data-copy="sourceFile"]').textContent(),lang==='en'?/employees.xlsx/:/personas.xlsx/);
   const text=await page.locator('body').innerText();assert.ok(!text.includes('undefined'));if(lang==='en')assert.ok(!/personas.xlsx|Episodios|Preguntas|Idioma/.test(text));
   const geometry=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(geometry.scroll<=width,JSON.stringify(geometry));
   assert.equal(await page.locator('#roadmap .roadmap-card').count(),4);
   assert.equal(await page.locator('.roadmap-note').count(),0);
   for(const key of ['plantilla','movimientos','ausencias']){
    await page.locator(`[data-area="${key}"]`).click();
    assert.equal(await page.locator('#demo-chart svg').count(),1);
    assert.ok(!(await page.locator('#demo-chart').innerHTML()).includes('NaN'));
   }
   assert.equal(await page.locator('#hero-chart svg').count(),1);
   const previewColour=await page.locator('.report-window').evaluate(e=>getComputedStyle(e).backgroundColor);
   assert.equal(previewColour,theme==='dark'?'rgb(30, 30, 30)':'rgb(250, 251, 248)');
   if(width===1280)assert.ok((await page.locator('.report-stage').boundingBox()).width<=540);
   await page.locator('nav a[href="#descarga"]').click();assert.equal(page.url(),url);
   const navBox=await page.locator('nav').boundingBox(),sectionBox=await page.locator('#descarga').boundingBox();
   assert.ok(Math.abs(navBox.y)<1,'Navigation stays at the top');assert.ok(sectionBox.y>=navBox.height,'Section clears sticky header');
   for(const card of await page.locator('#roadmap .roadmap-card').all())assert.ok(await card.evaluate(e=>e.scrollWidth<=e.clientWidth),'Roadmap card overflow');
   if((width===390||width===1280)&&lang==='es')await page.locator('#roadmap').screenshot({path:path.join(out,`roadmap-${width}-${theme}.png`)});
   if((width===390||width===1280)&&lang==='en'&&theme==='dark'){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,`english-${width}.png`),fullPage:true});await page.locator('.hero').screenshot({path:path.join(out,`hero-${width}.png`)});}
   cases++;
  }
  await page.reload();assert.equal(await page.locator('#language-select').inputValue(),'en');assert.equal(await page.locator('#theme-select').inputValue(),'dark');assert.equal(page.url(),url);
  await page.goto(url.replace('/?campaign=qa#demo','/en.html#demo'));await page.waitForURL(url.replace('/?campaign=qa#demo','/#demo'));assert.equal(await page.locator('html').getAttribute('lang'),'en');
  const cleanUrl=url.replace('#demo','');await page.goto(cleanUrl);
  for(const id of ['como','demo','roadmap']){await page.locator(`nav a[href="#${id}"]`).click();assert.equal(page.url(),cleanUrl);assert.equal(await page.evaluate(()=>document.activeElement.id),id);}
  await page.locator('nav .logo').click();assert.equal(page.url(),cleanUrl);assert.equal(await page.evaluate(()=>scrollY),0);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,cases,urlUnchanged:true,demoPreserved:true,preferencesPersisted:true,legacyLinkRedirected:true}));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
