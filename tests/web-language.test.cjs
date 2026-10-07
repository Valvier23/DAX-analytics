const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const copyModule={exports:{}};vm.runInNewContext(fs.readFileSync('docs/site-copy.js','utf8'),{module:copyModule});const copy=copyModule.exports;
const html=fs.readFileSync('docs/index.html','utf8');
function runtime(saved=null,blocked=false){
 const events={},nodes=[...html.matchAll(/data-copy="([^"]+)"/g)].map(m=>({dataset:{copy:m[1]},innerHTML:''})),aria=[...html.matchAll(/data-copy-aria="([^"]+)"/g)].map(m=>({dataset:{copyAria:m[1]},setAttribute(n,v){this[n]=v}})),months=Array.from({length:6},(_,i)=>({dataset:{monthIndex:String(i)}})),selector={value:'',addEventListener:(n,fn)=>events[n]=fn},writes=[];
 const document={documentElement:{lang:'es'},getElementById:()=>selector,querySelector:()=>({setAttribute(){}}),querySelectorAll:q=>q==='[data-copy]'?nodes:q==='[data-copy-aria]'?aria:months};
 const window={AxzifyCopy:copy,AxzifyDemo:{refresh(){}},localStorage:{getItem:()=>{if(blocked)throw Error('blocked');return saved},setItem:(k,v)=>{if(blocked)throw Error('blocked');writes.push(v)}},addEventListener:(n,f)=>events[n]=f};
 Object.defineProperty(window,'location',{get(){throw Error('Language switch must not read or modify the URL')}});
 vm.runInNewContext(fs.readFileSync('docs/language.js','utf8'),{document,window});
 return {document,nodes,aria,months,writes,change:value=>{selector.value=value;events.change()},storage:value=>events.storage({key:'axzify-language',newValue:value})};
}
 test('español principal, inglés segundo y diccionarios completos',()=>{
  assert.ok(html.includes('<html lang="es">'));assert.ok(html.indexOf('option value="es"')<html.indexOf('option value="en"'));
  assert.deepEqual(Object.keys(copy.es).sort(),Object.keys(copy.en).sort());
  for(const lang of ['es','en'])for(const m of html.matchAll(/data-copy(?:-aria)?="([^"]+)"/g))assert.equal(typeof copy[lang][m[1]],'string',`${lang}/${m[1]}`);
  assert.ok(copy.en.sourceFile.includes('employees.xlsx'));assert.ok(!copy.en.sourceFile.includes('personas.xlsx'));
  assert.ok(!html.includes('href="en.html"'));assert.ok(html.includes('id="theme-select"'));
 });
 test('cambia todo el texto sin navegar y recuerda la elección',()=>{
  const r=runtime();assert.equal(r.document.documentElement.lang,'es');r.change('en');assert.equal(r.document.documentElement.lang,'en');assert.deepEqual(r.writes,['en']);
  assert.equal(r.nodes.find(n=>n.dataset.copy==='sourceFile').innerHTML,'▦ employees.xlsx');assert.equal(r.months[0].textContent,'Jan');
  assert.equal(r.document.title,copy.en.title);r.change('es');assert.equal(r.nodes.find(n=>n.dataset.copy==='sourceFile').innerHTML,'▦ personas.xlsx');
  assert.equal(runtime('en').document.documentElement.lang,'en');
 });
 test('sin almacenamiento funciona y sincroniza otras pestañas',()=>{const r=runtime(null,true);r.change('en');assert.equal(r.document.documentElement.lang,'en');r.storage('es');assert.equal(r.document.documentElement.lang,'es');});
