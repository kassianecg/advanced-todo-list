// ── Constants & State ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'todo-tasks';
const HISTORY_KEY = 'todo-history';

const STATIC_TASKS = [
  {
    id: 'static-1',
    text: 'Revisar o relatório mensal',
    category: 'work',
    completed: true,
    createdAt: '08:30',
  },
  {
    id: 'static-2',
    text: 'Responder e-mails pendentes',
    category: 'work',
    completed: true,
    createdAt: '09:00',
  },
  {
    id: 'static-3',
    text: 'Fazer compras no mercado',
    category: 'personal',
    completed: false,
    createdAt: '10:15',
  },
  {
    id: 'static-4',
    text: 'Estudar CSS Grid por 1 hora',
    category: 'study',
    completed: false,
    createdAt: '11:00',
  },
  {
    id: 'static-5',
    text: 'Ligar para o médico e agendar consulta',
    category: 'personal',
    completed: false,
    createdAt: '14:30',
  },
];

let tasks = [];
let history = []; // { text, category, completedAt (HH:MM), completedDate (DD/MM/YYYY) }

// ── Category label map ─────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  work: 'Trabalho',
  personal: 'Pessoal',
  study: 'Estudo',
};

// ── Persistence ────────────────────────────────────────────────────────────────

/**
 * Validates that a value is a proper array of TaskObjects.
 * @param {*} data
 * @returns {boolean}
 */
function isValidTaskArray(data) {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.text === 'string' &&
      typeof item.category === 'string' &&
      typeof item.completed === 'boolean'
  );
}

/**
 * Loads task state from sessionStorage.
 * Falls back to STATIC_TASKS if storage is unavailable, empty, or invalid.
 * @returns {TaskObject[]}
 */
function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) return STATIC_TASKS;
    const parsed = JSON.parse(raw);
    if (!isValidTaskArray(parsed)) return STATIC_TASKS;
    return parsed;
  } catch (_) {
    return STATIC_TASKS;
  }
}

/**
 * Persists the current tasks array to sessionStorage.
 * Silently ignores errors (e.g. private browsing restrictions).
 */
function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (_) {
    // sessionStorage unavailable — continue without persistence
  }
}

/**
 * Loads history from localStorage (persists across sessions within the day).
 * @returns {HistoryEntry[]}
 */
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

/**
 * Persists the history array to localStorage.
 */
function persistHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (_) {
    // localStorage unavailable
  }
}

// ── Task mutations ─────────────────────────────────────────────────────────────

/**
 * Generates a unique id using crypto.randomUUID when available,
 * falling back to Date.now + Math.random.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString() + Math.random().toString().slice(2);
}

/**
 * Returns true if the text contains only letters (including accented),
 * spaces, and basic punctuation (.,!?-').
 * Rejects digits and special characters like @#$%&*+= etc.
 * @param {string} text
 * @returns {boolean}
 */
function isValidTaskText(text) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ\s.,!?'\-]+$/.test(text.trim());
}

/**
 * Shows an inline error message below the input.
 * @param {string} message
 */
function showInputError(message) {
  const input = document.getElementById('task-input');
  if (!input) return;

  input.classList.add('input-error');

  let errorEl = document.getElementById('input-error-msg');
  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.id = 'input-error-msg';
    errorEl.className = 'input-error-msg';
    input.parentElement.insertAdjacentElement('afterend', errorEl);
  }
  errorEl.textContent = message;
}

/**
 * Clears the inline error message and resets input error state.
 */
function clearInputError() {
  const input = document.getElementById('task-input');
  if (input) input.classList.remove('input-error');

  const errorEl = document.getElementById('input-error-msg');
  if (errorEl) errorEl.textContent = '';
}

/**
 * Adds a new task to the list.
 * Rejects empty/whitespace-only text and text with digits or special characters.
 * @param {string} text
 * @param {string} category
 */
function addTask(text, category) {
  if (!text || text.trim() === '') return;

  if (!isValidTaskText(text)) {
    showInputError('Use apenas letras e espaços. Números e caracteres especiais não são permitidos.');
    return;
  }

  clearInputError();

  const now = new Date();
  const createdAt = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const task = {
    id: generateId(),
    text: text.trim(),
    category: category,
    completed: false,
    createdAt,
  };
  tasks.push(task);
  persist();
  render();
}

/**
 * Removes the task with the given id from the list.
 * @param {string} id
 */
function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  persist();
  render();
}

/**
 * Toggles the completed state of the task with the given id.
 * When marked complete, adds an entry to the history.
 * @param {string} id
 */
function toggleTask(id) {
  tasks = tasks.map((task) => {
    if (task.id !== id) return task;
    const nowCompleted = !task.completed;

    // Add to history when marking as done
    if (nowCompleted) {
      const now = new Date();
      history.push({
        text: task.text,
        category: task.category,
        completedAt: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        completedDate: now.toLocaleDateString('pt-BR'),
      });
      persistHistory();
    }

    return { ...task, completed: nowCompleted };
  });
  persist();
  render();
}

// ── Progress bar ───────────────────────────────────────────────────────────────

/**
 * Recalculates and updates the progress bar, label, and reset button visibility.
 */
function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter((task) => task.completed === true).length;
  const pct = total === 0 ? 0 : (done / total) * 100;

  const fill = document.querySelector('.progress-fill');
  const label = document.querySelector('.progress-label');
  const resetBtn = document.getElementById('reset-btn');

  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = `${done} de ${total} concluídas`;

  // Show reset button only when all tasks are done (and there are tasks)
  if (resetBtn) {
    resetBtn.hidden = !(total > 0 && done === total);
  }
}

// ── Reset & History ────────────────────────────────────────────────────────────

/**
 * Clears all tasks and resets the progress bar.
 * History is preserved.
 */
function resetTasks() {
  tasks = [];
  persist();
  render();
}

/**
 * Renders the history section with today's completed tasks.
 */
function renderHistory() {
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  if (!list || !empty) return;

  const today = new Date().toLocaleDateString('pt-BR');
  const todayEntries = history.filter((e) => e.completedDate === today);

  list.innerHTML = '';

  if (todayEntries.length === 0) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  // Show newest first
  [...todayEntries].reverse().forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'history-item';

    const info = document.createElement('div');
    info.className = 'history-info';

    const text = document.createElement('span');
    text.className = 'history-text';
    text.textContent = entry.text;

    const meta = document.createElement('span');
    meta.className = 'history-meta';
    meta.textContent = `${CATEGORY_LABELS[entry.category] || entry.category} · ${entry.completedDate}`;

    info.appendChild(text);
    info.appendChild(meta);

    const time = document.createElement('span');
    time.className = 'history-time';
    time.textContent = entry.completedAt;

    li.appendChild(info);
    li.appendChild(time);
    list.appendChild(li);
  });
}

/**
 * Opens the history section inside the card.
 */
function openHistory() {
  renderHistory();
  const section = document.getElementById('history-section');
  if (section) section.hidden = false;
}

/**
 * Closes the history section.
 */
function closeHistory() {
  const section = document.getElementById('history-section');
  if (section) section.hidden = true;
}

// ── Rendering ──────────────────────────────────────────────────────────────────

/**
 * Rebuilds the task list in the DOM from the current tasks array.
 */
function render() {
  const ul = document.querySelector('ul.task-list');
  if (!ul) return;

  ul.innerHTML = '';

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    // Label with checkbox, checkmark and task text
    const label = document.createElement('label');
    label.className = 'task-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;

    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';

    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;

    label.appendChild(checkbox);
    label.appendChild(checkmark);
    label.appendChild(taskText);

    // Category tag + time wrapper
    const tagWrapper = document.createElement('div');
    tagWrapper.className = 'tag-wrapper';

    const tag = document.createElement('span');
    tag.className = `tag tag-${task.category}`;
    tag.textContent = CATEGORY_LABELS[task.category] || task.category;

    tagWrapper.appendChild(tag);

    if (task.createdAt) {
      const timeEl = document.createElement('span');
      timeEl.className = 'task-time';
      timeEl.textContent = task.createdAt;
      tagWrapper.appendChild(timeEl);
    }

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.id = task.id;
    deleteBtn.setAttribute('aria-label', 'Deletar tarefa');
    deleteBtn.innerHTML = '&times;';

    li.appendChild(label);
    li.appendChild(tagWrapper);
    li.appendChild(deleteBtn);

    ul.appendChild(li);
  });

  updateProgress();
}

// ── Initialisation ─────────────────────────────────────────────────────────────

/**
 * Bootstraps the application: loads state, renders, and wires up event listeners.
 */
function init() {
  tasks = loadState();
  history = loadHistory();
  render();

  // Add-form submit handler
  const form = document.getElementById('add-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = document.getElementById('task-input');
      const select = document.getElementById('category-select');
      if (!input || !select) return;

      const text = input.value;
      const category = select.value;

      addTask(text, category);

      // Only clear the field if the task was actually added (no error shown)
      if (!input.classList.contains('input-error')) {
        input.value = '';

        // Reset char counter back to 0
        const counter = document.querySelector('.char-counter');
        if (counter) {
          const MAX = parseInt(input.getAttribute('maxlength'), 10) || 60;
          counter.textContent = `0 / ${MAX}`;
          counter.classList.remove('near-limit', 'at-limit');
        }
      }
      input.focus();
    });
  }

  // Real-time validation feedback: clear error as soon as input becomes valid
  const taskInput = document.getElementById('task-input');
  if (taskInput) {
    const MAX = parseInt(taskInput.getAttribute('maxlength'), 10) || 60;

    // Create char counter element
    const counter = document.createElement('p');
    counter.className = 'char-counter';
    counter.textContent = `0 / ${MAX}`;
    taskInput.parentElement.insertAdjacentElement('afterend', counter);

    taskInput.addEventListener('input', function () {
      // Auto-capitalize first letter
      if (this.value.length === 1) {
        this.value = this.value.toUpperCase();
      }

      // Update char counter
      const len = this.value.length;
      counter.textContent = `${len} / ${MAX}`;
      counter.classList.remove('near-limit', 'at-limit');
      if (len >= MAX) {
        counter.classList.add('at-limit');
      } else if (len >= MAX * 0.8) {
        counter.classList.add('near-limit');
      }

      if (isValidTaskText(this.value) || this.value.trim() === '') {
        clearInputError();
      }
    });
  }

  // ── Custom Select ──────────────────────────────────────────────────────────
  const selectBtn   = document.getElementById('custom-select-btn');
  const selectList  = document.getElementById('custom-select-list');
  const selectLabel = document.getElementById('custom-select-label');
  const selectInput = document.getElementById('category-select');

  function openDropdown() {
    selectList.hidden = false;
    selectBtn.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    selectList.hidden = true;
    selectBtn.setAttribute('aria-expanded', 'false');
  }

  if (selectBtn && selectList) {
    // Toggle on button click
    selectBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      selectList.hidden ? openDropdown() : closeDropdown();
    });

    // Select option
    selectList.addEventListener('click', function (e) {
      const option = e.target.closest('.custom-select-option');
      if (!option) return;

      // Update hidden input value
      selectInput.value = option.dataset.value;

      // Update label
      selectLabel.textContent = option.textContent;

      // Mark selected
      selectList.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');

      closeDropdown();
      selectBtn.focus();
    });

    // Close on outside click
    document.addEventListener('click', function () {
      closeDropdown();
    });

    // Close on Escape
    selectBtn.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDropdown();
    });

    // Mark first option as selected by default
    const firstOption = selectList.querySelector('.custom-select-option');
    if (firstOption) firstOption.classList.add('selected');
  }

  // Task list event delegation (delete + toggle)
  const ul = document.querySelector('ul.task-list');
  if (ul) {
    ul.addEventListener('click', function (e) {
      // Delete button
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        deleteTask(deleteBtn.dataset.id);
        return;
      }

      // Checkbox toggle — id lives on the parent <li>
      if (e.target.matches('input[type="checkbox"]')) {
        const li = e.target.closest('li[data-id]');
        if (li) {
          toggleTask(li.dataset.id);
        }
      }
    });
  }

  // Reset button
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetTasks);
  }

  // History button — toggle section
  const historyBtn = document.getElementById('history-btn');
  if (historyBtn) {
    historyBtn.addEventListener('click', openHistory);
  }

  // History close button (inside the section)
  const historyCloseBtn = document.getElementById('history-close-btn');
  if (historyCloseBtn) {
    historyCloseBtn.addEventListener('click', closeHistory);
  }

  // Close modal on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeHistory();
  });
}

document.addEventListener('DOMContentLoaded', init);
