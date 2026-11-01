/* ============================================================
   MiFardo · Ventas
   Listado de ventas, cambio de estado de pago y eliminación.
   ============================================================ */
'use strict';

R.ventas = () => {
  const l = vend().filter(v => Q.pg == 'todos' || (Q.pg == 'pend') == !v.pagado);
  return pills('pg', [['todos', 'Todas'], ['pend', 'Pendientes'], ['pag', 'Pagadas']]) + `<div class="card">${l.map(v=>vrow(v).replace('</button></div>',`</button><button class="tag rm" onclick="delV(${v.id})">${ic('x')}</button></div>`)).join('')||'<p class="mut">Sin ventas en este filtro.</p>'}</div>`
};

async function delV(id) {
  if (!confirm('¿Eliminar venta? La prenda quedará disponible.')) return;
  const v = S.ventas.find(x => x.id == id), p = S.prendas.find(x => x.id == v.prendaId);
  if (p) {
    p.estado = 'disponible';
    await put('prendas', p, 1)
  }
  await del('ventas', id);
  render()
}
