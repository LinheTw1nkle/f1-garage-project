'use strict';

function createPartLabels(onSelect) {
  const root = document.getElementById('partLabels');
  const svg = root.querySelector('svg');
  const panels = root.querySelector('.part-label-panels');
  const names = {Cockpit:'COCKPIT',Frontwing:'FRONT WING',Rearwing:'REAR WING',Sidepod:'SIDEPOD',Tire:'TYRE'};
  const descriptions = {Cockpit:'Drivers / Teams',Frontwing:'Circuits',Rearwing:'Race Results',Sidepod:'Information',Tire:'Tyre Strategy'};
  let activeKey = null, pointerKey = null, selectTimer = null, exitTimer;
  let lastMatrix = null, lastWidth = 0, lastHeight = 0, lastMeshes = null, lastAngle = 0, lastElevation = 0;
  let navigationTop = Infinity;
  const sizes = new Map();

  function activate(key) {
    if (activeKey === key) return;
    activeKey = key;
    root.classList.toggle('has-active', !!key);
    for (const entry of entries) {
      for (const element of [entry.card, entry.line, entry.dot]) element.classList.toggle('is-active', entry.key === key);
    }
  }

  const entries = Object.keys(names).map(key => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('pathLength', '1');
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '3');
    svg.append(line, dot);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'part-label-card';
    card.dataset.part = key;
    const title = document.createElement('strong');
    title.textContent = names[key];
    const description = document.createElement('span');
    description.textContent = descriptions[key];
    card.append(title, description);
    card.addEventListener('pointerenter', () => { pointerKey = key; activate(key); });
    card.addEventListener('pointerleave', () => { pointerKey = null; if (!selectTimer) activate(null); });
    card.addEventListener('focus', () => activate(key));
    card.addEventListener('blur', () => { if (!selectTimer) activate(pointerKey); });
    card.addEventListener('click', () => {
      if (selectTimer) return;
      activate(key);
      selectTimer = setTimeout(() => { selectTimer = null; onSelect(key); },
        matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 140);
    });
    panels.append(card);
    return {key, line, dot, card};
  });

  const observer = new ResizeObserver(records => {
    for (const record of records) sizes.set(record.target, record.target.offsetHeight);
    lastMatrix = null;
  });
  entries.forEach(entry => observer.observe(entry.card));

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function project(matrix, width, height, x, y, z) {
    const w = matrix[3]*x + matrix[7]*y + matrix[11]*z + matrix[15];
    if (w <= 0) return null;
    return {
      x: (matrix[0]*x + matrix[4]*y + matrix[8]*z + matrix[12])/w*width/2 + width/2,
      y: height/2 - (matrix[1]*x + matrix[5]*y + matrix[9]*z + matrix[13])/w*height/2
    };
  }

  // Project each component's box so roof-view markers can sit on the silhouette.
  function projectedBounds(mesh, matrix, width, height) {
    if (!mesh.labelBounds) return null;
    const [min, max] = mesh.labelBounds;
    const model = mesh.model;
    const points = [];
    for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) {
      const worldX = model[0]*x + model[4]*y + model[8]*z + model[12];
      const worldY = model[1]*x + model[5]*y + model[9]*z + model[13];
      const worldZ = model[2]*x + model[6]*y + model[10]*z + model[14];
      const point = project(matrix, width, height, worldX, worldY, worldZ);
      if (point) points.push(point);
    }
    if (!points.length) return null;
    return {
      minX: Math.min(...points.map(point => point.x)), maxX: Math.max(...points.map(point => point.x)),
      minY: Math.min(...points.map(point => point.y)), maxY: Math.max(...points.map(point => point.y))
    };
  }

  return {
    get activeKey() { return activeKey; },
    setActive(key) { if (!pointerKey && !selectTimer) activate(key); },
    show() {
      lastMatrix = null;
      clearTimeout(exitTimer);
      root.hidden = false;
      root.classList.remove('is-visible');
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-visible')));
    },
    hide(onDone) {
      clearTimeout(exitTimer);
      clearTimeout(selectTimer);
      selectTimer = null;
      pointerKey = null;
      activate(null);
      root.classList.remove('is-visible');
      exitTimer = setTimeout(() => { root.hidden = true; onDone?.(); }, 220);
    },
    update(matrix, meshes, angle, elevation = 0) {
      if (root.hidden) return;
      const width = innerWidth, height = innerHeight;
      const mobile = width <= 700;
      const overhead = elevation > 1.3;
      const cardWidth = mobile ? Math.min(112, (width-40)/3) : Math.min(164, (width-96)/5);
      if (lastMatrix && lastWidth === width && lastHeight === height && lastMeshes === meshes &&
          lastAngle === angle && lastElevation === elevation &&
          matrix.every((value, index) => Math.abs(value-lastMatrix[index]) < .000001)) return;
      if (lastWidth !== width || lastHeight !== height)
        navigationTop = mobile ? document.querySelector('.module-navigation').getBoundingClientRect().top : Infinity;
      if (!lastMatrix) lastMatrix = new Float32Array(16);
      lastMatrix.set(matrix);
      lastWidth = width; lastHeight = height; lastMeshes = meshes; lastAngle = angle; lastElevation = elevation;
      root.classList.toggle('is-overhead', overhead);
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

      const positions = [];
      for (const entry of entries) {
        const mesh = entry.key === 'Tire'
          ? meshes.find(m => m.name === (Math.sin(angle) >= 0 ? 'TireLR' : 'TireRR'))
          : meshes.find(m => m.name === entry.key);
        if (!mesh?.labelAnchor) {
          entry.card.hidden = true;
          entry.line.style.display = entry.dot.style.display = 'none';
          continue;
        }
        const [x, y, z] = mesh.labelAnchor;
        const anchor = project(matrix, width, height, x, y-(entry.key === 'Tire' ? .10 : 0), z);
        if (!anchor) {
          entry.card.hidden = true;
          entry.line.style.display = entry.dot.style.display = 'none';
          continue;
        }
        const bounds = overhead ? projectedBounds(mesh, matrix, width, height) : null;
        let sx = anchor.x, sy = anchor.y;
        if (bounds) {
          if (entry.key === 'Frontwing') sx = bounds.minX + 28;
          else if (entry.key === 'Rearwing') sy = bounds.minY + 8;
          else if (entry.key === 'Cockpit') sy = bounds.minY + 8;
          else sy = bounds.maxY - 8;
        }
        positions.push({entry, sx, sy});
      }

      // The Cockpit mesh also contains bodywork behind the driver. Its box edge
      // lands on the sidepod, so locate the visible opening along the car axis.
      if (overhead) {
        const cockpit = positions.find(({entry}) => entry.key === 'Cockpit');
        const front = positions.find(({entry}) => entry.key === 'Frontwing');
        const rear = positions.find(({entry}) => entry.key === 'Rearwing');
        if (cockpit && front && rear) {
          cockpit.sx = front.sx + (rear.sx-front.sx)*.49;
          cockpit.sy = front.sy;
        }
      }

      const regularLayout = mobile
        ? {Frontwing:[.17,.30],Cockpit:[.48,.30],Rearwing:[.79,.30],Sidepod:[.40,.80],Tire:[.72,.80]}
        : {Frontwing:[.19,.33],Cockpit:[.43,.33],Rearwing:[.72,.33],Sidepod:[.51,.82],Tire:[.75,.82]};
      const lowerAnchors = positions.filter(({entry}) => entry.key === 'Tire' || entry.key === 'Sidepod');
      const lowerAnchorY = Math.max(0, ...lowerAnchors.map(({sy}) => sy));
      const lowerCardHeight = Math.max(64, ...lowerAnchors.map(({entry}) => sizes.get(entry.card) || 64));
      const mobileLowerTop = Math.min(lowerAnchorY+60, navigationTop-lowerCardHeight-24);

      for (const {entry, sx, sy} of positions) {
        const below = entry.key === 'Tire' || entry.key === 'Sidepod';
        let left, top;
        if (overhead && !mobile) {
          if (entry.key === 'Frontwing') { left = sx-cardWidth-26; top = height*.24; }
          else if (entry.key === 'Rearwing') { left = sx-cardWidth/2; top = Math.max(28, height*.085); }
          else if (entry.key === 'Cockpit') { left = width*.5-cardWidth/2; top = Math.max(28, height*.085); }
          else { left = sx-cardWidth/2; top = height*.82; }
        } else {
          const [px, py] = regularLayout[entry.key];
          left = width*px-cardWidth/2;
          top = mobile && below ? Math.max(100, mobileLowerTop) : height*py;
        }
        left = clamp(left, 16, width-cardWidth-16);
        top = clamp(top, 28, height-90);
        entry.card.hidden = false;
        entry.line.style.display = entry.dot.style.display = '';
        const cardStyle = `left:${left}px;top:${top}px;width:${cardWidth}px`;
        if (entry.layout !== cardStyle) { entry.card.style.cssText = cardStyle; entry.layout = cardStyle; }
        const cardHeight = sizes.get(entry.card) || 64;
        let endX, endY, points;
        if (overhead && !mobile && entry.key === 'Frontwing') {
          endX = left+cardWidth; endY = top+cardHeight*.5;
          points = sx-endX < 24
            ? `${endX},${endY} ${sx},${sy}`
            : `${endX},${endY} ${sx-15},${endY} ${sx},${sy}`;
        } else if (overhead && !mobile && entry.key === 'Rearwing') {
          endX = left+cardWidth/2; endY = top+cardHeight;
          points = `${endX},${endY} ${endX},${sy-18} ${sx},${sy}`;
        } else if (overhead && !mobile) {
          endX = left+cardWidth/2; endY = below ? top : top+cardHeight;
          const elbowY = below ? sy+18 : sy-18;
          points = `${endX},${endY} ${endX},${elbowY} ${sx},${sy}`;
        } else {
          endX = left+cardWidth/2; endY = below ? top : top+cardHeight;
          const elbowY = below ? endY-18 : endY+18;
          const bendX = sx+Math.sign(endX-sx)*Math.min(Math.abs(endX-sx), Math.abs(elbowY-sy));
          points = `${sx},${sy} ${bendX},${elbowY} ${endX},${elbowY} ${endX},${endY}`;
        }
        entry.line.setAttribute('points', points);
        entry.dot.setAttribute('cx', sx);
        entry.dot.setAttribute('cy', sy);
      }
    }
  };
}
