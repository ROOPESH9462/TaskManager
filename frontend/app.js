// API Base URL Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// State Management
let tasksState = [];

// DOM Elements
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelTaskBtn = document.getElementById('cancel-task-btn');
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskDateInput = document.getElementById('task-date');
const taskTimeInput = document.getElementById('task-time');

// Drag and Drop State variables
let draggedCard = null;
let originalColumn = null;
let originalStatus = null;
let originalIndex = -1;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchTasks();
});

// Event Listeners Setup
function setupEventListeners() {
  // Modal toggle listeners
  addTaskBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelTaskBtn.addEventListener('click', closeModal);
  
  // Close modal when clicking on the overlay backdrop
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) {
      closeModal();
    }
  });

  // Task form submission
  taskForm.addEventListener('submit', handleFormSubmit);

  // Drag and drop event listeners on columns
  const lists = document.querySelectorAll('.task-list');
  lists.forEach(list => {
    list.addEventListener('dragover', handleDragOver);
    list.addEventListener('dragenter', handleDragEnter);
    list.addEventListener('dragleave', handleDragLeave);
    list.addEventListener('drop', handleDrop);
  });

  // Clear completed tasks button
  const clearCompletedBtn = document.getElementById('clear-completed-btn');
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', handleClearCompleted);
  }
}

// Fetch tasks from API
async function fetchTasks() {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
    }
    const tasks = await response.json();
    tasksState = tasks;
    renderTasks();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    showToast('Could not load tasks from server.', 'error');
    // Render initial clean empty state for columns
    updateColumnCounts();
  }
}

// Render task cards to respective columns
function renderTasks() {
  const lists = {
    'TO_DO': document.getElementById('list-todo'),
    'IN_PROGRESS': document.getElementById('list-progress'),
    'COMPLETED': document.getElementById('list-completed')
  };

  // Clear existing cards
  Object.values(lists).forEach(list => {
    list.innerHTML = '';
  });

  // Append task cards to correct columns
  tasksState.forEach(task => {
    const list = lists[task.status];
    if (list) {
      const card = createTaskCard(task);
      list.appendChild(card);
    }
  });

  updateColumnCounts();
}

// Create a draggable task card with strict XSS Prevention
function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.draggable = true;
  card.id = `task-card-${task.id}`;
  card.dataset.id = task.id;
  card.dataset.status = task.status;
  card.dataset.dueDate = task.dueDate;

  // Extract time from description if present
  const { timeStr, cleanDesc } = parseTimeFromDescription(task.description);

  // Use textContent for user input to avoid XSS injections
  const title = document.createElement('h3');
  title.className = 'task-card-title';
  title.textContent = task.title;

  const desc = document.createElement('p');
  desc.className = 'task-card-desc';
  desc.textContent = cleanDesc || 'No description provided';
  if (!cleanDesc) {
    desc.style.fontStyle = 'italic';
    desc.style.opacity = '0.5';
  }

  const footer = document.createElement('div');
  footer.className = 'task-card-footer';

  const badge = document.createElement('span');
  badge.className = 'status-badge';
  
  let statusText = 'To Do';
  if (task.status === 'IN_PROGRESS') statusText = 'In Progress';
  if (task.status === 'COMPLETED') statusText = 'Completed';
  badge.textContent = statusText;

  const dateContainer = document.createElement('div');
  dateContainer.className = 'due-date';
  // Static SVG is safe to write, variables are parsed through textContent later
  dateContainer.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  `;
  
  const dateText = document.createElement('span');
  dateText.textContent = formatDate(task.dueDate) + (timeStr ? ` @ ${formatTime(timeStr)}` : '');
  dateContainer.appendChild(dateText);

  // Style overdue tasks (only if they aren't already completed)
  if (task.status !== 'COMPLETED' && isOverdue(task.dueDate)) {
    dateContainer.classList.add('overdue');
  }

  footer.appendChild(badge);
  footer.appendChild(dateContainer);

  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(footer);

  // Inject delete button on all cards
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.setAttribute('aria-label', 'Delete task');
  deleteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleTaskDelete(task.id, card);
  });
  card.appendChild(deleteBtn);

  // Attach card drag event listeners
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);

  return card;
}

// Render empty states for lists that have no tasks
function renderEmptyState(columnId, status) {
  const container = document.getElementById(columnId);
  container.innerHTML = '';

  const emptyState = document.createElement('div');
  emptyState.className = 'column-empty-state';

  let iconSvg = '';
  let msg = '';
  if (status === 'TO_DO') {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <path d="M9 17h6"></path>
        <path d="M9 12h6"></path>
        <path d="M9 7h6"></path>
      </svg>
    `;
    msg = 'No tasks to do. Click "Add Task" to create one.';
  } else if (status === 'IN_PROGRESS') {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
    `;
    msg = 'Drag tasks here to mark them in progress.';
  } else if (status === 'COMPLETED') {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `;
    msg = 'No tasks completed yet. Keep moving forward!';
  }

  emptyState.innerHTML = iconSvg;
  const p = document.createElement('p');
  p.textContent = msg;
  emptyState.appendChild(p);
  
  container.appendChild(emptyState);
}

// Update badges counting items in columns
function updateColumnCounts() {
  const todoCount = document.querySelectorAll('#list-todo .task-card').length;
  const progressCount = document.querySelectorAll('#list-progress .task-card').length;
  const completedCount = document.querySelectorAll('#list-completed .task-card').length;

  document.getElementById('count-todo').textContent = todoCount.toString();
  document.getElementById('count-progress').textContent = progressCount.toString();
  document.getElementById('count-completed').textContent = completedCount.toString();

  // If columns are empty, render their appropriate empty-state templates
  if (todoCount === 0) renderEmptyState('list-todo', 'TO_DO');
  if (progressCount === 0) renderEmptyState('list-progress', 'IN_PROGRESS');
  if (completedCount === 0) renderEmptyState('list-completed', 'COMPLETED');
}

// Drag & Drop event Handlers on Cards
function handleDragStart(e) {
  draggedCard = this;
  originalColumn = this.parentNode;
  originalStatus = this.dataset.status;
  
  // Keep track of index within siblings for rollback positioning
  const siblings = Array.from(originalColumn.querySelectorAll('.task-card'));
  originalIndex = siblings.indexOf(draggedCard);

  // Defer class additions to ensure browser captures correct drag shadow ghost image
  setTimeout(() => {
    this.classList.add('dragging');
    this.classList.add('dragging-active');
  }, 0);
  
  e.dataTransfer.setData('text/plain', this.dataset.id);
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
  if (draggedCard) {
    draggedCard.classList.remove('dragging');
    draggedCard.classList.remove('dragging-active');
  }
  
  document.querySelectorAll('.task-list').forEach(list => {
    list.classList.remove('drag-over');
  });

  draggedCard = null;
  originalColumn = null;
  originalStatus = null;
  originalIndex = -1;
}

// Drag & Drop event Handlers on Columns (Drop Targets)
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  this.classList.add('drag-over');
}

function handleDragLeave() {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');

  if (!draggedCard) return;

  const targetList = this;
  const targetStatus = targetList.dataset.status;
  const taskId = draggedCard.dataset.id;

  // No change in column status
  if (targetStatus === originalStatus) return;

  // Save states in local variables for rollback closure
  const cardRef = draggedCard;
  const colRef = originalColumn;
  const statusRef = originalStatus;
  const indexRef = originalIndex;

  // --- OPTIMISTIC UI UPDATE ---
  // Remove empty states if present on drop target
  const emptyState = targetList.querySelector('.column-empty-state');
  if (emptyState) emptyState.remove();

  // Move the card to new parent in DOM
  targetList.appendChild(cardRef);

  // Update card variables and badges
  cardRef.dataset.status = targetStatus;
  const badge = cardRef.querySelector('.status-badge');
  if (badge) {
    let statusText = 'To Do';
    if (targetStatus === 'IN_PROGRESS') statusText = 'In Progress';
    if (targetStatus === 'COMPLETED') statusText = 'Completed';
    badge.textContent = statusText;
  }

  // Adjust due-date warning class depending on target status
  const dateContainer = cardRef.querySelector('.due-date');
  if (dateContainer) {
    if (targetStatus === 'COMPLETED') {
      dateContainer.classList.remove('overdue');
    } else {
      const dueDate = cardRef.dataset.dueDate;
      if (dueDate && isOverdue(dueDate)) {
        dateContainer.classList.add('overdue');
      }
    }
  }

  updateColumnCounts();

  // Send request to Server
  updateTaskStatusOnServer(taskId, targetStatus, {
    cardRef,
    colRef,
    statusRef,
    indexRef
  });
}

// API: Update Task Status on server with Rollback Support
async function updateTaskStatusOnServer(id, status, rollbackState) {
  const url = `${API_BASE_URL}/tasks/${id}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error(`Failed to update status: ${response.status} ${response.statusText}`);
    }

    // Success toast notification
    showToast('Task updated successfully!', 'success');
  } catch (error) {
    console.error('Error updating task:', error);
    showToast('Failed to update task. Reverting changes...', 'error');

    // --- ROLLBACK UI UPDATE ---
    rollbackCard(
      rollbackState.cardRef,
      rollbackState.colRef,
      rollbackState.statusRef,
      rollbackState.indexRef
    );
  }
}

// Revert card positioning and status details back to original
function rollbackCard(card, originalCol, originalStatus, originalIdx) {
  if (!card || !originalCol) return;

  card.dataset.status = originalStatus;
  
  // Revert badge
  const badge = card.querySelector('.status-badge');
  if (badge) {
    let statusText = 'To Do';
    if (originalStatus === 'IN_PROGRESS') statusText = 'In Progress';
    if (originalStatus === 'COMPLETED') statusText = 'Completed';
    badge.textContent = statusText;
  }

  // Revert overdue formatting
  const dateContainer = card.querySelector('.due-date');
  if (dateContainer) {
    if (originalStatus === 'COMPLETED') {
      dateContainer.classList.remove('overdue');
    } else {
      const dueDate = card.dataset.dueDate;
      if (dueDate && isOverdue(dueDate)) {
        dateContainer.classList.add('overdue');
      }
    }
  }



  // Remove empty state from original column if it exists
  const emptyState = originalCol.querySelector('.column-empty-state');
  if (emptyState) emptyState.remove();

  // Insert back to original index
  const currentSiblings = Array.from(originalCol.querySelectorAll('.task-card'));
  const filteredSiblings = currentSiblings.filter(el => el !== card);

  if (originalIdx >= 0 && originalIdx < filteredSiblings.length) {
    originalCol.insertBefore(card, filteredSiblings[originalIdx]);
  } else {
    originalCol.appendChild(card);
  }

  updateColumnCounts();
}

// Modal handlers
function openModal() {
  taskModal.classList.remove('hidden');
  taskTitleInput.focus();
  
  // Set default due-date value to today's date
  const today = new Date().toISOString().split('T')[0];
  taskDateInput.value = today;
}

function closeModal() {
  taskModal.classList.add('hidden');
  taskForm.reset();
}

// Form Submission & Validation
async function handleFormSubmit(e) {
  e.preventDefault();

  const title = taskTitleInput.value.trim();
  let description = taskDescInput.value.trim();
  const dueDate = taskDateInput.value;
  const dueTime = taskTimeInput ? taskTimeInput.value : '';

  // Validation checks
  if (!title) {
    showToast('Task title is required.', 'warning');
    return;
  }
  if (!dueDate) {
    showToast('Due date is required.', 'warning');
    return;
  }

  // If a time is specified, append it to description string
  if (dueTime) {
    description = description ? `${description}\n\n[Time: ${dueTime}]` : `[Time: ${dueTime}]`;
  }

  const payload = {
    title,
    description,
    dueDate
  };

  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.status} ${response.statusText}`);
    }

    showToast('Task created successfully!', 'success');
    closeModal();

    // If the backend returns the JSON object of the created task, render it directly.
    // Otherwise, perform a full reload of the tasks.
    let createdTask = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      createdTask = await response.json();
    }

    if (createdTask && createdTask.id) {
      tasksState.push(createdTask);
      const todoList = document.getElementById('list-todo');
      // Remove empty state from To Do list if there are cards being appended
      const emptyState = todoList.querySelector('.column-empty-state');
      if (emptyState) emptyState.remove();

      const newCard = createTaskCard(createdTask);
      todoList.appendChild(newCard);
      updateColumnCounts();
    } else {
      // Fallback reload
      fetchTasks();
    }

  } catch (error) {
    console.error('Error creating task:', error);
    showToast('Could not save task. Please try again.', 'error');
  }
}

// Helper: Formats ISO date 'YYYY-MM-DD' to readable 'MMM DD, YYYY'
function formatDate(dateString) {
  if (!dateString) return 'No date';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Helper: Checks if date is strictly in the past
function isOverdue(dateString) {
  if (!dateString) return false;
  const parts = dateString.split('-');
  if (parts.length !== 3) return false;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dueDate = new Date(year, month, day);
  dueDate.setHours(23, 59, 59, 999); // Set to end of the day

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of the day for fair comparison

  return dueDate < today;
}

// Helper: Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Add type-specific icons (standard inline SVGs)
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem; flex-shrink: 0;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  } else if (type === 'error') {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem; flex-shrink: 0;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
  } else if (type === 'warning') {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem; flex-shrink: 0;">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
  } else {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem; flex-shrink: 0;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
  }

  toast.innerHTML = iconSvg;

  // Use textContent for message content to keep it XSS safe
  const textSpan = document.createElement('span');
  textSpan.textContent = message;
  toast.appendChild(textSpan);

  container.appendChild(toast);

  // Transition away after 4 seconds
  setTimeout(() => {
    toast.classList.add('toast-hide');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

// Optimistic Task Deletion
async function handleTaskDelete(id, card) {
  const originalStatus = card.dataset.status;
  const lists = {
    'TO_DO': document.getElementById('list-todo'),
    'IN_PROGRESS': document.getElementById('list-progress'),
    'COMPLETED': document.getElementById('list-completed')
  };
  const originalList = lists[originalStatus] || document.getElementById('list-todo');

  // Add deleting class immediately to trigger CSS scale & height collapse
  card.classList.add('deleting');
  
  // Wait for transition duration (400ms) to complete before removing from DOM
  const animationTimeout = setTimeout(() => {
    card.remove();
    updateColumnCounts();
  }, 400);

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.status} ${response.statusText}`);
    }

    // Update local state array
    tasksState = tasksState.filter(t => t.id != id);
    showToast('Task deleted successfully!', 'success');
  } catch (error) {
    console.error('Error deleting task:', error);
    clearTimeout(animationTimeout);
    
    // Rollback: remove the deleting class to restore card state
    card.classList.remove('deleting');
    showToast('Failed to delete task. Reverting changes...', 'error');
    
    // Ensure the card is re-appended if it was already removed in the timeout
    if (!document.getElementById(card.id)) {
      // Remove empty state from original column if present
      const emptyState = originalList.querySelector('.column-empty-state');
      if (emptyState) emptyState.remove();
      
      originalList.appendChild(card);
      updateColumnCounts();
    }
  }
}

// Bulk Clear Completed Tasks
async function handleClearCompleted() {
  const completedCards = Array.from(document.querySelectorAll('#list-completed .task-card'));
  if (completedCards.length === 0) {
    showToast('No completed tasks to clear.', 'warning');
    return;
  }

  if (!confirm('Are you sure you want to delete all completed tasks?')) {
    return;
  }

  showToast('Clearing completed tasks...', 'info');

  // Optimistic UI Removal
  for (const card of completedCards) {
    const taskId = card.dataset.id;
    card.classList.add('deleting');
    
    // Animate removal
    setTimeout(() => {
      card.remove();
      updateColumnCounts();
    }, 400);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        tasksState = tasksState.filter(t => t.id != taskId);
      } else {
        throw new Error('Failed to delete on server');
      }
    } catch (error) {
      console.error(`Failed to delete task ${taskId}:`, error);
      // Rollback card if delete failed
      card.classList.remove('deleting');
      const completedList = document.getElementById('list-completed');
      if (!document.getElementById(card.id)) {
        const emptyState = completedList.querySelector('.column-empty-state');
        if (emptyState) emptyState.remove();
        completedList.appendChild(card);
        updateColumnCounts();
      }
    }
  }

  setTimeout(() => {
    showToast('Completed tasks cleared successfully!', 'success');
  }, 450);
}

// Helper to parse time suffix from description
function parseTimeFromDescription(description) {
  let timeStr = '';
  let cleanDesc = description || '';
  const timeRegex = /\[Time:\s*(\d{2}:\d{2})\]/;
  const match = cleanDesc.match(timeRegex);
  if (match) {
    timeStr = match[1];
    cleanDesc = cleanDesc.replace(timeRegex, '').trim();
  }
  return { timeStr, cleanDesc };
}

// Format 24h time to 12h AM/PM format
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // hour 0 should be 12
  return `${hours}:${minutes} ${ampm}`;
}
