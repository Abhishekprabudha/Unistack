async function loadData() {
  const response = await fetch('./data/platform.json');
  return response.json();
}

function setActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.getAttribute('href') === current) link.classList.add('active');
  });
}

function metricCard(label, value, delta, trend='up') {
  return `<div class="metric"><div class="label">${label}</div><div class="value">${value}</div><div class="delta ${trend}">${delta}</div></div>`;
}

function statusBadge(text) {
  const map = {
    'On Track': 'green',
    'Tight Connection': 'yellow',
    'Late Inbound': 'red',
    'Critical': 'red',
    'High': 'yellow',
    'Standard': 'blue',
    'Ready for Build': 'green',
    'Dock Check-in': 'blue',
    'ULD Packed': 'green',
    'Security Hold': 'red'
  };
  const color = map[text] || 'blue';
  return `<span class="status"><span class="dot ${color}"></span>${text}</span>`;
}

function renderOverview(data) {
  const metrics = document.getElementById('overview-metrics');
  if (!metrics) return;
  metrics.innerHTML = [
    metricCard('Active flights', data.platformMetrics.activeFlights, '+18 vs last hour'),
    metricCard('Cargo AWBs', data.platformMetrics.cargoAwbs, '+126 accepted today'),
    metricCard('Bag events / min', data.platformMetrics.baggageEventsPerMin.toLocaleString(), '−2.1% noise after normalization', 'down'),
    metricCard('Governance coverage', `${data.platformMetrics.policyCoverage}%`, '+4 policies enforced this week')
  ].join('');

  const modules = document.getElementById('module-cards');
  if (modules) {
    modules.innerHTML = data.modules.map(mod => `
      <div class="card">
        <h4>${mod.name}</h4>
        <p>${mod.description}</p>
        <ul>${mod.capabilities.map(item => `<li>${item}</li>`).join('')}</ul>
      </div>`).join('');
  }

  const templates = document.getElementById('template-table');
  if (templates) {
    templates.innerHTML = data.builderTemplates.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.time}</td>
        <td>${item.components}</td>
      </tr>`).join('');
  }
}

function renderBaggage(data) {
  const table = document.getElementById('baggage-table');
  if (!table) return;
  table.innerHTML = data.baggageFlights.map(row => `
    <tr>
      <td><strong>${row.flight}</strong></td>
      <td>${row.route}</td>
      <td>${statusBadge(row.status)}</td>
      <td>${row.screened}</td>
      <td>${row.missed}</td>
      <td><div class="progress-bar"><span style="width:${row.sla}%"></span></div><div class="footer-note">${row.sla}% within target</div></td>
    </tr>`).join('');

  const chart = document.getElementById('baggage-bars');
  if (chart) {
    chart.innerHTML = data.baggageFlights.map(row => `<div class="bar" style="height:${Math.max(18, row.screened / 6)}px"><strong>${row.screened}</strong><span>${row.flight}</span></div>`).join('');
  }
}

function renderCargo(data) {
  const table = document.getElementById('cargo-table');
  if (!table) return;
  table.innerHTML = data.cargoLoads.map(row => `
    <tr>
      <td><strong>${row.awb}</strong></td>
      <td>${row.commodity}</td>
      <td>${row.flight}</td>
      <td>${statusBadge(row.priority)}</td>
      <td>${statusBadge(row.stage)}</td>
      <td>${row.weightKg.toLocaleString()}</td>
    </tr>`).join('');
}

function renderGovernance(data) {
  const table = document.getElementById('governance-table');
  if (!table) return;
  table.innerHTML = data.governance.map(row => `
    <tr>
      <td><strong>${row.domain}</strong></td>
      <td>${row.owner}</td>
      <td>${row.classification}</td>
      <td>${row.coverage}%</td>
      <td>${row.issues}</td>
    </tr>`).join('');

  const lineage = document.getElementById('lineage-flow');
  if (lineage) {
    lineage.innerHTML = data.lineage.map(step => `<div class="flow-step"><strong>${step}</strong><span class="footer-note">Tracked, governed, and replayable</span></div>`).join('');
  }
}

function renderBuilder(data) {
  const promptBox = document.getElementById('generated-output');
  const button = document.getElementById('generate-app');
  if (!promptBox || !button) return;
  const form = document.getElementById('builder-form');
  const templates = new Map(data.builderTemplates.map(x => [x.name, x]));
  const generate = () => {
    const fd = new FormData(form);
    const template = templates.get(fd.get('template')) || data.builderTemplates[0];
    const output = {
      appName: fd.get('appName'),
      template: template.name,
      targetDomain: fd.get('domain'),
      connectedSystems: fd.get('systems').split(',').map(x => x.trim()).filter(Boolean),
      policies: fd.get('policies').split(',').map(x => x.trim()).filter(Boolean),
      generatedModules: [
        'workflow-orchestrator',
        'role-based workspace',
        'event ledger',
        'analytics cockpit',
        'policy enforcement layer'
      ],
      launchTimeEstimate: template.time,
      generatedFrom: 'UniStack meta-platform'
    };
    promptBox.textContent = JSON.stringify(output, null, 2);
  };
  button.addEventListener('click', generate);
  generate();
}

window.addEventListener('DOMContentLoaded', async () => {
  setActiveNav();
  const data = await loadData();
  renderOverview(data);
  renderBaggage(data);
  renderCargo(data);
  renderGovernance(data);
  renderBuilder(data);
});
