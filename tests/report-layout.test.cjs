const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
for(const kit of ['kit-free','kit-plus'])test(`${kit}: composición panorámica sin solapes ni cabeceras de presentación`,()=>{
 const root=path.resolve(__dirname,'..',kit,'PowerBI/People Analytics DAX Kit.Report/definition/pages');
 for(const id of read(path.join(root,'pages.json')).pageOrder){
  const dir=path.join(root,id),page=read(path.join(dir,'page.json'));
  assert.equal(page.width/page.height,16/9,`${id}: formato de pantalla`);
  const visuals=fs.readdirSync(path.join(dir,'visuals')).flatMap(n=>{const p=path.join(dir,'visuals',n,'visual.json');return fs.existsSync(p)?[read(p)]:[];});
  for(const v of visuals){
   assert.equal(v.visual.visualContainerObjects.visualHeader[0].properties.show.expr.Literal.Value,'false',`${id}/${v.name}: cabecera`);
   const p=v.position;assert.ok(p.x>=32&&p.x+p.width<=page.width-32&&p.y+p.height<=page.height-24,`${id}/${v.name}: margen`);
   for(const other of visuals){if(other===v)continue;const q=other.position;assert.ok(!(p.x<q.x+q.width&&p.x+p.width>q.x&&p.y<q.y+q.height&&p.y+p.height>q.y),`${id}: ${v.name} solapa ${other.name}`);}
  }
  assert.ok(visuals.find(v=>v.name==='kpi0').position.height<=96,'Tarjetas compactas');
 }
});
