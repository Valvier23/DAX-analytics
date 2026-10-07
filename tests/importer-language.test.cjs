const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('las preferencias de idioma son independientes y empiezan en inglés',()=>{
 const locale=require('../importer-desktop/locale');
 assert.equal(locale.language(), 'en');assert.equal(locale.language('es'),'es');
 assert.equal(locale.t('Seleccionar Excel','en'),'Choose Excel');assert.equal(locale.t('Seleccionar Excel','es'),'Seleccionar Excel');
 assert.equal(locale.t('PersonaID','en'),'Employee ID');
});
test('informes ES y EN conservan datos y referencias, con textos nativos y páginas adicionales',()=>{
 const {createPowerBiProject}=require('../importer-desktop/report-project');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'axzify-language-'));
 const outputDir=path.join(root,'data');fs.mkdirSync(outputDir);
 const profile={fields:[{name:'Extra_rendimiento',label:'Rotación por departamento',type:'number',coverage:80}],pages:[{key:'talento',title:'Talento y desempeño',fields:[{name:'Extra_rendimiento',label:'Rotación por departamento',type:'number',coverage:80}]}]};
 fs.writeFileSync(path.join(outputDir,'perfil_dataset.json'),JSON.stringify(profile));
 fs.writeFileSync(path.join(outputDir,'periodo_informe.json'),JSON.stringify({startDate:'2025-01-01',endDate:'2025-12-31'}));
 const models=[];
 for(const reportLanguage of ['en','es']){
  const projectDir=path.join(root,reportLanguage);createPowerBiProject({templateDir:path.resolve('kit-plus/PowerBI'),projectDir,outputDir,edition:'plus',reportLanguage});
  const pages=path.join(projectDir,'People Analytics DAX Kit.Report/definition/pages'),read=p=>JSON.parse(fs.readFileSync(path.join(pages,p),'utf8'));
  assert.equal(read('resumen/page.json').displayName,reportLanguage==='en'?'01 · Executive summary':'01 · Resumen ejecutivo');
  const kpi=read('resumen/visuals/kpi0/visual.json');assert.equal(kpi.visual.query.queryState.Values.projections[0].field.Measure.Property,'Plantilla al cierre');
  assert.equal(read('auto-talento/page.json').displayName,reportLanguage==='en'?'Talent and performance':'Talento y desempeño');
  const detail=read('auto-talento/visuals/detail/visual.json');assert.ok(detail.visual.query.queryState.Values.projections.some(p=>p.field?.Column?.Property==='Extra_rendimiento'&&p.displayName==='Rotación por departamento'));
  const model=fs.readFileSync(path.join(projectDir,'People Analytics DAX Kit.SemanticModel/definition/tables/Personas.tmdl'),'utf8');
  models.push(model);assert.ok(model.includes(path.join(outputDir,'personas.csv')));assert.ok(model.includes("measure 'Plantilla al cierre'"));
  if(reportLanguage==='en'){assert.ok(model.includes('PERIOD'));assert.ok(!model.includes('Varios / todos los departamentos'));assert.ok(model.includes('Personas[Sexo] <> ""')); }
 }
 assert.equal(models[0].slice(models[0].indexOf('\tpartition Personas')),models[1].slice(models[1].indexOf('\tpartition Personas')));
});
