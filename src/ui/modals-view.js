/* Modal visibility and hand table rendering. */
((root) => {
  function createModalsView(deps) {
    const { $, state, HAND_ORDER, getHandStats } = deps;

    function showModal(sel) {
      $(sel).classList.remove('hidden');
    }

    function hideModal(sel) {
      $(sel).classList.add('hidden');
    }

    function hideModals() {
      document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
    }

    function buildHandTable() {
      const tb = $('#handTable');
      tb.innerHTML =
        '<tr><td style="color:var(--text-dim)">牌型</td><td style="color:var(--text-dim)">基础筹码</td><td style="color:var(--text-dim)">基础倍率</td></tr>';
      HAND_ORDER.forEach((k) => {
        const t = getHandStats(k, state.handLevels);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${t.name} Lv.${t.level}</td><td>${t.chips}</td><td>×${t.mult}</td>`;
        tb.appendChild(tr);
      });
    }

    return { showModal, hideModal, hideModals, buildHandTable };
  }

  const api = { createModalsView };
  root.JokerModalsView = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
