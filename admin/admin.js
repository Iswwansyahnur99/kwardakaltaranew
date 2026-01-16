/**
 * Admin Dashboard CMS for Pramuka Kaltara
 * Handles CRUD operations for posts, events, albums
 * Uses localStorage for data persistence
 */

(function() {
  'use strict';

  // ============ Configuration ============
  const STORAGE_KEYS = {
    AUTH: 'admin_auth',
    CREDENTIALS: 'admin_credentials',
    DATA: 'cms_data'
  };

  const DEFAULT_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  };

  // ============ DOM Elements ============
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const loginScreen = $('#login-screen');
  const dashboard = $('#dashboard');
  const loginForm = $('#login-form');
  const loginError = $('#login-error');
  const logoutBtn = $('#logout-btn');
  const modal = $('#modal');
  const modalTitle = $('#modal-title');
  const modalBody = $('#modal-body');
  const toast = $('#toast');
  const sidebarToggle = $('#sidebar-toggle');
  const sidebar = $('.sidebar');

  // ============ State ============
  let currentData = null;

  // ============ Utilities ============
  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============ Data Management ============
  function loadData() {
    const stored = localStorage.getItem(STORAGE_KEYS.DATA);
    if (stored) {
      try {
        currentData = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored data:', e);
        currentData = null;
      }
    }

    // If no stored data, use default from data.js
    if (!currentData && window.APP_DATA) {
      currentData = JSON.parse(JSON.stringify(window.APP_DATA));
      saveData();
    }

    return currentData;
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(currentData));
    // Also update window.APP_DATA for the frontend
    window.APP_DATA = currentData;
  }

  function resetToDefault() {
    if (confirm('Yakin ingin mereset semua data ke default? Tindakan ini tidak dapat dibatalkan!')) {
      localStorage.removeItem(STORAGE_KEYS.DATA);
      if (window.APP_DATA) {
        // Reload original data.js
        location.reload();
      }
      showToast('Data berhasil direset', 'success');
    }
  }

  function exportData() {
    const dataStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pramuka-kaltara-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil di-export', 'success');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.posts && imported.events && imported.albums) {
          currentData = imported;
          saveData();
          renderAll();
          showToast('Data berhasil di-import', 'success');
        } else {
          showToast('Format file tidak valid', 'error');
        }
      } catch (err) {
        showToast('Gagal membaca file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  // ============ Authentication ============
  function getCredentials() {
    const stored = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    return stored ? JSON.parse(stored) : DEFAULT_CREDENTIALS;
  }

  function setCredentials(username, password) {
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify({ username, password }));
  }

  function isAuthenticated() {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  }

  function login(username, password) {
    const creds = getCredentials();
    if (username === creds.username && password === creds.password) {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    showLoginScreen();
  }

  function showLoginScreen() {
    loginScreen.style.display = 'flex';
    dashboard.style.display = 'none';
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'flex';
    loadData();
    renderAll();
  }

  // ============ Modal ============
  function openModal(title, content) {
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ============ Navigation ============
  function switchSection(sectionId) {
    // Update nav
    $$('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = $(`.nav-item[data-section="${sectionId}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update sections
    $$('.section').forEach(sec => sec.classList.remove('active'));
    const activeSection = $(`#section-${sectionId}`);
    if (activeSection) activeSection.classList.add('active');

    // Update title
    const titles = {
      overview: 'Overview',
      posts: 'Kelola Berita',
      events: 'Kelola Agenda',
      albums: 'Kelola Galeri',
      settings: 'Pengaturan'
    };
    $('#page-title').textContent = titles[sectionId] || 'Dashboard';

    // Close sidebar on mobile
    sidebar.classList.remove('open');
  }

  // ============ Render Functions ============
  function renderAll() {
    renderStats();
    renderRecentPosts();
    renderPostsTable();
    renderEventsTable();
    renderAlbumsGrid();
  }

  function renderStats() {
    $('#stat-posts').textContent = currentData.posts?.length || 0;
    $('#stat-events').textContent = currentData.events?.length || 0;
    $('#stat-albums').textContent = currentData.albums?.length || 0;
    $('#stat-downloads').textContent = currentData.downloads?.length || 0;
  }

  function renderRecentPosts() {
    const container = $('#recent-posts');
    const posts = (currentData.posts || [])
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (posts.length === 0) {
      container.innerHTML = '<p style="color:var(--gray-500)">Belum ada berita</p>';
      return;
    }

    container.innerHTML = posts.map(post => `
      <div class="recent-item">
        <div class="recent-item__info">
          <h4>${escapeHtml(post.title)}</h4>
          <div class="recent-item__meta">${post.location} • ${formatDate(post.date)}</div>
        </div>
        <span class="recent-item__category">${escapeHtml(post.category || 'Umum')}</span>
      </div>
    `).join('');
  }

  function renderPostsTable() {
    const tbody = $('#posts-table');
    const searchVal = ($('#search-posts')?.value || '').toLowerCase();
    const categoryVal = $('#filter-category')?.value || '';

    let posts = (currentData.posts || []).slice();

    // Filter
    if (searchVal) {
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(searchVal) ||
        p.excerpt.toLowerCase().includes(searchVal)
      );
    }
    if (categoryVal) {
      posts = posts.filter(p => p.category === categoryVal);
    }

    // Sort by date
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (posts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-500)">Tidak ada berita</td></tr>';
      return;
    }

    tbody.innerHTML = posts.map((post, idx) => `
      <tr>
        <td><strong>${escapeHtml(post.title)}</strong></td>
        <td>${escapeHtml(post.category || '-')}</td>
        <td>${escapeHtml(post.location)}</td>
        <td>${formatDate(post.date)}</td>
        <td class="actions">
          <button class="btn btn--secondary btn--icon" onclick="AdminCMS.editPost('${post.slug}')" title="Edit">✏️</button>
          <button class="btn btn--danger btn--icon" onclick="AdminCMS.deletePost('${post.slug}')" title="Hapus">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  function renderEventsTable() {
    const tbody = $('#events-table');
    let events = (currentData.events || []).slice();

    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (events.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-500)">Tidak ada agenda</td></tr>';
      return;
    }

    tbody.innerHTML = events.map((event, idx) => `
      <tr>
        <td><strong>${escapeHtml(event.title)}</strong></td>
        <td>${escapeHtml(event.location)}</td>
        <td>${formatDate(event.date)} - ${formatDate(event.end)}</td>
        <td>${escapeHtml(event.organizer)}</td>
        <td class="actions">
          <button class="btn btn--secondary btn--icon" onclick="AdminCMS.editEvent(${idx})" title="Edit">✏️</button>
          <button class="btn btn--danger btn--icon" onclick="AdminCMS.deleteEvent(${idx})" title="Hapus">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  function renderAlbumsGrid() {
    const grid = $('#albums-grid');
    const albums = currentData.albums || [];

    if (albums.length === 0) {
      grid.innerHTML = '<p style="color:var(--gray-500)">Belum ada album</p>';
      return;
    }

    grid.innerHTML = albums.map((album, idx) => `
      <div class="album-card">
        <div class="album-card__cover">🖼️</div>
        <div class="album-card__body">
          <div class="album-card__title">${escapeHtml(album.title)}</div>
          <div class="album-card__meta">${album.location} • ${album.year} • ${album.count} foto</div>
          <div class="album-card__actions">
            <button class="btn btn--secondary btn--small" onclick="AdminCMS.editAlbum(${idx})">Edit</button>
            <button class="btn btn--danger btn--small" onclick="AdminCMS.deleteAlbum(${idx})">Hapus</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ============ CRUD: Posts ============
  function getPostFormHtml(post = null) {
    const isEdit = !!post;
    const tags = post?.tags?.join(', ') || '';
    const content = Array.isArray(post?.content) ? post.content.join('\n\n') : (post?.content || '');

    return `
      <form id="post-form">
        <div class="form-group">
          <label for="post-title">Judul Berita *</label>
          <input type="text" id="post-title" required value="${escapeHtml(post?.title || '')}" placeholder="Judul berita">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="post-category">Kategori</label>
            <select id="post-category">
              <option value="">Pilih Kategori</option>
              <option value="Kegiatan" ${post?.category === 'Kegiatan' ? 'selected' : ''}>Kegiatan</option>
              <option value="Pelatihan" ${post?.category === 'Pelatihan' ? 'selected' : ''}>Pelatihan</option>
              <option value="Pengabdian" ${post?.category === 'Pengabdian' ? 'selected' : ''}>Pengabdian</option>
              <option value="Prestasi" ${post?.category === 'Prestasi' ? 'selected' : ''}>Prestasi</option>
              <option value="Komunitas" ${post?.category === 'Komunitas' ? 'selected' : ''}>Komunitas</option>
            </select>
          </div>
          <div class="form-group">
            <label for="post-date">Tanggal *</label>
            <input type="date" id="post-date" required value="${post?.date || ''}">
          </div>
        </div>

        <div class="form-group">
          <label for="post-location">Lokasi *</label>
          <input type="text" id="post-location" required value="${escapeHtml(post?.location || '')}" placeholder="Kota/Kabupaten">
        </div>

        <div class="form-group">
          <label for="post-excerpt">Ringkasan *</label>
          <textarea id="post-excerpt" required rows="3" placeholder="Ringkasan singkat berita (1-2 kalimat)">${escapeHtml(post?.excerpt || '')}</textarea>
        </div>

        <div class="form-group">
          <label for="post-content">Isi Berita</label>
          <textarea id="post-content" rows="8" placeholder="Isi berita lengkap. Pisahkan paragraf dengan baris kosong.">${escapeHtml(content)}</textarea>
        </div>

        <div class="form-group">
          <label for="post-tags">Tags (pisahkan dengan koma)</label>
          <input type="text" id="post-tags" value="${escapeHtml(tags)}" placeholder="Contoh: Kegiatan, Pelatihan, Bakti">
        </div>

        <div class="form-group">
          <label for="post-cover">URL Cover Image</label>
          <input type="url" id="post-cover" value="${escapeHtml(post?.cover || '')}" placeholder="https://example.com/image.jpg">
        </div>

        ${isEdit ? `<input type="hidden" id="post-slug" value="${post.slug}">` : ''}

        <div class="modal__footer">
          <button type="button" class="btn btn--secondary" onclick="AdminCMS.closeModal()">Batal</button>
          <button type="submit" class="btn btn--primary">${isEdit ? 'Simpan Perubahan' : 'Tambah Berita'}</button>
        </div>
      </form>
    `;
  }

  function showPostForm(post = null) {
    const title = post ? 'Edit Berita' : 'Tambah Berita Baru';
    openModal(title, getPostFormHtml(post));

    $('#post-form').addEventListener('submit', function(e) {
      e.preventDefault();
      savePost(post?.slug);
    });
  }

  function savePost(existingSlug = null) {
    const title = $('#post-title').value.trim();
    const category = $('#post-category').value;
    const date = $('#post-date').value;
    const location = $('#post-location').value.trim();
    const excerpt = $('#post-excerpt').value.trim();
    const contentRaw = $('#post-content').value.trim();
    const tagsRaw = $('#post-tags').value.trim();
    const cover = $('#post-cover').value.trim();

    // Validation
    if (!title || !date || !location || !excerpt) {
      showToast('Mohon lengkapi semua field yang wajib', 'error');
      return;
    }

    const slug = existingSlug || generateSlug(title);
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const content = contentRaw ? contentRaw.split(/\n\n+/).filter(Boolean) : [];

    const postData = {
      title,
      slug,
      category: category || 'Kegiatan',
      date,
      location,
      excerpt,
      content: content.length > 0 ? content : undefined,
      tags,
      cover
    };

    if (existingSlug) {
      // Update existing
      const idx = currentData.posts.findIndex(p => p.slug === existingSlug);
      if (idx !== -1) {
        currentData.posts[idx] = postData;
      }
    } else {
      // Check for duplicate slug
      if (currentData.posts.some(p => p.slug === slug)) {
        postData.slug = slug + '-' + Date.now();
      }
      currentData.posts.unshift(postData);
    }

    saveData();
    closeModal();
    renderAll();
    showToast(existingSlug ? 'Berita berhasil diperbarui' : 'Berita berhasil ditambahkan', 'success');
  }

  function editPost(slug) {
    const post = currentData.posts.find(p => p.slug === slug);
    if (post) {
      showPostForm(post);
    }
  }

  function deletePost(slug) {
    if (confirm('Yakin ingin menghapus berita ini?')) {
      currentData.posts = currentData.posts.filter(p => p.slug !== slug);
      saveData();
      renderAll();
      showToast('Berita berhasil dihapus', 'success');
    }
  }

  // ============ CRUD: Events ============
  function getEventFormHtml(event = null) {
    const isEdit = !!event;

    return `
      <form id="event-form">
        <div class="form-group">
          <label for="event-title">Judul Agenda *</label>
          <input type="text" id="event-title" required value="${escapeHtml(event?.title || '')}" placeholder="Nama kegiatan">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="event-date">Tanggal Mulai *</label>
            <input type="date" id="event-date" required value="${event?.date || ''}">
          </div>
          <div class="form-group">
            <label for="event-end">Tanggal Selesai *</label>
            <input type="date" id="event-end" required value="${event?.end || ''}">
          </div>
        </div>

        <div class="form-group">
          <label for="event-location">Lokasi *</label>
          <input type="text" id="event-location" required value="${escapeHtml(event?.location || '')}" placeholder="Kota/Kabupaten">
        </div>

        <div class="form-group">
          <label for="event-organizer">Penyelenggara *</label>
          <input type="text" id="event-organizer" required value="${escapeHtml(event?.organizer || '')}" placeholder="Nama penyelenggara">
        </div>

        <div class="form-group">
          <label for="event-url">URL Pendaftaran</label>
          <input type="url" id="event-url" value="${escapeHtml(event?.url || '#')}" placeholder="https://example.com/daftar">
        </div>

        ${isEdit ? `<input type="hidden" id="event-idx" value="${event._idx}">` : ''}

        <div class="modal__footer">
          <button type="button" class="btn btn--secondary" onclick="AdminCMS.closeModal()">Batal</button>
          <button type="submit" class="btn btn--primary">${isEdit ? 'Simpan Perubahan' : 'Tambah Agenda'}</button>
        </div>
      </form>
    `;
  }

  function showEventForm(event = null, idx = null) {
    const title = event ? 'Edit Agenda' : 'Tambah Agenda Baru';
    if (event && idx !== null) event._idx = idx;
    openModal(title, getEventFormHtml(event));

    $('#event-form').addEventListener('submit', function(e) {
      e.preventDefault();
      saveEvent(idx);
    });
  }

  function saveEvent(existingIdx = null) {
    const title = $('#event-title').value.trim();
    const date = $('#event-date').value;
    const end = $('#event-end').value;
    const location = $('#event-location').value.trim();
    const organizer = $('#event-organizer').value.trim();
    const url = $('#event-url').value.trim() || '#';

    if (!title || !date || !end || !location || !organizer) {
      showToast('Mohon lengkapi semua field yang wajib', 'error');
      return;
    }

    const eventData = { title, date, end, location, organizer, url };

    if (existingIdx !== null) {
      currentData.events[existingIdx] = eventData;
    } else {
      currentData.events.unshift(eventData);
    }

    saveData();
    closeModal();
    renderAll();
    showToast(existingIdx !== null ? 'Agenda berhasil diperbarui' : 'Agenda berhasil ditambahkan', 'success');
  }

  function editEvent(idx) {
    const event = currentData.events[idx];
    if (event) {
      showEventForm(event, idx);
    }
  }

  function deleteEvent(idx) {
    if (confirm('Yakin ingin menghapus agenda ini?')) {
      currentData.events.splice(idx, 1);
      saveData();
      renderAll();
      showToast('Agenda berhasil dihapus', 'success');
    }
  }

  // ============ CRUD: Albums ============
  function getAlbumFormHtml(album = null) {
    const isEdit = !!album;

    return `
      <form id="album-form">
        <div class="form-group">
          <label for="album-title">Judul Album *</label>
          <input type="text" id="album-title" required value="${escapeHtml(album?.title || '')}" placeholder="Nama album">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="album-location">Lokasi *</label>
            <input type="text" id="album-location" required value="${escapeHtml(album?.location || '')}" placeholder="Kota/Kabupaten">
          </div>
          <div class="form-group">
            <label for="album-year">Tahun *</label>
            <input type="number" id="album-year" required value="${album?.year || new Date().getFullYear()}" min="2000" max="2100">
          </div>
        </div>

        <div class="form-group">
          <label for="album-count">Jumlah Foto *</label>
          <input type="number" id="album-count" required value="${album?.count || 0}" min="0">
        </div>

        ${isEdit ? `<input type="hidden" id="album-idx" value="${album._idx}">` : ''}

        <div class="modal__footer">
          <button type="button" class="btn btn--secondary" onclick="AdminCMS.closeModal()">Batal</button>
          <button type="submit" class="btn btn--primary">${isEdit ? 'Simpan Perubahan' : 'Tambah Album'}</button>
        </div>
      </form>
    `;
  }

  function showAlbumForm(album = null, idx = null) {
    const title = album ? 'Edit Album' : 'Tambah Album Baru';
    if (album && idx !== null) album._idx = idx;
    openModal(title, getAlbumFormHtml(album));

    $('#album-form').addEventListener('submit', function(e) {
      e.preventDefault();
      saveAlbum(idx);
    });
  }

  function saveAlbum(existingIdx = null) {
    const title = $('#album-title').value.trim();
    const location = $('#album-location').value.trim();
    const year = parseInt($('#album-year').value) || new Date().getFullYear();
    const count = parseInt($('#album-count').value) || 0;

    if (!title || !location) {
      showToast('Mohon lengkapi semua field yang wajib', 'error');
      return;
    }

    const albumData = { title, location, year, count };

    if (existingIdx !== null) {
      currentData.albums[existingIdx] = albumData;
    } else {
      currentData.albums.unshift(albumData);
    }

    saveData();
    closeModal();
    renderAll();
    showToast(existingIdx !== null ? 'Album berhasil diperbarui' : 'Album berhasil ditambahkan', 'success');
  }

  function editAlbum(idx) {
    const album = currentData.albums[idx];
    if (album) {
      showAlbumForm(album, idx);
    }
  }

  function deleteAlbum(idx) {
    if (confirm('Yakin ingin menghapus album ini?')) {
      currentData.albums.splice(idx, 1);
      saveData();
      renderAll();
      showToast('Album berhasil dihapus', 'success');
    }
  }

  // ============ Settings ============
  function handleSettingsForm(e) {
    e.preventDefault();

    const newUsername = $('#new-username').value.trim();
    const newPassword = $('#new-password').value;
    const confirmPassword = $('#confirm-password').value;

    if (!newUsername && !newPassword) {
      showToast('Tidak ada perubahan', 'warning');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast('Password tidak cocok', 'error');
      return;
    }

    const creds = getCredentials();

    if (newUsername) creds.username = newUsername;
    if (newPassword) creds.password = newPassword;

    setCredentials(creds.username, creds.password);

    $('#new-username').value = '';
    $('#new-password').value = '';
    $('#confirm-password').value = '';

    showToast('Pengaturan berhasil disimpan', 'success');
  }

  // ============ Event Listeners ============
  function initEventListeners() {
    // Login form
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const username = $('#username').value;
      const password = $('#password').value;

      if (login(username, password)) {
        showDashboard();
      } else {
        loginError.textContent = 'Username atau password salah';
        loginError.style.display = 'block';
      }
    });

    // Logout
    logoutBtn.addEventListener('click', logout);

    // Navigation
    $$('.nav-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.dataset.section;
        if (section) switchSection(section);
      });
    });

    // Also handle section switching from buttons
    $$('[data-section]').forEach(el => {
      if (!el.classList.contains('nav-item')) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          switchSection(this.dataset.section);
        });
      }
    });

    // Sidebar toggle (mobile)
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });

    // Close modal on backdrop click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });

    // Close modal button
    $('.modal__close').addEventListener('click', closeModal);

    // Add post button
    $('#add-post-btn').addEventListener('click', function() {
      showPostForm();
    });

    // Add event button
    $('#add-event-btn').addEventListener('click', function() {
      showEventForm();
    });

    // Add album button
    $('#add-album-btn').addEventListener('click', function() {
      showAlbumForm();
    });

    // Search posts
    $('#search-posts')?.addEventListener('input', renderPostsTable);

    // Filter category
    $('#filter-category')?.addEventListener('change', renderPostsTable);

    // Export data
    $('#export-data')?.addEventListener('click', exportData);

    // Import data
    $('#import-data')?.addEventListener('change', function(e) {
      if (e.target.files[0]) {
        importData(e.target.files[0]);
        e.target.value = '';
      }
    });

    // Settings form
    $('#settings-form')?.addEventListener('submit', handleSettingsForm);

    // Reset data
    $('#reset-data')?.addEventListener('click', resetToDefault);

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // ============ Initialize ============
  function init() {
    initEventListeners();

    if (isAuthenticated()) {
      showDashboard();
    } else {
      showLoginScreen();
    }
  }

  // Expose public API
  window.AdminCMS = {
    editPost,
    deletePost,
    editEvent,
    deleteEvent,
    editAlbum,
    deleteAlbum,
    closeModal
  };

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
