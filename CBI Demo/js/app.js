// ===== App Initialization & Event Wiring =====

// ===== Conversation History =====
let conversationHistory = [];

function addToHistory(scenario) {
  // Avoid duplicates at the top
  if (conversationHistory.length > 0 && conversationHistory[0].id === scenario.id) return;
  // Remove if it already exists
  conversationHistory = conversationHistory.filter(s => s.id !== scenario.id);
  // Add to front
  conversationHistory.unshift({ id: scenario.id, title: scenario.title, time: new Date() });
  renderHistoryList();
}

function renderHistoryList() {
  const list = document.getElementById('history-list');
  if (conversationHistory.length === 0) {
    list.innerHTML = `
      <div class="text-center py-8 text-sm text-slate-400">
        <span class="material-icons text-3xl mb-2 block">history</span>
        No conversations yet
      </div>
    `;
    return;
  }

  list.innerHTML = conversationHistory.map(item => {
    const timeStr = item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <button onclick="loadFromHistory('${item.id}')" class="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
        <div class="flex items-center gap-3">
          <span class="material-icons text-primary text-sm">chat_bubble_outline</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">${item.title}</p>
            <p class="text-[10px] text-slate-400">${timeStr}</p>
          </div>
        </div>
      </button>
    `;
  }).join('');
}

function loadFromHistory(scenarioId) {
  toggleHistory();
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return;

  // Reset chat
  chatContainer.innerHTML = '';
  document.getElementById('analytics-welcome').classList.add('hidden');
  document.getElementById('analytics-content').classList.add('hidden');

  // Simulate the conversation
  renderAIMessage(scenario.greeting, false);

  setTimeout(() => {
    renderUserMessage(scenario.userQuestion || scenario.suggestions[0]?.label || 'Show analysis');
    showTypingIndicator();

    setTimeout(() => {
      hideTypingIndicator();
      renderAIMessage(scenario.aiResponse);
      updateAnalyticsPanel(scenario);
      renderSuggestionChips(scenario.suggestions);
      document.getElementById('header-title').textContent = scenario.title;
      isProcessing = false;
    }, 800);
  }, 300);
}

// ===== History Panel Toggle =====
function toggleHistory() {
  const overlay = document.getElementById('history-overlay');
  overlay.classList.toggle('hidden');
}

// ===== Dark Mode =====
function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('exl-theme', isDark ? 'dark' : 'light');

  // Update icon
  const icon = document.querySelector('.dark-mode-icon');
  icon.textContent = isDark ? 'light_mode' : 'dark_mode';

  // Re-render chart if one exists (for grid color update)
  if (currentChart && currentScenarioData) {
    renderChart(currentScenarioData.chart);
  }
}

// ===== New Chat =====
function resetChat() {
  isProcessing = false;
  document.getElementById('header-title').textContent = 'Conversational BI';

  // Reset analytics
  document.getElementById('analytics-welcome').classList.remove('hidden');
  document.getElementById('analytics-content').classList.add('hidden');

  // Destroy chart
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }
  currentScenarioData = null;

  // Reset chat
  renderWelcomeChat();

  // Clear input
  const input = document.getElementById('chat-input');
  input.value = '';
  input.style.height = 'auto';
}

// ===== Input Handling =====
function setupInputHandlers() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('btn-send');

  // Send on Enter (without Shift)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserInput(input.value);
      input.value = '';
      input.style.height = 'auto';
    }
  });

  // Send button click
  sendBtn.addEventListener('click', () => {
    handleUserInput(input.value);
    input.value = '';
    input.style.height = 'auto';
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 128) + 'px';
  });
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
  // Set dark mode icon based on current state
  const isDark = document.documentElement.classList.contains('dark');
  const icon = document.querySelector('.dark-mode-icon');
  if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';

  // Wire up buttons
  document.getElementById('btn-dark-mode').addEventListener('click', toggleDarkMode);
  document.getElementById('btn-history').addEventListener('click', toggleHistory);
  document.getElementById('btn-new-chat').addEventListener('click', resetChat);

  // Setup input handlers
  setupInputHandlers();

  // Render welcome state
  renderWelcomeChat();
  renderHistoryList();
});
