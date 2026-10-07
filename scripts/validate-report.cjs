const fs=require('node:fs'),path=require('node:path');
const Ajv=require('ajv'),formats=require('ajv-formats');
const repo=path.resolve(__dirname,'..');
const cache=JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,''));
const ajv=new Ajv({strict:false,allErrors:true,validateFormats:false,loadSchema:async url=>{if(!cache[url])throw Error(`Missing schema ${url}`);return cache[url];}});formats(ajv);
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
(async()=>{
 const results=[],validators=new Map();
 for(const base of [path.join(repo,'kit-free','PowerBI'),path.join(repo,'kit-plus','PowerBI'),...process.argv.slice(3).map(p=>path.resolve(p))]){
  const tables=path.join(base,'People Analytics DAX Kit.SemanticModel','definition','tables');
  const measures=new Set(),columns=new Set();
  for(const f of walk(tables).filter(f=>f.endsWith('.tmdl'))){const s=fs.readFileSync(f,'utf8'),table=s.match(/^table (.+)/)[1].trim().replaceAll("'",'');for(const match of s.matchAll(/^\t(measure|column) (?:'([^']+)'|([^\s=]+))/gm))(match[1]==='measure'?measures:columns).add(`${table}.${match[2]||match[3]}`);}
  for(const f of walk(path.join(base,'People Analytics DAX Kit.Report','definition')).filter(f=>f.endsWith('.json'))){
   const doc=JSON.parse(fs.readFileSync(f,'utf8'));
   if(doc.$schema){if(!validators.has(doc.$schema)){validators.set(doc.$schema,await ajv.compileAsync(cache[doc.$schema]));}const validate=validators.get(doc.$schema);if(!validate(doc))throw Error(path.relative(repo,f)+'\n'+JSON.stringify(validate.errors.slice(0,5),null,2));}
   if(doc.visual?.query?.queryState){for(const role of Object.values(doc.visual.query.queryState))for(const p of role.projections||[]){const field=p.field.Measure||p.field.Column;if(field){const ref=field.Expression.SourceRef.Entity+'.'+field.Property;if(!(p.field.Measure?measures:columns).has(ref))throw Error(`Campo inexistente ${ref}: ${f}`);}}}
   if(doc.position){const page=JSON.parse(fs.readFileSync(path.resolve(f,'../../../page.json'),'utf8'));const p=doc.position;if(p.x<0||p.y<0||p.x+p.width>page.width||p.y+p.height>page.height)throw Error(`Fuera del lienzo: ${f}`);}
   results.push(path.relative(repo,f));
  }
 }
 console.log(JSON.stringify({validFiles:results.length,schemas:validators.size,fieldReferences:'OK',bounds:'OK'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
