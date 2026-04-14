/**
 * MediShop — Online Pharmacy  (public/app.js)
 * jQuery-powered frontend — calls real Express API endpoints
 *
 * API Endpoints (served by server.js):
 *   GET  /api/medicines        — full medicine catalogue
 *   POST /api/rx-upload        — prescription file upload (FormData)
 *   POST /api/notify           — stock-back notification
 *   GET  /api/track/:orderId   — order status
 */

$(function () {

    // ═══════════════════════════════════════════════════════
    //  DRUG INTERACTIONS  (frontend logic — stays client-side)
    // ═══════════════════════════════════════════════════════
    const INTERACTIONS = [
        {
            ids: [2, 4], level: 'high',
            title: 'NSAID Combination — High Risk',
            message: 'Taking <strong>Ibuprofen</strong> and <strong>Aspirin</strong> together significantly increases the risk of gastrointestinal bleeding and ulcers. It also reduces aspirin\'s cardioprotective benefit.',
            advice: 'Consult your doctor or pharmacist before combining these medications.'
        },
        {
            ids: [7, 8], level: 'moderate',
            title: 'Antibiotic Interaction — Moderate Risk',
            message: 'Combining <strong>Ciprofloxacin</strong> and <strong>Metronidazole</strong> may increase the risk of QT interval prolongation, potentially triggering a cardiac arrhythmia.',
            advice: 'Cardiac monitoring may be required. Consult your physician before proceeding.'
        },
        {
            ids: [4, 20], level: 'moderate',
            title: 'Aspirin + Atorvastatin — Moderate Risk',
            message: 'High-dose <strong>Aspirin</strong> may reduce the effectiveness of <strong>Atorvastatin</strong>. Concurrent use also raises bleeding risk.',
            advice: 'Low-dose aspirin is generally safe with statins, but please inform your doctor.'
        },
    ];

    // ═══════════════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════════════
    let allMedicines      = [];
    let filteredMedicines = [];
    let activeCategory    = 'all';
    let pendingItem       = null;
    let notifyMed         = null;
    let rxVerified        = false;

    // ═══════════════════════════════════════════════════════
    //  CART  — localStorage persistence
    // ═══════════════════════════════════════════════════════
    const Cart = {
        KEY: 'medishop_cart_v2',

        get()        { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); },
        save(items)  { localStorage.setItem(this.KEY, JSON.stringify(items)); },
        getIds()     { return this.get().map(i => i.id); },
        count()      { return this.get().reduce((s, i) => s + i.qty, 0); },
        total()      { return this.get().reduce((s, i) => s + i.price * i.qty, 0); },
        hasRxItems() { return this.get().some(i => i.rx); },

        add(med) {
            const items    = this.get();
            const existing = items.find(i => i.id === med.id);
            if (existing) { existing.qty = Math.min(existing.qty + 1, 20); }
            else { items.push({ id: med.id, name: med.name, generic: med.generic, price: med.price, rx: med.rx, qty: 1 }); }
            this.save(items); renderCart(); updateBadge();
        },

        remove(id) { this.save(this.get().filter(i => i.id !== id)); renderCart(); updateBadge(); },

        changeQty(id, delta) {
            const items = this.get();
            const item  = items.find(i => i.id === id);
            if (!item) return;
            item.qty = Math.max(1, Math.min(20, item.qty + delta));
            this.save(items); renderCart();
        },
    };

    // ═══════════════════════════════════════════════════════
    //  FETCH MEDICINES  — real $.ajax() call to Express API
    // ═══════════════════════════════════════════════════════
    function showSkeletons() {
        $('#product-grid').html(
            Array(6).fill('<div class="skeleton-card"><div class="sk-top"></div><div class="sk-body"><div class="sk-line w60"></div><div class="sk-line w40"></div><div class="sk-line w80"></div></div><div class="sk-footer"></div></div>').join('')
        );
    }

    function fetchMedicines() {
        $.ajax({
            url:         '/api/medicines',
            type:        'GET',
            dataType:    'json',
            beforeSend:  showSkeletons,
            success: function (data) {
                allMedicines      = data;
                filteredMedicines = [...data];
                buildBrandFilters();
                applyFilters();
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.error || 'Failed to load medicines.';
                $('#product-grid').html(`<div class="api-error"><i class="fas fa-circle-exclamation"></i><p>${msg}</p></div>`);
                toast('<i class="fas fa-circle-exclamation"></i> Could not connect to server.', 'warning');
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    //  RENDER MEDICINE CARDS
    // ═══════════════════════════════════════════════════════
    function renderMedicines(list) {
        const $grid   = $('#product-grid').empty();
        const cartIds = Cart.getIds();

        if (!list.length) { $('#no-results').removeClass('hidden'); return; }
        $('#no-results').addClass('hidden');

        $.each(list, function (_, m) {
            const disc   = Math.round(((m.mrp - m.price) / m.mrp) * 100);
            const inCart = cartIds.includes(m.id);
            let stockHtml, actionHtml;

            if (m.stock === 0) {
                stockHtml  = `<span class="stock out"><i class="fas fa-circle-xmark"></i> Out of Stock</span>`;
                actionHtml = `<button class="btn-notify" data-id="${m.id}"><i class="fas fa-bell"></i> Notify Me</button>`;
            } else if (m.stock <= 15) {
                stockHtml  = `<span class="stock low"><i class="fas fa-circle-exclamation"></i> Only ${m.stock} left</span>`;
                actionHtml = `<button class="btn-add ${inCart ? 'added' : ''}" data-id="${m.id}" ${inCart ? 'disabled' : ''}>${inCart ? '<i class="fas fa-check"></i> Added' : '<i class="fas fa-cart-plus"></i> Add to Cart'}</button>`;
            } else {
                stockHtml  = `<span class="stock in"><i class="fas fa-circle-check"></i> In Stock</span>`;
                actionHtml = `<button class="btn-add ${inCart ? 'added' : ''}" data-id="${m.id}" ${inCart ? 'disabled' : ''}>${inCart ? '<i class="fas fa-check"></i> Added' : '<i class="fas fa-cart-plus"></i> Add to Cart'}</button>`;
            }

            const card = `
                <div class="med-card" data-id="${m.id}">
                    <div class="card-accent" style="background:${m.color}"></div>
                    <div class="card-top">
                        <div class="cat-icon" style="color:${m.color};background:${m.color}18"><i class="fas ${m.icon}"></i></div>
                        <div class="card-badges">
                            ${m.rx ? '<span class="badge rx"><i class="fas fa-file-prescription"></i> Rx</span>' : '<span class="badge otc">OTC</span>'}
                            ${disc > 0 ? `<span class="badge disc">${disc}% OFF</span>` : ''}
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="cat-name">${m.category}</p>
                        <h4 class="med-name">${m.name}</h4>
                        <p class="med-generic">${m.generic}</p>
                        <p class="med-brand"><i class="fas fa-industry"></i> ${m.brand}</p>
                    </div>
                    <div class="card-footer">
                        <div class="price-row">
                            <span class="price-now">₹${m.price}</span>
                            ${m.mrp > m.price ? `<span class="price-mrp">₹${m.mrp}</span>` : ''}
                        </div>
                        ${stockHtml}
                        <div class="card-actions">
                            <button class="btn-info" data-id="${m.id}" title="Details"><i class="fas fa-circle-info"></i></button>
                            ${actionHtml}
                        </div>
                    </div>
                </div>`;

            $(card).hide().appendTo($grid).fadeIn(250 + Math.random() * 200);
        });

        updateResultsCount(list.length);
    }

    function updateResultsCount(n) {
        $('#results-count').text(`Showing ${n} medicine${n !== 1 ? 's' : ''}`);
    }

    // ═══════════════════════════════════════════════════════
    //  BUILD BRAND CHECKBOXES
    // ═══════════════════════════════════════════════════════
    function buildBrandFilters() {
        const brands = [...new Set(allMedicines.map(m => m.brand))].sort();
        const $c     = $('#brand-filters').empty();
        $.each(brands, function (_, b) {
            $c.append(`<label class="filter-check"><input type="checkbox" class="brand-cb" value="${b}"> ${b}</label>`);
        });
        $(document).off('change', '.brand-cb').on('change', '.brand-cb', applyFilters);
    }

    // ═══════════════════════════════════════════════════════
    //  APPLY ALL FILTERS  — jQuery .filter() approach
    // ═══════════════════════════════════════════════════════
    function applyFilters() {
        const q        = $('#live-search').val().toLowerCase().trim();
        const maxPrice = parseInt($('#price-range').val());
        const inStock  = $('#in-stock-only').is(':checked');
        const otcOnly  = $('#otc-only').is(':checked');
        const brands   = $('.brand-cb:checked').map(function () { return $(this).val(); }).get();

        filteredMedicines = allMedicines.filter(function (m) {
            if (activeCategory !== 'all' && m.category !== activeCategory) return false;
            if (q && !m.name.toLowerCase().includes(q) && !m.generic.toLowerCase().includes(q) && !m.brand.toLowerCase().includes(q)) return false;
            if (brands.length && !brands.includes(m.brand)) return false;
            if (m.price > maxPrice)      return false;
            if (inStock && m.stock === 0) return false;
            if (otcOnly  && m.rx)         return false;
            return true;
        });

        const sort = $('#sort-select').val();
        if      (sort === 'price-asc')  filteredMedicines.sort((a, b) => a.price - b.price);
        else if (sort === 'price-desc') filteredMedicines.sort((a, b) => b.price - a.price);
        else if (sort === 'name')       filteredMedicines.sort((a, b) => a.name.localeCompare(b.name));
        else if (sort === 'discount')   filteredMedicines.sort((a, b) => (b.mrp - b.price) - (a.mrp - a.price));

        renderMedicines(filteredMedicines);
    }

    // ═══════════════════════════════════════════════════════
    //  LIVE SEARCH
    // ═══════════════════════════════════════════════════════
    let searchTimer;
    $('#live-search').on('input', function () {
        clearTimeout(searchTimer);
        const q = $(this).val().toLowerCase().trim();
        if (q.length < 2) { $('#search-dropdown').addClass('hidden').empty(); applyFilters(); return; }

        searchTimer = setTimeout(function () {
            const hits = allMedicines.filter(m =>
                m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q)
            ).slice(0, 7);

            const $dd = $('#search-dropdown').empty();
            if (hits.length) {
                $.each(hits, function (_, m) {
                    $dd.append(`
                        <div class="dd-item" data-id="${m.id}">
                            <div class="dd-icon" style="color:${m.color}"><i class="fas ${m.icon}"></i></div>
                            <div class="dd-text">
                                <span class="dd-name">${m.name}</span>
                                <span class="dd-generic">${m.generic} · ${m.brand}</span>
                            </div>
                            <span class="dd-price">₹${m.price}</span>
                        </div>`);
                });
            } else {
                $dd.append('<div class="dd-empty"><i class="fas fa-magnifying-glass-minus"></i> No medicines found</div>');
            }
            $dd.removeClass('hidden').hide().slideDown(150);
            applyFilters();
        }, 300);
    });

    $(document).on('click', '.dd-item[data-id]', function () {
        const m = allMedicines.find(x => x.id === +$(this).data('id'));
        if (m) { $('#live-search').val(m.name); $('#search-dropdown').addClass('hidden'); applyFilters(); }
    });
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.search-wrap').length) $('#search-dropdown').addClass('hidden');
    });

    // ═══════════════════════════════════════════════════════
    //  CATEGORY PILLS
    // ═══════════════════════════════════════════════════════
    $(document).on('click', '.cat-pill', function () {
        $('.cat-pill').removeClass('active');
        $(this).addClass('active');
        activeCategory = $(this).data('cat');
        applyFilters();
    });

    // ═══════════════════════════════════════════════════════
    //  FILTER SIDEBAR
    // ═══════════════════════════════════════════════════════
    $('#sort-select, #in-stock-only, #otc-only').on('change', applyFilters);
    $('#price-range').on('input', function () { $('#price-max-label').text('₹' + $(this).val()); applyFilters(); });

    $('#clear-filters').on('click', function () {
        activeCategory = 'all';
        $('#live-search').val('');
        $('#price-range').val(200); $('#price-max-label').text('₹200');
        $('#in-stock-only, #otc-only, .brand-cb').prop('checked', false);
        $('#sort-select').val('default');
        $('.cat-pill').removeClass('active').first().addClass('active');
        applyFilters();
    });

    // ═══════════════════════════════════════════════════════
    //  ADD TO CART  — drug interaction check first
    // ═══════════════════════════════════════════════════════
    $(document).on('click', '.btn-add', function () {
        if ($(this).hasClass('added')) return;
        const id  = +$(this).data('id');
        const med = allMedicines.find(m => m.id === id);
        if (!med || med.stock === 0) return;

        const cartIds     = Cart.getIds();
        const interaction = INTERACTIONS.find(ix =>
            ix.ids.includes(id) && ix.ids.some(oid => oid !== id && cartIds.includes(oid))
        );

        if (interaction) {
            pendingItem = med;
            const other = allMedicines.find(m => interaction.ids.includes(m.id) && m.id !== id);
            $('#interaction-body').html(`
                <div class="ia-alert ia-${interaction.level}">
                    <div class="ia-pills">
                        <span class="ia-pill">${other ? other.name : 'Cart item'}</span>
                        <i class="fas fa-bolt ia-bolt"></i>
                        <span class="ia-pill new">${med.name}</span>
                    </div>
                    <h4>${interaction.title}</h4>
                    <p>${interaction.message}</p>
                    <div class="ia-advice"><i class="fas fa-user-doctor"></i> ${interaction.advice}</div>
                </div>`);
            openModal('#interaction-modal');
            return;
        }
        doAddToCart(med);
    });

    function doAddToCart(med) {
        Cart.add(med);
        renderMedicines(filteredMedicines);
        toast(`<i class="fas fa-circle-check"></i> <strong>${med.name}</strong> added to cart!`, 'success');
        openCart();
    }

    $('#keep-anyway-btn').on('click', function () {
        if (pendingItem) { doAddToCart(pendingItem); pendingItem = null; }
        closeModal('#interaction-modal');
    });

    $('#remove-interaction-btn').on('click', function () {
        pendingItem = null;
        closeModal('#interaction-modal');
        toast('<i class="fas fa-triangle-exclamation"></i> Item not added. Please consult your pharmacist.', 'warning');
    });

    // ═══════════════════════════════════════════════════════
    //  PRODUCT DETAIL MODAL
    // ═══════════════════════════════════════════════════════
    $(document).on('click', '.btn-info', function (e) {
        e.stopPropagation();
        const m = allMedicines.find(x => x.id === +$(this).data('id'));
        if (!m) return;
        const disc = Math.round(((m.mrp - m.price) / m.mrp) * 100);
        let stockHtml;
        if (m.stock === 0)      stockHtml = '<span class="stock out"><i class="fas fa-circle-xmark"></i> Out of Stock</span>';
        else if (m.stock <= 15) stockHtml = `<span class="stock low"><i class="fas fa-circle-exclamation"></i> Only ${m.stock} left</span>`;
        else                    stockHtml = '<span class="stock in"><i class="fas fa-circle-check"></i> In Stock</span>';

        $('#detail-title').text(m.name);
        $('#detail-body').html(`
            <div class="detail-wrap">
                <div class="detail-icon" style="background:${m.color}15;color:${m.color}"><i class="fas ${m.icon} fa-3x"></i></div>
                <div class="detail-info">
                    <div class="detail-badges">
                        ${m.rx ? '<span class="badge rx"><i class="fas fa-file-prescription"></i> Prescription Required</span>' : '<span class="badge otc">Over The Counter</span>'}
                        <span class="badge cat-badge" style="background:${m.color}18;color:${m.color}">${m.category}</span>
                    </div>
                    <p><strong>Generic:</strong> ${m.generic}</p>
                    <p><strong>Brand:</strong> ${m.brand}</p>
                    <p class="detail-desc">${m.desc}</p>
                    <div class="detail-price">
                        <span class="price-now big">₹${m.price}</span>
                        ${m.mrp > m.price ? `<span class="price-mrp">₹${m.mrp}</span><span class="badge disc">${disc}% OFF</span>` : ''}
                    </div>
                    ${stockHtml}
                </div>
            </div>`);

        const inCart = Cart.getIds().includes(m.id);
        $('#detail-footer').html(
            m.stock === 0
            ? `<button class="btn-notify" data-id="${m.id}"><i class="fas fa-bell"></i> Notify Me</button>`
            : `<button class="btn-outline-sm close-modal">Close</button>
               <button class="btn-primary btn-add ${inCart ? 'added' : ''}" data-id="${m.id}" ${inCart ? 'disabled' : ''}>
                   ${inCart ? '<i class="fas fa-check"></i> Added to Cart' : '<i class="fas fa-cart-plus"></i> Add to Cart'}
               </button>`
        );
        openModal('#detail-modal');
    });

    // ═══════════════════════════════════════════════════════
    //  NOTIFY ME  — real $.ajax POST to /api/notify
    // ═══════════════════════════════════════════════════════
    $(document).on('click', '.btn-notify', function () {
        notifyMed = allMedicines.find(x => x.id === +$(this).data('id'));
        if (notifyMed) $('#notify-med-name').html(`<strong>${notifyMed.name}</strong> &mdash; ${notifyMed.generic}`);
        $('#notify-email, #notify-phone').val('');
        openModal('#notify-modal');
    });

    $('#notify-submit').on('click', function () {
        const email = $('#notify-email').val().trim();
        const phone = $('#notify-phone').val().trim();
        if (!email && !phone) { toast('<i class="fas fa-circle-exclamation"></i> Please enter your email or phone.', 'warning'); return; }

        const $btn = $(this).html('<i class="fas fa-spinner fa-spin"></i> Saving…').prop('disabled', true);

        $.ajax({
            url:         '/api/notify',
            type:        'POST',
            contentType: 'application/json',
            data:        JSON.stringify({
                email,
                phone,
                medicineId:   notifyMed ? notifyMed.id   : null,
                medicineName: notifyMed ? notifyMed.name  : null
            }),
            success: function () {
                closeModal('#notify-modal');
                toast('<i class="fas fa-bell"></i> You\'ll be notified when back in stock!', 'success');
            },
            error: function () {
                toast('<i class="fas fa-circle-exclamation"></i> Could not save. Please try again.', 'warning');
            },
            complete: function () {
                $btn.html('<i class="fas fa-bell"></i> Notify Me').prop('disabled', false);
            }
        });
    });

    // ═══════════════════════════════════════════════════════
    //  PRESCRIPTION UPLOAD  — real FormData POST to /api/rx-upload
    // ═══════════════════════════════════════════════════════
    $('#open-rx-modal, #hero-rx-btn').on('click', () => openModal('#rx-modal'));

    $('#rx-file-input').on('change', function () { handleRxFile(this.files[0]); });

    const $dz = $('#rx-drop-zone');
    $dz.on('dragover dragenter', function (e) { e.preventDefault(); $(this).addClass('drag-over'); })
       .on('dragleave drop', function (e) {
            $(this).removeClass('drag-over');
            if (e.type === 'drop') { e.preventDefault(); handleRxFile(e.originalEvent.dataTransfer.files[0]); }
        });

    function handleRxFile(file) {
        $('#rx-error').addClass('hidden').empty();
        $('#rx-preview').addClass('hidden').empty();
        $('#submit-rx').prop('disabled', true).data('file', null);
        if (!file) return;

        // Client-side validation (mirrors server-side Multer rules)
        if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)) {
            $('#rx-error').html('<i class="fas fa-circle-exclamation"></i> Invalid file. Please upload JPG, PNG, or PDF.').removeClass('hidden');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            $('#rx-error').html('<i class="fas fa-circle-exclamation"></i> File too large. Maximum allowed size is 5 MB.').removeClass('hidden');
            return;
        }

        if (file.type === 'application/pdf') {
            $('#rx-preview').html(`
                <div class="rx-pdf">
                    <i class="fas fa-file-pdf"></i>
                    <div><p class="rx-fname">${file.name}</p><p class="rx-fsize">${(file.size/1024).toFixed(1)} KB · PDF</p></div>
                    <span class="badge rx">PDF</span>
                </div>`).removeClass('hidden').hide().slideDown(200);
        } else {
            const reader = new FileReader();
            reader.onload = e => {
                $('#rx-preview').html(`
                    <div class="rx-img">
                        <img src="${e.target.result}" alt="Prescription preview">
                        <div class="rx-img-meta"><p class="rx-fname">${file.name}</p><p class="rx-fsize">${(file.size/1024).toFixed(1)} KB</p></div>
                    </div>`).removeClass('hidden').hide().slideDown(200);
            };
            reader.readAsDataURL(file);
        }
        $('#submit-rx').prop('disabled', false).data('file', file);
    }

    $('#submit-rx').on('click', function () {
        const file = $(this).data('file');
        if (!file) return;

        const formData = new FormData();
        formData.append('prescription', file);

        const $btn = $(this).html('<i class="fas fa-spinner fa-spin"></i> Uploading Securely...').prop('disabled', true);

        // Simulated AI Verification Flow
        setTimeout(() => {
            $btn.html('<i class="fas fa-microchip fa-fade" style="color: #3b82f6;"></i> AI OCR Scanning...');
            
            setTimeout(() => {
                $btn.html('<i class="fas fa-arrows-rotate fa-spin"></i> Cross-checking Cart...');
                
                setTimeout(() => {
                    // Call the real Express API after the "scanning" completes
                    $.ajax({
                        url:         '/api/rx-upload',
                        type:        'POST',
                        data:        formData,
                        processData: false,   
                        contentType: false,   
                        success: function (res) {
                            closeModal('#rx-modal');
                            $('#rx-file-input').val('');
                            $('#rx-preview, #rx-error').addClass('hidden').empty();
                            toast(`<i class="fas fa-circle-check"></i> AI Match Successful! ${res.message}`, 'success');
                            rxVerified = true;
                            $('#checkout-btn').html('<i class="fas fa-truck-fast"></i> Delivery Details');
                            
                            // Automatically skip to the delivery details modal
                            setTimeout(() => $('#checkout-btn').trigger('click'), 1200);
                        },
                        error: function (xhr) {
                            const msg = xhr.responseJSON?.error || 'Upload failed. Please try again.';
                            $('#rx-error').html(`<i class="fas fa-circle-exclamation"></i> ${msg}`).removeClass('hidden');
                        },
                        complete: function () {
                            $btn.html('<i class="fas fa-paper-plane"></i> Submit Prescription').prop('disabled', false);
                        }
                    });
                }, 1500);
            }, 1800);
        }, 1200);
    });

    // ═══════════════════════════════════════════════════════
    //  ORDER TRACKING  — real $.ajax GET + jQuery .addClass()
    // ═══════════════════════════════════════════════════════
    const STEPS = [
        { label: 'Order Placed',      icon: 'fa-receipt'     },
        { label: 'Pharmacy Verified', icon: 'fa-user-doctor' },
        { label: 'Packed',            icon: 'fa-box'         },
        { label: 'Shipped',           icon: 'fa-truck'       },
        { label: 'Delivered',         icon: 'fa-house'       },
    ];

    $('#track-btn').on('click', function () {
        const id   = $('#order-id-input').val().trim().toUpperCase();
        const $btn = $(this);
        if (!id) { toast('<i class="fas fa-circle-exclamation"></i> Please enter an order ID.', 'warning'); return; }

        $btn.html('<i class="fas fa-spinner fa-spin"></i>').prop('disabled', true);

        $.ajax({
            url:     `/api/track/${encodeURIComponent(id)}`,
            type:    'GET',
            success: function (order) { renderTrackingResult(id, order); },
            error:   function (xhr) {
                const msg = xhr.responseJSON?.error || `Order "${id}" not found.`;
                $('#tracking-result').html(`
                    <div class="track-error">
                        <i class="fas fa-magnifying-glass-minus"></i>
                        <p>${msg}</p>
                    </div>`).removeClass('hidden').hide().slideDown(300);
            },
            complete: function () {
                $btn.html('<i class="fas fa-location-arrow"></i> Track').prop('disabled', false);
            }
        });
    });

    function renderTrackingResult(id, order) {
        let html = `
            <div class="track-meta">
                <span><i class="fas fa-hashtag"></i> ${id}</span>
                <span><i class="fas fa-box"></i> ${order.items}</span>
                <span><i class="fas fa-calendar"></i> ${order.date}</span>
                ${order.eta ? `<span><i class="fas fa-truck"></i> ETA: ${order.eta}</span>` : ''}
            </div>
            <div class="stepper" id="stepper">`;

        $.each(STEPS, function (i, s) {
            html += `
                <div class="step" id="step-${i}">
                    <div class="step-circle"><i class="fas ${s.icon}"></i></div>
                    <p class="step-label">${s.label}</p>
                    ${i < STEPS.length - 1 ? '<div class="step-line"><div class="step-fill"></div></div>' : ''}
                </div>`;
        });
        html += '</div>';

        $('#tracking-result').html(html).removeClass('hidden').hide().slideDown(400);

        // jQuery .addClass('done') / .addClass('active') progressively animated
        $('#stepper .step').each(function (i) {
            const $s = $(this);
            if (i + 1 <= order.step) {
                setTimeout(() => $s.addClass('done'),   i * 220);
            }
            if (i + 1 === order.step) {
                setTimeout(() => $s.addClass('active'), i * 220 + 50);
            }
        });
    }

    $('#order-id-input').on('keypress', e => { if (e.which === 13) $('#track-btn').trigger('click'); });

    // ═══════════════════════════════════════════════════════
    //  CART SIDEBAR
    // ═══════════════════════════════════════════════════════
    function renderCart() {
        const items = Cart.get();
        if (!items.length) {
            $('#cart-items').empty();
            $('#cart-empty').removeClass('hidden');
            $('#cart-footer').addClass('hidden');
            return;
        }
        $('#cart-empty').addClass('hidden');
        $('#cart-footer').removeClass('hidden');

        const $list = $('#cart-items').empty();
        $.each(items, function (_, it) {
            $list.append(`
                <div class="cart-item">
                    <div class="ci-details">
                        <p class="ci-name">${it.name}</p>
                        <p class="ci-generic">${it.generic}</p>
                        ${it.rx ? '<span class="ci-rx"><i class="fas fa-file-prescription"></i> Rx required</span>' : ''}
                    </div>
                    <div class="ci-controls">
                        <button class="qty-btn" data-id="${it.id}" data-delta="-1">−</button>
                        <span>${it.qty}</span>
                        <button class="qty-btn" data-id="${it.id}" data-delta="1">+</button>
                    </div>
                    <div class="ci-right">
                        <span class="ci-price">₹${it.price * it.qty}</span>
                        <button class="ci-del" data-id="${it.id}"><i class="fas fa-trash-can"></i></button>
                    </div>
                </div>`);
        });

        $('#cart-subtotal, #cart-total').text('₹' + Cart.total());
        $('#cart-rx-note').toggle(Cart.hasRxItems());
    }

    function updateBadge() {
        const n = Cart.count();
        $('#cart-count').text(n).toggleClass('visible', n > 0);
    }

    $(document).on('click', '.qty-btn', function () { Cart.changeQty(+$(this).data('id'), +$(this).data('delta')); });
    $(document).on('click', '.ci-del',  function () { Cart.remove(+$(this).data('id')); renderMedicines(filteredMedicines); });

    $('#checkout-btn').on('click', function () {
        if (Cart.hasRxItems() && !rxVerified) {
            closeCart();
            setTimeout(() => openModal('#rx-modal'), 350);
            toast('<i class="fas fa-file-prescription"></i> Please upload your prescription for Rx items first.', 'warning');
            return;
        }
        
        const items = Cart.get();
        if (!items.length) return;
        
        // Open the Checkout Details Modal
        closeCart();
        setTimeout(() => openModal('#checkout-modal'), 350);
    });

    $('#confirm-order-btn').on('click', function () {
        const name = $('#chk-name').val().trim();
        const phone = $('#chk-phone').val().trim();
        const address = $('#chk-address').val().trim();

        if (!name || !phone || !address) {
            toast('Please fill in all delivery details!', 'warning');
            return;
        }

        const items = Cart.get();
        const $btn = $(this).html('<i class="fas fa-spinner fa-spin"></i> Processing…').prop('disabled', true);
        
        $.ajax({
            url: '/api/checkout',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                items: items, 
                total: Cart.total(),
                customer: { name, phone, address, paymentMethod: $('input[name="payment"]:checked').val() }
            }),
            success: function (res) {
                closeModal('#checkout-modal');
                toast(`<i class="fas fa-box"></i> ${res.message}`, 'success');
                Cart.save([]);
                renderCart();
                updateBadge();
                rxVerified = false;
                
                // Reset form
                $('#chk-name, #chk-phone, #chk-address').val('');
                
                // Auto-trigger tracking
                setTimeout(() => {
                    $('#order-id-input').val(res.orderId);
                    $('html,body').animate({ scrollTop: $('#tracking-section').offset().top - 75 }, 600);
                    $('#track-btn').trigger('click');
                }, 1000);
            },
            error: function () {
                toast('<i class="fas fa-circle-xmark"></i> Checkout failed. Please try again.', 'warning');
            },
            complete: function () {
                $btn.html('<i class="fas fa-check"></i> Place Order').prop('disabled', false);
            }
        });
    });

    function openCart()  { $('#cart-sidebar, #cart-overlay').removeClass('hidden'); setTimeout(() => $('#cart-sidebar').addClass('open'), 10); }
    function closeCart() { $('#cart-sidebar').removeClass('open'); setTimeout(() => $('#cart-sidebar, #cart-overlay').addClass('hidden'), 360); }

    $('#open-cart').on('click', openCart);
    $('#close-cart, #cart-overlay').on('click', closeCart);

    // ═══════════════════════════════════════════════════════
    //  MODAL UTILITIES
    // ═══════════════════════════════════════════════════════
    function openModal(sel)  { $(sel).removeClass('hidden'); setTimeout(() => $(sel).addClass('open'), 10); $('body').css('overflow', 'hidden'); }
    function closeModal(sel) { $(sel).removeClass('open'); setTimeout(() => { $(sel).addClass('hidden'); $('body').css('overflow', ''); }, 300); }

    $(document).on('click', '.close-modal', function () { closeModal('#' + $(this).closest('.modal-backdrop').attr('id')); });
    $(document).on('click', '.modal-backdrop', function (e) { if ($(e.target).is('.modal-backdrop')) closeModal('#' + $(this).attr('id')); });

    // ═══════════════════════════════════════════════════════
    //  TOAST
    // ═══════════════════════════════════════════════════════
    let toastTimer;
    function toast(msg, type = 'success') {
        clearTimeout(toastTimer);
        $('#toast').attr('class', `toast toast-${type}`).html(msg).removeClass('hidden').hide().fadeIn(220);
        toastTimer = setTimeout(() => $('#toast').fadeOut(400, () => $('#toast').addClass('hidden')), 3500);
    }

    // ═══════════════════════════════════════════════════════
    //  MISC
    // ═══════════════════════════════════════════════════════
    $(window).on('scroll', function () { $('#site-header').toggleClass('scrolled', $(this).scrollTop() > 8); });
    $('#hero-shop-btn').on('click', () => $('html,body').animate({ scrollTop: $('#main-content').offset().top - 75 }, 600));

    // ═══════════════════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════════════════
    renderCart();
    updateBadge();
    fetchMedicines();   // ← real $.ajax GET /api/medicines
});
