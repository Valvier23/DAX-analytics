// Build an isolated, local review project without touching an open Desktop instance.
const fs=require('node:fs'),path=require('node:path'),XLSX=require('xlsx');
const {generateInsights}=require('../importer-desktop/core.js');
const repo=path.resolve(__dirname,'..'),outputRoot=path.join(repo,'outputs');
const destination=path.resolve(outputRoot,process.argv[2]||'Informe-RRHH-final');
if(!destination.startsWith(outputRoot+path.sep)||fs.existsSync(destination))throw Error('Usa una carpeta nueva dentro de outputs.');
const dataDir=path.join(destination,'Datos'),projectDir=path.join(destination,'PowerBI');
fs.mkdirSync(dataDir,{recursive:true});
for(const name of ['personas.csv','bajas_medicas.csv'])fs.copyFileSync(path.join(repo,'kit-plus','datos-ejemplo',name),path.join(dataDir,name));
const read=name=>{const book=XLSX.readFile(path.join(dataDir,name),{raw:true});return XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{defval:'',raw:false});};
generateInsights(read('personas.csv'),read('bajas_medicas.csv'),dataDir);
fs.cpSync(path.join(repo,'kit-plus','PowerBI'),projectDir,{recursive:true,filter:source=>!source.split(path.sep).some(p=>p==='.pbi'||p==='.git')});
for(const [table,csv] of [['Personas','personas.csv'],['BajasMedicas','bajas_medicas.csv'],['Insights','insights.csv']]){
 const file=path.join(projectDir,'People Analytics DAX Kit.SemanticModel','definition','tables',table+'.tmdl');
 const body=fs.readFileSync(file,'utf8').replace(/File\.Contents\("[^"]+"\)/g,()=>`File.Contents("${path.join(dataDir,csv).replaceAll('"','""')}")`);
 fs.writeFileSync(file,body);
}
fs.copyFileSync(path.join(repo,'docs','report-methodology.md'),path.join(destination,'Metodologia.md'));
const evidence=path.join(destination,'Revision');fs.mkdirSync(evidence);
for(const name of ['functional-review.md','visual-review.md','live-dax-validation.json']){
 const source=path.join(outputRoot,'report-review',name);if(fs.existsSync(source))fs.copyFileSync(source,path.join(evidence,name));
}
fs.writeFileSync(path.join(projectDir,'LEEME.txt'),'Abre People Analytics DAX Kit.pbip en Power BI Desktop. En la primera apertura, pulsa Actualizar para cargar los CSV locales de la carpeta Datos.\nLos datos son sintéticos. Ventana inicial de demostración: año 2025.\n');
fs.writeFileSync(path.join(destination,'LEEME.md'),'# Informe RR. HH. revisado\n\nAbre `PowerBI/People Analytics DAX Kit.pbip` y pulsa **Actualizar** en la primera apertura. Incluye nueve páginas y datos sintéticos locales; no contiene datos de empleados reales.\n\nPeriodo inicial de demostración: 01/01/2025–31/12/2025. Los CSV de diagnóstico estático indican su propio periodo. Las fuentes están configuradas para esta carpeta en este equipo; si la mueves, ajusta las rutas de origen.\n\nLa revisión funcional incluye ejecución DAX previa en seis contextos y contraste independiente. El formato se revisó nativamente antes de los últimos ajustes de altura y texto; estos remates se validaron por código porque se pidió no utilizar control de pantalla. No se certifica una nueva exportación PDF.\n\nEsta entrega no sustituye los ejecutables ni ZIP antiguos del importador.\n');
console.log(JSON.stringify({project:path.join(projectDir,'People Analytics DAX Kit.pbip'),data:dataDir},null,2));
