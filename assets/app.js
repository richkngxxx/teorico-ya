import {t,pick,setLang,LANGS,initialLang} from "./i18n.js";
const $=s=>document.querySelector(s),view=$("#view");
let Q=[],S=[];
const store={get:()=>JSON.parse(localStorage.getItem("ty_progress")||'{"topics":{},"answered":0,"correct":0,"daily":{}}'),set:p=>localStorage.setItem("ty_progress",JSON.stringify(p))};
function record(topic,ok){const p=store.get();p.answered++;if(ok)p.correct++;const x=p.topics[topic]||(p.topics[topic]={n:0,ok:0});x.n++;if(ok)x.ok++;store.set(p)}
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const today=()=>new Date().toISOString().slice(0,10);
// deterministic daily pick so the daily test is the same all day
function dailySet(){let h=0;for(const c of today())h=(h*31+c.charCodeAt(0))>>>0;const a=[...Q];for(let i=a.length-1;i>0;i--){h=(h*1103515245+12345)>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,10)}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function home(){view.innerHTML=`<p class="muted">${t("questions_note")}</p>
<a class="btn primary" href="#daily">${t("daily")}</a><a class="btn" href="#signs">${t("signs")}</a><a class="btn" href="#traps">${t("traps")}</a><a class="btn" href="#progress">${t("progress")}</a>`}
function quiz(list,mode){let i=0,score=0;
  const show=()=>{if(i>=list.length){if(mode==="daily"){const p=store.get();p.daily[today()]=score;store.set(p)}
      view.innerHTML=`<div class="card"><h2>${t("score")}: ${score}/${list.length}</h2></div><a class="btn primary" href="#">${t("home")}</a>`;return}
    const q=list[i];view.innerHTML=`<p class="muted">${i+1}/${list.length} · ${esc(q.topic)}${q.trap?" · ⚠️":""}</p><div class="card"><strong lang="es">${esc(q.question)}</strong></div>
${q.options.map((o,k)=>`<button class="btn" lang="es" data-k="${k}">${"abc"[k]}) ${esc(o)}</button>`).join("")}<div id="fb"></div>`;
    view.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=+b.dataset.k,ok=k===q.answer;if(ok)score++;record(q.topic,ok);
      view.querySelectorAll("[data-k]").forEach(x=>{x.disabled=true;if(+x.dataset.k===q.answer)x.classList.add("ok")});if(!ok)b.classList.add("bad");
      $("#fb").innerHTML=`<div class="card"><strong>${ok?t("correct"):t("wrong")}</strong><p>${esc(pick(q.explanation))}</p><p class="muted">${t("article")}: ${esc(q.article)}</p></div><button class="btn primary" id="nx">${t("next")}</button>`;
      $("#nx").onclick=()=>{i++;show()}})};show()}
function signs(){const list=shuffle(S);let i=0;
  const show=()=>{if(i>=list.length)return home();const s=list[i],opts=shuffle([s,...shuffle(S.filter(x=>x!==s)).slice(0,2)]);
    view.innerHTML=`<p class="muted">${i+1}/${list.length}</p><h2>${t("which_sign")}</h2><img class="sign" src="../${s.file}" alt="">
${opts.map(o=>`<button class="btn" data-id="${o.id}">${esc(pick(o.name))}</button>`).join("")}<div id="fb"></div>`;
    view.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>{const ok=b.dataset.id===s.id;record("señales",ok);
      view.querySelectorAll("[data-id]").forEach(x=>{x.disabled=true;if(x.dataset.id===s.id)x.classList.add("ok")});if(!ok)b.classList.add("bad");
      $("#fb").innerHTML=`<p class="muted">${s.id} · ${esc(s.name.es)}</p><button class="btn primary" id="nx">${t("next")}</button>`;$("#nx").onclick=()=>{i++;show()}})};show()}
function progress(){const p=store.get(),tp=Object.entries(p.topics).map(([k,v])=>[k,v.ok/v.n,v.n]).sort((a,b)=>a[1]-b[1]);
  view.innerHTML=`<h2>${t("progress")}</h2>`+(p.answered?`<div class="card">${t("answered")}: ${p.answered} · ${t("accuracy")}: ${Math.round(100*p.correct/p.answered)}%</div><h3>${t("weak")}</h3>`+
  tp.map(([k,r,n])=>`<div class="card">${esc(k)} <span class="muted">(${n})</span> ${Math.round(r*100)}%<div class="bar"><i style="width:${r*100}%"></i></div></div>`).join(""):`<p>${t("no_data")}</p>`)+
  `<button class="btn" id="rs">${t("reset")}</button>`;$("#rs").onclick=()=>{localStorage.removeItem("ty_progress");progress()}}
function route(){const h=location.hash.slice(1);({daily:()=>quiz(dailySet(),"daily"),traps:()=>quiz(shuffle(Q.filter(q=>q.trap)),"traps"),signs,progress}[h]||home)();window.scrollTo(0,0)}
async function init(){const sel=$("#lang");sel.innerHTML=Object.entries(LANGS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
  const l=initialLang();await setLang(l);sel.value=l;sel.onchange=async()=>{await setLang(sel.value);route()};
  [Q,S]=await Promise.all(["../data/questions.json","../data/signs.json"].map(u=>fetch(u).then(r=>r.json())));
  addEventListener("hashchange",route);route();
  if("serviceWorker" in navigator)navigator.serviceWorker.register("../sw.js",{scope:"../"})}
init();
