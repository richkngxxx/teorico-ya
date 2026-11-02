import {t,pick,setLang,LANGS,initialLang} from "./i18n.js";
const $=s=>document.querySelector(s),view=$("#view");
let Q=[],S=[],L=[],timer;
const store={get:()=>JSON.parse(localStorage.getItem("ty_progress")||'{"topics":{},"answered":0,"correct":0,"daily":{}}'),set:p=>localStorage.setItem("ty_progress",JSON.stringify(p))};
// learn-first path state: mode is null until the onboarding question is answered
const learn={get:()=>JSON.parse(localStorage.getItem("ty_learn")||'{"mode":null,"topics":{},"review":[]}'),set:p=>localStorage.setItem("ty_learn",JSON.stringify(p))};
const PASS=0.8,EXAM_N=30,EXAM_MAX_ERR=3,EXAM_MIN=30;
function record(topic,ok){const p=store.get();p.answered++;if(ok)p.correct++;const x=p.topics[topic]||(p.topics[topic]={n:0,ok:0});x.n++;if(ok)x.ok++;store.set(p)}
function mark(id,ok){const p=learn.get(),r=new Set(p.review);ok?r.delete(id):r.add(id);p.review=[...r];learn.set(p)}
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const today=()=>new Date().toISOString().slice(0,10);
// deterministic daily pick so the daily test is the same all day
function dailySet(){let h=0;for(const c of today())h=(h*31+c.charCodeAt(0))>>>0;const a=[...Q];for(let i=a.length-1;i>0;i--){h=(h*1103515245+12345)>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,10)}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=(k,o)=>t(k).replace(/\{(\w+)\}/g,(_,x)=>o[x]);
const signCode=id=>id.replace(/^([A-Z])(\d)/,"$1-$2");
const signName=f=>{const s=S.find(x=>x.file===f);return s?`${signCode(s.id)}: ${s.name.es}`:""};
const KIND={peligro:{es:"Señal de peligro: avisa, no da prioridad ni obliga.",en:"Warning sign: it warns, it does not give priority or oblige."},
  reglamentacion:{es:"Señal de reglamentación: prohíbe, obliga o da prioridad.",en:"Regulatory sign: it prohibits, obliges or sets priority."},
  indicacion:{es:"Señal de indicación: informa.",en:"Information sign: it informs."}};
// sign questions are built from signs.json so questions.json keeps its format; distractors share the category
function signQ(id){const s=S.find(x=>x.id===id);if(!s)return null;const o=shuffle([s,...shuffle(S.filter(x=>x!==s&&x.category===s.category)).slice(0,2)]);
  return {id:"sign:"+id,topic:"señales",question:"¿Qué significa esta señal?",img:s.file,options:o.map(x=>x.name.es),answer:o.indexOf(s),
    explanation:{es:`${signCode(s.id)} · ${s.name.es}. ${KIND[s.category].es}`,en:`${signCode(s.id)} · ${s.name.en}. ${KIND[s.category].en}`},article:s.rgc_ref,trap:false}}
const byId=id=>id.startsWith("sign:")?signQ(id.slice(5)):Q.find(q=>q.id===id);
const passed=id=>!!learn.get().topics[id]?.passed;
const unlocked=i=>i===0||passed(L[i-1].id);
const allDone=()=>L.every(x=>passed(x.id));
function home(){const n=learn.get().review.length;view.innerHTML=`<p class="muted">${t("questions_note")}</p>
<a class="btn primary" href="#daily">${t("daily")}</a><a class="btn" href="#signs">${t("signs")}</a><a class="btn" href="#traps">${t("traps")}</a>
<a class="btn${allDone()?" primary":""}" href="#exam">📝 ${t("exam")}</a>${n?`<a class="btn" href="#review">🔁 ${fmt("review_n",{n})}</a>`:""}
<a class="btn" href="#path">🎓 ${t("learn_path")}</a><a class="btn" href="#progress">${t("progress")}</a>`}
function welcome(){view.innerHTML=`<div class="card onboard"><h2>${t("onboard_q")}</h2><p>${t("onboard_text")}</p></div>
<button class="btn primary" data-m="learn">${t("onboard_yes")}</button><button class="btn" data-m="practice">${t("onboard_no")}</button>`;
  view.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{const p=learn.get();p.mode=b.dataset.m;learn.set(p);route()})}
function path(){const p=learn.get(),done=L.filter(x=>p.topics[x.id]?.passed).length,all=done===L.length,cur=L.findIndex(x=>!p.topics[x.id]?.passed),n=p.review.length;
  view.innerHTML=`<h2>🎓 ${t("path")}</h2><p class="muted">${t("path_intro")}</p>
<div class="card">${fmt("topics_done",{n:done,total:L.length})}<div class="bar"><i style="width:${100*done/L.length}%"></i></div></div>
${all?`<div class="card hl"><h3>🏁 ${t("exam_ready")}</h3><p>${t("exam_intro")}</p><a class="btn primary" href="#exam">📝 ${t("exam")}</a></div>`:""}
<ol class="path">${L.map((x,i)=>{const s=p.topics[x.id],open=unlocked(i),tag=open?"a":"div";
  return `<li class="step ${s?.passed?"done":open?"open":"locked"}${i===cur?" cur":""}"><${tag}${open?` href="#lesson/${x.id}"`:""} class="step-in"><span class="num">${s?.passed?"✓":i+1}</span>
<span><b>${x.icon} ${esc(x.title)}</b><br><span class="muted">${s?.passed?fmt("best",{p:Math.round(s.best*100)}):open?esc(x.subtitle):"🔒 "+t("locked")}</span></span></${tag}></li>`}).join("")}</ol>
${n?`<a class="btn" href="#review">🔁 ${fmt("review_n",{n})}</a>`:""}
${all?"":`<a class="btn" href="#exam">📝 ${t("exam")}</a><p class="muted">${t("exam_early")}</p>`}<a class="btn" href="#practice">${t("practice")}</a>`}
function topicIndex(id){const k=L.findIndex(x=>x.id===id);if(k<0||!unlocked(k)){location.hash="path";return -1}return k}
function lesson(id,c=0){const k=topicIndex(id);if(k<0)return;const T=L[k],n=T.cards.length,card=T.cards[c],last=c===n-1;
  view.innerHTML=`<p class="muted">${fmt("topic_n",{n:k+1,total:L.length})} · ${t("lesson")} ${c+1}/${n}</p><h2>${T.icon} ${esc(T.title)}</h2>
<div class="dots">${T.cards.map((_,j)=>`<i class="${j<=c?"on":""}"></i>`).join("")}</div>
<div class="card lesson" lang="es">${card.img?`<div class="imgs">${card.img.map(f=>`<img src="../${f}" alt="${esc(signName(f))}" title="${esc(signName(f))}">`).join("")}</div>`:""}
<p>${esc(card.text)}</p>${card.ref?`<p class="muted">${esc(card.ref)}</p>`:""}</div>
${last?(T.more.length?`<h3>${t("read_more")}</h3>${T.more.map(m=>`<a class="btn" href="${m.href}">📖 ${esc(m.title)}</a>`).join("")}`:"")+`<a class="btn primary" href="#quiz/${id}">${t("start_quiz")}</a>`
  :`<button class="btn primary" id="nx">${t("next")}</button>`}${c>0?`<button class="btn" id="pv">${t("prev")}</button>`:""}<a class="btn" href="#path">${t("back_path")}</a>`;
  if(!last)$("#nx").onclick=()=>{lesson(id,c+1);scrollTo(0,0)};if(c>0)$("#pv").onclick=()=>{lesson(id,c-1);scrollTo(0,0)}}
function quiz(list,mode,done){let i=0,score=0;
  const show=()=>{if(i>=list.length){if(mode==="daily"){const p=store.get();p.daily[today()]=score;store.set(p)}
      if(done)return done(score,list.length);
      view.innerHTML=`<div class="card"><h2>${t("score")}: ${score}/${list.length}</h2></div><a class="btn primary" href="#">${t("home")}</a>`;return}
    const q=list[i];view.innerHTML=`<p class="muted">${i+1}/${list.length} · ${esc(q.topic)}${q.trap?" · ⚠️":""}</p>${q.img?`<img class="sign" src="../${q.img}" alt="">`:""}<div class="card"><strong lang="es">${esc(q.question)}</strong></div>
${q.options.map((o,k)=>`<button class="btn" lang="es" data-k="${k}">${"abc"[k]}) ${esc(o)}</button>`).join("")}<div id="fb"></div>`;
    view.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=+b.dataset.k,ok=k===q.answer;if(ok)score++;record(q.topic,ok);mark(q.id,ok);
      view.querySelectorAll("[data-k]").forEach(x=>{x.disabled=true;if(+x.dataset.k===q.answer)x.classList.add("ok")});if(!ok)b.classList.add("bad");
      $("#fb").innerHTML=`<div class="card"><strong>${ok?t("correct"):t("wrong")}</strong>${ok?"":`<p lang="es"><b>${t("correct_answer")}:</b> ${"abc"[q.answer]}) ${esc(q.options[q.answer])}</p>`}<p>${esc(pick(q.explanation))}</p><p class="muted">${t("article")}: ${esc(q.article)}</p></div><button class="btn primary" id="nx">${t("next")}</button>`;
      $("#nx").onclick=()=>{i++;show();scrollTo(0,0)}})};show()}
function topicQuiz(id){const k=topicIndex(id);if(k<0)return;const T=L[k],next=L[k+1];
  const list=shuffle([...T.questions.map(byId),...T.signs.map(signQ)].filter(Boolean)).slice(0,10);
  quiz(list,"learn",(score,n)=>{const r=score/n,ok=r>=PASS,p=learn.get(),x=p.topics[id]||(p.topics[id]={best:0,passed:false,attempts:0});
    x.attempts++;x.best=Math.max(x.best,r);if(ok)x.passed=true;learn.set(p);
    view.innerHTML=`<div class="card result ${ok?"pass":"fail"}"><h2>${ok?t("quiz_pass"):t("quiz_fail_title")}</h2><p>${t("score")}: ${score}/${n} (${Math.round(r*100)} %)</p>
<p>${ok?(next?fmt("unlocked",{t:esc(next.title)}):t("path_done")):t("quiz_fail")}</p></div>
${ok&&next?`<a class="btn primary" href="#lesson/${next.id}">${t("next_topic")}: ${next.icon} ${esc(next.title)}</a>`:""}${ok&&!next?`<a class="btn primary" href="#exam">📝 ${t("exam")}</a>`:""}
<button class="btn${ok?"":" primary"}" id="retry">${t("retry")}</button>${ok?"":`<a class="btn" href="#lesson/${id}">${t("review_lesson")}</a>`}
${p.review.length?`<a class="btn" href="#review">🔁 ${fmt("review_n",{n:p.review.length})}</a>`:""}<a class="btn" href="#path">${t("back_path")}</a>`;
    $("#retry").onclick=()=>topicQuiz(id)})}
function review(){const list=shuffle(learn.get().review.map(byId).filter(Boolean)).slice(0,10);
  if(!list.length){view.innerHTML=`<h2>🔁 ${t("review")}</h2><p>${t("review_empty")}</p><a class="btn primary" href="#">${t("home")}</a>`;return}
  quiz(list,"review",(score,n)=>{const left=learn.get().review.length;
    view.innerHTML=`<div class="card"><h2>${t("score")}: ${score}/${n}</h2><p>${fmt("review_left",{n:left})}</p></div>${left?`<button class="btn primary" id="again">${t("review")}</button>`:""}<a class="btn${left?"":" primary"}" href="#">${t("home")}</a>`;
    if(left)$("#again").onclick=review})}
function exam(){view.innerHTML=`<h2>📝 ${t("exam")}</h2><div class="card${allDone()?" hl":""}"><p>${t("exam_intro")}</p><p class="muted">${t("questions_note")}</p></div>${allDone()?"":`<p class="muted">${t("exam_early")}</p>`}
<button class="btn primary" id="go">${t("exam_start")}</button><a class="btn" href="#">${t("home")}</a>`;$("#go").onclick=runExam}
function runExam(){const list=shuffle(Q).slice(0,EXAM_N),ans=[],end=Date.now()+EXAM_MIN*60e3;let i=0;
  const left=()=>Math.max(0,end-Date.now()),clock=()=>{const s=Math.ceil(left()/1e3);return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`};
  const finish=()=>{clearInterval(timer);let err=0;list.forEach((q,k)=>{const ok=ans[k]===q.answer;if(!ok)err++;record(q.topic,ok);mark(q.id,ok)});const pass=err<=EXAM_MAX_ERR;
    view.innerHTML=`<div class="card result ${pass?"pass":"fail"}"><h2>${pass?t("apto"):t("no_apto")}</h2><p>${fmt("errors",{n:err,max:EXAM_MAX_ERR})}</p>${left()?"":`<p class="muted">${t("time_up")}</p>`}</div>`+
    list.map((q,k)=>ans[k]===q.answer?"":`<div class="card"><strong lang="es">${esc(q.question)}</strong><p lang="es" class="bad-t">${t("your_answer")}: ${ans[k]==null?t("no_answer"):`${"abc"[ans[k]]}) ${esc(q.options[ans[k]])}`}</p>
<p lang="es" class="ok-t">${t("correct_answer")}: ${"abc"[q.answer]}) ${esc(q.options[q.answer])}</p><p>${esc(pick(q.explanation))}</p><p class="muted">${t("article")}: ${esc(q.article)}</p></div>`).join("")+
    `${err?`<a class="btn" href="#review">🔁 ${fmt("review_n",{n:learn.get().review.length})}</a>`:""}<button class="btn primary" id="again">${t("retry")}</button><a class="btn" href="#">${t("home")}</a>`;
    $("#again").onclick=runExam;scrollTo(0,0)};
  const show=()=>{const q=list[i];view.innerHTML=`<p class="muted exam-bar"><span>${i+1}/${list.length}</span><span>⏱ <b id="tm">${clock()}</b></span></p><div class="card"><strong lang="es">${esc(q.question)}</strong></div>
${q.options.map((o,k)=>`<button class="btn${ans[i]===k?" sel":""}" lang="es" data-k="${k}">${"abc"[k]}) ${esc(o)}</button>`).join("")}<button class="btn primary" id="nx" ${ans[i]==null?"disabled":""}>${i<list.length-1?t("next"):t("finish")}</button>`;
    view.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{ans[i]=+b.dataset.k;view.querySelectorAll("[data-k]").forEach(x=>x.classList.toggle("sel",x===b));$("#nx").disabled=false});
    $("#nx").onclick=()=>{if(++i<list.length){show();scrollTo(0,0)}else finish()}};
  clearInterval(timer);timer=setInterval(()=>{if(!left())return finish();const e=$("#tm");if(e)e.textContent=clock()},1000);show()}
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
  `<button class="btn" id="rs">${t("reset")}</button>`;$("#rs").onclick=()=>{localStorage.removeItem("ty_progress");const l=learn.get();l.topics={};l.review=[];learn.set(l);progress()}}
function route(){clearInterval(timer);const [h,arg]=location.hash.slice(1).split("/"),mode=learn.get().mode;
  ({daily:()=>quiz(dailySet(),"daily"),traps:()=>quiz(shuffle(Q.filter(q=>q.trap)),"traps"),signs,progress,practice:home,path,review,exam,
    lesson:()=>lesson(arg),quiz:()=>topicQuiz(arg)}[h]||(mode==null?welcome:mode==="learn"?path:home))();window.scrollTo(0,0)}
async function init(){const sel=$("#lang");sel.innerHTML=Object.entries(LANGS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
  const l=initialLang();await setLang(l);sel.value=l;sel.onchange=async()=>{await setLang(sel.value);route()};
  [Q,S,L]=await Promise.all(["../data/questions.json","../data/signs.json","../data/lessons.json"].map(u=>fetch(u).then(r=>r.json())));
  // users who already practised before this feature keep the current flow instead of seeing the onboarding question
  const lp=learn.get();if(lp.mode==null&&store.get().answered>0){lp.mode="practice";learn.set(lp)}
  addEventListener("hashchange",route);route();
  if("serviceWorker" in navigator)navigator.serviceWorker.register("../sw.js",{scope:"../"})}
init();
