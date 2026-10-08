/* --- SHAMSI (JALALI) DATE — no external library --- */
function gregorianToJalali(gy, gm, gd) {
    // Standard algorithm (jalaali-js style), no dependencies.
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    gy -= gy <= 1600 ? 621 : 1600;
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
        Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        jy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return [jy, jm, jd];
}

function renderShamsiDate() {
    const el = document.getElementById("shamsiDate");
    if (!el) return;

    const now = new Date();
    const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const monthNames = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];
    const weekdayNames = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
    const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    const toFa = (n) => String(n).split("").map(c => faDigits[c] || c).join("");

    const weekday = weekdayNames[now.getDay()];
    el.textContent = `${weekday} ${toFa(jd)} ${monthNames[jm - 1]} ${toFa(jy)}`;
}

/* --- shared helpers --- */
const WHATSAPP_NUMBER = "989161234567"; // TODO: replace with the real number
const FA_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const toFaDigits = (n) => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
function parseISO(v) { const [y, m, d] = v.split("-").map(Number); return new Date(y, m - 1, d); }
function isoDate(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function shamsiLabel(d) {
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${toFaDigits(jd)} ${FA_MONTHS[jm - 1]} ${toFaDigits(jy)}`;
}


/* --- Shamsi day/month picker: two small boxes (ماه ، روز), limited to one month ahead --- */
const BOOK_WINDOW_DAYS = 30;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
function createDatePicker(root, hidden) {
    const label = root.dataset.label || "";
    const mk = (cls, ph) => {
        const s = document.createElement("select");
        s.className = cls;
        s.setAttribute("aria-label", `${ph} ${label}`.trim());
        s.innerHTML = `<option value="">${ph}</option>`;
        return s;
    };
    const monthSel = mk("dp-month", "ماه"), daySel = mk("dp-day", "روز");
    daySel.disabled = true;
    root.append(monthSel, daySel);
    let list = [];

    const fillDays = (key, keepIso) => {
        daySel.innerHTML = '<option value="">روز</option>';
        list.filter(x => x.key === key).forEach(x => {
            const o = document.createElement("option");
            o.value = x.iso; o.textContent = toFaDigits(x.jd);
            daySel.appendChild(o);
        });
        daySel.disabled = !key;
        if (keepIso && Array.from(daySel.options).some(o => o.value === keepIso)) daySel.value = keepIso;
    };
    const commit = () => {
        const v = daySel.value;
        if (hidden.value !== v) { hidden.value = v; hidden.dispatchEvent(new Event("change", { bubbles: true })); }
    };
    monthSel.addEventListener("change", () => { fillDays(monthSel.value, ""); commit(); });
    daySel.addEventListener("change", commit);

    return {
        setRange(min, max) {
            list = [];
            for (let d = new Date(min); d <= max; d = addDays(d, 1)) {
                const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
                list.push({ iso: isoDate(d), jd, jm, key: `${jy}-${jm}` });
            }
            const prev = hidden.value;
            monthSel.innerHTML = '<option value="">ماه</option>';
            new Map(list.map(x => [x.key, x.jm])).forEach((jm, key) => {
                const o = document.createElement("option");
                o.value = key; o.textContent = FA_MONTHS[jm - 1];
                monthSel.appendChild(o);
            });
            const cur = list.find(x => x.iso === prev);
            if (cur) { monthSel.value = cur.key; fillDays(cur.key, prev); }
            else { fillDays("", ""); hidden.value = ""; }
        },
        setValue(date) {
            const iso = isoDate(date), x = list.find(i => i.iso === iso);
            if (!x) return;
            monthSel.value = x.key; fillDays(x.key, iso); commit();
        }
    };
}

document.addEventListener("DOMContentLoaded", () => {

    renderShamsiDate();

    /* --- MOBILE MENU --- */
    const toggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (toggle && navLinks) {
        toggle.addEventListener("click", () => {
            const open = navLinks.classList.toggle("open");
            toggle.classList.toggle("open", open);
            toggle.setAttribute("aria-expanded", String(open));
            document.body.classList.toggle("nav-open", open);
        });
        navLinks.querySelectorAll("a").forEach(a => {
            a.addEventListener("click", () => {
                navLinks.classList.remove("open");
                toggle.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
                document.body.classList.remove("nav-open");
            });
        });
    }

    /* --- HEADER ON SCROLL --- */
    const header = document.querySelector(".site-header");
    const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* --- SMOOTH SCROLL --- */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener("click", e => {
            const id = a.getAttribute("href");
            if (!id || id === "#") return;
            const el = document.querySelector(id);
            if (!el) return;
            e.preventDefault();
            const h = header ? header.offsetHeight : 0;
            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - h, behavior: "smooth" });
        });
    });

    /* --- SCROLL REVEAL --- */
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -32px 0px" });
        revealEls.forEach(el => io.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add("visible"));
    }

    /* --- ESC KEY --- */
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            navLinks && navLinks.classList.remove("open");
            toggle && toggle.classList.remove("open");
            toggle && toggle.setAttribute("aria-expanded", "false");
            document.body.classList.remove("nav-open");
        }
    });

    /* --- TESTIMONIAL SLIDER --- */
    const track = document.querySelector(".ttrack");
    if (track) {
        const slides = Array.from(track.children);
        const dotsBox = document.getElementById("tDots");
        let current = 0;
        const go = (i) => {
            current = (i + slides.length) % slides.length;
            slides[current].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        };
        const dots = slides.map((_, i) => {
            const d = document.createElement("button");
            d.type = "button"; d.className = "tdot";
            d.setAttribute("aria-label", `نظر ${toFaDigits(i + 1)}`);
            d.addEventListener("click", () => go(i));
            dotsBox.appendChild(d);
            return d;
        });
        const mark = (i) => { current = i; dots.forEach((d, k) => d.classList.toggle("active", k === i)); };
        mark(0);
        if ("IntersectionObserver" in window) {
            const so = new IntersectionObserver(entries => {
                entries.forEach(en => { if (en.isIntersecting) mark(slides.indexOf(en.target)); });
            }, { root: track, threshold: 0.6 });
            slides.forEach(sl => so.observe(sl));
        }
        // RTL: "next" is the right-hand button; both just move through the list
        document.getElementById("tNext").addEventListener("click", () => go(current + 1));
        document.getElementById("tPrev").addEventListener("click", () => go(current - 1));
    }

    /* --- BOOKING PAGE FORM --- */
    const bf = document.getElementById("booking-form");
    if (bf) {
        const $ = (id) => document.getElementById(id);
        const nameEl = $("bkName"), inEl = $("bkIn"), outEl = $("bkOut"), roomEl = $("bkRoom");
        const guestsEl = $("bkGuests"), unitsEl = $("bkUnits"), foodEl = $("bkFood"), noteEl = $("bkNote");
        const estEl = $("bkEst"), msgEl = $("bkMsg");
        const today = new Date(); today.setHours(0, 0, 0, 0);
        inEl.min = isoDate(today);
        outEl.min = isoDate(new Date(today.getTime() + 864e5));

        const fmt = (n) => toFaDigits(n.toLocaleString("en-US").replace(/,/g, "٬"));
        const roomOpt = () => roomEl.selectedOptions[0];
        const roomName = () => roomOpt().textContent.split("—")[0].trim();
        const maxGuests = () => Number(roomOpt().dataset.cap) * Number(unitsEl.value);

        const fillGuests = () => {
            const keep = Number(guestsEl.value) || 2;
            const max = maxGuests();
            guestsEl.innerHTML = "";
            for (let i = 1; i <= max; i++) {
                const o = document.createElement("option");
                o.value = i; o.textContent = `${toFaDigits(i)} نفر`;
                guestsEl.appendChild(o);
            }
            guestsEl.value = Math.min(keep, max);
        };

        const nights = () => {
            if (!inEl.value || !outEl.value) return 0;
            return Math.round((parseISO(outEl.value) - parseISO(inEl.value)) / 864e5);
        };

        const say = (t, err) => { msgEl.textContent = t; msgEl.classList.toggle("error", !!err); };

        const updateEst = () => {
            const n = nights();
            if (n <= 0) {
                estEl.innerHTML = inEl.value && outEl.value
                    ? "تاریخ خروج باید بعد از تاریخ ورود باشد."
                    : "تاریخ ورود و خروج را انتخاب کنید تا تخمین هزینه نمایش داده شود.";
                estEl.classList.remove("ready");
                return;
            }
            const price = Number(roomOpt().dataset.price), units = Number(unitsEl.value);
            const total = n * units * price;
            estEl.classList.add("ready");
            estEl.innerHTML =
                `<span class="bk-est-calc">${toFaDigits(n)} شب × ${toFaDigits(units)} واحد × ${fmt(price)}</span>` +
                `<strong>${fmt(total)} <small>تومان (تخمینی)</small></strong>`;
        };

        const maxDate = addDays(today, BOOK_WINDOW_DAYS + 1);
        const inPick = createDatePicker(document.querySelector('[data-pick="bkIn"]'), inEl);
        const outPick = createDatePicker(document.querySelector('[data-pick="bkOut"]'), outEl);
        inPick.setRange(today, addDays(today, BOOK_WINDOW_DAYS));
        outPick.setRange(addDays(today, 1), maxDate);
        const hintEl = $("bkDateHint");
        if (hintEl) hintEl.textContent = `رزرو فقط تا یک ماه آینده (تا ${shamsiLabel(addDays(today, BOOK_WINDOW_DAYS))}) امکان‌پذیر است.`;

        inEl.addEventListener("change", () => {
            if (inEl.value) {
                const next = addDays(parseISO(inEl.value), 1);
                outPick.setRange(next, maxDate);
                if (!outEl.value) outPick.setValue(next);
            }
            updateEst();
        });
        outEl.addEventListener("change", updateEst);
        roomEl.addEventListener("change", () => { fillGuests(); updateEst(); });
        unitsEl.addEventListener("change", () => { fillGuests(); updateEst(); });

        // pre-select room from ?room=suite|room20|room9
        const wanted = new URLSearchParams(location.search).get("room");
        if (wanted && Array.from(roomEl.options).some(o => o.value === wanted)) roomEl.value = wanted;
        fillGuests();
        guestsEl.value = Math.min(2, maxGuests());
        updateEst();


        /* --- MOBILE: multi-step booking form --- */
        (() => {
            const mq = window.matchMedia("(max-width: 700px)");
            const steps = Array.from(bf.querySelectorAll(".bk-step"));
            const prog = Array.from(document.querySelectorAll("#bkProgress span"));
            const prevB = $("bkPrev"), nextB = $("bkNext"), sMsg = $("bkStepMsg");
            if (!steps.length || !prevB || !nextB) return;
            let cur = 1;
            const sayStep = (t) => { sMsg.textContent = t || ""; };
            const show = (n, scroll) => {
                cur = n;
                bf.classList.toggle("steps-on", mq.matches);
                steps.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === cur));
                prog.forEach((p, i) => { p.classList.toggle("on", i + 1 === cur); p.classList.toggle("done", i + 1 < cur); });
                bf.dataset.step = cur;
                prevB.hidden = cur === 1;
                nextB.hidden = cur === 3;
                sayStep("");
                if (scroll && mq.matches) bf.scrollIntoView({ behavior: "smooth", block: "start" });
            };
            const validStep1 = () => {
                if (!inEl.value || !outEl.value) return "لطفاً تاریخ ورود و خروج را انتخاب کنید.";
                if (parseISO(inEl.value) < today) return "تاریخ ورود نمی‌تواند در گذشته باشد.";
                if (nights() <= 0) return "تاریخ خروج باید بعد از تاریخ ورود باشد.";
                return "";
            };
            const next = () => {
                if (cur === 1) { const err = validStep1(); if (err) return sayStep(err); }
                if (cur < 3) show(cur + 1, true);
            };
            nextB.addEventListener("click", next);
            prevB.addEventListener("click", () => cur > 1 && show(cur - 1, true));
            // Enter key / submit on steps 1-2 goes to next step instead of sending
            bf.addEventListener("submit", e => {
                if (mq.matches && cur < 3) { e.preventDefault(); e.stopImmediatePropagation(); next(); }
            });
            const sync = () => show(mq.matches ? cur : 1, false);
            (mq.addEventListener ? mq.addEventListener("change", sync) : mq.addListener(sync));
            show(1, false);
        })();

        bf.addEventListener("submit", e => {
            e.preventDefault();
            if (!inEl.value || !outEl.value) return say("لطفاً تاریخ ورود و خروج را انتخاب کنید.", true);
            if (parseISO(inEl.value) < today) return say("تاریخ ورود نمی‌تواند در گذشته باشد.", true);
            const n = nights();
            if (n <= 0) return say("تاریخ خروج باید بعد از تاریخ ورود باشد.", true);

            const units = Number(unitsEl.value), price = Number(roomOpt().dataset.price);
            const lines = [
                "سلام، می‌خواهم در سرای ستاره رزرو کنم.",
                nameEl.value.trim() ? `نام: ${nameEl.value.trim()}` : null,
                `ورود: ${shamsiLabel(parseISO(inEl.value))}`,
                `خروج: ${shamsiLabel(parseISO(outEl.value))} (${toFaDigits(n)} شب)`,
                `اقامتگاه: ${roomName()} — ${toFaDigits(units)} واحد`,
                `تعداد مهمان: ${toFaDigits(guestsEl.value)} نفر`,
                foodEl.checked ? "غذای محلی: بله، می‌خواهم" : null,
                noteEl.value.trim() ? `توضیحات: ${noteEl.value.trim()}` : null,
                `هزینهٔ تخمینی: ${fmt(n * units * price)} تومان`,
                "لطفاً موجودی و مبلغ نهایی را اعلام کنید."
            ].filter(Boolean);
            say("در حال باز کردن واتساپ… اگر باز نشد از دکمهٔ «گفتگو در واتساپ» پایین صفحه استفاده کنید.", false);
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
        });
    }

    /* --- GALLERY LIGHTBOX --- */
    const items = document.querySelectorAll("[data-lightbox]");
    if (items.length && typeof HTMLDialogElement !== "undefined") {
        const dlg = document.createElement("dialog");
        dlg.className = "lightbox";
        dlg.setAttribute("aria-label", "نمایش بزرگ تصویر");
        dlg.innerHTML = '<button class="lightbox-close" type="button" aria-label="بستن">&times;</button><img alt=""><p class="lightbox-cap"></p>';
        document.body.appendChild(dlg);
        const big = dlg.querySelector("img");
        const cap = dlg.querySelector(".lightbox-cap");
        const open = (fig) => {
            const img = fig.querySelector("img");
            if (!img) return;
            big.src = img.currentSrc || img.src;
            big.alt = img.alt;
            cap.textContent = img.alt;
            dlg.showModal();
        };
        items.forEach(fig => {
            fig.tabIndex = 0;
            fig.setAttribute("role", "button");
            fig.addEventListener("click", () => open(fig));
            fig.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(fig); }
            });
        });
        dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
        dlg.querySelector(".lightbox-close").addEventListener("click", () => dlg.close());
    }

    /* --- LEAFLET MAP --- */
    const mapEl = document.getElementById("map");

    if (mapEl && typeof L === "undefined") {
        // Leaflet failed to load (CDN blocked/offline) — keep the fallback message visible.
        console.warn("Leaflet did not load; showing static fallback in #map.");
    }

    if (mapEl && typeof L !== "undefined") {

        // remove the static fallback markup now that Leaflet will render its own panes
        const fallback = document.getElementById("mapFallback");
        if (fallback) fallback.remove();

        const places = {
            home: { name: "بوم‌گردی سرای ستاره", lat: 33.383, lng: 49.117 },
            rosestan: {
                name: "دشت لاله‌های واژگون رزستان", distance: "۷٫۶ کیلومتر",
                icon: "bi-flower1",
                description: "یکی از کمیاب‌ترین و دیدنی‌ترین دشت‌های گل ایران؛ در فصل بهار سطح دشت رنگ ارغوانی به خود می‌گیرد و مقصدی محبوب برای عکاسان طبیعت و علاقه‌مندان به گردش‌های بهاری است.",
                lat: 33.425, lng: 49.05
            },
            gahar: {
                name: "دریاچه گهر", distance: "۲۴٫۹ کیلومتر",
                icon: "bi-water",
                description: "دریاچه‌ای کوهستانی و بکر در دل اشترانکوه با آبی زلال و فیروزه‌ای؛ مسیر پیاده‌روی تا دریاچه از میان چشم‌اندازهای کوهستانی می‌گذرد.",
                lat: 33.3075, lng: 49.2817
            },
            garmeh: {
                name: "آبشار گرمه", distance: "۳۳٫۵ کیلومتر",
                icon: "bi-droplet-fill",
                description: "آبشاری خروشان در دل جنگل‌های بلوط لرستان که در فصل بهار به اوج زیبایی می‌رسد. صدای آب و هوای مطبوع آن را به مکانی عالی برای پیک‌نیک تبدیل کرده است.",
                lat: 33.29, lng: 48.98
            },
            qarun: {
                name: "کوه قارون", distance: "۳۶٫۷ کیلومتر",
                icon: "bi-triangle-fill",
                description: "قله‌ای مرتفع با مسیرهای کوهنوردی متنوع؛ از دامنه‌های آن چشم‌اندازی گسترده از دشت‌ها و روستاهای اطراف دورود دیده می‌شود.",
                lat: 33.22, lng: 49.2
            },
            sefidkooh: {
                name: "سفیدکوه کوچک", distance: "۵۱٫۶ کیلومتر",
                icon: "bi-snow2",
                description: "یکی از قله‌های شناخته‌شده لرستان که بخشی از سال پوشیده از برف است و مقصدی برای کوهنوردان حرفه‌ای به‌شمار می‌رود.",
                lat: 33.5, lng: 48.78
            },
            aligoodarz: {
                name: "الیگودرز", distance: "۷۷٫۹ کیلومتر",
                icon: "bi-signpost-split-fill",
                description: "شهری سرسبز در غرب استان لرستان با باغ‌های میوه فراوان و هوای خنک کوهستانی؛ مناسب برای گشت‌وگذار در بازار محلی.",
                lat: 33.4, lng: 49.69
            }
        };

        const map = L.map("map", { scrollWheelZoom: false, zoomControl: true })
            .setView([places.home.lat, places.home.lng], 11);

        // CARTO's free "voyager" basemap now requires an API key, so tiles were
        // showing "API KEY REQUIRED" watermarks. Using OSM's own standard tile
        // server instead — free, no key, no account needed for this traffic level.
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19
        }).addTo(map);

        // Leaflet measures the container on init; if #map was hidden/zero-height
        // at that moment (e.g. inside a layout that hadn't settled yet), tiles
        // render at the wrong size. Re-measure after layout settles and again
        // on window resize.
        requestAnimationFrame(() => map.invalidateSize());
        window.addEventListener("resize", () => map.invalidateSize());

        const homeIcon = L.divIcon({
            className: "custom-marker",
            html: '<div class="map-marker home-m"></div>',
            iconSize: [26, 26], iconAnchor: [13, 13]
        });
        const placeIcon = L.divIcon({
            className: "custom-marker",
            html: '<div class="map-marker place-m"></div>',
            iconSize: [18, 18], iconAnchor: [9, 9]
        });

        L.marker([places.home.lat, places.home.lng], { icon: homeIcon })
            .addTo(map)
            .bindPopup(`<div class="map-popup"><strong>${places.home.name}</strong><span>محل اقامت</span></div>`);

        const markers = {};
        Object.entries(places).forEach(([key, p]) => {
            if (key === "home") return;
            markers[key] = L.marker([p.lat, p.lng], { icon: placeIcon })
                .addTo(map)
                .bindPopup(`<div class="map-popup"><strong>${p.name}</strong><span>${p.distance}</span></div>`);
        });

        const detail = document.getElementById("attractionDetail");
        const detailIcon = document.getElementById("attractionIcon");
        const detailTitle = document.getElementById("attractionDetailTitle");
        const detailText = document.getElementById("attractionDetailText");
        const detailDist = document.getElementById("attractionDetailDistance");

        const showPlace = (place) => {
            if (!detail || !place) return;
            detail.style.animation = "none";
            void detail.offsetWidth;
            detail.style.animation = "";
            if (detailIcon) detailIcon.className = "bi " + place.icon;
            if (detailTitle) detailTitle.textContent = place.name;
            if (detailText) detailText.textContent = place.description || "";
            if (detailDist) detailDist.innerHTML = `<i class="bi bi-signpost-2-fill"></i> ${place.distance} تا سرای ستاره`;
        };

        document.querySelectorAll(".attract").forEach(btn => {
            btn.addEventListener("click", () => {
                const key = btn.dataset.place;
                if (!key || !places[key]) return;
                document.querySelectorAll(".attract").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                showPlace(places[key]);
                map.flyTo([places[key].lat, places[key].lng], 13, { duration: 1.2 });
                setTimeout(() => markers[key] && markers[key].openPopup(), 700);
            });
        });

        setTimeout(() => map.invalidateSize(), 300);
        setTimeout(() => map.invalidateSize(), 1000);
    }

    /* --- MOBILE: contact bar hides on scroll down, shows on scroll up --- */
    const mbar = document.querySelector(".mobile-bar");
    if (mbar) {
        let lastY = window.scrollY, tick = false;
        window.addEventListener("scroll", () => {
            if (tick) return; tick = true;
            requestAnimationFrame(() => {
                const y = window.scrollY, d = y - lastY;
                if (y < 120) mbar.classList.remove("is-hidden");
                else if (d > 8) mbar.classList.add("is-hidden");
                else if (d < -8) mbar.classList.remove("is-hidden");
                lastY = y; tick = false;
            });
        }, { passive: true });
    }

    /* --- MOBILE: collapsible sections (data-accordion) --- */
    document.querySelectorAll("section[data-accordion]").forEach(sec => {
        const head = sec.querySelector(".section-head");
        const wrap = head && head.parentElement;
        if (!head || !wrap) return;
        const body = document.createElement("div");
        body.className = "acc-body";
        while (head.nextSibling) body.appendChild(head.nextSibling);
        wrap.appendChild(body);
        sec.classList.add("acc");
        if (sec.dataset.accordion === "open") sec.classList.add("open");
        head.setAttribute("role", "button");
        head.setAttribute("tabindex", "0");
        head.setAttribute("aria-expanded", String(sec.classList.contains("open")));
        const toggleAcc = () => {
            const open = sec.classList.toggle("open");
            head.setAttribute("aria-expanded", String(open));
            if (open) body.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
        };
        head.addEventListener("click", () => { if (window.matchMedia("(max-width: 700px)").matches) toggleAcc(); });
        head.addEventListener("keydown", e => {
            if ((e.key === "Enter" || e.key === " ") && window.matchMedia("(max-width: 700px)").matches) { e.preventDefault(); toggleAcc(); }
        });
    });

});

/* =====================================================
   SMART DOCK
   4 slots: [خانه | واتساپ در صفحه اصلی] [کمکی] [اقدام اصلی] [بیشتر]
   کمکی و اقدام اصلی با صفحه (و با اسکرول / مرحله فرم) عوض می‌شوند.
===================================================== */
function initMobileNavigation() {
    if (document.querySelector('.mobile-dock')) return;

    const PHONE = '+989161234567', WA = 'https://wa.me/989161234567';
    const svg = d => '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
    const icons = {
        home: svg('<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.8V21h13V9.8"/><path d="M9.5 21v-6h5v6"/>'),
        booking: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="m9 15.5 2 2 4-4"/>'),
        more: svg('<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>'),
        call: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
        wa: svg('<path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.4L3 21z"/><path d="M9 9.2c.4 2 2.4 4 4.4 4.4l1.2-1.2-2-1-.8.8c-.8-.4-1.5-1.1-1.9-1.9l.8-.8-1-2L9 9.2z"/>'),
        route: svg('<path d="M12 21s7-6.2 7-12A7 7 0 0 0 5 9c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/>'),
        rules: svg('<path d="M12 21s7-4.5 7-11V5l-7-2-7 2v5c0 6.5 7 11 7 11Z"/><path d="m9 12 2 2 4-4"/>'),
        season: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
        prev: svg('<path d="m9 6 6 6-6 6"/>'),
        next: svg('<path d="m15 6-6 6 6 6"/><path d="M20 12H9"/>'),
        send: svg('<path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.4L3 21z"/><path d="m9 12 2 2 4-4"/>'),
        rooms: svg('<rect x="3" y="10" width="18" height="9" rx="1.5"/><path d="M5 10V7.5A2.5 2.5 0 0 1 7.5 5h3A2.5 2.5 0 0 1 13 7.5V10"/><path d="M3 19v2M21 19v2"/>'),
        gallery: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/>'),
        about: svg('<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>'),
        facilities: svg('<path d="M4 20h16M6 20V9l6-5 6 5v11"/><path d="M9 20v-5h6v5M9 10h.01M15 10h.01"/>'),
        experience: svg('<path d="M12 21s7-4.5 7-11V5l-7-2-7 2v5c0 6.5 7 11 7 11Z"/><path d="m9 12 2 2 4-4"/>'),
        restaurant: svg('<path d="M5 9h11v4a5.5 5.5 0 0 1-5.5 5.5H10A5 5 0 0 1 5 13.5Z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c-.6 1-.6 2 0 3M11 3c-.6 1-.6 2 0 3"/><path d="M4 21h13"/>'),
        around: svg('<path d="M12 21s7-6.2 7-12A7 7 0 0 0 5 9c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/>'),
        close: svg('<path d="m6 6 12 12M18 6 6 18"/>')
    };
    const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5 L14.9 8.6 L22.5 9.3 L16.8 14.3 L18.5 21.8 L12 17.8 L5.5 21.8 L7.2 14.3 L1.5 9.3 L9.1 8.6 Z"/></svg>';

    const morePages = [
        ['rooms.html', 'اقامت', 'rooms'],
        ['gallery.html', 'گالری و نظرات', 'gallery'],
        ['about.html', 'درباره ما', 'about'],
        ['facilities.html', 'امکانات', 'facilities'],
        ['experience.html', 'تجربه و فصل‌ها', 'experience'],
        ['restaurant.html', 'رستوران و کافه', 'restaurant'],
        ['around.html', 'اطراف و مسیر', 'around']
    ];
    const current = location.pathname.split('/').pop() || 'index.html';
    const isCurrent = href => current === href;

    /* ---------- item factory (all items look and size the same) ---------- */
    const makeItem = o => {
        const el = document.createElement(o.href ? 'a' : 'button');
        if (o.href) { el.href = o.href; if (o.blank) { el.target = '_blank'; el.rel = 'noopener'; } }
        else el.type = 'button';
        el.className = 'dk';
        if (o.color) el.style.setProperty('--ic', o.color);
        el.innerHTML = o.icon + `<span>${o.label}</span>`;
        if (o.current) { el.classList.add('is-current'); el.setAttribute('aria-current', 'page'); }
        if (o.onClick) el.addEventListener('click', o.onClick);
        return el;
    };
    const toTop = e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    /* ---------- the pages ---------- */
    const PAGES = {
        'index.html':      { href: 'index.html',      label: 'خانه',    icon: icons.home,       color: '#1f9d8f' },
        'rooms.html':      { href: 'rooms.html',      label: 'اقامت',   icon: icons.rooms,      color: '#e2674f' },
        'gallery.html':    { href: 'gallery.html',    label: 'گالری',   icon: icons.gallery,    color: '#3b87d6' },
        'about.html':      { href: 'about.html',      label: 'درباره',  icon: icons.about,      color: '#d99a1c' },
        'facilities.html': { href: 'facilities.html', label: 'امکانات', icon: icons.facilities, color: '#3f9b4f' },
        'experience.html': { href: 'experience.html', label: 'تجربه',   icon: icons.experience, color: '#7c5cc4' },
        'restaurant.html': { href: 'restaurant.html', label: 'رستوران', icon: icons.restaurant, color: '#d99a1c' },
        'around.html':     { href: 'around.html',     label: 'اطراف',   icon: icons.around,     color: '#1f9d8f' },
        'booking.html':    { href: 'booking.html#booking-form', label: 'رزرو', icon: icons.booking, color: '#e2674f' }
    };
    const callItem = { label: 'تماس', href: 'tel:' + PHONE, icon: icons.call, color: '#3f9b4f' };
    const waItem   = { label: 'واتساپ', href: WA, blank: true, icon: icons.wa, color: '#1f9a55' };
    const jump = (id, openAcc) => e => {
        const t = document.getElementById(id);
        if (!t) return;
        e.preventDefault();
        if (openAcc && t.classList.contains('acc') && !t.classList.contains('open')) {
            const h = t.querySelector('.section-head'); if (h) h.click();
        }
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const auxFor = {
        'index.html': { label: 'رستوران', href: 'restaurant.html', icon: icons.restaurant, color: '#d99a1c' },
        'rooms.html': callItem,
        'gallery.html': waItem,
        'about.html': callItem,
        'facilities.html': { label: 'قوانین', href: '#rules', icon: icons.rules, color: '#e2674f', onClick: jump('rules', true) },
        'experience.html': { label: 'فصل‌ها', href: '#seasons', icon: icons.season, color: '#d99a1c', onClick: jump('seasons') },
        'restaurant.html': { label: 'منو', href: 'restaurant.html#menu', icon: icons.prev, color: '#d99a1c' },
        'around.html': { label: 'مسیریابی', href: 'https://www.google.com/maps/search/?api=1&query=33.383,49.117', blank: true, icon: icons.route, color: '#3b87d6' },
        'booking.html': callItem
    };

    /* ---------- build: [home] [page] [helper] [book] [more] ---------- */
    const dock = document.createElement('nav');
    dock.className = 'mobile-dock';
    dock.setAttribute('aria-label', 'ناوبری موبایل');

    const isHome = current === 'index.html', isBook = current === 'booking.html';

    /* 4 slots: [home — or "اقامت" on the home page] [helper, changes per page] [book] [more] */
    const slotFirst = makeItem(isHome
        ? Object.assign({}, PAGES['rooms.html'])
        : Object.assign({}, PAGES['index.html']));
    let aux = makeItem(auxFor[current] || callItem);
    const slotBook = makeItem(Object.assign({}, PAGES['booking.html'], isBook ? { current: true, onClick: toTop } : {}));
    const moreBtn  = makeItem({ label: 'بیشتر', icon: icons.more, color: '#d4568a' });
    moreBtn.setAttribute('aria-expanded', 'false');
    moreBtn.setAttribute('aria-haspopup', 'dialog');
    dock.append(slotFirst, aux, slotBook, moreBtn);
    document.body.appendChild(dock);

    const setAux = o => {
        const fresh = makeItem(o);
        fresh.classList.add('dk-swap');
        dock.replaceChild(fresh, aux);
        aux = fresh;
    };

    /* ---------- ROOMS: "رزرو" opens the form with the room on screen ---------- */
    if (current === 'rooms.html') {
        const cards = Array.from(document.querySelectorAll('.room-card'));
        const base = PAGES['booking.html'].href;
        const pickRoom = () => {
            const mid = window.innerHeight * 0.5;
            let best = null, bestD = Infinity;
            cards.forEach(c => {
                const r = c.getBoundingClientRect();
                if (r.bottom < 80 || r.top > window.innerHeight - 80) return;
                const d = Math.abs((r.top + r.bottom) / 2 - mid);
                if (d < bestD) { bestD = d; best = c; }
            });
            slotBook.setAttribute('href', best ? best.querySelector('.room-link').getAttribute('href') : base);
        };
        let t = false;
        window.addEventListener('scroll', () => { if (t) return; t = true; requestAnimationFrame(() => { pickRoom(); t = false; }); }, { passive: true });
        pickRoom();
    }

    /* ---------- SINGLE ROOM PAGES: dock "رزرو" opens the form with this room ---------- */
    if (document.body.dataset.room) {
        slotBook.setAttribute('href', 'booking.html?room=' + document.body.dataset.room + '#booking-form');
    }

    /* ---------- BOOKING: the helper slot drives the form steps ---------- */
    const form = document.getElementById('booking-form');
    if (isBook && form) {
        const next = document.getElementById('bkNext');
        const sync = () => {
            const stepsOn = form.classList.contains('steps-on');
            const step = Number(form.dataset.step || 1);
            if (!stepsOn || step === 3) {
                setAux({ label: 'ارسال', icon: icons.send, color: '#1f9a55',
                    onClick: () => form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })) });
            } else {
                setAux({ label: 'بعدی', icon: icons.next, color: '#24402f', onClick: () => next && next.click() });
            }
        };
        new MutationObserver(sync).observe(form, { attributes: true, attributeFilter: ['data-step', 'class'] });
        sync();
        form.addEventListener('focusin', e => { if (e.target.matches('textarea, input[type="text"], input[type="tel"], input:not([type])')) dock.classList.add('is-hidden'); });
        form.addEventListener('focusout', () => dock.classList.remove('is-hidden'));
    }

    /* ---------- the "more" sheet ---------- */
    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-more-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    const sheet = document.createElement('div');
    sheet.className = 'mobile-more-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'منوی صفحات');
    sheet.innerHTML = `
        <div class="mobile-more-head">
            <span class="mobile-more-mark">${star}</span>
            <div><strong>سرای ستاره</strong><small>دره‌اسپر، دورود</small></div>
            <button type="button" class="mobile-more-close" aria-label="بستن منو">${icons.close}</button>
        </div>
        <div class="mobile-more-grid"></div>
        <div class="mobile-more-contact">
            <a class="mc-call" href="tel:${PHONE}"><i class="bi bi-telephone-fill"></i> تماس</a>
            <a class="mc-wa" href="${WA}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> واتساپ</a>
        </div>`;
    const grid = sheet.querySelector('.mobile-more-grid');
    const sheetPages = [['index.html', 'صفحه اصلی', 'home'], ['booking.html', 'رزرو', 'booking'], ...morePages];
    sheetPages.forEach(([href, label, icon]) => {
        const a = document.createElement('a');
        a.href = href;
        a.innerHTML = `<span class="mm-ico">${icons[icon]}</span><span>${label}</span>`;
        if (isCurrent(href)) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
        grid.appendChild(a);
    });
    document.body.append(backdrop, sheet);

    const close = () => { document.body.classList.remove('mobile-more-open'); moreBtn.setAttribute('aria-expanded', 'false'); };
    const open  = () => { document.body.classList.add('mobile-more-open'); moreBtn.setAttribute('aria-expanded', 'true'); };
    moreBtn.addEventListener('click', () => document.body.classList.contains('mobile-more-open') ? close() : open());
    backdrop.addEventListener('click', close);
    sheet.querySelector('.mobile-more-close').addEventListener('click', close);
    sheet.querySelectorAll('.mobile-more-grid a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    let startY = null;
    sheet.addEventListener('touchstart', e => { if (sheet.scrollTop <= 0) startY = e.touches[0].clientY; }, { passive: true });
    sheet.addEventListener('touchend', e => {
        if (startY !== null && e.changedTouches[0].clientY - startY > 70) close();
        startY = null;
    }, { passive: true });
}

document.addEventListener('DOMContentLoaded', initMobileNavigation);
