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
