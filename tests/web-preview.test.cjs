const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const load=file=>{const module={exports:{}};vm.runInNewContext(fs.readFileSync(file,'utf8'),{module});return module.exports;};
const {data,chart}=load('docs/report-preview.js'),copy=load('docs/site-copy.js');
test('fictional headcount reconciles with monthly joiners and leavers and team totals',()=>{
 let previous=data.start;
 data.plantilla.forEach((end,i)=>{assert.equal(previous+data.movimientos[i]-data.leavers[i],end);previous=end;});
 assert.equal(data.departments.reduce((a,b)=>a+b,0),previous);
 for(const lang of ['es','en']){
  const areas=copy[lang].areas;
  assert.equal(Number(areas.plantilla.kpis[1][1]),data.start);
  assert.equal(Number(areas.plantilla.kpis[2][1]),previous-data.start);
  assert.equal(Number(areas.movimientos.kpis[0][1]),data.movimientos.reduce((a,b)=>a+b,0));
  assert.equal(Number(areas.movimientos.kpis[1][1]),data.leavers.reduce((a,b)=>a+b,0));
  assert.equal(Number(areas.ausencias.kpis[0][1]),data.ausencias.reduce((a,b)=>a+b,0));
 }
});
test('every illustrative chart has a labelled zero baseline and all six months',()=>{
 for(const key of ['plantilla','movimientos','ausencias']){
  const svg=chart(key,copy.en.shortMonths);assert.match(svg,/>0<\/text>/);
  for(const month of copy.en.shortMonths)assert.ok(svg.includes('>'+month+'</text>'));
  assert.ok(!svg.includes('NaN'));
 }
});
