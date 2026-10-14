const viewport = document.querySelector('#viewport');
const map = document.querySelector('#map');
const zoom = document.querySelector('#zoom');
const cloudTransition = createCloudTransition(viewport);
const maps = {
  arkesia: { src: 'assets/Arkesia_map.PNG', title: 'ARKESIA / MAPA DEL MUNDO', alt: 'Mapa del mundo de Arkesia, con sus continentes e islas en los mares de Procyon y Gienah.', next: 'elgacia', action: 'Ir a Elgacia' },
  elgacia: { src: 'assets/Elgacia_map.PNG', title: 'ELGACIA / MAPA REGIONAL', alt: 'Mapa de Elgacia con Ereonnor, Mount Phylantos y Hestera Garden.', next: 'arkesia', action: 'Volver a Arkesia' },
  feiton: { src: 'assets/Feiton_map.PNG', title: 'FEITON / MAPA REGIONAL', alt: 'Mapa de Feiton con Kalaja, Wailing Swamp, Red Moonshade, Shady Cliff y Nameless Valley.', next: 'elgacia', action: 'Ir a Elgacia' }
};
const regions = {
  anikka: { name: 'Anikka', file: 'Anikka_map.PNG', point: [796, 284], rect: [770, 265, 56, 50] },
  arthetine: { name: 'Arthetine', file: 'Artetine_map.PNG', point: [756, 173], rect: [722, 152, 68, 50] },
  cardarum: { name: 'Cardarum Isles', file: 'Cardarum_map.PNG', point: [995, 232], rect: [960, 214, 72, 48] },
  north_kurzan: { name: 'North Kurzan', file: 'North_kurzan_map.PNG', point: [906, 143], rect: [868, 124, 80, 49] },
  south_kurzan: { name: 'South Kurzan', file: 'south_kurzan_map.PNG', point: [874, 193], rect: [835, 176, 80, 46] },
  north_vern: { name: 'North Vern', file: 'North_vern_map.PNG', point: [568, 235], rect: [537, 216, 65, 56] },
  south_vern: { name: 'South Vern', file: 'South_vern_map.PNG', point: [487, 264], rect: [455, 246, 65, 54] },
  pleccia: { name: 'Pleccia', file: 'Pleccia_map.PNG', point: [693, 250], rect: [669, 231, 50, 50] },
  punika: { name: 'Punika', file: 'Punika_map.PNG', point: [319, 432], rect: [292, 411, 55, 52] },
  tortoyk: { name: 'Tortoyk', file: 'Tortoyk_map.PNG', point: [720, 342], rect: [692, 323, 57, 51] },
  south_rimeria: { name: 'South Rimeria', file: 'South_rimeria_map.PNG', point: [811, 523], rect: [764, 504, 96, 57] },
  feiton: { name: 'Feiton', file: 'Feiton_map.PNG', point: [223, 170], rect: [195, 145, 58, 55] },
  rohendel: { name: 'Rohendel', file: 'Rohendel_map.PNG', point: [265, 287], rect: [233, 269, 66, 48] },
  rowen: { name: 'Rowen', file: 'Rowen_map.PNG', point: [474, 68], rect: [448, 49, 54, 48] },
  sushire: { name: 'Sushire', file: 'Sushire_map.PNG', point: [602, 78], rect: [573, 59, 60, 48] },
  yorn: { name: 'Yorn', file: 'Yorn_voldis_map.PNG', point: [215, 494], rect: [192, 477, 47, 45] },
  voldis: { name: 'Voldis', file: 'Yorn_voldis_map.PNG', point: [243, 533], rect: [222, 522, 48, 42] }
};
for (const [id, region] of Object.entries(regions)) {
  maps[id] = {
    src: `assets/${region.file}`,
    title: `${id === 'yorn' || id === 'voldis' ? 'YORN / VOLDIS' : region.name.toUpperCase()} / MAPA REGIONAL`,
    alt: `Mapa regional de ${id === 'yorn' || id === 'voldis' ? 'Yorn y Voldis' : region.name}.`,
    next: 'elgacia', action: 'Ir a Elgacia'
  };
}
let currentMap = 'arkesia';
let cityButtons = [];
const placeDialog = document.querySelector('#place-dialog');
const musicController = createMusicController(placeDialog);
function openPlace(id) {
  if (navigating) return;
  stopDrag();
  const selectedPlace = placeCatalog[id];
  document.querySelector('#place-title').textContent = selectedPlace.name;
  document.querySelector('#place-region').textContent = regions[selectedPlace.region]?.name || 'Elgacia';
  placeDialog.dataset.placeId = id;
  placeDialog.showModal();
  musicController.open(selectedPlace);
}
document.querySelector('#close-place').addEventListener('click', () => placeDialog.close());
placeDialog.addEventListener('click', event => {
  const rect = placeDialog.getBoundingClientRect();
  if (event.target === placeDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) placeDialog.close();
});
function updateCityButtons() {
  cityButtons.forEach(({ button }) => button.remove());
  cityButtons = (placeMarkers[currentMap] || []).map(marker => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'city-switch';
    button.setAttribute('aria-label', `Canciones de ${placeCatalog[marker.id].name}`);
    button.addEventListener('pointerdown', event => event.stopPropagation());
    button.addEventListener('click', () => openPlace(marker.id));
    viewport.append(button);
    return { button, marker };
  });
}
const mapSwitch = document.createElement('button');
mapSwitch.id = 'map-switch';
mapSwitch.type = 'button';
mapSwitch.setAttribute('aria-label', maps[currentMap].action);
viewport.append(mapSwitch);
mapSwitch.addEventListener('pointerdown', event => event.stopPropagation());
mapSwitch.addEventListener('click', () => navigate(maps[currentMap].next));
const regionButtons = Object.entries(regions).map(([id, region]) => {
  const button = document.createElement('button');
  button.className = 'region-switch';
  button.type = 'button';
  button.setAttribute('aria-label', `Explorar ${region.name}`);
  viewport.append(button);
  button.addEventListener('pointerdown', event => event.stopPropagation());
  button.addEventListener('click', () => navigate(id, true));
  return { button, region };
});
const back = document.createElement('button');
back.id = 'back-world';
back.textContent = '← Arkesia';
back.hidden = true;
document.querySelector('.map-heading').append(back);
back.addEventListener('click', () => navigate('arkesia'));
let navigating = false;
let returnToWorld = false;
viewport.addEventListener('contextmenu', event => {
  event.preventDefault();
  if (navigating) {
    returnToWorld = true;
    return;
  }
  navigate('arkesia');
});
async function navigate(destination, approach = false) {
  if (navigating) return;
  navigating = true;
  stopDrag();
  document.querySelector('.atlas').classList.add('navigating');
  let animation;
  const originMap = currentMap;
  const previousView = { scale, x, y };
  const retreat = destination === 'arkesia';
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const image = new Image();
    image.src = maps[destination].src;
    await image.decode();
    if (destination === 'elgacia' || originMap === 'elgacia') {
      await cloudTransition.play(async () => {
        showMap(destination);
        await map.decode();
        render();
      });
      return;
    }
    if (retreat && originMap !== 'arkesia' && motion) {
      map.style.transformOrigin = 'center';
      animation = map.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(.75)', opacity: 0 }
      ], { duration: 250, easing: 'ease-in', fill: 'forwards' });
      await animation.finished;
    }
    if (approach && motion) {
      const [focusX, focusY] = regions[destination].point;
      const left = parseFloat(map.style.left);
      const top = parseFloat(map.style.top);
      const dx = viewport.clientWidth / 2 - (left + focusX * scale);
      const dy = viewport.clientHeight / 2 - (top + focusY * scale);
      map.style.transformOrigin = `${focusX * scale}px ${focusY * scale}px`;
      animation = map.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(3)`, opacity: 0 }
      ], { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      await animation.finished;
    }
    showMap(destination);
    await map.decode();
    render();
    animation?.cancel();
    if (retreat && motion) {
      map.style.transformOrigin = 'center';
      const sameMap = originMap === 'arkesia';
      const magnification = sameMap ? previousView.scale / scale : 3;
      const focus = regions[originMap]?.point;
      const dx = sameMap ? previousView.x : focus ? (map.naturalWidth / 2 - focus[0]) * scale * magnification : 0;
      const dy = sameMap ? previousView.y : focus ? (map.naturalHeight / 2 - focus[1]) * scale * magnification : 0;
      animation = map.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${magnification})`, opacity: sameMap ? 1 : 0 },
        { opacity: 1, offset: .3 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1 }
      ], { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)' });
      await animation.finished;
    } else if (approach && motion) {
      animation = map.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
      await animation.finished;
    }
  } catch (error) {
    console.error('No se pudo abrir el mapa:', error);
  } finally {
    animation?.cancel();
    map.style.transformOrigin = 'center';
    navigating = false;
    document.querySelector('.atlas').classList.remove('navigating');
    if (returnToWorld) {
      returnToWorld = false;
      navigate('arkesia');
    }
  }
}
function showMap(destination) {
  currentMap = destination;
  const selected = maps[currentMap];
  updateCityButtons();
  stopDrag();
  fitted = true;
  x = y = 0;
  map.src = selected.src;
  map.alt = selected.alt;
  document.querySelector('.original').href = selected.src;
  document.querySelector('.atlas').setAttribute('aria-label', selected.title);
  regionButtons.forEach(({ button }) => { button.hidden = currentMap !== 'arkesia'; });
  back.hidden = currentMap === 'arkesia';
  const heading = document.querySelector('.map-heading > span');
  heading.replaceChildren();
  const dot = document.createElement('span');
  dot.className = 'dot';
  heading.append(dot, ` ${selected.title}`);
  mapSwitch.setAttribute('aria-label', selected.action);
  if (map.complete) render();
}
let scale = 1, x = 0, y = 0, drag = null;
let fitted = true;
function fitScale() {
  return Math.min(1, viewport.clientWidth / map.naturalWidth, viewport.clientHeight / map.naturalHeight);
}

function render() {
  if (!map.naturalWidth) return;
  if (fitted) scale = fitScale();
  const width = map.naturalWidth * scale;
  const height = map.naturalHeight * scale;
  const maxX = Math.max(0, (width - viewport.clientWidth) / 2);
  const maxY = Math.max(0, (height - viewport.clientHeight) / 2);
  x = Math.max(-maxX, Math.min(maxX, x));
  y = Math.max(-maxY, Math.min(maxY, y));
  // Resize from the original PNG, rather than enlarging a transformed preview layer.
  map.style.width = `${width}px`;
  map.style.height = `${height}px`;
  map.style.left = `${(viewport.clientWidth - width) / 2 + x}px`;
  map.style.top = `${(viewport.clientHeight - height) / 2 + y}px`;
  // Anchor the clickable region to the icon in the original image, including during zoom/pan.
  mapSwitch.style.left = `${(viewport.clientWidth - width) / 2 + x + 5 * scale}px`;
  mapSwitch.style.top = `${(viewport.clientHeight - height) / 2 + y + 5 * scale}px`;
  mapSwitch.style.width = `${65 * scale}px`;
  mapSwitch.style.height = `${78 * scale}px`;
  for (const { button, region } of regionButtons) {
    const [left, top, regionWidth, regionHeight] = region.rect;
    button.style.left = `${(viewport.clientWidth - width) / 2 + x + left * scale}px`;
    button.style.top = `${(viewport.clientHeight - height) / 2 + y + top * scale}px`;
    button.style.width = `${regionWidth * scale}px`;
    button.style.height = `${regionHeight * scale}px`;
  }
  for (const { button, marker } of cityButtons) {
    button.style.left = `${(viewport.clientWidth - width) / 2 + x + (marker.x - 24) * scale}px`;
    button.style.top = `${(viewport.clientHeight - height) / 2 + y + (marker.y - 20) * scale}px`;
    button.style.width = `${48 * scale}px`;
    button.style.height = `${45 * scale}px`;
  }
  zoom.value = `${Math.round(scale * 100)}%`;
  document.querySelector('#out').disabled = scale <= fitScale();
  document.querySelector('#in').disabled = scale >= 4;
}
function changeZoom(delta) {
  if (navigating) return;
  fitted = false;
  scale = Math.max(fitScale(), Math.min(4, scale + delta));
  render();
}
document.querySelector('#in').addEventListener('click', () => changeZoom(.25));
document.querySelector('#out').addEventListener('click', () => changeZoom(-.25));
document.querySelector('#reset').addEventListener('click', () => { fitted = true; x = y = 0; render(); });
document.querySelector('#native').addEventListener('click', () => { fitted = false; scale = 1; x = y = 0; render(); });
viewport.addEventListener('pointerdown', event => {
  if (navigating || !event.isPrimary || event.button !== 0) return;
  drag = { id: event.pointerId, x: event.clientX - x, y: event.clientY - y };
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add('dragging');
});
viewport.addEventListener('pointermove', event => {
  if (!drag || drag.id !== event.pointerId) return;
  x = event.clientX - drag.x; y = event.clientY - drag.y; render();
});
function stopDrag() { drag = null; viewport.classList.remove('dragging'); }
viewport.addEventListener('pointerup', stopDrag);
viewport.addEventListener('pointercancel', stopDrag);
viewport.addEventListener('lostpointercapture', stopDrag);
viewport.addEventListener('keydown', event => {
  if (navigating) { event.preventDefault(); return; }
  if (['+', '=', '-', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  if (event.key === '+' || event.key === '=') changeZoom(.25);
  if (event.key === '-') changeZoom(-.25);
  if (event.key === 'ArrowLeft') x += 40;
  if (event.key === 'ArrowRight') x -= 40;
  if (event.key === 'ArrowUp') y += 40;
  if (event.key === 'ArrowDown') y -= 40;
  render();
});
window.addEventListener('resize', render);
map.addEventListener('load', render);
render();
