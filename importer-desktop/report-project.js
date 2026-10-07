const fs=require('node:fs'),path=require('node:path');
const {applyReportPeriod}=require('./report-period');
const {applyReportLanguage}=require('./report-language');
const {language}=require('./locale');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const write=(file,doc)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(doc,null,2));};
const literal=value=>({expr:{Literal:{Value:String(value)}}});
const column=name=>({Column:{Expression:{SourceRef:{Entity:'Personas'}},Property:name}});
function setText(visual,value){visual.visual.objects.general[0].properties.paragraphs[0].textRuns[0].value=value;return visual;}
function applyDynamicPeoplePages(projectDir,profile,reportLanguage='en'){
 const fields=profile.fields||[],pages=profile.pages||[];
 for(const field of fields)if(!/^Extra_[a-z0-9_]+$/i.test(field.name)||!['number','text'].includes(field.type))throw Error('Campo adicional inválido');
 for(const page of pages)if(!/^[a-z0-9_-]+$/i.test(page.key)||!page.fields?.length||page.fields.some(f=>!fields.some(known=>known.name===f.name)))throw Error('Página adicional inválida');
 const peoplePath=path.join(projectDir,'People Analytics DAX Kit.SemanticModel/definition/tables/Personas.tmdl');
 if(fields.length){
  let model=fs.readFileSync(peoplePath,'utf8');
  const columns=fields.map(f=>`\n\tcolumn ${f.name}\n\t\tdataType: ${f.type==='number'?'double':'string'}\n\t\tsourceColumn: ${f.name}\n\t\tsummarizeBy: none\n`).join('');
  model=model.replace('\n\tpartition Personas = m',columns+'\n\tpartition Personas = m').replace('Columns=19',`Columns=${19+fields.length}`);
  const types=fields.map(f=>`{"${f.name}", ${f.type==='number'?'type number':'type text'}}`).join(',');
  model=model.replace('{"JornadaSemanal", Int64.Type}}, "en-US")',`{"JornadaSemanal", Int64.Type},${types}}, "en-US")`);
  fs.writeFileSync(peoplePath,model);
 }
 const pagesDir=path.join(projectDir,'People Analytics DAX Kit.Report/definition/pages'),metadataPath=path.join(pagesDir,'pages.json'),metadata=read(metadataPath);
 const base=path.join(pagesDir,metadata.pageOrder[0]);
 const baseVisual=name=>read(path.join(base,'visuals',name,'visual.json'));
 for(const page of pages){
  const name='auto-'+page.key,dir=path.join(pagesDir,name),definition={...read(path.join(base,'page.json')),name,displayName:page.title};write(path.join(dir,'page.json'),definition);
  const visuals=['brand','headerTitle','headerSubtitle','periodHint','filterPeriodo','filterDepartamento','filterPuesto','periodContext'].map(baseVisual);
  setText(visuals.find(v=>v.name==='headerTitle'),page.title);
  setText(visuals.find(v=>v.name==='headerSubtitle'),'Detalle de campos adicionales · Personas activas al cierre del periodo seleccionado.');
  const kpi=baseVisual('kpi0');visuals.push(kpi);
  const note=baseVisual('methodology');setText(note,'Valores del archivo actual; no acreditan evolución histórica. Campos numéricos sin suma automática.');visuals.push(note);
  const coverage=baseVisual('headerSubtitle');coverage.name='importCoverage';Object.assign(coverage.position,{x:426,y:180,width:1134,height:84});
  const coverages=page.fields.map(f=>f.validCoverage??f.coverage),invalid=page.fields.reduce((sum,f)=>sum+(f.invalidCount||0),0);
  const minimum=Math.min(...coverages),maximum=Math.max(...coverages),range=minimum===maximum?`${minimum}%`:`entre ${minimum}% y ${maximum}%`;
  const fieldCount=page.fields.length===1?'1 campo adicional':`${page.fields.length} campos adicionales`;
  setText(coverage,language(reportLanguage)==='en'
    ? `${page.fields.length} additional field${page.fields.length===1?'':'s'} · Valid coverage at import: ${minimum===maximum?minimum+'%':'between '+minimum+'% and '+maximum+'%'}. Unfiltered.\n${invalid} non-numeric values were left blank. Check each field’s scale and meaning before comparing.`
    : `${fieldCount} · Cobertura válida al importar: ${range}. Sin filtros.\n${invalid} valores no numéricos se han dejado en blanco. Revisa la escala y el significado de cada campo antes de comparar.`);visuals.push(coverage);
  const detail=baseVisual('detail');Object.assign(detail.position,{y:296,height:520});
  detail.visual.visualContainerObjects.title[0].properties.text=literal("'Detalle de personas activas al cierre'");
  const cols=[{name:'Departamento',label:'Departamento'},{name:'PuestoTrabajo',label:'Puesto'},...page.fields,{name:'PersonaID',label:'ID persona'}];
  detail.visual.query.queryState.Values.projections=cols.map(f=>({field:column(f.name),queryRef:`Personas.${f.name}`,nativeQueryRef:f.name,displayName:f.label}));
  delete detail.visual.query.sortDefinition;
  detail.visual.objects.columnWidth=cols.map(f=>({selector:{metadata:`Personas.${f.name}`},properties:{value:literal(Math.max(180,Math.floor((detail.position.width-52)/cols.length))+'D')}}));
  detail.filterConfig={filters:[{name:'SoloActivosAlCierre',type:'Advanced',field:{Measure:{Expression:{SourceRef:{Entity:'Personas'}},Property:'Plantilla al cierre'}},filter:{Version:2,From:[{Name:'p',Entity:'Personas',Type:0}],Where:[{Condition:{Comparison:{ComparisonKind:1,Left:{Measure:{Expression:{SourceRef:{Source:'p'}},Property:'Plantilla al cierre'}},Right:{Literal:{Value:'0L'}}}}}]}}]};
  visuals.push(detail);
  for(const visual of visuals)write(path.join(dir,'visuals',visual.name,'visual.json'),visual);
  metadata.pageOrder.push(name);
 }
 write(metadataPath,metadata);
}
function createPowerBiProject({templateDir,projectDir,outputDir,edition='demo',reportLanguage='en'}){
 if(fs.existsSync(projectDir)&&fs.readdirSync(projectDir).length)throw Error('La carpeta del proyecto debe estar vacía para conservar informes existentes.');
 const pbip='People Analytics DAX Kit.pbip';if(!fs.existsSync(path.join(templateDir,pbip)))throw Error('No se encuentra la plantilla Power BI.');
 fs.cpSync(templateDir,projectDir,{recursive:true,filter:source=>!source.split(path.sep).some(p=>p==='.pbi'||p==='.git')});
 const sources=[['Personas','personas.csv'],['BajasMedicas','bajas_medicas.csv'],...(edition==='plus'?[['Insights','insights.csv']]:[])];
 for(const [table,csv] of sources){
  const file=path.join(projectDir,'People Analytics DAX Kit.SemanticModel/definition/tables',table+'.tmdl');
  const csvPath=path.join(path.resolve(outputDir),csv).replaceAll('"','""');
  fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/File\.Contents\("[^"]+"\)/g,()=>`File.Contents("${csvPath}")`));
 }
 const profilePath=path.join(outputDir,'perfil_dataset.json');if(edition==='plus'&&fs.existsSync(profilePath))applyDynamicPeoplePages(projectDir,read(profilePath),reportLanguage);
 const periodPath=path.join(outputDir,'periodo_informe.json');if(fs.existsSync(periodPath)){const p=read(periodPath);applyReportPeriod(projectDir,p.startDate,p.endDate);}
 applyReportLanguage(projectDir,reportLanguage);
 return path.join(projectDir,pbip);
}
module.exports={createPowerBiProject};
