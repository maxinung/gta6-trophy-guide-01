/*
 * GTA VI Trophy Guide & Tracker — app.js
 * Handles checklist, roadmap, missable views, progress tracking, export/import,
 * spoiler mode, modal details, and source matrix.
 */
const KEY = 'gta6-trophy-checklist';
const rows = document.getElementById('rows');
const grade = document.getElementById('grade');
const spoiler = document.getElementById('spoiler');
const exportBtn = document.getElementById('export');
const importInput = document.getElementById('import');
const viewSelect = document.getElementById('view');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('close-modal');
const modalTitle = document.getElementById('modal-title');
const modalGrade = document.getElementById('modal-grade');
const modalDesc = document.getElementById('modal-desc');
const modalGuide = document.getElementById('modal-guide');
const modalSource = document.getElementById('modal-source');
const sourceMatrix = document.getElementById('source-matrix');
const progress = document.getElementById('progress');

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
const doc = await (await fetch('data/trophies.json')).json();

// ----- render functions -----

function renderTable() {
  const gradeFilter = grade.value;
  const isSpoiler = spoiler.checked;
  const view = viewSelect.value;

  // Update table header based on view
  updateTableHeader(view);

  rows.replaceChildren();

  // Filter trophies based on grade and spoiler status
  let trophies = doc.trophies;
  if (gradeFilter !== 'all') {
    trophies = trophies.filter(t => t.grade === gradeFilter);
  }

  // For roadmap view, sort by logical order (chapter progression)
  if (view === 'roadmap') {
    trophies = [...trophies].sort((a, b) => a.id - b.id);
  }

  for (const t of trophies) {
    // Spoiler mode: hide name for hidden trophies
    const displayName = isSpoiler && t.hidden
      ? 'Hidden until earned'
      : t.name;

    // Check if earned
    const isEarned = earned.has(t.name);
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned;
    box.disabled = view === 'missable'; // Disable in missable view

    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      save();
      updateProgress();
      renderTable(); // re-render to reflect changes
    });

    // Build guide text (trim to one line or key phrase)
    const guideText = t.guide ? t.guide.split('.')[0] + '.' : '';

    // For missable view, show only missable/hidden with reasons
    if (view === 'missable' && !(t.missable || t.hidden)) {
      continue; // skip non-missable/non-hidden
    }

    // In missable view, show missable_reason for missable trophies
    let displayGuide = guideText;
    let displayReason = '';
    if (view === 'missable' && t.missable && t.missable_reason) {
      displayGuide = guideText;
      displayReason = t.missable_reason;
    } else if (view === 'missable' && t.hidden && !t.missable) {
      displayReason = 'Hidden until earned';
    }

    const tr = document.createElement('tr');
    if (isEarned) tr.classList.add('earned');
    if (view === 'roadmap') tr.classList.add('roadmap-step');

    // Earned checkbox cell
    const tdEarned = document.createElement('td');
    tdEarned.className = 'earned';
    tdEarned.append(box);
    tr.append(tdEarned);

    // Trophy name cell - use innerHTML for the span
    const tdTrophy = document.createElement('td');
    tdTrophy.className = 'trophy';
    const gradeClass = `grade-${t.grade}`;
    const spoilerNote = isSpoiler && t.hidden ? ' <span class="spoiler-note">(hidden)</span>' : '';
    tdTrophy.innerHTML = `<span class="trophy-name">${displayName}</span>${spoilerNote}`;
    tr.append(tdTrophy);

    // Grade cell with badge
    const tdGrade = document.createElement('td');
    tdGrade.className = 'grade';
    tdGrade.innerHTML = `<span class="grade-badge ${gradeClass}">${t.grade}</span>`;
    tr.append(tdGrade);

    // Guide/How to get it cell
    const tdGuide = document.createElement('td');
    tdGuide.className = 'guide';
    tdGuide.textContent = displayGuide;
    tr.append(tdGuide);

    // Reason cell (only for missable view)
    if (view === 'missable') {
      const tdReason = document.createElement('td');
      tdReason.className = 'reason';
      tdReason.textContent = displayReason;
      tr.append(tdReason);
    }

    // Click to open modal
    tr.addEventListener('click', (e) => {
      // Don't open modal if clicking the checkbox
      if (e.target.type === 'checkbox') return;
      openModal(t);
    });

    rows.append(tr);
  }

  updateProgress();
}

function updateTableHeader(view) {
  const thead = document.querySelector('thead tr');
  if (!thead) return;

  if (view === 'missable') {
    thead.innerHTML = '<th class="earned">Earned</th><th class="trophy">Trophy</th><th class="grade">Grade</th><th class="guide">How to get it</th><th class="reason">Reason</th>';
  } else if (view === 'roadmap') {
    thead.innerHTML = '<th class="earned">Step</th><th class="trophy">Trophy</th><th class="grade">Grade</th><th class="guide">How to get it</th>';
  } else {
    thead.innerHTML = '<th class="earned">Earned</th><th class="trophy">Trophy</th><th class="grade">Grade</th><th class="guide">How to get it</th>';
  }
}

function renderRoadmap() {
  // Roadmap view: show all trophies in order with step numbers
  const gradeFilter = grade.value;
  const isSpoiler = spoiler.checked;

  // Update table header for roadmap
  updateTableHeader('roadmap');

  rows.replaceChildren();

  let trophies = doc.trophies;
  if (gradeFilter !== 'all') {
    trophies = trophies.filter(t => t.grade === gradeFilter);
  }
  trophies = [...trophies].sort((a, b) => a.id - b.id);

  for (let i = 0; i < trophies.length; i++) {
    const t = trophies[i];
    const isEarned = earned.has(t.name);

    const displayName = isSpoiler && t.hidden
      ? 'Hidden until earned'
      : t.name;

    const guideText = t.guide ? t.guide.split('.')[0] + '.' : '';

    const tr = document.createElement('tr');
    tr.classList.add('roadmap-step');
    if (isEarned) tr.classList.add('earned');

    // Step number cell
    const tdStep = document.createElement('td');
    tdStep.className = 'earned';
    tdStep.textContent = `${i + 1}`;
    tr.append(tdStep);

    // Trophy name cell
    const tdTrophy = document.createElement('td');
    tdTrophy.className = 'trophy';
    const spoilerNote = isSpoiler && t.hidden ? ' <span class="spoiler-note">(hidden)</span>' : '';
    tdTrophy.innerHTML = `<span class="trophy-name">${displayName}</span>${spoilerNote}`;
    tr.append(tdTrophy);

    // Grade cell with badge
    const tdGrade = document.createElement('td');
    tdGrade.className = 'grade';
    const gradeClass = `grade-${t.grade}`;
    tdGrade.innerHTML = `<span class="grade-badge ${gradeClass}">${t.grade}</span>`;
    tr.append(tdGrade);

    // Guide cell
    const tdGuide = document.createElement('td');
    tdGuide.className = 'guide';
    tdGuide.textContent = guideText;
    tr.append(tdGuide);

    // Click to open modal
    tr.addEventListener('click', (e) => {
      if (e.target.type === 'checkbox') return;
      openModal(t);
    });

    rows.append(tr);
  }

  updateProgress();
}

function renderMissable() {
  // Missable view: show only missable/hidden with reasons
  const gradeFilter = grade.value;
  const isSpoiler = spoiler.checked;

  // Update table header for missable
  updateTableHeader('missable');

  rows.replaceChildren();

  let trophies = doc.trophies;
  if (gradeFilter !== 'all') {
    trophies = trophies.filter(t => t.grade === gradeFilter);
  }

  // Filter to only missable or hidden
  trophies = trophies.filter(t => t.missable || t.hidden);

  for (const t of trophies) {
    const displayName = isSpoiler && t.hidden
      ? 'Hidden until earned'
      : t.name;

    const isEarned = earned.has(t.name);
    const guideText = t.guide ? t.guide.split('.')[0] + '.' : '';

    let displayReason = '';
    if (t.missable && t.missable_reason) {
      displayReason = t.missable_reason;
    } else if (t.hidden && !t.missable) {
      displayReason = 'Hidden until earned';
    }

    const tr = document.createElement('tr');
    if (isEarned) tr.classList.add('earned');

    // Earned checkbox cell (disabled in missable view)
    const tdEarned = document.createElement('td');
    tdEarned.className = 'earned';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned;
    box.disabled = true;
    tdEarned.append(box);
    tr.append(tdEarned);

    // Trophy name cell
    const tdTrophy = document.createElement('td');
    tdTrophy.className = 'trophy';
    const spoilerNote = isSpoiler && t.hidden ? ' <span class="spoiler-note">(hidden)</span>' : '';
    tdTrophy.innerHTML = `<span class="trophy-name">${displayName}</span>${spoilerNote}`;
    tr.append(tdTrophy);

    // Grade cell with badge
    const tdGrade = document.createElement('td');
    tdGrade.className = 'grade';
    const gradeClass = `grade-${t.grade}`;
    tdGrade.innerHTML = `<span class="grade-badge ${gradeClass}">${t.grade}</span>`;
    tr.append(tdGrade);

    // Guide cell
    const tdGuide = document.createElement('td');
    tdGuide.className = 'guide';
    tdGuide.textContent = guideText;
    tr.append(tdGuide);

    // Reason cell
    const tdReason = document.createElement('td');
    tdReason.className = 'reason';
    tdReason.textContent = displayReason;
    tr.append(tdReason);

    // Click to open modal
    tr.addEventListener('click', (e) => {
      if (e.target.type === 'checkbox') return;
      openModal(t);
    });

    rows.append(tr);
  }

  updateProgress();
}

// ----- modal -----

function openModal(trophy) {
  modalTitle.textContent = trophy.name;
  modalGrade.innerHTML = `<span class="grade-badge grade-${trophy.grade}">${trophy.grade}</span>`;
  modalDesc.textContent = trophy.description;
  modalGuide.textContent = trophy.guide;

  // Build source links
  const sources = trophy.source ? trophy.source.split('; ').filter(s => s) : [];
  sourceMatrix.innerHTML = '';
  const seenUrls = new Set();
  for (const src of sources) {
    let url = src;
    if (src.includes('GTABase')) url = 'https://gtabase.com';
    else if (src.includes('PowerPyx')) url = 'https://powerpyx.com';
    else if (src.includes('GamesRadar')) url = 'https://gamesradar.com';
    else if (src.includes('Official PlayStation')) url = 'https://playstation.com';
    else if (src.includes('CULTR')) url = 'https://cultr.com';
    else if (src.includes('Beebom')) url = 'https://beebom.com';

    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      const a = document.createElement('a');
      a.href = url;
      a.textContent = url;
      a.target = '_blank';
      a.rel = 'noopener';
      sourceMatrix.append(a);
      sourceMatrix.append(document.createElement('br'));
    }
  }

  modal.showModal();
}

closeModal.addEventListener('click', () => modal.close());
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.close();
});

// ----- progress -----

function updateProgress() {
  const count = earned.size;
  progress.textContent = `${count} of ${doc.trophies.length} earned`;
  localStorage.setItem(KEY, JSON.stringify([...earned]));
}

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
}

// ----- event listeners -----

grade.addEventListener('change', () => {
  const view = viewSelect.value;
  if (view === 'roadmap') renderRoadmap();
  else if (view === 'missable') renderMissable();
  else renderTable();
});

spoiler.addEventListener('change', () => {
  const view = viewSelect.value;
  if (view === 'roadmap') renderRoadmap();
  else if (view === 'missable') renderMissable();
  else renderTable();
});

exportBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned])], { type: 'application/json' }));
  a.download = 'trophy-progress.json';
  a.click();
});

importInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  earned = new Set(JSON.parse(await file.text()));
  save();
  const view = viewSelect.value;
  if (view === 'roadmap') renderRoadmap();
  else if (view === 'missable') renderMissable();
  else renderTable();
  updateProgress();
});

viewSelect.addEventListener('change', () => {
  const view = viewSelect.value;
  if (view === 'roadmap') renderRoadmap();
  else if (view === 'missable') renderMissable();
  else renderTable();
});

// ----- initial render -----

renderTable();
updateProgress();