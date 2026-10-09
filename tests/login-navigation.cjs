const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../docs');
async function run(){
 const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(error,content)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'})[path.extname(file)]||'text/plain');res.end(content);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.DASHBOARD_BROWSER_PATH?{executablePath:process.env.DASHBOARD_BROWSER_PATH}:{})});
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
  for(const width of [320,375,768,1280]){
   await page.setViewportSize({width,height:900});
   for(const lang of ['es','en']){
    await page.selectOption('#language-select',lang);
    const link=page.locator('nav a[href="cuenta.html"]');
    assert.equal(await link.isVisible(),true,'Account link must be visible at '+width+'px in '+lang);
    const box=await link.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width,'Account link must fit viewport');
    assert.equal(await page.locator('nav').evaluate(n=>n.scrollWidth<=n.clientWidth),true,'Navigation must not overflow at '+width+'px');
   }
  }
  console.log('PASS: login link visible and navigation fits 320, 375, 768 and 1280px in both languages');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
