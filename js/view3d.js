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
