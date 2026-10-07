// Execute with the packaged Electron runtime in ELECTRON_RUN_AS_NODE=1 mode.
// This exercises the shipped ASAR and templates without opening the app or Power BI.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..'),resources=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
const asar=path.join(resources,'app.asar');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const evidence={runtime:process.versions.electron,packagedModules:[],templateFiles:0,scenarios:[]};
for(const name of ['main.js','core.js','report-project.js','report-period.js','report-metrics.js','preload.js','locale.js','report-language.js','report-translations.json','renderer/app.js','renderer/index.html','renderer/styles.css']){
 assert.equal(hash(path.join(asar,name)),hash(path.join(repo,'importer-desktop',name)),`Outdated packaged module: ${name}`);evidence.packagedModules.push(name);
}
for(const [kit,bundle] of [['kit-free','PowerBI'],['kit-plus','PowerBIPlus']]){
 const source=path.join(repo,kit,'PowerBI');for(const file of walk(source)){
  assert.equal(hash(file),hash(path.join(resources,bundle,path.relative(source,file))),`Outdated template: ${file}`);evidence.templateFiles++;
 }
}
const core=require(path.join(asar,'core.js')),{createPowerBiProject}=require(path.join(asar,'report-project.js'));
fs.mkdirSync(out,{recursive:true});
const workbook=path.join(repo,'kit-plus/datos-ejemplo/plantilla-avanzada-ejemplo.xlsx');
const config={inputPath:workbook,personasSheet:'Personas',personasMapping:Object.fromEntries(core.PERSONAS_FIELDS.map(f=>[f,f])),bajasSheet:'Bajas medicas',bajasMapping:Object.fromEntries(core.BAJAS_FIELDS.map(f=>[f,f]))};
for(const edition of ['demo','plus'])for(const reportLanguage of ['en','es']){
 const outputDir=fs.mkdtempSync(path.join(out,edition+'-'+reportLanguage+'-')),converted=core.convertWorkbook({...config,outputDir});
 const projectDir=path.join(outputDir,'PowerBI');
 const project=createPowerBiProject({templateDir:path.join(resources,edition==='plus'?'PowerBIPlus':'PowerBI'),projectDir,outputDir,edition,reportLanguage});
 core.applyPowerBiPalette(projectDir,{primary:'#157F73',secondary:'#386A9A'});
 const pages=JSON.parse(fs.readFileSync(path.join(projectDir,'People Analytics DAX Kit.Report/definition/pages/pages.json'))).pageOrder;
 assert.equal(converted.personas,1000);assert.equal(converted.bajas,540);assert.equal(converted.rejected,0);assert.equal(pages.length,edition==='plus'?14:1);
 for(const page of pages){const slicer=JSON.parse(fs.readFileSync(path.join(projectDir,'People Analytics DAX Kit.Report/definition/pages',page,'visuals/filterPeriodo/visual.json')));assert.ok(slicer.visual.objects.data[0].properties.startDate);}
 const firstPage=JSON.parse(fs.readFileSync(path.join(projectDir,'People Analytics DAX Kit.Report/definition/pages',pages[0],'page.json')));assert.match(firstPage.displayName,reportLanguage==='en'?/overview|summary/i:/Resumen/);
 evidence.scenarios.push({edition,reportLanguage,people:converted.personas,leaves:converted.bajas,pages:pages.length,project,powerBiOpened:false});
}
evidence.asarSha256=crypto.createHash('sha256').update(require('original-fs').readFileSync(asar)).digest('hex');evidence.passed=true;
fs.writeFileSync(path.join(out,'packaged-verification.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
