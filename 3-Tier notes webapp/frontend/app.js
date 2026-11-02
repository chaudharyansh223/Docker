/**
 * Mobile Notes Web Application Client
 * Interacts with Backend REST API (proxied via Nginx) -> MySQL
 */

// API Base URL - relative to current host so Nginx reverse proxies it directly
const API_BASE = '/api';

// State
let notes = [];
let activeNote = null; // null = new note mode, or object { id, title, content, color, is_pinned }
let activeColor = '#ffffff';
let selectedFilterColor = 'all';
let deleteTargetId = null;

// DOM Elements
const notesCounter = document.getElementById('notesCounter');
const pinnedSection = document.getElementById('pinnedSection');
const pinnedGrid = document.getElementById('pinnedGrid');
const allSectionTitle = document.getElementById('allSectionTitle');
const notesGrid = document.getElementById('notesGrid');
const emptyState = document.getElementById('emptyState');
const statusBanner = document.getElementById('statusBanner');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const colorFilterBar = document.getElementById('colorFilterBar');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const refreshBtn = document.getElementById('refreshBtn');

// Modal Elements
const noteModal = document.getElementById('noteModal');
const modalCard = document.getElementById('modalCard');
const modalHeaderTitle = document.getElementById('modalHeaderTitle');
const saveStatusIndicator = document.getElementById('saveStatusIndicator');
const noteTitleInput = document.getElementById('noteTitleInput');
const noteContentInput = document.getElementById('noteContentInput');
const noteTimestampText = document.getElementById('noteTimestampText');
const noteCharCount = document.getElementById('noteCharCount');
const notePinnedCheckbox = document.getElementById('notePinnedCheckbox');
const colorPicker = document.getElementById('colorPicker');
const deleteInModalBtn = document.getElementById('deleteInModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const saveModalBottomBtn = document.getElementById('saveModalBottomBtn');
const fabNewNote = document.getElementById('fabNewNote');

// Confirm Dialog Elements
const confirmDialog = document.getElementById('confirmDialog');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// Toast Element
const toastEl = document.getElementById('toast');
let toastTimer = null;

// ============================================================
// Initialization & Events
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  loadNotes();
});

function setupEventListeners() {
  // New Note button
  fabNewNote.addEventListener('click', () => openEditor());

  // Close Modal buttons
  closeModalBtn.addEventListener('click', closeEditor);
  cancelModalBtn.addEventListener('click', closeEditor);

  // Close modal when clicking outside modal-card
  noteModal.addEventListener('click', (e) => {
    if (e.target === noteModal) closeEditor();
  });

  // Save Note buttons (Header & Footer)
  saveNoteBtn.addEventListener('click', handleSaveNote);
  saveModalBottomBtn.addEventListener('click', handleSaveNote);

  // Delete Note inside modal
  deleteInModalBtn.addEventListener('click', () => {
    if (activeNote && activeNote.id) {
      promptDelete(activeNote.id);
    }
  });

  // Color picker in editor
  colorPicker.addEventListener('click', (e) => {
    const dot = e.target.closest('.color-dot');
    if (!dot) return;
    const color = dot.dataset.color;
    selectEditorColor(color);
  });

  // Content input listeners for char count & indicator
  noteContentInput.addEventListener('input', updateCharCount);
  noteTitleInput.addEventListener('input', () => {
    saveStatusIndicator.textContent = 'Unsaved changes';
  });

  // Search input with debounce
  let searchTimeout = null;
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    clearSearchBtn.classList.toggle('hidden', query.length === 0);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadNotes(query);
    }, 250);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    loadNotes();
  });

  // Color Filter bar
  colorFilterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedFilterColor = chip.dataset.color;
    renderNotes();
  });

  // Refresh / Sync
  refreshBtn.addEventListener('click', () => {
    loadNotes(searchInput.value.trim());
    showToast('🔄 Synchronized with database');
  });

  // Theme toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Confirm delete modal handlers
  confirmDeleteBtn.addEventListener('click', executeDelete);
  cancelDeleteBtn.addEventListener('click', () => {
    confirmDialog.classList.add('hidden');
    deleteTargetId = null;
  });

  // Keyboard shortcut: Escape closes modal, Ctrl+S saves
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !noteModal.classList.contains('hidden')) {
      closeEditor();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !noteModal.classList.contains('hidden')) {
      e.preventDefault();
      handleSaveNote();
    }
  });
}

// ============================================================
// API Calls & Data Fetching
// ============================================================
async function loadNotes(query = '') {
  try {
    statusBanner.classList.add('hidden');
    const url = query ? `${API_BASE}/notes?q=${encodeURIComponent(query)}` : `${API_BASE}/notes`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: Failed to fetch notes`);
    const data = await res.json();
    notes = data.data || [];
    renderNotes();
  } catch (err) {
    console.error('Failed to load notes:', err);
    showErrorBanner(`Unable to connect to backend/MySQL: ${err.message}. Retrying...`);
  }
}

async function handleSaveNote() {
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();
  const is_pinned = notePinnedCheckbox.checked;
  const color = activeColor;

  if (!title && !content) {
    showToast('⚠️ Please enter a title or note content');
    return;
  }

  saveNoteBtn.disabled = true;
  saveModalBottomBtn.disabled = true;
  saveStatusIndicator.textContent = 'Saving to database...';

  try {
    let res;
    if (activeNote && activeNote.id) {
      // Update existing note (PUT)
      res = await fetch(`${API_BASE}/notes/${activeNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, color, is_pinned })
      });
    } else {
      // Create new note (POST)
      res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, color, is_pinned })
      });
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Save failed with code ${res.status}`);
    }

    const savedData = await res.json();
    showToast('💾 Note saved successfully!');
    closeEditor();
    loadNotes(searchInput.value.trim());
  } catch (err) {
    console.error('Error saving note:', err);
    saveStatusIndicator.textContent = 'Save failed!';
    showToast(`❌ Error saving note: ${err.message}`);
  } finally {
    saveNoteBtn.disabled = false;
    saveModalBottomBtn.disabled = false;
  }
}

async function executeDelete() {
  if (!deleteTargetId) return;
  const id = deleteTargetId;
  confirmDialog.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error(`Delete failed with status ${res.status}`);

    showToast('🗑️ Note deleted');
    if (activeNote && activeNote.id === id) {
      closeEditor();
    }
    loadNotes(searchInput.value.trim());
  } catch (err) {
    console.error('Error deleting note:', err);
    showToast(`❌ Delete failed: ${err.message}`);
  } finally {
    deleteTargetId = null;
  }
}

async function handleTogglePin(id, e) {
  if (e) e.stopPropagation();
  try {
    const res = await fetch(`${API_BASE}/notes/${id}/pin`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Pin update failed');
    const data = await res.json();
    showToast(data.is_pinned ? '📌 Note pinned to top' : 'Unpinned note');
    loadNotes(searchInput.value.trim());
  } catch (err) {
    console.error('Error toggling pin:', err);
    showToast(`❌ Error: ${err.message}`);
  }
}

// ============================================================
// UI Rendering
// ============================================================
function renderNotes() {
  let filtered = notes;

  // Filter by color chip
  if (selectedFilterColor !== 'all') {
    filtered = filtered.filter(n => (n.color || '#ffffff').toLowerCase() === selectedFilterColor.toLowerCase());
  }

  // Update header counter
  notesCounter.textContent = `${notes.length} ${notes.length === 1 ? 'note' : 'notes'} stored in MySQL`;

  // Separate pinned vs normal
  const pinnedNotes = filtered.filter(n => n.is_pinned == 1);
  const normalNotes = filtered.filter(n => n.is_pinned != 1);

  // Render Pinned Section
  if (pinnedNotes.length > 0) {
    pinnedSection.classList.remove('hidden');
    pinnedGrid.innerHTML = pinnedNotes.map(n => createNoteCardHTML(n)).join('');
    allSectionTitle.textContent = 'OTHER NOTES';
  } else {
    pinnedSection.classList.add('hidden');
    pinnedGrid.innerHTML = '';
    allSectionTitle.textContent = 'ALL NOTES';
  }

  // Render Normal Section
  if (normalNotes.length > 0) {
    notesGrid.innerHTML = normalNotes.map(n => createNoteCardHTML(n)).join('');
  } else {
    notesGrid.innerHTML = '';
  }

  // Handle empty state
  const isTotallyEmpty = filtered.length === 0;
  emptyState.classList.toggle('hidden', !isTotallyEmpty);

  // Attach card event listeners
  document.querySelectorAll('.note-card').forEach(card => {
    const id = parseInt(card.dataset.id, 10);
    const note = notes.find(n => n.id === id);

    // Click card opens editor
    card.addEventListener('click', () => {
      if (note) openEditor(note);
    });

    // Pin button click
    const pinBtn = card.querySelector('.btn-pin');
    if (pinBtn) {
      pinBtn.addEventListener('click', (e) => handleTogglePin(id, e));
    }

    // Edit button click
    const editBtn = card.querySelector('.btn-edit');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (note) openEditor(note);
      });
    }

    // Delete button click
    const delBtn = card.querySelector('.btn-delete');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        promptDelete(id);
      });
    }
  });
}

function createNoteCardHTML(note) {
  const noteColor = note.color || '#ffffff';
  const formattedDate = formatDate(note.updated_at || note.created_at);
  const escapeHTML = str => (str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));

  return `
    <div class="note-card" data-id="${note.id}" style="background-color: ${noteColor};">
      <div class="note-card-header">
        <h3 class="note-title">${escapeHTML(note.title || 'Untitled Note')}</h3>
        ${note.is_pinned ? `<span class="note-pin-badge" title="Pinned">📌</span>` : ''}
      </div>

      <div class="note-content-preview">${escapeHTML(note.content || 'No content')}</div>

      <div class="note-card-footer">
        <span class="note-date">${formattedDate}</span>
        <div class="note-card-actions">
          <button class="card-action-btn btn-pin" title="${note.is_pinned ? 'Unpin' : 'Pin to top'}">
            ${note.is_pinned ? 'Unpin' : '📌'}
          </button>
          <button class="card-action-btn btn-edit" title="Edit Note">
            ✏️
          </button>
          <button class="card-action-btn btn-delete" title="Delete Note">
            🗑️
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// Modal Editor Management
// ============================================================
function openEditor(note = null) {
  activeNote = note;

  if (note) {
    // Edit existing note mode
    modalHeaderTitle.textContent = 'Edit Note';
    noteTitleInput.value = note.title || '';
    noteContentInput.value = note.content || '';
    notePinnedCheckbox.checked = !!note.is_pinned;
    activeColor = note.color || '#ffffff';
    noteTimestampText.textContent = `Last modified: ${formatDate(note.updated_at)}`;
    deleteInModalBtn.classList.remove('hidden');
    saveStatusIndicator.textContent = 'Saved to database';
  } else {
    // Create new note mode
    modalHeaderTitle.textContent = 'New Note';
    noteTitleInput.value = '';
    noteContentInput.value = '';
    notePinnedCheckbox.checked = false;
    activeColor = '#ffffff';
    noteTimestampText.textContent = 'New note';
    deleteInModalBtn.classList.add('hidden');
    saveStatusIndicator.textContent = 'Draft';
  }

  selectEditorColor(activeColor);
  updateCharCount();

  noteModal.classList.remove('hidden');
  // Auto-focus title or content
  setTimeout(() => {
    if (note && note.title) {
      noteContentInput.focus();
    } else {
      noteTitleInput.focus();
    }
  }, 100);
}

function closeEditor() {
  noteModal.classList.add('hidden');
  activeNote = null;
}

function selectEditorColor(color) {
  activeColor = color;
  modalCard.style.backgroundColor = color;
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.classList.toggle('selected', dot.dataset.color.toLowerCase() === color.toLowerCase());
  });
}

function updateCharCount() {
  const count = (noteContentInput.value || '').length;
  noteCharCount.textContent = `${count} ${count === 1 ? 'char' : 'chars'}`;
  saveStatusIndicator.textContent = 'Unsaved changes';
}

function promptDelete(id) {
  deleteTargetId = id;
  confirmDialog.classList.remove('hidden');
}

// ============================================================
// Utility Functions
// ============================================================
function formatDate(isoString) {
  if (!isoString) return 'Just now';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function showToast(message) {
  if (toastTimer) clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  toastTimer = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 3000);
}

function showErrorBanner(msg) {
  statusBanner.textContent = msg;
  statusBanner.className = 'status-banner error';
  statusBanner.classList.remove('hidden');
}

// Theme handling
function initTheme() {
  const saved = localStorage.getItem('notes_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  themeToggleBtn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('notes_theme', next);
  themeToggleBtn.textContent = next === 'dark' ? '☀️' : '🌙';
}
