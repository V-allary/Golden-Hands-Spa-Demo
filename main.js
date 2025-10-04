  // main.js 
document.addEventListener('DOMContentLoaded', () => {

    const toggleButtons = document.querySelectorAll('.toggle-btn');
  
    function openInline(panel, btn) {
      panel.classList.add('open');
      panel.removeAttribute('hidden');
      panel.setAttribute('aria-hidden', 'false');
      btn?.setAttribute('aria-expanded', 'true');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      setTimeout(() => { if (panel.classList.contains('open')) panel.style.maxHeight = 'none'; }, 350);
    }
  
    function closeInline(panel, btn) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      void panel.offsetHeight;
      panel.style.maxHeight = '0px';
      panel.addEventListener('transitionend', function handler() {
        panel.classList.remove('open');
        panel.setAttribute('hidden', '');
        panel.setAttribute('aria-hidden', 'true');
        btn?.setAttribute('aria-expanded', 'false');
        panel.removeEventListener('transitionend', handler);
      });
    }
  
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sel = btn.dataset.target || btn.dataset.bsTarget || btn.getAttribute('aria-controls');
        if (!sel) return;
        const panel = document.querySelector(sel);
        if (!panel) return;
  
        
        if (btn.dataset.full === 'true') {
          openFullPanelFrom(panel, btn);
          return;
        }
  
        panel.classList.contains('open') ? closeInline(panel, btn) : openInline(panel, btn);
      });
    });
  
    window.addEventListener('resize', () => {
      document.querySelectorAll('.extra-list.open').forEach(p => p.style.maxHeight = p.scrollHeight + 'px');
    });
  
    // Fullscreen panel: re-uses the HTML element with id="full-info-panel"
    const FP = {
      panel: document.getElementById('full-info-panel'),
      titleEl: null,
      bodyEl: null,
      closeButtons: null,
      lastFocused: null,
      sourcePanel: null
    };
  
    if (FP.panel) {
      FP.titleEl = FP.panel.querySelector('.fullpanel-heading') || FP.panel.querySelector('#fullpanel-title');
      FP.bodyEl = FP.panel.querySelector('.fullpanel-body');
      FP.closeButtons = FP.panel.querySelectorAll('[data-fp-close]');
  
      const lockScroll = () => { document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; };
      const unlockScroll = () => { document.documentElement.style.overflow = ''; document.body.style.overflow = ''; };
  
      function renderServiceList(sourcePanel) {
        const items = [];
        const ul = sourcePanel.querySelector('ul');
        if (ul) {
          ul.querySelectorAll('li').forEach(li => { const t = li.textContent.trim(); if (t) items.push(t); });
        } else {
          sourcePanel.innerText.split('\n').map(s => s.trim()).filter(Boolean).forEach(l => items.push(l));
        }
  
        const html = items.map((label, idx) => {
          const enc = encodeURIComponent(label);
          return `
            <div class="fp-service-item" style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid rgba(0,0,0,.06)">
              <div class="fp-service-label">${label}</div>
              <div>
                <button class="btn btn-outline-dark fp-select-btn" data-service-label="${enc}">Select</button>
                <button class="btn btn-primary ms-2 fp-book-btn" data-service-label="${enc}">Book</button>
              </div>
            </div>`;
        }).join('');
  
        FP.bodyEl.innerHTML = `<p style="margin:.4rem 0 .8rem;color:#444">Choose a service below to book:</p><div class="fp-service-list">${html}</div>`;
      }
  
      function renderBookingForm(serviceEncoded) {
        const serviceText = serviceEncoded ? decodeURIComponent(serviceEncoded) : '';
        if (FP.titleEl) FP.titleEl.textContent = serviceText || 'Book Service';
  
        FP.bodyEl.innerHTML = `
          <form id="fpBookingForm" class="fp-booking-form">
            <div class="mb-2"><label class="form-label">Full name</label><input id="fp_name" class="form-control" type="text" required></div>
            <div class="mb-2"><label class="form-label">Email (optional)</label><input id="fp_email" class="form-control" type="email"></div>
            <div class="mb-2"><label class="form-label">Phone</label><input id="fp_phone" class="form-control" type="tel" required></div>
            <div class="mb-2"><label class="form-label">Date</label><input id="fp_date" class="form-control" type="date" required></div>
            <div class="mb-2"><label class="form-label">Time</label><input id="fp_time" class="form-control" type="time" required></div>
            <div class="d-flex gap-2 mt-2">
              <button type="submit" class="btn btn-success">Confirm Booking</button>
              <button type="button" class="btn btn-outline-secondary" id="fp_cancel">Cancel</button>
            </div>
          </form>`;
  
        const form = FP.panel.querySelector('#fpBookingForm');
        const cancel = FP.panel.querySelector('#fp_cancel');
        if (cancel) cancel.addEventListener('click', () => renderServiceList(FP.sourcePanel));
  
        form.addEventListener('submit', (ev) => {
          ev.preventDefault();
  
          // Collect values from FP form
          const name = (FP.panel.querySelector('#fp_name') || {}).value?.trim() || '';
          const email = (FP.panel.querySelector('#fp_email') || {}).value?.trim() || '';
          const phone = (FP.panel.querySelector('#fp_phone') || {}).value?.trim() || '';
          const date = (FP.panel.querySelector('#fp_date') || {}).value || '';
          const time = (FP.panel.querySelector('#fp_time') || {}).value || '';
          const serviceText = serviceText || '';
  
          // Map values into main booking form
          const nameBooking = document.querySelector('#nameBooking');
          const emailBooking = document.querySelector('#emailBooking');
          const phoneBooking = document.querySelector('#phoneBooking');
          const serviceSelect = document.querySelector('#serviceSelect');
          const dateEl = document.querySelector('#date');
          const timeEl = document.querySelector('#time');
  
          if (nameBooking) nameBooking.value = name;
          if (emailBooking) emailBooking.value = email;
          if (phoneBooking) phoneBooking.value = phone;
          if (dateEl) dateEl.value = date;
          if (timeEl) timeEl.value = time;
  
          if (serviceSelect) {
            const opts = Array.from(serviceSelect.options);
            const match = opts.find(o => o.text.toLowerCase().includes(serviceText.toLowerCase()));
            if (match) serviceSelect.value = match.value;
            else {
              const tmp = document.createElement('option');
              tmp.value = serviceText;
              tmp.text = serviceText;
              tmp.selected = true;
              serviceSelect.appendChild(tmp);
              serviceSelect.value = serviceText;
            }
          }
  
          //  booking form and auto-submit it
          const mainForm = nameBooking ? nameBooking.closest('form') : (document.querySelector('form[action="/submit-form"]') || document.querySelector('form'));
          closeFullPanel();
          showSuccessPopup(serviceText);
  
          setTimeout(() => {
            if (mainForm) {
              try { mainForm.submit(); }
              catch (err) { console.error('Auto-submit failed', err); }
            }
          }, 1400);
        });
      }
  
      function openFullPanelFrom(sourcePanel, sourceButton) {
        FP.lastFocused = document.activeElement;
        FP.sourcePanel = sourcePanel;
  
        let title = '';
        const nearestCard = sourceButton && sourceButton.closest('.card');
        if (nearestCard) {
          const t = nearestCard.querySelector('.card-title, h5, h4');
          if (t) title = t.textContent.trim();
        }
        if (!title) {
          const alt = sourcePanel.querySelector('h5, h4, h3');
          if (alt) title = alt.textContent.trim();
        }
        if (FP.titleEl) FP.titleEl.textContent = title || 'Services';
  
        renderServiceList(sourcePanel);
        FP.panel.classList.add('open');
        FP.panel.setAttribute('aria-hidden', 'false');
        lockScroll();
  
        setTimeout(() => {
          const first = FP.panel.querySelector('button, a, input, textarea, select');
          if (first) first.focus();
        }, 60);
  
        FP.bodyEl.addEventListener('click', fpBodyClick);
      }
  
      function fpBodyClick(e) {
        const book = e.target.closest('.fp-book-btn');
        const select = e.target.closest('.fp-select-btn');
        if (book) {
          const enc = book.dataset.serviceLabel || '';
          renderBookingForm(enc);
          return;
        }
        if (select) {
          const enc = select.dataset.serviceLabel || '';
          const label = decodeURIComponent(enc);
          const serviceSelect = document.querySelector('#serviceSelect');
          if (serviceSelect) {
            const opts = Array.from(serviceSelect.options);
            const match = opts.find(o => o.text.toLowerCase().includes(label.toLowerCase()));
            if (match) serviceSelect.value = match.value;
            else {
              const tmp = document.createElement('option');
              tmp.value = label; tmp.text = label; tmp.selected = true; serviceSelect.appendChild(tmp); serviceSelect.value = label;
            }
          }
          showTransientMessage(`Selected "${label}" — continue to book`);
        }
      }
  
      function closeFullPanel() {
        FP.panel.classList.remove('open');
        FP.panel.setAttribute('aria-hidden', 'true');
        unlockScroll();
        if (FP.lastFocused && typeof FP.lastFocused.focus === 'function') FP.lastFocused.focus();
        FP.bodyEl.removeEventListener('click', fpBodyClick);
        FP.sourcePanel = null;
      }
  
      // close triggers
      FP.closeButtons.forEach(b => b.addEventListener('click', closeFullPanel));
      const backdrop = FP.panel.querySelector('.fullpanel-backdrop');
      if (backdrop) backdrop.addEventListener('click', closeFullPanel);
  
      FP.panel.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') return closeFullPanel();
        if (e.key === 'Tab') {
          const focusables = Array.from(FP.panel.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'));
          if (!focusables.length) { e.preventDefault(); return; }
          const first = focusables[0], last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }, true);
    } // end FP.panel check
  
    // helper UI
    function showTransientMessage(text, ms = 1500) {
      const msg = document.createElement('div');
      msg.textContent = text;
      Object.assign(msg.style, { position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,.75)', color: '#fff', padding: '.45rem .8rem', borderRadius: '6px', zIndex: 9999 });
      if (FP.panel) FP.panel.appendChild(msg); else document.body.appendChild(msg);
      setTimeout(() => msg.remove(), ms);
    }
  
    function showSuccessPopup(serviceText = '') {
      const popup = document.createElement('div');
      popup.className = 'success-popup';
      popup.innerHTML = `<div class="popup-box"><h3>🎉 Booking Successful</h3><p>${serviceText ? serviceText + ' booked.' : 'Thank you — we will contact you soon.'}</p></div>`;
      document.body.appendChild(popup);
      setTimeout(() => popup.classList.add('show'), 50);
      setTimeout(() => { popup.classList.remove('show'); setTimeout(() => popup.remove(), 400); }, 2800);
    }
  
    // wire data-full toggle buttons (if not using toggleButtons loop)
    document.querySelectorAll('.toggle-btn[data-full="true"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sel = btn.dataset.target || btn.dataset.bsTarget || btn.getAttribute('aria-controls');
        if (!sel) return;
        const sp = document.querySelector(sel);
        if (!sp) return;
        if (!FP.panel) { console.warn('Add #full-info-panel to your HTML to enable full-screen bookings.'); return; }
        openFullPanelFrom(sp, btn);
      });
    });
  
  });