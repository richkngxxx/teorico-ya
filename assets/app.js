import {t,pick,setLang,LANGS,initialLang} from "./i18n.js";
const $=s=>document.querySelector(s),view=$("#view");
let Q=[],S=[];
const GOAL=10,MAX_HEARTS=5;
/* Progress is stored on-device only (no accounts). Shape is backwards-compatible:
   older saves {topics,answered,correct,daily} gain xp/days/hearts on first load. */
const store={
  get(){const p=JSON.parse(localStorage.getItem("ty_progress")||'{"topics":{},"answered":0,"correct":0,"daily":{}}');
    p.topics??={};p.daily??={};p.xp??=0;p.days??={};
    for(const d of Object.keys(p.daily))p.days[d]??=GOAL; // past daily tests count towards streaks
    if(p.heartsDay!==today()){p.hearts=MAX_HEARTS;p.heartsDay=today()}
    p.hearts??=MAX_HEARTS;return p},
  set:p=>localStorage.setItem("ty_progress",JSON.stringify(p))};
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const dayKey=offset=>{const d=new Date();d.setDate(d.getDate()+offset);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
function streak(p){let n=0;if(!p.days[today()])n=0;for(let i=p.days[today()]?0:1;;i++){if(p.days[dayKey(-i)])n++;else break}return n}
function record(topic,ok){const p=store.get();p.answered++;if(ok)p.correct++;p.xp+=ok?10:2;
  if(!ok&&p.hearts>0)p.hearts--;
  const x=p.topics[topic]||(p.topics[topic]={n:0,ok:0});x.n++;if(ok)x.ok++;
  p.days[today()]=(p.days[today()]||0)+1;store.set(p);renderPills();return ok?10:2}
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
// deterministic daily pick so the daily test is the same all day
function dailySet(){let h=0;for(const c of today())h=(h*31+c.charCodeAt(0))>>>0;const a=[...Q];for(let i=a.length-1;i>0;i--){h=(h*1103515245+12345)>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,10)}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tt=(k,n)=>t(k).replace("{n}",n);
const TOPICS={velocidad:["🏎️","Velocidad"],alcohol:["🚫","Alcohol"],drogas:["💊","Medicamentos"],prioridad:["🚦","Prioridad de paso"],señales:["🛑","Señales"],adelantamiento:["🚗","Adelantamiento"],distancia:["↔️","Distancia de seguridad"],maniobras:["🔄","Maniobras"],estacionamiento:["🅿️","Estacionamiento"],alumbrado:["💡","Alumbrado"],seguridad:["🦺","Seguridad"],distracciones:["📵","Distracciones"],peatones:["🚶","Peatones"],vias:["🛣️","La vía"]};
const topicLabel=k=>(TOPICS[k]?TOPICS[k][1]:k),topicIcon=k=>(TOPICS[k]?TOPICS[k][0]:"📘");

function renderPills(){const el=$("#pills");if(!el)return;const p=store.get();
  el.innerHTML=`<span class="pill streak" title="${t("streak")}">🔥 ${streak(p)}</span><span class="pill hearts" title="❤">❤️ ${p.hearts}</span><span class="pill xp" title="${t("xp")}">⭐ ${p.xp} XP</span>`}
function heartsHTML(p){return `<span class="hearts" aria-label="${p.hearts}/${MAX_HEARTS}">${"❤️".repeat(p.hearts)}${'<span class="lost">🤍</span>'.repeat(MAX_HEARTS-p.hearts)}</span>`}
function confetti(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const c=document.createElement("div");c.className="confetti";const cols=["#58cc02","#1cb0f6","#ffc800","#ff4b4b","#a560e8"];
  c.innerHTML=Array.from({length:32},(_,i)=>`<i style="left:${Math.random()*100}%;background:${cols[i%5]};animation-duration:${1.6+Math.random()*1.4}s;animation-delay:${Math.random()*.35}s;transform:rotate(${Math.random()*360}deg)"></i>`).join("");
  document.body.append(c);setTimeout(()=>c.remove(),3600)}

function home(){const p=store.get(),done=p.daily[today()]!==undefined,todayN=Math.min(p.days[today()]||0,GOAL),pct=Math.round(100*todayN/GOAL),s=streak(p);
  view.innerHTML=`
  <section class="card greet"><img class="mascot" src="../assets/mascot.svg" alt="" width="132" height="106"><div><h2>${t("hello")}</h2><p class="muted">${t("home_sub")}</p><p style="margin:.45rem 0 0"><span class="pill streak">🔥 ${s} ${t("days")}</span></p></div></section>
  <section class="card goal"><div class="goal-top"><h3 style="margin:0">🎯 ${t("goal_title")}</h3><span class="badge ${done?"":"blue"}">${todayN}/${GOAL}</span></div>
    <div class="ring-wrap" style="margin-top:.7rem"><div class="ring" style="--p:${pct}"><i>${pct}%</i></div><p style="margin:0;font-weight:700">${done||todayN>=GOAL?t("goal_done"):tt("goal_left",GOAL-todayN)}</p></div>
    <p class="muted" style="margin:.7rem 0 0">${t("questions_note")}</p></section>
  <h2 style="text-align:center;margin-top:1.4rem">${t("your_path")}</h2>
  <nav class="path" aria-label="${t("your_path")}">
    <a class="node ${done?"done":""}" href="#daily"><span class="bubble green">📅</span><b>${t("daily")} (10) ${done?"✅":""}</b><span>${done?t("done_today"):t("daily_desc")}</span></a>
    <a class="node" href="#signs"><span class="bubble blue">🚸</span><b>${t("signs")}</b><span>${t("signs_desc")}</span></a>
    <a class="node" href="#traps"><span class="bubble red">⚠️</span><b>${t("traps")}</b><span>${t("traps_desc")}</span></a>
    <a class="node" href="#progress"><span class="bubble purple">📈</span><b>${t("progress")}</b><span>${t("progress_desc")}</span></a>
  </nav>`;renderPills()}

function finish(score,total,xp,mode){const pct=total?Math.round(100*score/total):0;
  const title=pct>=80?t("result_great"):pct>=50?t("result_good"):t("result_keep");
  view.innerHTML=`<section class="card result"><img class="mascot" src="../assets/mascot.svg" alt="" width="132" height="106">
    <h2>${title}</h2><div class="score-big">${score}/${total}</div>
    <p style="margin:.3rem 0"><span class="xp-gain">⭐ ${tt("xp_earned",xp)}</span></p>
    <p class="muted">${t("score")}: ${pct}% · 🔥 ${streak(store.get())} ${t("days")}</p>
    ${mode==="daily"?`<button class="btn ghost" id="again">${t("play_daily_again")}</button>`:""}
    <a class="btn blue" href="#progress">${t("see_progress")}</a><a class="btn primary" href="#">${t("home")}</a></section>`;
  if(pct>=60)confetti();
  const again=$("#again");if(again)again.onclick=()=>quiz(dailySet(),"daily");window.scrollTo(0,0)}

/* Duolingo-style flow: pick an answer → "Comprobar" → celebration/correction sheet → "Continuar". */
function quiz(list,mode){let i=0,score=0,xp=0,selected=null,checked=false;
  if(!list.length){view.innerHTML=`<section class="card empty"><img class="mascot" src="../assets/mascot.svg" alt=""><p>${t("no_data")}</p><a class="btn primary" href="#">${t("home")}</a></section>`;return}
  const show=()=>{selected=null;checked=false;
    if(i>=list.length){if(mode==="daily"){const p=store.get();p.daily[today()]=score;store.set(p)}finish(score,list.length,xp,mode);return}
    const q=list[i],order=shuffle(q.options.map((o,k)=>({o,k}))),ans=order.findIndex(x=>x.k===q.answer),p=store.get();
    view.innerHTML=`<div class="quiz-top"><a class="close" href="#" aria-label="${t("home")}">✕</a><div class="bar" role="progressbar" aria-valuenow="${i}" aria-valuemin="0" aria-valuemax="${list.length}"><i style="width:${100*i/list.length}%"></i></div>${heartsHTML(p)}</div>
    <div class="q-meta"><span class="badge blue">${t("question")} ${i+1}/${list.length}</span><span class="badge">${topicIcon(q.topic)} ${esc(topicLabel(q.topic))}</span>${q.trap?`<span class="badge red">⚠️ ${t("traps")}</span>`:""}</div>
    <div class="q-card"><div class="q-text" lang="es">${esc(q.question)}</div></div>
    <div role="group" aria-label="${t("question")} ${i+1}">${order.map((x,k)=>`<button class="btn opt" lang="es" data-k="${k}"><span class="letter">${"ABC"[k]}</span><span class="opt-text">${esc(x.o)}</span></button>`).join("")}</div>
    <div class="check-zone"><p class="muted" id="hint">${t("choose_answer")}</p><button class="btn primary" id="check" disabled>${t("check")}</button></div><div id="fb" aria-live="polite"></div>`;
    const check=$("#check");
    view.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{if(checked)return;selected=+b.dataset.k;
      view.querySelectorAll(".opt").forEach(x=>x.classList.toggle("selected",x===b));check.disabled=false;$("#hint").textContent=""});
    check.onclick=()=>{if(selected===null||checked)return;checked=true;const ok=selected===ans;if(ok)score++;xp+=record(q.topic,ok);
      view.querySelectorAll(".opt").forEach(x=>{x.disabled=true;const k=+x.dataset.k;if(k===ans)x.classList.add("ok");else if(k===selected)x.classList.add("bad")});
      $(".check-zone").remove();renderPills();
      const p2=store.get();
      $("#fb").innerHTML=`<div class="sheet ${ok?"ok":"bad"}"><h3>${ok?"🎉":"💪"} ${ok?t("correct"):t("wrong")}</h3>
        <p lang="es">${esc(pick(q.explanation))}</p><p class="ref">📖 ${t("article")}: ${esc(q.article)}</p>
        ${!ok&&p2.hearts===0?`<p class="ref">${t("hearts_out")}</p>`:""}
        <button class="btn primary" id="nx">${i+1>=list.length?t("finish"):t("continue")}</button></div>`;
      $("#nx").focus();$("#nx").onclick=()=>{i++;show()}}};show()}

function signs(){const list=shuffle(S);let i=0,score=0,xp=0,selected=null,checked=false;
  const show=()=>{selected=null;checked=false;
    if(i>=list.length){finish(score,list.length,xp,"signs");return}
    const s=list[i],opts=shuffle([s,...shuffle(S.filter(x=>x!==s)).slice(0,2)]),p=store.get();
    view.innerHTML=`<div class="quiz-top"><a class="close" href="#" aria-label="${t("home")}">✕</a><div class="bar" role="progressbar" aria-valuenow="${i}" aria-valuemin="0" aria-valuemax="${list.length}"><i style="width:${100*i/list.length}%"></i></div>${heartsHTML(p)}</div>
    <div class="q-meta"><span class="badge blue">${t("question")} ${i+1}/${list.length}</span><span class="badge">🚸 ${t("signs")}</span></div>
    <h2 style="text-align:center">${t("which_sign")}</h2><img class="sign" src="../${s.file}" alt="${esc(s.id)}">
    <div role="group">${opts.map(o=>`<button class="btn opt" data-id="${o.id}"><span class="opt-text">${esc(pick(o.name))}</span></button>`).join("")}</div>
    <div class="check-zone"><p class="muted" id="hint">${t("choose_answer")}</p><button class="btn primary" id="check" disabled>${t("check")}</button></div><div id="fb" aria-live="polite"></div>`;
    const check=$("#check");
    view.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{if(checked)return;selected=b.dataset.id;
      view.querySelectorAll(".opt").forEach(x=>x.classList.toggle("selected",x===b));check.disabled=false;$("#hint").textContent=""});
    check.onclick=()=>{if(!selected||checked)return;checked=true;const ok=selected===s.id;if(ok)score++;xp+=record("señales",ok);
      view.querySelectorAll(".opt").forEach(x=>{x.disabled=true;if(x.dataset.id===s.id)x.classList.add("ok");else if(x.dataset.id===selected)x.classList.add("bad")});
      $(".check-zone").remove();renderPills();
      $("#fb").innerHTML=`<div class="sheet ${ok?"ok":"bad"}"><h3>${ok?"🎉":"💪"} ${ok?t("correct"):t("wrong")}</h3>
        <p><strong>${esc(s.id)}</strong> · <span lang="es">${esc(s.name.es)}</span></p>
        <button class="btn primary" id="nx">${i+1>=list.length?t("finish"):t("continue")}</button></div>`;
      $("#nx").focus();$("#nx").onclick=()=>{i++;show()}}};show()}

function progress(){const p=store.get(),s=streak(p),level=Math.floor(p.xp/100)+1;
  if(!p.answered){view.innerHTML=`<h2>📈 ${t("progress")}</h2><section class="card empty"><img class="mascot" src="../assets/mascot.svg" alt="" width="132" height="106"><h3>${t("keep_going")}</h3><p class="muted">${t("no_data")}</p><a class="btn primary" href="#daily">${t("no_data_cta")}</a></section>`;renderPills();return}
  const tp=Object.entries(p.topics).map(([k,v])=>[k,v.ok/v.n,v.n]).sort((a,b)=>a[1]-b[1]);
  const week=Array.from({length:7},(_,j)=>{const off=j-6,key=dayKey(off),on=!!p.days[key];
    return `<div class="day ${on?"on":""} ${off===0?"today":""}"><div class="dot">✓</div>${"LMXJVSD"[(new Date(key+"T12:00").getDay()+6)%7]}</div>`}).join("");
  view.innerHTML=`<h2>📈 ${t("progress")}</h2>
  <div class="stats-grid">
    <div class="stat"><div class="num">🔥 ${s}</div><div class="lbl">${t("streak")} (${t("days")})</div></div>
    <div class="stat"><div class="num">⭐ ${p.xp}</div><div class="lbl">XP · ${t("level")} ${level}</div></div>
    <div class="stat"><div class="num">${p.answered}</div><div class="lbl">${t("answered")}</div></div>
    <div class="stat"><div class="num">${Math.round(100*p.correct/p.answered)}%</div><div class="lbl">${t("accuracy")}</div></div>
  </div>
  <section class="card"><h3 style="margin:0">🗓️ ${t("this_week")}</h3><div class="week">${week}</div></section>
  <h3>${t("weak")}</h3>
  ${tp.map(([k,r,n])=>`<div class="card" style="padding:.9rem 1.1rem"><div class="topic-head"><span>${topicIcon(k)} ${esc(topicLabel(k))}</span><span>${Math.round(r*100)}% <span class="n">(${n})</span></span></div><div class="tbar"><i class="${r>=.8?"good":r>=.5?"mid":"low"}" style="width:${Math.max(4,r*100)}%"></i></div></div>`).join("")}
  <button class="btn danger-ghost" id="rs">🗑️ ${t("reset")}</button>`;
  $("#rs").onclick=()=>{if(confirm(t("reset")+"?")){localStorage.removeItem("ty_progress");progress()}};renderPills()}

function route(){const h=location.hash.slice(1);
  document.querySelectorAll(".tabbar a").forEach(a=>a.classList.toggle("active",a.dataset.tab===(h||"home")));
  ({daily:()=>quiz(dailySet(),"daily"),traps:()=>quiz(shuffle(Q.filter(q=>q.trap)),"traps"),signs,progress}[h]||home)();window.scrollTo(0,0)}
async function init(){const sel=$("#lang");sel.innerHTML=Object.entries(LANGS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
  const l=initialLang();await setLang(l);sel.value=l;sel.onchange=async()=>{await setLang(sel.value);route()};
  [Q,S]=await Promise.all(["../data/questions.json","../data/signs.json"].map(u=>fetch(u).then(r=>r.json())));
  addEventListener("hashchange",route);route();
  if("serviceWorker" in navigator)navigator.serviceWorker.register("../sw.js",{scope:"../"})}
init();
