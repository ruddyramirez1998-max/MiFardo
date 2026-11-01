/* ============================================================
   MiFardo · Finanzas
   Ingresos, gastos y ganancia.
   ============================================================ */
'use strict';

const res = (vs, fs, gs) => {
  const ing = sum(vs.filter(v => v.pagado), v => v.precio), cos = sum(fs, f => f.costo), gas = sum(gs, g => g.monto);
  return { ing, cos, gas, gan: ing - cos - gas, cob: sum(vs.filter(v => !v.pagado), v => v.precio) }
};
R.finanzas = () => {
  const r = res(S.ventas, S.fardos, S.gastos);
  return `<div class="grid"><div class="stat"><span class="mut">Ingresos</span><b>${fmt(r.ing)}</b></div><div class="stat"><span class="mut">Por cobrar</span><b>${fmt(r.cob)}</b></div><div class="stat"><span class="mut">Costo fardos</span><b>${fmt(r.cos)}</b></div><div class="stat"><span class="mut">Gastos</span><b>${fmt(r.gas)}</b></div></div>
<div class="hero"><p>${r.gan>=0?'Ganancia':'Pérdida'} total</p><h1>${fmt(r.gan)}</h1></div>
<div class="card"><h2>Registrar gasto</h2><input id="gc" placeholder="Concepto (transporte, bolsas…)"><div class="two"><input id="gm" type="number" placeholder="Monto Bs"><select id="gf"><option value="">General</option>${S.fardos.map(f=>`<option value="${f.id}">${esc(f.nombre)}</option>`).join('')}</select></div><button class="btn big" onclick="addG()">Guardar gasto</button></div>
<div class="card"><h2>Gastos</h2>${S.gastos.slice().reverse().map(g=>`<div class="row"><div><b>${esc(g.concepto)}</b><span class="mut">${hm(g.fecha)}</span></div><b style="flex:none">${fmt(g.monto)}</b><button class="tag rm" onclick="delG(${g.id})">${ic('x')}</button></div>`).join('')||'<p class="mut">Sin gastos.</p>'}</div>`
};

async function addG() {
  const c = $('#gc').value.trim(), m = +$('#gm').value;
  if (!c || !m) return toast('Pon concepto y monto');
  await put('gastos', { concepto: c, monto: m, fecha: Date.now(), fardoId: +$('#gf').value || null });
  toast('Gasto guardado');
  render()
}

async function delG(id) {
  await del('gastos', id);
  render()
}
