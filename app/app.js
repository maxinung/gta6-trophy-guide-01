/* GTA 6 Trophy Guide & Tracker - App Logic */

let GAME_TROPHIES = [];
let TOTAL = 0;

// State
let earned = JSON.parse(localStorage.getItem('gta6_trophies_earned')) || {};
let spoilerEnabled = JSON.parse(localStorage.getItem('gta6_spoiler')) !== false;
let exportedData = null;

// DOM Elements
const checklistBody = document.getElementById('checklist-body');
const roadmapSteps = document.getElementById('roadmap-steps');
const missableBody = document.getElementById('missable-body');
const progressText = document.getElementById('progress-text');
const tabBtns = document.querySelectorAll('.tab-btn');
const appSection = document.getElementById('app');

// Load trophies data via fetch (works in browser without import assertions)
async function loadTrophies() {
  try {
    const response = await fetch('data/trophies.json');
    const data = await response.json();
    GAME_TROPHIES = data.trophies;
    TOTAL = GAME_TROPHIES.length;
    console.log(`Loaded ${TOTAL} trophies`);
  } catch (e) {
    console.error('Failed to load trophies.json:', e);
    GAME_TROPHIES = [];
    TOTAL = 0;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadTrophies();
  renderChecklist();
  renderMissable();
  updateProgress();
  setupTabSwitching();
  setupModals();
  setupFilters();
  setupExportImport();
  setupSpoilerToggle();
});

// Tab switching
function setupTabSwitching() {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show corresponding section
      document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.remove('active');
      });

      const tab = btn.dataset.tab;
      document.getElementById(tab).classList.add('active');
    });
  });
}

// Render checklist table
function renderChecklist() {
  let html = '';
  GAME_TROPHIES.forEach((trophy, idx) => {
    const isEarned = earned[trophy.name] === true;
    const displayName = spoilerEnabled ? trophy.name : (trophy.hidden ? '??? Hidden' : trophy.name);
    const gradeColor = gradeToColor(trophy.grade);
    const guideText = spoilerEnabled || !trophy.hidden ? trophy.guide : 'Hidden until earned';
    const sourceLink = `<a href="${trophy.source}" target="_blank" style="color:var(--accent);text-decoration:underline;font-size:0.75rem;">Source</a>`;

    html += `<tr>
      <td>${idx + 1}</td>
      <td title="${trophy.name}">${displayName}</td>
      <td><span style="color:${gradeColor};" title="${trophy.grade}">${trophy.grade.charAt(0).toUpperCase() + trophy.grade.slice(1)}</span></td>
      <td title="${trophy.guide}">${guideText}</td>
      <td>${sourceLink}</td>
    </tr>`;
  });
  checklistBody.innerHTML = html;

  // Add click handlers for modals
  document.querySelectorAll('#checklist-table tbody tr').forEach((row, idx) => {
    row.addEventListener('click', () => openTrophyModal(GAME_TROPHIES[idx]));
  });
}

// Render missable/hidden table
function renderMissable() {
  const missableTrophies = GAME_TROPHIES.filter(t => t.missable || t.hidden);
  let html = '';

  missableTrophies.forEach((trophy, idx) => {
    const isEarned = earned[trophy.name] === true;
    const gradeColor = gradeToColor(trophy.grade);
    const missableReason = trophy.missable ? (trophy.missable_reason || 'Potentially missable') : 'Hidden until earned';
    const displayText = spoilerEnabled || !trophy.hidden ? trophy.official : 'Hidden';

    html += `<tr>
      <td title="${trophy.name}">${trophy.name}</td>
      <td><span style="color:${gradeColor};" title="${trophy.grade}">${trophy.grade.charAt(0).toUpperCase() + trophy.grade.slice(1)}</span></td>
      <td title="${missableReason}">${missableReason}</td>
    </tr>`;
  });

  missableBody.innerHTML = html;
}

// Update progress display
function updateProgress() {
  let count = 0;
  GAME_TROPHIES.forEach(t => {
    if (earned[t.name] === true) count++;
  });
  const percent = Math.round((count / TOTAL) * 100);
  progressText.textContent = `${count}/${TOTAL} earned (${percent}%)`;
}

// Open trophy modal
function openTrophyModal(trophy) {
  const isEarned = earned[trophy.name] === true;
  const gradeColor = gradeToColor(trophy.grade);

  let guideContent = trophy.guide;
  if (spoilerEnabled || !trophy.hidden) {
    // Show full guide
  } else {
    guideContent = 'Hidden until earned - meditate at every spot across Leonida';
  }

  const modalHTML = `
    <div class="modal" id="trophy-modal">
      <div class="modal-content">
        <span class="modal-close" onclick="closeTrophyModal()">&times;</span>
        <h2>${trophy.official}</h2>
        <p><strong>Grade:</strong> <span style="color:${gradeColor}">${trophy.grade.charAt(0).toUpperCase() + trophy.grade.slice(1)}</span></p>
        <p><strong>Guide:</strong></p>
        <p>${guideContent}</p>
        <p><strong>Source:</strong> <a href="${trophy.source}" target="_blank">${trophy.source}</a></p>
        ${isEarned ? '<p style="color: good; margin-top: 1rem;">✓ Earned!</p>' : ''}
        <button class="spoiler-toggle" onclick="toggleSpoiler()">Toggle Spoiler</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('trophy-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeTrophyModal() {
  const modal = document.getElementById('trophy-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
  }
}

function toggleSpoiler() {
  spoilerEnabled = !spoilerEnabled;
  localStorage.setItem('gta6_spoiler', spoilerEnabled);
  renderChecklist();
  renderMissable();
  closeTrophyModal();
}

// Grade to color helper
function gradeToColor(grade) {
  const colors = { 'platinum': '#ffd700', 'gold': '#ffd700', 'silver': '#c0c0c0', 'bronze': '#cd7f32' };
  return colors[grade] || '#fff';
}

// Filters
function setupFilters() {
  // Grade filter buttons
  const gradeBtns = document.querySelectorAll('.filter-btn');
  gradeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      gradeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters(btn.dataset.filter);
    });
  });
}

function applyFilters(filter) {
  const rows = document.querySelectorAll('#checklist-table tbody tr');
  let shown = 0;

  rows.forEach(row => {
    const grade = row.cells[2].textContent.trim();
    const shouldShow = filter === 'all' || grade.toLowerCase().includes(filter);
    row.style.display = shouldShow ? '' : 'none';
    if (shouldShow) shown++;
  });

  // Update visible count
  const total = document.querySelectorAll('#checklist-table tbody tr:not([style*="display: none"])').length;
  progressText.textContent = `${show}/${TOTAL} earned (${Math.round((show/TOTAL)*100)}%)`;
}

// Export/Import
function setupExportImport() {
  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export Progress';
  exportBtn.style.margin = '1rem 0';
  exportBtn.style.padding = '0.5rem 1rem';
  exportBtn.style.background = '#333';
  exportBtn.style.color = '#fff';
  exportBtn.style.border = 'none';
  exportBtn.style.borderRadius = '4px';
  exportBtn.style.cursor = 'pointer';

  exportBtn.addEventListener('click', () => {
    const data = {
      earned,
      spoiler: spoilerEnabled,
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gta6_trophies_progress.json';
    a.click();
    URL.revoke(url);
  });

  // Append to filter controls area
  const filterArea = document.querySelector('.filter-controls') || document.body;
  document.querySelector('footer').parentNode.insertBefore(exportBtn, document.querySelector('footer'));
}

// Setup spoiler toggle in modals
window.toggleSpoiler = toggleSpoiler;
window.closeTrophyModal = closeTrophyModal;