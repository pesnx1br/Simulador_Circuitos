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
