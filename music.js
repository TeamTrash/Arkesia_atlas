// One controller and one audio element for all places and languages.
function createMusicController(dialog) {
  const list = dialog.querySelector('#place-tracks');
  const player = dialog.querySelector('#place-player');
  const title = dialog.querySelector('#playing-title');
  const status = dialog.querySelector('#music-status');
  const languageButtons = [...dialog.querySelectorAll('[data-language]')];
  let place = null, language = 'ES', tracks = [], currentSrc = null;
  let timer = null, request = null, revision = 0, signature = '';

  function stopPlayer() {
    player.pause();
    player.removeAttribute('src');
    player.load();
    player.hidden = true;
    title.textContent = 'Selecciona una canción';
    currentSrc = null;
  }
  function renderList() {
    list.replaceChildren();
    if (!tracks.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-tracks';
      empty.textContent = `Todavía no hay canciones en ${language}.`;
      list.append(empty);
    }
    for (const track of tracks) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'track-button';
      button.textContent = track.title;
      button.setAttribute('aria-pressed', String(currentSrc === track.src));
      button.addEventListener('click', async () => {
        currentSrc = track.src;
        player.src = track.src;
        player.hidden = false;
        title.textContent = track.title;
        list.querySelectorAll('.track-button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        try { await player.play(); }
        catch (error) { if (error.name !== 'AbortError') status.textContent = 'No se pudo reproducir. Comprueba el archivo y su formato.'; }
      });
      list.append(button);
    }
  }
  async function refresh() {
    if (!dialog.open || !place) return;
    const token = revision;
    const controller = new AbortController();
    request = controller;
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      if (location.protocol === 'file:') throw new Error('local-file');
      const query = new URLSearchParams({ place: place.id, language });
      const response = await fetch(`/api/tracks?${query}`, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('server');
      const data = await response.json();
      if (token !== revision || !dialog.open) return;
      const nextSignature = JSON.stringify(data.tracks);
      if (nextSignature !== signature) {
        signature = nextSignature;
        tracks = data.tracks;
        if (currentSrc && !tracks.some(track => track.src === currentSrc)) stopPlayer();
        renderList();
      }
      status.textContent = `${tracks.length} canciones · ${data.folder}`;
    } catch (error) {
      if (token !== revision || !dialog.open) return;
      status.textContent = location.protocol === 'file:'
        ? 'Para detectar canciones, ejecuta «Iniciar Atlas.cmd» y abre http://127.0.0.1:4175.'
        : 'No se pudo actualizar la música. Comprueba que el servidor del atlas siga abierto.';
    } finally {
      clearTimeout(timeout);
      if (token === revision && dialog.open) timer = setTimeout(refresh, 3000);
    }
  }
  function cancelRefresh() {
    revision++;
    clearTimeout(timer);
    request?.abort();
  }
  function selectLanguage(next) {
    cancelRefresh();
    language = next;
    tracks = [];
    signature = '';
    stopPlayer();
    renderList();
    languageButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    status.textContent = 'Buscando canciones…';
    refresh();
  }
  languageButtons.forEach(button => button.addEventListener('click', () => selectLanguage(button.dataset.language)));
  player.addEventListener('error', () => {
    if (currentSrc) status.textContent = 'El audio no está disponible o su formato no es compatible con este navegador.';
  });
  dialog.addEventListener('close', () => { cancelRefresh(); stopPlayer(); place = null; });
  return { open(selectedPlace) { place = selectedPlace; selectLanguage('ES'); } };
}
