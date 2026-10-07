const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('español principal e inglés segundo, con textos y metadatos propios',()=>{
 for(const [file,lang,title] of [['index.html','es','Tu plantilla.'],['en.html','en','Your people.']]){
  const html=fs.readFileSync('docs/'+file,'utf8');
  assert.ok(html.includes(`<html lang="${lang}">`));assert.ok(html.includes(title));
  assert.ok(html.indexOf('option value="es"')<html.indexOf('option value="en"'));
  assert.ok(html.includes(`value="${lang}" lang="${lang}" selected`));
  assert.ok(html.includes('src="language.js?'));assert.ok(html.includes('hreflang="en"'));assert.ok(html.includes('hreflang="es"'));
  assert.ok(html.includes('id="theme-select"'));
 }
 const en=fs.readFileSync('docs/en.html','utf8');
 for(const leftover of ['Resumen de plantilla','Episodios iniciados','Cómo funciona','Datos de origen','Personas activas','es-ES'])assert.ok(!en.includes(leftover),leftover);
 assert.ok(en.includes('Choose English or Spanish independently'));
});
test('el selector abre la versión elegida conservando la sección',()=>{
 for(const current of ['es','en']){
  let change,target;const selector={value:'',addEventListener:(name,fn)=>{change=fn}};
  vm.runInNewContext(fs.readFileSync('docs/language.js','utf8'),{document:{documentElement:{lang:current},getElementById:()=>selector},window:{location:{hash:'#demo',assign:value=>{target=value}}}});
  assert.equal(selector.value,current);selector.value=current==='es'?'en':'es';change();assert.equal(target,current==='es'?'en.html#demo':'index.html#demo');
 }
});
