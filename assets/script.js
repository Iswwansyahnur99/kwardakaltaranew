
(function(){
  // Set active nav based on body data-page
  const current = document.body.getAttribute('data-page');
  if (current) {
    const link = document.querySelector(`a[data-nav="${current}"]`);
    if (link) link.setAttribute('aria-current','page');
  }
  // Year
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  // Utilities
  const $ = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

  // Page renderers
  const DATA = window.APP_DATA || {};

  function renderPosts(listEl, searchEl, tagSel){
    if (!listEl) return;
    const q = (searchEl?.value || '').toLowerCase();
    const tag = (tagSel?.value || '');
    listEl.innerHTML='';
    DATA.posts
      .filter(p => (!q || (p.title+" "+p.excerpt+" "+p.location).toLowerCase().includes(q)) && (!tag || p.tags.includes(tag)))
      .forEach(p => {
        const el = document.createElement('article');
        el.className = 'card';
        el.setAttribute('role','listitem');
        el.innerHTML = `
          <div class="card__media">
            <span class="label tag">${p.category}</span>
          </div>
          <div class="card__body">
            <h3 class="card__title">${p.title}</h3>
            <div class="meta">${p.location} • ${new Date(p.date).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}</div>
            <p>${p.excerpt}</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
            <div style="margin-top:10px"><a class="btn" href="#">Baca kisah</a></div>
          </div>`;
        listEl.appendChild(el);
      });
    if(!listEl.children.length){
      listEl.innerHTML = '<p style="color:var(--gray)">Belum ada kisah di rentang filter ini. Coba perluas pencarian.</p>';
    }
  }

  function renderAlbums(listEl){
    if (!listEl) return;
    listEl.innerHTML='';
    DATA.albums.forEach(a=>{
      const el = document.createElement('a');
      el.href = '#';
      el.className = 'card';
      el.innerHTML = `
        <div class="card__media album__cover" role="img" aria-label="Album ${a.title}"></div>
        <div class="card__body">
          <h3 class="card__title">${a.title}</h3>
          <div class="meta">${a.location} • ${a.year} • ${a.count} foto/video</div>
          <div style="margin-top:10px"><span class="btn">Lihat album</span></div>
        </div>`;
      listEl.appendChild(el);
    });
  }

  function renderEvents(listEl){
    if (!listEl) return;
    listEl.innerHTML='';
    DATA.events.forEach(ev=>{
      const d = new Date(ev.date);
      const el = document.createElement('div');
      el.className = 'agenda__item';
      el.innerHTML = `
        <div class="agenda__date" aria-label="Tanggal kegiatan">
          <div class="d">${d.getDate().toString().padStart(2,'0')}</div>
          <div>${d.toLocaleString('id-ID',{month:'short'})}</div>
          <div>${d.getFullYear()}</div>
        </div>
        <div>
          <h3 style="margin:0 0 6px">${ev.title}</h3>
          <div class="meta">${ev.location} • ${new Date(ev.date).toLocaleDateString('id-ID')}–${new Date(ev.end).toLocaleDateString('id-ID')}</div>
          <p>Penyelenggara: ${ev.organizer}</p>
          <a class="btn btn--solid" href="${ev.url}">Detail / Daftar</a>
        </div>`;
      listEl.appendChild(el);
    });
  }

  function renderDownloads(tbody, searchEl, catSel){
    if (!tbody) return;
    const q = (searchEl?.value || '').toLowerCase();
    const cat = (catSel?.value || '');
    tbody.innerHTML='';
    DATA.downloads
      .filter(d => (!q || (d.title+" "+d.desc+" "+d.category).toLowerCase().includes(q)) && (!cat || d.category===cat))
      .forEach(d=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${d.title}</td>
          <td>${d.category}</td>
          <td>${d.desc}</td>
          <td class="table-actions"><a href="#">Unduh</a></td>
          <td>${new Date(d.updated).toLocaleDateString('id-ID')}</td>`;
        tbody.appendChild(tr);
      });
    if(!tbody.children.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="color:var(--gray)">Tidak ada dokumen sesuai filter.</td>`;
      tbody.appendChild(tr);
    }
  }

  function renderPPID(tbody, searchEl, typeSel, yearSel){
    if (!tbody) return;
    tbody.innerHTML='';
    const q=(searchEl?.value||'').toLowerCase();
    const type=(typeSel?.value||'');
    const year=(yearSel?.value||'');

    // populate year options once
    if (yearSel && yearSel.children.length===1){
      const years = Array.from(new Set(DATA.ppid.map(d=>d.year))).sort((a,b)=>b-a);
      years.forEach(y=>{
        const opt=document.createElement('option'); opt.value=y; opt.textContent=y; yearSel.appendChild(opt);
      });
    }

    DATA.ppid
      .filter(d => (!q || (d.title+" "+d.number+" "+d.unit).toLowerCase().includes(q)) && (!type || d.type===type) && (!year || String(d.year)===String(year)))
      .forEach(d=>{
        const label = d.type==='berkala'?'Berkala':(d.type==='setiap_saat'?'Setiap Saat':'Serta Merta');
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${d.title}</td>
          <td>${d.number || '-'} / ${d.year}</td>
          <td>${label}</td>
          <td>${d.unit}</td>
          <td>${new Date(d.published).toLocaleDateString('id-ID')}</td>
          <td class="table-actions"><a href="#">Unduh</a></td>`;
        tbody.appendChild(tr);
      });
    if(!tbody.children.length){
      const tr=document.createElement('tr');
      tr.innerHTML = `<td colspan="6" style="color:var(--gray)">Tidak ada dokumen sesuai filter.</td>`;
      tbody.appendChild(tr);
    }
  }

  // Page bootstrap
  document.addEventListener('DOMContentLoaded', ()=>{
    const page = document.body.getAttribute('data-page');

    if (page === 'beranda') {
      // Home sections rendered inline by HTML; nothing extra
    }

    if (page === 'catatan') {
      renderPosts(document.getElementById('posts'), document.getElementById('search-posts'), document.getElementById('tag-filter'));
      document.getElementById('search-posts').addEventListener('input', ()=>renderPosts(document.getElementById('posts'), document.getElementById('search-posts'), document.getElementById('tag-filter')));
    }

    if (page === 'galeri') {
      renderAlbums(document.getElementById('albums'));
    }

    if (page === 'agenda') {
      renderEvents(document.getElementById('events'));
    }

    if (page === 'download') {
      const tbody = document.getElementById('downloads');
      const q = document.getElementById('search-downloads');
      const cat = document.getElementById('category-downloads');
      const refresh = ()=>renderDownloads(tbody,q,cat);
      refresh(); q.addEventListener('input', refresh); cat.addEventListener('change', refresh);
    }

    if (page === 'ppid') {
      const tbody = document.getElementById('ppid-docs');
      const q = document.getElementById('search-ppid');
      const t = document.getElementById('type-ppid');
      const y = document.getElementById('year-ppid');
      const refresh = ()=>renderPPID(tbody,q,t,y);
      refresh(); q.addEventListener('input', refresh); t.addEventListener('change', refresh); y.addEventListener('change', refresh);
    }
  });
})();
