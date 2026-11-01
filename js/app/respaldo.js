/* ============================================================
   MiFardo · Respaldo
   Exportar e importar los datos del celular.
   ============================================================ */
'use strict';

R.respaldo = () => `<div class="card"><h2>Respaldo de datos</h2><p class="mut">Tus datos viven solo en este celular. Descarga una copia seguido.</p><br><button class="btn big" onclick="exp()">${ic('save')}Exportar respaldo</button><br><br><label class="btn big alt" style="display:block">${ic('up')}Importar respaldo<input type="file" accept=".json" hidden onchange="imp(this.files[0])"></label></div>`;

function exp() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }));
  a.download = 'mifardo-respaldo-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  toast('Respaldo descargado')
}

async function imp(f) {
  if (!f || !confirm('Esto reemplazará los datos actuales. ¿Continuar?')) return;
  const d = JSON.parse(await f.text());
  for (const s of ST) {
    for (const o of S[s]) await del(s, o.id);
    for (const o of d[s] || []) await put(s, o, 1)
  }
  await load();
  toast('Datos restaurados');
  render()
}
R.mas = () => `<div class="menu">${menu().slice(1).map(m=>`<a href="#${m[0]}"><span>${ic(m[2])}</span>${m[1]}</a>`).join('')}</div>`;
