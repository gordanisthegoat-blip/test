/* =====================================================
   Restaurant page — menu tabs, "now serving" marker, dish photos
===================================================== */
(function () {
    'use strict';
    document.body.classList.add('rs-ready');
    const faNum = n => Number(n).toLocaleString('fa-IR');

    /* ---------- header-aware offset for the sticky tabs ---------- */
    const header = document.querySelector('.site-header');
    const setTop = () => {
        const b = header ? header.getBoundingClientRect().bottom : 100;
        document.documentElement.style.setProperty('--rs-top', Math.round(b + 6) + 'px');
    };
    setTop();
    window.addEventListener('resize', setTop);
    window.addEventListener('scroll', setTop, { passive: true });

    /* ---------- "الان" on the meal that is being served ---------- */
    const hourNow = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
    const h = hourNow();
    document.querySelectorAll('.rs-meal').forEach(m => {
        const from = parseFloat(m.dataset.from), to = parseFloat(m.dataset.to);
        if (h >= from && h < to) m.classList.add('is-now');
    });

    /* ---------- tabs ---------- */
    const menu = document.getElementById('menu');
    const wrap = document.getElementById('rsTabsWrap');
    const tabs = Array.from(document.querySelectorAll('.rs-tab'));
    const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
    if (menu && wrap && tabs.length) {
        menu.classList.add('is-live', 'is-tabs');
        wrap.hidden = false;

        const select = (i, focus, scroll) => {
            tabs.forEach((t, k) => {
                const on = k === i;
                t.setAttribute('aria-selected', on ? 'true' : 'false');
                t.tabIndex = on ? 0 : -1;
                panels[k].hidden = !on;
            });
            if (focus) tabs[i].focus();
            if (scroll) {
                const top = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--rs-top')) || 110;
                const p = panels[i].getBoundingClientRect().top;
                const limit = top + wrap.offsetHeight + 12;
                if (p < limit) window.scrollTo({ top: window.scrollY + p - limit, behavior: 'smooth' });
            }
        };
        tabs.forEach((t, i) => {
            t.addEventListener('click', () => select(i, false, true));
            t.addEventListener('keydown', e => {
                /* RTL: the first tab is on the right, so ArrowLeft goes forward */
                let n = null;
                if (e.key === 'ArrowLeft') n = (i + 1) % tabs.length;
                else if (e.key === 'ArrowRight') n = (i - 1 + tabs.length) % tabs.length;
                else if (e.key === 'Home') n = 0;
                else if (e.key === 'End') n = tabs.length - 1;
                if (n !== null) { e.preventDefault(); select(n, true, false); }
            });
        });
        /* open on what is being served right now */
        select(h >= 11 && h < 15 ? 1 : h >= 15 && h < 18 ? 2 : h < 11 ? 0 : 1, false, false);
    } else if (menu) {
        menu.classList.add('is-live');
    }

    /* ---------- dish photos: expand under the row ---------- */
    document.querySelectorAll('.rs-photo-btn').forEach(b => {
        const box = document.getElementById(b.getAttribute('aria-controls'));
        const lbl = b.querySelector('span');
        b.addEventListener('click', () => {
            const on = b.getAttribute('aria-expanded') !== 'true';
            b.setAttribute('aria-expanded', on ? 'true' : 'false');
            box.classList.toggle('is-open', on);
            lbl.textContent = on ? 'بستن عکس' : 'دیدن عکس';
        });
    });
})();
