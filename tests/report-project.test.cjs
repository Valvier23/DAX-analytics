const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),XLSX=require('xlsx');
const core=require('../importer-desktop/core');
const templateDir=path.resolve(__dirname,'../kit-plus/PowerBI');
function input(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'axzify-project-'));
 const rows=Array.from({length:10},(_,i)=>({PersonaID:String(i),FechaAlta:'2024-01-01',Desempeño:i<8?' 4,5 ':'Pendiente',Potencial:i+1}));
 const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(rows),'Personas');
 const inputPath=path.join(root,'input.xlsx');XLSX.writeFile(workbook,inputPath);
 const outputDir=path.join(root,'datos');core.convertWorkbook({inputPath,personasSheet:'Personas',personasMapping:{PersonaID:'PersonaID',FechaAlta:'FechaAlta'},bajasMapping:{},outputDir});
 return {root,outputDir};
}
test('campo mixto conserva números decimales válidos y deja texto inválido en blanco',()=>{
 const {outputDir}=input(),profile=JSON.parse(fs.readFileSync(path.join(outputDir,'perfil_dataset.json')));
 const field=profile.fields.find(f=>f.label==='Desempeño');assert.equal(field.type,'number');assert.equal(field.validCoverage,80);assert.equal(field.invalidCount,2);
 const book=XLSX.readFile(path.join(outputDir,'personas.csv'),{raw:true});const rows=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{raw:false,defval:''});
 assert.equal(rows[0][field.name],'4.5');assert.equal(rows[8][field.name],'');
});
test('generación sin Electron conserva los campos, filtros, corte y formato',()=>{
 const {createPowerBiProject}=require('../importer-desktop/report-project');
 const {root,outputDir}=input(),projectDir=path.join(root,'BI');
 fs.writeFileSync(path.join(outputDir,'periodo_informe.json'),JSON.stringify({startDate:'2025-01-01',endDate:'2025-12-31'}));
 createPowerBiProject({templateDir,projectDir,outputDir,edition:'plus'});
 const pagesDir=path.join(projectDir,'People Analytics DAX Kit.Report/definition/pages');
 const pages=JSON.parse(fs.readFileSync(path.join(pagesDir,'pages.json')));assert.equal(pages.pageOrder.length,10);
 const dir=path.join(pagesDir,'auto-talento'),visual=name=>JSON.parse(fs.readFileSync(path.join(dir,'visuals',name,'visual.json')));
 const definition=JSON.parse(fs.readFileSync(path.join(dir,'page.json')));
 assert.equal(definition.width/definition.height,16/9);
 const generated=fs.readdirSync(path.join(dir,'visuals')).map(visual);
 for(const v of generated){const p=v.position;
  assert.ok(p.x+p.width<=definition.width-32&&p.y+p.height<=definition.height-24,`${v.name}: margen del lienzo`);
  assert.equal(v.visual.visualContainerObjects.visualHeader[0].properties.show.expr.Literal.Value,'false');
  for(const other of generated){if(v===other)continue;const q=other.position;assert.ok(!(p.x<q.x+q.width&&p.x+p.width>q.x&&p.y<q.y+q.height&&p.y+p.height>q.y),`${v.name} solapa ${other.name}`);}
 }
 assert.equal(visual('detail').visual.visualType,'tableEx');
 const labels=visual('detail').visual.query.queryState.Values.projections.map(p=>p.displayName);
 assert.ok(labels.includes('Desempeño'));assert.ok(labels.includes('Potencial'));
 assert.equal(visual('detail').filterConfig.filters[0].field.Measure.Property,'Plantilla al cierre');
 assert.equal(visual('detail').filterConfig.filters[0].filter.Where[0].Condition.Comparison.ComparisonKind,1);
 assert.equal(visual('filterPeriodo').visual.objects.data[0].properties.endDate.expr.Literal.Value,"datetime'2025-12-31T00:00:00'");
 assert.equal(visual('filterDepartamento').visual.syncGroup.groupName,'PeopleAnalytics_Departamento');
 const model=fs.readFileSync(path.join(projectDir,'People Analytics DAX Kit.SemanticModel/definition/tables/Personas.tmdl'),'utf8');
 assert.match(model,/column Extra_desempeno[\s\S]*?summarizeBy: none/);
 assert.ok(model.includes(path.join(outputDir,'personas.csv')));
 assert.throws(()=>createPowerBiProject({templateDir,projectDir,outputDir,edition:'plus'}),/vacía|empty/);
});
test('el generador sin pantalla crea proyectos separados y no requiere Electron',()=>{
 const {generate}=require('../importer-desktop/generate-report.cjs');
 const {root}=input();
 const config={inputPath:path.join(root,'input.xlsx'),outputDir:path.join(root,'sin-pantalla'),edition:'plus',personasSheet:'Personas',personasMapping:{PersonaID:'PersonaID',FechaAlta:'FechaAlta'},bajasMapping:{}};
 const first=generate(config),second=generate(config);
 assert.equal(first.powerBiOpened,false);assert.equal(second.powerBiOpened,false);
 assert.notEqual(first.project,second.project);assert.ok(fs.existsSync(first.project));assert.ok(fs.existsSync(second.project));
 assert.ok(!Object.keys(require.cache).some(file=>/[\\/]electron[\\/]/.test(file)));
});
test('sin campos adicionales conserva las nueve páginas y no añade columnas',()=>{
 const {createPowerBiProject}=require('../importer-desktop/report-project');
 const {root,outputDir}=input();fs.writeFileSync(path.join(outputDir,'perfil_dataset.json'),JSON.stringify({fields:[],pages:[]}));
 const projectDir=path.join(root,'sin-extras');createPowerBiProject({templateDir,projectDir,outputDir,edition:'plus'});
 const metadata=JSON.parse(fs.readFileSync(path.join(projectDir,'People Analytics DAX Kit.Report/definition/pages/pages.json')));
 assert.equal(metadata.pageOrder.length,9);
 const model=fs.readFileSync(path.join(projectDir,'People Analytics DAX Kit.SemanticModel/definition/tables/Personas.tmdl'),'utf8');
 assert.ok(!model.includes('column Extra_'));
});
