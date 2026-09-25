// Student Display Portal - JavaScript Engine (app.js)
// Implements Student data model, s.Display() simulation, CRUD, search, filter, stats & visualization

const STORAGE_KEY = 'student_display_portal_records';

// Initial Sample Data matching Display.java & Student.java structures
const defaultStudents = [];

// App State
let students = [];
let currentFilter = 'all';
let currentSort = 'reg-asc';
let searchQuery = '';
let editingId = null;
let statsChartInstance = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadStudents();
  setupEventListeners();
  render();
  initChart();
});

// Load from localStorage or defaults
function loadStudents() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      students = JSON.parse(saved);
    } catch (e) {
      students = [...defaultStudents];
    }
  } else {
    students = [...defaultStudents];
    saveStudents();
  }
}

// Save to localStorage
function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// Calculate total, avg, grade, pass/fail for a student record
function computeStudentMetrics(s) {
  const m1 = Number(s.mark1) || 0;
  const m2 = Number(s.mark2) || 0;
  const m3 = Number(s.mark3) || 0;
  const total = m1 + m2 + m3;
  const avg = Number((total / 3).toFixed(2));
  
  let grade = 'F';
  let passed = avg >= 40;
  
  if (avg >= 90) grade = 'A+';
  else if (avg >= 80) grade = 'A';
  else if (avg >= 70) grade = 'B';
  else if (avg >= 50) grade = 'C';
  else if (avg >= 40) grade = 'D';

  return { total, avg, grade, passed };
}

// Display() output simulator matching Display.java:
// System.out.println(name);
// System.out.println(reg);
// System.out.println(marks);
function getJavaDisplayOutput(s) {
  const metrics = computeStudentMetrics(s);
  return `--- Display.java Output ---\n` +
         `Student Name : ${s.name || '[Pending]'}\n` +
         `Reg. Number  : ${s.reg || 0}\n` +
         `Average Mark : ${metrics.avg} (${metrics.grade})\n` +
         `Result Status: ${metrics.passed ? 'PASSED' : 'FAILED'}`;
}

// Render Main Dashboard
function render() {
  renderStudentsGrid();
  updateStatsOverview();
  updateChart();
}

// Update Dashboard Header Cards
function updateStatsOverview() {
  const total = students.length;
  document.getElementById('statTotalStudents').textContent = total;

  if (total === 0) {
    document.getElementById('statAverageMarks').textContent = '0.0%';
    document.getElementById('statPassRate').textContent = '0%';
    document.getElementById('statTopScore').textContent = '0';
    return;
  }

  let totalAvgSum = 0;
  let passCount = 0;
  let maxAvg = 0;

  students.forEach(s => {
    const { avg, passed } = computeStudentMetrics(s);
    totalAvgSum += avg;
    if (passed) passCount++;
    if (avg > maxAvg) maxAvg = avg;
  });

  const overallAvg = (totalAvgSum / total).toFixed(1);
  const passRate = Math.round((passCount / total) * 100);

  document.getElementById('statAverageMarks').textContent = `${overallAvg}%`;
  document.getElementById('statPassRate').textContent = `${passRate}%`;
  document.getElementById('statTopScore').textContent = `${maxAvg}`;
}

// Render Cards Grid
function renderStudentsGrid() {
  const container = document.getElementById('studentsContainer');
  
  // Filter & Search
  let filtered = students.filter(s => {
    const metrics = computeStudentMetrics(s);
    if (currentFilter === 'pass' && !metrics.passed) return false;
    if (currentFilter === 'fail' && metrics.passed) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = s.name.toLowerCase().includes(q);
      const regMatch = String(s.reg).includes(q);
      const courseMatch = (s.course || '').toLowerCase().includes(q);
      if (!nameMatch && !regMatch && !courseMatch) return false;
    }
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    const metricsA = computeStudentMetrics(a);
    const metricsB = computeStudentMetrics(b);

    if (currentSort === 'reg-asc') return a.reg - b.reg;
    if (currentSort === 'reg-desc') return b.reg - a.reg;
    if (currentSort === 'marks-desc') return metricsB.avg - metricsA.avg;
    if (currentSort === 'name-asc') return a.name.localeCompare(b.name);
    return 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-folder-open empty-icon"></i>
        <h3 class="empty-title">No Student Records Found</h3>
        <p class="empty-desc">Try adding a new student using the form on the left or clearing your search filters.</p>
        <button class="btn btn-primary btn-sm" onclick="resetSearchFilters()">
          <i class="fa-solid fa-rotate-left"></i> Reset Filters
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(s => {
    const metrics = computeStudentMetrics(s);
    const initial = (s.name || 'S').charAt(0).toUpperCase();

    return `
      <div class="student-card">
        <div>
          <div class="student-card-header">
            <div class="avatar">${initial}</div>
            <div style="overflow: hidden;">
              <h3 class="student-name" title="${escapeHtml(s.name)}">${escapeHtml(s.name)}</h3>
              <div class="student-reg"><i class="fa-solid fa-hashtag"></i> REG-${s.reg}</div>
            </div>
          </div>

          <div class="student-metrics">
            <div class="metric-row">
              <span class="metric-label">Course:</span>
              <span class="metric-value">${escapeHtml(s.course || 'N/A')}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Average Score:</span>
              <span class="metric-value" style="font-size: 1.05rem;">${metrics.avg}%</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Grade Status:</span>
              <span class="grade-badge ${metrics.passed ? 'badge-pass' : 'badge-fail'}">
                ${metrics.passed ? '<i class="fa-solid fa-check"></i> PASS' : '<i class="fa-solid fa-xmark"></i> FAIL'} (${metrics.grade})
              </span>
            </div>
            
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${Math.min(100, metrics.avg)}%; background: ${metrics.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)'}"></div>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" onclick="openReportModal('${s.id}')">
            <i class="fa-solid fa-eye"></i> Report
          </button>
          <button class="btn btn-secondary btn-sm" onclick="editStudent('${s.id}')">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Form Submission (Add or Edit)
document.getElementById('studentForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const reg = parseInt(document.getElementById('regInput').value);
  const name = document.getElementById('nameInput').value.trim();
  const course = document.getElementById('courseInput').value.trim();
  const mark1 = parseInt(document.getElementById('mark1Input').value);
  const mark2 = parseInt(document.getElementById('mark2Input').value);
  const mark3 = parseInt(document.getElementById('mark3Input').value);

  if (editingId) {
    // Update existing
    const idx = students.findIndex(s => s.id === editingId);
    if (idx !== -1) {
      students[idx] = { id: editingId, reg, name, course, mark1, mark2, mark3 };
      showToast('Student record updated successfully!', 'success');
    }
    cancelEditing();
  } else {
    // Check for duplicate reg number
    if (students.some(s => s.reg === reg)) {
      showToast(`Registration number ${reg} already exists!`, 'danger');
      return;
    }

    const newStudent = {
      id: Date.now().toString(),
      reg,
      name,
      course: course || 'General',
      mark1,
      mark2,
      mark3
    };

    students.push(newStudent);
    showToast(`Added student ${name} (REG-${reg})`, 'success');
  }

  saveStudents();
  render();
  resetForm();
});

// Edit Student Handler
function editStudent(id) {
  const s = students.find(item => item.id === id);
  if (!s) return;

  editingId = id;
  document.getElementById('studentIdInput').value = s.id;
  document.getElementById('regInput').value = s.reg;
  document.getElementById('nameInput').value = s.name;
  document.getElementById('courseInput').value = s.course || '';
  document.getElementById('mark1Input').value = s.mark1;
  document.getElementById('mark2Input').value = s.mark2;
  document.getElementById('mark3Input').value = s.mark3;

  document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Student';
  document.getElementById('formModeTag').textContent = 'Editing Mode';
  document.getElementById('saveStudentBtn').innerHTML = '<i class="fa-solid fa-check"></i> Update Record';
  document.getElementById('resetFormBtn').style.display = 'inline-flex';

  updateLiveConsolePreview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEditing() {
  editingId = null;
  document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-user-plus"></i> Add New Student';
  document.getElementById('formModeTag').textContent = 'New Entry';
  document.getElementById('saveStudentBtn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Student Record';
  document.getElementById('resetFormBtn').style.display = 'none';
  resetForm();
}

document.getElementById('resetFormBtn').addEventListener('click', cancelEditing);

function resetForm() {
  document.getElementById('studentForm').reset();
  document.getElementById('courseInput').value = 'Computer Science';
  updateLiveConsolePreview();
}

// Delete Student
function deleteStudent(id) {
  const s = students.find(item => item.id === id);
  if (!s) return;

  if (confirm(`Are you sure you want to delete ${s.name} (Reg: ${s.reg})?`)) {
    students = students.filter(item => item.id !== id);
    saveStudents();
    render();
    showToast(`Deleted student ${s.name}`, 'info');
  }
}

// Live Console Output Update on Form Input
function updateLiveConsolePreview() {
  const reg = document.getElementById('regInput').value;
  const name = document.getElementById('nameInput').value;
  const mark1 = document.getElementById('mark1Input').value || 0;
  const mark2 = document.getElementById('mark2Input').value || 0;
  const mark3 = document.getElementById('mark3Input').value || 0;

  const tempStudent = { reg, name, mark1, mark2, mark3 };
  document.getElementById('javaConsoleOutput').textContent = getJavaDisplayOutput(tempStudent);
}

['regInput', 'nameInput', 'mark1Input', 'mark2Input', 'mark3Input'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateLiveConsolePreview);
});

// Setup Events (Search, Filter, Sort, Modals)
function setupEventListeners() {
  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderStudentsGrid();
  });

  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.getAttribute('data-filter');
      renderStudentsGrid();
    });
  });

  // Sort Selector
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderStudentsGrid();
  });

  // Java Modal
  const javaModal = document.getElementById('javaModal');
  document.getElementById('openJavaModalBtn').addEventListener('click', () => {
    javaModal.classList.add('active');
  });
  document.getElementById('closeJavaModalBtn').addEventListener('click', () => {
    javaModal.classList.remove('active');
  });

  // Report Modal Close
  const reportModal = document.getElementById('reportModal');
  document.getElementById('closeReportModalBtn').addEventListener('click', () => {
    reportModal.classList.remove('active');
  });

  // Close modals on overlay click
  window.addEventListener('click', (e) => {
    if (e.target === javaModal) javaModal.classList.remove('active');
    if (e.target === reportModal) reportModal.classList.remove('active');
  });

  // Export Data Button
  document.getElementById('exportDataBtn').addEventListener('click', exportData);
}

function resetSearchFilters() {
  searchQuery = '';
  document.getElementById('searchInput').value = '';
  currentFilter = 'all';
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-filter') === 'all');
  });
  renderStudentsGrid();
}

// Student Academic Report Modal
function openReportModal(id) {
  const s = students.find(item => item.id === id);
  if (!s) return;

  const metrics = computeStudentMetrics(s);
  const modalBody = document.getElementById('reportModalBody');

  modalBody.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div class="avatar" style="width: 70px; height: 70px; font-size: 1.8rem; margin: 0 auto 1rem auto;">
        ${s.name.charAt(0).toUpperCase()}
      </div>
      <h2 style="font-size: 1.5rem; color: #fff;">${escapeHtml(s.name)}</h2>
      <p style="color: var(--accent-cyan); font-family: 'Fira Code', monospace; margin-top: 0.2rem;">
        REGISTRATION NO: ${s.reg}
      </p>
      <p style="color: var(--text-muted); font-size: 0.9rem;">${escapeHtml(s.course || 'N/A')}</p>
    </div>

    <div style="background: rgba(0,0,0,0.3); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
      <h4 style="color: var(--text-muted); text-transform: uppercase; font-size: 0.8rem; margin-bottom: 1rem;">
        Subject Score Breakdown
      </h4>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center;">
        <div style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: var(--radius-sm);">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Subject 1</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: #fff;">${s.mark1}</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: var(--radius-sm);">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Subject 2</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: #fff;">${s.mark2}</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: var(--radius-sm);">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Subject 3</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: #fff;">${s.mark3}</div>
        </div>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); padding: 1rem 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
      <div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">Total Marks: <strong>${metrics.total} / 300</strong></div>
        <div style="font-size: 1.1rem; font-weight: 700; color: #fff;">Average: ${metrics.avg}%</div>
      </div>
      <div style="text-align: right;">
        <span class="grade-badge ${metrics.passed ? 'badge-pass' : 'badge-fail'}" style="font-size: 0.9rem; padding: 0.4rem 0.8rem;">
          ${metrics.passed ? 'RESULT: PASS' : 'RESULT: FAIL'}
        </span>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">Grade: <strong>${metrics.grade}</strong></div>
      </div>
    </div>

    <div class="java-preview-box">
      <div class="java-preview-header">
        <span>s.Display() Verification</span>
      </div>
      <div class="java-preview-output">${getJavaDisplayOutput(s)}</div>
    </div>

    <div style="margin-top: 1.5rem; text-align: right;">
      <button class="btn btn-secondary" onclick="window.print()">
        <i class="fa-solid fa-print"></i> Print Report Card
      </button>
    </div>
  `;

  document.getElementById('reportModal').classList.add('active');
}

// Chart.js Chart Initialization & Updates
function initChart() {
  const ctx = document.getElementById('statsChart').getContext('2d');
  
  statsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Grade A+ / A', 'Grade B', 'Grade C', 'Failed'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: [
          '#10b981',
          '#6366f1',
          '#f59e0b',
          '#f43f5e'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#9ca3af',
            font: { family: 'Inter', size: 11 },
            padding: 12
          }
        }
      },
      cutout: '70%'
    }
  });

  updateChart();
}

function updateChart() {
  if (!statsChartInstance) return;

  let gradeA = 0, gradeB = 0, gradeC = 0, fail = 0;

  students.forEach(s => {
    const { avg, passed } = computeStudentMetrics(s);
    if (!passed) {
      fail++;
    } else if (avg >= 80) {
      gradeA++;
    } else if (avg >= 70) {
      gradeB++;
    } else {
      gradeC++;
    }
  });

  statsChartInstance.data.datasets[0].data = [gradeA, gradeB, gradeC, fail];
  statsChartInstance.update();
}

// Export Records to JSON
function exportData() {
  if (students.length === 0) {
    showToast('No student data to export.', 'info');
    return;
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `student_records_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast('Exported student dataset to JSON file.', 'success');
}

// Toast Notifications Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'danger') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Security Helper to prevent HTML Injection
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
