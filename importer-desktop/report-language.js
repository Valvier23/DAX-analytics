const fs=require('node:fs'),path=require('node:path');
const translations=require('./report-translations.json');
const {language}=require('./locale');
const translate=(text,lang='en')=>language(lang)==='en'&&text!==''?(translations[text]??text):text;
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2));
function translateLiteral(property){
 const literal=property?.expr?.Literal;if(!literal||typeof literal.Value!=='string'||!literal.Value.startsWith("'"))return;
 const source=literal.Value.slice(1,-1).replaceAll("''","'");
 literal.Value="'"+translate(source).replaceAll("'","''")+"'";
}
function applyReportLanguage(projectDir,requestedLanguage='en'){
 const lang=language(requestedLanguage);if(lang==='es')return;
 const pages=path.join(projectDir,'People Analytics DAX Kit.Report/definition/pages');
 for(const id of read(path.join(pages,'pages.json')).pageOrder){
  const dir=path.join(pages,id),pageFile=path.join(dir,'page.json'),page=read(pageFile);
  page.displayName=translate(page.displayName);write(pageFile,page);
  for(const name of fs.readdirSync(path.join(dir,'visuals'))){
   const file=path.join(dir,'visuals',name,'visual.json');if(!fs.existsSync(file))continue;
   const doc=read(file),v=doc.visual;
   for(const title of v.visualContainerObjects?.title||[])translateLiteral(title.properties?.text);
   for(const header of v.objects?.header||[])translateLiteral(header.properties?.text);
   for(const general of v.objects?.general||[])for(const paragraph of general.properties?.paragraphs||[])for(const run of paragraph.textRuns||[])if(typeof run.value==='string')run.value=translate(run.value);
   for(const role of Object.values(v.query?.queryState||{}))for(const p of role.projections||[]){
    // Additional field labels belong to the user's workbook, never to the product dictionary.
    if(p.field?.Column?.Property?.startsWith('Extra_'))continue;
    const label=p.displayName||p.nativeQueryRef;if(label)p.displayName=translate(label);
   }
   write(file,doc);
  }
 }
 const modelDir=path.join(projectDir,'People Analytics DAX Kit.SemanticModel/definition');
 const modelFile=path.join(modelDir,'model.tmdl');fs.writeFileSync(modelFile,fs.readFileSync(modelFile,'utf8').replace(/^(\s*culture:) es-ES$/m,'$1 en-GB'));
 const textMeasures=new Set(['Contexto del periodo','Lectura ejecutiva','Lectura de calidad','Cobertura de ausencias']);
 const translateStrings=text=>text.replace(/"((?:[^"]|"")*)"/g,(whole,value)=>'"'+translate(value.replaceAll('""','"')).replaceAll('"','""')+'"');
 for(const table of ['Personas','BajasMedicas']){
  const file=path.join(modelDir,'tables',table+'.tmdl');let source=fs.readFileSync(file,'utf8');
  // Translate only named text measures; arithmetic, source queries and identifiers remain intact.
  source=source.replace(/(^\tmeasure '([^']+)'[^\n]*[\s\S]*?)(?=^\t(?:measure|column|partition) |$(?![\s\S]))/gm,(block,nameLine,name)=>textMeasures.has(name)?translateStrings(block):block);
  fs.writeFileSync(file,source);
 }
 const calendarFile=path.join(modelDir,'tables/Calendario.tmdl');
 fs.writeFileSync(calendarFile,fs.readFileSync(calendarFile,'utf8').replace('"MMM yy", "es-ES"','"MMM yy", "en-GB"').replace('"MMM" )','"MMM", "en-GB" )'));
 const ageFile=path.join(modelDir,'tables/TramosEdad.tmdl');
 if(fs.existsSync(ageFile)){
  // Only generated category values, not DATATABLE column identifiers.
  let age=fs.readFileSync(ageFile,'utf8');for(const value of ['Menos de 30','60 o más','Sin dato válido'])age=age.replaceAll('"'+value+'"','"'+translate(value)+'"');fs.writeFileSync(ageFile,age);
 }
}
module.exports={applyReportLanguage,translate};
