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
