const {config,writeKit}=require('./build-report-layout.cjs');
writeKit('kit-plus',config);
writeKit('kit-free',[{...config[0],id:'plantilla',name:'Resumen de personas'}]);
