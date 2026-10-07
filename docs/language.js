(() => {
  const key='axzify-language',copy=window.AxzifyCopy,selector=document.getElementById('language-select');
  const valid=value=>value==='en'?'en':'es';
  function apply(value){
    const language=valid(value),text=copy[language];
    document.documentElement.lang=language;selector.value=language;
    document.title=text.title;
    document.querySelector('meta[name="description"]').setAttribute('content',text.description);
    // Only trusted, bundled editorial copy can supply markup. Controls stay in place.
    document.querySelectorAll('[data-copy]').forEach(node=>{node.innerHTML=text[node.dataset.copy];});
    document.querySelectorAll('[data-copy-aria]').forEach(node=>node.setAttribute('aria-label',text[node.dataset.copyAria]));
    document.querySelectorAll('[data-month-index]').forEach(node=>{node.textContent=text.shortMonths[Number(node.dataset.monthIndex)];});
    window.AxzifyDemo?.refresh();
  }
  let initial='es';try{initial=valid(window.localStorage.getItem(key));}catch{}
  apply(initial);
  selector.addEventListener('change',()=>{const language=valid(selector.value);try{window.localStorage.setItem(key,language);}catch{}apply(language);});
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null)apply(event.newValue);});
})();
