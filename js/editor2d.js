// Editor 2D, interação, painéis e controles
// ---------- Desenho 2D ----------
const c2=$('#c2'),x2=c2.getContext('2d'),sc=$('#sc'),xs=sc.getContext('2d');let W2=1,H2=1,dpr=1;
function fit(){dpr=devicePixelRatio||1;W2=$('#cv').clientWidth;H2=$('#cv').clientHeight;c2.width=W2*dpr;c2.height=H2*dpr;sc.width=sc.clientWidth*dpr;sc.height=sc.clientHeight*dpr;if(ren){ren.setPixelRatio(dpr);ren.setSize(W2,H2,false);cam.aspect=W2/H2;cam.updateProjectionMatrix()}}
new ResizeObserver(fit).observe($('#cv'));new ResizeObserver(fit).observe(sc);
const COL={R:'#e0b878',POT:'#e0b878',C:'#6fa8ff',L:'#c58bff',V:'#ff8a7a',AC:'#ff8a7a',BAT:'#ff8a7a',I:'#f0b429',D:'#cfd8e3',LED:'#ff5d73',LAMP:'#ffd66b',SW:'#cfd8e3',GND:'#9fb3c8'};
function sym(c,p){c.lineWidth=2;c.strokeStyle=COL[p.t];c.fillStyle='#0c1319';c.beginPath();const t=p.t;
if(t=='R'||t=='POT'||t=='LAMP'&&0){c.rect(-20,-7,40,14);if(t=='POT'){c.moveTo(-8,-18);c.lineTo(8,-8);c.moveTo(8,-8);c.lineTo(4,-9)}}
else if(t=='C'){c.moveTo(-4,-14);c.lineTo(-4,14);c.moveTo(4,-14);c.lineTo(4,14)}
else if(t=='L'){for(let i=0;i<4;i++)c.arc(-15+i*10,0,5,Math.PI,0)}
else if(t=='V'||t=='AC'||t=='BAT'){if(t=='BAT'){c.moveTo(-6,-14);c.lineTo(-6,14);c.moveTo(4,-8);c.lineTo(4,8)}else{c.arc(0,0,16,0,7);if(t=='AC'){c.moveTo(-9,0);c.bezierCurveTo(-4,-9,-2,-9,0,0);c.bezierCurveTo(2,9,4,9,9,0)}else{c.moveTo(-10,0);c.lineTo(-4,0);c.moveTo(4,0);c.lineTo(10,0);c.moveTo(7,-3);c.lineTo(7,3)}}}
else if(t=='I'){c.arc(0,0,16,0,7);c.moveTo(-9,0);c.lineTo(9,0);c.lineTo(4,-4);c.moveTo(9,0);c.lineTo(4,4)}
else if(t=='D'||t=='LED'){c.moveTo(-8,-10);c.lineTo(-8,10);c.lineTo(8,0);c.closePath();c.moveTo(8,-10);c.lineTo(8,10);if(t=='LED'){c.moveTo(-2,-12);c.lineTo(4,-20);c.moveTo(4,-11);c.lineTo(10,-19)}}
else if(t=='LAMP'){c.arc(0,0,14,0,7);c.moveTo(-10,-10);c.lineTo(10,10);c.moveTo(10,-10);c.lineTo(-10,10)}
else if(t=='SW'){c.moveTo(-20,0);c.lineTo(-10,0);c.moveTo(10,0);c.lineTo(20,0);c.moveTo(-10,0);p.pr.closed?c.lineTo(10,0):c.lineTo(8,-12)}
else if(t=='GND'){c.moveTo(0,-20);c.lineTo(0,-4);c.moveTo(-12,-4);c.lineTo(12,-4);c.moveTo(-7,2);c.lineTo(7,2);c.moveTo(-3,8);c.lineTo(3,8)}
c.stroke()}
const hue=v=>`hsl(${180-Math.max(-1,Math.min(1,v/12))*70},80%,55%)`;
function route(c,a,b,v){c.moveTo(a[0],a[1]);v?c.lineTo(a[0],b[1]):c.lineTo(b[0],a[1]);c.lineTo(b[0],b[1])}
function draw2(){const c=x2;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W2,H2);
c.fillStyle='#34475a';for(let x=0;x<W2;x+=20)for(let y=0;y<H2;y+=20)c.fillRect(x,y,1,1);
const live=run||time>0;
for(const w of wires){const a=P(w.a[0]),b=P(w.b[0]);if(!a||!b)continue;const pa=tp(a)[w.a[1]],pb=tp(b)[w.b[1]];c.beginPath();route(c,pa,pb,w.vf);c.lineWidth=2.5;c.strokeStyle=live&&M&&M.v&&a.n?hue(M.v(a.n[w.a[1]])):'#6b8197';c.stroke();dots(c,w,pa,pb)}
for(const p of parts){c.save();c.translate(p.x,p.y);if(p.rot&&p.t!='GND')c.rotate(p.rot*Math.PI/2);
const tps=tp(p);if(p.t!='GND'){c.strokeStyle='#8aa0b5';c.lineWidth=2;c.beginPath();c.moveTo(-40,0);c.lineTo(-20,0);c.moveTo(20,0);c.lineTo(40,0);c.stroke()}
if(p.id==sel){c.fillStyle='rgba(61,214,198,.12)';c.fillRect(-26,-22,52,44)}
if(p.t=='LED'&&p.r&&live){const b=Math.min(1,Math.abs(p.r.i)/.02);if(p.r.i>0){c.fillStyle=`rgba(255,93,115,${b*.6})`;c.beginPath();c.arc(0,0,24,0,7);c.fill()}}
if(p.t=='LAMP'&&p.r&&live){const b=Math.min(1,Math.abs(p.r.v*p.r.i)/p.pr.P);c.fillStyle=`rgba(255,214,107,${b*.7})`;c.beginPath();c.arc(0,0,22,0,7);c.fill()}
sym(c,p);c.restore();
c.fillStyle='#d6e2ee';c.font='11px system-ui';c.textAlign='center';const vr=p.rot&1,ty=vr?p.y:p.y+30,tx=vr?p.x+34:p.x;
if(vr)c.textAlign='left';c.fillText(p.nm,tx,ty-(vr?4:0));c.fillStyle='#7d93a8';
const m=p.t=='GND'?'':Object.keys(T[p.t].p)[0];if(m&&m!='closed')c.fillText(fm(p.pr[m],T[p.t].p[m][1]),tx,ty+(vr?9:11));
if(live&&p.r&&p.t!='GND'){c.fillStyle='#3dd6c6';c.fillText(`${fm(p.r.v,'V')} · ${fm(p.r.i,'A')}`,tx,ty+(vr?22:24))}
for(const q of tps){c.beginPath();c.arc(q[0],q[1],4,0,7);c.fillStyle=pend&&pend.p==p.id?'#f0b429':'#ffffff';c.fill()}}
if(pend){const p=P(pend.p);const a=tp(p)[pend.t];c.beginPath();route(c,a,mouse);c.setLineDash([5,4]);c.strokeStyle='#f0b429';c.lineWidth=1.5;c.stroke();c.setLineDash([])}}
function drawScope(){const c=xs,w=sc.width,h=sc.height;c.clearRect(0,0,w,h);const p=P(sel);if(!p||!buf.length)return;
for(const[k,col]of[['v','#3dd6c6'],['i','#f0b429']]){const mx=Math.max(1e-12,...buf.map(b=>Math.abs(b[k])));c.beginPath();c.strokeStyle=col;c.lineWidth=1.5*dpr;buf.forEach((b,j)=>{const X=j/(buf.length-1||1)*w,Y=h/2-b[k]/mx*h*.42;j?c.lineTo(X,Y):c.moveTo(X,Y)});c.stroke()}}
// ---------- Interação ----------
let mouse=[0,0],drag=null;
const pos=e=>{const r=c2.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
const hitT=([x,y])=>{for(const p of parts)for(let t=0;t<tp(p).length;t++){const q=tp(p)[t];if(Math.hypot(q[0]-x,q[1]-y)<9)return{p:p.id,t}}};
const hitP=([x,y])=>[...parts].reverse().find(p=>{const dx=Math.abs(x-p.x),dy=Math.abs(y-p.y);return p.t=='GND'?dx<14&&dy<24:p.rot&1?dx<16&&dy<26:dx<26&&dy<16});
c2.onmousedown=e=>{mouse=pos(e);const t=hitT(mouse);
if(e.button==2)return;
if(t){if(pend){if(pend.p!=t.p||pend.t!=t.t)wires.push({a:[pend.p,pend.t],b:[t.p,t.t]});pend=null;reset()}else pend=t;return}
pend=null;const p=hitP(mouse);sel=p?p.id:null;if(p)drag={p,dx:mouse[0]-p.x,dy:mouse[1]-p.y};showProps()};
c2.onmousemove=e=>{mouse=pos(e);if(drag){drag.p.x=Math.round((mouse[0]-drag.dx)/20)*20;drag.p.y=Math.round((mouse[1]-drag.dy)/20)*20}tipAt(e,drag?null:hitP(mouse))};c2.onmouseleave=()=>tipAt(null,null);
addEventListener('mouseup',()=>{if(drag){drag=null;reset()}});
c2.oncontextmenu=e=>{e.preventDefault();const t=hitT(pos(e));if(!t){const p=hitP(pos(e));if(p){sel=p.id;delSel()}return}if(t){wires=wires.filter(w=>!(w.a[0]==t.p&&w.a[1]==t.t||w.b[0]==t.p&&w.b[1]==t.t));reset()}};
c2.ondblclick=e=>{const p=hitP(pos(e));if(p&&p.t=='SW'){p.pr.closed=p.pr.closed?0:1;showProps()}};
addEventListener('keydown',e=>{if(e.target.tagName=='INPUT'||e.target.tagName=='TEXTAREA')return;const p=P(sel);if(!p)return;
if(e.key=='r'||e.key=='R')rot(1);if(e.key=='Delete'||e.key=='Backspace'){parts=parts.filter(q=>q!=p);wires=wires.filter(w=>w.a[0]!=p.id&&w.b[0]!=p.id);sel=null;reset();showProps()}});
c2.ondragover=e=>e.preventDefault();
c2.ondrop=e=>{e.preventDefault();const t=e.dataTransfer.getData('t');if(!T[t])return;const[x,y]=pos(e);const p=add(t,Math.round(x/20)*20,Math.round(y/20)*20,0);sel=p.id;reset();showProps()};
// biblioteca
{const cats={};for(const k in T)(cats[T[k].c]??=[]).push(k);let h='';for(const c in cats){h+=`<h4>${c}</h4>`;for(const k of cats[c])h+=`<div class="it" draggable="true" data-t="${k}">${T[k].n}</div>`}
$('#lib').innerHTML=h;$('#lib').ondragstart=e=>e.dataTransfer.setData('t',e.target.dataset.t);
$('#lib').onclick=e=>{const t=e.target.dataset.t;if(t){const p=add(t,200+parts.length%5*40,120+parts.length%6*20);sel=p.id;reset();showProps()}}}
function showProps(){const p=P(sel),d=$('#props');if(!p){d.innerHTML='<span style="color:var(--mu)">Selecione um componente.</span>';return}
d.innerHTML=`<div class="row"><b>${p.nm}</b><span style="color:var(--mu)">${T[p.t].n}</span></div>`;
const rm=document.createElement('button');rm.textContent='Remover este item';rm.style.cssText='width:100%;margin:6px 0;border-color:var(--rd);color:var(--rd)';rm.onclick=delSel;d.appendChild(rm);for(const k in T[p.t].p){const[,u,l]=T[p.t].p[k];const r=document.createElement('div');r.className='row';r.innerHTML=`<label>${l}</label><input value="${fm(p.pr[k],u)}">`;
r.querySelector('input').onchange=ev=>{const v=pv(ev.target.value);if(isNaN(v)||v<0)ev.target.value=fm(p.pr[k],u);else{p.pr[k]=v;ev.target.value=fm(v,u);M=build()}};d.appendChild(r)}}
// painel de cálculos
let lastW='';
function panel(){const t=$('#tb');let h='<tr><th>Peça<th>V<th>I<th>P</tr>',Pg=0,Pd=0;
for(const p of parts){if(p.t=='GND'||!p.r)continue;const w=p.r.v*p.r.i;w<0?Pg-=w:Pd+=w;h+=`<tr data-id="${p.id}" class="${p.id==sel?'sel':''}"><td>${p.nm}<td>${fm(p.r.v,'V')}<td>${fm(p.r.i,'A')}<td>${fm(w,'W')}</tr>`}
t.innerHTML=h+`<tr><td colspan=4 style="text-align:left;color:var(--mu)">Fornecido ${fm(Pg,'W')} · Dissipado/armazenado ${fm(Pd,'W')}</tr>`;
const e=checks(),s=e.map(x=>`<div class="${x[0]}">${x[0]=='e'?'Erro':'Aviso'}: ${x[1]}</div>`).join('')||'<div class="k">Nenhum problema detectado.</div>';if(s!=lastW){$('#warn').innerHTML=s;lastW=s}
$('#tm').textContent=`t = ${fm(time,'s')}`}
$('#tb').onclick=e=>{const r=e.target.closest('tr[data-id]');if(r){sel=+r.dataset.id;showProps()}};
// controles
const rb=(id,f)=>$(id).onclick=f;
rb('#bRun',()=>{if(!M||M.err){reset()}run=true});rb('#bPause',()=>run=false);rb('#bRst',()=>{reset();run=true});rb('#bStop',()=>{run=false;reset()});
$('#dt').onchange=e=>{const v=pv(e.target.value);if(v>=1e-7&&v<=1e-2)DT=v;e.target.value=fm(DT,'s')};
const ser=()=>JSON.stringify({nid,parts:parts.map(({id,t,x,y,rot,pr,nm})=>({id,t,x,y,rot,pr,nm})),wires});
const des=s=>{const o=JSON.parse(s);parts=o.parts;wires=o.wires;nid=o.nid;sel=null;reset();showProps()};
rb('#bSave',()=>{try{localStorage.setItem('bancada1',ser());lastW='';$('#warn').innerHTML='<div class="k">Projeto salvo neste navegador.</div>'}catch(e){$('#warn').innerHTML='<div class="e">Não foi possível salvar: use Exportar.</div>'}});
rb('#bLoad',()=>{try{const s=localStorage.getItem('bancada1');s?des(s):alert('Nenhum projeto salvo.')}catch(e){alert('Armazenamento indisponível.')}});
rb('#bDup',()=>{const p=P(sel);if(p){const q=add(p.t,p.x+40,p.y+40,p.rot,p.pr);sel=q.id;reset();showProps()}});
rb('#bExp',()=>{$('#ta').value=ser();$('#dlg').showModal();navigator.clipboard?.writeText(ser()).catch(()=>{})});
rb('#dOk',()=>{try{des($('#ta').value);$('#dlg').close()}catch(e){alert('Texto inválido.')}});rb('#dCl',()=>$('#dlg').close());
rb('#bClr',()=>{parts=[];wires=[];sel=null;reset();showProps()});
