/**
 * Admin Dashboard CMS for Pramuka Kaltara
 * Handles CRUD operations for posts, events, albums
 * Uses Firebase Firestore with localStorage fallback
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

  // Firebase collections
  const COLLECTIONS = {
    POSTS: 'posts',
    EVENTS: 'events',
    ALBUMS: 'albums',
    SETTINGS: 'settings'
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
  let useFirebase = false;
  let db = null;
  let storage = null;

  // ============ Firebase Initialization ============
  function initFirebase() {
    if (window.firebaseDB && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
      db = window.firebaseDB;
      storage = window.firebaseStorage || null;
      useFirebase = true;
      console.log('Admin CMS: Using Firebase Firestore');
      if (storage) {
        console.log('Admin CMS: Firebase Storage available');
      }
      return true;
    }
    console.log('Admin CMS: Using localStorage fallback');
    return false;
  }

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

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ============ Image Upload Functions ============

  // Convert file to base64 data URL (fallback method)
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Compress image before upload
  function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Upload image to Firebase Storage
  async function uploadImageToStorage(file, folder = 'images') {
    // Check if storage is available
    if (!storage) {
      console.warn('Firebase Storage not available, checking window.firebaseStorage...');
      if (window.firebaseStorage) {
        storage = window.firebaseStorage;
      } else {
        throw new Error('Firebase Storage tidak tersedia. Pastikan Storage sudah diaktifkan di Firebase Console.');
      }
    }

    try {
      console.log('Starting image upload...', { fileName: file.name, fileSize: file.size });

      // Compress image first
      showToast('Mengompresi gambar...', 'info');
      const compressedBlob = await compressImage(file);
      console.log('Image compressed:', { originalSize: file.size, compressedSize: compressedBlob.size });

      // Generate unique filename
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${folder}/${timestamp}_${safeName}`;
      console.log('Uploading to:', filename);

      // Create storage reference
      const storageRef = storage.ref(filename);

      // Upload file with progress tracking
      showToast('Mengupload gambar...', 'info');
      const uploadTask = storageRef.put(compressedBlob, {
        contentType: 'image/jpeg',
        customMetadata: {
          'originalName': file.name,
          'uploadedAt': new Date().toISOString()
        }
      });

      // Return promise that tracks upload progress
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload progress:', progress.toFixed(1) + '%');
            updateUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error.code, error.message);
            let errorMessage = 'Gagal upload gambar';

            // Handle specific Firebase Storage errors
            switch (error.code) {
              case 'storage/unauthorized':
                errorMessage = 'Tidak memiliki izin untuk upload. Periksa Firebase Storage Rules.';
                break;
              case 'storage/canceled':
                errorMessage = 'Upload dibatalkan';
                break;
              case 'storage/unknown':
                errorMessage = 'Terjadi kesalahan. Coba lagi.';
                break;
              case 'storage/quota-exceeded':
                errorMessage = 'Kuota penyimpanan habis';
                break;
              case 'storage/invalid-checksum':
                errorMessage = 'File rusak, coba upload ulang';
                break;
              case 'storage/retry-limit-exceeded':
                errorMessage = 'Koneksi bermasalah, coba lagi';
                break;
              default:
                errorMessage = error.message || 'Gagal upload gambar';
            }
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              // Get download URL
              const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
              console.log('Upload complete! URL:', downloadURL);
              resolve(downloadURL);
            } catch (urlError) {
              console.error('Failed to get download URL:', urlError);
              reject(new Error('Gagal mendapatkan URL gambar'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  // Delete image from Firebase Storage
  async function deleteImageFromStorage(imageUrl) {
    if (!storage || !imageUrl) return;

    try {
      // Check if URL is from Firebase Storage
      if (!imageUrl.includes('firebasestorage.googleapis.com') && !imageUrl.includes('firebasestorage.app')) {
        return;
      }

      // Create reference from URL and delete
      const imageRef = storage.refFromURL(imageUrl);
      await imageRef.delete();
      console.log('Image deleted from storage');
    } catch (error) {
      // Ignore error if file doesn't exist
      if (error.code !== 'storage/object-not-found') {
        console.error('Failed to delete image:', error);
      }
    }
  }

  // Update upload progress UI
  function updateUploadProgress(progress) {
    const progressBar = $('#upload-progress-bar');
    const progressText = $('#upload-progress-text');
    if (progressBar) {
      progressBar.style.width = progress + '%';
    }
    if (progressText) {
      progressText.textContent = Math.round(progress) + '%';
    }
  }

  // Get upload component HTML - always show upload area
  function getUploadComponentHtml(fieldId, currentUrl = '', label = 'Upload Gambar') {
    const previewStyle = currentUrl ? '' : 'display:none';

    return `
      <div class="upload-component" id="${fieldId}-component">
        <label class="upload-label">${label}</label>

        <div class="upload-area" id="${fieldId}-area">
          <div class="upload-dropzone" id="${fieldId}-dropzone">
            <div class="upload-icon">📷</div>
            <div class="upload-text">
              <span class="upload-main">Klik atau drag gambar ke sini</span>
              <span class="upload-hint">JPG, PNG, WebP (Max 5MB)</span>
            </div>
            <input type="file" id="${fieldId}-file" accept="image/*" class="upload-input">
          </div>

          <div class="upload-progress" id="${fieldId}-progress" style="display:none">
            <div class="progress-bar-container">
              <div class="progress-bar" id="upload-progress-bar"></div>
            </div>
            <span class="progress-text" id="upload-progress-text">0%</span>
          </div>
        </div>

        <div class="upload-preview" id="${fieldId}-preview" style="${previewStyle}">
          <img src="${escapeHtml(currentUrl)}" alt="Preview" id="${fieldId}-preview-img">
          <button type="button" class="btn btn--danger btn--icon upload-remove" id="${fieldId}-remove" title="Hapus gambar">✕</button>
        </div>

        <div class="upload-url-input">
          <label for="${fieldId}-url">Atau masukkan URL gambar:</label>
          <input type="url" id="${fieldId}-url" value="${escapeHtml(currentUrl)}" placeholder="https://example.com/image.jpg">
        </div>

        <input type="hidden" id="${fieldId}" value="${escapeHtml(currentUrl)}">
      </div>
    `;
  }

  // Initialize upload component handlers
  function initUploadComponent(fieldId) {
    const component = $(`#${fieldId}-component`);
    if (!component) return;

    const fileInput = $(`#${fieldId}-file`);
    const dropzone = $(`#${fieldId}-dropzone`);
    const urlInput = $(`#${fieldId}-url`);
    const preview = $(`#${fieldId}-preview`);
    const previewImg = $(`#${fieldId}-preview-img`);
    const removeBtn = $(`#${fieldId}-remove`);
    const hiddenInput = $(`#${fieldId}`);
    const progressContainer = $(`#${fieldId}-progress`);

    // File input change
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) await handleFileUpload(file);
      });
    }

    // Drag and drop
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          await handleFileUpload(file);
        } else {
          showToast('File harus berupa gambar', 'error');
        }
      });

      dropzone.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput?.click();
      });
    }

    // URL input change
    if (urlInput) {
      urlInput.addEventListener('input', () => {
        const url = urlInput.value.trim();
        if (url) {
          hiddenInput.value = url;
          previewImg.src = url;
          preview.style.display = 'block';
        } else {
          hiddenInput.value = '';
          preview.style.display = 'none';
        }
      });
    }

    // Remove button
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hiddenInput.value = '';
        if (urlInput) urlInput.value = '';
        preview.style.display = 'none';
      });
    }

    // Handle file upload
    async function handleFileUpload(file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran file maksimal 5MB', 'error');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('File harus berupa gambar', 'error');
        return;
      }

      // Check if Firebase Storage is available
      const storageAvailable = storage || window.firebaseStorage;

      if (!storageAvailable) {
        // Fallback: use data URL for preview only
        showToast('Firebase Storage tidak tersedia. Gunakan URL eksternal.', 'warning');
        try {
          const dataUrl = await fileToDataURL(file);
          previewImg.src = dataUrl;
          preview.style.display = 'block';
          // Don't set hidden input - user needs to provide external URL
        } catch (err) {
          showToast('Gagal membaca file', 'error');
        }
        return;
      }

      try {
        // Show progress
        if (progressContainer) {
          progressContainer.style.display = 'flex';
          updateUploadProgress(0);
        }

        const downloadURL = await uploadImageToStorage(file, 'covers');

        if (downloadURL) {
          hiddenInput.value = downloadURL;
          if (urlInput) urlInput.value = downloadURL;
          previewImg.src = downloadURL;
          preview.style.display = 'block';
          showToast('Gambar berhasil diupload!', 'success');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        showToast(error.message || 'Gagal upload gambar', 'error');
      } finally {
        if (progressContainer) progressContainer.style.display = 'none';
        if (fileInput) fileInput.value = '';
      }
    }
  }

  // ============ Data Management ============
  async function loadData() {
    if (useFirebase) {
      try {
        currentData = { posts: [], events: [], albums: [], downloads: [], ppid: [] };

        // Load all collections
        const postsSnapshot = await db.collection(COLLECTIONS.POSTS).get();
        postsSnapshot.forEach(doc => {
          currentData.posts.push({ id: doc.id, ...doc.data() });
        });

        const eventsSnapshot = await db.collection(COLLECTIONS.EVENTS).get();
        eventsSnapshot.forEach(doc => {
          currentData.events.push({ id: doc.id, ...doc.data() });
        });

        const albumsSnapshot = await db.collection(COLLECTIONS.ALBUMS).get();
        albumsSnapshot.forEach(doc => {
          currentData.albums.push({ id: doc.id, ...doc.data() });
        });

        // Also save to localStorage for frontend sync
        localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(currentData));
        console.log('Data loaded from Firebase');
      } catch (error) {
        console.error('Failed to load from Firebase:', error);
        showToast('Gagal memuat data dari server', 'error');
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
    return currentData;
  }

  function loadFromLocalStorage() {
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
      saveToLocalStorage();
    }
  }

  function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(currentData));
    window.APP_DATA = currentData;
  }

  async function saveData() {
    saveToLocalStorage();
    // Firebase saves happen in individual CRUD operations
  }

  // ============ Firebase CRUD Operations ============
  async function firebaseAddPost(postData) {
    if (!useFirebase) return null;
    try {
      const docRef = await db.collection(COLLECTIONS.POSTS).add(postData);
      return docRef.id;
    } catch (error) {
      console.error('Firebase add post error:', error);
      throw error;
    }
  }

  async function firebaseUpdatePost(slug, postData) {
    if (!useFirebase) return;
    try {
      const snapshot = await db.collection(COLLECTIONS.POSTS).where('slug', '==', slug).get();
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update(postData);
      }
    } catch (error) {
      console.error('Firebase update post error:', error);
      throw error;
    }
  }

  async function firebaseDeletePost(slug) {
    if (!useFirebase) return;
    try {
      const snapshot = await db.collection(COLLECTIONS.POSTS).where('slug', '==', slug).get();
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.delete();
      }
    } catch (error) {
      console.error('Firebase delete post error:', error);
      throw error;
    }
  }

  async function firebaseAddEvent(eventData) {
    if (!useFirebase) return null;
    try {
      const docRef = await db.collection(COLLECTIONS.EVENTS).add(eventData);
      return docRef.id;
    } catch (error) {
      console.error('Firebase add event error:', error);
      throw error;
    }
  }

  async function firebaseUpdateEvent(id, eventData) {
    if (!useFirebase) return;
    try {
      await db.collection(COLLECTIONS.EVENTS).doc(id).update(eventData);
    } catch (error) {
      console.error('Firebase update event error:', error);
      throw error;
    }
  }

  async function firebaseDeleteEvent(id) {
    if (!useFirebase) return;
    try {
      await db.collection(COLLECTIONS.EVENTS).doc(id).delete();
    } catch (error) {
      console.error('Firebase delete event error:', error);
      throw error;
    }
  }

  async function firebaseAddAlbum(albumData) {
    if (!useFirebase) return null;
    try {
      const docRef = await db.collection(COLLECTIONS.ALBUMS).add(albumData);
      return docRef.id;
    } catch (error) {
      console.error('Firebase add album error:', error);
      throw error;
    }
  }

  async function firebaseUpdateAlbum(id, albumData) {
    if (!useFirebase) return;
    try {
      await db.collection(COLLECTIONS.ALBUMS).doc(id).update(albumData);
    } catch (error) {
      console.error('Firebase update album error:', error);
      throw error;
    }
  }

  async function firebaseDeleteAlbum(id) {
    if (!useFirebase) return;
    try {
      await db.collection(COLLECTIONS.ALBUMS).doc(id).delete();
    } catch (error) {
      console.error('Firebase delete album error:', error);
      throw error;
    }
  }

  // Seed initial data to Firebase
  async function seedFirebaseData() {
    if (!useFirebase || !window.APP_DATA) return;

    try {
      // Check if data already exists
      const postsSnapshot = await db.collection(COLLECTIONS.POSTS).limit(1).get();
      if (!postsSnapshot.empty) {
        console.log('Firebase already has data, skipping seed');
        return;
      }

      console.log('Seeding initial data to Firebase...');

      // Seed posts
      for (const post of window.APP_DATA.posts || []) {
        await db.collection(COLLECTIONS.POSTS).add(post);
      }

      // Seed events
      for (const event of window.APP_DATA.events || []) {
        await db.collection(COLLECTIONS.EVENTS).add(event);
      }

      // Seed albums
      for (const album of window.APP_DATA.albums || []) {
        await db.collection(COLLECTIONS.ALBUMS).add(album);
      }

      console.log('Firebase data seeding complete');
      showToast('Data awal berhasil dimuat ke Firebase', 'success');

      // Reload data to reflect seeding immediately
      await loadData();
      renderAll();
    } catch (error) {
      console.error('Failed to seed Firebase:', error);
    }
  }

  function resetToDefault() {
    if (confirm('Yakin ingin mereset semua data ke default? Tindakan ini tidak dapat dibatalkan!')) {
      localStorage.removeItem(STORAGE_KEYS.DATA);
      if (window.APP_DATA) {
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

  async function importData(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.posts && imported.events && imported.albums) {
          currentData = imported;
          saveToLocalStorage();

          // If using Firebase, also sync to Firebase
          if (useFirebase) {
            showToast('Mengupload data ke Firebase...', 'info');

            // Clear existing Firebase data
            const batch = db.batch();

            // Delete existing posts
            const postsSnapshot = await db.collection(COLLECTIONS.POSTS).get();
            postsSnapshot.forEach(doc => batch.delete(doc.ref));

            const eventsSnapshot = await db.collection(COLLECTIONS.EVENTS).get();
            eventsSnapshot.forEach(doc => batch.delete(doc.ref));

            const albumsSnapshot = await db.collection(COLLECTIONS.ALBUMS).get();
            albumsSnapshot.forEach(doc => batch.delete(doc.ref));

            await batch.commit();

            // Add new data
            for (const post of imported.posts) {
              await db.collection(COLLECTIONS.POSTS).add(post);
            }
            for (const event of imported.events) {
              await db.collection(COLLECTIONS.EVENTS).add(event);
            }
            for (const album of imported.albums) {
              await db.collection(COLLECTIONS.ALBUMS).add(album);
            }
          }

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

  async function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'flex';
    await loadData();
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
    renderFirebaseStatus();
  }

  function renderFirebaseStatus() {
    // Add Firebase status indicator
    const statusEl = $('#firebase-status');
    if (!statusEl) {
      const headerRight = $('.header-right');
      if (headerRight) {
        const status = document.createElement('span');
        status.id = 'firebase-status';
        status.className = 'firebase-status ' + (useFirebase ? 'connected' : 'local');
        status.innerHTML = useFirebase
          ? '🟢 Firebase'
          : '🟡 Offline';
        status.title = useFirebase
          ? 'Tersambung ke Firebase'
          : 'Mode lokal - data tersimpan di browser';
        headerRight.insertBefore(status, headerRight.firstChild);
      }
    }
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
        <div class="album-card__cover" ${album.cover ? `style="background-image: url('${escapeHtml(album.cover)}'); background-size: cover; background-position: center;"` : ''}>
          ${!album.cover ? '🖼️' : ''}
        </div>
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

        ${getUploadComponentHtml('post-cover', post?.cover || '', 'Cover Image')}

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

    // Initialize upload component
    initUploadComponent('post-cover');

    $('#post-form').addEventListener('submit', function(e) {
      e.preventDefault();
      savePost(post?.slug);
    });
  }

  async function savePost(existingSlug = null) {
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

    try {
      if (existingSlug) {
        // Update existing
        const idx = currentData.posts.findIndex(p => p.slug === existingSlug);
        if (idx !== -1) {
          currentData.posts[idx] = postData;
          if (useFirebase) await firebaseUpdatePost(existingSlug, postData);
        }
      } else {
        // Check for duplicate slug
        if (currentData.posts.some(p => p.slug === slug)) {
          postData.slug = slug + '-' + Date.now();
        }
        currentData.posts.unshift(postData);
        if (useFirebase) await firebaseAddPost(postData);
      }

      saveData();
      closeModal();
      renderAll();
      showToast(existingSlug ? 'Berita berhasil diperbarui' : 'Berita berhasil ditambahkan', 'success');
    } catch (error) {
      showToast('Gagal menyimpan: ' + error.message, 'error');
    }
  }

  function editPost(slug) {
    const post = currentData.posts.find(p => p.slug === slug);
    if (post) {
      showPostForm(post);
    }
  }

  async function deletePost(slug) {
    if (confirm('Yakin ingin menghapus berita ini?')) {
      try {
        if (useFirebase) await firebaseDeletePost(slug);
        currentData.posts = currentData.posts.filter(p => p.slug !== slug);
        saveData();
        renderAll();
        showToast('Berita berhasil dihapus', 'success');
      } catch (error) {
        showToast('Gagal menghapus: ' + error.message, 'error');
      }
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

  async function saveEvent(existingIdx = null) {
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

    try {
      if (existingIdx !== null) {
        const existingEvent = currentData.events[existingIdx];
        currentData.events[existingIdx] = eventData;
        if (useFirebase && existingEvent.id) {
          await firebaseUpdateEvent(existingEvent.id, eventData);
        }
      } else {
        if (useFirebase) {
          const id = await firebaseAddEvent(eventData);
          eventData.id = id;
        }
        currentData.events.unshift(eventData);
      }

      saveData();
      closeModal();
      renderAll();
      showToast(existingIdx !== null ? 'Agenda berhasil diperbarui' : 'Agenda berhasil ditambahkan', 'success');
    } catch (error) {
      showToast('Gagal menyimpan: ' + error.message, 'error');
    }
  }

  function editEvent(idx) {
    const event = currentData.events[idx];
    if (event) {
      showEventForm(event, idx);
    }
  }

  async function deleteEvent(idx) {
    if (confirm('Yakin ingin menghapus agenda ini?')) {
      try {
        const event = currentData.events[idx];
        if (useFirebase && event.id) {
          await firebaseDeleteEvent(event.id);
        }
        currentData.events.splice(idx, 1);
        saveData();
        renderAll();
        showToast('Agenda berhasil dihapus', 'success');
      } catch (error) {
        showToast('Gagal menghapus: ' + error.message, 'error');
      }
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

        ${getUploadComponentHtml('album-cover', album?.cover || '', 'Cover Album')}

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

    // Initialize upload component
    initUploadComponent('album-cover');

    $('#album-form').addEventListener('submit', function(e) {
      e.preventDefault();
      saveAlbum(idx);
    });
  }

  async function saveAlbum(existingIdx = null) {
    const title = $('#album-title').value.trim();
    const location = $('#album-location').value.trim();
    const year = parseInt($('#album-year').value) || new Date().getFullYear();
    const count = parseInt($('#album-count').value) || 0;
    const cover = $('#album-cover').value.trim();

    if (!title || !location) {
      showToast('Mohon lengkapi semua field yang wajib', 'error');
      return;
    }

    const albumData = { title, location, year, count, cover };

    try {
      if (existingIdx !== null) {
        const existingAlbum = currentData.albums[existingIdx];
        currentData.albums[existingIdx] = albumData;
        if (useFirebase && existingAlbum.id) {
          await firebaseUpdateAlbum(existingAlbum.id, albumData);
        }
      } else {
        if (useFirebase) {
          const id = await firebaseAddAlbum(albumData);
          albumData.id = id;
        }
        currentData.albums.unshift(albumData);
      }

      saveData();
      closeModal();
      renderAll();
      showToast(existingIdx !== null ? 'Album berhasil diperbarui' : 'Album berhasil ditambahkan', 'success');
    } catch (error) {
      showToast('Gagal menyimpan: ' + error.message, 'error');
    }
  }

  function editAlbum(idx) {
    const album = currentData.albums[idx];
    if (album) {
      showAlbumForm(album, idx);
    }
  }

  async function deleteAlbum(idx) {
    if (confirm('Yakin ingin menghapus album ini?')) {
      try {
        const album = currentData.albums[idx];
        if (useFirebase && album.id) {
          await firebaseDeleteAlbum(album.id);
        }
        currentData.albums.splice(idx, 1);
        saveData();
        renderAll();
        showToast('Album berhasil dihapus', 'success');
      } catch (error) {
        showToast('Gagal menghapus: ' + error.message, 'error');
      }
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
  async function init() {
    initFirebase();
    initEventListeners();

    if (isAuthenticated()) {
      await showDashboard();
      // Seed data to Firebase if needed
      if (useFirebase) {
        await seedFirebaseData();
      }
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
