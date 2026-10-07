// Headless entry point: no Electron, window launch, or shell.openPath.
const fs=require('node:fs'),path=require('node:path');
const core=require('./core'),{createPowerBiProject}=require('./report-project');
function generate(config){
 if(!config.inputPath||!config.outputDir)throw Error('Especifica inputPath y outputDir en el JSON.');
 for(const field of ['PersonaID','FechaAlta'])if(!config.personasMapping?.[field])throw Error(`Falta mapear ${field}.`);
 const edition=config.edition||'plus';if(!['plus','demo','free'].includes(edition))throw Error('Edición inválida.');
 const outputDir=path.resolve(config.outputDir);
 const result=core.convertWorkbook({...config,outputDir});
 const projectDir=fs.mkdtempSync(path.join(outputDir,'PowerBI-'));
 const templateDir=path.resolve(__dirname,'..',edition==='plus'?'kit-plus':'kit-free','PowerBI');
 const project=createPowerBiProject({templateDir,projectDir,outputDir,edition});
 core.applyPowerBiPalette(projectDir,config.colors);
 return {...result,project,powerBiOpened:false};
}
if(require.main===module){
 try{
  const file=process.argv[2];if(!file)throw Error('Uso: node generate-report.cjs configuracion.json');
  const config=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
  console.log(JSON.stringify(generate(config),null,2));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={generate};
