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
