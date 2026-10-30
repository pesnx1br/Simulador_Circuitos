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
