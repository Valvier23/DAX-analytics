(() => {
 const values={plantilla:[772,780,790,800,808,820],movimientos:[22,20,24,26,28,30],ausencias:[8,7,9,9,10,11]};
 let active='plantilla';
 function render(key){
  active=key;const language=document.documentElement.lang==='en'?'en':'es',copy=window.AxzifyCopy[language],area=copy.areas[key],numbers=values[key];
  document.getElementById('demo-title').textContent=area.title;
  document.getElementById('chart-title').textContent=area.chart;
  document.getElementById('demo-kpis').innerHTML=area.kpis.map(k=>'<div><small>'+k[0]+'</small><b>'+k[1]+'</b><i>'+k[2]+'</i></div>').join('');
  const chart=document.getElementById('demo-chart');
  chart.innerHTML=numbers.map((v,i)=>'<div class="bar" title="'+copy.months[i]+': '+v.toLocaleString(language==='en'?'en-GB':'es-ES')+'" style="height:'+v/Math.max(...numbers)*100+'%"></div>').join('');
  chart.setAttribute('aria-label',area.chart+': '+numbers.map((v,i)=>copy.months[i]+' '+v).join(', '));
  document.getElementById('demo-panel').setAttribute('aria-labelledby','tab-'+key);
  document.querySelectorAll('[data-area]').forEach(b=>{const selected=b.dataset.area===key;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
 }
 document.querySelectorAll('[data-area]').forEach((button,i,all)=>{
  button.id='tab-'+button.dataset.area;button.setAttribute('aria-controls','demo-panel');
  button.addEventListener('click',()=>render(button.dataset.area));
  button.addEventListener('keydown',event=>{let target;if(event.key==='ArrowRight')target=(i+1)%all.length;if(event.key==='ArrowLeft')target=(i-1+all.length)%all.length;if(event.key==='Home')target=0;if(event.key==='End')target=all.length-1;if(target!==undefined){event.preventDefault();all[target].focus();render(all[target].dataset.area);}});
 });
 window.AxzifyDemo={refresh:()=>render(active)};render(active);
})();
