// Isolated, headless DOM test; never connects to an existing browser or opens Power BI.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1080,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.requests=[];
   window.peopleAnalytics={
    listProfiles:async()=>['Mi perfil original'],chooseFile:async()=>'/fixture.xlsx',
    analyze:async()=>({fileName:'Original.xlsx',filePath:'/fixture.xlsx',sheets:[{name:'Empleados',rowCount:2,headers:['ID original','Ingreso original','Departamento original','Otro campo']},{name:'Bajas',rowCount:1,headers:['Episodio','Persona','Inicio']}],guesses:{Empleados:{personas:{PersonaID:'ID original',FechaAlta:'Ingreso original',Departamento:'Departamento original'}},Bajas:{bajas:{EpisodioID:'Episodio',PersonaID:'Persona',FechaInicio:'Inicio'}}}}),
    convert:async config=>{window.requests.push(config);return {personas:2,bajas:1,rejected:0,outputDir:'/test-output',dynamicPages:['Talento y desempeño'],powerBiOpened:true}},
    saveProfile:async()=>{},loadProfile:async()=>({personasSheet:'Empleados',bajasSheet:'Bajas',personasMapping:{PersonaID:'ID original',FechaAlta:'Ingreso original',Departamento:'Otro campo'},bajasMapping:{EpisodioID:'Episodio',PersonaID:'Persona',FechaInicio:'Inicio'},colors:{primary:'#123456',secondary:'#654321'}})
   };
  });
  const url=pathToFileURL(path.resolve('importer-desktop/renderer/index.html')).href;
  await page.goto(url);assert.equal(await page.locator('#appLanguage').inputValue(),'en');assert.equal(await page.locator('#reportLanguage').inputValue(),'en');
  assert.equal(await page.locator('h1').textContent(),'Excel importer');
  await page.locator('#chooseButton').click();await page.locator('#workspace:not(.hidden)').waitFor();
  await page.locator('#personasFields [data-field="Departamento"]').selectOption('Otro campo');
  await page.locator('#profileSelect').selectOption('Mi perfil original');
  await page.waitForFunction(()=>document.getElementById('secondaryColor').value==='#654321');
  await page.locator('#primaryColor').fill('#123456');
  const out=path.resolve('outputs/importer-languages');fs.mkdirSync(out,{recursive:true});
  for(const appLanguage of ['es','en'])for(const reportLanguage of ['es','en']){
   await page.locator('#appLanguage').selectOption(appLanguage);await page.locator('#reportLanguage').selectOption(reportLanguage);
   assert.equal(await page.locator('#personasFields [data-field="Departamento"]').inputValue(),'Otro campo');
   assert.equal(await page.locator('#profileSelect').inputValue(),'Mi perfil original');assert.equal(await page.locator('#primaryColor').inputValue(),'#123456');
   assert.equal(await page.locator('#fileName').textContent(),'Original.xlsx');
   assert.equal(await page.locator('#personasSheet').inputValue(),'Empleados');
   assert.equal(await page.locator('h1').textContent(),appLanguage==='en'?'Excel importer':'Importador de Excel');
   await page.locator('#plusButton').click();await page.waitForFunction(()=>!document.getElementById('plusButton').disabled);
   const last=await page.evaluate(()=>window.requests.at(-1));assert.equal(last.appLanguage,appLanguage);assert.equal(last.reportLanguage,reportLanguage);
   assert.equal(last.personasMapping.Departamento,'Otro campo');
   assert.match(await page.locator('#status').textContent(),appLanguage==='en'?/^Done:/:/^Listo:/);
  }
  await page.screenshot({path:path.join(out,'app-en.png'),fullPage:true});
  await page.reload();assert.equal(await page.locator('#appLanguage').inputValue(),'en');assert.equal(await page.locator('#reportLanguage').inputValue(),'en');
  await page.locator('#appLanguage').selectOption('es');await page.locator('#reportLanguage').selectOption('en');await page.reload();
  assert.equal(await page.locator('#appLanguage').inputValue(),'es');assert.equal(await page.locator('#reportLanguage').inputValue(),'en');
  await page.screenshot({path:path.join(out,'app-es.png'),fullPage:true});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,languageCombinations:4,mappingsPreserved:true,preferencesPersisted:true,powerBiOpened:false,headless:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
