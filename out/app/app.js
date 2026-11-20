/* A plain checklist of the 55 trophies: tick one off and it stays ticked (localStorage); export and import the ticks.
   Features: grade filter, spoiler setting, roadmap, missable filter, progress saving.
   Trophies data from app/data/trophies.json.
   URL params: ?earned=name1,name2,... ?spoiler=on ?missable=on
*/
const KEY = 'gta6-trophy-checklist';
const rows = document.getElementById('rows');
const grade = document.getElementById('grade');
const spoiler = document.getElementById('spoiler');
const missable = document.getElementById('missable');
// Parse URL query parameters
const urlParams = new URLSearchParams(new URL(window.location.href).search);
const urlEarned = urlParams.get('earned') ? urlParams.get('earned').split(',') : [];
const urlSpoiler = urlParams.get('spoiler');
const urlMissable = urlParams.get('missable');
const doc = await (await fetch('data/trophies.json')).json();
const allTrophies = doc.trophies;
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
// Override with URL parameter if present (for demo/screenshot purposes)
if (urlEarned.length > 0) {
  earned = new Set(urlEarned);
}
let spoilerOn = urlSpoiler === 'on';
let missableOn = urlMissable === 'on';

function isMissable(trophy) {
  return trophy.missable && !earned.has(trophy.name);
}

function shouldShow(trophy) {
  // Grade filter
  if (grade.value !== 'all' && trophy.grade !== grade.value) return false;
  // Spoiler filter: hide trophies not yet earned if spoiler is on
  if (spoilerOn && !earned.has(trophy.name) && trophy.hidden) return false;
  // Missable filter: when "Missable only" is selected, show only missable trophies
  if (missable.value === 'missable' && !isMissable(trophy) && !earned.has(trophy.name)) return false;
  return true;
}

function render() {
  rows.replaceChildren();
  for (const t of allTrophies) {
    if (!shouldShow(t)) continue;
    const tr = document.createElement('tr');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      save();
      render();
    });
    // Guide column: show guide text, but hide if spoiler is on and trophy is hidden/unn earned
    const guideText = spoilerOn && t.hidden && !earned.has(t.name) ? '*** Spoiler: earn this trophy to see the guide **' : t.guide;
    const cells = [
      box,
      `${t.name}\\n${t.description}`,
      t.grade,
      guideText
    ];
    for (const c of cells) {
      const td = document.createElement('td');
      if (typeof c === 'string') td.textContent = c;
      else td.append(c);
      tr.append(td);
    }
    rows.append(tr);
  }
  document.getElementById('progress').textContent = `${earned.size} of ${allTrophies.length} earned`;
  // Show/hide roadmap based on progress (show when at least some trophies earned)
  const roadmapDiv = document.getElementById('roadmap');
  roadmapDiv.style.display = earned.size > 0 ? 'block' : 'none';
  
  // Update UI state
  const missableCount = allTrophies.filter(t => isMissable(t) || earned.has(t.name)).length;
  document.getElementById('progress').textContent += ` | Missable: ${missableCount}`;
  // Sync UI controls with URL params
  spoiler.value = spoilerOn ? 'on' : 'off';
  missable.value = missableOn ? 'missable' : 'all';
}

document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned])], { type: 'application/json' }));
  a.download = 'trophy-progress.json';
  a.click();
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  earned = new Set(JSON.parse(await file.text()));
  save();
  render();
});
grade.addEventListener('change', render);
spoiler.addEventListener('change', (e) => {
  spoilerOn = e.target.value === 'on';
  render();
});
missable.addEventListener('change', render);
render();