/**
 * MediShop — Online Pharmacy
 * jQuery-powered: Live Search, $.ajax() simulation, $.filter(), localStorage Cart,
 * Drug Interaction Alerts, Prescription Upload, Order Tracking Stepper
 */

$(function () {

    // ═══════════════════════════════════════════════════════
    //  MEDICINES DATABASE  (simulates PHP/MySQL API response)
    // ═══════════════════════════════════════════════════════
    const MEDICINES = [
        { id:1,  name:'Crocin Advance',    generic:'Paracetamol 500mg',        brand:'GSK',         category:'Analgesics',     price:32,  mrp:40,  stock:150, rx:false, icon:'fa-pills',       color:'#2563EB', desc:'Effective pain relief and fever reduction. Suitable for adults and children above 12 years.' },
        { id:2,  name:'Brufen 400',         generic:'Ibuprofen 400mg',           brand:'Abbott',      category:'Analgesics',     price:28,  mrp:35,  stock:0,   rx:false, icon:'fa-pills',       color:'#2563EB', desc:'Anti-inflammatory for pain, swelling and fever. Do not use with Aspirin.' },
        { id:3,  name:'Voveran SR 100',     generic:'Diclofenac 100mg',          brand:'Novartis',    category:'Analgesics',     price:85,  mrp:110, stock:45,  rx:true,  icon:'fa-pills',       color:'#2563EB', desc:'Sustained-release anti-inflammatory for arthritis and musculoskeletal pain.' },
        { id:4,  name:'Disprin Regular',    generic:'Aspirin 350mg',             brand:'Reckitt',     category:'Analgesics',     price:22,  mrp:28,  stock:220, rx:false, icon:'fa-pills',       color:'#2563EB', desc:'Fast relief from headache, toothache, and mild fever. Avoid with Ibuprofen.' },
        { id:5,  name:'Amoxil 500',         generic:'Amoxicillin 500mg',         brand:'GSK',         category:'Antibiotics',    price:120, mrp:150, stock:80,  rx:true,  icon:'fa-capsules',    color:'#7C3AED', desc:'Broad-spectrum antibiotic for bacterial infections. Take full course as prescribed.' },
        { id:6,  name:'Zithromax 500',      generic:'Azithromycin 500mg',        brand:'Pfizer',      category:'Antibiotics',    price:145, mrp:180, stock:60,  rx:true,  icon:'fa-capsules',    color:'#7C3AED', desc:'Macrolide antibiotic for respiratory, ear, and skin infections.' },
        { id:7,  name:'Ciplox 500',         generic:'Ciprofloxacin 500mg',       brand:'Cipla',       category:'Antibiotics',    price:95,  mrp:120, stock:55,  rx:true,  icon:'fa-capsules',    color:'#7C3AED', desc:'Fluoroquinolone antibiotic for urinary tract and GI infections.' },
        { id:8,  name:'Flagyl 400',         generic:'Metronidazole 400mg',       brand:'Abbott',      category:'Antibiotics',    price:45,  mrp:58,  stock:12,  rx:true,  icon:'fa-capsules',    color:'#7C3AED', desc:'Effective against anaerobic bacteria and protozoa. Avoid alcohol.' },
        { id:9,  name:'Pantocid 40',        generic:'Pantoprazole 40mg',         brand:'Sun Pharma',  category:'Antacids',       price:125, mrp:160, stock:95,  rx:true,  icon:'fa-tablets',     color:'#059669', desc:'Proton pump inhibitor for GERD, peptic ulcers and acid reflux.' },
        { id:10, name:'Omez 20',            generic:'Omeprazole 20mg',           brand:"Dr. Reddy's", category:'Antacids',       price:85,  mrp:105, stock:130, rx:false, icon:'fa-tablets',     color:'#059669', desc:'Reduces stomach acid production. Relieves heartburn and indigestion.' },
        { id:11, name:'Rantac 150',         generic:'Ranitidine 150mg',          brand:'J&J',         category:'Antacids',       price:38,  mrp:50,  stock:0,   rx:false, icon:'fa-tablets',     color:'#059669', desc:'H2 blocker for acid reflux and peptic ulcer disease.' },
        { id:12, name:'Digene Gel',         generic:'Antacid Mixture',           brand:'Abbott',      category:'Antacids',       price:55,  mrp:70,  stock:200, rx:false, icon:'fa-tablets',     color:'#059669', desc:'Fast-acting antacid gel for immediate relief from acidity and bloating.' },
        { id:13, name:'Cetirizine 10',      generic:'Cetirizine 10mg',           brand:'Cipla',       category:'Antihistamines', price:18,  mrp:25,  stock:300, rx:false, icon:'fa-wind',        color:'#D97706', desc:'Non-drowsy antihistamine for allergic rhinitis and urticaria.' },
        { id:14, name:'Allegra 120',        generic:'Fexofenadine 120mg',        brand:'Sanofi',      category:'Antihistamines', price:125, mrp:155, stock:75,  rx:false, icon:'fa-wind',        color:'#D97706', desc:'24-hour allergy relief with no sedation. Ideal for seasonal allergies.' },
        { id:15, name:'Claritine 10',       generic:'Loratadine 10mg',           brand:'Bayer',       category:'Antihistamines', price:82,  mrp:100, stock:40,  rx:false, icon:'fa-wind',        color:'#D97706', desc:'Long-acting antihistamine for allergy symptoms and chronic urticaria.' },
        { id:16, name:'Limcee 500',         generic:'Vitamin C 500mg',           brand:'Abbott',      category:'Vitamins',       price:35,  mrp:45,  stock:400, rx:false, icon:'fa-sun',         color:'#F97316', desc:'Chewable Vitamin C for immune support and antioxidant protection.' },
        { id:17, name:'D-Rise 60K',         generic:'Cholecalciferol 60000 IU',  brand:'USV',         category:'Vitamins',       price:110, mrp:140, stock:88,  rx:false, icon:'fa-sun',         color:'#F97316', desc:'Weekly Vitamin D3 supplement for bone health and immunity.' },
        { id:18, name:'Neurobion Forte',    generic:'Vitamin B Complex',         brand:'Merck',       category:'Vitamins',       price:62,  mrp:80,  stock:160, rx:false, icon:'fa-sun',         color:'#F97316', desc:'Comprehensive B vitamins for nerve health and energy metabolism.' },
        { id:19, name:'Revital H',          generic:'Multivitamin + Ginseng',    brand:'Sanofi',      category:'Vitamins',       price:145, mrp:185, stock:110, rx:false, icon:'fa-sun',         color:'#F97316', desc:'Complete multivitamin with ginseng for vitality and daily energy.' },
        { id:20, name:'Lipitor 20',         generic:'Atorvastatin 20mg',         brand:'Pfizer',      category:'Cardiovascular', price:180, mrp:225, stock:70,  rx:true,  icon:'fa-heart-pulse', color:'#DC2626', desc:'Statin for lowering LDL cholesterol and reducing cardiovascular risk.' },
        { id:21, name:'Norvasc 5',          generic:'Amlodipine 5mg',            brand:'Pfizer',      category:'Cardiovascular', price:95,  mrp:120, stock:8,   rx:true,  icon:'fa-heart-pulse', color:'#DC2626', desc:'Calcium channel blocker for hypertension and stable angina.' },
        { id:22, name:'Betaloc 50',         generic:'Metoprolol 50mg',           brand:'AstraZeneca', category:'Cardiovascular', price:65,  mrp:82,  stock:55,  rx:true,  icon:'fa-heart-pulse', color:'#DC2626', desc:'Beta-blocker for high blood pressure, heart failure, and angina.' },
        { id:23, name:'Glucophage 500',     generic:'Metformin 500mg',           brand:'Merck',       category:'Diabetes',       price:55,  mrp:70,  stock:200, rx:true,  icon:'fa-droplet',     color:'#0891B2', desc:'First-line medication for Type 2 diabetes. Controls blood glucose levels.' },
        { id:24, name:'Glynase 5',          generic:'Glipizide 5mg',             brand:'Pfizer',      category:'Diabetes',       price:78,  mrp:98,  stock:65,  rx:true,  icon:'fa-droplet',     color:'#0891B2', desc:'Sulfonylurea for Type 2 diabetes that stimulates insulin secretion.' },
    ];

    // ═══════════════════════════════════════════════════════
    //  DRUG INTERACTIONS  (triggers jQuery .modal() warning)
    // ═══════════════════════════════════════════════════════
    const INTERACTIONS = [
        {
            ids: [2, 4], level: 'high',
            title: 'NSAID Combination — High Risk',
            message: 'Taking <strong>Ibuprofen</strong> and <strong>Aspirin</strong> together significantly increases the risk of gastrointestinal bleeding and ulcers. The combination also reduces the cardioprotective benefit of low-dose aspirin.',
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
            message: 'High-dose <strong>Aspirin</strong> may reduce the effectiveness of <strong>Atorvastatin</strong>. Concurrent use also increases bleeding risk.',
            advice: 'Low-dose aspirin is generally safe with statins, but please inform your doctor.'
        },
    ];

    // ═══════════════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════════════
    let allMedicines       = [];
    let filteredMedicines  = [];
    let activeCategory     = 'all';
    let pendingItem        = null;   // medicine waiting for interaction acknowledgement

    // ═══════════════════════════════════════════════════════
    //  CART  — localStorage persistence
    // ═══════════════════════════════════════════════════════
    const Cart = {
        KEY: 'medishop_cart_v2',

        get()          { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); },
        save(items)    { localStorage.setItem(this.KEY, JSON.stringify(items)); },
        getIds()       { return this.get().map(i => i.id); },
        count()        { return this.get().reduce((s, i) => s + i.qty, 0); },
        total()        { return this.get().reduce((s, i) => s + i.price * i.qty, 0); },
        hasRxItems()   { return this.get().some(i => i.rx); },

        add(med) {
            const items    = this.get();
            const existing = items.find(i => i.id === med.id);
            if (existing) { existing.qty = Math.min(existing.qty + 1, 20); }
            else { items.push({ id: med.id, name: med.name, generic: med.generic, price: med.price, rx: med.rx, qty: 1 }); }
            this.save(items);
            renderCart();
            updateBadge();
        },

        remove(id) {
            this.save(this.get().filter(i => i.id !== id));
            renderCart();
            updateBadge();
        },

        changeQty(id, delta) {
            const items = this.get();
            const item  = items.find(i => i.id === id);
            if (!item) return;
            item.qty = Math.max(1, Math.min(20, item.qty + delta));
            this.save(items);
            renderCart();
        },
    };

    // ═══════════════════════════════════════════════════════
    //  SIMULATED $.ajax()  (replaces real PHP/MySQL backend)
    // ═══════════════════════════════════════════════════════
    function fetchMedicines() {
        $.ajax({
            url: '#api/medicines',   // ← replace with real endpoint
            type: 'GET',
            beforeSend: function () {
                $('#product-grid').html(
                    Array(6).fill('<div class="skeleton-card"><div class="sk-top"></div><div class="sk-body"><div class="sk-line w60"></div><div class="sk-line w40"></div><div class="sk-line w80"></div></div><div class="sk-footer"></div></div>').join('')
                );
            },
            complete: function () {
                // Simulated 800ms network delay then inject local data
                setTimeout(function () {
                    allMedicines      = MEDICINES;
                    filteredMedicines = [...allMedicines];
                    buildBrandFilters();
                    applyFilters();
                }, 800);
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    //  RENDER MEDICINE CARDS
    // ═══════════════════════════════════════════════════════
    function renderMedicines(list) {
        const $grid  = $('#product-grid').empty();
        const cartIds = Cart.getIds();

        if (!list.length) { $('#no-results').removeClass('hidden'); return; }
        $('#no-results').addClass('hidden');

        $.each(list, function (_, m) {
            const disc = Math.round(((m.mrp - m.price) / m.mrp) * 100);
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
                        <div class="cat-icon" style="color:${m.color};background:${m.color}18">
                            <i class="fas ${m.icon}"></i>
                        </div>
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
                            <button class="btn-info" data-id="${m.id}" title="View Details"><i class="fas fa-circle-info"></i></button>
                            ${actionHtml}
                        </div>
                    </div>
                </div>`;

            // jQuery .fadeIn() animation on each card
            $(card).hide().appendTo($grid).fadeIn(250 + Math.random() * 200);
        });

        updateResultsCount(list.length);
    }

    function updateResultsCount(n) {
        $('#results-count').text(`Showing ${n} medicine${n !== 1 ? 's' : ''}`);
    }

    // ═══════════════════════════════════════════════════════
    //  BUILD BRAND CHECKBOXES  (dynamic from data)
    // ═══════════════════════════════════════════════════════
    function buildBrandFilters() {
        const brands = [...new Set(MEDICINES.map(m => m.brand))].sort();
        const $c = $('#brand-filters').empty();
        $.each(brands, function (_, b) {
            $c.append(`<label class="filter-check"><input type="checkbox" class="brand-cb" value="${b}"> ${b}</label>`);
        });
        // Re-bind since we recreated DOM nodes
        $(document).off('change', '.brand-cb').on('change', '.brand-cb', applyFilters);
    }

    // ═══════════════════════════════════════════════════════
    //  APPLY ALL FILTERS  — jQuery .filter() approach
    // ═══════════════════════════════════════════════════════
    function applyFilters() {
        const q         = $('#live-search').val().toLowerCase().trim();
        const maxPrice  = parseInt($('#price-range').val());
        const inStock   = $('#in-stock-only').is(':checked');
        const otcOnly   = $('#otc-only').is(':checked');
        const brands    = $('.brand-cb:checked').map(function () { return $(this).val(); }).get();

        // jQuery-style multi-criteria .filter()
        filteredMedicines = allMedicines.filter(function (m) {
            if (activeCategory !== 'all' && m.category !== activeCategory) return false;
            if (q && !m.name.toLowerCase().includes(q) && !m.generic.toLowerCase().includes(q) && !m.brand.toLowerCase().includes(q)) return false;
            if (brands.length && !brands.includes(m.brand)) return false;
            if (m.price > maxPrice) return false;
            if (inStock && m.stock === 0) return false;
            if (otcOnly  && m.rx) return false;
            return true;
        });

        // Sort
        const sort = $('#sort-select').val();
        if      (sort === 'price-asc')  filteredMedicines.sort((a, b) => a.price - b.price);
        else if (sort === 'price-desc') filteredMedicines.sort((a, b) => b.price - a.price);
        else if (sort === 'name')       filteredMedicines.sort((a, b) => a.name.localeCompare(b.name));
        else if (sort === 'discount')   filteredMedicines.sort((a, b) => (b.mrp - b.price) - (a.mrp - a.price));

        renderMedicines(filteredMedicines);
    }

    // ═══════════════════════════════════════════════════════
    //  LIVE SEARCH  — suggestions dropdown
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
        const m = MEDICINES.find(x => x.id === +$(this).data('id'));
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
    //  SIDEBAR FILTER EVENTS
    // ═══════════════════════════════════════════════════════
    $('#sort-select, #in-stock-only, #otc-only').on('change', applyFilters);

    $('#price-range').on('input', function () {
        $('#price-max-label').text('₹' + $(this).val());
        applyFilters();
    });

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
    //  ADD TO CART  — with drug interaction check (jQuery .modal())
    // ═══════════════════════════════════════════════════════
    $(document).on('click', '.btn-add', function () {
        if ($(this).hasClass('added')) return;
        const id  = +$(this).data('id');
        const med = MEDICINES.find(m => m.id === id);
        if (!med || med.stock === 0) return;

        // Check for drug interaction with items already in cart
        const cartIds     = Cart.getIds();
        const interaction = INTERACTIONS.find(ix =>
            ix.ids.includes(id) && ix.ids.some(oid => oid !== id && cartIds.includes(oid))
        );

        if (interaction) {
            pendingItem = med;
            const otherMed = MEDICINES.find(m => interaction.ids.includes(m.id) && m.id !== id);
            $('#interaction-body').html(`
                <div class="ia-alert ia-${interaction.level}">
                    <div class="ia-pills">
                        <span class="ia-pill">${otherMed ? otherMed.name : 'Cart item'}</span>
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
        renderMedicines(filteredMedicines);  // refresh cards (re-disables "Add" button)
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
        const m = MEDICINES.find(x => x.id === +$(this).data('id'));
        if (!m) return;
        const disc = Math.round(((m.mrp - m.price) / m.mrp) * 100);
        let stockHtml;
        if (m.stock === 0)       stockHtml = '<span class="stock out"><i class="fas fa-circle-xmark"></i> Out of Stock</span>';
        else if (m.stock <= 15)  stockHtml = `<span class="stock low"><i class="fas fa-circle-exclamation"></i> Only ${m.stock} left</span>`;
        else                     stockHtml = '<span class="stock in"><i class="fas fa-circle-check"></i> In Stock</span>';

        $('#detail-title').text(m.name);
        $('#detail-body').html(`
            <div class="detail-wrap">
                <div class="detail-icon" style="background:${m.color}15;color:${m.color}">
                    <i class="fas ${m.icon} fa-3x"></i>
                </div>
                <div class="detail-info">
                    <div class="detail-badges">
                        ${m.rx ? '<span class="badge rx"><i class="fas fa-file-prescription"></i> Prescription Required</span>' : '<span class="badge otc">Over The Counter</span>'}
                        <span class="badge cat-badge" style="background:${m.color}18;color:${m.color}">${m.category}</span>
                    </div>
                    <p><strong>Generic Name:</strong> ${m.generic}</p>
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
    //  NOTIFY ME  (out-of-stock form)
    // ═══════════════════════════════════════════════════════
    $(document).on('click', '.btn-notify', function () {
        const m = MEDICINES.find(x => x.id === +$(this).data('id'));
        if (m) $('#notify-med-name').html(`<strong>${m.name}</strong> &mdash; ${m.generic}`);
        $('#notify-email, #notify-phone').val('');
        openModal('#notify-modal');
    });

    $('#notify-submit').on('click', function () {
        if (!$('#notify-email').val().trim() && !$('#notify-phone').val().trim()) {
            toast('<i class="fas fa-circle-exclamation"></i> Please enter your email or phone.', 'warning');
            return;
        }
        const $btn = $(this).html('<i class="fas fa-spinner fa-spin"></i> Saving…').prop('disabled', true);
        setTimeout(() => {
            closeModal('#notify-modal');
            toast('<i class="fas fa-bell"></i> You\'ll be notified when this medicine is back in stock!', 'success');
            $btn.html('<i class="fas fa-bell"></i> Notify Me').prop('disabled', false);
        }, 1200);
    });

    // ═══════════════════════════════════════════════════════
    //  PRESCRIPTION UPLOAD
    // ═══════════════════════════════════════════════════════
    $('#open-rx-modal, #hero-rx-btn').on('click', () => openModal('#rx-modal'));

    // File selected via browse
    $('#rx-file-input').on('change', function () { handleRxFile(this.files[0]); });

    // Drag & drop
    const $dz = $('#rx-drop-zone');
    $dz.on('dragover dragenter', function (e) { e.preventDefault(); $(this).addClass('drag-over'); })
       .on('dragleave drop', function (e) {
            $(this).removeClass('drag-over');
            if (e.type === 'drop') { e.preventDefault(); handleRxFile(e.originalEvent.dataTransfer.files[0]); }
        });

    function handleRxFile(file) {
        $('#rx-error').addClass('hidden').empty();
        $('#rx-preview').addClass('hidden').empty();
        $('#submit-rx').prop('disabled', true);
        if (!file) return;

        // Validate type
        if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)) {
            $('#rx-error').html('<i class="fas fa-circle-exclamation"></i> Invalid file. Please upload JPG, PNG or PDF.').removeClass('hidden');
            return;
        }
        // Validate size  (5 MB max)
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
                        <div class="rx-img-meta"><p class="rx-fname">${file.name}</p><p class="rx-fsize">${(file.size/1024).toFixed(1)} KB · Image</p></div>
                    </div>`).removeClass('hidden').hide().slideDown(200);
            };
            reader.readAsDataURL(file);
        }
        $('#submit-rx').prop('disabled', false);
    }

    $('#submit-rx').on('click', function () {
        const $btn = $(this).html('<i class="fas fa-spinner fa-spin"></i> Uploading…').prop('disabled', true);
        setTimeout(() => {
            closeModal('#rx-modal');
            $('#rx-file-input').val('');
            $('#rx-preview, #rx-error').addClass('hidden').empty();
            $btn.html('<i class="fas fa-paper-plane"></i> Submit Prescription').prop('disabled', false);
            toast('<i class="fas fa-circle-check"></i> Prescription uploaded! Our pharmacist will verify it shortly.', 'success');
        }, 1800);
    });

    // ═══════════════════════════════════════════════════════
    //  ORDER TRACKING STEPPER  — jQuery .addClass() animation
    // ═══════════════════════════════════════════════════════
    const ORDERS = {
        'MS-2024-001': { step: 3, items: 'Crocin Advance, Limcee 500',         date: 'Apr 12, 2026' },
        'MS-2024-002': { step: 5, items: 'Pantocid 40, Glucophage 500',         date: 'Apr 10, 2026' },
        'MS-2024-003': { step: 1, items: 'Allegra 120',                          date: 'Apr 14, 2026' },
        DEMO:          { step: 2, items: 'Demo Order — MediShop',                date: 'Apr 14, 2026' },
    };

    const STEPS = [
        { label: 'Order Placed',      icon: 'fa-receipt' },
        { label: 'Pharmacy Verified', icon: 'fa-user-doctor' },
        { label: 'Packed',            icon: 'fa-box' },
        { label: 'Shipped',           icon: 'fa-truck' },
        { label: 'Delivered',         icon: 'fa-house' },
    ];

    $('#track-btn').on('click', function () {
        const id = $('#order-id-input').val().trim().toUpperCase();
        if (!id) { toast('<i class="fas fa-circle-exclamation"></i> Please enter an order ID.', 'warning'); return; }

        const $btn = $(this).html('<i class="fas fa-spinner fa-spin"></i>').prop('disabled', true);
        setTimeout(function () {
            $btn.html('<i class="fas fa-location-arrow"></i> Track').prop('disabled', false);
            const order = ORDERS[id];
            if (!order) {
                $('#tracking-result').html(`
                    <div class="track-error">
                        <i class="fas fa-magnifying-glass-minus"></i>
                        <p>Order <strong>${id}</strong> not found. Try <strong>MS-2024-001</strong>, <strong>MS-2024-002</strong>, or <strong>DEMO</strong>.</p>
                    </div>`).removeClass('hidden').hide().slideDown(300);
                return;
            }

            let html = `
                <div class="track-meta">
                    <span><i class="fas fa-hashtag"></i> ${id}</span>
                    <span><i class="fas fa-box"></i> ${order.items}</span>
                    <span><i class="fas fa-calendar"></i> ${order.date}</span>
                </div>
                <div class="stepper" id="stepper">`;

            $.each(STEPS, function (i, s) {
                const done   = i + 1 <= order.step;
                const active = i + 1 === order.step;
                html += `
                    <div class="step${done ? ' done' : ''}${active ? ' active' : ''}" id="step-${i}">
                        <div class="step-circle"><i class="fas ${s.icon}"></i></div>
                        <p class="step-label">${s.label}</p>
                        ${i < STEPS.length - 1 ? '<div class="step-line"><div class="step-fill"></div></div>' : ''}
                    </div>`;
            });
            html += '</div>';

            $('#tracking-result').html(html).removeClass('hidden').hide().slideDown(400);

            // Animate steps with jQuery .addClass() progressively
            $('#stepper .step').removeClass('done active').each(function (i) {
                const $s = $(this);
                if (i + 1 <= order.step) {
                    setTimeout(() => $s.addClass('done'), i * 220);
                }
                if (i + 1 === order.step) {
                    setTimeout(() => $s.addClass('active'), i * 220 + 50);
                }
            });
        }, 900);
    });

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

        const total = Cart.total();
        $('#cart-subtotal, #cart-total').text('₹' + total);
        $('#cart-rx-note').toggle(Cart.hasRxItems());
    }

    function updateBadge() {
        const n = Cart.count();
        $('#cart-count').text(n).toggleClass('visible', n > 0);
    }

    $(document).on('click', '.qty-btn', function () {
        Cart.changeQty(+$(this).data('id'), +$(this).data('delta'));
    });
    $(document).on('click', '.ci-del', function () {
        Cart.remove(+$(this).data('id'));
        renderMedicines(filteredMedicines);
    });

    $('#checkout-btn').on('click', function () {
        if (Cart.hasRxItems()) {
            closeCart();
            setTimeout(() => openModal('#rx-modal'), 350);
            toast('<i class="fas fa-file-prescription"></i> Please upload your prescription for Rx items first.', 'warning');
        } else {
            toast('<i class="fas fa-lock"></i> Redirecting to payment gateway…', 'success');
        }
    });

    function openCart() {
        $('#cart-sidebar, #cart-overlay').removeClass('hidden');
        setTimeout(() => $('#cart-sidebar').addClass('open'), 10);
    }
    function closeCart() {
        $('#cart-sidebar').removeClass('open');
        setTimeout(() => $('#cart-sidebar, #cart-overlay').addClass('hidden'), 360);
    }

    $('#open-cart').on('click', openCart);
    $('#close-cart, #cart-overlay').on('click', closeCart);

    // ═══════════════════════════════════════════════════════
    //  MODAL UTILITIES
    // ═══════════════════════════════════════════════════════
    function openModal(sel) {
        $(sel).removeClass('hidden');
        setTimeout(() => $(sel).addClass('open'), 10);
        $('body').css('overflow', 'hidden');
    }
    function closeModal(sel) {
        $(sel).removeClass('open');
        setTimeout(() => { $(sel).addClass('hidden'); $('body').css('overflow', ''); }, 300);
    }

    $(document).on('click', '.close-modal', function () {
        const $backdrop = $(this).closest('.modal-backdrop');
        closeModal('#' + $backdrop.attr('id'));
    });
    $(document).on('click', '.modal-backdrop', function (e) {
        if ($(e.target).is('.modal-backdrop')) closeModal('#' + $(this).attr('id'));
    });

    // ═══════════════════════════════════════════════════════
    //  TOAST NOTIFICATION
    // ═══════════════════════════════════════════════════════
    let toastTimer;
    function toast(msg, type = 'success') {
        clearTimeout(toastTimer);
        $('#toast').attr('class', `toast toast-${type}`).html(msg).removeClass('hidden').hide().fadeIn(220);
        toastTimer = setTimeout(() => $('#toast').fadeOut(400, () => $('#toast').addClass('hidden')), 3500);
    }

    // ═══════════════════════════════════════════════════════
    //  STICKY HEADER SHADOW
    // ═══════════════════════════════════════════════════════
    $(window).on('scroll', function () {
        $('#site-header').toggleClass('scrolled', $(this).scrollTop() > 8);
    });

    // Hero → scroll to shop
    $('#hero-shop-btn').on('click', () =>
        $('html,body').animate({ scrollTop: $('#main-content').offset().top - 75 }, 600)
    );

    // ═══════════════════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════════════════
    renderCart();
    updateBadge();
    fetchMedicines();   // Simulated $.ajax() call to backend
});
