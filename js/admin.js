// =============================================
// DOGFATHERS PLUS — ADMIN.JS
// =============================================

// =============================================
// GROOMER MANAGEMENT FUNCTIONS (Admin)
// =============================================

// Render individual groomer card for admin panel
function renderGroomerCard(g) {
    const initials = (g.full_name || 'G').split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
    const specialtyLabels = (g.specialties || []).map(s => {
        const spec = GROOMER_SPECIALTIES.find(sp => sp.id === s);
        return spec ? spec.label : s;
    });
    
    const regionLabels = (g.service_regions || []).map(rId => {
        const region = serviceRegions.find(r => r.id === rId);
        return region ? region.name : rId;
    });
    
    return `
    <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all ${g.is_active === false ? 'opacity-60' : ''}">
        <div class="p-6">
            <!-- Header -->
            <div class="flex items-start gap-4 mb-4">
                <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/25">
                    ${initials}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-lg font-bold text-slate-900 dark:text-white truncate">${g.full_name || 'Groomer'}</h3>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${g.is_active !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}">
                            <span class="w-1.5 h-1.5 rounded-full ${g.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
                            ${g.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div class="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <a href="mailto:${g.email}" class="hover:text-primary flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-sm">email</span>${escapeHtml(g.email)}
                        </a>
                        ${g.phone ? `
                        <a href="tel:${g.phone}" class="hover:text-primary flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-sm">phone</span>${escapeHtml(g.phone)}
                        </a>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Hired Date -->
            ${g.hired_date ? `
            <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                <span class="material-symbols-outlined text-sm">calendar_month</span>
                Hired: ${new Date(g.hired_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>` : ''}
            
            <!-- Specialties -->
            ${specialtyLabels.length > 0 ? `
            <div class="flex flex-wrap gap-2 mb-4">
                ${specialtyLabels.map(s => `
                    <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                        ${s}
                    </span>
                `).join('')}
            </div>` : ''}
            
            <!-- Coverage Regions -->
            ${regionLabels.length > 0 ? `
            <div class="flex flex-wrap gap-1.5 mb-4">
                <span class="material-symbols-outlined text-blue-500 text-sm mr-0.5">location_on</span>
                ${regionLabels.map(r => `
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-xs font-medium text-blue-700 dark:text-blue-300">
                        ${r}
                    </span>
                `).join('')}
            </div>` : `
            <div class="flex items-center gap-1.5 mb-4 text-xs text-amber-600 dark:text-amber-400">
                <span class="material-symbols-outlined text-sm">warning</span>
                No coverage regions assigned
            </div>
            `}
            
            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-background-dark rounded-xl mb-4">
                <div class="text-center">
                    <p class="text-2xl font-bold text-slate-900 dark:text-white">${g.appointmentsThisMonth || 0}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Appointments</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$${(g.revenueThisMonth || 0).toFixed(0)}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Revenue</p>
                </div>
            </div>
            
            <!-- Admin Notes (if any) -->
            ${g.admin_notes ? `
            <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4">
                <p class="text-xs text-amber-800 dark:text-amber-200">
                    <span class="font-semibold">Notes:</span> ${g.admin_notes}
                </p>
            </div>` : ''}
        </div>
        
        <!-- Actions -->
        <div class="px-6 py-4 bg-slate-50 dark:bg-background-dark border-t border-slate-100 dark:border-border-dark flex gap-2">
            <button onclick="openEditGroomerModal('${g.id}')" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition-all">
                <span class="material-symbols-outlined text-lg">edit</span>Edit
            </button>
            <button onclick="openGroomerScheduleModal('${g.id}')" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition-all">
                <span class="material-symbols-outlined text-lg">calendar_today</span>Schedule
            </button>
            <button onclick="toggleGroomerActive('${g.id}', ${g.is_active !== false})" class="flex items-center justify-center px-3 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm font-medium ${g.is_active !== false ? 'text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'} transition-all" title="${g.is_active !== false ? 'Deactivate' : 'Reactivate'}">
                <span class="material-symbols-outlined text-lg">${g.is_active !== false ? 'person_off' : 'person_add'}</span>
            </button>
        </div>
    </div>`;
}

// Render Add Groomer Modal
function renderAddGroomerModal() {
    if (!state.showAddGroomerModal) return '';
    
    return `
    <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onmousedown="if(event.target === this) closeAddGroomerModal()">
        <div class="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onclick="event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center sticky top-0 bg-white dark:bg-surface-dark z-10">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                        <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400">person_add</span>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Add New Groomer</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Create login credentials for your groomer</p>
                    </div>
                </div>
                <button onmousedown="if(event.target === this) closeAddGroomerModal()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-slate-400">close</span>
                </button>
            </div>
            
            <form id="add-groomer-form" class="p-6 space-y-5">
                <!-- Full Name -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name *</label>
                    <input type="text" id="groomer-name" required
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                        placeholder="Rosa Martinez">
                </div>
                
                <!-- Email -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email * <span class="font-normal text-slate-400">(used for login)</span></label>
                    <input type="email" id="groomer-email-input" required
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                        placeholder="rosa@dogfathersplus.com">
                </div>
                
                <!-- Password -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password * <span class="font-normal text-slate-400">(share with groomer)</span></label>
                    <div class="relative">
                        <input type="password" id="groomer-password-input" required minlength="6"
                            class="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                            placeholder="••••••••">
                        <button type="button" onclick="toggleGroomerPasswordVisibility()" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                            <span class="material-symbols-outlined" id="groomer-password-toggle">visibility</span>
                        </button>
                    </div>
                    <p class="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">warning</span>
                        Write this down! You won't be able to see it again.
                    </p>
                </div>
                
                <!-- Phone -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                    <input type="tel" id="groomer-phone-input"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                        placeholder="(555) 123-4567">
                </div>
                
                <!-- Hired Date -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hired Date</label>
                    <input type="date" id="groomer-hired-date"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                        value="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <!-- Specialties -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Specialties</label>
                    <div class="grid grid-cols-2 gap-2">
                        ${GROOMER_SPECIALTIES.map(s => `
                            <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-border-dark hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 cursor-pointer transition-all">
                                <input type="checkbox" name="groomer-specialty" value="${s.id}" class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500">
                                <span class="text-sm text-slate-700 dark:text-slate-300">${s.icon} ${s.label}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Coverage Regions -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Coverage Regions</label>
                    <div class="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                        ${serviceRegions.map(r => `
                            <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-border-dark hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-all">
                                <input type="checkbox" name="groomer-region" value="${r.id}" class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                                <div>
                                    <span class="text-sm font-medium text-slate-700 dark:text-slate-300">${escapeHtml(r.name)}</span>
                                    <p class="text-xs text-slate-400">${(r.cities || []).slice(0, 3).join(', ')}${(r.cities || []).length > 3 ? '...' : ''}</p>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Weekly Availability -->
                ${renderAdminAvailabilitySection('add-groomer', null)}
                
                <!-- Admin Notes -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Admin Notes <span class="font-normal text-slate-400">(internal only)</span></label>
                    <textarea id="groomer-admin-notes" rows="2"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all resize-none"
                        placeholder="Available Mon-Fri, prefers morning shifts..."></textarea>
                </div>
                
                <!-- Submit Button -->
                <button type="submit" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25">
                    <span class="material-symbols-outlined">person_add</span>
                    Add Groomer
                </button>
            </form>
        </div>
    </div>`;
}

// =============================================
// ADMIN ADD APPOINTMENT MODAL
// =============================================

function openAdminAddAppointment() {
    state.showAdminAddAppointment = true;
    state.adminAppointmentStep = 1;
    state.adminCustomerSearch = '';
    state.adminCustomerSearchResults = [];
    state.adminSelectedCustomer = null;
    state.adminSelectedPet = null;
    state.adminNewCustomer = null;
    state.adminNewPet = null;
    state.adminSmartSlots = null;
    state.adminSelectedSlot = null;
    state.adminManualBooking = false;
    state.adminBookingWeekOffset = 0;
    render();
}

function closeAdminAddAppointment() {
    state.showAdminAddAppointment = false;
    state.adminAppointmentStep = 1;
    state.adminCustomerSearch = '';
    state.adminCustomerSearchResults = [];
    state.adminSelectedCustomer = null;
    state.adminSelectedPet = null;
    state.adminNewCustomer = null;
    state.adminNewPet = null;
    state.adminSmartSlots = null;
    state.adminSelectedSlot = null;
    state.adminManualBooking = false;
    state.adminBookingWeekOffset = 0;
    state.customerBookingRegion = null;
    render();
}

// Search customers by phone or name
async function searchCustomersForAppointment(query) {
    state.adminCustomerSearch = query;
    
    if (!query || query.length < 2) {
        state.adminCustomerSearchResults = [];
        const container = document.getElementById('admin-customer-search-results');
        if (container) container.innerHTML = '';
        return;
    }
    
    try {
        // Search by phone or name
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('id, full_name, email, phone, address, city, zip_code')
            .or(`phone.ilike.%${query}%,full_name.ilike.%${query}%`)
            .neq('role', 'admin')
            .neq('role', 'groomer')
            .limit(10);
        
        if (error) {
            console.error('Customer search error:', error);
            state.adminCustomerSearchResults = [];
        } else {
            state.adminCustomerSearchResults = data || [];
        }
        
        // Update only the results container, not the full page
        const container = document.getElementById('admin-customer-search-results');
        if (container) {
            const results = state.adminCustomerSearchResults;
            if (results.length > 0) {
                container.innerHTML = `
                    <p class="text-sm text-slate-500">Found ${results.length} customer(s):</p>
                    ${results.map(c => `
                        <button onclick="selectCustomerForAppointment('${c.id}')" class="w-full p-4 rounded-xl border border-slate-200 dark:border-border-dark hover:border-primary hover:bg-primary/5 text-left transition-all">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span class="material-symbols-outlined text-primary">person</span>
                                </div>
                                <div class="flex-1">
                                    <p class="font-bold text-slate-900 dark:text-white">${c.full_name}</p>
                                    <p class="text-sm text-slate-500">${escapeHtml(c.phone || 'No phone')} ${c.email ? '• ' + c.email : ''}</p>
                                    ${c.address ? `<p class="text-xs text-slate-400">${escapeHtml(c.address)}, ${escapeHtml(c.city || '')}</p>` : ''}
                                </div>
                                <span class="material-symbols-outlined text-slate-400">chevron_right</span>
                            </div>
                        </button>
                    `).join('')}
                `;
                container.className = 'space-y-2';
            } else {
                container.innerHTML = `
                    <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">person_off</span>
                    <p class="text-slate-500">No customers found matching "${escapeHtml(query)}"</p>
                `;
                container.className = 'text-center py-8';
            }
        }
    } catch (err) {
        console.error('Search failed:', err);
        state.adminCustomerSearchResults = [];
        render();
    }
}

// Select an existing customer
async function selectCustomerForAppointment(customerId) {
    const customer = state.adminCustomerSearchResults.find(c => c.id === customerId);
    if (!customer) return;
    
    state.adminSelectedCustomer = customer;
    state.adminNewCustomer = null;
    state.adminCustomerSearchResults = [];
    
    // Load this customer's pets
    try {
        const { data: pets } = await supabaseClient
            .from('pets')
            .select('*')
            .eq('owner_id', customerId)
            .eq('is_active', true);
        
        state.adminSelectedCustomer.pets = pets || [];
    } catch (err) {
        console.error('Failed to load pets:', err);
        state.adminSelectedCustomer.pets = [];
    }
    
    state.adminAppointmentStep = 2;
    render();
}

// Start creating a new customer inline
function startNewCustomerForAppointment() {
    state.adminNewCustomer = {
        full_name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        zip_code: ''
    };
    state.adminSelectedCustomer = null;
    state.adminCustomerSearchResults = [];
    render();
}

// Save the new customer and move to pet step
async function saveNewCustomerAndContinue() {
    const nameEl = document.getElementById('new-customer-name');
    const phoneEl = document.getElementById('new-customer-phone');
    const emailEl = document.getElementById('new-customer-email');
    const addressEl = document.getElementById('new-customer-address');
    const cityEl = document.getElementById('new-customer-city');
    const zipEl = document.getElementById('new-customer-zip');
    
    const name = nameEl?.value?.trim();
    const phone = phoneEl?.value?.trim();
    const email = emailEl?.value?.trim() || null;
    const address = addressEl?.value?.trim();
    const city = cityEl?.value?.trim();
    const zip = zipEl?.value?.trim();
    
    // Validation
    if (!name) {
        showToast('Customer name is required', 'error');
        return;
    }
    if (!phone) {
        showToast('Phone number is required', 'error');
        return;
    }
    if (!address || !city) {
        showToast('Address and city are required for scheduling', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Check if phone already exists
        const { data: existing } = await supabaseClient
            .from('profiles')
            .select('id, full_name')
            .eq('phone', phone)
            .maybeSingle();
        
        if (existing) {
            hideLoading();
            showToast(`Phone number already exists for ${existing.full_name}. Please select them from search.`, 'error');
            return;
        }
        
        // Generate a UUID for admin-created customer (no auth account)
        const newId = crypto.randomUUID();
        
        // Create the customer profile (without auth - admin created)
        const { data: newCustomer, error } = await supabaseClient
            .from('profiles')
            .insert({
                id: newId,
                full_name: name,
                phone: phone,
                email: email,
                address: address,
                city: city,
                zip_code: zip,
                role: 'customer',
                created_by_admin: true,
                loyalty_points: 0
            })
            .select()
            .single();
        
        if (error) {
            hideLoading();
            console.error('Failed to create customer:', error);
            showToast('Failed to create customer: ' + error.message, 'error');
            return;
        }
        
        state.adminSelectedCustomer = {
            ...newCustomer,
            pets: []
        };
        state.adminNewCustomer = null;
        state.adminAppointmentStep = 2;
        
        hideLoading();
        showToast('Customer created successfully!', 'success');
        render();
        
    } catch (err) {
        hideLoading();
        console.error('Error creating customer:', err);
        showToast('Failed to create customer', 'error');
    }
}

// Select an existing pet
function selectPetForAppointment(petId) {
    const pet = state.adminSelectedCustomer?.pets?.find(p => p.id === petId);
    if (!pet) return;
    
    state.adminSelectedPet = pet;
    state.adminNewPet = null;
    state.adminAppointmentStep = 3;
    render();
}

// Start creating a new pet inline
function startNewPetForAppointment() {
    state.adminNewPet = {
        name: '',
        breed: '',
        weight: '',
        grooming_notes: ''
    };
    state.adminSelectedPet = null;
    render();
}

// Save new pet and continue to appointment
async function saveNewPetAndContinue() {
    const nameEl = document.getElementById('new-pet-name');
    const breedEl = document.getElementById('new-pet-breed');
    const weightEl = document.getElementById('new-pet-weight');
    const notesEl = document.getElementById('new-pet-notes');
    
    const name = nameEl?.value?.trim();
    const breed = breedEl?.value?.trim();
    const weight = weightEl?.value?.trim();
    const notes = notesEl?.value?.trim();
    
    if (!name) {
        showToast('Pet name is required', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const { data: newPet, error } = await supabaseClient
            .from('pets')
            .insert({
                owner_id: state.adminSelectedCustomer.id,
                name: name,
                breed: breed || null,
                weight: weight ? parseFloat(weight) : null,
                grooming_notes: notes || null,
                is_active: true
            })
            .select()
            .single();
        
        if (error) {
            hideLoading();
            showToast('Failed to create pet: ' + error.message, 'error');
            return;
        }
        
        state.adminSelectedPet = newPet;
        state.adminNewPet = null;
        state.adminAppointmentStep = 3;
        
        hideLoading();
        showToast('Pet added successfully!', 'success');
        render();
        
    } catch (err) {
        hideLoading();
        console.error('Error creating pet:', err);
        showToast('Failed to create pet', 'error');
    }
}

// Go back a step
function adminAppointmentBack() {
    if (state.adminAppointmentStep > 1) {
        state.adminAppointmentStep--;
        if (state.adminAppointmentStep === 1) {
            state.adminSelectedPet = null;
            state.adminNewPet = null;
        }
        render();
    }
}

// Create the appointment
async function createAdminAppointment(event) {
    event.preventDefault();
    
    const dateEl = document.getElementById('admin-appt-date');
    const timeEl = document.getElementById('admin-appt-time');
    const serviceEl = document.getElementById('admin-appt-service');
    const groomerEl = document.getElementById('admin-appt-groomer');
    const priceEl = document.getElementById('admin-appt-price');
    const notesEl = document.getElementById('admin-appt-notes');
    
    const date = dateEl?.value;
    const time = timeEl?.value;
    const serviceId = serviceEl?.value;
    const groomerId = groomerEl?.value;
    const price = priceEl?.value;
    const notes = notesEl?.value?.trim();
    
    if (!date || !time || !groomerId) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const customer = state.adminSelectedCustomer;
        const pet = state.adminSelectedPet;
        const service = state.services.find(s => s.id === serviceId);
        
        // Geocode the address
        let latitude = null, longitude = null;
        if (customer.address && customer.city) {
            const coords = await geocodeAddress(customer.address, customer.city, 'CA', customer.zip_code);
            if (coords) {
                latitude = coords.latitude;
                longitude = coords.longitude;
            }
        }
        
        const appointmentData = {
            customer_id: customer.id,
            pet_id: pet.id,
            appointment_date: date,
            start_time: time,
            duration_minutes: service?.duration_minutes || 120,
            service_id: serviceId && serviceId.length > 10 ? serviceId : null,
            service_address: customer.address,
            service_city: customer.city,
            service_state: 'CA',
            service_zip: customer.zip_code,
            latitude: latitude,
            longitude: longitude,
            base_price: parseFloat(price) || service?.base_price || 0,
            total_price: parseFloat(price) || service?.base_price || 0,
            assigned_groomer_id: groomerId,
            customer_notes: notes,
            status: 'confirmed'
        };
        
        const { data, error } = await supabaseClient
            .from('appointments')
            .insert(appointmentData)
            .select()
            .single();
        
        if (error) {
            hideLoading();
            showToast('Failed to create appointment: ' + error.message, 'error');
            return;
        }
        
        // Reload admin data
        await loadAdminData();
        
        hideLoading();
        showToast('Appointment created successfully!', 'success');
        closeAdminAddAppointment();
        
    } catch (err) {
        hideLoading();
        console.error('Error creating appointment:', err);
        showToast('Failed to create appointment', 'error');
    }
}

// Render the admin add appointment modal
function renderAdminAddAppointmentModal() {
    if (!state.showAdminAddAppointment) return '';
    
    const step = state.adminAppointmentStep;
    const customer = state.adminSelectedCustomer;
    const pet = state.adminSelectedPet;
    
    return `
    <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onmousedown="if(event.target === this) closeAdminAddAppointment()">
        <div class="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onmousedown="event.stopPropagation()">
            <!-- Header -->
            <div class="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center sticky top-0 bg-white dark:bg-surface-dark z-10">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary">calendar_add_on</span>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-slate-900 dark:text-white">New Appointment</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Step ${step} of 3: ${step === 1 ? 'Customer' : step === 2 ? 'Pet' : 'Appointment Details'}</p>
                    </div>
                </div>
                <button onclick="closeAdminAddAppointment()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-slate-400">close</span>
                </button>
            </div>
            
            <!-- Progress Bar -->
            <div class="px-6 pt-4">
                <div class="flex items-center gap-2">
                    <div class="flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-slate-200'}"></div>
                    <div class="flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-slate-200'}"></div>
                    <div class="flex-1 h-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-slate-200'}"></div>
                </div>
            </div>
            
            <!-- Content -->
            <div class="p-6">
                ${step === 1 ? renderAdminAppointmentStep1() : ''}
                ${step === 2 ? renderAdminAppointmentStep2() : ''}
                ${step === 3 ? renderAdminAppointmentStep3() : ''}
            </div>
        </div>
    </div>`;
}

// Step 1: Select or Create Customer
function renderAdminAppointmentStep1() {
    const searchResults = state.adminCustomerSearchResults || [];
    const newCustomer = state.adminNewCustomer;
    
    // If creating new customer
    if (newCustomer !== null) {
        return `
        <div class="space-y-5">
            <div class="flex items-center gap-2 text-primary mb-4">
                <span class="material-symbols-outlined">person_add</span>
                <span class="font-bold">New Customer</span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name *</label>
                    <input type="text" id="new-customer-name" required
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="John Smith">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone * <span class="font-normal text-slate-400">(primary identifier)</span></label>
                    <input type="tel" id="new-customer-phone" required
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="(818) 555-1234">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email <span class="font-normal text-slate-400">(optional)</span></label>
                    <input type="email" id="new-customer-email"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="john@email.com">
                </div>
                
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Street Address *</label>
                    <input type="text" id="new-customer-address" required
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="123 Main Street">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">City *</label>
                    <input type="text" id="new-customer-city" required
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="Los Angeles">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ZIP Code</label>
                    <input type="text" id="new-customer-zip"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="91401">
                </div>
            </div>
            
            <div class="flex gap-3 pt-4">
                <button onclick="state.adminNewCustomer = null; render();" class="flex-1 py-3 border border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    Back to Search
                </button>
                <button onclick="saveNewCustomerAndContinue()" class="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">arrow_forward</span>
                    Continue to Pet
                </button>
            </div>
        </div>`;
    }
    
    // Search mode
    return `
    <div class="space-y-5">
        <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Search Customer by Phone or Name</label>
            <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                <input type="text" id="customer-search-input"
                    class="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                    placeholder="Enter phone number or name..."
                    value="${state.adminCustomerSearch || ''}"
                    oninput="searchCustomersForAppointment(this.value)">
            </div>
        </div>
        
        ${searchResults.length > 0 ? `
            <div id="admin-customer-search-results" class="space-y-2">
                <p class="text-sm text-slate-500">Found ${searchResults.length} customer(s):</p>
                ${searchResults.map(c => `
                    <button onclick="selectCustomerForAppointment('${c.id}')" class="w-full p-4 rounded-xl border border-slate-200 dark:border-border-dark hover:border-primary hover:bg-primary/5 text-left transition-all">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span class="material-symbols-outlined text-primary">person</span>
                            </div>
                            <div class="flex-1">
                                <p class="font-bold text-slate-900 dark:text-white">${c.full_name}</p>
                                <p class="text-sm text-slate-500">${escapeHtml(c.phone || 'No phone')} ${c.email ? '• ' + c.email : ''}</p>
                                ${c.address ? `<p class="text-xs text-slate-400">${escapeHtml(c.address)}, ${escapeHtml(c.city || '')}</p>` : ''}
                            </div>
                            <span class="material-symbols-outlined text-slate-400">chevron_right</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        ` : state.adminCustomerSearch && state.adminCustomerSearch.length >= 2 ? `
            <div id="admin-customer-search-results" class="text-center py-8">
                <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">person_off</span>
                <p class="text-slate-500">No customers found matching "${escapeHtml(state.adminCustomerSearch)}"</p>
            </div>
        ` : '<div id="admin-customer-search-results"></div>'}
        
        <div class="pt-4 border-t border-slate-100 dark:border-border-dark">
            <button onclick="startNewCustomerForAppointment()" class="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-semibold rounded-xl hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined">person_add</span>
                Create New Customer
            </button>
        </div>
    </div>`;
}

// Step 2: Select or Create Pet
function renderAdminAppointmentStep2() {
    const customer = state.adminSelectedCustomer;
    const pets = customer?.pets || [];
    const newPet = state.adminNewPet;
    
    // If creating new pet
    if (newPet !== null) {
        return `
        <div class="space-y-5">
            <div class="flex items-center gap-2 text-primary mb-4">
                <span class="material-symbols-outlined">pets</span>
                <span class="font-bold">New Pet for ${customer.full_name}</span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Pet Name *</label>
                    <input type="text" id="new-pet-name" required
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="Buddy">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Breed</label>
                    <input type="text" id="new-pet-breed"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="Golden Retriever">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Weight (lbs)</label>
                    <input type="number" id="new-pet-weight"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="65">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Grooming Notes</label>
                    <input type="text" id="new-pet-notes"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="Sensitive ears, likes treats">
                </div>
            </div>
            
            <div class="flex gap-3 pt-4">
                <button onclick="state.adminNewPet = null; render();" class="flex-1 py-3 border border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    Back
                </button>
                <button onclick="saveNewPetAndContinue()" class="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">arrow_forward</span>
                    Continue
                </button>
            </div>
        </div>`;
    }
    
    return `
    <div class="space-y-5">
        <!-- Selected Customer Summary -->
        <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary">person</span>
                </div>
                <div>
                    <p class="font-bold text-slate-900 dark:text-white">${customer.full_name}</p>
                    <p class="text-sm text-slate-500">${escapeHtml(customer.phone || '')} ${customer.address ? '• ' + customer.address + ', ' + customer.city : ''}</p>
                </div>
                <button onclick="adminAppointmentBack()" class="ml-auto text-sm text-primary hover:underline">Change</button>
            </div>
        </div>
        
        <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Select Pet</label>
            
            ${pets.length > 0 ? `
                <div class="space-y-2">
                    ${pets.map(p => `
                        <button onclick="selectPetForAppointment('${p.id}')" class="w-full p-4 rounded-xl border border-slate-200 dark:border-border-dark hover:border-primary hover:bg-primary/5 text-left transition-all">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center overflow-hidden">
                                    ${p.photo_url ? `<img src="${p.photo_url}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-amber-600">pets</span>`}
                                </div>
                                <div class="flex-1">
                                    <p class="font-bold text-slate-900 dark:text-white">${escapeHtml(p.name)}</p>
                                    <p class="text-sm text-slate-500">${escapeHtml(p.breed || 'Dog')} ${p.weight ? '• ' + p.weight + ' lbs' : ''}</p>
                                </div>
                                <span class="material-symbols-outlined text-slate-400">chevron_right</span>
                            </div>
                        </button>
                    `).join('')}
                </div>
            ` : `
                <div class="text-center py-6">
                    <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">pets</span>
                    <p class="text-slate-500">No pets found for this customer</p>
                </div>
            `}
        </div>
        
        <div class="pt-4 border-t border-slate-100 dark:border-border-dark">
            <button onclick="startNewPetForAppointment()" class="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-semibold rounded-xl hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined">add</span>
                Add New Pet
            </button>
        </div>
        
        <div class="flex gap-3 pt-2">
            <button onclick="adminAppointmentBack()" class="flex-1 py-3 border border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <span class="material-symbols-outlined text-sm mr-1">arrow_back</span>
                Back
            </button>
        </div>
    </div>`;
}

// Step 3: Appointment Details
function renderAdminAppointmentStep3() {
    const customer = state.adminSelectedCustomer;
    const pet = state.adminSelectedPet;
    // Only show ACTIVE services in booking dropdown
    const services = (state.services || []).filter(s => s.is_active !== false);
    const groomers = state.groomers?.filter(g => g.is_active !== false) || [];
    const today = getTodayPacific();
    const smartSlots = state.adminSmartSlots;
    const selectedSlot = state.adminSelectedSlot;
    const manualMode = state.adminManualBooking || false;
    
    // Detect region from customer address
    const customerCity = customer?.city || '';
    const customerRegion = getRegionForCity(customerCity);
    const regionGroomers = customerRegion ? getGroomersForRegion(customerRegion.id) : groomers;
    
    // Auto-load smart slots on first render
    if (!smartSlots && !manualMode && customer?.address && customer?.city) {
        setTimeout(() => loadAdminSmartSlots(), 50);
    }
    
    return `
    <div class="space-y-5">
        <!-- Customer & Pet Summary -->
        <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div class="flex items-center gap-4 flex-wrap">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-sm">person</span>
                    <span class="font-semibold text-slate-900 dark:text-white">${customer.full_name}</span>
                </div>
                <span class="text-slate-300">|</span>
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-amber-500 text-sm">pets</span>
                    <span class="font-semibold text-slate-900 dark:text-white">${escapeHtml(pet.name)}</span>
                    ${pet.breed ? `<span class="text-slate-500 text-sm">(${escapeHtml(pet.breed)})</span>` : ''}
                </div>
                <button onclick="adminAppointmentBack()" class="ml-auto text-sm text-primary hover:underline">Change</button>
            </div>
            ${customerCity ? `
            <div class="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span class="material-symbols-outlined text-sm ${customerRegion ? 'text-emerald-500' : 'text-slate-400'}">location_on</span>
                <span class="text-sm text-slate-600 dark:text-slate-300">${escapeHtml(customer.address || '')}${customer.address ? ', ' : ''}${escapeHtml(customerCity)}</span>
                ${customerRegion ? `<span class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">${escapeHtml(customerRegion.name)}</span>` : ''}
            </div>` : ''}
        </div>
        
        <!-- Mode Toggle -->
        <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                ${manualMode ? 'Manual Scheduling' : 'Smart Availability'}
            </span>
            <button type="button" onclick="toggleAdminBookingMode()" class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${manualMode ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}">
                ${manualMode ? '← Smart Mode' : 'Manual Override →'}
            </button>
        </div>
        
        ${manualMode ? renderAdminManualBooking(services, groomers, today) : renderAdminSmartBooking(services, groomers, regionGroomers, today, smartSlots, selectedSlot)}
    </div>`;
}

// Smart booking mode — shows recommended slots
function renderAdminSmartBooking(services, groomers, regionGroomers, today, smartSlots, selectedSlot) {
    const weekOffset = state.adminBookingWeekOffset || 0;
    
    return `
        <!-- Week Navigator -->
        <div id="admin-smart-picker" class="bg-slate-50 dark:bg-slate-800/30 rounded-xl overflow-hidden">
            ${!smartSlots ? `
                <div class="flex items-center justify-center gap-3 py-12">
                    <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-sm text-slate-500">Loading availability...</span>
                </div>
            ` : smartSlots.error ? `
                <div class="text-center py-8 px-4">
                    <span class="material-symbols-outlined text-3xl text-amber-400 mb-2">warning</span>
                    <p class="text-sm text-slate-600 dark:text-slate-300">Couldn't load availability.</p>
                    ${smartSlots.reason ? `<p class="text-xs text-slate-400 mt-1">${escapeHtml(smartSlots.reason)}</p>` : ''}
                    <p class="text-xs text-slate-400 mt-1">Use manual mode instead.</p>
                </div>
            ` : smartSlots.noGroomersInRegion ? `
                <div class="text-center py-8 px-4">
                    <span class="material-symbols-outlined text-3xl text-amber-400 mb-2">person_off</span>
                    <p class="text-sm text-slate-600 dark:text-slate-300">No groomers cover this customer's area.</p>
                    <p class="text-xs text-slate-400 mt-1">Switch to manual mode to assign any groomer.</p>
                </div>
            ` : (() => {
                const allSlots = [...(smartSlots.bestAvailable || []), ...(smartSlots.moreAvailable || [])];
                const maxWeek = getMaxWeekOffset(allSlots);
                const weekDates = getWeekDates(weekOffset);
                const weekSlots = getSlotsForWeek(allSlots, weekOffset);
                const grouped = groupSlotsByDate(weekSlots);
                
                return `
                    <!-- Week Header -->
                    <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-700">
                        <button type="button" onclick="adminWeekNav(-1)" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${weekOffset <= 0 ? 'opacity-30 cursor-not-allowed' : ''}" ${weekOffset <= 0 ? 'disabled' : ''}>
                            <span class="material-symbols-outlined text-slate-600 dark:text-slate-300">chevron_left</span>
                        </button>
                        <div class="text-center">
                            <p class="font-bold text-slate-900 dark:text-white text-sm">${getWeekLabel(weekOffset)}</p>
                            ${weekOffset === 0 ? '<p class="text-[10px] text-primary font-medium">This Week</p>' : ''}
                        </div>
                        <button type="button" onclick="adminWeekNav(1)" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${weekOffset >= maxWeek ? 'opacity-30 cursor-not-allowed' : ''}" ${weekOffset >= maxWeek ? 'disabled' : ''}>
                            <span class="material-symbols-outlined text-slate-600 dark:text-slate-300">chevron_right</span>
                        </button>
                    </div>
                    
                    <!-- Day Columns -->
                    <div class="grid grid-cols-5 divide-x divide-slate-200 dark:divide-slate-700">
                        ${weekDates.map(day => {
                            const daySlots = grouped[day.dateStr] || [];
                            const isToday = day.isToday;
                            const isPast = day.isPast;
                            
                            return `
                                <div class="flex flex-col ${isPast ? 'opacity-40' : ''}">
                                    <!-- Day Header -->
                                    <div class="px-1 py-2 text-center border-b border-slate-200 dark:border-slate-700 ${isToday ? 'bg-primary/10' : 'bg-white dark:bg-surface-dark'}">
                                        <p class="text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-slate-400'}">${day.dayName}</p>
                                        <p class="text-sm font-bold ${isToday ? 'text-primary' : 'text-slate-800 dark:text-white'}">${day.dayNum}</p>
                                    </div>
                                    
                                    <!-- Time Slots -->
                                    <div class="flex flex-col gap-1 p-1 min-h-[120px] bg-slate-50 dark:bg-slate-800/30">
                                        ${daySlots.length > 0 && !isPast ? daySlots.map(slot => {
                                            const isSelected = selectedSlot && selectedSlot.date === slot.date && selectedSlot.time === slot.time;
                                            return `
                                                <button type="button" onclick="selectAdminSmartSlot('${slot.date}', '${slot.time}', '${slot.groomerId}')"
                                                    class="w-full px-1 py-1.5 rounded-lg text-center transition-all ${isSelected 
                                                        ? 'bg-primary text-white shadow-sm' 
                                                        : 'bg-white dark:bg-slate-700 hover:bg-primary/10 hover:border-primary/30 border border-slate-200 dark:border-slate-600'}">
                                                    <p class="text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'}">${slot.displayTime}</p>
                                                    <p class="text-[9px] ${isSelected ? 'text-white/80' : 'text-slate-400'} truncate">${slot.groomerName?.split(' ')[0] || ''}</p>
                                                </button>
                                            `;
                                        }).join('') : `
                                            <div class="flex items-center justify-center h-full">
                                                <p class="text-[10px] text-slate-300 dark:text-slate-600">${isPast ? 'Past' : 'No slots'}</p>
                                            </div>
                                        `}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <!-- Slot count -->
                    <div class="px-4 py-2 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <p class="text-[10px] text-slate-400">${weekSlots.length} slot${weekSlots.length !== 1 ? 's' : ''} this week</p>
                        <p class="text-[10px] text-slate-400">${allSlots.length} total over 3 months</p>
                    </div>
                `;
            })()}
        </div>
        
        <!-- Selected slot summary + form fields -->
        <form onsubmit="createAdminAppointment(event)" class="space-y-4">
            <input type="hidden" id="admin-appt-date" value="${selectedSlot?.date || ''}">
            <input type="hidden" id="admin-appt-time" value="${selectedSlot?.time || ''}">
            
            ${selectedSlot ? `
                <div class="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary">event_available</span>
                    <div>
                        <p class="font-bold text-slate-900 dark:text-white text-sm">${selectedSlot.displayDate} at ${selectedSlot.displayTime}</p>
                        <p class="text-xs text-slate-500">Groomer: ${selectedSlot.groomerName || 'Unassigned'}</p>
                    </div>
                </div>
            ` : `
                <p class="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">info</span>
                    Select a time slot above to continue
                </p>
            `}
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Groomer (auto-filled but overridable) -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Groomer *</label>
                    <select id="admin-appt-groomer" required
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all">
                        <option value="">Select groomer</option>
                        ${groomers.map(g => `<option value="${g.id}" ${selectedSlot?.groomerId === g.id ? 'selected' : ''}>${g.full_name}</option>`).join('')}
                    </select>
                </div>
                
                <!-- Service -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Service</label>
                    <select id="admin-appt-service" onchange="updateAdminApptPrice()"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all">
                        <option value="">Select service</option>
                        ${services.filter(s => !s.is_addon && s.category !== 'fee').map(s => `<option value="${s.id}" data-price="${s.base_price}">${escapeHtml(s.name)}</option>`).join('')}
                    </select>
                </div>
                
                <!-- Price -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Price ($)</label>
                    <input type="number" id="admin-appt-price" step="0.01" min="0"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="0.00">
                </div>
                
                <!-- Notes -->
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                    <textarea id="admin-appt-notes" rows="2"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                        placeholder="Any special instructions..."></textarea>
                </div>
            </div>
            
            <div class="flex gap-3 pt-4">
                <button type="button" onclick="adminAppointmentBack()" class="flex-1 py-3 border border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <span class="material-symbols-outlined text-sm mr-1">arrow_back</span>
                    Back
                </button>
                <button type="submit" class="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" ${!selectedSlot ? 'disabled' : ''}>
                    <span class="material-symbols-outlined">check</span>
                    Create Appointment
                </button>
            </div>
        </form>
    `;
}

// Manual booking mode — original dropdowns
function renderAdminManualBooking(services, groomers, today) {
    const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    
    return `
        <form onsubmit="createAdminAppointment(event)" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Date -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date *</label>
                    <input type="date" id="admin-appt-date" required min="${today}"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all">
                </div>
                
                <!-- Time -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Time *</label>
                    <select id="admin-appt-time" required
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all">
                        <option value="">Select time</option>
                        ${timeSlots.map(t => `<option value="${t}">${formatTime(t)}</option>`).join('')}
                    </select>
                </div>
                
                <!-- Service -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Service</label>
                    <select id="admin-appt-service" onchange="updateAdminApptPrice()"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all">
                        <option value="">Select service</option>
                        ${services.filter(s => !s.is_addon && s.category !== 'fee').map(s => `<option value="${s.id}" data-price="${s.base_price}">${escapeHtml(s.name)}</option>`).join('')}
                    </select>
                </div>
                
                <!-- Groomer -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Groomer *</label>
                    <select id="admin-appt-groomer" required
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all">
                        <option value="">Select groomer</option>
                        ${groomers.map(g => `<option value="${g.id}">${g.full_name}</option>`).join('')}
                    </select>
                </div>
                
                <!-- Price -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Price ($)</label>
                    <input type="number" id="admin-appt-price" step="0.01" min="0"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="0.00">
                </div>
                
                <!-- Notes -->
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                    <textarea id="admin-appt-notes" rows="2"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                        placeholder="Any special instructions..."></textarea>
                </div>
            </div>
            
            <div class="flex gap-3 pt-4">
                <button type="button" onclick="adminAppointmentBack()" class="flex-1 py-3 border border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <span class="material-symbols-outlined text-sm mr-1">arrow_back</span>
                    Back
                </button>
                <button type="submit" class="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">check</span>
                    Create Appointment
                </button>
            </div>
        </form>
    `;
}

// Load smart slots for admin booking
async function loadAdminSmartSlots() {
    const customer = state.adminSelectedCustomer;
    if (!customer?.address || !customer?.city) {
        state.adminSmartSlots = { error: true, reason: 'No address or city on customer' };
        render();
        return;
    }
    
    try {
        // Geocode customer address
        const coords = await geocodeAddress(customer.address, customer.city, 'CA', customer.zip_code);
        if (!coords) {
            state.adminSmartSlots = { error: true, reason: 'Geocode failed' };
            render();
            return;
        }
        
        _log('Admin smart booking - coords:', coords.latitude, coords.longitude, 'city:', coords.city);
        
        // Detect region and set for groomer filtering
        const detectedCity = coords.city || customer.city;
        const region = getRegionForCity(detectedCity);
        state.customerBookingRegion = region;
        
        _log('Admin smart booking - region:', region?.name || 'none');
        
        // Get smart recommendations
        const recommendations = await getSmartDateRecommendations(coords.latitude, coords.longitude);
        
        _log('Admin smart booking - results:', {
            best: recommendations?.bestAvailable?.length || 0,
            more: recommendations?.moreAvailable?.length || 0,
            error: recommendations?.error,
            noGroomers: recommendations?.noGroomersInRegion
        });
        
        state.adminSmartSlots = recommendations;
        render();
        
    } catch (err) {
        console.error('Error loading admin smart slots:', err);
        state.adminSmartSlots = { error: true, reason: err.message || 'Unknown error' };
        render();
    }
}

// Select a smart slot in admin booking
function selectAdminSmartSlot(date, time, groomerId) {
    const slots = [...(state.adminSmartSlots?.bestAvailable || []), ...(state.adminSmartSlots?.moreAvailable || [])];
    const slot = slots.find(s => s.date === date && s.time === time);
    
    state.adminSelectedSlot = {
        date: date,
        time: time,
        groomerId: groomerId,
        groomerName: slot?.groomerName || '',
        displayDate: slot?.displayDate || date,
        displayTime: slot?.displayTime || formatTime(time)
    };
    
    render();
}

// Toggle between smart and manual booking modes
function toggleAdminBookingMode() {
    state.adminManualBooking = !state.adminManualBooking;
    state.adminSelectedSlot = null;
    state.adminBookingWeekOffset = 0;
    render();
}

// Navigate weeks in admin smart booking
function adminWeekNav(direction) {
    const current = state.adminBookingWeekOffset || 0;
    const newOffset = current + direction;
    if (newOffset < 0) return;
    
    // Check max
    const allSlots = [...(state.adminSmartSlots?.bestAvailable || []), ...(state.adminSmartSlots?.moreAvailable || [])];
    const maxWeek = getMaxWeekOffset(allSlots);
    if (newOffset > maxWeek) return;
    
    state.adminBookingWeekOffset = newOffset;
    render();
}

// Update price when service is selected
function updateAdminApptPrice() {
    const serviceEl = document.getElementById('admin-appt-service');
    const priceEl = document.getElementById('admin-appt-price');
    
    if (serviceEl && priceEl) {
        const selectedOption = serviceEl.options[serviceEl.selectedIndex];
        const price = selectedOption?.dataset?.price;
        if (price) {
            priceEl.value = price;
        }
    }
}

// Render Edit Groomer Modal
function renderEditGroomerModal() {
    if (!state.showEditGroomerModal || !state.editingGroomer) return '';
    
    const g = state.editingGroomer;
    const currentSpecialties = g.specialties || [];
    const currentRegions = g.service_regions || [];
    
    return `
    <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onmousedown="if(event.target === this) closeEditGroomerModal()">
        <div class="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onclick="event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center sticky top-0 bg-white dark:bg-surface-dark z-10">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">edit</span>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Edit Groomer</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400">${g.full_name}</p>
                    </div>
                </div>
                <button onmousedown="if(event.target === this) closeEditGroomerModal()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-slate-400">close</span>
                </button>
            </div>
            
            <form id="edit-groomer-form" class="p-6 space-y-5">
                <input type="hidden" id="edit-groomer-id" value="${g.id}">
                
                <!-- Full Name -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name *</label>
                    <input type="text" id="edit-groomer-name" required value="${g.full_name || ''}"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all">
                </div>
                
                <!-- Email (read-only) -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email <span class="font-normal text-slate-400">(cannot be changed)</span></label>
                    <input type="email" value="${g.email || ''}" disabled
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed">
                </div>
                
                <!-- Phone -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                    <input type="tel" id="edit-groomer-phone" value="${g.phone || ''}"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                        placeholder="(555) 123-4567">
                </div>
                
                <!-- Hired Date -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hired Date</label>
                    <input type="date" id="edit-groomer-hired-date" value="${g.hired_date || ''}"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all">
                </div>
                
                <!-- Specialties -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Specialties</label>
                    <div class="grid grid-cols-2 gap-2">
                        ${GROOMER_SPECIALTIES.map(s => `
                            <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-border-dark hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-all">
                                <input type="checkbox" name="edit-groomer-specialty" value="${s.id}" ${currentSpecialties.includes(s.id) ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                                <span class="text-sm text-slate-700 dark:text-slate-300">${s.icon} ${s.label}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Coverage Regions -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Coverage Regions</label>
                    <div class="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                        ${serviceRegions.map(r => `
                            <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-border-dark hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-all">
                                <input type="checkbox" name="edit-groomer-region" value="${r.id}" ${currentRegions.includes(r.id) ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                                <div>
                                    <span class="text-sm font-medium text-slate-700 dark:text-slate-300">${escapeHtml(r.name)}</span>
                                    <p class="text-xs text-slate-400">${(r.cities || []).slice(0, 3).join(', ')}${(r.cities || []).length > 3 ? '...' : ''}</p>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Weekly Availability -->
                ${renderAdminAvailabilitySection('edit-groomer', state.editingGroomerAvailability || [])}
                
                <!-- Admin Notes -->
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Admin Notes</label>
                    <textarea id="edit-groomer-admin-notes" rows="2"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none"
                        placeholder="Internal notes...">${g.admin_notes || ''}</textarea>
                </div>
                
                <!-- Submit Button -->
                <button type="submit" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25">
                    <span class="material-symbols-outlined">save</span>
                    Save Changes
                </button>
            </form>
        </div>
    </div>`;
}

// Render Groomer Schedule Modal
function renderGroomerScheduleModal() {
    if (!state.showGroomerScheduleModal || !state.viewingGroomerSchedule) return '';
    
    const g = state.viewingGroomerSchedule;
    
    // Initialize month/year if not set
    if (state.adminScheduleMonth === null || state.adminScheduleYear === null) {
        const now = new Date();
        state.adminScheduleMonth = now.getMonth();
        state.adminScheduleYear = now.getFullYear();
    }
    
    const currentMonth = state.adminScheduleMonth;
    const currentYear = state.adminScheduleYear;
    
    // Debug: Log all appointments and their groomer IDs
    _log('All appointments for schedule:', state.allAppointments.map(a => ({
        id: a.id,
        date: a.appointment_date,
        assigned_groomer_id: a.assigned_groomer_id,
        groomerMatch: a.assigned_groomer_id === g.id
    })));
    
    const groomerAppts = state.allAppointments.filter(a => a.assigned_groomer_id === g.id);
    _log(`Filtered appointments for ${g.full_name}:`, groomerAppts);
    
    // Get calendar data for the selected month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const todayDate = new Date();
    const today = todayDate.getDate();
    const todayMonth = todayDate.getMonth();
    const todayYear = todayDate.getFullYear();
    
    // Count appointments per day
    const apptsByDay = {};
    const apptsByDateStr = {};
    groomerAppts.forEach(a => {
        if (a.appointment_date) {
            let dateStr = a.appointment_date;
            if (dateStr.length === 11 && dateStr.startsWith('20') && dateStr[4] === '0') {
                dateStr = dateStr.substring(1);
            }
            // Parse date parts manually to avoid timezone issues
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
                const day = parseInt(parts[2]);
                
                if (month === currentMonth && year === currentYear) {
                    apptsByDay[day] = (apptsByDay[day] || 0) + 1;
                    if (!apptsByDateStr[dateStr]) apptsByDateStr[dateStr] = [];
                    apptsByDateStr[dateStr].push(a);
                }
            }
        }
    });
    
    // Get selected day's appointments
    const selectedDateAppts = state.adminScheduleSelectedDate 
        ? groomerAppts.filter(a => {
            let dateStr = a.appointment_date;
            if (dateStr && dateStr.length === 11) dateStr = dateStr.substring(1);
            return dateStr === state.adminScheduleSelectedDate;
        }).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
        : [];
    
    // Calculate month stats
    const monthAppts = groomerAppts.filter(a => {
        if (!a.appointment_date) return false;
        let dateStr = a.appointment_date;
        if (dateStr.length === 11) dateStr = dateStr.substring(1);
        // Parse date parts manually to avoid timezone issues
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            return month === currentMonth && year === currentYear;
        }
        return false;
    });
    const completedMonth = monthAppts.filter(a => a.status === 'completed').length;
    const revenueMonth = monthAppts.filter(a => a.status === 'completed' || a.status === 'confirmed')
        .reduce((sum, a) => sum + (parseFloat(a.total_price) || 0), 0);
    
    // Generate calendar grid
    let calendarDays = '';
    for (let i = 0; i < startPadding; i++) {
        calendarDays += '<div class="aspect-square min-h-[44px]"></div>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const count = apptsByDay[day] || 0;
        const isToday = day === today && currentMonth === todayMonth && currentYear === todayYear;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isSelected = state.adminScheduleSelectedDate === dateStr;
        
        calendarDays += `
            <button onclick="selectAdminScheduleDate('${dateStr}')" class="aspect-square min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-95 ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : ''} ${isToday ? 'bg-emerald-600 text-white hover:bg-emerald-700' : count > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}">
                <span class="text-sm font-bold ${isToday ? 'text-white' : ''}">${day}</span>
                ${count > 0 ? `<span class="text-[10px] ${isToday ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'}">(${count})</span>` : ''}
            </button>
        `;
    }
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `
    <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onclick="closeGroomerScheduleModal()">
        <div class="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                        ${(g.full_name || 'G').split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-slate-900 dark:text-white">${g.full_name}'s Schedule</h2>
                        <p class="text-sm text-slate-500 dark:text-slate-400">${monthAppts.length} appointments this month</p>
                    </div>
                </div>
                <button onclick="closeGroomerScheduleModal()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-slate-400">close</span>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="flex gap-6">
                    <!-- Calendar Section -->
                    <div class="flex-1">
                        <!-- Month Navigation -->
                        <div class="flex items-center justify-between mb-4">
                            <button onclick="adminSchedulePrevMonth()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <span class="material-symbols-outlined text-slate-600 dark:text-slate-300">chevron_left</span>
                            </button>
                            <h3 class="text-lg font-bold text-slate-900 dark:text-white">${monthNames[currentMonth]} ${currentYear}</h3>
                            <button onclick="adminScheduleNextMonth()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <span class="material-symbols-outlined text-slate-600 dark:text-slate-300">chevron_right</span>
                            </button>
                        </div>
                        
                        <!-- Calendar Grid -->
                        <div class="bg-slate-50 dark:bg-background-dark rounded-xl p-4">
                            <div class="grid grid-cols-7 gap-1 mb-2">
                                <div class="text-center text-xs font-bold text-slate-400">Sun</div>
                                <div class="text-center text-xs font-bold text-slate-400">Mon</div>
                                <div class="text-center text-xs font-bold text-slate-400">Tue</div>
                                <div class="text-center text-xs font-bold text-slate-400">Wed</div>
                                <div class="text-center text-xs font-bold text-slate-400">Thu</div>
                                <div class="text-center text-xs font-bold text-slate-400">Fri</div>
                                <div class="text-center text-xs font-bold text-slate-400">Sat</div>
                            </div>
                            <div class="grid grid-cols-7 gap-1">
                                ${calendarDays}
                            </div>
                        </div>
                        
                        <!-- Month Summary -->
                        <div class="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl mt-4">
                            <div class="text-center">
                                <p class="text-2xl font-bold text-slate-900 dark:text-white">${monthAppts.length}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400">Total Appts</p>
                            </div>
                            <div class="text-center">
                                <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${completedMonth}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400">Completed</p>
                            </div>
                            <div class="text-center">
                                <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$${revenueMonth.toFixed(0)}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400">Revenue</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Day Detail Panel -->
                    <div class="w-80 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        ${state.adminScheduleSelectedDate ? `
                            <div class="mb-4">
                                <h4 class="font-bold text-slate-900 dark:text-white">${new Date(state.adminScheduleSelectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
                                <p class="text-sm text-slate-500 dark:text-slate-400">${selectedDateAppts.length} appointment${selectedDateAppts.length !== 1 ? 's' : ''}</p>
                            </div>
                            
                            ${selectedDateAppts.length > 0 ? `
                                <div class="space-y-2 max-h-80 overflow-y-auto">
                                    ${selectedDateAppts.map(a => `
                                        <div class="p-3 bg-white dark:bg-surface-dark rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div class="flex items-center justify-between mb-2">
                                                <span class="font-bold text-emerald-600 dark:text-emerald-400">${formatTime(a.start_time)}</span>
                                                <span class="px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    a.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                                                    a.status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                                                    a.status === 'in_progress' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                                                    a.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                                                    'bg-slate-100 text-slate-600'
                                                }">${a.status === 'in_progress' ? 'In Progress' : a.status}</span>
                                            </div>
                                            <p class="font-medium text-slate-900 dark:text-white">${a.petName || 'Pet'}</p>
                                            <p class="text-sm text-slate-500 dark:text-slate-400">${a.serviceName || 'Grooming'}</p>
                                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">${a.customerName || 'Customer'}</p>
                                            ${a.service_address || a.customerAddress ? `
                                                <p class="text-xs text-slate-400 dark:text-slate-500">${a.service_address || a.customerAddress}, ${a.service_city || a.customerCity || ''}</p>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="text-center py-8 text-slate-400 dark:text-slate-500">
                                    <span class="material-symbols-outlined text-3xl mb-2">event_available</span>
                                    <p class="text-sm">No appointments</p>
                                </div>
                            `}
                        ` : `
                            <div class="text-center py-12 text-slate-400 dark:text-slate-500">
                                <span class="material-symbols-outlined text-4xl mb-2">calendar_today</span>
                                <p class="text-sm">Click a day to see appointments</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// Admin schedule navigation functions
function adminSchedulePrevMonth() {
    if (state.adminScheduleMonth === 0) {
        state.adminScheduleMonth = 11;
        state.adminScheduleYear--;
    } else {
        state.adminScheduleMonth--;
    }
    state.adminScheduleSelectedDate = null;
    render();
}

function adminScheduleNextMonth() {
    if (state.adminScheduleMonth === 11) {
        state.adminScheduleMonth = 0;
        state.adminScheduleYear++;
    } else {
        state.adminScheduleMonth++;
    }
    state.adminScheduleSelectedDate = null;
    render();
}

function selectAdminScheduleDate(dateStr) {
    state.adminScheduleSelectedDate = dateStr;
    render();
}

// Modal control functions
function openAddGroomerModal() {
    state.showAddGroomerModal = true;
    render();
    // Attach form listener after render
    setTimeout(() => {
        const form = document.getElementById('add-groomer-form');
        if (form) {
            form.addEventListener('submit', handleAddGroomer);
        }
    }, 100);
}

function closeAddGroomerModal() {
    state.showAddGroomerModal = false;
    render();
}

function openEditGroomerModal(groomerId) {
    const groomer = state.groomers.find(g => g.id === groomerId);
    if (groomer) {
        state.editingGroomer = groomer;
        state.editingGroomerAvailability = [];
        state.showEditGroomerModal = true;
        render();
        
        // Load existing availability async, then re-render
        supabaseClient
            .from('groomer_availability')
            .select('*')
            .eq('groomer_id', groomerId)
            .order('day_of_week')
            .then(({ data }) => {
                state.editingGroomerAvailability = data || [];
                render();
                // Re-attach form listener after re-render
                setTimeout(() => {
                    const form = document.getElementById('edit-groomer-form');
                    if (form) form.addEventListener('submit', handleEditGroomer);
                }, 100);
            });
        
        // Attach form listener after render
        setTimeout(() => {
            const form = document.getElementById('edit-groomer-form');
            if (form) {
                form.addEventListener('submit', handleEditGroomer);
            }
        }, 100);
    }
}

function closeEditGroomerModal() {
    state.showEditGroomerModal = false;
    state.editingGroomer = null;
    render();
}

async function openGroomerScheduleModal(groomerId) {
    showLoading();
    
    // Reload data to get fresh appointments
    await loadAdminData();
    
    const groomer = state.groomers.find(g => g.id === groomerId);
    if (groomer) {
        state.viewingGroomerSchedule = groomer;
        state.showGroomerScheduleModal = true;
        
        // Debug: Log what appointments belong to this groomer
        const groomerAppts = state.allAppointments.filter(a => a.assigned_groomer_id === groomerId);
        _log(`Groomer ${groomer.full_name} (${groomerId}) has ${groomerAppts.length} appointments:`, groomerAppts);
    }
    
    hideLoading();
    render();
}

function closeGroomerScheduleModal() {
    state.showGroomerScheduleModal = false;
    state.viewingGroomerSchedule = null;
    state.adminScheduleMonth = null;
    state.adminScheduleYear = null;
    state.adminScheduleSelectedDate = null;
    render();
}

function toggleGroomerPasswordVisibility() {
    const input = document.getElementById('groomer-password-input');
    const toggle = document.getElementById('groomer-password-toggle');
    if (input && toggle) {
        if (input.type === 'password') {
            input.type = 'text';
            toggle.textContent = 'visibility_off';
        } else {
            input.type = 'password';
            toggle.textContent = 'visibility';
        }
    }
}

// Add Groomer Handler
async function handleAddGroomer(e) {
    e.preventDefault();
    showLoading();
    
    try {
        const name = document.getElementById('groomer-name').value.trim();
        const email = document.getElementById('groomer-email-input').value.trim();
        const password = document.getElementById('groomer-password-input').value;
        const phone = document.getElementById('groomer-phone-input').value.trim();
        const hiredDate = document.getElementById('groomer-hired-date').value;
        const adminNotes = document.getElementById('groomer-admin-notes').value.trim();
        
        // Get selected specialties
        const specialtyCheckboxes = document.querySelectorAll('input[name="groomer-specialty"]:checked');
        const specialties = Array.from(specialtyCheckboxes).map(cb => cb.value);
        
        // Get selected coverage regions
        const regionCheckboxes = document.querySelectorAll('input[name="groomer-region"]:checked');
        const regions = Array.from(regionCheckboxes).map(cb => cb.value);
        
        // First, check if user already exists in profiles
        const { data: existingProfile } = await supabaseClient
            .from('profiles')
            .select('id, email, role, full_name')
            .eq('email', email)
            .single();
        
        if (existingProfile) {
            // User already exists - offer to convert them to groomer
            if (existingProfile.role === 'groomer') {
                hideLoading();
                showToast('This email is already registered as a groomer.', 'error');
                return;
            }
            
            // Ask admin if they want to convert this user
            hideLoading();
            const confirmConvert = confirm(
                `"${existingProfile.full_name || email}" already has an account as a ${existingProfile.role}.\n\n` +
                `Do you want to convert them to a groomer?\n\n` +
                `Note: They will keep their existing password.`
            );
            
            if (!confirmConvert) {
                return;
            }
            
            showLoading();
            
            // Convert existing user to groomer
            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update({
                    full_name: name || existingProfile.full_name,
                    phone: phone || null,
                    role: 'groomer',
                    specialties: specialties,
                    service_regions: regions,
                    is_active: true,
                    hired_date: hiredDate || null,
                    admin_notes: adminNotes || null
                })
                .eq('id', existingProfile.id);
            
            if (updateError) {
                hideLoading();
                showToast('Failed to convert user to groomer: ' + updateError.message, 'error');
                return;
            }
            
            await loadAdminData();
            await saveGroomerAvailabilityFromAdmin(existingProfile.id, 'add-groomer');
            hideLoading();
            closeAddGroomerModal();
            showToast(`"${name || existingProfile.full_name}" converted to groomer! They use their existing password.`, 'success');
            return;
        }
        
        // User doesn't exist - create new account
        // Store admin session data
        const adminSessionData = state.session;
        
        // Create new user account for groomer
        const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        
        if (signUpError) {
            // Check if it's a "user already registered" error (might be in auth but not profiles)
            if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
                hideLoading();
                showToast('This email is already registered. Try using "Forgot Password" to recover the account, or use a different email.', 'error');
                return;
            }
            hideLoading();
            showToast('Failed to create groomer account: ' + signUpError.message, 'error');
            return;
        }
        
        const newUserId = signUpData.user?.id;
        if (!newUserId) {
            hideLoading();
            showToast('Failed to create groomer account', 'error');
            return;
        }
        
        // Restore admin session immediately
        if (adminSessionData && adminSessionData.access_token) {
            try {
                await supabaseClient.auth.setSession({
                    access_token: adminSessionData.access_token,
                    refresh_token: adminSessionData.refresh_token
                });
                const { data: { session } } = await supabaseClient.auth.getSession();
                state.session = session;
            } catch (sessionError) {
                console.error('Session restore error:', sessionError);
                hideLoading();
                showToast('Session expired. Please login again and retry.', 'error');
                logout();
                return;
            }
        }
        
        // Update the profile with groomer details
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({
                full_name: name,
                phone: phone || null,
                role: 'groomer',
                specialties: specialties,
                service_regions: regions,
                is_active: true,
                hired_date: hiredDate || null,
                admin_notes: adminNotes || null
            })
            .eq('id', newUserId);
        
        if (profileError) {
            console.error('Profile update error:', profileError);
            hideLoading();
            showToast('Groomer created but profile update failed: ' + profileError.message, 'error');
            return;
        }
        
        // Reload admin data
        await loadAdminData();
        await saveGroomerAvailabilityFromAdmin(newUserId, 'add-groomer');
        
        hideLoading();
        closeAddGroomerModal();
        showToast(`Groomer "${name}" added successfully! They can login with: ${email}`, 'success');
        
    } catch (err) {
        hideLoading();
        console.error('Add groomer error:', err);
        showToast('Failed to add groomer: ' + err.message, 'error');
    }
}

// Edit Groomer Handler
async function handleEditGroomer(e) {
    e.preventDefault();
    showLoading();
    
    try {
        const groomerId = document.getElementById('edit-groomer-id').value;
        const name = document.getElementById('edit-groomer-name').value.trim();
        const phone = document.getElementById('edit-groomer-phone').value.trim();
        const hiredDate = document.getElementById('edit-groomer-hired-date').value;
        const adminNotes = document.getElementById('edit-groomer-admin-notes').value.trim();
        
        // Get selected specialties
        const specialtyCheckboxes = document.querySelectorAll('input[name="edit-groomer-specialty"]:checked');
        const specialties = Array.from(specialtyCheckboxes).map(cb => cb.value);
        
        // Get selected coverage regions
        const regionCheckboxes = document.querySelectorAll('input[name="edit-groomer-region"]:checked');
        const regions = Array.from(regionCheckboxes).map(cb => cb.value);
        
        const { error } = await supabaseClient
            .from('profiles')
            .update({
                full_name: name,
                phone: phone || null,
                specialties: specialties,
                service_regions: regions,
                hired_date: hiredDate || null,
                admin_notes: adminNotes || null
            })
            .eq('id', groomerId);
        
        if (error) {
            hideLoading();
            showToast('Failed to update groomer: ' + error.message, 'error');
            return;
        }
        
        await loadAdminData();
        await saveGroomerAvailabilityFromAdmin(groomerId, 'edit-groomer');
        hideLoading();
        closeEditGroomerModal();
        showToast('Groomer updated successfully!', 'success');
        
    } catch (err) {
        hideLoading();
        console.error('Edit groomer error:', err);
        showToast('Failed to update groomer: ' + err.message, 'error');
    }
}

// Render availability editor section for Add/Edit Groomer modals
function renderAdminAvailabilitySection(prefix, existingAvailability) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const avail = existingAvailability || [];
    const availMap = {};
    avail.forEach(a => { availMap[a.day_of_week] = a; });
    
    return `
    <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-base">schedule</span>Weekly Availability
        </label>
        <div class="space-y-2">
            ${dayNames.map((day, idx) => {
                const existing = availMap[idx];
                const isOn = existing ? existing.is_available : (idx >= 1 && idx <= 5);
                const startTime = existing ? (existing.start_time || '08:00').substring(0, 5) : '08:00';
                const endTime = existing ? (existing.end_time || '17:00').substring(0, 5) : '17:00';
                return `
                <div class="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-border-dark ${isOn ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/50 opacity-60'}">
                    <label class="flex items-center gap-2 cursor-pointer min-w-[80px]">
                        <input type="checkbox" name="${prefix}-avail-day" value="${idx}" ${isOn ? 'checked' : ''} onchange="toggleAdminAvailDay(this, '${prefix}', ${idx})" class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500">
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">${dayAbbr[idx]}</span>
                    </label>
                    <div class="flex items-center gap-2 flex-1 ${isOn ? '' : 'pointer-events-none opacity-40'}" id="${prefix}-avail-times-${idx}">
                        <input type="time" id="${prefix}-avail-start-${idx}" value="${startTime}" class="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-sm text-slate-900 dark:text-white">
                        <span class="text-xs text-slate-400">to</span>
                        <input type="time" id="${prefix}-avail-end-${idx}" value="${endTime}" class="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-sm text-slate-900 dark:text-white">
                    </div>
                </div>`;
            }).join('')}
        </div>
        <p class="mt-2 text-xs text-slate-400">Set working hours for each day. Unchecked days are off.</p>
    </div>`;
}

function toggleAdminAvailDay(checkbox, prefix, dayIdx) {
    const timesDiv = document.getElementById(`${prefix}-avail-times-${dayIdx}`);
    if (timesDiv) {
        if (checkbox.checked) {
            timesDiv.classList.remove('pointer-events-none', 'opacity-40');
            checkbox.closest('.flex').classList.add('bg-emerald-50/50', 'dark:bg-emerald-900/10', 'border-emerald-200', 'dark:border-emerald-800');
            checkbox.closest('.flex').classList.remove('bg-slate-50', 'dark:bg-slate-800/50', 'opacity-60');
        } else {
            timesDiv.classList.add('pointer-events-none', 'opacity-40');
            checkbox.closest('.flex').classList.remove('bg-emerald-50/50', 'dark:bg-emerald-900/10', 'border-emerald-200', 'dark:border-emerald-800');
            checkbox.closest('.flex').classList.add('bg-slate-50', 'dark:bg-slate-800/50', 'opacity-60');
        }
    }
}

async function saveGroomerAvailabilityFromAdmin(groomerId, prefix) {
    try {
        const updates = [];
        for (let i = 0; i < 7; i++) {
            const checkbox = document.querySelector(`input[name="${prefix}-avail-day"][value="${i}"]`);
            const startInput = document.getElementById(`${prefix}-avail-start-${i}`);
            const endInput = document.getElementById(`${prefix}-avail-end-${i}`);
            
            updates.push({
                groomer_id: groomerId,
                day_of_week: i,
                is_available: checkbox ? checkbox.checked : false,
                start_time: (startInput ? startInput.value : '08:00') + ':00',
                end_time: (endInput ? endInput.value : '17:00') + ':00'
            });
        }
        
        const { error } = await supabaseClient
            .from('groomer_availability')
            .upsert(updates, { onConflict: 'groomer_id,day_of_week' });
        
        if (error) {
            console.error('Availability save error:', error);
        } else {
            _log('Groomer availability saved:', updates.filter(u => u.is_available).length, 'active days');
        }
    } catch (err) {
        console.error('Failed to save groomer availability:', err);
    }
}

// Toggle Groomer Active Status
async function toggleGroomerActive(groomerId, currentlyActive) {
    const action = currentlyActive ? 'deactivate' : 'reactivate';
    const groomer = state.groomers.find(g => g.id === groomerId);
    
    if (!confirm(`Are you sure you want to ${action} ${groomer?.full_name || 'this groomer'}?`)) {
        return;
    }
    
    showLoading();
    
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ is_active: !currentlyActive })
            .eq('id', groomerId);
        
        if (error) {
            hideLoading();
            showToast(`Failed to ${action} groomer: ` + error.message, 'error');
            return;
        }
        
        await loadAdminData();
        hideLoading();
        showToast(`Groomer ${action}d successfully!`, 'success');
        
    } catch (err) {
        hideLoading();
        console.error('Toggle groomer active error:', err);
        showToast(`Failed to ${action} groomer`, 'error');
    }
}

// Toggle a coverage region on/off for the entire business


// =============================================
// EDIT MODALS
// =============================================

const popularBreeds = [
    'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'French Bulldog', 'Bulldog',
    'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Boxer',
    'Dachshund', 'Shih Tzu', 'Siberian Husky', 'Great Dane', 'Doberman Pinscher',
    'Chihuahua', 'Maltese', 'Pomeranian', 'Cocker Spaniel', 'Bernese Mountain Dog',
    'Other'
];

function openEditModal(type, dataOrIndex = {}) {
    let data = {};
    
    // If it's an index number, look up from editItems
    if (typeof dataOrIndex === 'number') {
        const key = `${type}_${dataOrIndex}`;
        data = state.editItems[key] || {};
    } else if (typeof dataOrIndex === 'object') {
        // It's already an object (empty {} or with data)
        data = dataOrIndex;
    }
    
    state.editModal = { type, data: { ...data } };
    render();
}

function closeEditModal() {
    state.editModal = null;
    render();
}

// =============================================
// GROOMING SERVICE MANAGEMENT
// =============================================

function openGroomingServiceModal(serviceId = null) {
    if (serviceId) {
        const service = state.services?.find(s => s.id === serviceId);
        if (service) {
            state.groomingServiceModal = { 
                isEdit: true,
                id: service.id,
                name: service.name || '',
                description: service.description || '',
                base_price: service.base_price || 0,
                duration_minutes: service.duration_minutes || 60,
                is_active: service.is_active !== false,
                sort_order: service.sort_order || 0
            };
        }
    } else {
        state.groomingServiceModal = {
            isEdit: false,
            id: null,
            name: '',
            description: '',
            base_price: 85,
            duration_minutes: 60,
            is_active: true,
            sort_order: (state.services?.length || 0) + 1
        };
    }
    render();
}

function closeGroomingServiceModal() {
    state.groomingServiceModal = null;
    render();
}

async function saveGroomingService() {
    const modal = state.groomingServiceModal;
    if (!modal) return;
    
    if (!modal.name.trim()) {
        showToast('Please enter a service name', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const serviceData = {
            name: modal.name.trim(),
            description: modal.description.trim(),
            base_price: parseFloat(modal.base_price) || 0,
            duration_minutes: parseInt(modal.duration_minutes) || 60,
            is_active: modal.is_active,
            sort_order: parseInt(modal.sort_order) || 0
        };
        
        if (modal.isEdit && modal.id) {
            // Update existing service
            const { error } = await supabaseClient
                .from('services')
                .update(serviceData)
                .eq('id', modal.id);
            
            if (error) throw error;
            showToast('Service updated successfully', 'success');
        } else {
            // Create new service
            const { error } = await supabaseClient
                .from('services')
                .insert([serviceData]);
            
            if (error) throw error;
            showToast('Service created successfully', 'success');
        }
        
        // Reload services
        await loadPublicData();
        closeGroomingServiceModal();
    } catch (err) {
        console.error('Error saving service:', err);
        showToast('Failed to save service: ' + err.message, 'error');
    } finally {
        hideLoading();
    }
}

async function toggleGroomingServiceStatus(serviceId, currentlyActive) {
    try {
        const { error } = await supabaseClient
            .from('services')
            .update({ is_active: !currentlyActive })
            .eq('id', serviceId);
        
        if (error) throw error;
        
        showToast(`Service ${currentlyActive ? 'deactivated' : 'activated'}`, 'success');
        await loadPublicData();
        render();
    } catch (err) {
        console.error('Error toggling service status:', err);
        showToast('Failed to update service status', 'error');
    }
}

function confirmDeleteGroomingService(serviceId, serviceName) {
    state.confirmDialog = {
        title: 'Delete Service',
        message: `Are you sure you want to delete "${serviceName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmClass: 'bg-red-500 hover:bg-red-600',
        onConfirm: () => deleteGroomingService(serviceId)
    };
    render();
}

async function deleteGroomingService(serviceId) {
    showLoading();
    
    try {
        const { error } = await supabaseClient
            .from('services')
            .delete()
            .eq('id', serviceId);
        
        if (error) throw error;
        
        showToast('Service deleted successfully', 'success');
        state.confirmDialog = null;
        await loadPublicData();
        render();
    } catch (err) {
        console.error('Error deleting service:', err);
        showToast('Failed to delete service: ' + err.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderGroomingServiceModal() {
    const modal = state.groomingServiceModal;
    if (!modal) return '';
    
    return `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="closeGroomingServiceModal()">
            <div class="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <div class="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span class="material-symbols-outlined text-primary">content_cut</span>
                            </div>
                            <h2 class="text-xl font-bold text-slate-900 dark:text-white">${modal.isEdit ? 'Edit Service' : 'Add New Service'}</h2>
                        </div>
                        <button onclick="closeGroomingServiceModal()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <span class="material-symbols-outlined text-slate-400">close</span>
                        </button>
                    </div>
                </div>
                
                <div class="p-6 space-y-5">
                    <!-- Service Name -->
                    <div>
                        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Service Name *</label>
                        <input type="text" value="${modal.name}" onchange="state.groomingServiceModal.name = this.value" 
                            class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="e.g., Full Grooming, Bath & Brush, Nail Trim">
                    </div>
                    
                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <textarea onchange="state.groomingServiceModal.description = this.value" rows="3"
                            class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                            placeholder="Describe what's included in this service...">${modal.description}</textarea>
                    </div>
                    
                    <!-- Price & Duration Row -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Base Price ($)</label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input type="number" value="${modal.base_price}" onchange="state.groomingServiceModal.base_price = this.value" min="0" step="0.01"
                                    class="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Duration (min)</label>
                            <select onchange="state.groomingServiceModal.duration_minutes = this.value"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option value="15" ${modal.duration_minutes == 15 ? 'selected' : ''}>15 min</option>
                                <option value="30" ${modal.duration_minutes == 30 ? 'selected' : ''}>30 min</option>
                                <option value="45" ${modal.duration_minutes == 45 ? 'selected' : ''}>45 min</option>
                                <option value="60" ${modal.duration_minutes == 60 ? 'selected' : ''}>60 min</option>
                                <option value="75" ${modal.duration_minutes == 75 ? 'selected' : ''}>75 min</option>
                                <option value="90" ${modal.duration_minutes == 90 ? 'selected' : ''}>90 min</option>
                                <option value="120" ${modal.duration_minutes == 120 ? 'selected' : ''}>120 min</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Sort Order -->
                    <div>
                        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sort Order</label>
                        <input type="number" value="${modal.sort_order}" onchange="state.groomingServiceModal.sort_order = this.value" min="0"
                            class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="0">
                        <p class="text-xs text-slate-400 mt-1">Lower numbers appear first in the booking dropdown</p>
                    </div>
                    
                    <!-- Active Toggle -->
                    <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div>
                            <p class="font-bold text-slate-900 dark:text-white">Active Service</p>
                            <p class="text-sm text-slate-500">Inactive services won't appear in booking options</p>
                        </div>
                        <button onclick="state.groomingServiceModal.is_active = !state.groomingServiceModal.is_active; render();" 
                            class="w-14 h-8 rounded-full transition-colors relative ${modal.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}">
                            <span class="absolute top-1 ${modal.is_active ? 'right-1' : 'left-1'} w-6 h-6 bg-white rounded-full shadow transition-all"></span>
                        </button>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button onclick="closeGroomingServiceModal()" class="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors">
                        Cancel
                    </button>
                    <button onclick="saveGroomingService()" class="px-6 py-3 rounded-xl bg-primary hover:bg-sky-600 text-white font-bold transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-lg">${modal.isEdit ? 'check' : 'add'}</span>
                        ${modal.isEdit ? 'Save Changes' : 'Create Service'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Helper to store item for editing
function storeEditItem(type, index, item) {
    state.editItems[`${type}_${index}`] = item;
}

function renderEditModal() {
    if (!state.editModal) return '';
    const { type, data } = state.editModal;
    
    let title = '';
    let content = '';
    
    switch(type) {
        case 'pet':
            title = data.id ? 'Edit Pet' : 'Add New Pet';
            content = renderPetEditForm(data);
            break;
        case 'profile':
            title = 'Edit Profile';
            content = renderProfileEditForm(data);
            break;
        case 'reward':
            title = data.id ? 'Edit Reward' : 'Add New Reward';
            content = renderRewardEditForm(data);
            break;
        case 'product':
            title = data.id ? 'Edit Product' : 'Add New Product';
            content = renderProductEditForm(data);
            break;
        case 'appointment':
            title = 'Appointment Details';
            content = renderAppointmentEditForm(data);
            break;
        case 'ridealong':
            title = data.id ? 'Edit Package' : 'Add New Package';
            content = renderRideAlongEditForm(data);
            break;
        case 'course':
            title = 'Edit Course Settings';
            content = renderCourseEditForm(data);
            break;
        default:
            return '';
    }
    
    return `
    <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onclick="closeEditModal()">
        <div class="bg-surface-light dark:bg-surface-dark rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl" onclick="event.stopPropagation()">
            <div class="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                <h2 class="text-xl font-bold dark:text-white">${title}</h2>
                <button onclick="closeEditModal()" class="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-lg transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                ${content}
            </div>
        </div>
    </div>`;
}

// Confirmation Dialog
function renderConfirmDialog() {
    const dialog = state.confirmDialog;
    if (!dialog) return '';
    
    return `
    <div class="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onclick="closeConfirmDialog()">
        <div class="bg-surface-light dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl" onclick="event.stopPropagation()">
            <div class="p-6">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-red-600 dark:text-red-400">warning</span>
                    </div>
                    <h3 class="text-xl font-bold dark:text-white">${dialog.title || 'Confirm Action'}</h3>
                </div>
                <p class="text-text-sub-light dark:text-text-sub-dark mb-6">${escapeHtml(dialog.message || 'Are you sure you want to proceed?')}</p>
                <div class="flex gap-3">
                    <button onclick="closeConfirmDialog()" class="flex-1 px-4 py-3 text-sm font-bold text-text-main-light dark:text-white bg-background-light dark:bg-background-dark hover:bg-border-light dark:hover:bg-border-dark rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onclick="confirmDialogAction()" class="flex-1 px-4 py-3 text-sm font-bold text-white ${dialog.confirmClass || 'bg-red-600 hover:bg-red-700'} rounded-lg transition-colors">
                        ${dialog.confirmText || 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

function closeConfirmDialog() {
    if (state.confirmDialog?.onCancel) {
        state.confirmDialog.onCancel();
    } else {
        state.confirmDialog = null;
        render();
    }
}

function confirmDialogAction() {
    if (state.confirmDialog?.onConfirm) {
        state.confirmDialog.onConfirm();
    } else {
        state.confirmDialog = null;
        render();
    }
}

// Ride-Along Package Edit Form
function renderRideAlongEditForm(pkg) {
    const features = pkg.features || [];
    return `
    <form id="edit-ridealong-form" class="space-y-4">
        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Package Name *</label>
            <input type="text" id="edit-ridealong-name" value="${pkg.name || ''}" placeholder="Starter Package" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Price ($) *</label>
                <input type="number" id="edit-ridealong-price" value="${pkg.price || ''}" placeholder="299" min="0" max="99999" 
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
            </div>
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Duration</label>
                <input type="text" id="edit-ridealong-duration" value="${pkg.duration || ''}" placeholder="1 Day" 
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
            </div>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Description</label>
            <textarea id="edit-ridealong-description" placeholder="Describe this package..." 
                class="w-full h-20 px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white resize-none">${pkg.description || ''}</textarea>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Features (one per line)</label>
            <textarea id="edit-ridealong-features" placeholder="Shadow a professional groomer&#10;Learn basic techniques&#10;Certificate included" 
                class="w-full h-28 px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white resize-none">${Array.isArray(features) ? features.join('\n') : ''}</textarea>
        </div>

        <div class="flex items-center gap-3">
            <input type="checkbox" id="edit-ridealong-popular" ${pkg.is_popular || pkg.popular ? 'checked' : ''} class="w-5 h-5 rounded border-border-light text-primary focus:ring-primary">
            <label for="edit-ridealong-popular" class="text-sm font-medium dark:text-white">Mark as "Most Popular"</label>
        </div>

        <div class="flex gap-3 pt-4">
            ${pkg.id ? `<button type="button" onclick="confirmDeleteRideAlong('${pkg.id}', '${pkg.name}')" class="px-4 h-12 border border-red-300 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors">Delete</button>` : ''}
            <button type="submit" class="flex-1 h-12 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg transition-colors">
                ${pkg.id ? 'Save Changes' : 'Add Package'}
            </button>
        </div>
    </form>`;
}

// Course Edit Form  
function renderCourseEditForm(course) {
    return `
    <form id="edit-course-form" class="space-y-4">
        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Course Title *</label>
            <input type="text" id="edit-course-title" value="${course.title || 'Dogfathersplus Academy'}" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Instructor</label>
            <input type="text" id="edit-course-instructor" value="${course.instructor || 'Rosa & Gerardo'}" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Tagline</label>
            <input type="text" id="edit-course-tagline" value="${course.tagline || 'Master Dog Grooming at Home'}" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
        </div>

        <!-- Thumbnail Upload -->
        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Course Thumbnail</label>
            <div class="border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors" onclick="document.getElementById('edit-course-thumbnail').click()">
                <div id="course-thumbnail-preview">
                    ${course.thumbnail_url ? 
                        `<img src="${course.thumbnail_url}" class="max-h-32 mx-auto rounded-lg mb-2"/>` :
                        `<span class="material-symbols-outlined text-4xl text-text-sub-light mb-2">cloud_upload</span>`
                    }
                </div>
                <p class="text-sm text-text-sub-light dark:text-text-sub-dark">Click to upload thumbnail</p>
                <input type="file" id="edit-course-thumbnail" accept="image/*" class="hidden" onchange="handleCourseThumbnailUpload(event)">
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Price ($)</label>
                <input type="number" step="0.01" id="edit-course-price" value="${course.price || 49}" min="0" max="99999" 
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
            </div>
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Billing</label>
                <select id="edit-course-billing"
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
                    <option value="monthly" ${course.billing === 'monthly' ? 'selected' : ''}>Monthly</option>
                    <option value="yearly" ${course.billing === 'yearly' ? 'selected' : ''}>Yearly</option>
                    <option value="onetime" ${course.billing === 'onetime' ? 'selected' : ''}>One-time</option>
                </select>
            </div>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Skool Community Link</label>
            <input type="url" id="edit-course-link" value="${course.skool_url || 'https://www.skool.com/dogfathersplus'}" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
        </div>

        <div class="pt-4">
            <button type="submit" class="w-full h-12 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg transition-colors">
                Save Course Settings
            </button>
        </div>
    </form>`;
}

// Ride-Along Save Handler
async function saveEditRideAlong(e) {
    e.preventDefault();
    const pkg = state.editModal.data;
    
    const name = document.getElementById('edit-ridealong-name')?.value?.trim();
    const priceVal = document.getElementById('edit-ridealong-price')?.value;
    const duration = document.getElementById('edit-ridealong-duration')?.value?.trim() || '';
    const description = document.getElementById('edit-ridealong-description')?.value?.trim() || '';
    const featuresText = document.getElementById('edit-ridealong-features')?.value || '';
    const isPopular = document.getElementById('edit-ridealong-popular')?.checked || false;
    
    if (!name) {
        showToast('Package name is required', 'error');
        return;
    }
    
    const price = parseFloat(priceVal);
    if (isNaN(price) || price < 0) {
        showToast('Please enter a valid price', 'error');
        return;
    }
    
    const featuresArray = featuresText.split('\n').filter(f => f.trim());
    
    const pkgData = {
        name: name,
        price: price,
        duration: duration,
        description: description,
        features: JSON.stringify(featuresArray),
        is_popular: isPopular
    };
    
    _log('Saving ride-along:', pkgData, 'ID:', pkg.id);
    showLoading();
    
    try {
        if (pkg.id) {
            const { data, error } = await supabaseClient
                .from('ride_along_packages')
                .update(pkgData)
                .eq('id', pkg.id)
                .select();
            
            if (error) {
                console.error('Package update error:', error);
                hideLoading();
                showToast('Failed to update: ' + (error.message || 'Unknown error'), 'error');
                return;
            }
            showToast('Package updated!', 'success');
        } else {
            pkgData.is_active = true;
            pkgData.sort_order = 0;
            
            const { data, error } = await supabaseClient
                .from('ride_along_packages')
                .insert(pkgData)
                .select();
            
            if (error) {
                console.error('Package insert error:', error);
                hideLoading();
                showToast('Failed to add: ' + (error.message || 'Unknown error'), 'error');
                return;
            }
            showToast('Package added!', 'success');
        }
        
        await loadPublicData();
        hideLoading();
        closeEditModal();
    } catch (err) {
        console.error('Exception:', err);
        hideLoading();
        showToast('Error: ' + err.message, 'error');
    }
}

// Course Thumbnail Upload (Modal)
function handleCourseThumbnailUpload(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be less than 5MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            state.editModal.data.thumbnail_url = e.target.result;
            const preview = document.getElementById('course-thumbnail-preview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" class="max-h-32 mx-auto rounded-lg mb-2"/>`;
            }
            showToast('Thumbnail uploaded!', 'success');
        };
        reader.readAsDataURL(file);
    }
}

// Course Thumbnail Upload (Inline Education Tab)
function handleInlineCourseThumbnail(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be less than 5MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            // Store in localStorage
            const courseSettings = JSON.parse(localStorage.getItem('courseSettings') || '{}');
            courseSettings.thumbnail_url = e.target.result;
            localStorage.setItem('courseSettings', JSON.stringify(courseSettings));
            
            // Update preview
            const preview = document.getElementById('course-thumbnail-inline-preview');
            if (preview) {
                preview.innerHTML = `
                    <img src="${e.target.result}" class="max-h-40 mx-auto rounded-lg shadow-lg mb-3"/>
                    <p class="text-green-600 font-bold text-sm"><span class="material-symbols-outlined text-sm align-middle">check_circle</span> Thumbnail uploaded!</p>
                    <p class="text-slate-500 text-xs mt-1">Click to change</p>
                `;
            }
            showToast('Course thumbnail uploaded!', 'success');
        };
        reader.readAsDataURL(file);
    }
}

// Course Save Handler (stores in localStorage for now as course is single entity)
async function saveEditCourse(e) {
    e.preventDefault();
    
    const courseData = {
        title: document.getElementById('edit-course-title').value,
        instructor: document.getElementById('edit-course-instructor').value,
        tagline: document.getElementById('edit-course-tagline').value,
        price: parseFloat(document.getElementById('edit-course-price').value),
        billing: document.getElementById('edit-course-billing').value,
        skool_url: document.getElementById('edit-course-link').value,
        thumbnail_url: state.editModal.data.thumbnail_url || ''
    };
    
    // Save to localStorage (or could create a settings table in Supabase)
    localStorage.setItem('courseSettings', JSON.stringify(courseData));
    
    showToast('Course settings saved!', 'success');
    closeEditModal();
}

// Delete Ride-Along
function confirmDeleteRideAlong(id, name) {
    showConfirm('Delete Package', `Are you sure you want to delete "${name}"?`, async () => {
        showLoading();
        try {
            const { error } = await supabaseClient.from('ride_along_packages').update({ is_active: false }).eq('id', id);
            if (error) {
                console.error('Delete package error:', error);
                hideLoading();
                showToast('Failed to delete: ' + (error.message || 'Unknown error'), 'error');
                return;
            }
            await loadPublicData();
            hideLoading();
            showToast('Package deleted', 'success');
            closeEditModal();
        } catch (err) {
            console.error('Exception:', err);
            hideLoading();
            showToast('Error: ' + err.message, 'error');
        }
    }, () => {}, 'Delete');
}

// Inline Course Save (from education tab form)
function saveCourseInline() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        showToast('Course changes saved!', 'success');
    }, 500);
}

function renderPetEditForm(pet) {
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 25}, (_, i) => currentYear - i);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const isOtherBreed = pet.breed && !popularBreeds.slice(0, -1).includes(pet.breed);
    
    return `
    <form id="edit-pet-form" class="space-y-4">
        <!-- Photo -->
        <div class="flex justify-center mb-4">
            <div class="relative">
                <div id="edit-pet-photo-preview" class="w-24 h-24 rounded-full bg-background-light dark:bg-background-dark border-2 border-dashed border-border-light dark:border-border-dark flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors" onclick="document.getElementById('edit-pet-photo').click()">
                    ${pet.photo_url ? 
                        `<img src="${pet.photo_url}" class="w-full h-full object-cover"/>` : 
                        `<span class="material-symbols-outlined text-3xl text-text-sub-light">add_a_photo</span>`
                    }
                </div>
                <input type="file" id="edit-pet-photo" accept="image/*" class="hidden" onchange="handleEditPetPhoto(event)">
            </div>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Pet Name *</label>
            <input type="text" id="edit-pet-name" value="${pet.name || ''}" placeholder="Max" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Breed *</label>
            <select id="edit-pet-breed" onchange="handleEditBreedChange(this.value)"
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
                <option value="">Select breed...</option>
                ${popularBreeds.map(breed => `<option value="${breed}" ${pet.breed === breed || (isOtherBreed && breed === 'Other') ? 'selected' : ''}>${breed}</option>`).join('')}
            </select>
        </div>

        <div id="edit-breed-other-container" class="${isOtherBreed ? '' : 'hidden'}">
            <label class="block text-sm font-semibold mb-2 dark:text-white">Specify Breed *</label>
            <input type="text" id="edit-pet-breed-other" value="${isOtherBreed ? pet.breed : ''}" placeholder="Enter breed" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Weight (lbs) *</label>
                <input type="number" id="edit-pet-weight" value="${pet.weight || ''}" placeholder="50" min="1" max="300"
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
            </div>
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Gender</label>
                <select id="edit-pet-gender"
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
                    <option value="male" ${pet.gender === 'male' ? 'selected' : ''}>Male</option>
                    <option value="female" ${pet.gender === 'female' ? 'selected' : ''}>Female</option>
                </select>
            </div>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Coat Type</label>
            <select id="edit-pet-coat-type"
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
                <option value="">Auto-detect from breed</option>
                <option value="short" ${pet.coat_type === 'short' ? 'selected' : ''}>Short Coat</option>
                <option value="wire" ${pet.coat_type === 'wire' ? 'selected' : ''}>Wire Coat</option>
                <option value="soft" ${pet.coat_type === 'soft' ? 'selected' : ''}>Soft Coat</option>
                <option value="double" ${pet.coat_type === 'double' ? 'selected' : ''}>Double Coat</option>
                <option value="doodle" ${pet.coat_type === 'doodle' ? 'selected' : ''}>Doodle Breed</option>
            </select>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Birthday (optional)</label>
            <div class="grid grid-cols-2 gap-4">
                <select id="edit-pet-birth-month"
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
                    <option value="">Month</option>
                    ${months.map((month, i) => `<option value="${i + 1}" ${pet.birth_month == (i + 1) ? 'selected' : ''}>${month}</option>`).join('')}
                </select>
                <select id="edit-pet-birth-year"
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
                    <option value="">Year</option>
                    ${years.map(year => `<option value="${year}" ${pet.birth_year == year ? 'selected' : ''}>${year}</option>`).join('')}
                </select>
            </div>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Special Notes</label>
            <textarea id="edit-pet-notes" placeholder="Allergies, sensitivities, special care..." 
                class="w-full h-20 px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white resize-none">${pet.grooming_notes || ''}</textarea>
        </div>

        <div class="flex gap-3 pt-4">
            ${pet.id ? `<button type="button" onclick="confirmDeletePet('${pet.id}', '${escapeHtml(pet.name)}')" class="px-4 h-12 border border-amber-300 text-amber-600 rounded-lg font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-1"><span class="material-symbols-outlined text-sm">archive</span>Archive</button>` : ''}
            <button type="submit" class="flex-1 h-12 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg transition-colors">
                ${pet.id ? 'Save Changes' : 'Add Pet'}
            </button>
        </div>
    </form>`;
}

function renderProfileEditForm(profile) {
    return `
    <form id="edit-profile-form" class="space-y-4">
        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Full Name *</label>
            <input type="text" id="edit-profile-name" value="${profile.name || ''}" placeholder="John Smith" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Phone Number</label>
            <input type="tel" id="edit-profile-phone" value="${profile.phone || ''}" placeholder="(555) 123-4567" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Street Address</label>
            <input type="text" id="edit-profile-address" value="${profile.address || ''}" placeholder="123 Main St" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">City</label>
                <input type="text" id="edit-profile-city" value="${profile.city || ''}" placeholder="Los Angeles" 
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
            </div>
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">ZIP Code</label>
                <input type="text" id="edit-profile-zip" value="${profile.zip || ''}" placeholder="90001" 
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
            </div>
        </div>

        <div class="pt-4">
            <button type="submit" class="w-full h-12 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg transition-colors">
                Save Changes
            </button>
        </div>
    </form>`;
}

function renderRewardEditForm(reward) {
    return `
    <form id="edit-reward-form" class="space-y-4">
        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Reward Name *</label>
            <input type="text" id="edit-reward-name" value="${reward.name || ''}" placeholder="Free Bath & Brush" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Description</label>
            <textarea id="edit-reward-description" placeholder="Describe this reward..." 
                class="w-full h-20 px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white resize-none">${reward.description || ''}</textarea>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Points Required *</label>
            <input type="number" id="edit-reward-points" value="${reward.points_required || reward.points || ''}" placeholder="500" min="1" max="99999" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
        </div>

        <div class="flex gap-3 pt-4">
            ${reward.id ? `<button type="button" onclick="confirmDeleteReward('${reward.id}', '${reward.name}')" class="px-4 h-12 border border-red-300 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors">Delete</button>` : ''}
            <button type="submit" class="flex-1 h-12 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg transition-colors">
                ${reward.id ? 'Save Changes' : 'Add Reward'}
            </button>
        </div>
    </form>`;
}

function renderProductEditForm(product) {
    return `
    <form id="edit-product-form" class="space-y-4">
        <!-- Product Image Upload -->
        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Product Image</label>
            <div class="border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors" onclick="document.getElementById('edit-product-image-file').click()">
                <div id="product-image-preview">
                    ${product.image_url ? 
                        `<img src="${product.image_url}" class="max-h-32 mx-auto rounded-lg mb-2" alt="Product"/>` :
                        `<span class="material-symbols-outlined text-4xl text-text-sub-light dark:text-text-sub-dark block mb-2">add_photo_alternate</span>`
                    }
                </div>
                <p class="text-sm text-text-sub-light dark:text-text-sub-dark">Click to upload image</p>
                <p class="text-xs text-text-sub-light dark:text-text-sub-dark mt-1">PNG, JPG up to 5MB</p>
                <input type="file" id="edit-product-image-file" accept="image/*" class="hidden" onchange="handleProductImageUpload(event)">
                <input type="hidden" id="edit-product-image" value="${product.image_url || ''}">
            </div>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Product Name *</label>
            <input type="text" id="edit-product-name" value="${product.name || ''}" placeholder="Oatmeal Shampoo" 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Description</label>
            <textarea id="edit-product-description" placeholder="Product description..." 
                class="w-full h-20 px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white resize-none">${product.description || ''}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Price *</label>
                <input type="number" step="0.01" id="edit-product-price" value="${product.price || ''}" placeholder="14.99" min="0" max="99999" 
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
            </div>
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Category</label>
                <select id="edit-product-category"
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
                    <option value="grooming" ${product.category === 'grooming' ? 'selected' : ''}>Grooming</option>
                    <option value="treats" ${product.category === 'treats' ? 'selected' : ''}>Treats</option>
                    <option value="toys" ${product.category === 'toys' ? 'selected' : ''}>Toys</option>
                    <option value="health" ${product.category === 'health' ? 'selected' : ''}>Health</option>
                </select>
            </div>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Affiliate Link</label>
            <input type="url" id="edit-product-link" value="${product.affiliate_url || ''}" placeholder="https://amazon.com/..." 
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
        </div>

        <div class="flex gap-3 pt-4">
            ${product.id ? `<button type="button" onclick="confirmDeleteProduct('${product.id}', '${(product.name || '').replace(/'/g, "\\'")}')" class="px-4 h-12 border border-red-300 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors">Delete</button>` : ''}
            <button type="submit" class="flex-1 h-12 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg transition-colors">
                ${product.id ? 'Save Changes' : 'Add Product'}
            </button>
        </div>
    </form>`;
}

// Product Image Upload Handler
function handleProductImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be less than 5MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            // Store in hidden field and state
            document.getElementById('edit-product-image').value = e.target.result;
            if (state.editModal) {
                state.editModal.data.image_url = e.target.result;
            }
            // Update preview
            const preview = document.getElementById('product-image-preview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" class="max-h-32 mx-auto rounded-lg mb-2" alt="Product"/>`;
            }
            showToast('Image uploaded!', 'success');
        };
        reader.readAsDataURL(file);
    }
}

function renderAppointmentEditForm(apt) {
    const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    return `
    <form id="edit-appointment-form" class="space-y-4">
        <div class="p-4 bg-background-light dark:bg-background-dark rounded-xl">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary">pets</span>
                </div>
                <div>
                    <p class="font-bold dark:text-white">${apt.petName || apt.pet?.name || 'Pet'}</p>
                    <p class="text-sm text-text-sub-light dark:text-text-sub-dark">${apt.customerName || apt.customer?.full_name || 'Customer'}</p>
                </div>
            </div>
            <div class="text-sm text-text-sub-light dark:text-text-sub-dark space-y-1">
                <p><strong>Service:</strong> ${apt.serviceName || apt.service?.name || 'Grooming'}</p>
                <p><strong>Date:</strong> ${formatDate(apt.appointment_date || apt.date)}</p>
                <p><strong>Time:</strong> ${formatTime(apt.start_time || apt.time)}</p>
                ${apt.service_address ? `<p><strong>Address:</strong> ${apt.service_address}, ${apt.service_city || ''}</p>` : ''}
            </div>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Status</label>
            <select id="edit-appointment-status"
                class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
                ${statuses.map(s => `<option value="${s}" ${apt.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>`).join('')}
            </select>
        </div>

        <div>
            <label class="block text-sm font-semibold mb-2 dark:text-white">Admin Notes</label>
            <textarea id="edit-appointment-notes" placeholder="Internal notes..." 
                class="w-full h-20 px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white resize-none">${apt.admin_notes || ''}</textarea>
        </div>

        <div class="flex gap-3 pt-4">
            <button type="button" onclick="closeEditModal()" class="flex-1 h-12 border border-border-light dark:border-border-dark rounded-lg font-bold hover:bg-background-light dark:hover:bg-background-dark dark:text-white transition-colors">Cancel</button>
            <button type="submit" class="flex-1 h-12 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg transition-colors">
                Update
            </button>
        </div>
    </form>`;
}

// Edit handlers
function handleEditBreedChange(value) {
    const container = document.getElementById('edit-breed-other-container');
    if (container) {
        container.classList.toggle('hidden', value !== 'Other');
    }
}

function handleEditPetPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be less than 5MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            state.editModal.data.photo_url = e.target.result;
            const preview = document.getElementById('edit-pet-photo-preview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover"/>`;
            }
        };
        reader.readAsDataURL(file);
    }
}

async function saveEditPet(e) {
    e.preventDefault();
    const pet = state.editModal.data;
    
    // Get form values
    const name = document.getElementById('edit-pet-name').value.trim();
    let breed = document.getElementById('edit-pet-breed').value;
    if (breed === 'Other') {
        breed = document.getElementById('edit-pet-breed-other').value;
    }
    const weightValue = document.getElementById('edit-pet-weight').value;
    
    // VALIDATION
    if (!name) {
        showToast('Please enter your pet\'s name', 'error');
        return;
    }
    if (!breed) {
        showToast('Please select a breed', 'error');
        return;
    }
    const weight = parseFloat(weightValue);
    if (!weight || weight < 1 || weight > 300) {
        showToast('Please enter a valid weight (1-300 lbs)', 'error');
        return;
    }
    
    // Get birthday values
    const birthMonth = document.getElementById('edit-pet-birth-month')?.value;
    const birthYear = document.getElementById('edit-pet-birth-year')?.value;
    
    // Calculate age from birth year if provided
    let ageYears = null;
    if (birthYear) {
        ageYears = new Date().getFullYear() - parseInt(birthYear);
    }
    
    const coatTypeValue = document.getElementById('edit-pet-coat-type')?.value || '';
    const petData = {
        name: name,
        breed: breed,
        weight: weight,
        gender: document.getElementById('edit-pet-gender').value,
        coat_type: coatTypeValue || detectCoatType(breed) || null,
        grooming_notes: document.getElementById('edit-pet-notes').value,
        photo_url: state.editModal.data.photo_url || pet.photo_url
    };
    
    // Add optional fields
    if (ageYears !== null) petData.age_years = ageYears;
    if (birthMonth) petData.birth_month = parseInt(birthMonth);
    if (birthYear) petData.birth_year = parseInt(birthYear);
    
    showLoading();
    
    if (pet.id) {
        // Update existing pet
        const { error } = await supabaseClient
            .from('pets')
            .update(petData)
            .eq('id', pet.id);
        
        if (error) {
            hideLoading();
            showToast('Failed to update pet', 'error');
            return;
        }
        
        // Update local state
        const index = state.pets.findIndex(p => p.id === pet.id);
        if (index !== -1) {
            state.pets[index] = { ...state.pets[index], ...petData };
        }
        showToast('Pet updated!', 'success');
    } else {
        // Create new pet
        petData.owner_id = state.currentUser.id;
        petData.is_active = true;  // IMPORTANT: Must be true to show up
        const { data, error } = await supabaseClient
            .from('pets')
            .insert(petData)
            .select()
            .single();
        
        if (error) {
            hideLoading();
            showToast('Failed to add pet: ' + error.message, 'error');
            return;
        }
        
        state.pets.push(data);
        showToast('Pet added!', 'success');
    }
    
    hideLoading();
    closeEditModal();
}

async function saveEditProfile(e) {
    e.preventDefault();
    
    const profileData = {
        full_name: document.getElementById('edit-profile-name').value,
        phone: document.getElementById('edit-profile-phone').value,
        address: document.getElementById('edit-profile-address').value,
        city: document.getElementById('edit-profile-city').value,
        zip_code: document.getElementById('edit-profile-zip').value
    };
    
    showLoading();
    
    const { error } = await supabaseClient
        .from('profiles')
        .update(profileData)
        .eq('id', state.currentUser.id);
    
    if (error) {
        hideLoading();
        showToast('Failed to update profile', 'error');
        return;
    }
    
    // Update local state
    state.currentUser.name = profileData.full_name;
    state.currentUser.phone = profileData.phone;
    state.currentUser.address = profileData.address;
    state.currentUser.city = profileData.city;
    state.currentUser.zip = profileData.zip_code;
    
    hideLoading();
    showToast('Profile updated!', 'success');
    closeEditModal();
}

async function saveEditReward(e) {
    e.preventDefault();
    const reward = state.editModal.data;
    
    const name = document.getElementById('edit-reward-name')?.value?.trim();
    const description = document.getElementById('edit-reward-description')?.value?.trim() || '';
    const pointsVal = document.getElementById('edit-reward-points')?.value;
    
    if (!name) {
        showToast('Reward name is required', 'error');
        return;
    }
    
    const points = parseInt(pointsVal);
    if (isNaN(points) || points < 0) {
        showToast('Please enter valid points', 'error');
        return;
    }
    
    const rewardData = {
        name: name,
        description: description,
        points_required: points
    };
    
    _log('Saving reward:', rewardData, 'ID:', reward.id);
    showLoading();
    
    try {
        if (reward.id) {
            const { data, error } = await supabaseClient
                .from('rewards')
                .update(rewardData)
                .eq('id', reward.id)
                .select();
            
            if (error) {
                console.error('Reward update error:', error);
                hideLoading();
                showToast('Failed to update: ' + (error.message || 'Unknown error'), 'error');
                return;
            }
            showToast('Reward updated!', 'success');
        } else {
            rewardData.is_active = true;
            const { data, error } = await supabaseClient
                .from('rewards')
                .insert(rewardData)
                .select();
            
            if (error) {
                console.error('Reward insert error:', error);
                hideLoading();
                showToast('Failed to add: ' + (error.message || 'Unknown error'), 'error');
                return;
            }
            showToast('Reward added!', 'success');
        }
        
        await loadPublicData();
        hideLoading();
        closeEditModal();
    } catch (err) {
        console.error('Exception:', err);
        hideLoading();
        showToast('Error: ' + err.message, 'error');
    }
}

async function saveEditProduct(e) {
    e.preventDefault();
    const product = state.editModal.data;
    
    // Get form values
    const name = document.getElementById('edit-product-name')?.value?.trim();
    const description = document.getElementById('edit-product-description')?.value?.trim() || '';
    const priceVal = document.getElementById('edit-product-price')?.value;
    const category = document.getElementById('edit-product-category')?.value || 'grooming';
    const affiliateUrl = document.getElementById('edit-product-link')?.value?.trim() || '';
    const imageUrl = document.getElementById('edit-product-image')?.value?.trim() || '';
    
    // Validate required fields
    if (!name) {
        showToast('Product name is required', 'error');
        return;
    }
    
    const price = parseFloat(priceVal);
    if (isNaN(price) || price < 0) {
        showToast('Please enter a valid price', 'error');
        return;
    }
    
    const productData = {
        name: name,
        description: description,
        price: price,
        category: category,
        affiliate_url: affiliateUrl,
        image_url: imageUrl
    };
    
    _log('Saving product:', productData, 'ID:', product.id);
    
    showLoading();
    
    try {
        if (product.id) {
            const { data, error } = await supabaseClient
                .from('products')
                .update(productData)
                .eq('id', product.id)
                .select();
            
            if (error) {
                console.error('Update error:', error);
                hideLoading();
                showToast('Failed to update: ' + (error.message || 'Unknown error'), 'error');
                return;
            }
            _log('Update result:', data);
            showToast('Product updated!', 'success');
        } else {
            productData.is_active = true;
            productData.sort_order = 0;
            
            const { data, error } = await supabaseClient
                .from('products')
                .insert(productData)
                .select();
            
            if (error) {
                console.error('Insert error:', error);
                hideLoading();
                showToast('Failed to add: ' + (error.message || 'Unknown error'), 'error');
                return;
            }
            _log('Insert result:', data);
            showToast('Product added!', 'success');
        }
        
        await loadPublicData();
        hideLoading();
        closeEditModal();
    } catch (err) {
        console.error('Exception:', err);
        hideLoading();
        showToast('Error: ' + err.message, 'error');
    }
}

async function saveEditAppointment(e) {
    e.preventDefault();
    const apt = state.editModal.data;
    
    const status = document.getElementById('edit-appointment-status').value;
    const notes = document.getElementById('edit-appointment-notes').value;
    
    showLoading();
    
    const updateData = { status, admin_notes: notes };
    if (status === 'confirmed') updateData.confirmed_at = new Date().toISOString();
    if (status === 'completed') updateData.completed_at = new Date().toISOString();
    if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString();
    
    const { error } = await supabaseClient
        .from('appointments')
        .update(updateData)
        .eq('id', apt.id);
    
    if (error) {
        hideLoading();
        showToast('Failed to update appointment', 'error');
        return;
    }
    
    // Reload data
    if (state.currentUser.role === 'admin') {
        await loadAdminData();
    } else {
        await loadCustomerData(state.currentUser.id);
    }
    
    hideLoading();
    showToast('Appointment updated!', 'success');
    closeEditModal();
}

// Delete confirmations
function confirmDeletePet(id, name) {
    showConfirm('Archive Pet', `Archive ${name}? Their grooming history will be preserved and you can contact support to restore them later.`, async () => {
        showLoading();
        try {
            const { error } = await supabaseClient.from('pets').update({ is_active: false, deactivated_at: new Date().toISOString() }).eq('id', id);
            if (error) {
                console.error('Archive pet error:', error);
                hideLoading();
                showToast('Failed to archive: ' + (error.message || 'Unknown error'), 'error');
                return;
            }
            state.pets = state.pets.filter(p => p.id !== id);
            hideLoading();
            showToast(`${name} archived — history preserved`, 'success');
            closeEditModal();
        } catch (err) {
            console.error('Exception:', err);
            hideLoading();
            showToast('Error: ' + err.message, 'error');
        }
    }, () => {}, 'Archive');
}

function confirmDeleteReward(id, name) {
    showConfirm('Delete Reward', `Are you sure you want to delete "${name}"?`, async () => {
        showLoading();
        try {
            const { error } = await supabaseClient.from('rewards').update({ is_active: false }).eq('id', id);
            if (error) {
                console.error('Delete reward error:', error);
                hideLoading();
                showToast('Failed to delete: ' + (error.message || 'Unknown error'), 'error');
                return;
            }
            await loadPublicData();
            hideLoading();
            showToast('Reward deleted', 'success');
            closeEditModal();
        } catch (err) {
            console.error('Exception:', err);
            hideLoading();
            showToast('Error: ' + err.message, 'error');
        }
    }, () => {}, 'Delete');
}

function confirmDeleteProduct(id, name) {
    showConfirm('Delete Product', `Are you sure you want to delete "${name}"?`, async () => {
        showLoading();
        try {
            const { error } = await supabaseClient.from('products').update({ is_active: false }).eq('id', id);
            if (error) {
                console.error('Delete product error:', error);
                hideLoading();
                showToast('Failed to delete: ' + (error.message || 'Unknown error'), 'error');
                return;
            }
            await loadPublicData();
            hideLoading();
            showToast('Product deleted', 'success');
            closeEditModal();
        } catch (err) {
            console.error('Exception:', err);
            hideLoading();
            showToast('Error: ' + err.message, 'error');
        }
    }, () => {}, 'Delete');
}

// =============================================
// ADMIN DASHBOARD HELPER FUNCTIONS
// =============================================

// Export dashboard data as CSV
function exportDashboardData() {
    const appointments = data.appointments;
    if (appointments.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    const headers = ['Date', 'Time', 'Pet', 'Customer', 'Service', 'Groomer', 'Status', 'Price'];
    const rows = appointments.map(a => [
        a.appointment_date || '',
        a.start_time || '',
        a.petName || '',
        a.customerName || '',
        a.serviceName || '',
        a.groomerName || 'Unassigned',
        a.status || '',
        a.total_price || a.base_price || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `appointments_${getTodayPacific()}.csv`;
    link.click();
    showToast('Export downloaded', 'success');
}

// View appointment details modal
function viewAppointmentDetails(appointmentId) {
    const appointment = data.appointments.find(a => a.id === appointmentId);
    if (!appointment) {
        showToast('Appointment not found', 'error');
        return;
    }
    state.selectedAppointment = appointment;
    state.showAppointmentDetail = true;
    render();
}

// Open edit appointment modal
function openEditAppointmentModal(appointmentId) {
    const appointment = data.appointments.find(a => a.id === appointmentId);
    if (!appointment) {
        showToast('Appointment not found', 'error');
        return;
    }
    // For now, show a toast - can be enhanced with full edit modal later
    showToast('Edit appointment feature coming soon. Use status dropdown to update.', 'info');
}

// Confirm delete appointment
function confirmDeleteAppointment(appointmentId) {
    const appointment = data.appointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    showConfirm('Delete Appointment', `Are you sure you want to delete the appointment for ${appointment.petName || 'this pet'}?`, async () => {
        showLoading();
        try {
            const { error } = await supabaseClient
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', appointmentId);
            
            if (error) throw error;
            await loadAdminData();
            hideLoading();
            showToast('Appointment cancelled', 'success');
        } catch (err) {
            hideLoading();
            showToast('Error: ' + err.message, 'error');
        }
    }, () => {}, 'Delete');
}

// Appointment pagination
function prevAppointmentPage() {
    if ((state.appointmentPage || 1) > 1) {
        state.appointmentPage = (state.appointmentPage || 1) - 1;
        render();
    }
}

function nextAppointmentPage() {
    const totalPages = Math.ceil(data.appointments.length / 10);
    if ((state.appointmentPage || 1) < totalPages) {
        state.appointmentPage = (state.appointmentPage || 1) + 1;
        render();
    }
}

// Photo Gallery functions
function setAdminAppointmentsView(view) {
    state.adminAppointmentsView = view;
    render();
}

function setAdminGalleryGroomerFilter(groomerId) {
    state.adminGalleryGroomerFilter = groomerId;
    render();
}

function setAdminGalleryDateFilter(range) {
    state.adminGalleryDateFilter = range;
    render();
}

function openPhotoLightbox(appointmentId) {
    const apt = data.appointments.find(a => a.id === appointmentId);
    if (apt) {
        state.adminGalleryLightbox = apt;
        render();
    }
}

function closePhotoLightbox() {
    state.adminGalleryLightbox = null;
    render();
}

function renderAdminPhotoGallery() {
    const today = new Date();
    const todayStr = getTodayPacific();
    
    // Filter appointments that have photos
    let photoAppointments = data.appointments.filter(a => a.before_photo_url || a.after_photo_url);
    
    // Apply groomer filter
    if (state.adminGalleryGroomerFilter) {
        photoAppointments = photoAppointments.filter(a => a.assigned_groomer_id === state.adminGalleryGroomerFilter);
    }
    
    // Apply date filter
    if (state.adminGalleryDateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        photoAppointments = photoAppointments.filter(a => a.appointment_date >= weekAgoStr);
    } else if (state.adminGalleryDateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];
        photoAppointments = photoAppointments.filter(a => a.appointment_date >= monthAgoStr);
    }
    
    // Apply search filter
    if (state.adminGallerySearch) {
        const q = state.adminGallerySearch.toLowerCase().trim();
        photoAppointments = photoAppointments.filter(a => {
            return (a.petName || '').toLowerCase().includes(q) ||
                   (a.customerName || '').toLowerCase().includes(q) ||
                   (a.groomerName || '').toLowerCase().includes(q) ||
                   (a.petBreed || '').toLowerCase().includes(q);
        });
    }
    
    // Sort newest first
    photoAppointments.sort((a, b) => (b.appointment_date || '').localeCompare(a.appointment_date || ''));
    
    // Get unique groomers for filter
    const groomersWithPhotos = [];
    const seenGroomers = new Set();
    data.appointments.filter(a => a.before_photo_url || a.after_photo_url).forEach(a => {
        if (a.assigned_groomer_id && !seenGroomers.has(a.assigned_groomer_id)) {
            seenGroomers.add(a.assigned_groomer_id);
            groomersWithPhotos.push({ id: a.assigned_groomer_id, name: a.groomerName || 'Unknown' });
        }
    });
    
    const lightbox = state.adminGalleryLightbox;
    
    return `
        <!-- Gallery Filters -->
        <div class="flex flex-wrap items-center gap-3 mb-1">
            <div class="relative flex-1 min-w-[180px] max-w-xs">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">search</span>
                <input oninput="state.adminGallerySearch = this.value; render();" value="${state.adminGallerySearch || ''}" class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" placeholder="Search pet, customer, groomer..." type="text"/>
            </div>
            <div class="flex bg-slate-100 rounded-lg p-1">
                <button onclick="setAdminGalleryDateFilter('all')" class="px-3 py-1.5 rounded-md text-xs font-bold transition-all ${state.adminGalleryDateFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">All Time</button>
                <button onclick="setAdminGalleryDateFilter('month')" class="px-3 py-1.5 rounded-md text-xs font-bold transition-all ${state.adminGalleryDateFilter === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">This Month</button>
                <button onclick="setAdminGalleryDateFilter('week')" class="px-3 py-1.5 rounded-md text-xs font-bold transition-all ${state.adminGalleryDateFilter === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">This Week</button>
            </div>
            ${groomersWithPhotos.length > 1 ? `
            <select onchange="setAdminGalleryGroomerFilter(this.value)" class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 cursor-pointer">
                <option value="" ${!state.adminGalleryGroomerFilter ? 'selected' : ''}>All Groomers</option>
                ${groomersWithPhotos.map(g => `<option value="${g.id}" ${state.adminGalleryGroomerFilter === g.id ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
            </select>
            ` : ''}
            <span class="text-xs text-slate-400 font-medium ml-auto">${photoAppointments.length} photo${photoAppointments.length !== 1 ? 's' : ''}</span>
        </div>
        
        ${photoAppointments.length === 0 ? `
        <div class="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <span class="material-symbols-outlined text-5xl text-slate-300 mb-3">photo_camera</span>
            <h3 class="text-lg font-bold text-slate-700 mb-1">No photos yet</h3>
            <p class="text-sm text-slate-400">Before &amp; after photos will appear here once groomers start uploading them during appointments.</p>
        </div>
        ` : `
        <!-- Photo Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${photoAppointments.map(apt => {
                const dateObj = new Date(apt.appointment_date + 'T12:00:00');
                const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const petName = apt.petName || apt.pet?.name || 'Pet';
                const groomerName = (apt.groomerName || apt.groomer?.full_name || 'Groomer').split(' ')[0];
                const hasBoth = apt.before_photo_url && apt.after_photo_url;
                
                return `
                <div onclick="openPhotoLightbox('${apt.id}')" class="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-300 transition-all group">
                    <div class="grid ${hasBoth ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5 bg-slate-100">
                        ${apt.before_photo_url ? `
                        <div class="relative aspect-[4/3] overflow-hidden">
                            <img src="${apt.before_photo_url}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Before"/>
                            <span class="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded-full uppercase">Before</span>
                        </div>
                        ` : ''}
                        ${apt.after_photo_url ? `
                        <div class="relative aspect-[4/3] overflow-hidden">
                            <img src="${apt.after_photo_url}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="After"/>
                            <span class="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500/80 text-white text-[10px] font-bold rounded-full uppercase">After</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="px-3 py-2.5 flex items-center justify-between">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="material-symbols-outlined text-base text-slate-400">pets</span>
                            <span class="text-sm font-bold text-slate-800 truncate">${escapeHtml(petName)}</span>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <span class="text-xs text-slate-400">${escapeHtml(groomerName)}</span>
                            <span class="text-xs text-slate-400">·</span>
                            <span class="text-xs text-slate-400">${dateLabel}</span>
                        </div>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        `}
        
        ${lightbox ? `
        <!-- Photo Lightbox -->
        <div class="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onclick="closePhotoLightbox()">
            <div class="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onclick="event.stopPropagation()">
                <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h3 class="font-bold text-slate-900 dark:text-white">${escapeHtml(lightbox.petName || lightbox.pet?.name || 'Pet')} — Grooming Photos</h3>
                        <p class="text-sm text-slate-500">${new Date(lightbox.appointment_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · ${escapeHtml((lightbox.groomerName || 'Groomer').split(' ')[0])}</p>
                    </div>
                    <button onclick="closePhotoLightbox()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="p-4 space-y-4">
                    <div class="grid ${lightbox.before_photo_url && lightbox.after_photo_url ? 'grid-cols-2' : 'grid-cols-1'} gap-3">
                        ${lightbox.before_photo_url ? `
                        <div class="relative">
                            <img src="${lightbox.before_photo_url}" class="w-full rounded-xl border border-slate-200" alt="Before"/>
                            <span class="absolute bottom-3 left-3 px-3 py-1 bg-black/60 text-white text-xs font-bold rounded-lg">Before</span>
                        </div>
                        ` : ''}
                        ${lightbox.after_photo_url ? `
                        <div class="relative">
                            <img src="${lightbox.after_photo_url}" class="w-full rounded-xl border border-slate-200" alt="After"/>
                            <span class="absolute bottom-3 left-3 px-3 py-1 bg-emerald-500/80 text-white text-xs font-bold rounded-lg">After ✨</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-base text-slate-400">person</span>${escapeHtml(lightbox.customerName || 'Customer')}</div>
                        <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-base text-slate-400">pets</span>${escapeHtml(lightbox.petName || 'Pet')}${lightbox.petBreed ? ' · ' + escapeHtml(lightbox.petBreed) : ''}</div>
                        ${lightbox.serviceName ? `<div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-base text-slate-400">content_cut</span>${escapeHtml(lightbox.serviceName)}</div>` : ''}
                        ${lightbox.groomer_notes ? `<div class="w-full pt-2 border-t border-slate-200 dark:border-slate-700"><span class="font-medium text-slate-700 dark:text-slate-300">Notes:</span> ${escapeHtml(lightbox.groomer_notes)}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
    `;
}
function getMiniCalendarMonthLabel() {
    const date = state.miniCalendarDate ? new Date(state.miniCalendarDate + 'T12:00:00') : new Date();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function generateMiniCalendarDays() {
    const today = getTodayPacific();
    const baseDate = state.miniCalendarDate ? new Date(state.miniCalendarDate + 'T12:00:00') : new Date();
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Add empty cells for days before first of month
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push({ empty: true });
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        days.push({
            day: day,
            dateStr: dateStr,
            isToday: dateStr === today,
            isSelected: dateStr === state.selectedMiniCalendarDate
        });
    }
    
    return days;
}

function miniCalendarPrevMonth() {
    const current = state.miniCalendarDate ? new Date(state.miniCalendarDate + 'T12:00:00') : new Date();
    current.setMonth(current.getMonth() - 1);
    state.miniCalendarDate = current.toISOString().split('T')[0];
    render();
}

function miniCalendarNextMonth() {
    const current = state.miniCalendarDate ? new Date(state.miniCalendarDate + 'T12:00:00') : new Date();
    current.setMonth(current.getMonth() + 1);
    state.miniCalendarDate = current.toISOString().split('T')[0];
    render();
}

function goToMiniCalendarToday() {
    state.miniCalendarDate = getTodayPacific();
    state.selectedMiniCalendarDate = getTodayPacific();
    state.selectedCalendarDate = null; // Reset to show today
    render();
}

function selectMiniCalendarDate(dateStr) {
    state.selectedMiniCalendarDate = dateStr;
    state.selectedCalendarDate = dateStr;
    render();
}

// Save education settings
function saveEducationSettings() {
    showToast('Education settings saved', 'success');
}

// =============================================
// DEBOUNCED APPOINTMENT SEARCH
// =============================================

let appointmentSearchTimeout = null;
function handleAppointmentSearch(value) {
    state.appointmentSearchQuery = value;
    
    // Clear previous timeout
    if (appointmentSearchTimeout) {
        clearTimeout(appointmentSearchTimeout);
    }
    
    // Debounce: wait 300ms after user stops typing before re-rendering
    appointmentSearchTimeout = setTimeout(() => {
        state.appointmentPage = 1; // Reset to first page on search
        render();
        // Restore focus to search input after render
        setTimeout(() => {
            const input = document.getElementById('appointmentSearchInput');
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }, 10);
    }, 300);
}


// =============================================
// CUSTOMER TAB FUNCTIONS
// =============================================

let customerSearchTimeout = null;
function handleCustomerSearch(value) {
    state.customerSearchQuery = value;
    
    if (customerSearchTimeout) {
        clearTimeout(customerSearchTimeout);
    }
    
    customerSearchTimeout = setTimeout(() => {
        state.customerPage = 1;
        render();
        setTimeout(() => {
            const input = document.getElementById('customerSearchInput');
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }, 10);
    }, 300);
}

function exportCustomerData() {
    const customers = state.allCustomers.filter(c => c.role === 'customer');
    if (customers.length === 0) {
        showToast('No customers to export', 'warning');
        return;
    }
    
    const headers = ['Name', 'Email', 'Phone', 'Address', 'Loyalty Points', 'Total Visits', 'Total Spent', 'Last Visit'];
    const rows = customers.map(c => {
        const customerAppts = data.appointments.filter(a => a.customer_id === c.id);
        const lastAppt = customerAppts.sort((a, b) => (b.appointment_date || '').localeCompare(a.appointment_date || ''))[0];
        const totalSpent = customerAppts.filter(a => a.status === 'completed').reduce((sum, a) => sum + (parseFloat(a.total_price) || 0), 0);
        return [
            c.full_name || '',
            c.email || '',
            c.phone || '',
            c.address || '',
            c.loyalty_points || 0,
            customerAppts.length,
            totalSpent.toFixed(2),
            lastAppt?.appointment_date || 'Never'
        ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${getTodayPacific()}.csv`;
    link.click();
    showToast('Customer data exported', 'success');
}

function openCustomerDetailModal(customerId) {
    const customer = state.allCustomers.find(c => c.id === customerId);
    if (!customer) {
        showToast('Customer not found', 'error');
        return;
    }
    state.customerDetailModal = customer;
    render();
}

function closeCustomerDetailModal() {
    state.customerDetailModal = null;
    render();
}

function renderCustomerDetailModal() {
    const customer = state.customerDetailModal;
    if (!customer) return '';
    
    const customerPets = (state.pets || []).filter(p => p.owner_id === customer.id);
    const customerAppts = (data.appointments || []).filter(a => a.customer_id === customer.id).sort((a, b) => (b.appointment_date || '').localeCompare(a.appointment_date || ''));
    const completedAppts = customerAppts.filter(a => a.status === 'completed');
    const totalSpent = completedAppts.reduce((sum, a) => sum + (parseFloat(a.total_price) || parseFloat(a.base_price) || 0), 0);
    const initials = (customer.full_name || 'C').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const loyaltyTier = (customer.loyalty_points || 0) >= 200 ? 'Gold' : (customer.loyalty_points || 0) >= 100 ? 'Silver' : 'Bronze';
    const tierColors = { Gold: 'from-amber-400 to-amber-600', Silver: 'from-slate-400 to-slate-600', Bronze: 'from-orange-400 to-orange-600' };
    
    return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onclick="closeCustomerDetailModal()">
        <div class="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            <!-- Header with gradient -->
            <div class="relative bg-gradient-to-r ${tierColors[loyaltyTier]} p-6 text-white">
                <button onclick="closeCustomerDetailModal()" class="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
                <div class="flex items-center gap-4">
                    <div class="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold">
                        ${initials}
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold">${customer.full_name || 'Unknown'}</h2>
                        <p class="text-white/80">${loyaltyTier} Member • ${customer.loyalty_points || 0} points</p>
                    </div>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
                <!-- Contact Info -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-sm text-admin-primary">phone</span>
                            <span class="text-xs font-bold text-slate-500 uppercase">Phone</span>
                        </div>
                        <p class="text-sm font-medium text-slate-900 dark:text-white">${customer.phone || 'Not provided'}</p>
                    </div>
                    <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-sm text-admin-primary">mail</span>
                            <span class="text-xs font-bold text-slate-500 uppercase">Email</span>
                        </div>
                        <p class="text-sm font-medium text-slate-900 dark:text-white truncate">${customer.email || 'Not provided'}</p>
                    </div>
                    <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl sm:col-span-2">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-sm text-admin-primary">location_on</span>
                            <span class="text-xs font-bold text-slate-500 uppercase">Address</span>
                        </div>
                        <p class="text-sm font-medium text-slate-900 dark:text-white">${customer.address || 'Not provided'}</p>
                    </div>
                </div>
                
                <!-- Stats -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div class="text-center p-4 bg-admin-primary/5 rounded-xl border border-admin-primary/20">
                        <p class="text-2xl font-bold text-admin-primary">${customer.loyalty_points || 0}</p>
                        <p class="text-xs text-slate-500 font-medium">Points</p>
                    </div>
                    <div class="text-center p-4 bg-admin-accent/5 rounded-xl border border-admin-accent/20">
                        <p class="text-2xl font-bold text-admin-accent">${customerAppts.length}</p>
                        <p class="text-xs text-slate-500 font-medium">Total Visits</p>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <p class="text-2xl font-bold text-green-600">$${totalSpent.toFixed(0)}</p>
                        <p class="text-xs text-slate-500 font-medium">Total Spent</p>
                    </div>
                    <div class="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <p class="text-2xl font-bold text-purple-600">${customerPets.length}</p>
                        <p class="text-xs text-slate-500 font-medium">Pets</p>
                    </div>
                </div>
                
                <!-- Pets Section -->
                <div>
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-admin-primary">pets</span>Pets
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        ${customerPets.length > 0 ? customerPets.map(pet => `
                            <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div class="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                    ${pet.photo_url ? `<img src="${pet.photo_url}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-slate-400">pets</span>`}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-bold text-slate-900 dark:text-white">${escapeHtml(pet.name)}</p>
                                    <p class="text-xs text-slate-500">${pet.breed || 'Unknown breed'} • ${pet.weight ? pet.weight + ' lbs' : 'Weight N/A'}</p>
                                </div>
                            </div>
                        `).join('') : '<p class="text-sm text-slate-400 col-span-2">No pets registered</p>'}
                    </div>
                </div>
                
                <!-- Recent Appointments -->
                <div>
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-admin-primary">history</span>Recent Appointments
                    </h3>
                    <div class="space-y-2 max-h-[200px] overflow-y-auto">
                        ${customerAppts.length > 0 ? customerAppts.slice(0, 5).map(apt => `
                            <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div class="text-center min-w-[60px]">
                                    <p class="text-xs font-bold text-slate-400">${apt.appointment_date ? new Date(apt.appointment_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}</p>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-slate-900 dark:text-white">${apt.petName || 'Pet'} - ${apt.serviceName || 'Grooming'}</p>
                                    <p class="text-xs text-slate-500">${apt.groomerName || 'Unassigned'}</p>
                                </div>
                                <span class="px-2 py-1 text-xs font-bold rounded-full ${apt.status === 'completed' ? 'bg-green-100 text-green-700' : apt.status === 'confirmed' ? 'bg-teal-100 text-teal-700' : apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}">${apt.status}</span>
                                <p class="text-sm font-bold text-slate-700 dark:text-slate-300">$${(apt.total_price || apt.base_price || 0).toFixed(0)}</p>
                            </div>
                        `).join('') : '<p class="text-sm text-slate-400">No appointments yet</p>'}
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <button onclick="closeCustomerDetailModal()" class="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">
                    Close
                </button>
                <button onclick="closeCustomerDetailModal(); openAdminAddAppointment();" class="px-5 py-2.5 bg-admin-accent hover:bg-teal-600 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">calendar_add_on</span>Book Appointment
                </button>
            </div>
        </div>
    </div>`;
}

// =============================================
// QUICK VIEW APPOINTMENT MODAL
// =============================================

function openQuickViewAppointment(appointmentId) {
    const appointment = data.appointments.find(a => a.id === appointmentId);
    if (!appointment) {
        showToast('Appointment not found', 'error');
        return;
    }
    state.quickViewAppointment = appointment;
    render();
}

function closeQuickViewAppointment() {
    state.quickViewAppointment = null;
    render();
}

function renderQuickViewAppointmentModal() {
    const apt = state.quickViewAppointment;
    if (!apt) return '';
    
    const statusColors = {
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        confirmed: 'bg-teal-100 text-teal-700 border-teal-200',
        in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
        completed: 'bg-green-100 text-green-700 border-green-200',
        cancelled: 'bg-red-100 text-red-700 border-red-200',
        no_show: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    
    return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onmousedown="if(event.target === this) closeQuickViewAppointment()">
        <div class="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-admin-primary/5 to-transparent">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-admin-primary/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-admin-primary">visibility</span>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 dark:text-white">Quick View</h3>
                        <p class="text-xs text-slate-500">Appointment Details</p>
                    </div>
                </div>
                <button onclick="closeQuickViewAppointment()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <span class="material-symbols-outlined text-slate-400">close</span>
                </button>
            </div>
            
            <!-- Content -->
            <div class="p-6 space-y-5">
                <!-- Pet & Customer Info -->
                <div class="flex items-start gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                        ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-3xl text-slate-400">pets</span>`}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-xl font-bold text-slate-900 dark:text-white">${apt.petName || 'Unknown Pet'}</h4>
                        <p class="text-sm text-slate-500">${apt.petBreed || 'Unknown Breed'}</p>
                        <div class="mt-2 flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm text-slate-400">person</span>
                            <span class="text-sm text-slate-700 dark:text-slate-300">${apt.customerName || 'Unknown Customer'}</span>
                        </div>
                    </div>
                    <span class="px-3 py-1.5 rounded-full text-xs font-bold border ${statusColors[apt.status] || statusColors.pending}">${apt.status === 'in_progress' ? 'In Progress' : apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1) || 'Pending'}</span>
                </div>
                
                <!-- Details Grid -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-sm text-admin-primary">calendar_today</span>
                            <span class="text-xs font-bold text-slate-500 uppercase">Date</span>
                        </div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white">${apt.appointment_date ? new Date(apt.appointment_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Not set'}</p>
                    </div>
                    <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-sm text-admin-primary">schedule</span>
                            <span class="text-xs font-bold text-slate-500 uppercase">Time</span>
                        </div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white">${formatTime(apt.start_time)}</p>
                    </div>
                    <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-sm text-admin-primary">content_cut</span>
                            <span class="text-xs font-bold text-slate-500 uppercase">Service</span>
                        </div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white">${apt.serviceName || 'Full Grooming'}</p>
                    </div>
                    <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-sm text-admin-primary">payments</span>
                            <span class="text-xs font-bold text-slate-500 uppercase">Price</span>
                        </div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white">$${(apt.total_price || apt.base_price || 0).toFixed(2)}</p>
                    </div>
                </div>
                
                <!-- Groomer -->
                <div class="p-4 bg-admin-accent/5 border border-admin-accent/20 rounded-xl">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-admin-accent/20 flex items-center justify-center">
                            <span class="material-symbols-outlined text-admin-accent">badge</span>
                        </div>
                        <div class="flex-1">
                            <p class="text-xs font-bold text-slate-500 uppercase">Assigned Groomer</p>
                            <p class="text-sm font-bold text-slate-900 dark:text-white">${apt.groomerName || 'Not Assigned'}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Address -->
                ${apt.address ? `
                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="material-symbols-outlined text-sm text-admin-primary">location_on</span>
                        <span class="text-xs font-bold text-slate-500 uppercase">Address</span>
                    </div>
                    <p class="text-sm text-slate-700 dark:text-slate-300">${apt.address}</p>
                </div>
                ` : ''}
                
                <!-- Notes -->
                ${apt.notes ? `
                <div class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="material-symbols-outlined text-sm text-amber-600">note</span>
                        <span class="text-xs font-bold text-amber-700 uppercase">Notes</span>
                    </div>
                    <p class="text-sm text-amber-800 dark:text-amber-200">${apt.notes}</p>
                </div>
                ` : ''}
                
                <!-- Grooming Photos (Before/After) -->
                ${(apt.before_photo_url || apt.after_photo_url) ? `
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-admin-primary">photo_camera</span>
                        <span class="text-xs font-bold text-slate-500 uppercase">Grooming Photos</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        ${apt.before_photo_url ? `
                        <div class="relative">
                            <img src="${apt.before_photo_url}" class="w-full aspect-[4/3] object-cover rounded-xl border border-slate-200 dark:border-slate-700" alt="Before"/>
                            <span class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs font-bold rounded">Before</span>
                        </div>
                        ` : `
                        <div class="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            <span class="text-xs text-slate-400">No before photo</span>
                        </div>
                        `}
                        ${apt.after_photo_url ? `
                        <div class="relative">
                            <img src="${apt.after_photo_url}" class="w-full aspect-[4/3] object-cover rounded-xl border border-slate-200 dark:border-slate-700" alt="After"/>
                            <span class="absolute bottom-2 left-2 px-2 py-1 bg-emerald-500/80 text-white text-xs font-bold rounded">After</span>
                        </div>
                        ` : `
                        <div class="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            <span class="text-xs text-slate-400">No after photo</span>
                        </div>
                        `}
                    </div>
                </div>
                ` : ''}
            </div>
            
            <!-- Footer -->
            <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <button onclick="closeQuickViewAppointment()" class="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                    Close
                </button>
                <div class="flex items-center gap-2">
                    <select onchange="updateAppointmentStatus('${apt.id}', this.value); closeQuickViewAppointment();" class="px-3 py-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer">
                        <option value="" disabled selected>Change Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button onclick="closeQuickViewAppointment(); setTab('appointments');" class="px-4 py-2 bg-admin-accent hover:bg-teal-600 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">open_in_new</span>Full View
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

// =============================================
// ADMIN DASHBOARD WEEK/MONTH VIEW HELPERS
// =============================================

function getAdminDashboardWeekLabel() {
    const start = state.adminDashboardWeekStart ? new Date(state.adminDashboardWeekStart + 'T12:00:00') : new Date();
    const startOfWeek = new Date(start);
    startOfWeek.setDate(start.getDate() - start.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startOfWeek.getDate();
    const endDay = endOfWeek.getDate();
    
    if (startMonth === endMonth) {
        return `${startMonth} ${startDay} - ${endDay}, ${startOfWeek.getFullYear()}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endOfWeek.getFullYear()}`;
}

function getAdminDashboardWeekDays() {
    const start = state.adminDashboardWeekStart ? new Date(state.adminDashboardWeekStart + 'T12:00:00') : new Date();
    const startOfWeek = new Date(start);
    startOfWeek.setDate(start.getDate() - start.getDay());
    const today = getTodayPacific();
    const days = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const count = data.appointments.filter(a => a.appointment_date === dateStr && a.status !== 'cancelled').length;
        days.push({
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: date.getDate(),
            dateStr: dateStr,
            isToday: dateStr === today,
            count: count
        });
    }
    return days;
}

function getAdminDashboardWeekAppointments() {
    const start = state.adminDashboardWeekStart ? new Date(state.adminDashboardWeekStart + 'T12:00:00') : new Date();
    const startOfWeek = new Date(start);
    startOfWeek.setDate(start.getDate() - start.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startStr = startOfWeek.toISOString().split('T')[0];
    const endStr = endOfWeek.toISOString().split('T')[0];
    
    return data.appointments
        .filter(a => a.appointment_date >= startStr && a.appointment_date <= endStr && a.status !== 'cancelled')
        .sort((a, b) => {
            if (a.appointment_date !== b.appointment_date) {
                return a.appointment_date.localeCompare(b.appointment_date);
            }
            return (a.start_time || '').localeCompare(b.start_time || '');
        });
}

function adminDashboardPrevWeek() {
    const current = state.adminDashboardWeekStart ? new Date(state.adminDashboardWeekStart + 'T12:00:00') : new Date();
    current.setDate(current.getDate() - 7);
    state.adminDashboardWeekStart = current.toISOString().split('T')[0];
    render();
}

function adminDashboardNextWeek() {
    const current = state.adminDashboardWeekStart ? new Date(state.adminDashboardWeekStart + 'T12:00:00') : new Date();
    current.setDate(current.getDate() + 7);
    state.adminDashboardWeekStart = current.toISOString().split('T')[0];
    render();
}

function getAdminDashboardMonthLabel() {
    const date = state.adminDashboardMonth ? new Date(state.adminDashboardMonth + '-01T12:00:00') : new Date();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getAdminDashboardMonthDays() {
    const now = new Date();
    const baseDate = state.adminDashboardMonth ? new Date(state.adminDashboardMonth + '-01T12:00:00') : now;
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const today = getTodayPacific();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push({ empty: true });
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const count = data.appointments.filter(a => a.appointment_date === dateStr && a.status !== 'cancelled').length;
        days.push({
            day: day,
            dateStr: dateStr,
            isToday: dateStr === today,
            count: count
        });
    }
    
    return days;
}

function adminDashboardPrevMonth() {
    const scrollContainer = document.querySelector('.overflow-y-auto');
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    
    const current = state.adminDashboardMonth ? new Date(state.adminDashboardMonth + '-01T12:00:00') : new Date();
    current.setMonth(current.getMonth() - 1);
    state.adminDashboardMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    render();
    
    requestAnimationFrame(() => {
        const newScrollContainer = document.querySelector('.overflow-y-auto');
        if (newScrollContainer) newScrollContainer.scrollTop = scrollTop;
    });
}

function adminDashboardNextMonth() {
    const scrollContainer = document.querySelector('.overflow-y-auto');
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    
    const current = state.adminDashboardMonth ? new Date(state.adminDashboardMonth + '-01T12:00:00') : new Date();
    current.setMonth(current.getMonth() + 1);
    state.adminDashboardMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    render();
    
    requestAnimationFrame(() => {
        const newScrollContainer = document.querySelector('.overflow-y-auto');
        if (newScrollContainer) newScrollContainer.scrollTop = scrollTop;
    });
}

function resetDashboardMonth() {
    const scrollContainer = document.querySelector('.overflow-y-auto');
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    
    state.adminDashboardMonth = null;
    render();
    
    requestAnimationFrame(() => {
        const newScrollContainer = document.querySelector('.overflow-y-auto');
        if (newScrollContainer) newScrollContainer.scrollTop = scrollTop;
    });
}


function renderAdminDashboard() {
    const navItems = [
        {id:'dashboard',label:'Dashboard',icon:'dashboard'},
        {id:'appointments',label:'Appointments',icon:'calendar_month'},
        {id:'customers',label:'Customers',icon:'group'},
        {id:'groomers',label:'Groomers',icon:'content_cut'},
        {id:'coverage',label:'Coverage',icon:'map'},
        {id:'loyalty',label:'Loyalty',icon:'favorite', badge: state.pendingRedemptions?.length || 0},
        {id:'messages',label:'Messages',icon:'chat_bubble', badge: state.adminMessages?.filter(m => !m.is_read && m.to_admin)?.length || 0},
        {id:'services',label:'Services/Products',icon:'storefront'}
    ];
    
    const todayAppts = data.appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
    // Calculate actual revenue from appointment prices (not hardcoded)
    const totalRevenue = data.appointments
        .filter(a => a.status === 'confirmed' || a.status === 'completed')
        .reduce((sum, a) => sum + (parseFloat(a.total_price) || parseFloat(a.base_price) || 85), 0);
    
    return `
    <div class="flex h-screen w-full bg-admin-bg dark:bg-background-dark">
        <!-- Sidebar -->
        <aside class="w-[280px] flex-shrink-0 flex-col bg-admin-sidebar dark:bg-surface-dark border-r border-amber-100 dark:border-border-dark hidden lg:flex z-20">
            <div class="p-6 flex flex-col h-full">
                <div class="flex items-center gap-4 mb-6 px-2">
                    <div class="w-12 h-12 rounded-2xl shadow-md shadow-admin-primary/20 overflow-hidden">
                        <img src="${LOGO_MAIN}" alt="Dogfathersplus" class="w-full h-full object-cover"/>
                    </div>
                    <div class="flex flex-col">
                        <h1 class="text-slate-900 dark:text-white text-lg font-extrabold tracking-tight">Dogfathers<span class="text-admin-primary">plus</span></h1>
                        <p class="text-admin-primary dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">Admin Portal</p>
                    </div>
                </div>
                <nav class="flex flex-col gap-4 pt-4">
                    ${navItems.map(item => `
                        <button onclick="setTab('${item.id}')" class="flex items-center gap-4 px-5 py-4 rounded-xl transition-all group touch-target ${state.currentTab === item.id ? 'bg-gradient-to-r from-admin-primary/10 to-transparent text-admin-primary font-bold shadow-sm border-l-4 border-admin-primary' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-amber-50 dark:hover:bg-slate-800'}">
                            <span class="material-symbols-outlined text-[24px] ${state.currentTab === item.id ? 'text-admin-primary' : 'text-slate-400 group-hover:text-admin-primary'}">${item.icon}</span>
                            <span class="text-[16px] flex-1 ${state.currentTab === item.id ? '' : 'font-medium'}">${item.label}</span>
                            ${item.badge > 0 ? `<span class="px-2.5 py-1 bg-admin-accent text-white text-xs font-bold rounded-full">${item.badge}</span>` : ''}
                        </button>
                    `).join('')}
                </nav>
                <div class="flex-1"></div>
            </div>
            <div class="p-6 border-t border-amber-100 dark:border-border-dark">
                <button onclick="openChangePassword()" class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-800 font-medium transition-colors mb-2 touch-target">
                    <span class="material-symbols-outlined text-lg">password</span>Change Password
                </button>
                <button onclick="logout()" class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors touch-target">
                    <span class="material-symbols-outlined text-lg">logout</span>Sign Out
                </button>
            </div>
        </aside>

        <!-- Mobile Header -->
        <div class="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-admin-sidebar dark:bg-surface-dark border-b border-amber-100 dark:border-border-dark shadow-sm safe-top">
            <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg overflow-hidden"><img src="${LOGO_MAIN}" alt="Dogfathersplus" class="w-full h-full object-cover"/></div><span class="text-lg font-bold text-slate-900 dark:text-white">Dogfathers<span class="text-admin-primary">plus</span></span></div>
            <div class="flex items-center gap-1">
                <button onclick="toggleNotifications()" class="text-slate-600 dark:text-slate-400 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-slate-800 touch-target relative" title="Notifications">
                    <span class="material-symbols-outlined">notifications</span>
                    ${state.unreadNotifications > 0 ? `<span class="absolute top-0 right-0 w-5 h-5 bg-admin-accent text-white text-xs font-bold rounded-full flex items-center justify-center">${state.unreadNotifications > 9 ? '9+' : state.unreadNotifications}</span>` : ''}
                </button>
                <button onclick="refreshData()" class="text-slate-600 dark:text-slate-400 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-slate-800 touch-target" title="Refresh"><span class="material-symbols-outlined">refresh</span></button>
                <button onclick="toggleMobileMenu()" class="text-slate-600 dark:text-slate-400 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-slate-800 touch-target"><span class="material-symbols-outlined">menu</span></button>
            </div>
        </div>

        ${state.showMobileMenu ? `
        <div class="lg:hidden fixed inset-0 z-40 bg-black/50" onclick="toggleMobileMenu()">
            <div class="absolute left-0 top-0 bottom-0 w-72 bg-admin-sidebar dark:bg-surface-dark" onclick="event.stopPropagation()">
                <div class="p-6 border-b border-amber-100 dark:border-border-dark">
                    <p class="text-admin-primary font-bold text-sm uppercase">Admin Portal</p>
                </div>
                <nav class="p-4">${navItems.map(i => `<button onclick="setTab('${i.id}')" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left mb-1 touch-target ${state.currentTab === i.id ? 'bg-admin-primary/10 text-admin-primary font-bold' : 'hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}"><span class="material-symbols-outlined">${i.icon}</span>${i.label}</button>`).join('')}</nav>
                <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-100 dark:border-border-dark safe-bottom">
                    <button onclick="toggleDarkMode()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-800 mb-1 touch-target"><span class="material-symbols-outlined">${state.darkMode ? 'light_mode' : 'dark_mode'}</span>${state.darkMode ? 'Light Mode' : 'Dark Mode'}</button>
                    <button onclick="logout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 touch-target"><span class="material-symbols-outlined">logout</span>Sign Out</button>
                </div>
            </div>
        </div>` : ''}

        <!-- Main Content -->
        <main class="flex-1 flex flex-col h-full overflow-hidden relative">
            <!-- Top Header Bar (Desktop) -->
            <div class="hidden lg:flex items-center justify-end gap-2 px-8 py-4 border-b border-amber-100/50 dark:border-border-dark bg-white/50 dark:bg-surface-dark/50 backdrop-blur-sm z-20">
                <button onclick="refreshData()" class="p-2.5 rounded-xl text-slate-500 hover:text-admin-primary hover:bg-amber-50 dark:hover:bg-slate-800 transition-all" title="Refresh Data">
                    <span class="material-symbols-outlined">refresh</span>
                </button>
                <button onclick="toggleNotifications()" class="p-2.5 rounded-xl text-slate-500 hover:text-admin-primary hover:bg-amber-50 dark:hover:bg-slate-800 transition-all relative" title="Notifications">
                    <span class="material-symbols-outlined">notifications</span>
                    ${state.unreadNotifications > 0 ? `<span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>` : ''}
                </button>
                <button onclick="toggleDarkMode()" class="p-2.5 rounded-xl text-slate-500 hover:text-admin-primary hover:bg-amber-50 dark:hover:bg-slate-800 transition-all" title="${state.darkMode ? 'Light Mode' : 'Dark Mode'}">
                    <span class="material-symbols-outlined">${state.darkMode ? 'light_mode' : 'dark_mode'}</span>
                </button>
                <div class="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <div class="flex items-center gap-2 pl-2">
                    <div class="w-8 h-8 bg-admin-accent rounded-full flex items-center justify-center text-white font-bold text-sm">${(state.currentUser?.name || 'A').charAt(0).toUpperCase()}</div>
                </div>
            </div>
            
            <div class="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-amber-50/50 to-transparent pointer-events-none z-0 lg:top-[65px]"></div>
            <div class="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-8 pt-20 lg:pt-6 pb-8 z-10 relative safe-bottom scroll-smooth">
                <div class="max-w-[1600px] mx-auto space-y-8">${renderAdminContent()}</div>
            </div>
        </main>
    </div>
    ${state.editModal ? renderEditModal() : ''}
    ${state.confirmDialog ? renderConfirmDialog() : ''}
    ${state.showAddGroomerModal ? renderAddGroomerModal() : ''}
    ${state.showEditGroomerModal ? renderEditGroomerModal() : ''}
    ${state.showGroomerScheduleModal ? renderGroomerScheduleModal() : ''}
    ${state.showAdminAddAppointment ? renderAdminAddAppointmentModal() : ''}
    ${state.showNotifications ? renderNotificationsPanel() : ''}
    ${state.quickViewAppointment ? renderQuickViewAppointmentModal() : ''}
    ${state.groomingServiceModal ? renderGroomingServiceModal() : ''}`;
}

function renderAdminContent() {
    const today = getTodayPacific();
    const todayAppts = data.appointments.filter(a => a.appointment_date === today);
    const confirmedCount = todayAppts.filter(a => a.status === 'confirmed').length;
    const pendingCount = todayAppts.filter(a => a.status === 'pending').length;
    const inProgressCount = todayAppts.filter(a => a.status === 'in_progress').length;
    // Calculate actual revenue from TODAY's completed/confirmed appointments
    const totalRevenue = todayAppts
        .filter(a => a.status === 'confirmed' || a.status === 'completed')
        .reduce((sum, a) => sum + (parseFloat(a.total_price) || parseFloat(a.base_price) || 0), 0);

    if (state.currentTab === 'dashboard') {
        return `
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-2">
            <div>
                <p class="text-admin-primary text-xs sm:text-sm font-bold uppercase tracking-widest mb-1 sm:mb-2">Premium Management</p>
                <h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Welcome back, ${(state.currentUser.name || 'Admin').split(' ')[0]}</h1>
                <p class="text-slate-500 text-sm sm:text-base font-medium mt-1 sm:mt-2 flex items-center gap-2"><span class="material-symbols-outlined text-base sm:text-lg text-admin-primary">calendar_today</span>Your schedule is looking great today</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button onclick="exportDashboardData()" class="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-white border border-amber-200 rounded-xl text-slate-700 font-bold hover:bg-amber-50 hover:border-amber-300 transition-all text-sm shadow-sm w-full sm:w-auto"><span class="material-symbols-outlined text-lg">download</span>Export</button>
                <button onclick="openAdminAddAppointment()" class="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-admin-accent hover:bg-teal-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-admin-accent/25 text-sm w-full sm:w-auto"><span class="material-symbols-outlined text-lg">add</span>New Booking</button>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div class="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-amber-100 shadow-sm hover:shadow-lg hover:border-admin-primary/30 transition-all">
                <div class="flex items-center justify-between mb-3 sm:mb-4">
                    <div><p class="text-admin-primary text-[10px] sm:text-xs font-bold uppercase tracking-wider">Today's Revenue</p><h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">$${totalRevenue.toLocaleString()}</h3></div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-50 flex items-center justify-center text-admin-primary group-hover:scale-110 transition-transform"><span class="material-symbols-outlined text-xl sm:text-2xl">payments</span></div>
                </div>
                <div class="flex items-center gap-2 text-xs sm:text-sm"><span class="flex items-center gap-1 font-bold text-green-600 bg-green-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg"><span class="material-symbols-outlined text-xs sm:text-sm">trending_up</span>12%</span><span class="text-slate-400 hidden sm:inline">vs yesterday</span></div>
            </div>
            <div class="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-amber-100 shadow-sm hover:shadow-lg hover:border-admin-primary/30 transition-all">
                <div class="flex items-center justify-between mb-3 sm:mb-4">
                    <div><p class="text-admin-primary text-[10px] sm:text-xs font-bold uppercase tracking-wider">Active Bookings</p><h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">${todayAppts.length}</h3></div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-teal-50 flex items-center justify-center text-admin-accent group-hover:scale-110 transition-transform"><span class="material-symbols-outlined text-xl sm:text-2xl">calendar_today</span></div>
                </div>
                <div class="flex items-center gap-2 text-xs sm:text-sm"><span class="flex items-center gap-1 font-bold text-admin-accent bg-teal-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg"><span class="material-symbols-outlined text-xs sm:text-sm">arrow_upward</span>+${confirmedCount}</span><span class="text-slate-400 hidden sm:inline">confirmed</span></div>
            </div>
            <div class="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-amber-100 shadow-sm hover:shadow-lg hover:border-admin-primary/30 transition-all">
                <div class="flex items-center justify-between mb-3 sm:mb-4">
                    <div><p class="text-admin-primary text-[10px] sm:text-xs font-bold uppercase tracking-wider">In Grooming</p><h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">${data.appointments.filter(a => a.status === 'in_progress').length}</h3></div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform"><span class="material-symbols-outlined text-xl sm:text-2xl">content_cut</span></div>
                </div>
                <div class="flex items-center gap-2 text-xs sm:text-sm"><span class="text-slate-400">Current capacity</span></div>
            </div>
            <div class="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-admin-accent text-white shadow-lg hover:shadow-xl transition-all">
                <div class="flex items-center justify-between mb-3 sm:mb-4">
                    <div><p class="text-teal-100 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Loyalty Points</p><h3 class="text-xl sm:text-2xl lg:text-3xl font-bold mt-1">${(state.allCustomers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0) / 1000).toFixed(1)}k</h3></div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform"><span class="material-symbols-outlined text-xl sm:text-2xl">favorite</span></div>
                </div>
                <div class="flex items-center gap-2 text-xs sm:text-sm"><span class="text-teal-100">Total Issued</span></div>
            </div>
        </div>

        <!-- Main Grid -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <!-- Schedule Table -->
            <div class="xl:col-span-2 flex flex-col gap-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 px-1">
                    <h2 class="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2"><span class="w-1.5 h-6 bg-admin-primary rounded-full"></span>Appointment Schedule</h2>
                    <div class="flex items-center gap-2 sm:gap-3">
                        <div class="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-slate-100 rounded-lg">
                            <button onclick="setDashboardView('day')" class="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-sm font-bold ${(state.dashboardScheduleView || 'day') === 'day' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}">Day</button>
                            <button onclick="setDashboardView('week')" class="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-sm font-bold ${state.dashboardScheduleView === 'week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}">Week</button>
                            <button onclick="setDashboardView('month')" class="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-sm font-bold ${state.dashboardScheduleView === 'month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}">Month</button>
                        </div>
                        <button onclick="setTab('appointments')" class="text-xs sm:text-sm font-bold text-admin-primary hover:text-amber-600 flex items-center gap-1 whitespace-nowrap">View All <span class="material-symbols-outlined text-sm sm:text-base">arrow_forward</span></button>
                    </div>
                </div>
                
                ${(state.dashboardScheduleView || 'day') === 'day' ? `
                <!-- Day View -->
                <div class="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                    <div class="px-6 py-4 border-b border-amber-50 flex items-center justify-between">
                        <p class="text-sm text-slate-500">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <span class="text-xs font-bold text-admin-primary">${data.appointments.filter(a => a.appointment_date === getTodayPacific()).length} appointments</span>
                    </div>
                    <div class="divide-y divide-slate-100">
                        ${(() => {
                            const todayAppts = data.appointments.filter(a => a.appointment_date === getTodayPacific());
                            return todayAppts.length > 0 ? todayAppts.slice(0, 6).map(a => `
                            <div class="flex items-center gap-4 px-6 py-4 hover:bg-amber-50/50 transition-colors">
                                <div class="text-sm font-bold text-slate-400 w-16">${formatTime(a.start_time)}</div>
                                <div class="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 ${a.status === 'confirmed' ? 'bg-teal-50 border-admin-accent' : a.status === 'pending' ? 'bg-amber-50 border-admin-primary' : a.status === 'in_progress' ? 'bg-purple-50 border-purple-500' : a.status === 'completed' ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-slate-300'}">
                                    <div class="w-10 h-10 rounded-full bg-white shadow-sm overflow-hidden flex items-center justify-center">
                                        ${a.petPhoto ? `<img src="${a.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-slate-400">pets</span>`}
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-bold text-slate-900">${a.petName || 'Pet'} <span class="font-normal text-slate-500">(${a.petBreed || 'Pet'})</span></p>
                                        <p class="text-xs text-slate-500 uppercase tracking-wide">${a.serviceName || 'Full Grooming'} • ${a.customerName || ''}</p>
                                    </div>
                                    ${a.status === 'pending' ? `<span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Pending</span>` : ''}
                                    ${a.status === 'in_progress' ? `<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full animate-pulse">In Progress</span>` : ''}
                                    ${a.status === 'completed' ? `<span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Done</span>` : ''}
                                </div>
                                <button onclick="openQuickViewAppointment('${a.id}')" class="p-2.5 text-slate-400 hover:text-admin-primary hover:bg-amber-50 rounded-xl transition-all" title="Quick View">
                                    <span class="material-symbols-outlined">visibility</span>
                                </button>
                            </div>`).join('') : '<div class="px-6 py-8 text-center text-slate-400">No appointments scheduled for today</div>';
                        })()}
                    </div>
                </div>
                ` : state.dashboardScheduleView === 'week' ? `
                <!-- Week View -->
                <div class="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                    <div class="px-6 py-4 border-b border-amber-50 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <button onclick="adminDashboardPrevWeek()" class="p-1 hover:bg-slate-100 rounded-full"><span class="material-symbols-outlined text-slate-600">chevron_left</span></button>
                            <p class="text-sm font-bold text-slate-700">${getAdminDashboardWeekLabel()}</p>
                            <button onclick="adminDashboardNextWeek()" class="p-1 hover:bg-slate-100 rounded-full"><span class="material-symbols-outlined text-slate-600">chevron_right</span></button>
                        </div>
                        <button onclick="state.adminDashboardWeekStart = null; render();" class="text-xs font-bold text-admin-primary hover:underline">This Week</button>
                    </div>
                    <div class="grid grid-cols-7 border-b border-slate-100">
                        ${getAdminDashboardWeekDays().map(day => `
                            <div class="p-1.5 sm:p-3 text-center border-r border-slate-100 last:border-r-0 ${day.isToday ? 'bg-admin-primary/5' : ''}">
                                <p class="text-[8px] sm:text-xs font-bold text-slate-400 uppercase">${day.dayName}</p>
                                <p class="text-sm sm:text-lg font-bold ${day.isToday ? 'text-admin-primary' : 'text-slate-700'}">${day.dayNum}</p>
                                <p class="text-[9px] sm:text-xs ${day.count > 0 ? 'text-admin-accent font-bold' : 'text-slate-400'}">${day.count}<span class="hidden sm:inline"> appt${day.count !== 1 ? 's' : ''}</span></p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="p-4 max-h-[300px] overflow-y-auto">
                        ${(() => {
                            const weekAppts = getAdminDashboardWeekAppointments();
                            return weekAppts.length > 0 ? weekAppts.slice(0, 8).map(a => `
                            <div class="flex items-center gap-3 p-3 mb-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                                <div class="text-xs font-bold text-slate-400 w-20">${formatDate(a.appointment_date)}</div>
                                <div class="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                                    ${a.petPhoto ? `<img src="${a.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-sm text-slate-400">pets</span>`}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-bold text-slate-900 truncate">${a.petName || 'Pet'}</p>
                                    <p class="text-xs text-slate-500">${formatTime(a.start_time)} • ${a.serviceName || 'Grooming'}</p>
                                </div>
                                <span class="px-2 py-0.5 text-xs font-bold rounded-full ${a.status === 'confirmed' ? 'bg-teal-100 text-teal-700' : a.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}">${a.status}</span>
                                <button onclick="openQuickViewAppointment('${a.id}')" class="p-1.5 text-slate-400 hover:text-admin-primary hover:bg-amber-50 rounded-lg transition-all" title="Quick View">
                                    <span class="material-symbols-outlined text-lg">visibility</span>
                                </button>
                            </div>`).join('') : '<div class="text-center py-6 text-slate-400">No appointments this week</div>';
                        })()}
                    </div>
                </div>
                ` : `
                <!-- Month View -->
                <div class="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                    <div class="px-6 py-4 border-b border-amber-50 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <button onclick="adminDashboardPrevMonth()" class="p-2 hover:bg-slate-100 rounded-full touch-target"><span class="material-symbols-outlined text-slate-600">chevron_left</span></button>
                            <p class="text-sm font-bold text-slate-700">${getAdminDashboardMonthLabel()}</p>
                            <button onclick="adminDashboardNextMonth()" class="p-2 hover:bg-slate-100 rounded-full touch-target"><span class="material-symbols-outlined text-slate-600">chevron_right</span></button>
                        </div>
                        <button onclick="resetDashboardMonth()" class="text-xs font-bold text-admin-primary hover:underline">This Month</button>
                    </div>
                    <div class="p-2 sm:p-4">
                        <div class="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                            ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => `<div class="text-center text-[9px] sm:text-xs font-bold text-slate-400 py-1 sm:py-2"><span class="sm:hidden">${d}</span><span class="hidden sm:inline">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span></div>`).join('')}
                        </div>
                        <div class="grid grid-cols-7 gap-0.5 sm:gap-1">
                            ${getAdminDashboardMonthDays().map(day => {
                                if (day.empty) return `<div class="aspect-square min-h-[32px] sm:min-h-[40px]"></div>`;
                                return `
                                <button onclick="${day.count > 0 ? `selectDashboardDate('${day.dateStr}')` : ''}" 
                                    class="aspect-square min-h-[32px] sm:min-h-[40px] flex flex-col items-center justify-center rounded-md sm:rounded-lg text-xs sm:text-sm active:scale-95 ${day.isToday ? 'bg-admin-primary text-white font-bold' : day.count > 0 ? 'bg-admin-accent/10 text-admin-accent font-medium cursor-pointer hover:bg-admin-accent/20' : 'text-slate-600 hover:bg-slate-50'} transition-all">
                                    <span>${day.day}</span>
                                    ${day.count > 0 ? `<span class="text-[8px] sm:text-[10px] ${day.isToday ? 'text-white/80' : 'text-admin-accent'}">${day.count}</span>` : ''}
                                </button>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
                `}
            </div>

            <!-- Sidebar Widgets -->
            <div class="flex flex-col gap-6">
                <!-- Loyalty Watch -->
                <div class="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-5">
                        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2"><span class="material-symbols-outlined text-admin-primary">favorite</span>Loyalty Watch</h3>
                        <button onclick="setTab('loyalty')" class="text-xs font-bold text-slate-400 hover:text-admin-primary">View All</button>
                    </div>
                    <div class="flex flex-col gap-3">
                        ${state.allCustomers.length > 0 ? state.allCustomers
                            .filter(c => c.role === 'customer')
                            .sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0))
                            .slice(0, 3)
                            .map((c, i) => {
                                const initials = (c.full_name || 'C').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                const points = c.loyalty_points || 0;
                                const tier = points >= 500 ? 'Gold' : points >= 200 ? 'Silver' : 'Bronze';
                                const tierColor = points >= 500 ? 'amber' : points >= 200 ? 'teal' : 'slate';
                                return `<div class="flex items-center gap-4 p-3 rounded-xl ${i === 0 ? 'bg-gradient-to-r from-amber-50 to-white border border-amber-100 relative overflow-hidden' : 'hover:bg-slate-50 transition-all'}">
                                    ${i === 0 ? '<div class="absolute left-0 top-0 w-1 h-full bg-admin-primary"></div>' : ''}
                                    <div class="w-10 h-10 rounded-full bg-${tierColor}-100 flex items-center justify-center text-${tierColor}-600 font-bold text-xs ${i === 0 ? 'shadow-sm ring-2 ring-amber-100' : ''}">${initials}</div>
                                    <div class="flex-1"><p class="text-sm font-bold text-slate-900">${c.full_name || 'Customer'}</p><p class="text-xs ${i === 0 ? 'text-rose-600 font-medium' : 'text-slate-500'}">${points} points</p></div>
                                    <span class="text-sm font-bold text-${tierColor}-500">${tier}</span>
                                </div>`;
                            }).join('') : '<p class="text-sm text-slate-400 text-center py-4">No customers yet</p>'}
                    </div>
                </div>

                <!-- Pending Redemptions -->
                ${state.pendingRedemptions?.length > 0 ? `
                <div class="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span class="material-symbols-outlined text-amber-500">redeem</span>
                            Pending Redemptions
                        </h3>
                        <span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">${state.pendingRedemptions.length}</span>
                    </div>
                    <button onclick="setTab('loyalty')" class="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm rounded-lg transition-colors">
                        Review Redemptions
                    </button>
                </div>
                ` : ''}
            </div>
        </div>`;
    }

    if (state.currentTab === 'appointments') {
        return `
        <!-- Stats Section -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div class="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 bg-white shadow-sm">
                <div class="flex items-center justify-between">
                    <p class="text-slate-500 text-sm font-medium uppercase tracking-wide">Today's Appointments</p>
                    <span class="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-full">calendar_today</span>
                </div>
                <div class="flex items-end gap-3 mt-1">
                    <p class="text-slate-900 text-3xl font-bold">${todayAppts.length}</p>
                    <p class="text-slate-500 text-xs font-medium mb-1">${confirmedCount} confirmed, ${pendingCount} pending</p>
                </div>
            </div>
            <div class="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 bg-white shadow-sm">
                <div class="flex items-center justify-between">
                    <p class="text-slate-500 text-sm font-medium uppercase tracking-wide">Pending Confirmations</p>
                    <span class="material-symbols-outlined text-orange-500 p-2 bg-orange-100 rounded-full">pending_actions</span>
                </div>
                <div class="flex items-end gap-3 mt-1">
                    <p class="text-slate-900 text-3xl font-bold">${data.appointments.filter(a => a.status === 'pending').length}</p>
                    <p class="text-slate-500 text-xs font-medium mb-1">All pending (any date)</p>
                </div>
            </div>
            <div class="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 bg-white shadow-sm">
                <div class="flex items-center justify-between">
                    <p class="text-slate-500 text-sm font-medium uppercase tracking-wide">Today's Revenue</p>
                    <span class="material-symbols-outlined text-green-600 p-2 bg-green-100 rounded-full">payments</span>
                </div>
                <div class="flex items-end gap-3 mt-1">
                    <p class="text-slate-900 text-3xl font-bold">$${totalRevenue.toLocaleString()}</p>
                    <p class="text-slate-500 text-xs font-medium mb-1">From ${todayAppts.filter(a => a.status === 'completed').length} completed</p>
                </div>
            </div>
        </section>

        <!-- Content Split: Table & Calendar -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <!-- Left: Filters & Table -->
            <div class="xl:col-span-2 flex flex-col gap-4">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-extrabold text-slate-900">Appointments</h1>
                        <p class="text-slate-500 text-sm">Manage your grooming schedule and bookings</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex bg-slate-100 rounded-lg p-1">
                            <button onclick="setAdminAppointmentsView('list')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${state.adminAppointmentsView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                                <span class="material-symbols-outlined text-base">list</span>List
                            </button>
                            <button onclick="setAdminAppointmentsView('gallery')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${state.adminAppointmentsView === 'gallery' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                                <span class="material-symbols-outlined text-base">photo_library</span>Photos
                            </button>
                        </div>
                        <button onclick="openAdminAddAppointment()" class="flex items-center gap-2 bg-primary hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all">
                            <span class="material-symbols-outlined text-lg">add</span>
                            <span class="text-sm font-bold">New Appointment</span>
                        </button>
                    </div>
                </div>

                ${state.adminAppointmentsView === 'gallery' ? renderAdminPhotoGallery() : `
                <!-- Filters -->
                <div class="flex flex-col sm:flex-row gap-4">
                    <div class="relative flex-1">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                        <input id="appointmentSearchInput" oninput="handleAppointmentSearch(this.value)" value="${state.appointmentSearchQuery || ''}" class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" placeholder="Search customer, email, phone..." type="text"/>
                    </div>
                    <div class="relative min-w-[180px]">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">filter_list</span>
                        <select onchange="state.appointmentStatusFilter = this.value; state.appointmentPage = 1; render();" class="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 appearance-none focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none cursor-pointer">
                            <option value="" ${!state.appointmentStatusFilter ? 'selected' : ''}>All Statuses</option>
                            <option value="confirmed" ${state.appointmentStatusFilter === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="pending" ${state.appointmentStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="in_progress" ${state.appointmentStatusFilter === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="completed" ${state.appointmentStatusFilter === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${state.appointmentStatusFilter === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <span class="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none">expand_more</span>
                    </div>
                </div>

                <!-- Appointments Table/Cards -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    ${(() => {
                        // Filter appointments based on search and status
                        let filteredAppointments = data.appointments;
                        
                        // Apply status filter
                        if (state.appointmentStatusFilter) {
                            filteredAppointments = filteredAppointments.filter(a => a.status === state.appointmentStatusFilter);
                        }
                        
                        // Apply search filter
                        if (state.appointmentSearchQuery) {
                            const query = state.appointmentSearchQuery.toLowerCase().trim();
                            filteredAppointments = filteredAppointments.filter(a => {
                                const customerName = (a.customerName || '').toLowerCase();
                                const customerEmail = (a.customerEmail || '').toLowerCase();
                                const customerPhone = (a.customerPhone || '').toLowerCase();
                                const petName = (a.petName || '').toLowerCase();
                                const serviceName = (a.serviceName || '').toLowerCase();
                                const groomerName = (a.groomerName || '').toLowerCase();
                                
                                return customerName.includes(query) ||
                                       customerEmail.includes(query) ||
                                       customerPhone.includes(query) ||
                                       petName.includes(query) ||
                                       serviceName.includes(query) ||
                                       groomerName.includes(query);
                            });
                        }
                        
                        // Apply pagination
                        const page = state.appointmentPage || 1;
                        const perPage = 10;
                        const startIndex = (page - 1) * perPage;
                        const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + perPage);
                        
                        // Store filtered count for pagination display
                        state.filteredAppointmentsCount = filteredAppointments.length;
                        
                        const statusStyles = {
                            confirmed: 'bg-primary/10 text-primary border-primary/20',
                            pending: 'bg-orange-100 text-orange-700 border-orange-200',
                            in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
                            completed: 'bg-green-100 text-green-700 border-green-200',
                            cancelled: 'bg-red-100 text-red-700 border-red-200'
                        };
                        
                        const statusBorderColors = {
                            confirmed: 'border-l-primary',
                            pending: 'border-l-orange-500',
                            in_progress: 'border-l-purple-500',
                            completed: 'border-l-green-500',
                            cancelled: 'border-l-red-500'
                        };
                        
                        if (paginatedAppointments.length === 0) {
                            return `<div class="px-6 py-12 text-center text-slate-400"><span class="material-symbols-outlined text-4xl mb-2 block">calendar_month</span>${state.appointmentSearchQuery || state.appointmentStatusFilter ? 'No appointments match your search' : 'No appointments yet'}</div>`;
                        }
                        
                        // Mobile Cards View
                        const mobileCards = `
                        <div class="md:hidden divide-y divide-slate-100">
                            ${paginatedAppointments.map(a => `
                            <div class="p-4 border-l-4 ${statusBorderColors[a.status] || 'border-l-slate-300'}">
                                <div class="flex items-start justify-between gap-3 mb-3">
                                    <div class="flex items-center gap-3 min-w-0">
                                        <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                            <span class="material-symbols-outlined text-slate-500">person</span>
                                        </div>
                                        <div class="min-w-0">
                                            <p class="font-bold text-slate-900 truncate">${a.customerName || 'Customer'}</p>
                                            <p class="text-xs text-slate-500 truncate">${a.petName || 'Pet'} • ${a.petBreed || 'Dog'}</p>
                                        </div>
                                    </div>
                                    <button onclick="openQuickViewAppointment('${a.id}')" class="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg flex-shrink-0 touch-target">
                                        <span class="material-symbols-outlined">visibility</span>
                                    </button>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-3 mb-3">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                                        <span class="text-sm text-slate-700">${formatDate(a.appointment_date)}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-sm text-slate-400">schedule</span>
                                        <span class="text-sm text-slate-700">${formatTime(a.start_time)}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-sm text-slate-400">content_cut</span>
                                        <span class="text-sm text-slate-700 truncate">${a.serviceName || 'Grooming'}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-sm text-slate-400">badge</span>
                                        <span class="text-sm text-slate-700 truncate">${a.groomerName || 'Unassigned'}</span>
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between gap-2">
                                    <select onchange="updateAppointmentStatus('${a.id}', this.value)" class="flex-1 px-3 py-2 rounded-lg text-sm font-bold ${statusStyles[a.status] || statusStyles.pending} border cursor-pointer touch-target">
                                        <option value="pending" ${a.status === 'pending' ? 'selected' : ''}>Pending</option>
                                        <option value="confirmed" ${a.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                        <option value="in_progress" ${a.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                        <option value="completed" ${a.status === 'completed' ? 'selected' : ''}>Completed</option>
                                        <option value="cancelled" ${a.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>
                                    <select onchange="assignGroomer('${a.id}', this.value)" class="flex-1 px-3 py-2 rounded-lg text-sm border ${a.assigned_groomer_id ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'} cursor-pointer touch-target">
                                        <option value="">Assign</option>
                                        ${state.groomers.filter(g => g.is_active !== false).map(g => `<option value="${g.id}" ${a.assigned_groomer_id === g.id ? 'selected' : ''}>${g.full_name}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            `).join('')}
                        </div>`;
                        
                        // Desktop Table View
                        const desktopTable = `
                        <div class="hidden md:block overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-200">
                                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Service</th>
                                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Groomer</th>
                                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${paginatedAppointments.map((a, i) => `
                                    <tr class="group hover:bg-slate-50 transition-colors">
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-3">
                                                <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                    <span class="material-symbols-outlined text-slate-500">person</span>
                                                </div>
                                                <div class="min-w-0">
                                                    <p class="text-sm font-bold text-slate-900 truncate">${a.customerName || 'Customer'}</p>
                                                    <p class="text-xs text-slate-500 truncate">${a.petName || 'Pet'} • ${a.petBreed || ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="flex flex-col">
                                                <span class="text-sm font-medium text-slate-900">${formatDate(a.appointment_date)}</span>
                                                <span class="text-xs text-slate-500">${formatTime(a.start_time)}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-2">
                                                <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><span class="material-symbols-outlined text-base">content_cut</span></div>
                                                <span class="text-sm font-medium text-slate-700 truncate max-w-[120px]">${a.serviceName || 'Grooming'}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <select onchange="assignGroomer('${a.id}', this.value)" 
                                                class="text-sm px-3 py-1.5 rounded-lg border ${a.assigned_groomer_id ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'} cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none">
                                                <option value="">Assign Groomer</option>
                                                ${state.groomers.filter(g => g.is_active !== false).map(g => `<option value="${g.id}" ${a.assigned_groomer_id === g.id ? 'selected' : ''}>${g.full_name}</option>`).join('')}
                                            </select>
                                            ${a.groomerName ? `<p class="text-xs text-emerald-600 mt-1 truncate">✓ ${a.groomerName}</p>` : ''}
                                        </td>
                                        <td class="px-6 py-4">
                                            <select onchange="updateAppointmentStatus('${a.id}', this.value)" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusStyles[a.status] || statusStyles.pending} border cursor-pointer bg-transparent">
                                                <option value="pending" ${a.status === 'pending' ? 'selected' : ''}>Pending</option>
                                                <option value="confirmed" ${a.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                                <option value="in_progress" ${a.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                                <option value="completed" ${a.status === 'completed' ? 'selected' : ''}>✓ Completed</option>
                                                <option value="cancelled" ${a.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                                <option value="no_show" ${a.status === 'no_show' ? 'selected' : ''}>No Show</option>
                                            </select>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <div class="flex justify-end gap-1">
                                                <button onclick="openQuickViewAppointment('${a.id}')" class="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-full transition-colors" title="View Details">
                                                    <span class="material-symbols-outlined">visibility</span>
                                                </button>
                                                <button onclick="openEditAppointmentModal('${a.id}')" class="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-full transition-colors" title="Edit">
                                                    <span class="material-symbols-outlined">edit</span>
                                                </button>
                                                <button onclick="confirmDeleteAppointment('${a.id}')" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Delete">
                                                    <span class="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>`;
                        
                        return mobileCards + desktopTable;
                    })()}
                    <div class="px-4 md:px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p class="text-sm text-slate-500 text-center sm:text-left">Showing ${Math.min((state.appointmentPage || 1) * 10, state.filteredAppointmentsCount || data.appointments.length)} of ${state.filteredAppointmentsCount || data.appointments.length} appointments ${state.appointmentSearchQuery || state.appointmentStatusFilter ? '(filtered)' : ''}</p>
                        <div class="flex gap-2 flex-wrap justify-center">
                            ${state.appointmentSearchQuery || state.appointmentStatusFilter ? `<button onclick="state.appointmentSearchQuery = ''; state.appointmentStatusFilter = ''; state.appointmentPage = 1; render();" class="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-red-600 hover:bg-red-50 touch-target">Clear</button>` : ''}
                            <button onclick="prevAppointmentPage()" class="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 touch-target" ${(state.appointmentPage || 1) <= 1 ? 'disabled' : ''}>Previous</button>
                            <button onclick="nextAppointmentPage()" class="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 touch-target" ${(state.appointmentPage || 1) * 10 >= (state.filteredAppointmentsCount || data.appointments.length) ? 'disabled' : ''}>Next</button>
                        </div>
                    </div>
                </div>
                `}
            </div>

            <!-- Right: Calendar Widget -->
            <div class="flex flex-col gap-6">
                <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <p class="text-slate-900 text-base font-bold">Select Date</p>
                        <button onclick="goToMiniCalendarToday()" class="text-primary text-sm font-bold">Today</button>
                    </div>
                    <div class="flex flex-col gap-0.5">
                        <div class="flex items-center p-1 justify-between mb-2">
                            <button onclick="miniCalendarPrevMonth()" class="p-1 hover:bg-slate-100 rounded-full transition-colors"><span class="material-symbols-outlined text-slate-900 text-lg">chevron_left</span></button>
                            <p class="text-slate-900 text-sm font-bold">${getMiniCalendarMonthLabel()}</p>
                            <button onclick="miniCalendarNextMonth()" class="p-1 hover:bg-slate-100 rounded-full transition-colors"><span class="material-symbols-outlined text-slate-900 text-lg">chevron_right</span></button>
                        </div>
                        <div class="grid grid-cols-7 text-center mb-2">
                            ${['S','M','T','W','T','F','S'].map(d => `<p class="text-slate-400 text-xs font-bold">${d}</p>`).join('')}
                        </div>
                        <div class="grid grid-cols-7 gap-y-1">
                            ${generateMiniCalendarDays().map(day => {
                                if (day.empty) return '<span></span>';
                                const dateStr = day.dateStr;
                                const hasAppt = data.appointments.some(a => a.appointment_date === dateStr);
                                return `<button onclick="selectMiniCalendarDate('${dateStr}')" class="w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm ${day.isToday ? 'bg-primary text-white shadow-md font-bold' : day.isSelected ? 'ring-2 ring-primary bg-primary/10 text-primary font-bold' : hasAppt ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 hover:bg-slate-100'} transition-colors">${day.day}</button>`;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Upcoming Today -->
                <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 class="text-slate-900 font-bold mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-primary">schedule</span>${state.selectedCalendarDate && state.selectedCalendarDate !== getTodayPacific() ? 'Selected Date' : 'Upcoming Today'}</h3>
                    <div class="flex flex-col gap-3">
                        ${(() => {
                            const targetDate = state.selectedCalendarDate || getTodayPacific();
                            const dateAppts = data.appointments.filter(a => 
                                a.appointment_date === targetDate && 
                                (a.status === 'confirmed' || a.status === 'pending' || a.status === 'in_progress')
                            ).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
                            
                            if (dateAppts.length === 0) {
                                return `<div class="text-center py-4 text-slate-400 text-sm">No appointments for ${targetDate === getTodayPacific() ? 'today' : formatDate(targetDate)}</div>`;
                            }
                            
                            return dateAppts.slice(0, 5).map(a => `
                        <div onclick="openQuickViewAppointment('${a.id}')" class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                            <div class="w-10 h-10 rounded-full ${a.status === 'in_progress' ? 'bg-purple-100 text-purple-600' : 'bg-primary/10 text-primary'} flex items-center justify-center font-bold text-sm">${(a.petName || 'P').charAt(0)}</div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-bold text-slate-900 truncate">${a.petName || 'Pet'}</p>
                                <p class="text-xs text-slate-500">${formatTime(a.start_time)} • ${a.serviceName || 'Grooming'}</p>
                            </div>
                            ${a.status === 'in_progress' ? '<span class="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-bold rounded-full">In Progress</span>' : ''}
                            <span class="material-symbols-outlined text-slate-400">chevron_right</span>
                        </div>`).join('');
                        })()}
                    </div>
                </div>
            </div>
        </div>`;
    }

    // =============================================
    // CUSTOMERS TAB
    // =============================================
    if (state.currentTab === 'customers') {
        // Get all customers with their data
        const customers = state.allCustomers.filter(c => c.role === 'customer');
        
        // Apply search filter
        let filteredCustomers = customers;
        if (state.customerSearchQuery) {
            const query = state.customerSearchQuery.toLowerCase().trim();
            filteredCustomers = customers.filter(c => {
                const name = (c.full_name || '').toLowerCase();
                const email = (c.email || '').toLowerCase();
                const phone = (c.phone || '').toLowerCase();
                const address = (c.address || '').toLowerCase();
                return name.includes(query) || email.includes(query) || phone.includes(query) || address.includes(query);
            });
        }
        
        // Sort customers
        const sortedCustomers = [...filteredCustomers].sort((a, b) => {
            if (state.customerSort === 'points') {
                return (b.loyalty_points || 0) - (a.loyalty_points || 0);
            } else if (state.customerSort === 'recent') {
                // Sort by most recent appointment
                const aLastAppt = data.appointments.filter(apt => apt.customer_id === a.id).sort((x, y) => (y.appointment_date || '').localeCompare(x.appointment_date || ''))[0];
                const bLastAppt = data.appointments.filter(apt => apt.customer_id === b.id).sort((x, y) => (y.appointment_date || '').localeCompare(x.appointment_date || ''))[0];
                return ((bLastAppt?.appointment_date || '') || '').localeCompare((aLastAppt?.appointment_date || '') || '');
            } else {
                return (a.full_name || '').localeCompare(b.full_name || '');
            }
        });
        
        // Pagination
        const page = state.customerPage || 1;
        const perPage = 10;
        const totalPages = Math.ceil(sortedCustomers.length / perPage);
        const paginatedCustomers = sortedCustomers.slice((page - 1) * perPage, page * perPage);
        
        return `
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
                <p class="text-admin-primary text-xs font-bold uppercase tracking-wider mb-1">Customer Management</p>
                <h1 class="text-3xl font-bold text-slate-900 dark:text-white">All Customers</h1>
                <p class="text-slate-500 mt-1">${customers.length} total customers • ${customers.filter(c => (c.loyalty_points || 0) >= 100).length} VIP members</p>
            </div>
            <div class="flex gap-3">
                <button onclick="exportCustomerData()" class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                    <span class="material-symbols-outlined text-lg">download</span>Export
                </button>
            </div>
        </div>
        
        <!-- Filters & Search -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <div class="relative flex-1">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                <input id="customerSearchInput" oninput="handleCustomerSearch(this.value)" value="${state.customerSearchQuery || ''}" class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-admin-primary/50 focus:border-admin-primary outline-none transition-all" placeholder="Search by name, email, phone, address..." type="text"/>
            </div>
            <div class="flex gap-2">
                <select onchange="state.customerSort = this.value; render();" class="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium cursor-pointer">
                    <option value="name" ${(state.customerSort || 'name') === 'name' ? 'selected' : ''}>Sort by Name</option>
                    <option value="points" ${state.customerSort === 'points' ? 'selected' : ''}>Sort by Points</option>
                    <option value="recent" ${state.customerSort === 'recent' ? 'selected' : ''}>Sort by Recent</option>
                </select>
            </div>
        </div>
        
        <!-- Customer Cards Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            ${paginatedCustomers.length > 0 ? paginatedCustomers.map(customer => {
                const customerPets = (state.pets || []).filter(p => p.owner_id === customer.id);
                const customerAppts = (data.appointments || []).filter(a => a.customer_id === customer.id);
                const lastAppt = [...customerAppts].sort((a, b) => (b.appointment_date || '').localeCompare(a.appointment_date || ''))[0];
                const totalSpent = customerAppts.filter(a => a.status === 'completed').reduce((sum, a) => sum + (parseFloat(a.total_price) || parseFloat(a.base_price) || 0), 0);
                const initials = (customer.full_name || 'C').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const loyaltyTier = (customer.loyalty_points || 0) >= 200 ? 'Gold' : (customer.loyalty_points || 0) >= 100 ? 'Silver' : 'Bronze';
                const tierColors = { Gold: 'bg-amber-100 text-amber-700 border-amber-200', Silver: 'bg-slate-100 text-slate-600 border-slate-200', Bronze: 'bg-orange-100 text-orange-700 border-orange-200' };
                
                return `
                <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark p-5 hover:shadow-lg transition-all">
                    <div class="flex items-start gap-4">
                        <!-- Avatar -->
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-admin-primary to-admin-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            ${initials}
                        </div>
                        
                        <!-- Main Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-2 mb-1">
                                <h3 class="text-lg font-bold text-slate-900 dark:text-white truncate">${customer.full_name || 'Unknown'}</h3>
                                <span class="px-2 py-0.5 text-xs font-bold rounded-full border ${tierColors[loyaltyTier]}">${loyaltyTier}</span>
                            </div>
                            
                            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mb-3">
                                ${customer.phone ? `<span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">phone</span>${customer.phone}</span>` : ''}
                                ${customer.email ? `<span class="flex items-center gap-1 truncate"><span class="material-symbols-outlined text-sm">mail</span>${customer.email}</span>` : ''}
                            </div>
                            
                            ${customer.address ? `<p class="text-xs text-slate-400 mb-3 truncate"><span class="material-symbols-outlined text-xs align-middle">location_on</span> ${escapeHtml(customer.address)}</p>` : ''}
                            
                            <!-- Pets -->
                            <div class="flex items-center gap-2 mb-3">
                                <span class="text-xs font-bold text-slate-400 uppercase">Pets:</span>
                                ${customerPets.length > 0 ? customerPets.slice(0, 3).map(pet => `
                                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300">
                                        <span class="material-symbols-outlined text-xs">pets</span>${escapeHtml(pet.name)}
                                    </span>
                                `).join('') + (customerPets.length > 3 ? `<span class="text-xs text-slate-400">+${customerPets.length - 3} more</span>` : '') : '<span class="text-xs text-slate-400">No pets</span>'}
                            </div>
                            
                            <!-- Stats Row -->
                            <div class="flex items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <div class="text-center">
                                    <p class="text-lg font-bold text-admin-primary">${customer.loyalty_points || 0}</p>
                                    <p class="text-xs text-slate-400">Points</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-lg font-bold text-slate-900 dark:text-white">${customerAppts.length}</p>
                                    <p class="text-xs text-slate-400">Visits</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-lg font-bold text-green-600">$${totalSpent.toFixed(0)}</p>
                                    <p class="text-xs text-slate-400">Spent</p>
                                </div>
                                <div class="flex-1 text-right">
                                    <p class="text-xs text-slate-400">Last Visit</p>
                                    <p class="text-sm font-medium text-slate-700 dark:text-slate-300">${lastAppt ? formatDate(lastAppt.appointment_date) : 'Never'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Actions -->
                        <div class="flex flex-col gap-1">
                            <button onclick="openCustomerDetailModal('${customer.id}')" class="p-2 text-slate-400 hover:text-admin-primary hover:bg-admin-primary/10 rounded-lg transition-all" title="View Details">
                                <span class="material-symbols-outlined">visibility</span>
                            </button>
                            <button onclick="openAdminAddAppointment(); state.adminSelectedCustomer = '${customer.id}';" class="p-2 text-slate-400 hover:text-admin-accent hover:bg-admin-accent/10 rounded-lg transition-all" title="Book Appointment">
                                <span class="material-symbols-outlined">calendar_add_on</span>
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join('') : `
                <div class="col-span-2 text-center py-12 text-slate-400">
                    <span class="material-symbols-outlined text-5xl mb-3 block">person_search</span>
                    <p class="text-lg font-medium">${state.customerSearchQuery ? 'No customers match your search' : 'No customers yet'}</p>
                    <p class="text-sm mt-1">Customers will appear here after their first appointment</p>
                </div>
            `}
        </div>
        
        <!-- Pagination -->
        <div class="flex items-center justify-between bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark px-6 py-4">
            <p class="text-sm text-slate-500">Showing ${paginatedCustomers.length} of ${sortedCustomers.length} customers ${state.customerSearchQuery ? '(filtered)' : ''}</p>
            <div class="flex gap-2">
                ${state.customerSearchQuery ? `<button onclick="state.customerSearchQuery = ''; state.customerPage = 1; render();" class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-red-600 hover:bg-red-50">Clear Search</button>` : ''}
                <button onclick="state.customerPage = Math.max(1, (state.customerPage || 1) - 1); render();" class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50" ${page <= 1 ? 'disabled' : ''}>Previous</button>
                <span class="px-3 py-1.5 text-sm font-medium text-slate-600">Page ${page} of ${totalPages || 1}</span>
                <button onclick="state.customerPage = Math.min(${totalPages}, (state.customerPage || 1) + 1); render();" class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50" ${page >= totalPages ? 'disabled' : ''}>Next</button>
            </div>
        </div>
        
        ${state.customerDetailModal ? renderCustomerDetailModal() : ''}`;
    }

    // =============================================
    // GROOMERS TAB
    // =============================================
    if (state.currentTab === 'groomers') {
        const activeGroomers = state.groomers.filter(g => g.is_active !== false);
        const inactiveGroomers = state.groomers.filter(g => g.is_active === false);
        const displayGroomers = state.groomerFilter === 'all' ? state.groomers : 
            state.groomerFilter === 'active' ? activeGroomers : inactiveGroomers;
        
        return `
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
                <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">Groomer Management</h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1">Manage your grooming team, schedules, and assignments</p>
            </div>
            <button onclick="openAddGroomerModal()" class="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/25 text-sm">
                <span class="material-symbols-outlined text-lg">person_add</span>Add Groomer
            </button>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Groomers</p>
                        <p class="text-3xl font-bold text-slate-900 dark:text-white mt-1">${activeGroomers.length}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-2xl">badge</span>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">Appointments This Month</p>
                        <p class="text-3xl font-bold text-slate-900 dark:text-white mt-1">${state.groomers.reduce((sum, g) => sum + (g.appointmentsThisMonth || 0), 0)}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">calendar_month</span>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">Revenue This Month</p>
                        <p class="text-3xl font-bold text-slate-900 dark:text-white mt-1">$${state.groomers.reduce((sum, g) => sum + (g.revenueThisMonth || 0), 0).toFixed(0)}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">payments</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filter -->
        <div class="flex items-center gap-3 mb-6">
            <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Filter:</span>
            <div class="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button onclick="state.groomerFilter = 'all'; render();" class="px-4 py-2 text-sm font-medium rounded-md transition-all ${state.groomerFilter === 'all' ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}">
                    All (${state.groomers.length})
                </button>
                <button onclick="state.groomerFilter = 'active'; render();" class="px-4 py-2 text-sm font-medium rounded-md transition-all ${state.groomerFilter === 'active' ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}">
                    Active (${activeGroomers.length})
                </button>
                <button onclick="state.groomerFilter = 'inactive'; render();" class="px-4 py-2 text-sm font-medium rounded-md transition-all ${state.groomerFilter === 'inactive' ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}">
                    Inactive (${inactiveGroomers.length})
                </button>
            </div>
        </div>

        <!-- Groomers Grid -->
        ${displayGroomers.length > 0 ? `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            ${displayGroomers.map(g => renderGroomerCard(g)).join('')}
        </div>
        ` : `
        <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-2xl p-12 text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span class="material-symbols-outlined text-3xl text-slate-400">content_cut</span>
            </div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">No ${state.groomerFilter === 'inactive' ? 'Inactive ' : ''}Groomers</h3>
            <p class="text-slate-500 dark:text-slate-400 mb-6">${state.groomerFilter === 'inactive' ? 'All your groomers are currently active.' : 'Add your first groomer to start managing your team.'}</p>
            ${state.groomerFilter !== 'inactive' ? `
            <button onclick="openAddGroomerModal()" class="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all">
                <span class="material-symbols-outlined">person_add</span>Add First Groomer
            </button>` : ''}
        </div>
        `}
        `;
    }

    if (state.currentTab === 'loyalty') {
        // Store rewards for editing
        data.rewards.forEach((r, i) => { state.editItems['reward_' + i] = {...r}; });
        const pending = state.pendingRedemptions || [];
        const loyaltySubTab = state.loyaltySubTab || 'rewards';
        
        return `
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div><h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">Loyalty Program</h1><p class="text-slate-500 dark:text-slate-400 mt-1">Manage rewards and customer redemptions</p></div>
        </div>
        
        <!-- Sub-tabs -->
        <div class="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
            <button onclick="state.loyaltySubTab = 'rewards'; render();" class="px-4 py-3 text-sm font-bold border-b-2 transition-all ${loyaltySubTab === 'rewards' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}">
                <span class="flex items-center gap-2"><span class="material-symbols-outlined text-lg">redeem</span>Rewards</span>
            </button>
            <button onclick="state.loyaltySubTab = 'redemptions'; render();" class="px-4 py-3 text-sm font-bold border-b-2 transition-all ${loyaltySubTab === 'redemptions' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'} flex items-center gap-2">
                <span class="flex items-center gap-2"><span class="material-symbols-outlined text-lg">pending_actions</span>Redemptions</span>
                ${pending.length > 0 ? `<span class="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">${pending.length}</span>` : ''}
            </button>
            <button onclick="state.loyaltySubTab = 'customers'; render();" class="px-4 py-3 text-sm font-bold border-b-2 transition-all ${loyaltySubTab === 'customers' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}">
                <span class="flex items-center gap-2"><span class="material-symbols-outlined text-lg">group</span>Customers</span>
            </button>
        </div>
        
        ${loyaltySubTab === 'rewards' ? `
            <!-- Rewards Management -->
            <div class="flex justify-end mb-6">
                <button onclick="openEditModal('reward', {})" class="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-sky-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/25 text-sm"><span class="material-symbols-outlined text-lg">add</span>Add Reward</button>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                ${data.rewards.map((r, i) => `
                <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center"><span class="material-symbols-outlined text-rose-500 text-2xl">redeem</span></div>
                        <div class="flex gap-1"><button onclick="openEditModal('reward', ${i})" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary"><span class="material-symbols-outlined text-lg">edit</span></button><button onclick="confirmDeleteReward('${r.id}', '${(r.name || '').replace(/'/g, "\\'")}')" class="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-600"><span class="material-symbols-outlined text-lg">delete</span></button></div>
                    </div>
                    <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-1">${r.name}</h4>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${r.description || ''}</p>
                    <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700"><span class="text-2xl font-bold text-primary">${r.points_required || r.points}</span><span class="text-sm text-slate-500 dark:text-slate-400">points required</span></div>
                </div>`).join('')}
            </div>
        ` : loyaltySubTab === 'redemptions' ? `
            <!-- Redemptions Queue -->
            ${pending.length > 0 ? `
                <div class="space-y-4">
                    ${pending.map(r => `
                        <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-4">
                            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                        <span class="material-symbols-outlined text-rose-500">redeem</span>
                                    </div>
                                    <div>
                                        <p class="font-bold text-slate-900 dark:text-white">${r.reward_name || r.rewardName || 'Reward'}</p>
                                        <p class="text-sm text-slate-500 dark:text-slate-400">${r.customer_name || r.customerName || 'Customer'}</p>
                                        <p class="text-xs text-slate-400">${r.points_cost || r.pointsRequired || 0} pts • ${new Date(r.redeemed_at || r.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="fulfillRedemption('${r.id}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm">Fulfill</button>
                                    <button onclick="cancelRedemption('${r.id}', prompt('Reason for cancellation:'))" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-sm">Cancel & Refund</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-12 text-center">
                    <span class="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4">celebration</span>
                    <p class="text-slate-500 dark:text-slate-400">No pending redemptions</p>
                    <p class="text-sm text-slate-400 mt-1">All caught up!</p>
                </div>
            `}
        ` : `
            <!-- Customers with Points -->
            <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden">
                <!-- Mobile Cards -->
                <div class="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                    ${state.allCustomers
                        .filter(c => c.role === 'customer')
                        .sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0))
                        .slice(0, 20)
                        .map(c => {
                            const points = c.loyalty_points || 0;
                            const tier = points >= 500 ? 'Gold' : points >= 200 ? 'Silver' : 'Bronze';
                            const tierColor = points >= 500 ? 'amber' : points >= 200 ? 'slate' : 'orange';
                            return `
                            <div class="p-4">
                                <div class="flex items-center justify-between gap-3">
                                    <div class="flex items-center gap-3 min-w-0">
                                        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">${(c.full_name || 'C').charAt(0)}</div>
                                        <div class="min-w-0">
                                            <p class="font-bold text-slate-900 dark:text-white truncate">${c.full_name || 'Customer'}</p>
                                            <p class="text-xs text-slate-500 truncate">${c.email || c.phone || ''}</p>
                                        </div>
                                    </div>
                                    <div class="text-right flex-shrink-0">
                                        <p class="text-xl font-bold text-primary">${points}</p>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-${tierColor}-100 text-${tierColor}-700">${tier}</span>
                                    </div>
                                </div>
                            </div>`;
                        }).join('') || '<div class="p-8 text-center text-slate-400">No customers yet</div>'}
                </div>
                
                <!-- Desktop Table -->
                <table class="hidden md:table w-full">
                    <thead class="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Points</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Tier</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Redemptions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                        ${state.allCustomers
                            .filter(c => c.role === 'customer')
                            .sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0))
                            .slice(0, 20)
                            .map(c => {
                                const points = c.loyalty_points || 0;
                                const tier = points >= 500 ? 'Gold' : points >= 200 ? 'Silver' : 'Bronze';
                                const tierColor = points >= 500 ? 'amber' : points >= 200 ? 'slate' : 'orange';
                                return `
                                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">${(c.full_name || 'C').charAt(0)}</div>
                                            <div class="min-w-0">
                                                <p class="font-bold text-slate-900 dark:text-white truncate">${c.full_name || 'Customer'}</p>
                                                <p class="text-xs text-slate-500 truncate">${c.email || c.phone || ''}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4"><span class="text-lg font-bold text-primary">${points}</span></td>
                                    <td class="px-6 py-4"><span class="px-2.5 py-1 rounded-full text-xs font-bold bg-${tierColor}-100 text-${tierColor}-700">${tier}</span></td>
                                    <td class="px-6 py-4 text-slate-500">${c.total_redemptions || 0}</td>
                                </tr>`;
                            }).join('') || '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">No customers yet</td></tr>'}
                    </tbody>
                </table>
            </div>
        `}`;
    }

    // Redemptions Tab - redirect to loyalty (for backwards compatibility)
    if (state.currentTab === 'redemptions') {
        state.currentTab = 'loyalty';
        state.loyaltySubTab = 'redemptions';
        return renderAdminContent();
    }

    // Old rewards tab - redirect to loyalty (for backwards compatibility)  
    if (state.currentTab === 'rewards') {
        state.currentTab = 'loyalty';
        state.loyaltySubTab = 'rewards';
        return renderAdminContent();
    }

    // Messages Tab - Admin-Groomer Communication
    if (state.currentTab === 'messages') {
        return renderAdminMessagesTab();
    }

    // Coverage Regions Tab
    if (state.currentTab === 'coverage') {
        // Group regions by coverage status (based on groomer assignments)
        const coveredRegions = serviceRegions.filter(r => {
            const groomers = getGroomersForRegion(r.id);
            return groomers.length > 0;
        });
        const uncoveredRegions = serviceRegions.filter(r => {
            const groomers = getGroomersForRegion(r.id);
            return groomers.length === 0;
        });
        
        return `
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
                <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">Coverage Overview</h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1">See where your business has groomer coverage. Assign regions when adding or editing groomers.</p>
            </div>
        </div>
        
        <!-- Summary Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Regions</p>
                        <p class="text-3xl font-bold text-slate-900 dark:text-white mt-1">${serviceRegions.length}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-blue-600">map</span>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">Covered</p>
                        <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">${coveredRegions.length}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-emerald-600">check_circle</span>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">No Coverage</p>
                        <p class="text-3xl font-bold ${uncoveredRegions.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} mt-1">${uncoveredRegions.length}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-amber-600">warning</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Covered Regions -->
        ${coveredRegions.length > 0 ? `
        <div class="mb-8">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-500">check_circle</span>
                Active Coverage (${coveredRegions.length})
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${coveredRegions.map(region => {
                    const assignedGroomers = getGroomersForRegion(region.id);
                    return `
                    <div class="bg-white dark:bg-surface-dark border border-emerald-200 dark:border-emerald-800 rounded-2xl overflow-hidden shadow-sm">
                        <div class="p-5">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400">location_on</span>
                                </div>
                                <div>
                                    <h3 class="font-bold text-slate-900 dark:text-white">${escapeHtml(region.name)}</h3>
                                    <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">${assignedGroomers.length} groomer${assignedGroomers.length !== 1 ? 's' : ''} assigned</p>
                                </div>
                            </div>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">${(region.cities || []).join(', ')}</p>
                            <div class="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                                ${assignedGroomers.map(g => `
                                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                        <span class="material-symbols-outlined text-xs">person</span>
                                        ${escapeHtml(g.full_name)}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>` : ''}
        
        <!-- Uncovered Regions -->
        ${uncoveredRegions.length > 0 ? `
        <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-500">warning</span>
                No Coverage (${uncoveredRegions.length})
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">These regions have no groomers assigned. Customers in these areas cannot book. Assign groomers via the Groomers tab → Edit.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                ${uncoveredRegions.map(region => `
                    <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-4">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <span class="material-symbols-outlined text-slate-400 text-sm">location_off</span>
                            </div>
                            <h3 class="font-bold text-slate-700 dark:text-slate-300">${escapeHtml(region.name)}</h3>
                        </div>
                        <p class="text-xs text-slate-400 leading-relaxed">${(region.cities || []).slice(0, 5).join(', ')}${(region.cities || []).length > 5 ? '...' : ''}</p>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}
        `;
    }

    // Combined Services/Products Tab
    if (state.currentTab === 'services') {
        const servicesSubTab = state.adminServicesSubTab || 'products';
        const activeProducts = data.products.filter(p => !p.inactive);
        const inactiveProducts = data.products.filter(p => p.inactive);
        
        return `
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div class="flex items-center gap-4">
                <img src="${LOGO_ACADEMY}" alt="Dogfathersplus Academy" class="h-14 w-auto"/>
                <div>
                    <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">Services & Products</h1>
                    <p class="text-slate-500 dark:text-slate-400 mt-1">Manage products, ride-alongs, and education courses</p>
                </div>
            </div>
        </div>
        
        <!-- Sub-tabs -->
        <div class="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
            <button onclick="state.adminServicesSubTab = 'grooming'; render();" class="px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${servicesSubTab === 'grooming' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}">
                <span class="flex items-center gap-2"><span class="material-symbols-outlined text-lg">content_cut</span>Grooming Services</span>
            </button>
            <button onclick="state.adminServicesSubTab = 'products'; render();" class="px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${servicesSubTab === 'products' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}">
                <span class="flex items-center gap-2"><span class="material-symbols-outlined text-lg">inventory_2</span>Products</span>
            </button>
            <button onclick="state.adminServicesSubTab = 'ridealongs'; render();" class="px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${servicesSubTab === 'ridealongs' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}">
                <span class="flex items-center gap-2"><span class="material-symbols-outlined text-lg">directions_car</span>Ride-Alongs</span>
            </button>
            <button onclick="state.adminServicesSubTab = 'education'; render();" class="px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${servicesSubTab === 'education' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}">
                <span class="flex items-center gap-2"><span class="material-symbols-outlined text-lg">school</span>Education</span>
            </button>
        </div>
        
        ${servicesSubTab === 'grooming' ? `
            <!-- Grooming Services Content -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 class="text-xl font-bold text-slate-900 dark:text-white">Grooming Services</h2>
                    <p class="text-sm text-slate-500">Manage the services customers can book</p>
                </div>
                <button onclick="openGroomingServiceModal()" class="flex items-center gap-2 bg-primary hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                    <span class="material-symbols-outlined text-lg">add</span>Add Service
                </button>
            </div>
            
            <!-- Services Table -->
            <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th class="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service</th>
                                <th class="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price</th>
                                <th class="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                                <th class="text-center px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th class="text-center px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            ${state.services && state.services.length > 0 ? state.services.map((service, idx) => `
                                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <span class="material-symbols-outlined text-primary">content_cut</span>
                                            </div>
                                            <div>
                                                <p class="font-bold text-slate-900 dark:text-white">${service.name}</p>
                                                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">${service.description || 'No description'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="text-lg font-bold text-slate-900 dark:text-white">$${(service.base_price || 0).toFixed(2)}</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="text-slate-600 dark:text-slate-300">${service.duration_minutes || 60} min</span>
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <button onclick="toggleGroomingServiceStatus('${service.id}', ${service.is_active !== false})" class="px-3 py-1 rounded-full text-xs font-bold ${service.is_active !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}">
                                            ${service.is_active !== false ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center justify-center gap-1">
                                            <button onclick="openGroomingServiceModal('${service.id}')" class="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Edit">
                                                <span class="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            <button onclick="confirmDeleteGroomingService('${service.id}', '${(service.name || '').replace(/'/g, "\\'")}')" class="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Delete">
                                                <span class="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="5" class="px-6 py-12 text-center">
                                        <div class="flex flex-col items-center">
                                            <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                                <span class="material-symbols-outlined text-3xl text-slate-400">content_cut</span>
                                            </div>
                                            <p class="text-slate-500 dark:text-slate-400 font-medium mb-2">No grooming services yet</p>
                                            <p class="text-sm text-slate-400 mb-4">Add your first service to start accepting bookings</p>
                                            <button onclick="openGroomingServiceModal()" class="flex items-center gap-2 bg-primary hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                                <span class="material-symbols-outlined text-lg">add</span>Add First Service
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-4">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Total Services</p>
                    <p class="text-2xl font-bold text-slate-900 dark:text-white">${state.services?.length || 0}</p>
                </div>
                <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-4">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Active</p>
                    <p class="text-2xl font-bold text-green-600">${state.services?.filter(s => s.is_active !== false).length || 0}</p>
                </div>
                <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-4">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Avg Price</p>
                    <p class="text-2xl font-bold text-slate-900 dark:text-white">$${state.services?.length > 0 ? (state.services.reduce((sum, s) => sum + (s.base_price || 0), 0) / state.services.length).toFixed(0) : '0'}</p>
                </div>
                <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-4">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Avg Duration</p>
                    <p class="text-2xl font-bold text-slate-900 dark:text-white">${state.services?.length > 0 ? Math.round(state.services.reduce((sum, s) => sum + (s.duration_minutes || 60), 0) / state.services.length) : '0'} min</p>
                </div>
            </div>
        ` : servicesSubTab === 'products' ? `
            <!-- Products Content -->
            <div class="flex justify-between items-center mb-6">
                <div class="flex gap-2">
                    <button onclick="state.productFilter = 'all'; render();" class="px-4 py-2 rounded-lg ${(state.productFilter || 'all') === 'all' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'} text-sm font-bold">All (${data.products.length})</button>
                    <button onclick="state.productFilter = 'active'; render();" class="px-4 py-2 rounded-lg ${state.productFilter === 'active' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'} text-sm font-medium">Active (${activeProducts.length})</button>
                    <button onclick="state.productFilter = 'inactive'; render();" class="px-4 py-2 rounded-lg ${state.productFilter === 'inactive' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'} text-sm font-medium">Inactive (${inactiveProducts.length})</button>
                </div>
                <button onclick="openEditModal('product', {})" class="flex items-center gap-2 bg-primary hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                    <span class="material-symbols-outlined text-lg">add</span>Add Product
                </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                ${(state.productFilter === 'active' ? activeProducts : state.productFilter === 'inactive' ? inactiveProducts : data.products).map((p, i) => {
                    const originalIndex = data.products.findIndex(prod => prod.id === p.id);
                    state.editItems['product_' + originalIndex] = { id: p.id, name: p.name, description: p.description || '', price: p.price, category: p.category || 'grooming', affiliate_url: p.affiliate_url || '', image_url: p.image_url || '', is_active: p.is_active };
                    return `
                    <div class="group bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden hover:shadow-xl transition-all flex flex-col h-full">
                        <div class="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <div class="w-full h-full bg-cover bg-center group-hover:scale-105 transition-all duration-500" style="background-image: url('${p.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}')"></div>
                            <div class="absolute top-3 right-3"><span class="px-2 py-1 ${p.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'} text-xs font-bold rounded-md">${p.is_active !== false ? 'Active' : 'Inactive'}</span></div>
                        </div>
                        <div class="p-4 flex flex-col flex-1">
                            <h3 class="text-slate-900 dark:text-white font-bold text-lg leading-tight mb-1 line-clamp-1">${p.name || 'Unnamed Product'}</h3>
                            <p class="text-slate-500 dark:text-slate-400 text-sm mb-3 line-clamp-2">${p.description || 'No description'}</p>
                            <div class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <span class="text-slate-900 dark:text-white font-bold">$${(p.price || 0).toFixed(2)}</span>
                                <div class="flex gap-1">
                                    <button onclick="openEditModal('product', ${originalIndex})" class="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><span class="material-symbols-outlined text-lg">edit</span></button>
                                    <button onclick="confirmDeleteProduct('${p.id}', '${(p.name || '').replace(/'/g, "\\'")}')" class="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><span class="material-symbols-outlined text-lg">delete</span></button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
                <button onclick="openEditModal('product', {})" class="group flex flex-col h-full min-h-[300px] border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary rounded-xl items-center justify-center p-6 text-center transition-all bg-slate-50/50 dark:bg-slate-800/50 hover:bg-primary/5">
                    <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-primary group-hover:text-white text-slate-400 flex items-center justify-center mb-4 transition-colors"><span class="material-symbols-outlined text-3xl">add</span></div>
                    <h3 class="text-slate-900 dark:text-white font-bold text-lg">Add New Product</h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mt-2">Link a product from Amazon, Chewy, etc.</p>
                </button>
            </div>
        ` : servicesSubTab === 'ridealongs' ? `
            <!-- Ride-Alongs Content -->
            <div class="flex justify-end mb-6">
                <button onclick="openEditModal('ridealong', {})" class="flex items-center gap-2 bg-primary hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                    <span class="material-symbols-outlined text-lg">add</span>Add Package
                </button>
            </div>
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                ${data.rideAlongs.map((pkg, i) => {
                    state.editItems['ridealong_' + i] = {...pkg};
                    const features = Array.isArray(pkg.features) ? pkg.features : [];
                    return `
                    <div class="bg-white dark:bg-surface-dark rounded-xl shadow-sm border ${pkg.popular || pkg.is_popular ? 'border-primary/30 ring-2 ring-primary/20' : 'border-slate-200 dark:border-border-dark'} flex flex-col overflow-hidden h-full">
                        <div class="p-6 flex flex-col gap-4 flex-1">
                            <div class="flex items-center justify-between">
                                <div class="px-2.5 py-1 rounded-full ${pkg.popular || pkg.is_popular ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}"><p class="text-xs font-bold uppercase">${pkg.popular || pkg.is_popular ? 'Most Popular' : 'Package'}</p></div>
                                <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">Active</span>
                            </div>
                            <div>
                                <h3 class="text-2xl font-black text-slate-900 dark:text-white">${pkg.name}</h3>
                                <p class="text-3xl font-bold text-primary mt-2">$${pkg.price}</p>
                                <p class="text-sm text-slate-500 dark:text-slate-400">${pkg.duration || ''}</p>
                            </div>
                            <p class="text-sm text-slate-600 dark:text-slate-400">${pkg.description || ''}</p>
                            <div class="flex-1">
                                <p class="text-xs font-semibold text-slate-500 uppercase mb-2">Included Features</p>
                                <div class="flex flex-col gap-2">
                                    ${features.map(f => `<div class="flex gap-2 items-center"><span class="material-symbols-outlined text-primary text-lg">check_circle</span><span class="text-sm text-slate-700 dark:text-slate-300">${f}</span></div>`).join('')}
                                </div>
                            </div>
                        </div>
                        <div class="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <button onclick="confirmDeleteRideAlong('${pkg.id}', '${(pkg.name || '').replace(/'/g, "\\'")}')" class="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"><span class="material-symbols-outlined text-sm">delete</span>Delete</button>
                            <button onclick="openEditModal('ridealong', ${i})" class="text-xs font-bold text-primary hover:text-sky-600 flex items-center gap-1"><span class="material-symbols-outlined text-sm">edit</span>Edit</button>
                        </div>
                    </div>`;
                }).join('')}
                <button onclick="openEditModal('ridealong', {})" class="group flex flex-col h-full min-h-[400px] border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary rounded-xl items-center justify-center p-6 text-center transition-all bg-slate-50/50 dark:bg-slate-800/50 hover:bg-primary/5">
                    <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-primary group-hover:text-white text-slate-400 flex items-center justify-center mb-4 transition-colors"><span class="material-symbols-outlined text-3xl">add</span></div>
                    <h3 class="text-slate-900 dark:text-white font-bold text-lg">Add New Package</h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mt-2">Create a new ride-along mentorship package.</p>
                </button>
            </div>
        ` : `
            <!-- Education Content -->
            <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm p-6 md:p-8">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-2 text-slate-900 dark:text-white">
                        <span class="material-symbols-outlined text-primary">school</span>
                        <h3 class="text-xl font-bold">Skool Community</h3>
                    </div>
                    <span class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Published</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Course Title</label>
                        <input class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white h-12 px-4" value="Dogfathersplus Academy"/>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Instructor</label>
                        <input class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white h-12 px-4" value="Rosa & Gerardo"/>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Price</label>
                        <input class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white h-12 px-4" type="number" value="49.00"/>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skool Link</label>
                        <input class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white h-12 px-4" value="https://www.skool.com/dogfathersplus"/>
                    </div>
                </div>
                <div class="mt-6 flex items-center gap-4">
                    <a href="https://www.skool.com/dogfathersplus" target="_blank" class="flex items-center gap-2 text-primary hover:text-sky-600 font-bold text-sm">
                        <span class="material-symbols-outlined text-lg">open_in_new</span>Open Skool Community
                    </a>
                    <button onclick="saveEducationSettings()" class="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-sky-600 text-white font-bold text-sm rounded-lg">
                        <span class="material-symbols-outlined text-lg">save</span>Save Changes
                    </button>
                </div>
            </div>
        `}`;
    }

    // Backwards compatibility redirects for old tab names
    if (state.currentTab === 'products') {
        state.currentTab = 'services';
        state.adminServicesSubTab = 'products';
        return renderAdminContent();
    }
    if (state.currentTab === 'ridealongs') {
        state.currentTab = 'services';
        state.adminServicesSubTab = 'ridealongs';
        return renderAdminContent();
    }
    if (state.currentTab === 'education') {
        state.currentTab = 'services';
        state.adminServicesSubTab = 'education';
        return renderAdminContent();
    }

    return '';
}


// =============================================
// GROOMER AVAILABILITY SYSTEM
// =============================================

// Load groomer's availability schedule
async function loadGroomerAvailability(groomerId) {
    try {
        const { data: availability, error } = await supabaseClient
            .from('groomer_availability')
            .select('*')
            .eq('groomer_id', groomerId)
            .order('day_of_week');
        
        if (!error) {
            state.groomerAvailability = availability || [];
        }
        
        // Load time off requests
        const { data: timeOff } = await supabaseClient
            .from('groomer_time_off')
            .select('*')
            .eq('groomer_id', groomerId)
            .order('start_date', { ascending: false });
        
        state.groomerTimeOffRequests = timeOff || [];
    } catch (err) {
        console.error('Error loading groomer availability:', err);
    }
}

// Request time off (Groomer)
async function requestTimeOff(startDate, endDate, reason) {
    showLoading();
    try {
        const { data, error } = await supabaseClient
            .rpc('request_time_off', {
                p_groomer_id: state.currentUser.id,
                p_start_date: startDate,
                p_end_date: endDate,
                p_reason: reason
            });
        
        hideLoading();
        
        if (error) throw error;
        
        if (!data.success) {
            showToast(data.error, 'error');
            return;
        }
        
        if (data.warning) {
            showToast(data.warning, 'warning');
        }
        
        showToast('Time off request submitted!', 'success');
        state.showTimeOffModal = false;
        await loadGroomerAvailability(state.currentUser.id);
        render();
    } catch (err) {
        hideLoading();
        showToast('Failed to submit request: ' + err.message, 'error');
    }
}

// Review time off request (Admin)
async function reviewTimeOffRequest(requestId, approved, notes = null) {
    showLoading();
    try {
        const { data, error } = await supabaseClient
            .rpc('review_time_off_request', {
                p_request_id: requestId,
                p_admin_id: state.currentUser.id,
                p_approved: approved,
                p_admin_notes: notes
            });
        
        hideLoading();
        
        if (error) throw error;
        
        if (!data.success) {
            showToast(data.error, 'error');
            return;
        }
        
        showToast(`Time off ${approved ? 'approved' : 'denied'}`, 'success');
        await loadPendingTimeOffRequests();
        render();
    } catch (err) {
        hideLoading();
        showToast('Failed to review request: ' + err.message, 'error');
    }
}

// Load pending time off requests (Admin)
async function loadPendingTimeOffRequests() {
    try {
        const { data, error } = await supabaseClient
            .from('groomer_time_off')
            .select(`
                *,
                groomer:groomer_id(name, email)
            `)
            .eq('status', 'pending')
            .order('requested_at');
        
        if (!error) {
            state.pendingTimeOffRequests = data || [];
        }
    } catch (err) {
        console.error('Error loading time off requests:', err);
    }
}

// Check groomer capacity before assignment
async function checkGroomerCapacity(groomerId, date) {
    try {
        const { data, error } = await supabaseClient
            .rpc('can_groomer_accept_appointment', {
                p_groomer_id: groomerId,
                p_date: date
            });
        
        if (error) {
            _log('Capacity check function not available:', error);
            return { can_accept: true };
        }
        
        return data;
    } catch (err) {
        console.error('Error checking capacity:', err);
        return { can_accept: true };
    }
}


// =============================================
// REDEMPTION FULFILLMENT SYSTEM
// =============================================

// Load pending redemptions (Admin)
async function loadPendingRedemptions() {
    try {
        const { data, error } = await supabaseClient
            .rpc('get_pending_redemptions');
        
        if (error) {
            // Fallback query - use correct column names
            const { data: redemptions, error: fallbackError } = await supabaseClient
                .from('reward_redemptions')
                .select(`
                    *,
                    customer:customer_id(full_name, email, phone),
                    reward:reward_id(name, points_required)
                `)
                .in('status', ['pending', 'processing'])
                .order('redeemed_at', { ascending: true });
            
            if (fallbackError) {
                console.error('Redemptions fallback error:', fallbackError);
                state.pendingRedemptions = [];
                return;
            }
            
            // Map joined data to flat fields the UI expects
            state.pendingRedemptions = (redemptions || []).map(r => ({
                ...r,
                customer_name: r.customer?.full_name || 'Customer',
                customer_email: r.customer?.email || '',
                customer_phone: r.customer?.phone || '',
                reward_name: r.reward?.name || 'Reward',
                points_cost: r.points_cost || r.reward?.points_required || 0
            }));
        } else {
            state.pendingRedemptions = data || [];
        }
    } catch (err) {
        console.error('Error loading pending redemptions:', err);
    }
}

// Fulfill redemption (Admin)
async function fulfillRedemption(redemptionId, notes = null) {
    showLoading();
    try {
        const { data, error } = await supabaseClient
            .rpc('fulfill_redemption', {
                p_redemption_id: redemptionId,
                p_admin_id: state.currentUser.id,
                p_notes: notes
            });
        
        if (error) {
            // Fallback to direct update
            _log('fulfill_redemption RPC not available, using direct update');
            const { error: updateError } = await supabaseClient
                .from('reward_redemptions')
                .update({
                    status: 'fulfilled',
                    fulfilled_at: new Date().toISOString(),
                    fulfilled_by: state.currentUser.id,
                    notes: notes
                })
                .eq('id', redemptionId);
            
            hideLoading();
            
            if (updateError) {
                showToast('Failed to fulfill: ' + updateError.message, 'error');
                return;
            }
            
            showToast('Redemption fulfilled!', 'success');
            state.showRedemptionModal = null;
            await loadPendingRedemptions();
            render();
            return;
        }
        
        hideLoading();
        
        if (!data.success) {
            showToast(data.error, 'error');
            return;
        }
        
        showToast('Redemption fulfilled! Customer notified.', 'success');
        state.showRedemptionModal = null;
        await loadPendingRedemptions();
        render();
    } catch (err) {
        hideLoading();
        showToast('Failed to fulfill: ' + err.message, 'error');
    }
}

// Cancel redemption with refund (Admin)
async function cancelRedemption(redemptionId, reason) {
    if (!reason || reason.trim() === '') {
        showToast('Please provide a reason for cancellation', 'error');
        return;
    }
    
    showLoading();
    try {
        const { data, error } = await supabaseClient
            .rpc('cancel_redemption', {
                p_redemption_id: redemptionId,
                p_admin_id: state.currentUser.id,
                p_reason: reason
            });
        
        if (error) {
            // Fallback to direct update with manual refund
            _log('cancel_redemption RPC not available, using direct update');
            
            // Get redemption details first
            const { data: redemption } = await supabaseClient
                .from('reward_redemptions')
                .select('*, reward:reward_id(points_required), customer_id')
                .eq('id', redemptionId)
                .single();
            
            if (redemption) {
                // Update redemption status
                await supabaseClient
                    .from('reward_redemptions')
                    .update({
                        status: 'cancelled',
                        cancelled_at: new Date().toISOString(),
                        cancelled_by: state.currentUser.id,
                        cancellation_reason: reason
                    })
                    .eq('id', redemptionId);
                
                // Refund points to customer
                const pointsToRefund = redemption.points_cost || redemption.reward?.points_required || 0;
                if (pointsToRefund > 0 && redemption.customer_id) {
                    const { data: customer } = await supabaseClient
                        .from('profiles')
                        .select('loyalty_points')
                        .eq('id', redemption.customer_id)
                        .single();
                    
                    if (customer) {
                        await supabaseClient
                            .from('profiles')
                            .update({ loyalty_points: (customer.loyalty_points || 0) + pointsToRefund })
                            .eq('id', redemption.customer_id);
                    }
                }
                
                hideLoading();
                showToast(`Redemption cancelled. ${pointsToRefund} points refunded.`, 'success');
                state.showRedemptionModal = null;
                await loadPendingRedemptions();
                render();
                return;
            }
            
            hideLoading();
            showToast('Failed to cancel redemption', 'error');
            return;
        }
        
        hideLoading();
        
        if (!data.success) {
            showToast(data.error, 'error');
            return;
        }
        
        showToast(`Redemption cancelled. ${data.points_refunded} points refunded.`, 'success');
        state.showRedemptionModal = null;
        await loadPendingRedemptions();
        render();
    } catch (err) {
        hideLoading();
        showToast('Failed to cancel: ' + err.message, 'error');
    }
}

// Open redemption modal
function openRedemptionModal(redemption, action) {
    state.showRedemptionModal = { redemption, action };
    render();
}

// Close redemption modal
function closeRedemptionModal() {
    state.showRedemptionModal = null;
    render();
}

// =============================================
// ADMIN MESSAGES FUNCTIONS
// =============================================

function renderAdminMessagesTab() {
    const groomers = state.groomers || [];
    const messages = state.adminMessages || [];
    const activeGroomer = state.adminActiveConversation;
    
    // Group messages by groomer
    const groomerMessages = {};
    groomers.forEach(g => {
        groomerMessages[g.id] = messages.filter(m => 
            (m.sender_id === g.id && m.to_admin) || 
            (m.recipient_id === g.id && m.is_admin)
        );
    });
    
    // Also include messages from unknown groomers
    const unknownGroomerIds = [...new Set(messages.filter(m => m.to_admin).map(m => m.sender_id))].filter(id => !groomers.find(g => g.id === id));
    
    return `
    <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">Messages</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Communicate with your grooming team</p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
        <!-- Conversations List -->
        <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark flex flex-col overflow-hidden">
            <div class="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 class="font-bold dark:text-white">Groomer Conversations</h3>
            </div>
            <div class="flex-1 overflow-y-auto">
                ${groomers.filter(g => g.is_active !== false).map(g => {
                    const gMessages = groomerMessages[g.id] || [];
                    const lastMsg = gMessages[gMessages.length - 1];
                    const unread = gMessages.filter(m => !m.is_read && m.to_admin).length;
                    const initials = (g.full_name || 'G').split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
                    
                    return `
                    <button onclick="openAdminConversation('${g.id}')" class="w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 ${activeGroomer === g.id ? 'bg-primary/10' : ''}">
                        <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <span class="text-emerald-600 font-bold">${initials}</span>
                        </div>
                        <div class="flex-1 text-left min-w-0">
                            <p class="font-bold dark:text-white truncate">${g.full_name || g.name || 'Groomer'}</p>
                            <p class="text-sm text-slate-500 truncate">${lastMsg ? lastMsg.message?.substring(0, 30) + '...' : 'No messages yet'}</p>
                        </div>
                        ${unread > 0 ? `<span class="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">${unread}</span>` : ''}
                    </button>`;
                }).join('')}
                ${groomers.filter(g => g.is_active !== false).length === 0 ? `
                    <div class="p-8 text-center">
                        <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">group</span>
                        <p class="text-slate-500 text-sm">No active groomers</p>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <!-- Message Thread -->
        <div class="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark flex flex-col overflow-hidden">
            ${activeGroomer ? renderAdminMessageThread(activeGroomer, groomerMessages[activeGroomer] || []) : `
                <div class="flex-1 flex items-center justify-center">
                    <div class="text-center">
                        <span class="material-symbols-outlined text-6xl text-slate-300 mb-4">forum</span>
                        <p class="text-slate-500">Select a groomer to start messaging</p>
                    </div>
                </div>
            `}
        </div>
    </div>`;
}

function renderAdminMessageThread(groomerId, messages) {
    const groomer = state.groomers.find(g => g.id === groomerId);
    const groomerName = groomer?.full_name || groomer?.name || 'Groomer';
    const initials = groomerName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
    
    return `
        <!-- Header -->
        <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span class="text-emerald-600 font-bold text-sm">${initials}</span>
            </div>
            <div>
                <p class="font-bold dark:text-white">${groomerName}</p>
                <p class="text-xs text-slate-500">${groomer?.phone || 'Groomer'}</p>
            </div>
        </div>
        
        <!-- Messages -->
        <div id="admin-messages-container" class="flex-1 overflow-y-auto p-4 space-y-4">
            ${messages.length > 0 ? messages.map(m => {
                const isAdmin = m.is_admin || m.sender_id === state.currentUser?.id;
                const time = new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                const date = new Date(m.created_at).toLocaleDateString();
                return `
                <div class="flex ${isAdmin ? 'justify-end' : 'justify-start'}">
                    <div class="max-w-[70%] ${isAdmin ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'} rounded-2xl px-4 py-3">
                        <p class="text-sm">${escapeHtml(m.message)}</p>
                        <p class="text-[10px] ${isAdmin ? 'text-primary-200 opacity-70' : 'text-slate-400'} mt-1">${time}</p>
                    </div>
                </div>`;
            }).join('') : `
                <div class="h-full flex items-center justify-center">
                    <div class="text-center">
                        <span class="material-symbols-outlined text-5xl text-slate-300 mb-3">chat</span>
                        <p class="text-slate-500">No messages yet. Say hello!</p>
                    </div>
                </div>
            `}
        </div>
        
        <!-- Input -->
        <div class="p-4 border-t border-slate-100 dark:border-slate-800">
            <form onsubmit="sendAdminMessage(event, '${groomerId}')" class="flex gap-3">
                <input type="text" id="admin-message-input" placeholder="Type a message..." class="flex-1 h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-primary dark:text-white" autocomplete="off"/>
                <button type="submit" class="h-12 px-6 bg-primary text-white font-bold rounded-xl hover:bg-sky-600 transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined">send</span>
                </button>
            </form>
        </div>
    `;
}

function openAdminConversation(groomerId) {
    state.adminActiveConversation = groomerId;
    loadAdminMessages();
    render();
    // Scroll to bottom
    setTimeout(() => {
        const container = document.getElementById('admin-messages-container');
        if (container) container.scrollTop = container.scrollHeight;
    }, 100);
}

async function loadAdminMessages() {
    try {
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .or('to_admin.eq.true,is_admin.eq.true')
            .order('created_at', { ascending: true });
        
        if (!error && data) {
            state.adminMessages = data;
        }
    } catch (err) {
        _log('Messages table may not exist yet');
        state.adminMessages = [];
    }
}

async function sendAdminMessage(e, groomerId) {
    e.preventDefault();
    const input = document.getElementById('admin-message-input');
    const message = input?.value?.trim();
    if (!message) return;
    
    try {
        const { error } = await supabaseClient
            .from('messages')
            .insert({
                sender_id: state.currentUser.id,
                recipient_id: groomerId,
                message: message,
                is_admin: true,
                is_read: false
            });
        
        if (error) {
            _log('Messages table may not exist:', error);
        }
        
        // Add to local state for immediate feedback
        state.adminMessages = state.adminMessages || [];
        state.adminMessages.push({
            id: Date.now(),
            sender_id: state.currentUser.id,
            recipient_id: groomerId,
            message: message,
            is_admin: true,
            created_at: new Date().toISOString()
        });
        
        input.value = '';
        render();
        
        // Scroll to bottom
        setTimeout(() => {
            const container = document.getElementById('admin-messages-container');
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
    } catch (err) {
        console.error('Error sending message:', err);
        showToast('Failed to send message', 'error');
    }
}

