(() => {
  const CHANNEL = 'matchzimmerman';
  const playerTarget = document.getElementById('mztv-player');
  const navLink = document.querySelector('.mztv-nav-link');
  const navLabel = document.querySelector('.mztv-nav-label');
  const status = document.querySelector('.mztv-status');
  const statusLabel = document.querySelector('.mztv-status-label');

  const setLiveState = (isLive) => {
    if (navLink) navLink.dataset.live = isLive ? 'true' : 'false';
    if (status) status.dataset.live = isLive ? 'true' : 'false';
    if (navLabel) navLabel.textContent = isLive ? 'LIVE NOW' : 'MZTV';
    if (statusLabel) statusLabel.textContent = isLive ? 'LIVE NOW / TRANSMITTING' : 'OFFLINE / MZTV';
  };

  if (!playerTarget) return;

  const loadPlayer = () => {
    if (!window.Twitch || !window.Twitch.Player) return;
    const player = new Twitch.Player('mztv-player', {
      width: '100%',
      height: '100%',
      channel: CHANNEL,
      parent: [window.location.hostname],
      autoplay: false,
      muted: true
    });

    player.addEventListener(Twitch.Player.ONLINE, () => setLiveState(true));
    player.addEventListener(Twitch.Player.OFFLINE, () => setLiveState(false));
  };

  if (window.Twitch && window.Twitch.Player) {
    loadPlayer();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://player.twitch.tv/js/embed/v1.js';
  script.async = true;
  script.onload = loadPlayer;
  script.onerror = () => {
    if (statusLabel) statusLabel.textContent = 'MZTV / OPEN STREAM';
  };
  document.head.appendChild(script);
})();
