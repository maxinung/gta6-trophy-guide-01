// GTA VI Trophy Guide & Tracker - Offline capable, no network at runtime
const STORAGE_KEY = 'gta6-trophy-progress-v1';
const TROPHY_DATA_URL = 'data/trophies.json';

let trophies = [];
let earned = new Set();
let currentFilter = { grade: 'all', type: 'all', missableOnly: false };
let spoilersHidden = true;
let currentView = 'checklist';

const elements = {
  progressFill: null,
  progressText: null,
  trophyRows: null,
  filterGrade: null,
  filterType: null,
  filterMissableOnly: null,
  spoilerToggle: null,
  exportBtn: null,
  importFile: null,
  tabChecklist: null,
  tabRoadmap: null,
  tabMissable: null,
  panelChecklist: null,
  panelRoadmap: null,
  panelMissable: null,
  detailDialog: null,
  dialogClose: null,
  dialogBody: null,
  roadmapContent: null,
  missableContent: null
};

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

function getGradeClass(grade) {
  return `grade-${grade}`;
}

function getTypeBadge(type) {
  const labels = {
    story: 'Story',
    activity: 'Activity',
    collectible: 'Collectible',
    completion: 'Completion',
    platinum: 'Platinum'
  };
  return labels[type] || type;
}

function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

function updateHash(params) {
  const current = parseHash();
  const merged = { ...current, ...params };
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  }
  const newHash = searchParams.toString();
  window.history.replaceState(null, '', newHash ? `#${newHash}` : window.location.pathname);
}

function applyHashState() {
  const hash = parseHash();
  if (hash.trophy) {
    const trophy = trophies.find(t => slugify(t.name) === hash.trophy);
    if (trophy) {
      showDetail(trophy);
      return;
    }
  }
  if (hash.roadmap === 'true' || hash.roadmap === '') {
    switchView('roadmap');
  } else if (hash.missable === 'true') {
    switchView('missable');
  } else {
    switchView('checklist');
  }
  if (hash.spoilers === 'off') {
    spoilersHidden = false;
    elements.spoilerToggle.checked = false;
    updateSpoilerState();
  }
}

function switchView(view) {
  currentView = view;
  elements.panelChecklist.hidden = view !== 'checklist';
  elements.panelRoadmap.hidden = view !== 'roadmap';
  elements.panelMissable.hidden = view !== 'missable';
  elements.tabChecklist.setAttribute('aria-selected', view === 'checklist');
  elements.tabRoadmap.setAttribute('aria-selected', view === 'roadmap');
  elements.tabMissable.setAttribute('aria-selected', view === 'missable');
  elements.tabChecklist.parentElement.querySelectorAll('[role="tab"]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('aria-selected') === 'true');
  });
  updateHash({ trophy: undefined, roadmap: view === 'roadmap' ? 'true' : undefined, missable: view === 'missable' ? 'true' : undefined });
}

async function loadTrophies() {
  try {
    const res = await fetch(TROPHY_DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    trophies = data.trophies || data;
    trophies.forEach((t, i) => { t._index = i; t._slug = slugify(t.name); });
  } catch (e) {
    console.error('Failed to load trophies:', e);
    document.body.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--danger)">Failed to load trophy data. Ensure app is served via HTTP.</div>`;
  }
}

function loadProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      earned = new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.warn('Failed to load progress:', e);
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

function exportProgress() {
  const data = JSON.stringify([...earned], null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gta6-trophy-progress-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        earned = new Set(data);
        saveProgress();
        render();
      }
    } catch (err) {
      alert('Invalid JSON file');
    }
  };
  reader.readAsText(file);
}

function matchesFilter(trophy) {
  if (currentFilter.grade !== 'all' && trophy.grade !== currentFilter.grade) return false;
  if (currentFilter.type !== 'all' && trophy.type !== currentFilter.type) return false;
  if (currentFilter.missableOnly && !trophy.missable) return false;
  return true;
}

function render() {
  renderChecklist();
  renderRoadmap();
  renderMissable();
  updateProgress();
}

function updateProgress() {
  const total = trophies.length;
  const count = earned.size;
  const pct = total ? Math.round((count / total) * 100) : 0;
  elements.progressFill.style.width = `${pct}%`;
  elements.progressFill.setAttribute('aria-valuenow', pct);
  elements.progressText.textContent = `${count} of ${total} earned (${pct}%)`;
}

function renderChecklist() {
  elements.trophyRows.innerHTML = '';
  const filtered = trophies.filter(matchesFilter);
  for (const trophy of filtered) {
    const tr = document.createElement('tr');
    tr.dataset.slug = trophy._slug;
    const isEarned = earned.has(trophy.name);
    if (isEarned) tr.classList.add('earned-row');
    const isStoryHidden = spoilersHidden && trophy.hidden && trophy.type === 'story';
    if (isStoryHidden) tr.classList.add('spoiler-hidden');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isEarned;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) earned.add(trophy.name);
      else earned.delete(trophy.name);
      saveProgress();
      render();
    });

    const nameCell = document.createElement('td');
    const nameDiv = document.createElement('div');
    nameDiv.className = 'trophy-name';
    nameDiv.textContent = trophy.name;
    nameCell.appendChild(nameDiv);

    const descDiv = document.createElement('div');
    descDiv.className = 'trophy-desc';
    descDiv.textContent = trophy.description;
    nameCell.appendChild(descDiv);

    const metaDiv = document.createElement('div');
    metaDiv.style.display = 'flex';
    metaDiv.style.gap = '6px';
    metaDiv.style.flexWrap = 'wrap';
    metaDiv.style.marginTop = '6px';
    const gradeBadge = document.createElement('span');
    gradeBadge.className = `grade-badge ${getGradeClass(trophy.grade)}`;
    gradeBadge.textContent = trophy.grade;
    metaDiv.appendChild(gradeBadge);
    const typeBadge = document.createElement('span');
    typeBadge.className = 'type-badge';
    typeBadge.textContent = getTypeBadge(trophy.type);
    metaDiv.appendChild(typeBadge);
    if (trophy.missable) {
      const missBadge = document.createElement('span');
      missBadge.className = 'missable-flag';
      missBadge.textContent = 'Missable';
      metaDiv.appendChild(missBadge);
    }
    if (trophy.hidden) {
      const hideBadge = document.createElement('span');
      hideBadge.className = 'hidden-flag';
      hideBadge.textContent = 'Hidden';
      metaDiv.appendChild(hideBadge);
    }
    nameCell.appendChild(metaDiv);

    const gradeCell = document.createElement('td');
    const gradeBadge2 = document.createElement('span');
    gradeBadge2.className = `grade-badge ${getGradeClass(trophy.grade)}`;
    gradeBadge2.textContent = trophy.grade;
    gradeCell.appendChild(gradeBadge2);

    const typeCell = document.createElement('td');
    const typeBadge2 = document.createElement('span');
    typeBadge2.className = 'type-badge';
    typeBadge2.textContent = getTypeBadge(trophy.type);
    typeCell.appendChild(typeBadge2);

    const guideCell = document.createElement('td');
    const guideDiv = document.createElement('div');
    guideDiv.className = 'trophy-guide';
    guideDiv.innerHTML = trophy.guide.replace(/\(([^)]+)\)/g, '<a href="$1" target="_blank" rel="noopener">Source</a>');
    guideCell.appendChild(guideDiv);

    const cells = [checkbox, nameCell, gradeCell, typeCell, guideCell];
    for (const cell of cells) {
      const td = document.createElement('td');
      if (cell instanceof HTMLElement) td.appendChild(cell);
      else td.textContent = cell;
      tr.appendChild(td);
    }

    tr.addEventListener('click', (e) => {
      if (e.target === checkbox || e.target.tagName === 'A') return;
      showDetail(trophy);
    });
    tr.style.cursor = 'pointer';

    elements.trophyRows.appendChild(tr);
  }
}

function renderRoadmap() {
  const phases = [
    {
      title: 'Phase 1: Story Completion (Chapters 1–5)',
      description: 'Play through the main story. Complete all chapter missions and key story missions as they appear. Don\'t skip stranger missions — many are time-limited.',
      trophies: [
        'Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Vice City, Baby!', 'Top Of The World, Ma',
        'Trust', 'Break the Bank', 'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm',
        'You Gotta Know When to Get Off'
      ]
    },
    {
      title: 'Phase 2: Stranger Strands & Character Quests',
      description: 'Finish all 8 stranger mission strands for Strangers & Freaks (silver). Complete Andy, Kenton, Billy, Randy, Tyrone, Bret and two others. Do these during the story when available.',
      trophies: [
        'Road to Rehabilitation', 'This Was No Boat Accident', 'The Lone Rider', 'Supply & Demand', 'Spin On This!',
        'Fair Game', 'Catch Me If You Can', 'Challenging Tank', 'In The Beginning…', 'Capital Offense',
        'Let\'s Go Bowling', 'Personal Best', 'Actions Speak Louder', 'Bad Luck, I Guess',
        'The Truth Is Out There', 'Ten Pin'
      ]
    },
    {
      title: 'Phase 3: Collectibles & Exploration',
      description: 'Reveal all 52 map areas (The Goodtime State). Scan 200 vehicles/locations with WAiNK (You WAiNKer! at 100, then 200 for 100%). Meditate at all 18 spots (Positive Mental Attitude — missable in Chapter 1). Complete 3 card sets (Don\'t Touch My Deck).',
      trophies: [
        'The Goodtime State', 'You WAiNKer!', 'Positive Mental Attitude', 'Don\'t Touch My Deck',
        'Whip It Good', 'On the Spot', 'Little Boxes'
      ]
    },
    {
      title: 'Phase 4: Activities & Challenges',
      description: 'Complete 250 stunts (Cunning Stunts). Gold all 42 shooting range challenges (The Shootist). Win 14 drone races (Top Fun). Win 20 different races (Earn Cash, Not Kudos). Beat Cal at fishing (Baited My Tackle). Finish one arcade game (Stick Fiddler). Complete 50 challenges (One Last Thing) — 70 needed for 100%.',
      trophies: [
        'Cunning Stunts', 'The Shootist', 'Top Fun', 'Earn Cash, Not Kudos',
        'Baited My Tackle', 'Stick Fiddler', 'One Last Thing',
        'Hot Together', 'Retail Therapy', 'Gunslinger', 'Sneakthief',
        'Maximum Withdrawal', 'A Classic Blitz Play', 'Pest Control',
        'Dime on the Dollar', 'Treat Yo Self'
      ]
    },
    {
      title: 'Phase 5: 100% Completion (A Long Road)',
      description: 'Finish the 100% checklist in Progress > Stats. Requires: all main missions, 8 stranger strands, 70/80 challenges, all 5 bank vaults, all 9 gang operations, all drone races, all shooting ranges (gold), 200 vehicle scans, 100 animal studies, all collectibles. ~100 hours post-story.',
      trophies: ['A Long Road']
    },
    {
      title: 'Phase 6: Platinum (Vice Got a Price!)',
      description: 'Earn all 54 other trophies. The platinum unlocks automatically.',
      trophies: ['Vice Got a Price!']
    }
  ];

  let html = '';
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const phaseTrophies = phase.trophies.map(name => {
      const t = trophies.find(x => x.name === name);
      return t ? `<li><strong>${t.name}</strong><span class="trophy-meta"> (${t.grade}, ${getTypeBadge(t.type)}${t.missable ? ', missable' : ''})</span></li>` : `<li><strong>${name}</strong></li>`;
    }).join('');
    html += `
      <article class="roadmap-phase">
        <h3><span class="phase-number">${i+1}</span>${phase.title}</h3>
        <p style="margin:0 0 12px;color:var(--text-muted)">${phase.description}</p>
        <ul>${phaseTrophies}</ul>
      </article>
    `;
  }
  elements.roadmapContent.innerHTML = html;
}

function renderMissable() {
  const missableTrophies = trophies.filter(t => t.missable);
  let html = '<div class="missable-list">';
  for (const t of missableTrophies) {
    const riskClass = t.name === 'Positive Mental Attitude' ? 'high-risk' : '';
    html += `
      <article class="missable-item ${riskClass}">
        <div class="item-meta">
          <span class="grade-badge ${getGradeClass(t.grade)}">${t.grade}</span>
          <span class="type-badge">${getTypeBadge(t.type)}</span>
          <span class="missable-flag">Missable</span>
          ${t.hidden ? '<span class="hidden-flag">Hidden</span>' : ''}
        </div>
        <h4>${t.name}</h4>
        <p>${t.guide}</p>
      </article>
    `;
  }
  html += '</div>';
  if (missableTrophies.length === 0) {
    html = '<p style="color:var(--text-muted);text-align:center;padding:3rem">No missable trophies in this list.</p>';
  }
  elements.missableContent.innerHTML = html;
}

function showDetail(trophy) {
  const isEarned = earned.has(trophy.name);
  const sourceLink = trophy.source ? `<a href="${trophy.source}" target="_blank" rel="noopener">${trophy.source}</a>` : 'N/A';
  elements.dialogBody.innerHTML = `
    <div class="dialog-header">
      <h2 class="dialog-title">${trophy.name}</h2>
      <div class="dialog-meta">
        <span class="grade-badge ${getGradeClass(trophy.grade)}">${trophy.grade}</span>
        <span class="type-badge">${getTypeBadge(trophy.type)}</span>
        ${trophy.missable ? '<span class="missable-flag">Missable</span>' : ''}
        ${trophy.hidden ? '<span class="hidden-flag">Hidden</span>' : ''}
        ${isEarned ? '<span class="grade-badge grade-platinum" style="background:var(--success);color:#fff">Earned</span>' : ''}
      </div>
    </div>
    <div class="dialog-body">
      <h3>Official Description</h3>
      <p>${trophy.description}</p>
      <h3>Guide</h3>
      <p>${trophy.guide.replace(/\(([^)]+)\)/g, '(<a href="$1" target="_blank" rel="noopener">Source</a>)')}</p>
      <h3>Source</h3>
      <p class="dialog-source">${sourceLink}</p>
    </div>
  `;
  elements.detailDialog.showModal();
  updateHash({ trophy: trophy._slug, roadmap: undefined, missable: undefined });
}

function closeDetail() {
  elements.detailDialog.close();
  updateHash({ trophy: undefined });
}

function updateSpoilerState() {
  const rows = elements.trophyRows.querySelectorAll('tr');
  for (const row of rows) {
    const slug = row.dataset.slug;
    const trophy = trophies.find(t => t._slug === slug);
    if (trophy && trophy.hidden && trophy.type === 'story') {
      row.classList.toggle('spoiler-hidden', spoilersHidden);
    }
  }
}

function initEventListeners() {
  elements.filterGrade.addEventListener('change', () => {
    currentFilter.grade = elements.filterGrade.value;
    render();
  });
  elements.filterType.addEventListener('change', () => {
    currentFilter.type = elements.filterType.value;
    render();
  });
  elements.filterMissableOnly.addEventListener('change', () => {
    currentFilter.missableOnly = elements.filterMissableOnly.checked;
    render();
  });
  elements.spoilerToggle.addEventListener('change', () => {
    spoilersHidden = elements.spoilerToggle.checked;
    updateSpoilerState();
    updateHash({ spoilers: spoilersHidden ? 'on' : 'off' });
  });
  elements.exportBtn.addEventListener('click', exportProgress);
  elements.importFile.addEventListener('change', (e) => {
    if (e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  elements.tabChecklist.addEventListener('click', () => switchView('checklist'));
  elements.tabRoadmap.addEventListener('click', () => switchView('roadmap'));
  elements.tabMissable.addEventListener('click', () => switchView('missable'));
  elements.dialogClose.addEventListener('click', closeDetail);
  elements.detailDialog.addEventListener('click', (e) => {
    if (e.target === elements.detailDialog) closeDetail();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.detailDialog.open) closeDetail();
  });
  window.addEventListener('hashchange', applyHashState);
}

async function init() {
  for (const [key, selector] of Object.entries({
    progressFill: '#progressFill',
    progressText: '#progressText',
    trophyRows: '#trophyRows',
    filterGrade: '#filterGrade',
    filterType: '#filterType',
    filterMissableOnly: '#filterMissableOnly',
    spoilerToggle: '#spoilerToggle',
    exportBtn: '#exportBtn',
    importFile: '#importFile',
    tabChecklist: '#tabChecklist',
    tabRoadmap: '#tabRoadmap',
    tabMissable: '#tabMissable',
    panelChecklist: '#panelChecklist',
    panelRoadmap: '#panelRoadmap',
    panelMissable: '#panelMissable',
    detailDialog: '#detailDialog',
    dialogClose: '#dialogClose',
    dialogBody: '#dialogBody',
    roadmapContent: '#roadmapContent',
    missableContent: '#missableContent'
  })) {
    elements[key] = document.querySelector(selector);
  }

  loadProgress();
  await loadTrophies();
  if (!trophies.length) return;
  initEventListeners();
  applyHashState();
  render();
}

init();