(function () {
  const editor = document.getElementById('editor');
  const counter = document.getElementById('counter');
  const blockFormat = document.getElementById('block-format');
  const textColor = document.getElementById('text-color');
  const bgColor = document.getElementById('bg-color');

  const btnNew = document.getElementById('btn-new');
  const btnSave = document.getElementById('btn-save');
  const btnLoad = document.getElementById('btn-load');
  const btnExport = document.getElementById('btn-export');
  const menuExport = document.getElementById('menu-export');
  const btnImport = document.getElementById('btn-import');
  const menuImport = document.getElementById('menu-import');
  const fileImport = document.getElementById('file-import');

  const btnLink = document.getElementById('btn-link');
  const btnImage = document.getElementById('btn-image');
  const btnTable = document.getElementById('btn-table');
  const btnTooltip = document.getElementById('btn-tooltip');

  const linkDialog = document.getElementById('modal-link');
  const linkUrl = document.getElementById('link-url');
  const linkBlank = document.getElementById('link-blank');
  const linkConfirm = document.getElementById('link-confirm');

  const imageDialog = document.getElementById('modal-image');
  const imageUrl = document.getElementById('image-url');
  const imageFile = document.getElementById('image-file');
  const imageAlt = document.getElementById('image-alt');
  const imageConfirm = document.getElementById('image-confirm');

  const tableDialog = document.getElementById('modal-table');
  const tableRows = document.getElementById('table-rows');
  const tableCols = document.getElementById('table-cols');
  const tableConfirm = document.getElementById('table-confirm');

  const tooltipDialog = document.getElementById('modal-tooltip');
  const tooltipText = document.getElementById('tooltip-text');
  const tooltipConfirm = document.getElementById('tooltip-confirm');

  const findPanel = document.getElementById('find-panel');
  const findInput = document.getElementById('find-input');
  const replaceInput = document.getElementById('replace-input');
  const findNext = document.getElementById('find-next');
  const findPrev = document.getElementById('find-prev');
  const replaceOne = document.getElementById('replace-one');
  const replaceAll = document.getElementById('replace-all');
  const findClose = document.getElementById('find-close');

  // Helpers
  function exec(command, value = null) {
    document.execCommand(command, false, value);
    editor.focus();
    updateCounter();
  }

  function surroundSelection(nodeCreator) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const wrapper = nodeCreator();
    try {
      range.surroundContents(wrapper);
    } catch (e) {
      const contents = range.extractContents();
      wrapper.appendChild(contents);
      range.insertNode(wrapper);
    }
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);
  }

  function updateCounter() {
    const text = editor.innerText || '';
    const words = (text.trim().match(/\S+/g) || []).length;
    const chars = text.replace(/\s/g, '').length;
    counter.textContent = `${words} palavras ? ${chars} caracteres`;
  }

  function setBlock(tag) {
    if (tag === 'p') return exec('formatBlock', 'p');
    if (tag === 'blockquote') return exec('formatBlock', 'blockquote');
    if (tag === 'pre') return exec('formatBlock', 'pre');
    return exec('formatBlock', tag);
  }

  // Dropdown toggles
  btnExport.addEventListener('click', () => {
    btnExport.parentElement.classList.toggle('open');
  });
  btnImport.addEventListener('click', () => {
    btnImport.parentElement.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    const isExport = e.target.closest('#btn-export, #menu-export');
    const isImport = e.target.closest('#btn-import, #menu-import');
    if (!isExport) btnExport.parentElement.classList.remove('open');
    if (!isImport) btnImport.parentElement.classList.remove('open');
  });

  // Toolbar commands
  document.querySelectorAll('[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      exec(cmd);
    });
  });

  blockFormat.addEventListener('change', (e) => setBlock(e.target.value));
  textColor.addEventListener('input', (e) => exec('foreColor', e.target.value));
  bgColor.addEventListener('input', (e) => exec('hiliteColor', e.target.value));

  // New/Save/Load using localStorage
  const STORAGE_KEY = 'advanced-editor-document-v1';
  btnNew.addEventListener('click', () => {
    if (editor.innerText.trim() && !confirm('Descartar conte?do atual?')) return;
    editor.innerHTML = '';
    updateCounter();
  });
  btnSave.addEventListener('click', () => {
    const payload = {
      html: editor.innerHTML,
      ts: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  });
  btnLoad.addEventListener('click', () => {
    const payload = localStorage.getItem(STORAGE_KEY);
    if (!payload) return alert('Nenhum conte?do salvo.');
    try {
      const data = JSON.parse(payload);
      editor.innerHTML = data.html || '';
      updateCounter();
    } catch {
      alert('Falha ao carregar conte?do salvo.');
    }
  });

  // Export
  menuExport.addEventListener('click', (e) => {
    const type = e.target.getAttribute('data-export');
    if (!type) return;
    if (type === 'html') exportHTML();
    if (type === 'markdown') exportMarkdown();
    if (type === 'pdf') exportPDF();
  });
  function download(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  function exportHTML() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Export</title></head><body>${editor.innerHTML}</body></html>`;
    download('documento.html', html, 'text/html');
  }
  function exportMarkdown() {
    if (!window.TurndownService) return alert('Biblioteca Turndown n?o carregada');
    const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    const md = td.turndown(editor.innerHTML);
    download('documento.md', md, 'text/markdown');
  }
  function exportPDF() {
    if (!window.html2pdf) return alert('Biblioteca html2pdf n?o carregada');
    const clone = editor.cloneNode(true);
    clone.style.background = '#fff';
    const opt = { margin: 10, filename: 'documento.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    html2pdf().from(clone).set(opt).save();
  }

  // Import
  fileImport.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const name = file.name.toLowerCase();
    if (name.endsWith('.md') || name.endsWith('.markdown')) {
      if (!window.showdown) return alert('Biblioteca Showdown n?o carregada');
      const converter = new showdown.Converter();
      editor.innerHTML = converter.makeHtml(text);
    } else {
      editor.innerHTML = text;
    }
    updateCounter();
    e.target.value = '';
  });

  // Links
  btnLink.addEventListener('click', () => {
    linkUrl.value = '';
    linkBlank.checked = true;
    linkDialog.showModal();
  });
  linkConfirm.addEventListener('click', () => {
    const url = linkUrl.value.trim();
    if (!url) return;
    exec('createLink', url);
    // Add target if needed
    const selection = window.getSelection();
    if (selection && selection.anchorNode) {
      const link = selection.anchorNode.parentElement?.closest('a');
      if (link && linkBlank.checked) link.target = '_blank';
      if (link) link.rel = 'noopener noreferrer';
    }
  });

  // Images
  btnImage.addEventListener('click', () => {
    imageUrl.value = ''; imageAlt.value = ''; imageFile.value = '';
    imageDialog.showModal();
  });
  imageConfirm.addEventListener('click', async () => {
    let src = imageUrl.value.trim();
    if (!src && imageFile.files && imageFile.files[0]) {
      src = await fileToDataUrl(imageFile.files[0]);
    }
    if (!src) return;
    const alt = imageAlt.value.trim();
    const img = document.createElement('img');
    img.src = src; if (alt) img.alt = alt;
    insertNodeAtSelection(img);
  });
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject; r.readAsDataURL(file);
    });
  }

  // Tables
  btnTable.addEventListener('click', () => {
    tableRows.value = '2'; tableCols.value = '2';
    tableDialog.showModal();
  });
  tableConfirm.addEventListener('click', () => {
    const r = Math.max(1, Math.min(20, parseInt(tableRows.value || '2', 10)));
    const c = Math.max(1, Math.min(20, parseInt(tableCols.value || '2', 10)));
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    for (let i = 0; i < r; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < c; j++) {
        const td = document.createElement('td'); td.textContent = '\u00A0';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    insertNodeAtSelection(table);
  });

  // Tooltips
  btnTooltip.addEventListener('click', () => {
    tooltipText.value = '';
    tooltipDialog.showModal();
  });
  tooltipConfirm.addEventListener('click', () => {
    const text = tooltipText.value.trim();
    if (!text) return;
    surroundSelection(() => {
      const span = document.createElement('span');
      span.setAttribute('data-tooltip', text);
      return span;
    });
  });

  function insertNodeAtSelection(node) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { editor.appendChild(node); return; }
    const range = sel.getRangeAt(0);
    range.collapse(false);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges(); sel.addRange(range);
    editor.focus();
    updateCounter();
  }

  // Find/Replace
  const btnFind = document.getElementById('btn-find');
  btnFind.addEventListener('click', () => toggleFindPanel(true));
  findClose.addEventListener('click', () => toggleFindPanel(false));
  function toggleFindPanel(show) {
    findPanel.classList.toggle('hidden', !show);
    findPanel.setAttribute('aria-hidden', String(!show));
    if (show) findInput.focus();
  }
  let findMatches = []; let findIndex = -1;
  function clearFindHighlights() {
    findMatches.forEach(el => el.classList.remove('find-highlight'));
    findMatches = []; findIndex = -1;
  }
  function findAll() {
    clearFindHighlights();
    const q = findInput.value;
    if (!q) return;
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null);
    const ranges = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.nodeValue || '';
      let idx = 0; const lowQ = q.toLowerCase();
      while ((idx = text.toLowerCase().indexOf(lowQ, idx)) !== -1) {
        const range = document.createRange();
        range.setStart(node, idx); range.setEnd(node, idx + q.length);
        ranges.push(range); idx += q.length;
      }
    }
    ranges.forEach(r => {
      const span = document.createElement('span');
      span.className = 'find-highlight';
      r.surroundContents(span);
      findMatches.push(span);
    });
    if (findMatches.length) { findIndex = 0; scrollToMatch(); }
  }
  function scrollToMatch() {
    findMatches.forEach((el, i) => el.style.outline = i === findIndex ? '2px solid #f6c177' : 'none');
    const target = findMatches[findIndex];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  findNext.addEventListener('click', () => { if (!findMatches.length) findAll(); else { findIndex = (findIndex + 1) % findMatches.length; scrollToMatch(); } });
  findPrev.addEventListener('click', () => { if (!findMatches.length) findAll(); else { findIndex = (findIndex - 1 + findMatches.length) % findMatches.length; scrollToMatch(); } });
  findInput.addEventListener('input', () => findAll());
  replaceOne.addEventListener('click', () => {
    if (!findMatches.length) findAll();
    const target = findMatches[findIndex];
    if (!target) return;
    const repl = replaceInput.value || '';
    target.outerHTML = repl;
    findAll();
  });
  replaceAll.addEventListener('click', () => {
    if (!findInput.value) return;
    const re = new RegExp(findInput.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    editor.innerHTML = editor.innerHTML.replace(re, (m) => `<span class="find-highlight">${replaceInput.value || ''}</span>`);
    // Clean highlight to avoid lingering styles
    editor.querySelectorAll('.find-highlight').forEach(el => {
      const t = document.createTextNode(el.textContent || '');
      el.replaceWith(t);
    });
    findAll();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const meta = e.ctrlKey || e.metaKey;
    if (meta && e.key.toLowerCase() === 's') { e.preventDefault(); btnSave.click(); }
    if (meta && e.key.toLowerCase() === 'o') { e.preventDefault(); btnLoad.click(); }
    if (meta && e.key.toLowerCase() === 'n') { e.preventDefault(); btnNew.click(); }
    if (meta && e.key.toLowerCase() === 'k') { e.preventDefault(); btnLink.click(); }
    if (meta && e.key.toLowerCase() === 'f') { e.preventDefault(); btnFind.click(); }
  });

  // Drag/drop images
  editor.addEventListener('dragover', (e) => { e.preventDefault(); });
  editor.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || !files.length) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    const src = await fileToDataUrl(file);
    const img = document.createElement('img'); img.src = src; img.alt = file.name;
    insertNodeAtSelection(img);
  });

  // Initialize
  editor.innerHTML = '<h1>Bem-vindo</h1><p>Comece a escrever aqui. Selecione um trecho e aplique <strong>formata??o</strong>, crie <span data-tooltip="Exibe dica ao passar o mouse">tooltips</span>, insira <em>imagens</em> e <u>tabelas</u>.</p>';
  updateCounter();
})();
