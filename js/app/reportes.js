/* ============================================================
   MiFardo · Reportes
   Resultados por fardo y por periodo.
   ============================================================ */
'use strict';

R.reportes = () => {
  const d = Date.now(), ok = t => Q.per == 'todo' || (Q.per == 'hoy' ? sameDay(t, d) : d - t < (Q.per == 'sem' ? 7 : 30) * 864e5), vs = S.ventas.filter(v => ok(v.fecha)), days = [...Array(7)].map((_, i) => {
    const x = new Date(d - (6 - i) * 864e5);
    return [x.toLocaleDateString('es-BO', { weekday: 'short' }), sum(S.ventas.filter(v => sameDay(v.fecha, x)), v => v.precio)]
  }), mx = Math.max(1, ...days.map(x => x[1]));
  return pills('per', [['hoy', 'Hoy'], ['sem', '7 días'], ['mes', '30 días'], ['todo', 'Todo']]) + `<div class="card"><h2>Ventas últimos 7 días</h2><div class="chart" style="margin-bottom:22px">${days.map(x=>`<div style="height:${x[1]/mx*100}%"><small>${x[0]}</small></div>`).join('')}</div></div>
<div class="card"><h2>Resultado por fardo</h2><div style="overflow-x:auto"><table><tr><th>Fardo</th><th>Vend.</th><th>Ingreso</th><th>Costo</th><th>Gasto</th><th>Ganancia</th></tr>${S.fardos.map(f=>{const v=vs.filter(x=>x.fardoId==f.id),r=res(v,[f],S.gastos.filter(g=>g.fardoId==f.id));return`<tr><td>${esc(f.nombre)}</td><td>${v.length}</td><td>${fmt(r.ing)}</td><td>${fmt(r.cos)}</td><td>${fmt(r.gas)}</td><td><b style="color:${r.gan>=0?'#2E9E6B':'#D9456A'}">${fmt(r.gan)}</b></td></tr>`}).join('')}</table></div><p class="mut">El costo del fardo se descuenta completo en cada periodo.</p></div>`
};
