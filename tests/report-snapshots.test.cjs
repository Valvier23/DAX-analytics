const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {generateInsights,generateKpiCatalog}=require('../importer-desktop/core.js');
const {applyPowerBiPalette}=require('../importer-desktop/core.js');
const {applyReportPeriod}=require('../importer-desktop/report-period.js');
const people=[{PersonaID:'A',FechaAlta:'2024-01-01',Departamento:'Uno',SalarioAnual:'60000'}, {PersonaID:'B',FechaAlta:'2024-01-01',FechaBajaEmpresa:'2025-01-03',Departamento:'Dos',SalarioAnual:'30000'}, {PersonaID:'C',FechaAlta:'2024-01-01',Departamento:'Uno',SalarioAnual:''}];
test('catálogo excluye salario vacío y personas que ya salieron',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'axzify-snapshot-'));
 const rows=generateKpiCatalog(people,[],dir).rows;
 assert.equal(rows.find(r=>r.KPIID==='KPI-005').ValorActual,60000);
});
test('insights no inventan confianza estadística y declaran ventana',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'axzify-snapshot-'));
 const rows=generateInsights(people,[],dir).rows;
 assert.ok(rows.every(r=>r.Confianza===''));
 assert.ok(rows.every(r=>r.Periodo.includes('2025-01-01')&&r.Periodo.includes('2025-01-03')));
});
test('paleta personalizada alcanza los nuevos visuales y expresiones literales',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'axzify-palette-'));
 fs.cpSync(path.resolve(__dirname,'../kit-free/PowerBI'),dir,{recursive:true});
 applyPowerBiPalette(dir,{primary:'#E8590C',secondary:'#5F3DC4'});
 const content=fs.readFileSync(path.join(dir,'People Analytics DAX Kit.Report/definition/pages/plantilla/visuals/deptRotacion/visual.json'),'utf8');
 assert.ok(content.includes('#5F3DC4'));assert.ok(!content.includes('#386A9A'));
});
test('el periodo importado coincide en filtro DAX y casillas visibles de todas las páginas',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'axzify-period-'));
 fs.cpSync(path.resolve(__dirname,'../kit-plus/PowerBI'),dir,{recursive:true});
 applyReportPeriod(dir,'2026-01-01','2026-03-31');
 const pagesDir=path.join(dir,'People Analytics DAX Kit.Report/definition/pages');
 for(const page of JSON.parse(fs.readFileSync(path.join(pagesDir,'pages.json'),'utf8')).pageOrder){
  const objects=JSON.parse(fs.readFileSync(path.join(pagesDir,page,'visuals/filterPeriodo/visual.json'),'utf8')).visual.objects;
  const filter=objects.general[0].properties.filter.filter.Where[0].Condition.Between;
  assert.equal(filter.LowerBound.Literal.Value,"datetime'2026-01-01T00:00:00'");
  assert.equal(filter.UpperBound.Literal.Value,"datetime'2026-03-31T00:00:00'");
  assert.equal(objects.data[0].properties.startDate.expr.Literal.Value,filter.LowerBound.Literal.Value);
  assert.equal(objects.data[0].properties.endDate.expr.Literal.Value,filter.UpperBound.Literal.Value);
 }
});
