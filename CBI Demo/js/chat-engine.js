// ===== Chat Engine - Message rendering, typing indicator, suggestions =====

const chatContainer = document.getElementById('chat-messages');
let isProcessing = false;

// ===== Timestamp Helper =====
function getTimestamp() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// ===== Render AI Message =====
function renderAIMessage(text, animate = true) {
  const wrapper = document.createElement('div');
  wrapper.className = `flex gap-4 ${animate ? 'chat-message' : ''}`;
  wrapper.innerHTML = `
    <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
      <span class="material-symbols-outlined text-sm">auto_awesome</span>
    </div>
    <div class="space-y-2 max-w-[85%]">
      <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        ${text}
      </div>
      <span class="text-[10px] text-slate-400 px-1">${getTimestamp()}</span>
    </div>
  `;
  chatContainer.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

// ===== Render User Message =====
function renderUserMessage(text) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex gap-4 flex-row-reverse chat-message';
  wrapper.innerHTML = `
    <div class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
      <span class="material-icons text-sm">person</span>
    </div>
    <div class="space-y-2 max-w-[85%]">
      <div class="bg-primary text-white p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed">
        ${escapeHtml(text)}
      </div>
      <span class="text-[10px] text-slate-400 px-1 text-right block">${getTimestamp()}</span>
    </div>
  `;
  chatContainer.appendChild(wrapper);
  scrollToBottom();
}

// ===== Typing Indicator =====
function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.className = 'flex gap-4 chat-message';
  indicator.innerHTML = `
    <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
      <span class="material-symbols-outlined text-sm">auto_awesome</span>
    </div>
    <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  chatContainer.appendChild(indicator);
  scrollToBottom();
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

// ===== Suggestion Chips =====
function renderSuggestionChips(suggestions) {
  removeSuggestionChips();
  const container = document.createElement('div');
  container.id = 'suggestion-chips';
  container.className = 'flex flex-wrap gap-2 pl-12 chat-message';

  suggestions.forEach((s, i) => {
    const chip = document.createElement('button');
    chip.className = 'suggestion-chip border border-primary text-primary rounded-full px-4 py-2 text-xs font-medium hover:bg-primary hover:text-white transition-all cursor-pointer';
    chip.style.animationDelay = `${i * 0.1}s`;
    chip.textContent = s.label;
    chip.onclick = () => handleSuggestionClick(s);
    container.appendChild(chip);
  });

  chatContainer.appendChild(container);
  scrollToBottom();
}

function removeSuggestionChips() {
  const existing = document.getElementById('suggestion-chips');
  if (existing) existing.remove();
}

// ===== Welcome State =====
function renderWelcomeChat() {
  chatContainer.innerHTML = '';

  // Welcome message
  renderAIMessage(
    `Welcome! I'm your <strong>Conversational BI Assistant</strong>. I can analyze your banking data using natural language — deposits, loans, risk metrics, branch performance, and more. Try asking me a question, or pick one of the topics below to get started.`,
    false
  );

  // Starter chips
  const starterChips = [
    { label: "Deposit portfolio overview", targetScenarioId: "deposit_overview" },
    { label: "Loan portfolio composition", targetScenarioId: "loan_portfolio" },
    { label: "NPA & asset quality", targetScenarioId: "npa_analysis" },
    { label: "Branch performance ranking", targetScenarioId: "branch_performance" },
    { label: "Executive KPI scorecard", targetScenarioId: "kpi_scorecard" }
  ];

  const container = document.createElement('div');
  container.id = 'suggestion-chips';
  container.className = 'flex flex-wrap gap-2 pl-12 mt-2';

  starterChips.forEach((s, i) => {
    const chip = document.createElement('button');
    chip.className = 'suggestion-chip border border-primary text-primary rounded-full px-4 py-2 text-xs font-medium hover:bg-primary hover:text-white transition-all cursor-pointer';
    chip.style.animationDelay = `${i * 0.1}s`;
    chip.textContent = s.label;
    chip.onclick = () => handleSuggestionClick(s);
    container.appendChild(chip);
  });

  chatContainer.appendChild(container);
}

// ===== Handle User Input =====
function handleUserInput(text) {
  if (isProcessing || !text.trim()) return;

  isProcessing = true;
  removeSuggestionChips();

  // Render user message
  renderUserMessage(text.trim());

  // Find matching scenario
  const scenario = getScenarioByKeywords(text);

  if (scenario) {
    processScenario(scenario);
  } else {
    // No match — show fallback
    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      renderAIMessage(
        `I'm not sure I can analyze that specific query. Here are some topics I can help with — try clicking one of the suggestions below!`
      );
      renderSuggestionChips([
        { label: "Deposit portfolio", targetScenarioId: "deposit_overview" },
        { label: "Loan portfolio", targetScenarioId: "loan_portfolio" },
        { label: "Executive KPI scorecard", targetScenarioId: "kpi_scorecard" }
      ]);
      isProcessing = false;
    }, 1200);
  }
}

// ===== Handle Suggestion Click =====
function handleSuggestionClick(suggestion) {
  if (isProcessing) return;

  isProcessing = true;
  removeSuggestionChips();

  const scenario = getScenarioById(suggestion.targetScenarioId);
  if (!scenario) return;

  // Render user message with the chip label
  renderUserMessage(suggestion.label);
  processScenario(scenario);
}

// ===== Process a Scenario =====
function processScenario(scenario) {
  // Update header title
  document.getElementById('header-title').textContent = scenario.title;

  // Show typing indicator
  showTypingIndicator();

  // Simulate thinking delay
  const delay = 1500 + Math.random() * 1500;
  setTimeout(() => {
    hideTypingIndicator();

    // Render AI response
    renderAIMessage(scenario.aiResponse);

    // Update analytics panel
    updateAnalyticsPanel(scenario);

    // Show follow-up chips
    setTimeout(() => {
      renderSuggestionChips(scenario.suggestions);
      isProcessing = false;
    }, 400);

    // Track in history
    addToHistory(scenario);
  }, delay);
}

// ===== Scroll =====
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: 'smooth'
    });
  });
}

// ===== Escape HTML =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
