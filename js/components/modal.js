/* modal.js */
const Modal = (() => {
  const overlay = () => document.getElementById('modal-overlay');
  const box     = () => document.getElementById('modal-box');

  function open({ title = '', body = '', footer = '', size = '', onOpen } = {}) {
    box().className = `modal-box ${size}`;
    box().innerHTML = `
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" id="modal-close-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}`;
    overlay().classList.remove('hidden');
    document.getElementById('modal-close-btn').addEventListener('click', close);
    overlay().addEventListener('click', e => { if (e.target === overlay()) close(); });
    if (onOpen) onOpen(box());
  }

  function close() {
    overlay().classList.add('hidden');
    box().innerHTML = '';
  }

  function confirm({ title = 'Confirm', message = 'Are you sure?', confirmText = 'Confirm', danger = false, onConfirm } = {}) {
    open({
      title,
      body: `<p style="color:var(--text-2);font-size:14px;">${message}</p>`,
      footer: `
        <button class="btn btn-outline" id="modal-cancel">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm">${confirmText}</button>`
    });
    document.getElementById('modal-cancel').addEventListener('click', close);
    document.getElementById('modal-confirm').addEventListener('click', () => { close(); if (onConfirm) onConfirm(); });
  }

  return { open, close, confirm };
})();
