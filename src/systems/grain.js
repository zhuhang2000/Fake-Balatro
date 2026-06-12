/* Procedural CRT grain texture. */
((root) => {
  function createGrain(deps) {
    const { $ } = deps;

    function makeGrain() {
      const c = document.createElement('canvas');
      c.width = c.height = 140;
      const g = c.getContext('2d');
      const im = g.createImageData(140, 140);
      for (let i = 0; i < im.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
        im.data[i + 3] = 13;
      }
      g.putImageData(im, 0, 0);
      $('#grain').style.backgroundImage = `url(${c.toDataURL()})`;
    }

    return { makeGrain };
  }

  const api = { createGrain };
  root.JokerGrain = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
