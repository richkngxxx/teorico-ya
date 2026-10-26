// i18n: add a language by creating /i18n/<code>.json (set "dir":"rtl" for Arabic) and listing it here.
// Missing keys fall back to Spanish. Question text is never translated (exam is in Spanish).
export const LANGS={es:"Español",en:"English"}; // planned: ar (rtl), ro, uk, zh
const base=new URL("../",import.meta.url);
let dict={},fallback={};export let lang="es";
export async function setLang(code){
  if(!LANGS[code])code="es";
  fallback=await (await fetch(new URL("i18n/es.json",base))).json();
  dict=code==="es"?fallback:await (await fetch(new URL(`i18n/${code}.json`,base))).json();
  lang=code;localStorage.setItem("ty_lang",code);
  document.documentElement.lang=code;document.documentElement.dir=dict.dir||"ltr";
  document.querySelectorAll("[data-i18n]").forEach(e=>e.textContent=t(e.dataset.i18n));
}
export const t=k=>dict[k]??fallback[k]??k;
// explanation objects are {es,en,...}; pick current lang, fall back to es
export const pick=o=>o[lang]??o.es;
export const initialLang=()=>localStorage.getItem("ty_lang")||((navigator.language||"es").startsWith("es")?"es":"en");
