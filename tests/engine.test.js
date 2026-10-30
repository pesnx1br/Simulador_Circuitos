// Testes do motor de cálculo: compara a simulação com as fórmulas teóricas.
// Uso: node tests/engine.test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
const tests = `
const out = []; let fail = 0;
const chk = (n, g, e, t) => { const ok = Math.abs(g - e) <= t * Math.abs(e); if (!ok) fail++; out.push((ok ? 'OK     ' : 'FALHA  ') + n + ': obtido ' + g.toPrecision(5) + ', esperado ' + e.toPrecision(5)); };
const W = (a, ta, b, tb) => wires.push({ a: [a.id, ta], b: [b.id, tb] });
function runSim(T, dt, fn, each) { parts = []; wires = []; nid = 1; fn(); DT = dt; reset(); if (M.err) throw new Error(M.err);
  for (let n = Math.round(T / dt); n > 0; n--) { step(); if (each) each(); } }
const loop3 = (v, comps) => { let prev = v, hold = 0; comps.forEach(c => { W(prev, hold, c, 0); prev = c; hold = 1; }); W(prev, 1, v, 1); const g = add('GND', 0, 100); W(g, 0, v, 1); };

runSim(.01, 1e-5, () => { const v = add('V', 0, 0, 1, { V: 12, r: 0 }); loop3(v, [add('R', 100, 0, 0, { R: 100 }), add('R', 200, 0, 0, { R: 200 })]); });
chk('Serie 100+200 ohm, corrente (A)', Math.abs(parts[0].r.i), .04, 1e-3);

runSim(.01, 1e-5, () => { const v = add('V', 0, 0, 1, { V: 12, r: 0 }), a = add('R', 100, 0, 1, { R: 100 }), b = add('R', 200, 0, 1, { R: 300 }), g = add('GND', 0, 100);
  W(v, 0, a, 0); W(a, 0, b, 0); W(v, 1, a, 1); W(a, 1, b, 1); W(g, 0, v, 1); });
chk('Paralelo 100||300 ohm, corrente total (A)', Math.abs(parts[0].r.i), .16, 1e-3);

runSim(.001, 1e-5, () => { const v = add('V', 0, 0, 1, { V: 10, r: 0 }); loop3(v, [add('R', 100, 0, 0, { R: 1000 }), add('C', 200, 0, 0, { C: 1e-6 })]); });
chk('RC em t=tau, tensao do capacitor (V)', parts[2].r.v, 10 * (1 - Math.exp(-1)), .01);

runSim(5e-4, 5e-6, () => { const v = add('V', 0, 0, 1, { V: 12, r: 0 }); loop3(v, [add('R', 100, 0, 0, { R: 100 }), add('L', 200, 0, 0, { L: .05 })]); });
chk('RL em t=tau, corrente (A)', Math.abs(parts[0].r.i), .12 * (1 - Math.exp(-1)), .01);

runSim(.01, 1e-5, () => { const v = add('V', 0, 0, 1, { V: 5, r: 0 }); loop3(v, [add('R', 100, 0, 0, { R: 330 }), add('LED', 200, 0, 0, {})]); });
chk('LED em serie: lei de Kirchhoff (A)', parts[2].r.i, (5 - parts[2].r.v) / 330, 1e-3);

let pk = 0, f = 60; const dt = 1 / (f * 400);
runSim(.1, dt, () => { const v = add('AC', 0, 0, 1, { V: 10, f, r: 0 }); loop3(v, [add('R', 100, 0, 0, { R: 100 }), add('L', 200, 0, 0, { L: .05 })]); }, () => { if (time > .08) pk = Math.max(pk, Math.abs(parts[0].r.i)); });
const XL = 2 * Math.PI * f * .05; chk('RL em AC, corrente de pico = V/|Z| (A)', pk, 10 / Math.hypot(100, XL), .01);

out.push(fail ? fail + ' teste(s) falharam' : 'Todos os testes passaram'); console.log(out.join('\\n')); process.exitCode = fail ? 1 : 0;
`;
vm.runInNewContext(src('core.js') + src('engine.js') + tests, { console, Math, process });
