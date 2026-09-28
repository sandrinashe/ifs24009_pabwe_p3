"use strict";

/* ==========================================================================
   PABWE P3: WealthGuide + Intertwined + QuickQuiz
   Struktur file:
   1. Utilitas umum
   2. Modal
   3. Tab
   4. WealthGuide (Expense Tracker)
   5. Intertwined (Bookmark Manager)
   6. QuickQuiz
   7. Inisialisasi
   ========================================================================== */

/* ==========================================================================
   1. UTILITAS UMUM
   ========================================================================== */

// Pintasan selector
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Setiap fitur punya key localStorage sendiri supaya data tidak saling menimpa
const STORAGE_KEYS = {
  transactions: "wealthguide:transactions",
  bookmarks: "intertwinedmind:bookmarks",
  highScore: "quickquiz:highscore",
  activeTab: "app:activeTab",
};

// Baca data dari localStorage (aman kalau data rusak / kosong)
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("Gagal membaca localStorage:", key, error);
    return fallback;
  }
}

// Simpan data ke localStorage dalam bentuk JSON string
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Gagal menyimpan ke localStorage:", key, error);
  }
}

// ID unik sederhana untuk setiap item
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Cegah XSS: ubah karakter HTML khusus sebelum dimasukkan ke innerHTML
function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(text).replace(/[&<>"']/g, (char) => map[char]);
}

// Format angka ke Rupiah, contoh: 25000 -> Rp25.000
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

// Format tanggal "2026-09-28" -> "28 Sep 2026"
function formatTanggal(isoDate) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Tanggal hari ini dalam format YYYY-MM-DD (waktu lokal)
function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

// Tampilkan / sembunyikan pesan error di bawah form
function showMessage(element, message) {
  element.textContent = message;
  element.classList.toggle("hidden", !message);
}

/* ==========================================================================
   2. MODAL
   ========================================================================== */

function openModal(name) {
  const modal = $(`#modal-${name}`);
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  // Fokus ke elemen input pertama agar mudah diketik
  const firstField = $("input:not([type=hidden]), select, button", modal);
  if (firstField) firstField.focus();
}

function closeModal(name) {
  const modal = $(`#modal-${name}`);
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function closeAllModals() {
  $$("[id^='modal-']").forEach((modal) => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });
}

// Tombol dengan atribut data-close-modal menutup modal yang dituju
document.addEventListener("click", (event) => {
  const closeBtn = event.target.closest("[data-close-modal]");
  if (closeBtn) {
    closeModal(closeBtn.dataset.closeModal);
    return;
  }
  // Klik area gelap di luar kartu modal juga menutup modal
  if (event.target.matches("[id^='modal-']")) {
    closeAllModals();
  }
});

// Tombol Escape menutup modal
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAllModals();
});

/* ==========================================================================
   3. TAB (hanya satu panel aktif; tab terakhir diingat)
   ========================================================================== */

const TAB_NAMES = ["wealth", "link", "quiz"];

function setActiveTab(name) {
  if (!TAB_NAMES.includes(name)) name = TAB_NAMES[0];

  $$(".tab-btn").forEach((button) => {
    const isActive = button.dataset.tab === name;
    button.setAttribute("aria-selected", String(isActive));
  });

  TAB_NAMES.forEach((tabName) => {
    $(`#panel-${tabName}`).classList.toggle("hidden", tabName !== name);
  });

  saveData(STORAGE_KEYS.activeTab, name);

  // Cerminkan tab aktif ke URL (?tab=...) supaya tiap tab punya alamat sendiri
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", name);
    history.replaceState(null, "", url);
  } catch (error) {
    // Beberapa browser membatasi replaceState pada file:// - aman diabaikan
  }
}

// Tab awal: prioritaskan ?tab= di URL, lalu tab terakhir dari localStorage
function getInitialTab() {
  const fromUrl = new URLSearchParams(window.location.search).get("tab");
  if (TAB_NAMES.includes(fromUrl)) return fromUrl;
  return loadData(STORAGE_KEYS.activeTab, TAB_NAMES[0]);
}

$$(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

/* ==========================================================================
   4. WEALTHGUIDE (EXPENSE TRACKER)
   ========================================================================== */

const EXPENSE_CATEGORIES = [
  "Makanan",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Pendidikan",
  "Gaji",
  "Lainnya",
];

// State: array transaksi { id, title, category, amount, type, date, createdAt }
let transactions = loadData(STORAGE_KEYS.transactions, []);

// Elemen-elemen penting
const expenseForm = $("#expense-form");
const expenseEditForm = $("#expense-edit-form");
const expenseList = $("#expense-list");
const expenseEmpty = $("#expense-empty");

// Isi <select> kategori (form tambah, form ubah, dan filter)
function fillCategoryOptions() {
  const options = EXPENSE_CATEGORIES.map(
    (category) => `<option value="${category}">${category}</option>`
  ).join("");

  $("#expense-category").innerHTML = options;
  $("#edit-expense-category").innerHTML = options;
  $("#expense-filter-category").innerHTML =
    `<option value="all">Semua kategori</option>` + options;
}

// Validasi transaksi: kembalikan pesan error, atau string kosong jika valid
function validateTransaction(data) {
  if (!data.title.trim()) return "Judul wajib diisi.";
  if (!data.category) return "Pilih kategori.";
  if (data.amount === "" || data.amount === null) return "Jumlah wajib diisi.";

  const amount = Number(data.amount);
  if (Number.isNaN(amount) || !Number.isFinite(amount)) return "Jumlah harus berupa angka yang valid.";
  if (amount <= 0) return "Jumlah harus lebih dari 0.";

  if (!["Pemasukan", "Pengeluaran"].includes(data.type)) return "Pilih tipe transaksi.";
  if (!data.date) return "Tanggal wajib diisi.";
  return "";
}

// Hitung ringkasan dari SEMUA transaksi (bukan hasil filter)
function renderSummary() {
  const income = transactions
    .filter((t) => t.type === "Pemasukan")
    .reduce((total, t) => total + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "Pengeluaran")
    .reduce((total, t) => total + t.amount, 0);

  $("#sum-income").textContent = formatRupiah(income);
  $("#sum-expense").textContent = formatRupiah(expense);
  $("#sum-balance").textContent = formatRupiah(income - expense);
}

// Ambil transaksi yang sudah dicari, difilter, dan diurutkan
function getVisibleTransactions() {
  const keyword = $("#expense-search").value.trim().toLowerCase();
  const typeFilter = $("#expense-filter-type").value;
  const categoryFilter = $("#expense-filter-category").value;
  const sortBy = $("#expense-sort").value;

  const result = transactions.filter((t) => {
    const matchTitle = t.title.toLowerCase().includes(keyword);
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchTitle && matchType && matchCategory;
  });

  result.sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      case "highest":
        return b.amount - a.amount;
      case "lowest":
        return a.amount - b.amount;
      default: // newest
        return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
    }
  });

  return result;
}

// Render ulang seluruh tampilan WealthGuide berdasarkan state
function renderExpenses() {
  renderSummary();
  const visible = getVisibleTransactions();

  expenseList.innerHTML = visible
    .map((t) => {
      const isIncome = t.type === "Pemasukan";
      const badgeClass = isIncome ? "bg-lime text-forest" : "bg-olive/40 text-forest";
      const icon = isIncome ? "ti-arrow-down-left" : "ti-arrow-up-right";
      const sign = isIncome ? "+" : "−";

      return `
        <li class="card flex items-center gap-3 p-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isIncome ? "bg-lime/60" : "bg-pale"}">
            <i aria-hidden="true" class="ti ${icon} text-lg"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">${escapeHtml(t.title)}</p>
            <div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <span class="badge ${badgeClass}">${t.type}</span>
              <span class="badge bg-cream border border-olive/40">${escapeHtml(t.category)}</span>
              <span>${formatTanggal(t.date)}</span>
            </div>
          </div>
          <p class="shrink-0 font-display text-lg font-bold">${sign}${formatRupiah(t.amount)}</p>
          <div class="flex shrink-0">
            <button type="button" class="btn-icon" data-action="edit" data-id="${t.id}" aria-label="Ubah ${escapeHtml(t.title)}">
              <i aria-hidden="true" class="ti ti-pencil"></i>
            </button>
            <button type="button" class="btn-icon hover:!text-rose-700" data-action="delete" data-id="${t.id}" aria-label="Hapus ${escapeHtml(t.title)}">
              <i aria-hidden="true" class="ti ti-trash"></i>
            </button>
          </div>
        </li>`;
    })
    .join("");

  // Jumlah hasil
  $("#expense-count").textContent = transactions.length
    ? `Menampilkan ${visible.length} dari ${transactions.length} transaksi`
    : "";

  // Empty state: berbeda untuk "belum ada data" vs "tidak ada hasil filter"
  const isEmpty = visible.length === 0;
  expenseEmpty.classList.toggle("hidden", !isEmpty);
  if (isEmpty) {
    const noData = transactions.length === 0;
    $("#expense-empty-title").textContent = noData ? "Belum ada transaksi" : "Tidak ada hasil";
    $("#expense-empty-text").textContent = noData
      ? "Tambahkan transaksi pertamamu lewat form di atas."
      : "Coba ubah kata kunci atau filter.";
  }
}

function saveTransactions() {
  saveData(STORAGE_KEYS.transactions, transactions);
}

// --- CREATE ---
expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(expenseForm));
  const error = validateTransaction(data);
  showMessage($("#expense-error"), error);
  if (error) return;

  transactions.push({
    id: generateId(),
    title: data.title.trim(),
    category: data.category,
    amount: Number(data.amount),
    type: data.type,
    date: data.date,
    createdAt: Date.now(),
  });

  saveTransactions();
  renderExpenses();
  expenseForm.reset();
  $("#expense-date").value = todayISO();
  $("#expense-title").focus();
});

// --- Tombol Ubah / Hapus pada daftar (event delegation) ---
let pendingDelete = null; // { type: "expense" | "bookmark", id }

expenseList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const item = transactions.find((t) => t.id === button.dataset.id);
  if (!item) return;

  if (button.dataset.action === "edit") {
    // Isi form modal dengan data lama
    expenseEditForm.elements.id.value = item.id;
    expenseEditForm.elements.title.value = item.title;
    expenseEditForm.elements.category.value = item.category;
    expenseEditForm.elements.amount.value = item.amount;
    expenseEditForm.elements.type.value = item.type;
    expenseEditForm.elements.date.value = item.date;
    showMessage($("#expense-edit-error"), "");
    openModal("expense-edit");
  } else {
    pendingDelete = { type: "expense", id: item.id };
    $("#delete-item-title").textContent = item.title;
    openModal("delete");
  }
});

// --- UPDATE ---
expenseEditForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(expenseEditForm));
  const error = validateTransaction(data);
  showMessage($("#expense-edit-error"), error);
  if (error) return;

  const item = transactions.find((t) => t.id === data.id);
  if (!item) return;

  item.title = data.title.trim();
  item.category = data.category;
  item.amount = Number(data.amount);
  item.type = data.type;
  item.date = data.date;

  saveTransactions();
  renderExpenses();
  closeModal("expense-edit");
});

// Cari, filter, dan sort: render ulang setiap kali berubah
["#expense-search", "#expense-filter-type", "#expense-filter-category", "#expense-sort"].forEach(
  (selector) => {
    const eventName = selector === "#expense-search" ? "input" : "change";
    $(selector).addEventListener(eventName, renderExpenses);
  }
);

/* ==========================================================================
   5. INTERTWINED (BOOKMARK / LINK MANAGER)
   ========================================================================== */

// State: array bookmark { id, name, url, category, note, createdAt }
let bookmarks = loadData(STORAGE_KEYS.bookmarks, []);

const bookmarkForm = $("#bookmark-form");
const bookmarkEditForm = $("#bookmark-edit-form");
const bookmarkList = $("#bookmark-list");
const bookmarkEmpty = $("#bookmark-empty");

// Validasi URL sederhana: harus diawali http:// atau https://
const URL_PATTERN = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

function validateBookmark(data) {
  if (!data.name.trim()) return "Nama wajib diisi.";
  if (!data.url.trim()) return "URL wajib diisi.";
  if (!URL_PATTERN.test(data.url.trim())) return "URL harus diawali http:// atau https://";
  if (!data.category.trim()) return "Kategori wajib diisi.";
  return "";
}

function getVisibleBookmarks() {
  const keyword = $("#bookmark-search").value.trim().toLowerCase();
  const sortBy = $("#bookmark-sort").value;

  // Cari berdasarkan nama, URL, atau kategori
  const result = bookmarks.filter(
    (b) =>
      b.name.toLowerCase().includes(keyword) ||
      b.url.toLowerCase().includes(keyword) ||
      b.category.toLowerCase().includes(keyword)
  );

  result.sort((a, b) => {
    if (sortBy === "az") return a.name.localeCompare(b.name, "id");
    if (sortBy === "za") return b.name.localeCompare(a.name, "id");
    return b.createdAt - a.createdAt; // terbaru
  });

  return result;
}

function renderBookmarks() {
  const visible = getVisibleBookmarks();

  bookmarkList.innerHTML = visible
    .map(
      (b) => `
      <li class="card flex flex-col p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <!-- Buka di tab baru dengan rel aman -->
            <a href="${escapeHtml(b.url)}" target="_blank" rel="noopener noreferrer"
               class="block truncate font-semibold underline decoration-olive decoration-2 underline-offset-4 hover:decoration-forest">
              ${escapeHtml(b.name)}
            </a>
            <a href="${escapeHtml(b.url)}" target="_blank" rel="noopener noreferrer"
               class="block truncate text-xs text-muted hover:text-forest">
              ${escapeHtml(b.url)}
            </a>
          </div>
          <div class="flex shrink-0">
            <button type="button" class="btn-icon" data-action="edit" data-id="${b.id}" aria-label="Ubah ${escapeHtml(b.name)}">
              <i aria-hidden="true" class="ti ti-pencil"></i>
            </button>
            <button type="button" class="btn-icon hover:!text-rose-700" data-action="delete" data-id="${b.id}" aria-label="Hapus ${escapeHtml(b.name)}">
              <i aria-hidden="true" class="ti ti-trash"></i>
            </button>
          </div>
        </div>
        <div class="mt-3">
          <span class="badge bg-lime text-forest"><i aria-hidden="true" class="ti ti-tag"></i>${escapeHtml(b.category)}</span>
        </div>
        ${b.note ? `<p class="mt-2 text-sm text-muted">${escapeHtml(b.note)}</p>` : ""}
      </li>`
    )
    .join("");

  $("#bookmark-count").textContent = bookmarks.length
    ? `Menampilkan ${visible.length} dari ${bookmarks.length} tautan`
    : "";

  const isEmpty = visible.length === 0;
  bookmarkEmpty.classList.toggle("hidden", !isEmpty);
  if (isEmpty) {
    const noData = bookmarks.length === 0;
    $("#bookmark-empty-title").textContent = noData ? "Belum ada tautan" : "Tidak ada hasil";
    $("#bookmark-empty-text").textContent = noData
      ? "Simpan tautan pertamamu lewat form di atas."
      : "Coba kata kunci lain.";
  }
}

function saveBookmarks() {
  saveData(STORAGE_KEYS.bookmarks, bookmarks);
}

// --- CREATE ---
bookmarkForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(bookmarkForm));
  const error = validateBookmark(data);
  showMessage($("#bookmark-error"), error);
  if (error) return;

  bookmarks.push({
    id: generateId(),
    name: data.name.trim(),
    url: data.url.trim(),
    category: data.category.trim(),
    note: data.note.trim(),
    createdAt: Date.now(),
  });

  saveBookmarks();
  renderBookmarks();
  bookmarkForm.reset();
  $("#bookmark-name").focus();
});

// --- Tombol Ubah / Hapus (event delegation) ---
bookmarkList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const item = bookmarks.find((b) => b.id === button.dataset.id);
  if (!item) return;

  if (button.dataset.action === "edit") {
    bookmarkEditForm.elements.id.value = item.id;
    bookmarkEditForm.elements.name.value = item.name;
    bookmarkEditForm.elements.url.value = item.url;
    bookmarkEditForm.elements.category.value = item.category;
    bookmarkEditForm.elements.note.value = item.note;
    showMessage($("#bookmark-edit-error"), "");
    openModal("bookmark-edit");
  } else {
    pendingDelete = { type: "bookmark", id: item.id };
    $("#delete-item-title").textContent = item.name;
    openModal("delete");
  }
});

// --- UPDATE ---
bookmarkEditForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(bookmarkEditForm));
  const error = validateBookmark(data);
  showMessage($("#bookmark-edit-error"), error);
  if (error) return;

  const item = bookmarks.find((b) => b.id === data.id);
  if (!item) return;

  item.name = data.name.trim();
  item.url = data.url.trim();
  item.category = data.category.trim();
  item.note = data.note.trim();

  saveBookmarks();
  renderBookmarks();
  closeModal("bookmark-edit");
});

$("#bookmark-search").addEventListener("input", renderBookmarks);
$("#bookmark-sort").addEventListener("change", renderBookmarks);

/* ==========================================================================
   DELETE (dipakai bersama oleh WealthGuide dan Intertwined)
   ========================================================================== */

$("#delete-confirm").addEventListener("click", () => {
  if (!pendingDelete) return;

  if (pendingDelete.type === "expense") {
    transactions = transactions.filter((t) => t.id !== pendingDelete.id);
    saveTransactions();
    renderExpenses();
  } else if (pendingDelete.type === "bookmark") {
    bookmarks = bookmarks.filter((b) => b.id !== pendingDelete.id);
    saveBookmarks();
    renderBookmarks();
  }

  pendingDelete = null;
  closeModal("delete");
});

/* ==========================================================================
   6. QUICKQUIZ
   ========================================================================== */

// Bank soal: array of object. answer = index opsi yang benar (mulai dari 0)
const QUESTIONS = [
  {
    question: "Method apa yang dipakai untuk mengambil elemen pertama yang cocok dengan CSS selector?",
    options: ["getElementByClass()", "querySelector()", "findElement()", "selectFirst()"],
    answer: 1,
    explanation: "querySelector() mengembalikan elemen pertama yang cocok dengan selector.",
  },
  {
    question: "Apa yang harus dilakukan agar array atau object bisa disimpan ke localStorage?",
    options: [
      "Langsung disimpan tanpa diubah",
      "Diubah jadi string dengan JSON.stringify()",
      "Diubah jadi angka dengan Number()",
      "Diubah jadi elemen HTML",
    ],
    answer: 1,
    explanation: "localStorage hanya menyimpan string, jadi data diubah dulu dengan JSON.stringify().",
  },
  {
    question: "Method apa yang mencegah form me-reload halaman saat disubmit?",
    options: ["event.stopForm()", "event.preventDefault()", "event.cancelReload()", "form.disable()"],
    answer: 1,
    explanation: "event.preventDefault() menghentikan perilaku bawaan browser saat submit.",
  },
  {
    question: "Method array mana yang membuat array baru berisi elemen yang lolos suatu kondisi?",
    options: ["map()", "forEach()", "filter()", "push()"],
    answer: 2,
    explanation: "filter() menyaring elemen berdasarkan fungsi kondisi dan mengembalikan array baru.",
  },
  {
    question: "Tag semantic HTML5 mana yang tepat untuk kelompok tautan navigasi?",
    options: ["<div>", "<section>", "<nav>", "<aside>"],
    answer: 2,
    explanation: "<nav> dibuat khusus untuk blok navigasi utama.",
  },
  {
    question: "Apa hasil dari 5 === '5' di JavaScript?",
    options: ["true", "false", "undefined", "Error"],
    answer: 1,
    explanation: "=== membandingkan nilai sekaligus tipe. Angka 5 dan string '5' berbeda tipe.",
  },
  {
    question: "Properti CSS mana yang mengaktifkan layout Flexbox?",
    options: ["display: flex", "position: flex", "layout: flexbox", "flex: container"],
    answer: 0,
    explanation: "Flexbox diaktifkan dengan display: flex pada elemen induk.",
  },
];

// State aplikasi kuis
const quiz = {
  index: 0,        // nomor soal aktif
  score: 0,        // jumlah jawaban benar
  answered: false, // sudah menjawab soal aktif?
};

// Tampilkan salah satu layar kuis: "start" | "play" | "result"
function showQuizView(view) {
  ["start", "play", "result"].forEach((name) => {
    $(`#quiz-${name}`).classList.toggle("hidden", name !== view);
  });
}

// Skor terbaik disimpan sebagai angka; null jika belum ada
function getHighScore() {
  return loadData(STORAGE_KEYS.highScore, null);
}

function renderHighScore() {
  const high = getHighScore();
  const text = high === null ? "Belum ada" : `${high} / ${QUESTIONS.length}`;
  $("#quiz-highscore-start").textContent = text;
  $("#quiz-highscore-result").textContent = text;
}

function startQuiz() {
  // Reset state
  quiz.index = 0;
  quiz.score = 0;
  quiz.answered = false;
  showQuizView("play");
  renderQuestion();
}

// Render soal berdasarkan state (quiz.index)
function renderQuestion() {
  const current = QUESTIONS[quiz.index];
  quiz.answered = false;

  $("#quiz-progress-text").textContent = `Soal ${quiz.index + 1} dari ${QUESTIONS.length}`;
  $("#quiz-score-live").textContent = `Skor ${quiz.score}`;
  $("#quiz-progress-bar").style.width = `${(quiz.index / QUESTIONS.length) * 100}%`;
  $("#quiz-question").textContent = current.question;

  $("#quiz-options").innerHTML = current.options
    .map(
      (option, i) =>
        `<button type="button" class="option-btn" data-index="${i}">${escapeHtml(option)}</button>`
    )
    .join("");

  $("#quiz-feedback").classList.add("hidden");
  $("#quiz-next-btn").classList.add("hidden");
}

// Penilaian: bandingkan pilihan user dengan kunci jawaban
function handleAnswer(chosenIndex) {
  if (quiz.answered) return; // cegah menjawab dua kali
  quiz.answered = true;

  const current = QUESTIONS[quiz.index];
  const isCorrect = chosenIndex === current.answer;
  if (isCorrect) quiz.score++;

  // Tandai opsi benar / salah, lalu kunci semua tombol
  $$("#quiz-options .option-btn").forEach((button) => {
    const i = Number(button.dataset.index);
    button.disabled = true;
    if (i === current.answer) button.classList.add("is-correct");
    else if (i === chosenIndex) button.classList.add("is-wrong");
  });

  const feedback = $("#quiz-feedback");
  feedback.textContent = (isCorrect ? "Benar! " : "Belum tepat. ") + current.explanation;
  feedback.classList.remove("hidden");

  $("#quiz-score-live").textContent = `Skor ${quiz.score}`;

  const isLast = quiz.index === QUESTIONS.length - 1;
  $("#quiz-next-btn").innerHTML = isLast
    ? `Lihat hasil<i aria-hidden="true" class="ti ti-flag"></i>`
    : `Soal berikutnya<i aria-hidden="true" class="ti ti-arrow-right"></i>`;
  $("#quiz-next-btn").classList.remove("hidden");
}

function nextQuestion() {
  if (quiz.index < QUESTIONS.length - 1) {
    quiz.index++;
    renderQuestion();
  } else {
    finishQuiz();
  }
}

// Hasil akhir: tampilkan skor, bandingkan dengan high score
function finishQuiz() {
  const total = QUESTIONS.length;
  const high = getHighScore();
  const isNewRecord = high === null || quiz.score > high;

  if (isNewRecord) saveData(STORAGE_KEYS.highScore, quiz.score);

  const percent = Math.round((quiz.score / total) * 100);
  let message = "Jangan menyerah, coba lagi ya.";
  if (percent === 100) message = "Sempurna! Semua jawabanmu benar.";
  else if (percent >= 70) message = "Bagus sekali, tinggal sedikit lagi.";
  else if (percent >= 40) message = "Lumayan, terus berlatih.";

  $("#quiz-final-score").textContent = `${quiz.score} / ${total}`;
  $("#quiz-result-message").textContent = `${message} (${percent}%)`;
  $("#quiz-new-record").classList.toggle("hidden", !isNewRecord);
  renderHighScore();
  showQuizView("result");
}

// Event kuis
$("#quiz-start-btn").addEventListener("click", startQuiz);
$("#quiz-restart-btn").addEventListener("click", startQuiz);
$("#quiz-next-btn").addEventListener("click", nextQuestion);

$("#quiz-options").addEventListener("click", (event) => {
  const button = event.target.closest(".option-btn");
  if (button) handleAnswer(Number(button.dataset.index));
});

$("#quiz-reset-highscore-btn").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEYS.highScore);
  renderHighScore();
  $("#quiz-new-record").classList.add("hidden");
});

/* ==========================================================================
   7. INISIALISASI
   ========================================================================== */

function init() {
  // WealthGuide
  fillCategoryOptions();
  $("#expense-date").value = todayISO();
  renderExpenses();

  // Intertwined
  renderBookmarks();

  // QuickQuiz
  $("#quiz-intro").textContent = `${QUESTIONS.length} soal pilihan ganda tentang dasar web.`;
  renderHighScore();
  showQuizView("start");

  // Pulihkan tab terakhir yang dibuka
  setActiveTab(getInitialTab());
}

init();