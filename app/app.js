// GTA 6 Trophy Guide - Offline Static App
// Zero network requests, localStorage persistence, deep-link hashes

const STORAGE_KEY = 'gta6-trophy-progress';
const DEMO_KEY = 'gta6-demo-progress';

let trophies = [];
let progress = {};
let demoProgress = {};

async function loadTrophies() {
  try {
    const res = await fetch('data/trophies.json');
    if (!res.ok) throw new Error('Failed to load trophies');
    const data = await res.json();
    trophies = data.trophies;
    return data;
  } catch (e) {
    console.error('Error loading trophies:', e);
    document.getElementById('trophyList').innerHTML = '<li style="color:var(--danger);padding:2rem;text-align:center;">Failed to load trophy data</li>';
    return null;
  }
}

function loadProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) progress = JSON.parse(stored);
  } catch (e) {
    console.warn('Could not load progress:', e);
    progress = {};
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Could not save progress:', e);
  }
}

function loadDemoProgress() {
  try {
    const stored = localStorage.getItem(DEMO_KEY);
    if (stored) demoProgress = JSON.parse(stored);
  } catch (e) {
    demoProgress = {};
  }
}

function saveDemoProgress() {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(demoProgress));
  } catch (e) {}
}

function getSlug(trophy) {
  return trophy.slug || trophy.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getEarnedCount() {
  return Object.keys(progress).filter(k => progress[k]).length;
}

function updateProgressUI() {
  const earned = getEarnedCount();
  const total = trophies.length;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('progressText').textContent = `${earned} / ${total} (${pct}%)`;
}

function getSpoilersOff() {
  return window.location.hash.includes('spoilers=off');
}

function matchesFilters(trophy) {
  const gradeFilter = document.getElementById('gradeFilter').value;
  const typeFilter = document.getElementById('typeFilter').value;
  const missableOnly = document.getElementById('missableFilter').checked;
  const hideSpoilers = document.getElementById('spoilerToggle').checked && !getSpoilersOff();

  if (gradeFilter !== 'all' && trophy.grade !== gradeFilter) return false;
  if (typeFilter !== 'all' && trophy.type !== typeFilter) return false;
  if (missableOnly && !trophy.missable) return false;
  return true;
}

function renderList() {
  const list = document.getElementById('trophyList');
  const hideSpoilers = document.getElementById('spoilerToggle').checked && !getSpoilersOff();
  const demoMode = window.location.hash === '#demo-progress';
  const currentProgress = demoMode ? demoProgress : progress;

  list.innerHTML = '';

  trophies
    .filter(matchesFilters)
    .forEach(trophy => {
      const earned = currentProgress[trophy.id] === true;
      const slug = getSlug(trophy);
      const li = document.createElement('li');
      li.className = `trophy-item ${earned ? 'earned' : ''} ${trophy.missable ? 'missable' : ''}`;
      li.dataset.id = trophy.id;
      li.dataset.slug = slug;

      const nameDisplay = (hideSpoilers && trophy.hidden && !earned) 
        ? '???' 
        : trophy.name;

      li.innerHTML = `
        <div class="trophy-grade ${trophy.grade}" title="${trophy.grade.charAt(0).toUpperCase() + trophy.grade.slice(1)}">${trophy.grade.charAt(0).toUpperCase()}</div>
        <div class="trophy-info">
          <div class="trophy-name ${(hideSpoilers && trophy.hidden && !earned) ? 'hidden-spoiler' : ''}">${nameDisplay}</div>
          <div class="trophy-meta">
            <span class="trophy-type">${trophy.type}</span>
            ${trophy.missable ? '<span class="trophy-missable-badge">⚠ Missable</span>' : ''}
          </div>
        </div>
      `;

      li.addEventListener('click', () => showDetail(trophy.id));
      list.appendChild(li);
    });
}

function showDetail(id) {
  const trophy = trophies.find(t => t.id === id);
  if (!trophy) return;

  const demoMode = window.location.hash === '#demo-progress';
  const currentProgress = demoMode ? demoProgress : progress;
  const earned = currentProgress[trophy.id] === true;
  const hideSpoilers = document.getElementById('spoilerToggle').checked && !getSpoilersOff();

  const detail = document.getElementById('trophyDetail');
  const nameDisplay = (hideSpoilers && trophy.hidden && !earned) ? '???' : trophy.name;
  const descDisplay = (hideSpoilers && trophy.hidden && !earned) ? 'Complete the associated story mission to reveal.' : trophy.description;

  detail.innerHTML = `
    <div class="trophy-detail-header">
      <div class="trophy-detail-grade ${trophy.grade}">${trophy.grade.charAt(0).toUpperCase()}</div>
      <div class="trophy-detail-info">
        <h2>${nameDisplay}</h2>
        <div class="trophy-detail-meta">
          <span class="trophy-type">${trophy.type}</span>
          ${trophy.missable ? '<span class="trophy-missable-badge">⚠ Missable</span>' : ''}
          ${trophy.hidden ? '<span>Hidden</span>' : ''}
        </div>
      </div>
    </div>
    <div class="trophy-detail-section">
      <h3>Description</h3>
      <p>${descDisplay}</p>
    </div>
    <div class="trophy-detail-section">
      <h3>How to Earn</h3>
      <p>${trophy.guide}</p>
    </div>
    <div class="trophy-detail-section">
      <h3>Source</h3>
      <p class="trophy-detail-source"><a href="${trophy.source}" target="_blank" rel="noopener">${trophy.source}</a></p>
    </div>
    <button class="back-btn" onclick="toggleEarned(${trophy.id})" style="margin-top:1rem;width:100%;">
      ${earned ? 'Mark as Unearned' : 'Mark as Earned'}
    </button>
  `;

  document.getElementById('listView').classList.add('hidden');
  document.getElementById('detailView').classList.remove('hidden');
  window.location.hash = `trophy=${getSlug(trophy)}`;
}

function toggleEarned(id) {
  const demoMode = window.location.hash === '#demo-progress';
  if (demoMode) {
    demoProgress[id] = !demoProgress[id];
    saveDemoProgress();
  } else {
    progress[id] = !progress[id];
    saveProgress();
  }
  updateProgressUI();
  renderList();
  showDetail(id);
}

function showRoadmap() {
  const demoMode = window.location.hash === '#demo-progress';
  const currentProgress = demoMode ? demoProgress : progress;

  const roadmap = document.getElementById('roadmap');
  const phases = [
    { title: 'Phase 1: Story Completion', trophies: trophies.filter(t => t.type === 'story'), color: 'var(--gold)' },
    { title: 'Phase 2: Strangers & Freaks (Missable)', trophies: trophies.filter(t => t.type === 'side' && t.missable), color: 'var(--danger)' },
    { title: 'Phase 3: Side Activities', trophies: trophies.filter(t => t.type === 'side' && !t.missable), color: 'var(--accent)' },
    { title: 'Phase 4: Collections', trophies: trophies.filter(t => t.type === 'collection'), color: 'var(--platinum)' },
    { title: 'Phase 5: Stunts & Challenges', trophies: trophies.filter(t => t.type === 'stunt'), color: 'var(--silver)' },
    { title: 'Phase 6: 100% Completion', trophies: trophies.filter(t => t.id === 14), color: 'var(--gold)' },
  ];

  roadmap.innerHTML = phases.map(phase => {
    if (phase.trophies.length === 0) return '';
    return `
      <div class="roadmap-phase">
        <h3 style="color:${phase.color}">${phase.title} (${phase.trophies.length})</h3>
        <ul>
          ${phase.trophies.map(t => {
            const earned = currentProgress[t.id] === true;
            return `<li class="${earned ? 'done' : ''} ${t.missable ? 'missable' : ''}">
              <input type="checkbox" class="roadmap-checkbox" ${earned ? 'checked' : ''} data-id="${t.id}" ${demoMode ? '' : 'onchange="toggleRoadmap(this)"'}>
              ${t.name} ${t.missable ? '⚠' : ''}
            </li>`;
          }).join('')}
        </ul>
      </div>
    `;
  }).join('');

  document.getElementById('listView').classList.add('hidden');
  document.getElementById('roadmapView').classList.remove('hidden');
  window.location.hash = '#roadmap';
}

function toggleRoadmap(checkbox) {
  const id = parseInt(checkbox.dataset.id, 10);
  progress[id] = checkbox.checked;
  saveProgress();
  updateProgressUI();
  renderList();
}

function applyDemoProgress() {
  const demoTrophies = [2, 3, 15, 17, 28, 31, 35, 42];
  demoTrophies.forEach(id => demoProgress[id] = true);
  saveDemoProgress();
  if (window.location.hash === '#demo-progress') {
    renderList();
    updateProgressUI();
  }
}

function exportProgress() {
  const data = {
    exported: new Date().toISOString(),
    game: 'Grand Theft Auto VI',
    progress: progress
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gta6-trophy-progress-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.progress && typeof data.progress === 'object') {
        progress = { ...progress, ...data.progress };
        saveProgress();
        updateProgressUI();
        renderList();
        alert(`Imported ${Object.keys(data.progress).length} trophy states.`);
      } else {
        alert('Invalid progress file format.');
      }
    } catch (err) {
      alert('Failed to parse JSON file.');
    }
  };
  reader.readAsText(file);
}

function handleHashChange() {
  const hash = window.location.hash;
  if (hash.startsWith('#trophy=')) {
    const slug = hash.slice(8);
    const trophy = trophies.find(t => getSlug(t) === slug);
    if (trophy) showDetail(trophy.id);
  } else if (hash === '#roadmap') {
    showRoadmap();
  } else if (hash === '#missable') {
    document.getElementById('missableFilter').checked = true;
    renderList();
    document.getElementById('listView').classList.remove('hidden');
    document.getElementById('detailView').classList.add('hidden');
    document.getElementById('roadmapView').classList.add('hidden');
  } else if (hash === '#demo-progress') {
    applyDemoProgress();
    document.getElementById('listView').classList.remove('hidden');
    document.getElementById('detailView').classList.add('hidden');
    document.getElementById('roadmapView').classList.add('hidden');
  } else {
    document.getElementById('listView').classList.remove('hidden');
    document.getElementById('detailView').classList.add('hidden');
    document.getElementById('roadmapView').classList.add('hidden');
  }
}

function init() {
  loadProgress();
  loadDemoProgress();
  loadTrophies().then(data => {
    if (!data) return;
    renderList();
    updateProgressUI();

    document.getElementById('gradeFilter').addEventListener('change', () => { renderList(); updateProgressUI(); });
    document.getElementById('typeFilter').addEventListener('change', () => { renderList(); updateProgressUI(); });
    document.getElementById('missableFilter').addEventListener('change', () => { renderList(); updateProgressUI(); });
    document.getElementById('spoilerToggle').addEventListener('change', () => { renderList(); });

    document.getElementById('exportBtn').addEventListener('click', exportProgress);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', (e) => {
      if (e.target.files[0]) importProgress(e.target.files[0]);
      e.target.value = '';
    });

    document.getElementById('backBtn').addEventListener('click', () => {
      window.location.hash = '';
      handleHashChange();
    });
    document.getElementById('roadmapBackBtn').addEventListener('click', () => {
      window.location.hash = '';
      handleHashChange();
    });

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}