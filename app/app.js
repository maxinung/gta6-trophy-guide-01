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
    if (view === 'missable' && t.missable && t.missable_reason) {
      displayGuide = t.missable_reason;
    }

    const cells = [
      box,
      `<span class="trophy-name">${displayName}</span>${isSpoiler && t.hidden ? ' <span class="spoiler-note">(hidden)</span>' : ''}`,
      t.grade,
      displayGuide
    ];

    const tr = document.createElement('tr');
    for (const c of cells) {
      const td = document.createElement('td');
      if (typeof c === 'string') td.textContent = c;
      else td.append(c);
      tr.append(td);
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

function renderRoadmap() {
  // Show path to platinum: all trophies in ID order with earned state
  renderTable();
  // Add roadmap-specific styling/class adjustments
  document.querySelectorAll('#rows tr').forEach((tr, i) => {
    const gradeEl = tr.cells[2];
    // Highlight platinum path
    if (tr.cells[1].textContent.includes('Vice Got a Price!') || tr.cells[1].innerHTML.includes('platinum')) {
      tr.style.fontWeight = 'bold';
      tr.style.color = '#ffd700';
    }
  });
}

function renderMissable() {
  // Already filtered in renderTable for missable/hidden only
  renderTable();
}

// ----- modal -----

function openModal(trophy) {
  modalTitle.textContent = trophy.name;
  modalGrade.textContent = trophy.grade;
  modalDesc.textContent = trophy.description;
  modalGuide.textContent = trophy.guide;
  modalSource.textContent = trophy.source || 'Unknown';

  // Build source matrix - list of unique URLs per source type
  const sources = trophy.source ? trophy.source.split('; ').filter(s => s) : [];
  sourceMatrix.innerHTML = '';
  const seenUrls = new Set();
  for (const src of sources) {
    // Extract URLs from known sources
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

grade.addEventListener('change', renderTable);
spoiler.addEventListener('change', renderTable);
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
  renderTable();
  updateProgress();
});
viewSelect.addEventListener('change', renderTable);

// ----- initial render -----

renderTable();
updateProgress();