// Dados, estado global, unidades e componentes
const $=s=>document.querySelector(s);
const T={
V:{n:'Fonte DC',c:'Fontes',s:'V',p:{V:[12,'V','Tensão'],r:[0,'Ω','Res. interna']}},
AC:{n:'Fonte AC',c:'Fontes',s:'VA',p:{V:[10,'V','Tensão de pico'],f:[60,'Hz','Frequência'],r:[0,'Ω','Res. interna']}},
BAT:{n:'Bateria / pilha',c:'Fontes',s:'B',p:{V:[9,'V','Tensão'],r:[.5,'Ω','Res. interna']}},
I:{n:'Fonte de corrente',c:'Fontes',s:'I',p:{I:[.01,'A','Corrente']}},
R:{n:'Resistor',c:'Passivos',s:'R',p:{R:[1000,'Ω','Resistência'],P:[.25,'W','Potência máx.']}},
POT:{n:'Potenciômetro / reostato',c:'Passivos',s:'RV',p:{R:[10000,'Ω','Resistência total'],k:[50,'%','Cursor'],P:[.5,'W','Potência máx.']}},
C:{n:'Capacitor',c:'Passivos',s:'C',p:{C:[1e-6,'F','Capacitância'],v0:[0,'V','Tensão inicial']}},
L:{n:'Indutor / bobina',c:'Passivos',s:'L',p:{L:[.1,'H','Indutância'],i0:[0,'A','Corrente inicial']}},
D:{n:'Diodo',c:'Semicondutores',s:'D',p:{}},
LED:{n:'LED',c:'Semicondutores',s:'LED',p:{}},
LAMP:{n:'Lâmpada',c:'Cargas',s:'LP',p:{R:[100,'Ω','Resistência'],P:[5,'W','Potência nominal']}},
SW:{n:'Chave',c:'Cargas',s:'S',p:{closed:[1,'','Fechada (1/0)']}},
GND:{n:'Terra (referência)',c:'Referência',s:'GND',p:{}}};
const SI={p:1e-12,n:1e-9,u:1e-6,'µ':1e-6,m:1e-3,k:1e3,K:1e3,M:1e6,G:1e9};
function pv(s){s=String(s).trim().replace(/\s*(Hz|Ω|ohm|F|H|A|V|W|%|s)$/i,'');const m=s.match(/^([\d.eE+-]+)\s*([pnuµmkKMG])?$/);return m?parseFloat(m[1])*(SI[m[2]]||1):NaN}
function fm(v,u=''){if(!isFinite(v))return'—';const a=Math.abs(v);if(a<1e-15)return'0 '+u;for(const[s,x]of[[1e9,'G'],[1e6,'M'],[1e3,'k'],[1,''],[1e-3,'m'],[1e-6,'µ'],[1e-9,'n'],[1e-12,'p']])if(a>=s*.9995)return+(v/s).toPrecision(4)+' '+x+u;return v.toExponential(1)+' '+u}
let parts=[],wires=[],nid=1,sel=null,run=false,DT=5e-5,time=0,M=null,pend=null,view3=false,errs=[],buf=[];
const P=id=>parts.find(p=>p.id==id);
const tp=p=>{if(p.t=='GND')return[[p.x,p.y-20]];const a=p.rot&1?[[p.x,p.y-40],[p.x,p.y+40]]:[[p.x-40,p.y],[p.x+40,p.y]];return p.rot&2?a.reverse():a};
function add(t,x,y,rot=0,pr){const p={id:nid++,t,x,y,rot,pr:{}};for(const k in T[t].p)p.pr[k]=pr&&pr[k]!=null?pr[k]:T[t].p[k][0];p.nm=T[t].s+(parts.filter(q=>q.t==t).length+1);parts.push(p);return p}
function demo(){parts=[];wires=[];nid=1;const v=add('V',120,200,1),r=add('R',240,160,0,{R:470}),l=add('LED',320,200,1),g=add('GND',320,300);
wires=[{a:[v.id,0],b:[r.id,0]},{a:[r.id,1],b:[l.id,0]},{a:[l.id,1],b:[v.id,1]},{a:[l.id,1],b:[g.id,0]}];reset()}

// Motor de cálculo: análise nodal modificada (MNA), Euler implícito e Newton
// ---------- Simulação (MNA + Euler implícito + Newton) ----------
function build(){
const par={},fd=k=>{par[k]??=k;while(par[k]!==k){par[k]=par[par[k]];k=par[k]}return k},key=(p,t)=>tp(p)[t].join();
for(const w of wires){const a=P(w.a[0]),b=P(w.b[0]);if(a&&b)par[fd(key(a,w.a[1]))]=fd(key(b,w.b[1]))}
const g=parts.find(p=>p.t=='GND');if(!g)return{err:'Adicione um terra (GND): o circuito precisa de referência.'};
const cnt={};for(const p of parts)for(let t=0;t<tp(p).length;t++){const r=fd(key(p,t));cnt[r]=(cnt[r]||0)+1}
const idx={[fd(key(g,0))]:0};let nn=0;const open=[];
for(const p of parts){if(p.t=='GND')continue;p.n=[0,1].map(t=>{const r=fd(key(p,t));if(cnt[r]==1)open.push(p.nm);if(!(r in idx))idx[r]=++nn;return idx[r]})}
let m=0;for(const p of parts)if(['V','AC','BAT','L'].includes(p.t))p.k=nn+1+m++;
return{nn,N:nn+m,nl:parts.some(p=>p.t=='D'||p.t=='LED'),open,x:null}}
function reset(){time=0;buf=[];for(const p of parts)p.s={vp:p.pr.v0||0,ip:p.pr.i0||0,vd:0},p.r={v:0,i:0};M=build();errs=[]}
const gOf=p=>p.t=='R'||p.t=='LAMP'?1/Math.max(p.pr.R,1e-9):p.t=='POT'?1/Math.max(p.pr.R*p.pr.k/100,1e-3):p.pr.closed?1e3:1e-9;
const NLP=p=>p.t=='LED'?{Is:1e-18,n:2,vm:3}:{Is:1e-12,n:1,vm:1.2};
function gauss(A,N){for(let c=0;c<N;c++){let m=c;for(let r=c+1;r<N;r++)if(Math.abs(A[r][c])>Math.abs(A[m][c]))m=r;if(Math.abs(A[m][c])<1e-14)return null;[A[c],A[m]]=[A[m],A[c]];for(let r=0;r<N;r++)if(r!=c){const f=A[r][c]/A[c][c];if(f)for(let k=c;k<=N;k++)A[r][k]-=f*A[c][k]}}return A.map((r,i)=>r[N]/r[i])}
function step(){
const{N,nn}=M;let x=M.x||new Array(N).fill(0);const Vt=.025852;
for(let it=0;it<(M.nl?60:1);it++){
const A=Array.from({length:N},()=>new Array(N+1).fill(0));
const ad=(r,c,v)=>{if(r>0&&c>0)A[r-1][c-1]+=v},zs=(r,v)=>{if(r>0)A[r-1][N]+=v},G=(a,b,g)=>{ad(a,a,g);ad(b,b,g);ad(a,b,-g);ad(b,a,-g)};
for(let i=0;i<nn;i++)A[i][i]+=1e-9;
for(const p of parts){if(p.t=='GND')continue;const[a,b]=p.n,pr=p.pr;
if(['R','LAMP','POT','SW'].includes(p.t))G(a,b,gOf(p));
else if(p.t=='C'){const g=pr.C/DT;G(a,b,g);zs(a,g*p.s.vp);zs(b,-g*p.s.vp)}
else if(p.t=='I'){zs(a,-pr.I);zs(b,pr.I)}
else if(p.t=='L'){const k=p.k,q=pr.L/DT;ad(a,k,1);ad(b,k,-1);ad(k,a,1);ad(k,b,-1);ad(k,k,-q);zs(k,-q*p.s.ip)}
else if(p.t=='D'||p.t=='LED'){const o=NLP(p),nv=o.n*Vt,e=Math.exp(Math.min(p.s.vd,o.vm)/nv),gd=o.Is/nv*e+1e-12,ie=o.Is*(e-1)-gd*p.s.vd;G(a,b,gd);zs(a,-ie);zs(b,ie)}
else{const k=p.k,V=p.t=='AC'?pr.V*Math.sin(2*Math.PI*pr.f*time):pr.V;ad(a,k,1);ad(b,k,-1);ad(k,a,1);ad(k,b,-1);ad(k,k,-pr.r);zs(k,V)}}
const s=gauss(A,N);if(!s){M.sing=true;return}M.sing=false;x=s;
const vn=n=>n?x[n-1]:0;let ok=true;
for(const p of parts)if(p.t=='D'||p.t=='LED'){const nv=vn(p.n[0])-vn(p.n[1]),d=Math.abs(nv-p.s.vd);p.s.vd=Math.min(nv,p.s.vd+.15);if(d>1e-6)ok=false}
if(ok||!M.nl)break}
M.x=x;const vn=n=>n?x[n-1]:0;M.v=vn;
for(const p of parts){if(p.t=='GND')continue;const v=vn(p.n[0])-vn(p.n[1]);let i=0;
if(['R','LAMP','POT','SW'].includes(p.t))i=v*gOf(p);
else if(p.t=='C'){i=p.pr.C/DT*(v-p.s.vp);p.s.vp=v}
else if(p.t=='I')i=p.pr.I;
else if(p.t=='D'||p.t=='LED'){const o=NLP(p);i=o.Is*(Math.exp(Math.min(p.s.vd,o.vm)/(o.n*Vt))-1)}
else{i=x[p.k-1];if(p.t=='L')p.s.ip=i}
p.r={v,i}}time+=DT}
function checks(){const e=[];if(M.err)e.push(['e',M.err]);else{
if(M.sing)e.push(['e','Matriz singular: curto-circuito, laço de fontes ideais ou parte sem referência.']);
for(const n of M.open)e.push(['w',n+': terminal sem conexão.']);
for(const p of parts){if(!p.r)continue;const P=Math.abs(p.r.v*p.r.i),I=Math.abs(p.r.i);
if(p.pr.P&&P>p.pr.P*1.001)e.push(['e',`Sobrecarga em ${p.nm}: dissipa ${fm(P,'W')} (máx. ${fm(p.pr.P,'W')}).`]);
if(p.t=='LED'&&I>.03)e.push(['e',`${p.nm}: corrente de ${fm(I,'A')} acima de 30 mA, o LED queimaria.`]);
if(p.t=='D'&&I>1)e.push(['e',`${p.nm}: corrente de ${fm(I,'A')} excessiva.`]);
if(['V','BAT','AC'].includes(p.t)&&p.pr.r==0&&I>20)e.push(['e',`Possível curto-circuito na fonte ${p.nm}: ${fm(I,'A')}.`])}}return e}

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

// Cena 3D (three.js): componentes, fios e câmera
// ---------- 3D ----------
let ren,sc3,cam,grp,wl=[],sig='',orb={th:.6,ph:.9,d:16};
function init3(){ren=new THREE.WebGLRenderer({canvas:$('#c3'),antialias:true});sc3=new THREE.Scene();sc3.background=new THREE.Color(0x020407);sc3.fog=new THREE.Fog(0x020407,24,52);ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=1.25;ren.outputEncoding=THREE.sRGBEncoding;cam=new THREE.PerspectiveCamera(45,1,.1,200);
sc3.add(new THREE.HemisphereLight(0x9bbcff,0x1a2433,.9));const d=new THREE.DirectionalLight(0xffffff,1.1);d.position.set(6,12,7);d.castShadow=true;d.shadow.mapSize.set(1024,1024);Object.assign(d.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:40});sc3.add(d);const rl=new THREE.DirectionalLight(0x3dd6c6,.5);rl.position.set(-8,5,-6);sc3.add(rl);
const b=new THREE.Mesh(new THREE.BoxGeometry(40,.2,40),new THREE.MeshStandardMaterial({color:0x03080a,roughness:.9,metalness:0}));b.position.y=-.15;b.receiveShadow=true;sc3.add(b);const gh=new THREE.GridHelper(40,80,0x0f4a40,0x0a2a26);gh.position.y=-.04;sc3.add(gh);fit();
const c=$('#c3');let dn=false,mx=0,my=0;c.onmousedown=e=>{dn=true;mx=e.clientX;my=e.clientY};addEventListener('mouseup',e=>{if(dn&&e.target==c&&Math.hypot(e.clientX-mx,e.clientY-my)<4){const q=pick3(e);sel=q?q.id:null;showProps()}dn=false});
c.onmousemove=e=>{if(dn){orb.th-=e.movementX*.008;orb.ph=Math.max(.1,Math.min(1.5,orb.ph-e.movementY*.008));tipAt(e,null)}else tipAt(e,pick3(e))};c.onmouseleave=()=>tipAt(null,null);c.onwheel=e=>{e.preventDefault();orb.d=Math.max(4,Math.min(40,orb.d+e.deltaY*.01))}}
const mat=(c,e)=>new THREE.MeshStandardMaterial({color:c,emissive:e||0,roughness:.5});
function body(p){const g=new THREE.Group(),cy=(r,l,c,x=0)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,20),mat(c));m.rotation.z=Math.PI/2;m.position.x=x;return m};
const lead=cy(.05,2,0xaab4be);g.add(lead);let b;const t=p.t;
if(t=='R'||t=='POT')b=cy(.25,1,0xd9b36c);else if(t=='C')b=cy(.4,.7,0x2f6fd0);else if(t=='L'){b=new THREE.Mesh(new THREE.TorusGeometry(.35,.12,10,24),mat(0xb07be0));b.rotation.y=Math.PI/2;b.scale.set(1,1,1)}
else if(t=='V'||t=='AC'||t=='BAT'){b=new THREE.Mesh(new THREE.BoxGeometry(1,.8,.8),mat(0xd5604f))}
else if(t=='I')b=cy(.4,.8,0xf0b429);else if(t=='D')b=cy(.2,.8,0x222a33);
else if(t=='LED'||t=='LAMP'){b=new THREE.Mesh(new THREE.SphereGeometry(.4,20,16),mat(t=='LED'?0x802030:0x806010,0));p.em=b.material}
else if(t=='SW'){b=new THREE.Mesh(new THREE.BoxGeometry(.9,.3,.6),mat(0x4a5560));const l=new THREE.Mesh(new THREE.BoxGeometry(.9,.06,.1),mat(0xd0d8e0));l.position.set(0,.3,0);l.rotation.z=p.pr.closed?0:.5;g.add(l)}
else{b=new THREE.Mesh(new THREE.ConeGeometry(.4,.5,3),mat(0x9fb3c8));lead.visible=false}
if(b){if(['R','POT','C','LED','LAMP','I','D','L'].includes(t)&&t!='L')b.position.y=.3;g.add(b)}
return g}
const mt=(c,e,o)=>new THREE.MeshStandardMaterial({color:c,emissive:e??new THREE.Color(c).multiplyScalar(.22),roughness:.35,metalness:.2,...o});
function body2(p){const g=new THREE.Group(),t=p.t,pr=p.pr,A=(m,x=0,y=0,z=0)=>{m.position.set(x,y,z);g.add(m);return m},
cyl=(r,l,c,o)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,24),mt(c,undefined,o));m.rotation.z=Math.PI/2;return m},
cyv=(r,h,c,o)=>new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),mt(c,undefined,o)),
bx=(w,h,d,c,o)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt(c,undefined,o)),
sp=(r,c,e,o)=>new THREE.Mesh(new THREE.SphereGeometry(r,24,18),mt(c,e,o)),M_={metalness:.9,roughness:.2};
if(t!='GND'){A(cyl(.045,2,0xe2e8f0,M_));for(const s of[-1,1]){A(cyv(.07,.3,0xe2e8f0,M_),s,-.15);A(cyv(.17,.03,0xd4af37,M_),s,-.29)}}
if(t=='R'){A(cyl(.27,1,0xf3d9a4));const CL=[0x111111,0x8b4513,0xef4444,0xf97316,0xfacc15,0x22c55e,0x3b82f6,0x8b5cf6,0x9ca3af,0xffffff],R=Math.max(pr.R,1),e=Math.floor(Math.log10(R)),d1=Math.min(9,Math.floor(R/10**e)),d2=e>0?Math.floor(R/10**(e-1))%10:0,mu=Math.max(0,Math.min(9,e-1));[d1,d2,mu].forEach((c,i)=>A(cyl(.285,.09,CL[c]),-.28+i*.22));A(cyl(.285,.07,0xd4af37,M_),.38)}
else if(t=='POT'){A(bx(.95,.34,.8,0x2563eb));A(cyv(.22,.14,0xfbbf24,M_),0,.24);const ng=new THREE.Group(),n=bx(.3,.05,.06,0x111827);n.position.x=.09;ng.add(n);ng.position.y=.32;ng.rotation.y=-(pr.k/100*4.7-2.35);g.add(ng)}
else if(t=='C'){A(cyl(.34,.85,0x1d4ed8));A(cyl(.345,.14,0xcbd5e1,M_),.5);A(cyl(.345,.12,0x93c5fd),-.25)}
else if(t=='L'){const pts=[];for(let i=0;i<=120;i++){const u=i/120;pts.push(new THREE.Vector3(-.55+1.1*u,.3*Math.sin(u*Math.PI*10),.3*Math.cos(u*Math.PI*10)))}A(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),160,.055,8),mt(0xf97316,undefined,{metalness:.7,roughness:.25})))}
else if(t=='BAT'){A(cyl(.36,1.1,0x16a34a));A(cyl(.365,.35,0x15803d),.3);A(cyl(.14,.16,0xfacc15,M_),-.63)}
else if(t=='V'){A(bx(1,.62,.8,0xf43f5e));A(bx(.9,.04,.7,0x111827),0,.33);A(bx(.22,.05,.05,0xffffff),-.3,.37);A(bx(.05,.05,.22,0xffffff),-.3,.37);A(bx(.22,.05,.05,0xffffff),.3,.37)}
else if(t=='AC'){A(cyv(.46,.5,0x8b5cf6));const tr=new THREE.Mesh(new THREE.TorusGeometry(.26,.04,8,28),mt(0xffffff));tr.rotation.x=Math.PI/2;A(tr,0,.27)}
else if(t=='I'){A(cyv(.46,.5,0xf59e0b));const ar=new THREE.Mesh(new THREE.ConeGeometry(.16,.4,16),mt(0xffffff));ar.rotation.z=-Math.PI/2;A(ar,.05,.3)}
else if(t=='D'){A(cyl(.2,.7,0x1f2937));A(cyl(.21,.12,0xe5e7eb,M_),.28)}
else if(t=='LED'){A(cyv(.36,.1,0xdbeafe,{metalness:.5}),0,-.05);const dm=new THREE.Mesh(new THREE.SphereGeometry(.34,24,16,0,Math.PI*2,0,Math.PI/2),mt(0x9f1239,0,{transparent:true,opacity:.92}));A(dm,0,0);p.em=dm.material;p.pl=new THREE.PointLight(0xff2a4a,0,4);A(p.pl,0,.4)}
else if(t=='LAMP'){A(cyv(.2,.35,0x94a3b8,M_),0,-.05);const gl=sp(.42,0xfff7d6,0,{transparent:true,opacity:.55});A(gl,0,.42);p.em=gl.material;const fl=new THREE.Mesh(new THREE.TorusGeometry(.14,.025,6,16),mt(0xffd166,0xffb020));A(fl,0,.42);p.pl=new THREE.PointLight(0xffc050,0,5);A(p.pl,0,.45)}
else if(t=='SW'){A(bx(1.1,.2,.7,0x334155),0,-.1);for(const s of[-.45,.45])A(sp(.12,0xfbbf24,undefined,M_),s,.05);const lv=bx(.95,.07,.14,pr.closed?0x22c55e:0xef4444);lv.geometry.translate(.475,0,0);lv.position.set(-.45,.1,0);lv.rotation.z=pr.closed?0:.7;g.add(lv)}
else{A(bx(.06,.06,.3,0x94a3b8),0,0,.15);[[1,.35],[.66,.55],[.32,.75]].forEach(([w,z])=>A(bx(w,.08,.07,0x38bdf8),0,0,z))}
return g}
function build3(){if(grp)sc3.remove(grp);grp=new THREE.Group();wl=[];let cx=0,cy=0;for(const p of parts){cx+=p.x;cy+=p.y}cx/=parts.length||1;cy/=parts.length||1;const X=x=>(x-cx)/40,Z=y=>(y-cy)/40;
for(const p of parts){const g=body2(p);g.userData.pid=p.id;g.position.set(X(p.x),.3,Z(p.y));g.rotation.y=-p.rot*Math.PI/2;if(p.t=='GND')g.position.z=Z(p.y-20);grp.add(g)}
for(const w of wires){const a=P(w.a[0]),b=P(w.b[0]);if(!a||!b)continue;const pa=tp(a)[w.a[1]],pb=tp(b)[w.b[1]];const vs=qp(w,pa,pb).map(q=>new THREE.Vector3(X(q[0]),.3,Z(q[1]))),cp=new THREE.CurvePath();for(let i=0;i<2;i++)if(vs[i].distanceTo(vs[i+1])>1e-6)cp.add(new THREE.LineCurve3(vs[i],vs[i+1]));const l=new THREE.Mesh(cp.curves.length?new THREE.TubeGeometry(cp,60,.05,8):new THREE.SphereGeometry(.05),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3,metalness:.3}));DG??=new THREE.SphereGeometry(.09,10,8);DM??=new THREE.MeshBasicMaterial({color:0xffe066});const q=qp(w,pa,pb),L=Math.hypot(q[1][0]-q[0][0],q[1][1]-q[0][1])+Math.hypot(q[2][0]-q[1][0],q[2][1]-q[1][1]),ds=[];for(let k=0;k<Math.ceil(L/16)+1;k++){const m=new THREE.Mesh(DG,DM);m.visible=false;grp.add(m);ds.push(m)}l.userData={p:a,t:w.a[1],w,q,c:[cx,cy],dots:ds};grp.add(l);wl.push(l)}
grp.traverse(o=>{if(o.isMesh)o.castShadow=true});sc3.add(grp)}
function draw3(){const s=ser().replace(/"nm":"[^"]*"/g,'')+parts.map(p=>p.pr.closed).join();if(s!=sig){sig=s;build3()}
const live=run||time>0;const vm=Math.max(1,...parts.map(p=>p.pr.V||0));wl.forEach(l=>{const{p,t}=l.userData,on=live&&M&&M.v&&p.n,c=on?`hsl(${Math.round(215-Math.min(1,Math.abs(M.v(p.n[t]))/vm)*215)},95%,58%)`:'#8aa0b5';l.material.color.set(c);l.material.emissive.set(c).multiplyScalar(on?.55:.1)});
for(const l of wl){const u=l.userData,on=live&&SPM.get(u.w),ph=PH.get(u.w)||0;u.dots.forEach((m,k)=>{const s=on?along(u.q,((ph%16)+16)%16+k*16):null;m.visible=!!s;if(s)m.position.set((s[0]-u.c[0])/40,.3,(s[1]-u.c[1])/40)})}for(const p of parts)if(p.em){const b=live&&p.r?(p.t=='LED'?Math.min(1,Math.max(0,p.r.i)/.015):Math.min(1,Math.abs(p.r.v*p.r.i)/p.pr.P)):0;p.em.emissive.set(p.t=='LED'?0xff2040:0xffc040);p.em.emissiveIntensity=b*2.6;if(p.pl)p.pl.intensity=b*3}
if(!selMk){selMk=new THREE.Mesh(new THREE.TorusGeometry(1.15,.04,8,48),new THREE.MeshBasicMaterial({color:0x3dd6c6}));selMk.rotation.x=Math.PI/2;sc3.add(selMk)}const sg=grp&&sel!=null&&grp.children.find(o=>o.userData.pid==sel);selMk.visible=!!sg;if(sg)selMk.position.set(sg.position.x,-.03,sg.position.z);
cam.position.set(Math.sin(orb.th)*Math.cos(orb.ph)*orb.d,Math.sin(orb.ph)*orb.d,Math.cos(orb.th)*Math.cos(orb.ph)*orb.d);cam.lookAt(0,0,0);ren.render(sc3,cam)}
$('#bView').onclick=()=>{view3=!view3;if(view3&&!ren)init3();c2.style.display=view3?'none':'block';$('#c3').style.display=view3?'block':'none';$('#bView').textContent=view3?'Ver em 2D':'Ver em 3D';$('#bView').classList.toggle('on',view3);fit()};

// Animação do fluxo de corrente e dicas ao passar o mouse
// ---------- Animação do fluxo e dicas ----------
let DG,DM,hov=null,fdt=0;const PH=new Map(),SPM=new Map(),rc=typeof THREE!='undefined'?new THREE.Raycaster():null,mv=typeof THREE!='undefined'?new THREE.Vector2():null;
const qp=(w,pa,pb)=>[pa,w.vf?[pa[0],pb[1]]:[pb[0],pa[1]],pb];
function along(q,d){for(let i=0;i<2;i++){const l=Math.hypot(q[i+1][0]-q[i][0],q[i+1][1]-q[i][1]);if(d<=l)return l?[q[i][0]+(q[i+1][0]-q[i][0])*d/l,q[i][1]+(q[i+1][1]-q[i][1])*d/l]:q[i];d-=l}return null}
function wflow(w){const a=P(w.a[0]),b=P(w.b[0]);if(!a||!b)return 0;const n=(p,t)=>wires.filter(x=>x.a[0]==p.id&&x.a[1]==t||x.b[0]==p.id&&x.b[1]==t).length,cu=(p,t)=>p.r&&p.t!='GND'?(t?p.r.i:-p.r.i):null;
const fa=cu(a,w.a[1]),cb=cu(b,w.b[1]),fb=cb==null?null:-cb;if(fa!=null&&n(a,w.a[1])==1)return fa;if(fb!=null&&n(b,w.b[1])==1)return fb;return fa??fb??0}
function advance(){for(const w of wires){const f=wflow(w),sp=Math.abs(f)<1e-7?0:Math.sign(f)*Math.min(90,10+25*Math.log10(1+Math.abs(f)*1e4));SPM.set(w,sp);PH.set(w,(PH.get(w)||0)+sp*fdt)}}
function dots(c,w,pa,pb){if(!(time>0)||!SPM.get(w))return;const q=qp(w,pa,pb),ph=PH.get(w)||0;c.fillStyle='#f0b429';for(let d=((ph%16)+16)%16;;d+=16){const s=along(q,d);if(!s)break;c.beginPath();c.arc(s[0],s[1],2.8,0,7);c.fill()}}
function tipHTML(p){let h=`<b>${p.nm}</b> · ${T[p.t].n}`;for(const k in T[p.t].p){const[,u,l]=T[p.t].p[k];h+=`<br>${l}: ${fm(p.pr[k],u)}`}if(p.r&&p.t!='GND'&&time>0)h+=`<br><span class="k">V = ${fm(p.r.v,'V')}<br>I = ${fm(p.r.i,'A')}<br>P = ${fm(p.r.v*p.r.i,'W')}</span>`;return h}
function tipAt(e,p){const t=$('#tip');hov=p?p.id:null;if(!p){t.style.display='none';return}const r=$('#cv').getBoundingClientRect();t.innerHTML=tipHTML(p);t.style.display='block';t.style.left=Math.max(0,Math.min(e.clientX-r.left+14,r.width-190))+'px';t.style.top=(e.clientY-r.top+14)+'px'}
function pick3(e){if(!grp)return;const r=$('#c3').getBoundingClientRect();mv.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);rc.setFromCamera(mv,cam);for(const x of rc.intersectObjects(grp.children.filter(o=>o.type=='Group'),true)){let o=x.object;while(o&&o.userData.pid==null)o=o.parent;if(o)return P(o.userData.pid)}}

// Modo Calcular Circuito
// ---------- Modo Calcular ----------
const CT=['BAT','V','AC','I','R','POT','C','L','SW','D','LED','LAMP'],isSrc=r=>['V','AC','BAT','I'].includes(r.t);
const mkRow=(t,n)=>{const pr={};for(const k in T[t].p)pr[k]=T[t].p[k][0];return{t,pr,n:n||[1,0]}};
let rows=[mkRow('BAT'),mkRow('SW'),mkRow('R'),mkRow('L')],topo='s';rows[0].pr.V=12;rows[0].pr.r=0;rows[2].pr.R=100;rows[3].pr.L=.05;
$('#ct').innerHTML=CT.map(t=>`<option value="${t}">${T[t].n}</option>`).join('');
function cUI(){$('#cr').innerHTML=rows.map((r,i)=>`<div class="cr"><b>${T[r.t].n} ${i+1}</b>${Object.keys(T[r.t].p).map(k=>`<label>${T[r.t].p[k][2]} <input data-i="${i}" data-k="${k}" value="${fm(r.pr[k],T[r.t].p[k][1])}"></label>`).join('')}${topo=='c'?[0,1].map(t=>`<label>${t?'Nó B':'Nó A'} <input data-i="${i}" data-n="${t}" value="${r.n[t]}" size="3"></label>`).join(''):''}<button data-x="${i}">Remover</button></div>`).join('')}
$('#cr').onchange=e=>{const d=e.target.dataset,r=rows[d.i];if(d.k){const v=pv(e.target.value);if(!isNaN(v)&&v>=0)r.pr[d.k]=v}else r.n[d.n]=e.target.value;cUI()};
$('#cr').onclick=e=>{const x=e.target.dataset.x;if(x!=null){rows.splice(+x,1);cUI()}};
$('#cAdd').onclick=()=>{rows.push(mkRow($('#ct').value,[rows.length,0]));cUI()};
$('#topo').onchange=e=>{topo=e.target.value;if(topo=='c')rows.forEach((r,i)=>r.n=[i?i:1,i?(i==rows.length-1?0:i+1):0]);cUI()};
$('#cX').onclick=()=>$('#calc').close();$('#rX').onclick=()=>$('#rep').close();
$('#hM').onclick=()=>$('#home').style.display='none';$('#hC').onclick=()=>{$('#home').style.display='none';cUI();$('#calc').showModal()};$('#bHome').onclick=()=>$('#home').style.display='flex';
function construct(R,tp_){
if(!R.some(isSrc))return'Falta uma fonte de alimentação (bateria, fonte DC/AC ou de corrente).';if(R.length<2)return'Adicione ao menos um componente além da fonte.';
const f=R.find(isSrc),O=tp_=='c'?R:[f,...R.filter(r=>r!=f)];parts=[];wires=[];nid=1;sel=null;
const ps=O.map((r,i)=>{const s=tp_=='s'&&i>0;return add(r.t,s?240+(i-1)*100:120+i*100,s?160:200,s?0:1,r.pr)});
const W=(a,ta,b,tb,vf)=>wires.push({a:[a.id,ta],b:[b.id,tb],vf}),g=add('GND',60,300),n=ps.length;let gt;
if(tp_=='s'){W(ps[0],0,ps[1],0);for(let i=1;i<n-1;i++)W(ps[i],1,ps[i+1],0);W(ps[n-1],1,ps[0],1,true);gt=[ps[0],1]}
else if(tp_=='p'){for(let i=0;i<n-1;i++){W(ps[i],0,ps[i+1],0);W(ps[i],1,ps[i+1],1)}gt=[ps[0],1]}
else{const nets={};for(let i=0;i<n;i++)for(let t=0;t<2;t++){const k=parseInt(O[i].n[t]);if(isNaN(k))return`Informe um número inteiro de nó em ${ps[i].nm}.`;(nets[k]??=[]).push([ps[i],t])}
if(!nets[0])return'Defina o nó 0 (terra) em algum terminal.';
for(const k in nets){const L=nets[k];if(L.length<2&&k!=0)return`O nó ${k} tem só um terminal: ligue-o a outro componente.`;for(let i=0;i<L.length-1;i++)W(L[i][0],L[i][1],L[i+1][0],L[i+1][1],L[i][1]!=L[i+1][1]);}gt=[nets[0][0][0],nets[0][0][1]]}
W(g,0,gt[0],gt[1],true);return null}
function analytic(){const S=rows.find(isSrc),o=[],B=rows.filter(r=>!isSrc(r));
if(topo=='c')return['Topologia personalizada: o motor resolve o sistema pela análise nodal modificada (tabela abaixo).'];if(S.t=='I')return[`Fonte de corrente: I = ${fm(S.pr.I,'A')}.`];
const V=S.pr.V,f=S.t=='AC'?S.pr.f:0,w=2*Math.PI*f,rv=r=>r.t=='POT'?r.pr.R*r.pr.k/100:r.pr.R,RR=B.filter(r=>['R','POT','LAMP'].includes(r.t)),Ls=B.filter(r=>r.t=='L'),Cs=B.filter(r=>r.t=='C');
if(topo=='s'){if(B.some(r=>r.t=='SW'&&!r.pr.closed))return['Há uma chave aberta em série: I = 0 A e toda a tensão da fonte aparece sobre a chave.'];
const R=RR.reduce((a,r)=>a+rv(r),0)+(S.pr.r||0);o.push(`R_eq = ΣR = ${[...RR.map(rv),S.pr.r||0].map(x=>fm(x)).join(' + ')} = ${fm(R,'Ω')}`);
const XL=w*Ls.reduce((a,r)=>a+r.pr.L,0),XC=f?Cs.reduce((a,r)=>a+1/(w*r.pr.C),0):0;
if(f){const Z=Math.hypot(R,XL-XC),ph=Math.atan2(XL-XC,R);o.push(`X_L = 2π·f·L = ${fm(XL,'Ω')}`,`X_C = 1/(2π·f·C) = ${fm(XC,'Ω')}`,`|Z| = √(R² + (X_L − X_C)²) = ${fm(Z,'Ω')}`,`I_pico = V/|Z| = ${fm(V,'V')} / ${fm(Z,'Ω')} = ${fm(V/Z,'A')}`,`φ = arctan((X_L − X_C)/R) = ${(ph*180/Math.PI).toFixed(2)}°`,`P_média = ½·V·I·cosφ = ${fm(.5*V*V/Z*Math.cos(ph),'W')}`)}
else if(Cs.length)o.push(`Em CC o capacitor bloqueia a corrente: I(∞) = 0 A. τ = R·C = ${fm(R*Cs[0].pr.C,'s')}.`);
else if(R>0){o.push(`I = V/R_eq = ${fm(V,'V')} / ${fm(R,'Ω')} = ${fm(V/R,'A')}`,`P = V·I = ${fm(V*V/R,'W')}`);if(Ls.length)o.push(`Indutor: τ = L/R = ${fm(Ls[0].pr.L/R,'s')}; i(t) = I·(1 − e^(−t/τ))`)}else o.push('R_eq = 0: curto-circuito ideal, corrente indefinida.');return o}
o.push(`Todos os ramos recebem V = ${fm(V,'V')}.`);const G=RR.reduce((a,r)=>a+1/rv(r),0);if(RR.length)o.push(`1/R_eq = Σ(1/R) = ${RR.map(r=>'1/'+fm(rv(r))).join(' + ')} → R_eq = ${fm(1/G,'Ω')}`);
const IR=V*G,IL=f?Ls.reduce((a,r)=>a+V/(w*r.pr.L),0):0,IC=f?Cs.reduce((a,r)=>a+V*w*r.pr.C,0):0;o.push(`I_R = V·ΣG = ${fm(IR,'A')}`);
if(f)o.push(`I_L = V/X_L = ${fm(IL,'A')}; I_C = V·ω·C = ${fm(IC,'A')}`,`I_total = √(I_R² + (I_C − I_L)²) = ${fm(Math.hypot(IR,IC-IL),'A')}`);else{o.push(`I_total (regime CC) = ${fm(IR,'A')}`);if(Ls.length)o.push('Atenção: indutor ideal em paralelo com fonte CC: i(t) = V·t/L cresce sem limite.')}return o}
function showRep(E,Ts){$('#rb').innerHTML='<h3 style="margin-top:0">Resultados e passo a passo</h3>'+analytic().map(x=>`<div style="margin:3px 0">${x}</div>`).join('')+`<h4>Valores do motor (MNA) em t = ${fm(Ts,'s')}</h4><table><tr><th>Peça<th>V<th>I<th>P</tr>`+parts.filter(p=>p.r&&p.t!='GND').map(p=>`<tr><td>${p.nm}<td>${fm(p.r.v,'V')}<td>${fm(p.r.i,'A')}<td>${fm(p.r.v*p.r.i,'W')}</tr>`).join('')+`</table><div style="margin-top:6px">Energia fornecida em ${fm(Ts,'s')}: ${fm(E,'J')}</div>`;$('#rep').showModal()}
$('#cGo').onclick=()=>{const er=construct(rows,topo);$('#cerr').textContent=er||'';if(er)return;const S=rows.find(isSrc),f=S.t=='AC'?S.pr.f:0;DT=f?Math.min(5e-5,1/(f*400)):5e-5;$('#dt').value=fm(DT,'s');
reset();if(M.err){$('#cerr').textContent=M.err;return}const Ts=Math.min(pv($('#tsim').value)||.2,3e5*DT);let E=0;
for(let n=Math.round(Ts/DT);n>0;n--){step();for(const p of parts)if(p.r&&p.r.v*p.r.i<0)E-=p.r.v*p.r.i*DT}
buf=[];$('#calc').close();showProps();run=true;showRep(E,Ts)};
function sim(Tm,dt,rw,tp_){const o=DT;DT=dt;construct(rw,tp_);reset();for(let n=Math.round(Tm/dt);n>0;n--)step();DT=o;return parts}
$('#cTest').onclick=()=>{const bk=[parts,wires,nid],R=(t,p)=>Object.assign(mkRow(t),{pr:{...mkRow(t).pr,...p}}),out=[];
const chk=(nm,got,exp,tol)=>{const ok=Math.abs(got-exp)<=tol*Math.abs(exp);out.push(`<div class="${ok?'k':'e'}">${ok?'OK':'FALHA'} · ${nm}: obtido ${fm(got)}, esperado ${fm(exp)}</div>`)};
let p=sim(.01,1e-5,[R('V',{V:12,r:0}),R('R',{R:100}),R('R',{R:200})],'s');chk('Série 100Ω + 200Ω: corrente (A)',Math.abs(p[0].r.i),.04,1e-3);
p=sim(.01,1e-5,[R('V',{V:12,r:0}),R('R',{R:100}),R('R',{R:300})],'p');chk('Paralelo 100Ω ∥ 300Ω: corrente total (A)',Math.abs(p[0].r.i),.16,1e-3);
p=sim(.001,1e-5,[R('V',{V:10,r:0}),R('R',{R:1000}),R('C',{C:1e-6})],'s');chk('RC em t = τ: tensão do capacitor (V)',p[2].r.v,6.3212,.01);
p=sim(5e-4,5e-6,[R('V',{V:12,r:0}),R('R',{R:100}),R('L',{L:.05})],'s');chk('RL em t = τ: corrente (A)',Math.abs(p[0].r.i),.12*.63212,.01);
[parts,wires,nid]=bk;sel=null;reset();$('#rb').innerHTML='<h3 style="margin-top:0">Testes automáticos do motor</h3>'+out.join('');$('#rep').showModal()};

// Laço principal e inicialização
// ---------- Laço principal ----------
function loop(){const now=performance.now();fdt=Math.min(.05,(now-(loop.t||now))/1000);loop.t=now;if(hov){const q=P(hov);if(q)$('#tip').innerHTML=tipHTML(q)}if(run&&M&&!M.err)advance();if(run&&M&&!M.err){const n=Math.max(1,Math.round(.016/DT));for(let i=0;i<Math.min(n,400);i++)step();const p=P(sel);if(p&&p.r){buf.push({...p.r});if(buf.length>240)buf.shift()}}
else if(!M||(!M.v&&!M.err)){}
view3&&ren?draw3():draw2();drawScope();panel();$('#bRun').classList.toggle('on',run);requestAnimationFrame(loop)}
let selMk;function delSel(){const p=P(sel);if(!p)return;parts=parts.filter(q=>q!=p);wires=wires.filter(w=>w.a[0]!=p.id&&w.b[0]!=p.id);sel=null;tipAt(null,null);reset();showProps()}
rb('#bDel',delSel);
function rot(n){const p=P(sel);if(p&&p.t!='GND'){p.rot=(p.rot+n)%4;reset()}}
rb('#bRot',()=>rot(1));rb('#bFlip',()=>rot(2));
demo();showProps();fit();loop();

