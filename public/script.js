/* ==========================================================================
   Notes — frontend logic
   Talks to the existing backend routes exactly as they are:
     GET    /notes        -> JSON array of notes
     POST   /notes        -> body { id, title, content }, plain-text response
     PATCH  /notes/:id     -> body { title?, content? }, returns JSON array
                              (or plain text "Note not found")
     DELETE /notes/:id     -> returns JSON array (or plain text "Note not found")

   The backend expects the client to supply `id` on create, so we generate
   one locally (max existing id + 1). No backend logic is touched here.
   ========================================================================== */

(() => {
  "use strict";

  /* ---------------- DOM references ---------------- */
  const form = document.getElementById("note-form");
  const idField = document.getElementById("note-id");
  const titleField = document.getElementById("note-title");
  const contentField = document.getElementById("note-content");
  const submitBtn = document.getElementById("submit-btn");
  const submitLabel = submitBtn.querySelector(".btn-label");
  const cancelBtn = document.getElementById("cancel-btn");
  const composerModeLabel = document.getElementById("composer-mode-label");

  const notesList = document.getElementById("notes-list");
  const loadingState = document.getElementById("loading-state");
  const emptyState = document.getElementById("empty-state");
  const refreshBtn = document.getElementById("refresh-btn");
  const cardTemplate = document.getElementById("note-card-template");

  const overlay = document.getElementById("confirm-overlay");
  const confirmCancelBtn = document.getElementById("confirm-cancel");
  const confirmDeleteBtn = document.getElementById("confirm-delete");

  const toastContainer = document.getElementById("toast-container");

  /* ---------------- State ---------------- */
  let notes = [];
  let pendingDeleteId = null;

  /* ==========================================================
     API helper
     Reads the response as text first because the backend mixes
     plain-text replies ("Note not found") with JSON array replies,
     depending on the route and outcome.
     ========================================================== */
  async function apiRequest(url, options = {}) {
    let res;
    try {
      res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
    } catch (networkErr) {
      throw new Error("Could not reach the server. Is it running?");
    }

    const raw = await res.text();
    let data = raw;
    try {
      data = JSON.parse(raw);
    } catch {
      /* not JSON — keep as plain text */
    }

    return { ok: res.ok, status: res.status, data };
  }

  /* ==========================================================
     Toasts
     ========================================================== */
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === "success" ? "✓" : "!"}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("leaving");
      toast.addEventListener("animationend", () => toast.remove(), {
        once: true,
      });
    }, 3200);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ==========================================================
     Loading / empty state helpers
     ========================================================== */
  function setLoading(isLoading) {
    loadingState.classList.toggle("hidden", !isLoading);
    if (isLoading) {
      notesList.classList.add("hidden");
      emptyState.classList.add("hidden");
    } else {
      notesList.classList.remove("hidden");
    }
  }

  function updateEmptyState() {
    emptyState.classList.toggle("hidden", notes.length !== 0);
  }

  /* ==========================================================
     Rendering
     ========================================================== */
  function renderNotes() {
    notesList.innerHTML = "";
    updateEmptyState();

    notes.forEach((note) => {
      notesList.appendChild(buildNoteCard(note));
    });
  }

  function buildNoteCard(note) {
    const fragment = cardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".note-card");

    card.dataset.id = note.id;
    card.querySelector(".note-title").textContent = note.title;
    card.querySelector(".note-content").textContent = note.content;
    card.querySelector(".note-id").textContent = `#${note.id}`;

    card
      .querySelector(".edit-btn")
      .addEventListener("click", () => enterEditMode(note));
    card
      .querySelector(".delete-btn")
      .addEventListener("click", () => openConfirmDialog(note.id));

    return card;
  }

  function flashCardAsUpdated(id) {
    const card = notesList.querySelector(`.note-card[data-id="${id}"]`);
    if (!card) return;
    card.classList.add("just-updated");
    card.addEventListener(
      "animationend",
      () => card.classList.remove("just-updated"),
      { once: true },
    );
  }

  /* ==========================================================
     Load notes (GET /notes)
     ========================================================== */
  async function loadNotes() {
    setLoading(true);
    try {
      const { ok, data } = await apiRequest("/notes");
      if (!ok || !Array.isArray(data)) {
        throw new Error("Unexpected response while loading notes.");
      }
      notes = data;
      renderNotes();
    } catch (err) {
      showToast(err.message || "Failed to load notes.", "error");
      notes = [];
      renderNotes();
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     Composer mode: add vs edit
     ========================================================== */
  function enterEditMode(note) {
    idField.value = note.id;
    titleField.value = note.title;
    contentField.value = note.content;

    composerModeLabel.textContent = "Edit note";
    submitLabel.textContent = "Save changes";
    cancelBtn.classList.remove("hidden");

    titleField.focus();
    document
      .querySelector(".composer")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetComposer() {
    form.reset();
    idField.value = "";
    composerModeLabel.textContent = "New note";
    submitLabel.textContent = "Add note";
    cancelBtn.classList.add("hidden");
  }

  cancelBtn.addEventListener("click", resetComposer);

  /* ==========================================================
     Create / update a note (form submit)
     ========================================================== */
  function nextId() {
    if (notes.length === 0) return 1;
    return Math.max(...notes.map((n) => Number(n.id) || 0)) + 1;
  }

  function setSubmitLoading(isLoading) {
    submitBtn.classList.toggle("is-loading", isLoading);
    submitBtn.disabled = isLoading;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = titleField.value.trim();
    const content = contentField.value.trim();
    if (!title || !content) {
      showToast("Title and content are both required.", "error");
      return;
    }

    const editingId = idField.value ? Number(idField.value) : null;
    setSubmitLoading(true);

    try {
      if (editingId) {
        await updateNote(editingId, title, content);
      } else {
        await createNote(title, content);
      }
    } catch (err) {
      showToast(
        err.message || "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      setSubmitLoading(false);
    }
  });

  async function createNote(title, content) {
    const id = nextId();
    const { ok, status, data } = await apiRequest("/notes", {
      method: "POST",
      body: JSON.stringify({ id, title, content }),
    });

    if (!ok || status !== 201) {
      throw new Error(
        typeof data === "string" ? data : "Could not add the note.",
      );
    }

    notes.push({ id, title, content });
    renderNotes();
    flashCardAsUpdated(id);
    resetComposer();
    showToast("Note added.", "success");
  }

  async function updateNote(id, title, content) {
    const { ok, data } = await apiRequest(`/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title, content }),
    });

    if (!ok || !Array.isArray(data)) {
      throw new Error(
        typeof data === "string" ? data : "Could not update the note.",
      );
    }

    notes = data;
    renderNotes();
    flashCardAsUpdated(id);
    resetComposer();
    showToast("Note updated.", "success");
  }

  /* ==========================================================
     Delete a note, with confirmation dialog
     ========================================================== */
  function openConfirmDialog(id) {
    pendingDeleteId = id;
    overlay.classList.remove("hidden");
    confirmDeleteBtn.focus();
  }

  function closeConfirmDialog() {
    pendingDeleteId = null;
    overlay.classList.add("hidden");
  }

  confirmCancelBtn.addEventListener("click", closeConfirmDialog);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeConfirmDialog();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.classList.contains("hidden")) {
      closeConfirmDialog();
    }
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    const card = notesList.querySelector(`.note-card[data-id="${id}"]`);

    confirmDeleteBtn.disabled = true;
    try {
      const { ok, data } = await apiRequest(`/notes/${id}`, {
        method: "DELETE",
      });

      if (!ok || !Array.isArray(data)) {
        throw new Error(
          typeof data === "string" ? data : "Could not delete the note.",
        );
      }

      closeConfirmDialog();

      // Play the exit animation, then sync state and re-render.
      if (card) {
        card.classList.add("is-leaving");
        await new Promise((resolve) =>
          card.addEventListener("animationend", resolve, { once: true }),
        );
      }

      notes = data;
      renderNotes();
      showToast("Note deleted.", "success");
    } catch (err) {
      closeConfirmDialog();
      showToast(err.message || "Could not delete the note.", "error");
    } finally {
      confirmDeleteBtn.disabled = false;
    }
  });

  /* ==========================================================
     Refresh button
     ========================================================== */
  refreshBtn.addEventListener("click", loadNotes);

  /* ==========================================================
     Button hover glow — tracks pointer for the radial highlight
     ========================================================== */
  document.addEventListener("pointermove", (event) => {
    const btn = event.target.closest(".btn");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty("--x", `${event.clientX - rect.left}px`);
    btn.style.setProperty("--y", `${event.clientY - rect.top}px`);
  });

  /* ---------------- Init ---------------- */
  loadNotes();
})();
