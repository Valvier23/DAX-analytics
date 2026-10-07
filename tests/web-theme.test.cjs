const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function browser({saved=null,dark=false,blocked=false}={}){
 const events={},mediaEvents={},selectionEvents={},attrs={},writes=[];
 const select={value:'',addEventListener:(n,f)=>selectionEvents[n]=f};
 const media={matches:dark,addEventListener:(n,f)=>mediaEvents[n]=f};
 const context={document:{documentElement:{setAttribute:(n,v)=>attrs[n]=v},getElementById:()=>select,addEventListener:(n,f)=>events[n]=f},window:{matchMedia:()=>media,addEventListener:(n,f)=>events[n]=f,localStorage:{getItem:()=>{if(blocked)throw Error('blocked');return saved},setItem:(k,v)=>{if(blocked)throw Error('blocked');writes.push(v)}}}};
 vm.runInNewContext(fs.readFileSync('docs/theme.js','utf8'),context);events.DOMContentLoaded();
 return {attrs,select,writes,change:value=>{select.value=value;selectionEvents.change()},system:value=>{media.matches=value;mediaEvents.change()},storage:value=>events.storage({key:'axzify-theme',newValue:value})};
}
test('primera visita sigue el sistema y sus cambios',()=>{const b=browser({dark:true});assert.equal(b.attrs['data-theme'],'dark');assert.equal(b.select.value,'system');b.system(false);assert.equal(b.attrs['data-theme'],'light');});
test('elección manual persiste, prevalece y permite volver al sistema',()=>{const b=browser({saved:'light',dark:true});assert.equal(b.attrs['data-theme'],'light');b.change('dark');assert.deepEqual(b.writes,['dark']);b.system(false);assert.equal(b.attrs['data-theme'],'dark');b.change('system');assert.equal(b.attrs['data-theme'],'light');});
test('almacenamiento bloqueado o inválido no impide cambiar tema',()=>{const b=browser({blocked:true,dark:true});b.change('light');assert.equal(b.attrs['data-theme'],'light');assert.equal(browser({saved:'invalid',dark:true}).attrs['data-theme'],'dark');});
test('sincroniza la preferencia entre pestañas',()=>{const b=browser();b.storage('dark');assert.equal(b.select.value,'dark');assert.equal(b.attrs['data-theme'],'dark');});
test('la página publicada carga el tema antes del contenido y ofrece un selector etiquetado',()=>{
 const html=fs.readFileSync('docs/index.html','utf8');
 assert.ok(html.indexOf('src="theme.js?')<html.indexOf('<body'));
 assert.match(html,/href="theme.css\?/);
 assert.match(html,/label class="theme-control" for="theme-select"/);
 for(const value of ['system','light','dark'])assert.match(html,new RegExp(`<option\\b[^>]*value="${value}"`));
});
