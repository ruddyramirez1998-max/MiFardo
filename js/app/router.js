/* ============================================================
   MiFardo · Navegación
   Menú, barra inferior y cambio de pantallas.
   ============================================================ */
'use strict';

function render() {
  if (!sessionStorage.ff_ok) return;
  const v = location.hash.slice(1) || 'dash';
  if (!R[v]) return;
  const t = (menu().find(m => m[0] == v) || [0, 'Menú'])[1];
  $('#ttl').textContent = v == 'dash' ? 'MiFardo' : t;
  $('#main').innerHTML = R[v]();
  R[v + '_i'] && R[v + '_i']();
  $('#side').innerHTML = `<img src="icons/logo.png" alt="MiFardo">` + menu().map(m => `<a href="#${m[0]}" class="${m[0]==v?'on':''}">${m[2]} ${m[1]}</a>`).join('');
  $('#bar').innerHTML = [['dash', 'Inicio', 'home'], ['ventas', 'Ventas', 'bag'], ['live', 'Live', 'live'], ['entregas', 'Entregas', 'truck'], ['mas', 'Más', 'menu']].map(m => `<a href="#${m[0]}" class="${m[0]==v?'on':''} ${m[0]=='live'?'live':''}"><span>${ic(m[2])}</span>${m[1]}</a>`).join('')
}
window.addEventListener('hashchange', () => {
  render();
  scrollTo(0, 0);
  const m = $('#main');
  m.classList.remove('enter');
  void m.offsetWidth;
  m.classList.add('enter')
});
let PU = null;
