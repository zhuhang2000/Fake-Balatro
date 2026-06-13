import type { GrainApi, GrainDeps } from '../types';

export function createGrain(deps: GrainDeps): GrainApi {
  const { $ } = deps;

  function makeGrain() {
    const c = document.createElement('canvas');
    c.width = 140;
    c.height = 140;
    const g = c.getContext('2d');
    if (!g) throw new Error('Missing 2D canvas context for grain texture');
    const im = g.createImageData(140, 140);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      im.data[i] = v;
      im.data[i + 1] = v;
      im.data[i + 2] = v;
      im.data[i + 3] = 13;
    }
    g.putImageData(im, 0, 0);
    $('#grain').style.backgroundImage = `url(${c.toDataURL()})`;
  }

  return { makeGrain };
}
