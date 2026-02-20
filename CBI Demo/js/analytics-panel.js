// ===== Analytics Panel - Charts, Insights, Tables, SQL =====

let currentChart = null;
let currentScenarioData = null;

// ===== Color Maps =====
const insightColors = {
  blue: {
    bg: "bg-blue-50/50 dark:bg-blue-900/10",
    border: "border-blue-100 dark:border-blue-900/30",
    label: "text-blue-600 dark:text-blue-400"
  },
  emerald: {
    bg: "bg-emerald-50/50 dark:bg-emerald-900/10",
    border: "border-emerald-100 dark:border-emerald-900/30",
    label: "text-emerald-600 dark:text-emerald-400"
  },
  rose: {
    bg: "bg-rose-50/50 dark:bg-rose-900/10",
    border: "border-rose-100 dark:border-rose-900/30",
    label: "text-rose-600 dark:text-rose-400"
  },
  amber: {
    bg: "bg-amber-50/50 dark:bg-amber-900/10",
    border: "border-amber-100 dark:border-amber-900/30",
    label: "text-amber-600 dark:text-amber-400"
  }
};

// ===== Master Update =====
function updateAnalyticsPanel(scenario) {
  currentScenarioData = scenario;

  // Hide welcome, show content
  document.getElementById('analytics-welcome').classList.add('hidden');
  const content = document.getElementById('analytics-content');
  content.classList.remove('hidden');
  content.classList.add('panel-animate');

  // Remove animation class after it plays
  setTimeout(() => content.classList.remove('panel-animate'), 500);

  // Render each section
  renderInsightsCard(scenario.insights);
  renderChart(scenario.chart);
  renderDataTable(scenario.table);
  renderSqlBlock(scenario.sql, scenario.dataSource);
  renderGenerationFooter(scenario.generationTime);

  // Reset collapsible states: insights + chart open, table + sql closed
  expandSection('insights');
  expandSection('chart');
  collapseSection('table');
  collapseSection('sql');

  // Scroll analytics to top
  document.getElementById('analytics-panel').scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Insights Card =====
function renderInsightsCard(insights) {
  const cardsContainer = document.getElementById('insights-cards');
  const bulletsContainer = document.getElementById('insights-bullets');
  const confidenceContainer = document.getElementById('insights-confidence');

  // Cards
  cardsContainer.innerHTML = insights.cards.map(card => {
    const colors = insightColors[card.color] || insightColors.blue;
    return `
      <div class="p-4 rounded-lg ${colors.bg} border ${colors.border}">
        <p class="text-xs ${colors.label} font-medium mb-1">${card.label}</p>
        <p class="text-sm font-semibold">${card.value}</p>
        <p class="text-xs text-slate-500 mt-1">${card.detail}</p>
      </div>
    `;
  }).join('');

  // Bullets
  bulletsContainer.innerHTML = insights.bullets.map(bullet => `
    <li class="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
      <span class="text-primary">•</span>
      ${bullet}
    </li>
  `).join('');

  // Confidence
  const confidence = insights.confidence;
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (confidence / 100) * circumference;
  const color = confidence >= 90 ? '#10b981' : confidence >= 80 ? '#f59e0b' : '#ef4444';

  confidenceContainer.innerHTML = `
    <svg class="confidence-ring" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="16" stroke="#e2e8f0" stroke-width="3" fill="none"/>
      <circle cx="20" cy="20" r="16" stroke="${color}" stroke-width="3" fill="none"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        stroke-linecap="round" style="transition: stroke-dashoffset 0.8s ease;"/>
    </svg>
    <span class="text-xs font-semibold" style="color: ${color}">${confidence}% confidence</span>
  `;
}

// ===== Chart =====
function renderChart(chartConfig) {
  const ctx = document.getElementById('analytics-chart').getContext('2d');

  // Destroy previous chart
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }

  // Title and subtitle
  document.getElementById('chart-title').textContent = chartConfig.title;
  document.getElementById('chart-subtitle').textContent = chartConfig.subtitle;

  // Legend
  const legendContainer = document.getElementById('chart-legend');
  legendContainer.innerHTML = chartConfig.datasets
    .filter(ds => ds.label && !ds.label.includes('Expected') && !ds.label.includes('Target (100%)'))
    .map(ds => `
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-1 rounded-full" style="background: ${ds.borderColor || ds.backgroundColor}"></span>
        <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">${ds.label}</span>
      </div>
    `).join('');

  // Chart options
  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#0f172a',
        titleFont: { family: 'Inter', size: 12, weight: '600' },
        bodyFont: { family: 'Inter', size: 11 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4
      }
    },
    scales: {}
  };

  // Configure scales based on chart type
  if (chartConfig.type === 'doughnut') {
    delete options.scales;
    options.cutout = '65%';
    options.plugins.tooltip.callbacks = {
      label: function(context) {
        return `${context.label}: ${context.parsed}%`;
      }
    };
  } else if (chartConfig.indexAxis === 'y') {
    options.indexAxis = 'y';
    options.scales = {
      x: {
        grid: { color: gridColor, drawBorder: false },
        ticks: {
          color: textColor,
          font: { family: 'Inter', size: 10 },
          callback: function(value) {
            if (chartConfig.xAxisFormat === 'percent') return value + '%';
            if (value >= 1000000000) return '$' + (value / 1000000000).toFixed(1) + 'B';
            if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return '$' + (value / 1000) + 'K';
            return '$' + value;
          }
        }
      },
      y: {
        grid: { display: false },
        ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
      }
    };
  } else {
    // Check for dual axis
    const hasY1 = chartConfig.datasets.some(ds => ds.yAxisID === 'y1');

    options.scales.x = {
      grid: { color: gridColor, drawBorder: false },
      ticks: { color: textColor, font: { family: 'Inter', size: 10, weight: '500' } }
    };
    options.scales.y = {
      grid: { color: gridColor, drawBorder: false },
      ticks: {
        color: textColor,
        font: { family: 'Inter', size: 10 },
        callback: function(value) {
          if (chartConfig.yAxisFormat === 'percent') return value + '%';
          if (chartConfig.yAxisFormat === 'ratio') return value.toFixed(1) + 'x';
          const maxVal = Math.max(...(chartConfig.datasets[0]?.data?.filter(v => v != null) || [0]));
          if (maxVal >= 1000000000) {
            if (value >= 1000000000) return '$' + (value / 1000000000).toFixed(1) + 'B';
            if (value >= 1000000) return '$' + (value / 1000000).toFixed(0) + 'M';
            return '$' + value;
          }
          if (maxVal > 10000) {
            if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return '$' + (value / 1000) + 'K';
            return '$' + value;
          }
          if (typeof value === 'number' && maxVal > 500) return '$' + value + 'K';
          return value;
        }
      }
    };

    if (hasY1) {
      options.scales.y1 = {
        position: 'right',
        grid: { display: false },
        ticks: {
          color: '#10b981',
          font: { family: 'Inter', size: 10 },
          callback: function(value) { return value + '%'; }
        }
      };
    }

    // Check for stacked bar charts
    const hasStack = chartConfig.datasets.some(ds => ds.stack);
    if (hasStack) {
      options.scales.x.stacked = true;
      options.scales.y.stacked = true;
    }
  }

  // Create chart
  currentChart = new Chart(ctx, {
    type: chartConfig.type,
    data: {
      labels: chartConfig.labels,
      datasets: chartConfig.datasets.map(ds => ({
        ...ds,
        pointRadius: ds.pointRadius || (chartConfig.type === 'line' ? 4 : undefined),
        pointHoverRadius: chartConfig.type === 'line' ? 6 : undefined,
        pointBackgroundColor: ds.pointBackgroundColor || ds.borderColor || '#fff',
        pointBorderColor: ds.pointBorderColor || ds.borderColor,
        pointBorderWidth: ds.pointBorderWidth || 2,
        borderWidth: ds.borderWidth !== undefined ? ds.borderWidth : (chartConfig.type === 'line' ? 2.5 : undefined)
      }))
    },
    options: options
  });

  // Summary stats
  const summaryContainer = document.getElementById('chart-summary');
  summaryContainer.innerHTML = `
    <div class="flex items-center gap-6">
      ${chartConfig.summaryStats.map(stat => `
        <div class="flex flex-col">
          <span class="text-[10px] text-slate-400 font-semibold uppercase">${stat.label}</span>
          <span class="text-sm font-bold ${stat.color === 'emerald' ? 'text-emerald-500' : stat.color === 'rose' ? 'text-rose-500' : 'text-slate-800 dark:text-white'}">${stat.value}</span>
        </div>
        <div class="h-8 w-px bg-slate-200 dark:bg-slate-700 last:hidden"></div>
      `).join('')}
    </div>
    <button class="text-xs font-semibold text-primary hover:underline">View Full Dataset</button>
  `;
}

// ===== Data Table =====
function renderDataTable(tableData) {
  const container = document.getElementById('data-table-container');

  let html = `<table class="data-table w-full text-sm">
    <thead>
      <tr class="border-b border-slate-200 dark:border-slate-700">
        ${tableData.headers.map(h => `
          <th class="text-left py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">${h}</th>
        `).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableData.rows.map(row => `
        <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          ${row.map((cell, i) => `
            <td class="py-2.5 px-3 whitespace-nowrap ${i === 0 ? 'font-medium text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}">
              ${formatTableCell(cell)}
            </td>
          `).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>`;

  container.innerHTML = html;
}

function formatTableCell(value) {
  // Color-code positive/negative values
  if (typeof value === 'string') {
    if (value.startsWith('+') && value.includes('%')) {
      return `<span class="text-emerald-600 dark:text-emerald-400 font-medium">${value}</span>`;
    }
    if (value.startsWith('-') && (value.includes('%') || value.includes('$'))) {
      return `<span class="text-rose-600 dark:text-rose-400 font-medium">${value}</span>`;
    }
    if (value === 'Exceeding' || value === 'Increasing') {
      return `<span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><span class="material-icons text-xs">trending_up</span>${value}</span>`;
    }
    if (value === 'Declining' || value === 'At Risk') {
      return `<span class="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400"><span class="material-icons text-xs">trending_down</span>${value}</span>`;
    }
    if (value === 'Stable' || value === 'On Track') {
      return `<span class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400"><span class="material-icons text-xs">trending_flat</span>${value}</span>`;
    }
    if (value === 'High') {
      return `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">${value}</span>`;
    }
    if (value === 'Medium') {
      return `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">${value}</span>`;
    }
    if (value === 'Low') {
      return `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">${value}</span>`;
    }
    if (value === 'Investigating') {
      return `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">${value}</span>`;
    }
    if (value === 'Monitoring') {
      return `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">${value}</span>`;
    }
    if (value === 'Confirmed' || value === 'Noted') {
      return `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">${value}</span>`;
    }
  }
  return value;
}

// ===== SQL Block =====
function renderSqlBlock(sql, dataSource) {
  const sqlContent = document.getElementById('sql-content');
  sqlContent.innerHTML = highlightSQL(sql);

  const sourceEl = document.querySelector('#sql-source span:last-child');
  sourceEl.textContent = `Source: ${dataSource}`;
}

function highlightSQL(sql) {
  // Escape HTML first
  let escaped = sql.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Comments
  escaped = escaped.replace(/(--[^\n]*)/g, '<span class="sql-comment">$1</span>');

  // Strings
  escaped = escaped.replace(/('[^']*')/g, '<span class="sql-string">$1</span>');

  // Keywords
  const keywords = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|AS|AND|OR|NOT|IN|BETWEEN|LIKE|CASE|WHEN|THEN|ELSE|END|WITH|OVER|PARTITION\s+BY|SUM|AVG|COUNT|MAX|MIN|ROUND|LAG|LEAD|DATE_TRUNC|COALESCE|DISTINCT|UNION|ALL|NULL|IS|DESC|ASC|NULLIF|CURRENT_DATE|INTERVAL|STDDEV|ABS)\b/gi;
  escaped = escaped.replace(keywords, '<span class="sql-keyword">$1</span>');

  // Numbers (but not inside already-highlighted spans)
  escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="sql-number">$1</span>');

  return escaped;
}

function copySQL() {
  if (!currentScenarioData) return;
  navigator.clipboard.writeText(currentScenarioData.sql).then(() => {
    const btn = document.getElementById('btn-copy-sql');
    btn.innerHTML = '<span class="material-icons text-xs">check</span> Copied!';
    btn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
    btn.classList.remove('bg-slate-700', 'hover:bg-slate-600');
    setTimeout(() => {
      btn.innerHTML = '<span class="material-icons text-xs">content_copy</span> Copy';
      btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
      btn.classList.add('bg-slate-700', 'hover:bg-slate-600');
    }, 2000);
  });
}

// ===== CSV Export =====
function exportCSV() {
  if (!currentScenarioData) return;
  const table = currentScenarioData.table;
  const csv = [
    table.headers.join(','),
    ...table.rows.map(r => r.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentScenarioData.id}-data-export.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== Generation Footer =====
function renderGenerationFooter(time) {
  document.getElementById('generation-footer').textContent =
    `Analysis generated in ${time}s  •  Model: EXL Insights Engine v2`;
}

// ===== Collapsible Sections =====
function toggleCollapsible(sectionId) {
  const body = document.getElementById(`${sectionId}-body`);
  const chevron = document.querySelector(`.collapsible-chevron[data-target="${sectionId}"]`);

  if (body.classList.contains('collapsed')) {
    expandSection(sectionId);
  } else {
    collapseSection(sectionId);
  }
}

function expandSection(sectionId) {
  const body = document.getElementById(`${sectionId}-body`);
  const chevron = document.querySelector(`.collapsible-chevron[data-target="${sectionId}"]`);

  body.classList.remove('collapsed');
  body.style.maxHeight = body.scrollHeight + 'px';
  if (chevron) chevron.textContent = 'expand_less';
}

function collapseSection(sectionId) {
  const body = document.getElementById(`${sectionId}-body`);
  const chevron = document.querySelector(`.collapsible-chevron[data-target="${sectionId}"]`);

  body.classList.add('collapsed');
  body.style.maxHeight = '0';
  if (chevron) chevron.textContent = 'expand_more';
}
