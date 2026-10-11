/* اطراف: فیلتر/مرتب‌سازی کارت‌های ثابت + نقشه (بهبود تدریجی؛ محتوا بدون JS هم در HTML هست) */
(() => {
    const $ = (s) => document.querySelector(s);
    const toFa = (n) => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
    const grid = $("#plGrid");
    const items = grid ? [...grid.children] : [];
    const state = { filter: "all", sort: "default" };

    const apply = () => {
        if (!grid) return;
        let shown = 0;
        items.forEach(li => {
            const ok = state.filter === "all" || li.dataset.cat === state.filter;
            li.hidden = !ok; if (ok) shown++;
        });
        const order = state.sort === "near"
            ? [...items].sort((a, b) => a.dataset.km - b.dataset.km) : items;
        order.forEach(li => grid.appendChild(li));
        $("#plCount").textContent = `${toFa(shown)} مقصد`;
        syncPins();
    };
    if (grid) $("#plChips").addEventListener("click", (e) => {
        const b = e.target.closest(".pl-chip"); if (!b) return;
        state.filter = b.dataset.cat;
        document.querySelectorAll(".pl-chip").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        apply();
    });
    if (grid) $(".pl-seg").addEventListener("click", (e) => {
        const b = e.target.closest("button[data-sort]"); if (!b) return;
        state.sort = b.dataset.sort;
        document.querySelectorAll(".pl-seg button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        apply();
    });

    /* ---- map: نقشه‌ی تصویری SVG (آفلاین، بدون هیچ سرویس خارجی) ---- */
    const PLACES = window.PLACES || [], HOME = window.HOME;
    const el = $("#aroundMap"), NS = "http://www.w3.org/2000/svg";
    const COS = Math.cos(HOME.lat * Math.PI / 180), KM = 111.32;
    const P = (lat, lng) => [(lng - HOME.lng) * COS * KM, (HOME.lat - lat) * KM];   // کیلومتر؛ مبدأ = سرای ستاره
    let pinEls = {}, openPin = null;
    const rnd = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    function syncPins() {
        PLACES.forEach(p => {
            const li = items.find(x => x.querySelector("a").getAttribute("href") === p.file);
            const b = pinEls[p.id], show = grid ? (li && !li.hidden) : true;
            if (b) { b.hidden = !show; const r = el.querySelector(`[data-route="${p.id}"]`); if (r) r.style.opacity = show ? "" : "0"; }
        });
        if (openPin && openPin.hidden) closePop();
    }
    function closePop() { if (openPin) { openPin.classList.remove("is-open"); openPin.setAttribute("aria-expanded", "false"); openPin = null; } }

    function draw() {
        const W = el.clientWidth, H = el.clientHeight;
        if (!W || !H) return;
        /* محدوده‌ی نمایش: همه‌ی مقصدها + حاشیه، هم‌نسبت با کادر */
        const pts = [[0, 0], ...PLACES.map(p => P(p.lat, p.lng))];
        let x0 = Math.min(...pts.map(a => a[0])) - 11, x1 = Math.max(...pts.map(a => a[0])) + 11;
        let y0 = Math.min(...pts.map(a => a[1])) - 10, y1 = Math.max(...pts.map(a => a[1])) + 12;
        let w = x1 - x0, h = y1 - y0; const ar = W / H;
        if (w / h < ar) { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / ar; y0 -= (nh - h) / 2; h = nh; }
        const u = w / W;                                   // کیلومتر در هر پیکسل
        const X = x => ((x - x0) / w) * 100, Y = y => ((y - y0) / h) * 100;
        const R = rnd(7), c = (x, y) => `${x.toFixed(2)} ${y.toFixed(2)}`;
        let g = "";
        /* نقشه‌ی سبک جی‌پی‌اس: زمینه‌ی روشن + خیابان‌های کم‌رنگ + مسیر رنگی تا هر مقصد */
        g += `<defs><linearGradient id="mpBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9f8df"/><stop offset=".55" stop-color="#e3f4ee"/><stop offset="1" stop-color="#e1effc"/></linearGradient>
            <pattern id="mpSt" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M9 0H0V9" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="${(u * 2.2).toFixed(3)}"/></pattern>
            <pattern id="mpSt2" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="#fff" stroke-width="${(u * 4.5).toFixed(3)}"/></pattern></defs>`;
        g += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#mpBg)"/><rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#mpSt)"/><rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#mpSt2)"/>`;

        /* حلقه‌های خط‌چین: فاصله‌ی تقریبی ۲۰ و ۴۰ و ۶۰ کیلومتر */
        [20, 40, 60].forEach(km => {
            g += `<circle cx="0" cy="0" r="${km}" fill="none" stroke="#1f6f8b" stroke-opacity=".55" stroke-width="${(u * 1.8).toFixed(3)}" stroke-dasharray="${(u * 8).toFixed(2)} ${(u * 7).toFixed(2)}" stroke-linecap="round"/>`;
            for (const a of [-62, -118, -38, 62, 118, 140, -140, -90, 90, 0, 180, -22, 22, 158, -158]) {
                const px = km * Math.cos(a * Math.PI / 180), py = km * Math.sin(a * Math.PI / 180);
                if (px > x0 + 48 * u && px < x1 - 48 * u && py > y0 + 6 && py < y1 - 6) {
                    g += `<text x="${px.toFixed(2)}" y="${py.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="${(u * 11).toFixed(2)}" font-weight="800" fill="#1f6f8b" paint-order="stroke" stroke="#fff" stroke-width="${(u * 4.5).toFixed(2)}" font-family="Vazirmatn,sans-serif">${toFa(km)} کیلومتر</text>`;
                    break;
                }
            }
        });
        g += `<circle cx="0" cy="0" r="${(u * 26).toFixed(2)}" fill="#f0b429" fill-opacity=".22"/><circle cx="0" cy="0" r="${(u * 16).toFixed(2)}" fill="#f0b429" fill-opacity=".25"/>`;

        el.innerHTML = `<svg viewBox="${x0.toFixed(2)} ${y0.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" focusable="false">${g}</svg>`;

        /* نشانگرها (دکمه‌های واقعی؛ با کیبورد هم کار می‌کنند) */
        const mk = (cls, style, icon, label, html) => {
            const b = document.createElement("button");
            b.type = "button"; b.className = cls; b.setAttribute("style", style);
            b.setAttribute("aria-label", label); b.setAttribute("aria-expanded", "false");
            b.innerHTML = `<span class="pl-pin${cls.includes("home") ? " pl-pin--home" : ""}" ${style.includes("--c") ? `style="${style.match(/--c:[^;]+/)[0]}"` : ""}><i class="bi ${icon}"></i></span><span class="mp-name">${label}</span><span class="mp-pop" role="dialog">${html}</span>`;
            b.addEventListener("click", e => { e.stopPropagation(); const was = openPin === b; closePop(); if (!was) { b.classList.add("is-open"); b.setAttribute("aria-expanded", "true"); openPin = b; } });
            el.appendChild(b); return b;
        };
        pinEls = {};
        const pos = (x, y) => `left:${X(x).toFixed(2)}%;top:${Y(y).toFixed(2)}%;` + (X(x) < 22 ? "--sx:0%;" : X(x) > 78 ? "--sx:-100%;" : "") + (Y(y) < 38 ? "--below:1;" : "");
        mk("mp-pin mp-home", pos(0, 0), "bi-star-fill", "بوم‌گردی سرای ستاره", "<strong>بوم‌گردی سرای ستاره</strong><span>محل اقامت شما</span>");
        PLACES.forEach(p => { const [px, py] = P(p.lat, p.lng); pinEls[p.id] = mk("mp-pin", pos(px, py) + `--c:${p.c};`, p.icon, p.name, `<strong>${p.name}</strong><span>${p.dist} تا سرای ستاره</span><a href="${p.file}">مشاهده راهنما</a>`); });
        el.querySelectorAll(".mp-pin").forEach(b => { if (b.style.getPropertyValue("--below")) b.classList.add("pop-below"); if (b.style.getPropertyValue("--sx")) b.style.setProperty("--sx", b.style.getPropertyValue("--sx")); });
        syncPins();
    }
    const init = () => {
        if (!el) return;
        const rs = $("#plReset"); if (rs) rs.hidden = true;
        document.addEventListener("click", closePop);
        document.addEventListener("keydown", e => { if (e.key === "Escape") closePop(); });
        draw();
        let t; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(draw, 120); }).observe(el);
    };
    window.addEventListener("load", init);
})();
