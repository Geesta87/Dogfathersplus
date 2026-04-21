// =============================================
// DOGFATHERS PLUS — GROOMER.JS
// =============================================

// =============================================
// GROOMER FUNCTIONS
// =============================================

// Load groomer's assigned appointments
async function loadGroomerData() {
    try {
        _log('Loading groomer data for user:', state.currentUser?.id);
        
        const { data: appointments, error: apptsError } = await supabaseClient
            .from('appointments')
            .select(`
                *,
                customer:profiles!appointments_customer_id_fkey(full_name, email, phone, address, city),
                pet:pets(name, breed, weight, grooming_notes, photo_url),
                service:services(name, duration_minutes, base_price)
            `)
            .eq('assigned_groomer_id', state.currentUser.id)
            .in('status', ['pending', 'confirmed', 'in_progress', 'completed'])
            .order('appointment_date', { ascending: true })
            .order('start_time', { ascending: true });
        
        if (apptsError) {
            console.error('Groomer appointments load error:', apptsError);
            state.groomerAppointments = [];
        } else {
            _log('Groomer appointments loaded:', appointments?.length || 0);
            _log('Raw appointments data:', appointments?.map(a => ({
                id: a.id?.substring(0, 8),
                date: a.appointment_date,
                time: a.start_time,
                status: a.status,
                assigned_groomer_id: a.assigned_groomer_id?.substring(0, 8)
            })));
            
            state.groomerAppointments = (appointments || []).map(a => ({
                ...a,
                customerName: a.customer?.full_name || 'Customer',
                customerEmail: a.customer?.email || '',
                customerPhone: a.customer?.phone || '',
                customerAddress: a.customer?.address || '',
                customerCity: a.customer?.city || '',
                petName: a.pet?.name || 'Pet',
                petBreed: a.pet?.breed || '',
                petWeight: a.pet?.weight || '',
                petNotes: a.pet?.grooming_notes || '',
                petPhoto: a.pet?.photo_url || '',
                serviceName: a.service?.name || 'Grooming',
                serviceDuration: a.service?.duration_minutes || 60,
                servicePrice: a.service?.base_price || a.total_price || 0
            }));
        }
        
        // Load notifications
        await loadNotifications();
        
        // Load groomer's availability
        await loadGroomerAvailability(state.currentUser.id);
    } catch (err) {
        console.error('Failed to load groomer data:', err);
    }
}

// Groomer login handler
async function handleGroomerLogin(email, password) {
    email = (typeof normalizeEmail === 'function') ? normalizeEmail(email) : (email || '').trim().toLowerCase();
    showLoading();

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            hideLoading();
            showToast(error.message, 'error');
            return;
        }
        
        // Check if user has groomer role
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (profileError || !profile) {
            hideLoading();
            await supabaseClient.auth.signOut();
            showToast('Profile not found', 'error');
            return;
        }
        
        if (profile.role !== 'groomer') {
            hideLoading();
            await supabaseClient.auth.signOut();
            showToast('Not authorized as groomer. Please use customer login.', 'error');
            return;
        }
        
        // Set up groomer session
        state.currentUser = {
            id: data.user.id,
            email: profile.email,
            name: profile.full_name || email.split('@')[0],
            phone: profile.phone || '',
            role: 'groomer'
        };
        state.session = data.session;
        state.showGroomerLogin = false;
        
        await loadPublicData();
        await loadGroomerData();
        setupRealtimeSubscriptions();
        
        hideLoading();
        showToast(`Welcome, ${state.currentUser.name || 'Groomer'}!`, 'success');
        render();
        
    } catch (err) {
        hideLoading();
        console.error('Groomer login error:', err);
        showToast('Login failed: ' + err.message, 'error');
    }
}

// Admin assigns groomer to appointment
async function assignGroomer(appointmentId, groomerId) {
    showLoading();
    
    try {
        const { error } = await supabaseClient
            .from('appointments')
            .update({
                assigned_groomer_id: groomerId || null,
                assigned_at: groomerId ? new Date().toISOString() : null
            })
            .eq('id', appointmentId);
        
        if (error) {
            hideLoading();
            showToast('Failed to assign groomer: ' + error.message, 'error');
            return;
        }
        
        // Reload admin data
        await loadAdminData();
        hideLoading();
        
        const groomer = state.groomers.find(g => g.id === groomerId);
        showToast(groomerId ? `Assigned to ${groomer?.full_name || 'groomer'}` : 'Groomer unassigned', 'success');
        render();
        
    } catch (err) {
        hideLoading();
        console.error('Assign groomer error:', err);
        showToast('Failed to assign groomer', 'error');
    }
}

// Groomer marks appointment as complete

// Start Grooming - Show before photo modal first
function startGroomingAppointment(appointmentId) {
    const apt = (state.groomerAppointments || []).find(a => a.id === appointmentId);
    if (!apt) {
        showToast('Appointment not found', 'error');
        return;
    }
    
    state.showBeforePhotoModal = true;
    state.beforePhotoAppointmentId = appointmentId;
    state.beforePhotoAppointmentData = apt;
    state.capturedBeforePhoto = null;
    render();
}

// Close before photo modal
function closeBeforePhotoModal() {
    state.showBeforePhotoModal = false;
    state.beforePhotoAppointmentId = null;
    state.beforePhotoAppointmentData = null;
    state.capturedBeforePhoto = null;
    render();
}

// Skip before photo and start immediately
async function skipBeforePhotoAndStart() {
    const appointmentId = state.beforePhotoAppointmentId;
    closeBeforePhotoModal();
    await groomerStartAppointment(appointmentId, null);
}

// Capture photo using device camera
async function capturePhoto(type) {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use back camera on mobile
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
                resolve(null);
                return;
            }
            
            try {
                // Compress and convert to base64
                const compressed = await compressImage(file, 1200, 0.8);
                
                if (type === 'before') {
                    state.capturedBeforePhoto = compressed;
                } else {
                    state.capturedAfterPhoto = compressed;
                }
                render();
                resolve(compressed);
            } catch (err) {
                console.error('Photo capture error:', err);
                reject(err);
            }
        };
        
        input.click();
    });
}

// Compress image to reduce size
async function compressImage(file, maxWidth, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Upload photo to Supabase Storage
async function uploadPhotoToStorage(base64Data, appointmentId, photoType) {
    try {
        // Convert base64 to blob
        const response = await fetch(base64Data);
        const blob = await response.blob();
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${appointmentId}_${photoType}_${timestamp}.jpg`;
        const filePath = `appointment-photos/${filename}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabaseClient.storage
            .from('grooming-photos')
            .upload(filePath, blob, {
                contentType: 'image/jpeg',
                upsert: true
            });
        
        if (error) {
            console.error('Storage upload error:', error);
            // If bucket doesn't exist, show helpful message
            if (error.message.includes('bucket') || error.message.includes('not found')) {
                _log('Note: Storage bucket "grooming-photos" may need to be created in Supabase');
            }
            return null;
        }
        
        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from('grooming-photos')
            .getPublicUrl(filePath);
        
        return urlData?.publicUrl || null;
        
    } catch (err) {
        console.error('Photo upload error:', err);
        return null;
    }
}

// Start appointment with optional before photo
async function startWithBeforePhoto() {
    const appointmentId = state.beforePhotoAppointmentId;
    const beforePhoto = state.capturedBeforePhoto;
    
    closeBeforePhotoModal();
    await groomerStartAppointment(appointmentId, beforePhoto);
}

// Groomer starts an appointment (status: confirmed → in_progress)
// In-flight guard to prevent double-tap duplicate writes on spotty mobile networks
if (typeof window !== 'undefined' && !window._groomerActionsInFlight) {
    window._groomerActionsInFlight = new Set();
}

async function groomerStartAppointment(appointmentId, beforePhotoBase64 = null) {
    const guardKey = `start:${appointmentId}`;
    if (window._groomerActionsInFlight.has(guardKey)) {
        _log('Start appointment already in flight, ignoring duplicate tap:', appointmentId);
        return;
    }
    window._groomerActionsInFlight.add(guardKey);

    showLoading();

    try {
        // Upload before photo if captured
        let beforePhotoUrl = null;
        if (beforePhotoBase64) {
            beforePhotoUrl = await uploadPhotoToStorage(beforePhotoBase64, appointmentId, 'before');
        }
        
        // Build update data
        const updateData = {
            status: 'in_progress',
            started_at: new Date().toISOString()
        };
        
        // Add before photo URL if uploaded
        if (beforePhotoUrl) {
            updateData.before_photo_url = beforePhotoUrl;
        }
        
        // Direct database update (bypasses RPC functions that may not exist)
        const { error } = await supabaseClient
            .from('appointments')
            .update(updateData)
            .eq('id', appointmentId)
            .eq('assigned_groomer_id', state.currentUser.id);
        
        if (error) {
            hideLoading();
            showToast('Failed to start appointment: ' + error.message, 'error');
            return;
        }
        
        // Close appointment detail modal if open
        if (state.showAppointmentDetail) {
            state.showAppointmentDetail = false;
            state.selectedAppointment = null;
        }
        
        // Reload groomer data
        await loadGroomerData(state.currentUser.id);
        hideLoading();
        showToast(beforePhotoUrl ? '📸 Photo saved! Appointment started.' : '🚀 Appointment started! Timer is running.', 'success');
        render();
        
    } catch (err) {
        hideLoading();
        console.error('Start appointment error:', err);
        showToast('Failed to start appointment', 'error');
    } finally {
        window._groomerActionsInFlight.delete(`start:${appointmentId}`);
    }
}

// Groomer completes an appointment with notes (status: in_progress → completed)
async function groomerCompleteAppointment(appointmentId, providedNotes = null, afterPhotoBase64 = null) {
    // Use provided notes or try to get from DOM element
    const notesEl = document.getElementById(`groomer-notes-${appointmentId}`) || 
                   document.getElementById('modal-groomer-notes-' + appointmentId) ||
                   document.getElementById('completion-notes');
    const groomerNotes = providedNotes || notesEl?.value?.trim() || null;
    
    // Use the direct update method (more reliable without RPC functions)
    await groomerMarkComplete(appointmentId, groomerNotes, afterPhotoBase64);
}

// Legacy groomer mark complete (fallback, also used for pending → completed edge case)
async function groomerMarkComplete(appointmentId, groomerNotes = null, afterPhotoBase64 = null) {
    const guardKey = `complete:${appointmentId}`;
    if (window._groomerActionsInFlight && window._groomerActionsInFlight.has(guardKey)) {
        _log('Complete appointment already in flight, ignoring duplicate tap:', appointmentId);
        return;
    }
    window._groomerActionsInFlight?.add(guardKey);

    showLoading();

    try {
        // Find the appointment to get customer_id
        const appointment = state.groomerAppointments.find(a => a.id === appointmentId);

        if (!appointment) {
            hideLoading();
            showToast('Appointment not found', 'error');
            return;
        }

        // Idempotency: if already completed, no-op silently (prevents duplicate points award)
        if (appointment.status === 'completed') {
            _log('Appointment already completed, skipping:', appointmentId);
            hideLoading();
            return;
        }
        
        // Upload after photo if captured
        let afterPhotoUrl = null;
        if (afterPhotoBase64) {
            afterPhotoUrl = await uploadPhotoToStorage(afterPhotoBase64, appointmentId, 'after');
        }
        
        // Update appointment status - include assigned_groomer_id check for RLS
        const updateData = {
            status: 'completed',
            completed_at: new Date().toISOString(),
            completed_by: state.currentUser.id
        };
        
        // Auto-set started_at if not already set
        if (!appointment.started_at) {
            updateData.started_at = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
        }
        
        if (groomerNotes) {
            updateData.groomer_notes = groomerNotes;
        }
        
        // Add after photo URL if uploaded
        if (afterPhotoUrl) {
            updateData.after_photo_url = afterPhotoUrl;
        }
        
        // Update with both id and assigned_groomer_id to satisfy RLS
        const { error } = await supabaseClient
            .from('appointments')
            .update(updateData)
            .eq('id', appointmentId)
            .eq('assigned_groomer_id', state.currentUser.id);
        
        if (error) {
            console.error('Update error:', error);
            hideLoading();
            showToast('Failed to complete: ' + error.message, 'error');
            return;
        }
        
        // IMMEDIATELY update local state to show completion
        // This ensures UI updates even if reload has issues
        const aptIndex = state.groomerAppointments.findIndex(a => a.id === appointmentId);
        if (aptIndex !== -1) {
            state.groomerAppointments[aptIndex] = {
                ...state.groomerAppointments[aptIndex],
                status: 'completed',
                completed_at: updateData.completed_at,
                completed_by: updateData.completed_by,
                groomer_notes: groomerNotes,
                after_photo_url: afterPhotoUrl
            };
            _log('Local state updated for appointment:', appointmentId);
        }
        
        // Award loyalty points to customer (non-blocking)
        if (appointment.customer_id) {
            awardLoyaltyPointsToCustomer(appointment.customer_id, appointmentId);
        }
        
        // Also reload from database to ensure sync
        try {
            await loadGroomerData();
        } catch (reloadErr) {
            _warn('Reload warning (non-critical):', reloadErr);
        }
        
        hideLoading();
        const photoMsg = afterPhotoUrl ? '📸 Photo saved! ' : '';
        showToast(`${photoMsg}Appointment completed! Customer earned 50 loyalty points.`, 'success');
        render();
        
    } catch (err) {
        hideLoading();
        console.error('Complete appointment error:', err);
        showToast('Failed to complete appointment', 'error');
    } finally {
        window._groomerActionsInFlight?.delete(`complete:${appointmentId}`);
    }
}

// Helper function to award loyalty points (non-blocking, with one retry)
async function awardLoyaltyPointsToCustomer(customerId, appointmentId) {
    const attempt = async () => {
        const { data: customer, error: fetchErr } = await supabaseClient
            .from('profiles')
            .select('loyalty_points')
            .eq('id', customerId)
            .single();
        if (fetchErr) throw fetchErr;
        if (!customer) throw new Error('Customer profile not found');

        const updatedPoints = (customer.loyalty_points || 0) + 50;
        const { error: updateErr } = await supabaseClient
            .from('profiles')
            .update({ loyalty_points: updatedPoints })
            .eq('id', customerId);
        if (updateErr) throw updateErr;

        _log(`Awarded 50 loyalty points to customer. New total: ${updatedPoints}`);
        return updatedPoints;
    };

    try {
        await attempt();
    } catch (firstErr) {
        console.warn('Loyalty points award failed, retrying once:', firstErr);
        try {
            await new Promise(r => setTimeout(r, 800));
            await attempt();
        } catch (secondErr) {
            console.error('Failed to award loyalty points (after retry):', secondErr);
            // Surface to groomer so they can flag it manually — appointment still completes
            if (typeof showToast === 'function') {
                showToast('⚠️ Points award failed — admin will reconcile', 'error');
            }
        }
    }
}


// =============================================
// GROOMER DASHBOARD
// =============================================
function renderGroomerDashboard() {
    const user = state.currentUser;
    const appointments = state.groomerAppointments || [];
    const today = getTodayPacific(); // Use Pacific timezone
    const currentDate = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: TIMEZONE };
    const formattedDate = currentDate.toLocaleDateString('en-US', dateOptions);
    
    // Debug logging
    _log('Groomer Dashboard - Today (Pacific):', today);
    _log('Groomer Dashboard - Total appointments:', appointments.length);
    _log('Groomer Dashboard - Appointments:', appointments.map(a => ({
        id: a.id?.substring(0, 8),
        date: a.appointment_date,
        status: a.status,
        pet: a.petName
    })));
    
    // Filter appointments
    const todayAppts = appointments.filter(a => a.appointment_date === today && a.status !== 'completed' && a.status !== 'cancelled');
    const upcomingAppts = appointments
        .filter(a => a.appointment_date > today && a.status !== 'completed' && a.status !== 'cancelled')
        .sort((a, b) => {
            // Sort by date first, then by time
            if (a.appointment_date !== b.appointment_date) {
                return a.appointment_date.localeCompare(b.appointment_date);
            }
            return (a.start_time || '').localeCompare(b.start_time || '');
        });
    const completedAppts = appointments.filter(a => a.status === 'completed');
    const inProgressAppt = todayAppts.find(a => a.status === 'in_progress');
    
    _log('Groomer Dashboard - Today:', todayAppts.length, 'Upcoming:', upcomingAppts.length);
    _log('Groomer Dashboard - Completed total:', completedAppts.length);
    _log('Groomer Dashboard - Upcoming dates:', upcomingAppts.map(a => a.appointment_date));
    
    // Calculate estimated earnings from COMPLETED appointments today
    const todayCompletedAppts = completedAppts.filter(a => a.appointment_date === today);
    const completedEarnings = todayCompletedAppts.reduce((sum, a) => sum + (parseFloat(a.total_price) || parseFloat(a.servicePrice) || 0), 0);
    
    // Also calculate pending earnings (for "estimated" display)
    const pendingEarnings = todayAppts.reduce((sum, a) => sum + (parseFloat(a.total_price) || parseFloat(a.servicePrice) || 0), 0);
    const todayEarnings = completedEarnings + pendingEarnings;
    
    // Calculate shift time (mock for now)
    const shiftStart = localStorage.getItem('groomer_shift_start');
    let shiftDuration = '';
    if (shiftStart) {
        const start = new Date(shiftStart);
        const now = new Date();
        const mins = Math.floor((now - start) / 60000);
        shiftDuration = `${Math.floor(mins/60)}h ${mins%60}m`;
    }
    
    // Groomer tabs
    const groomerTab = state.groomerTab || 'dashboard';
    const unreadMessages = state.unreadGroomerMessages || 0;
    
    return `
    <div class="flex h-screen overflow-hidden groomer-gradient-bg dark:bg-background-dark">
        <!-- Sidebar -->
        <aside class="w-56 flex-shrink-0 flex flex-col border-r border-slate-200/50 dark:border-slate-800/50 glass-card hidden lg:flex">
            <div class="p-5">
                <!-- Logo -->
                <div class="flex items-center gap-3 mb-8">
                    <div class="bg-groomer-primary rounded-xl p-2 flex items-center justify-center text-white shadow-lg shadow-groomer-primary/30">
                        <span class="material-symbols-outlined text-xl">pets</span>
                    </div>
                    <div>
                        <h1 class="text-base font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">Dogfathers</h1>
                        <p class="text-[9px] text-groomer-primary font-bold uppercase tracking-[0.15em]">Workflow Manager</p>
                    </div>
                </div>
                
                <!-- Navigation -->
                <nav class="space-y-1">
                    <button onclick="setGroomerTab('dashboard')" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg ${groomerTab === 'dashboard' ? 'bg-groomer-primary text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 font-medium'} transition-all">
                        <span class="material-symbols-outlined text-xl">dashboard</span>
                        <span class="text-sm">Dashboard</span>
                    </button>
                    <button onclick="setGroomerTab('schedule')" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg ${groomerTab === 'schedule' ? 'bg-groomer-primary text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 font-medium'} transition-all">
                        <span class="material-symbols-outlined text-xl">calendar_today</span>
                        <span class="text-sm">Schedule</span>
                    </button>
                    <button onclick="setGroomerTab('history')" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg ${groomerTab === 'history' ? 'bg-groomer-primary text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 font-medium'} transition-all">
                        <span class="material-symbols-outlined text-xl">history</span>
                        <span class="text-sm">History</span>
                    </button>
                    <button onclick="setGroomerTab('availability')" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg ${groomerTab === 'availability' ? 'bg-groomer-primary text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 font-medium'} transition-all">
                        <span class="material-symbols-outlined text-xl">schedule</span>
                        <span class="text-sm">Availability</span>
                    </button>
                    <button onclick="setGroomerTab('messages')" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg ${groomerTab === 'messages' ? 'bg-groomer-primary text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 font-medium'} transition-all relative">
                        <span class="material-symbols-outlined text-xl">chat_bubble</span>
                        <span class="text-sm">Messages</span>
                        ${unreadMessages > 0 ? `<span class="absolute right-3 w-5 h-5 bg-tech-magenta text-white text-xs font-bold rounded-full flex items-center justify-center">${unreadMessages}</span>` : ''}
                    </button>
                </nav>
            </div>
            
            <!-- Bottom Section -->
            <div class="mt-auto p-5">
                <!-- Sign Out -->
                <button onclick="handleSignOut()" class="w-full text-slate-500 dark:text-slate-400 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm">
                    <span class="material-symbols-outlined text-lg">logout</span>
                    Sign Out
                </button>
            </div>
        </aside>
        
        <!-- Main Content -->
        <main class="flex-1 flex flex-col overflow-hidden">
            <!-- Mobile Header -->
            <header class="h-14 lg:h-16 flex items-center justify-between px-4 lg:px-10 glass-card border-b border-slate-200/50 dark:border-slate-800/50 z-10">
                <!-- Logo on Mobile / Search on Desktop -->
                <div class="flex items-center gap-2 lg:hidden">
                    <div class="w-8 h-8 bg-groomer-primary rounded-lg flex items-center justify-center text-white">
                        <span class="material-symbols-outlined text-lg">pets</span>
                    </div>
                    <span class="font-bold text-slate-900 dark:text-white">Dogfathers</span>
                </div>
                <div class="relative hidden lg:block">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input type="text" placeholder="Find a pet..." class="pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-sm focus:ring-2 focus:ring-tech-purple/30 focus:border-tech-purple w-64 placeholder:text-slate-400"/>
                </div>
                
                <div class="flex items-center gap-2 lg:gap-3">
                    <button onclick="toggleNotifications()" class="w-10 h-10 lg:w-auto lg:h-auto lg:p-2.5 flex items-center justify-center hover:bg-tech-purple/10 dark:hover:bg-slate-800 rounded-xl transition-colors relative touch-target" title="Notifications">
                        <span class="material-symbols-outlined text-slate-600 dark:text-slate-300">notifications</span>
                        ${state.unreadNotifications > 0 ? `<span class="absolute top-0 right-0 lg:-top-1 lg:-right-1 w-5 h-5 bg-tech-magenta text-white text-xs font-bold rounded-full flex items-center justify-center">${state.unreadNotifications > 9 ? '9+' : state.unreadNotifications}</span>` : ''}
                    </button>
                    
                    <button onclick="openChangePassword()" class="hidden lg:flex p-2.5 hover:bg-groomer-primary/10 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Settings">
                        <span class="material-symbols-outlined text-slate-600 dark:text-slate-300">settings</span>
                    </button>
                    
                    <!-- User Profile -->
                    <div class="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-3 border-l border-slate-200/50 dark:border-slate-700/50">
                        <div class="text-right hidden lg:block">
                            <p class="text-sm font-bold text-slate-900 dark:text-white">${escapeHtml(user.name || 'Groomer')}</p>
                            <p class="text-[10px] text-slate-500 uppercase tracking-wider">Head Groomer</p>
                        </div>
                        <div class="w-9 h-9 lg:h-10 lg:w-10 rounded-full border-2 border-tech-purple/30 shadow-sm bg-gradient-to-br from-tech-purple to-tech-magenta flex items-center justify-center">
                            <span class="text-white font-bold text-xs lg:text-sm">${(user.name || 'G').charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </header>
            
            <!-- Content Area - Extra padding at bottom for mobile nav -->
            <div class="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-10 space-y-4 sm:space-y-6 pb-28 lg:pb-10 safe-bottom">
                ${groomerTab === 'dashboard' ? renderGroomerDashboardContent(todayAppts, upcomingAppts, completedAppts, todayEarnings, inProgressAppt) : ''}
                ${groomerTab === 'schedule' ? renderGroomerScheduleContent(todayAppts, upcomingAppts, completedAppts) : ''}
                ${groomerTab === 'history' ? renderGroomerHistoryContent() : ''}
                ${groomerTab === 'availability' ? renderGroomerAvailabilityContent() : ''}
                ${groomerTab === 'messages' ? renderGroomerMessagesContent() : ''}
            </div>
            
            <!-- Mobile Bottom Navigation Bar -->
            <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-slate-200/50 dark:border-slate-800/50 safe-bottom">
                <div class="flex items-center justify-around h-16 px-2">
                    <button onclick="setGroomerTab('dashboard')" class="flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all touch-target ${groomerTab === 'dashboard' ? 'text-groomer-primary' : 'text-slate-400'}">
                        <span class="material-symbols-outlined text-2xl ${groomerTab === 'dashboard' ? 'fill-1' : ''}">dashboard</span>
                        <span class="text-[10px] font-bold mt-0.5">Home</span>
                    </button>
                    <button onclick="setGroomerTab('schedule')" class="flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all touch-target ${groomerTab === 'schedule' ? 'text-groomer-primary' : 'text-slate-400'}">
                        <span class="material-symbols-outlined text-2xl ${groomerTab === 'schedule' ? 'fill-1' : ''}">calendar_today</span>
                        <span class="text-[10px] font-bold mt-0.5">Schedule</span>
                    </button>
                    
                    <!-- Center FAB -->
                    <div class="relative -mt-8">
                        <button onclick="showQuickActions()" class="w-14 h-14 rounded-full bg-groomer-primary text-white flex items-center justify-center shadow-xl shadow-groomer-primary/40 active:scale-95 transition-transform">
                            <span class="material-symbols-outlined text-2xl">add</span>
                        </button>
                    </div>
                    
                    <button onclick="setGroomerTab('messages')" class="flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all touch-target relative ${groomerTab === 'messages' ? 'text-groomer-primary' : 'text-slate-400'}">
                        <span class="material-symbols-outlined text-2xl ${groomerTab === 'messages' ? 'fill-1' : ''}">chat_bubble</span>
                        <span class="text-[10px] font-bold mt-0.5">Messages</span>
                        ${unreadMessages > 0 ? `<span class="absolute top-1 right-3 w-4 h-4 bg-tech-magenta text-white text-[8px] font-bold rounded-full flex items-center justify-center">${unreadMessages}</span>` : ''}
                    </button>
                    <button onclick="openMobileMenu()" class="flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all touch-target text-slate-400">
                        <span class="material-symbols-outlined text-2xl">menu</span>
                        <span class="text-[10px] font-bold mt-0.5">More</span>
                    </button>
                </div>
            </nav>
            
            <!-- Desktop FAB -->
            <div class="hidden lg:block fixed bottom-8 right-8 z-50">
                <button onclick="showQuickActions()" class="w-14 h-14 rounded-full bg-groomer-primary text-white flex items-center justify-center shadow-2xl shadow-groomer-primary/40 hover:scale-110 transition-transform group">
                    <span class="material-symbols-outlined text-2xl">add</span>
                    <span class="absolute right-16 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Quick Actions</span>
                </button>
            </div>
        </main>
    </div>
    
    <!-- Mobile Menu Modal -->
    ${state.showMobileMenu ? `
    <div class="fixed inset-0 z-[200] lg:hidden" onclick="closeMobileMenu()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="absolute bottom-0 left-0 right-0 glass-card rounded-t-3xl p-6 pb-10 safe-bottom animate-slide-up" onclick="event.stopPropagation()">
            <div class="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-6"></div>
            <div class="space-y-2">
                <button onclick="setGroomerTab('history'); closeMobileMenu();" class="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target">
                    <span class="material-symbols-outlined text-slate-600 dark:text-slate-400">history</span>
                    <span class="font-medium text-slate-700 dark:text-slate-300">Appointment History</span>
                </button>
                <button onclick="setGroomerTab('availability'); closeMobileMenu();" class="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target">
                    <span class="material-symbols-outlined text-slate-600 dark:text-slate-400">schedule</span>
                    <span class="font-medium text-slate-700 dark:text-slate-300">My Availability</span>
                </button>
                <button onclick="openChangePassword(); closeMobileMenu();" class="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target">
                    <span class="material-symbols-outlined text-slate-600 dark:text-slate-400">settings</span>
                    <span class="font-medium text-slate-700 dark:text-slate-300">Settings</span>
                </button>
                <div class="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                <button onclick="handleSignOut()" class="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-target">
                    <span class="material-symbols-outlined text-red-500">logout</span>
                    <span class="font-medium text-red-500">Sign Out</span>
                </button>
            </div>
        </div>
    </div>
    ` : ''}
    
    <!-- Quick Actions Modal -->
    ${state.showQuickActions ? `
    <div class="fixed inset-0 z-[200]" onclick="closeQuickActions()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="absolute bottom-20 lg:bottom-24 right-4 lg:right-8 glass-card rounded-2xl p-2 shadow-2xl animate-scale-up" onclick="event.stopPropagation()">
            <div class="space-y-1">
                <button onclick="showToast('Contact admin to add appointments', 'info'); closeQuickActions();" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target">
                    <div class="w-10 h-10 rounded-full bg-groomer-primary/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-groomer-primary">event</span>
                    </div>
                    <span class="font-medium text-slate-700 dark:text-slate-300 pr-4">New Appointment</span>
                </button>
                <button onclick="window.location.href='tel:+16268636926'; closeQuickActions();" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target">
                    <div class="w-10 h-10 rounded-full bg-tech-purple/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-tech-purple">call</span>
                    </div>
                    <span class="font-medium text-slate-700 dark:text-slate-300 pr-4">Call Office</span>
                </button>
            </div>
        </div>
    </div>
    ` : ''}
    
    ${state.showNotifications ? renderNotificationsPanel() : ''}
    ${state.showAppointmentDetail && state.selectedAppointment ? renderAppointmentDetailModal(state.selectedAppointment) : ''}`;
}

// Groomer Dashboard Content
function renderGroomerDashboardContent(todayAppts, upcomingAppts, completedAppts, todayEarnings, inProgressAppt) {
    // Get all in-progress appointments (could be multiple)
    const allInProgress = (state.groomerAppointments || []).filter(a => a.status === 'in_progress');
    const pendingToday = todayAppts.filter(a => a.status !== 'in_progress');
    const today = getTodayPacific();
    
    // Calculate today's completed - use completed_at date (when actually completed), not appointment_date
    const todayCompletedAppts = completedAppts.filter(a => {
        // Check completed_at timestamp for today's date
        if (a.completed_at) {
            const completedDate = new Date(a.completed_at).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
            return completedDate === today;
        }
        // Fallback to appointment_date if no completed_at
        return a.appointment_date === today;
    });
    const todayCompletedCount = todayCompletedAppts.length;
    
    // Also get total all-time completed for reference
    const totalCompletedCount = completedAppts.length;
    
    // Calculate earnings
    const todayEarningsAmount = todayCompletedAppts.reduce((sum, a) => sum + (parseFloat(a.total_price) || 0), 0);
    const pendingEarningsAmount = [...allInProgress, ...pendingToday].reduce((sum, a) => sum + (parseFloat(a.total_price) || 0), 0);
    const dailyGoal = 500; // Default daily goal
    const earningsProgress = Math.min(Math.round((todayEarningsAmount / dailyGoal) * 100), 100);
    
    // Get next appointment - TODAY ONLY for "Next Up"
    const nextTodayAppt = pendingToday.length > 0 ? pendingToday[0] : null;
    
    // Get next future appointment (for preview)
    const nextFutureAppt = upcomingAppts.length > 0 ? upcomingAppts[0] : null;
    
    // Get groomer name from currentUser
    const groomerName = state.currentUser?.name?.split(' ')[0] || 'there';
    
    // Time-based greeting
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙';
    
    // Format today's date nicely
    const todayDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        timeZone: TIMEZONE
    });
    
    // Calculate time until next appointment
    let timeUntilNext = '';
    if (nextTodayAppt && nextTodayAppt.start_time) {
        const [hours, minutes] = nextTodayAppt.start_time.split(':');
        const aptTime = new Date();
        aptTime.setHours(parseInt(hours), parseInt(minutes), 0);
        const now = new Date();
        const diffMs = aptTime - now;
        if (diffMs > 0) {
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) {
                timeUntilNext = `Starts in ${diffMins} min`;
            } else {
                const diffHours = Math.floor(diffMins / 60);
                const remainMins = diffMins % 60;
                timeUntilNext = `Starts in ${diffHours}h ${remainMins}m`;
            }
        } else {
            timeUntilNext = 'Starting soon';
        }
    }
    
    // Calculate today's route summary
    const allTodayStops = [...allInProgress, ...pendingToday];
    const totalStops = allTodayStops.length + todayCompletedCount;
    const remainingStops = allTodayStops.length;
    // Estimate ~8 miles between stops on average for mobile grooming
    const estimatedMiles = totalStops * 8;
    const estimatedDriveTime = totalStops * 15; // ~15 min between stops
    
    // Build Google Maps multi-stop URL for today's route
    const buildRouteUrl = (appointments) => {
        if (!appointments || appointments.length === 0) return '';
        const addresses = appointments
            .filter(a => a.customerAddress)
            .map(a => encodeURIComponent(a.customerAddress));
        if (addresses.length === 0) return '';
        if (addresses.length === 1) {
            return `https://www.google.com/maps/dir/?api=1&destination=${addresses[0]}`;
        }
        const origin = addresses[0];
        const destination = addresses[addresses.length - 1];
        const waypoints = addresses.slice(1, -1).join('|');
        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? '&waypoints=' + waypoints : ''}`;
    };
    const todayRouteUrl = buildRouteUrl(allTodayStops);
    
    return `
        <!-- #1 HERO SECTION - Gradient Banner with Time-based Greeting -->
        <div class="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 bg-gradient-to-br from-groomer-primary via-teal-500 to-emerald-400 p-4 sm:p-6 lg:p-8 text-white shadow-xl shadow-groomer-primary/20">
            <!-- Background Pattern -->
            <div class="absolute inset-0 opacity-10">
                <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <pattern id="paw-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="5" cy="5" r="2" fill="currentColor"/>
                            <circle cx="10" cy="3" r="1.5" fill="currentColor"/>
                            <circle cx="14" cy="6" r="1.5" fill="currentColor"/>
                            <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
                        </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#paw-pattern)"/>
                </svg>
            </div>
            
            <div class="relative z-10">
                <!-- Top Row: Date & Weather placeholder -->
                <div class="flex items-center justify-between mb-4 text-white/80 text-sm">
                    <span class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-lg">calendar_today</span>
                        ${todayDate}
                    </span>
                    <span class="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                        ${greetingEmoji} ${timeGreeting.split(' ')[1]}
                    </span>
                </div>
                
                <!-- Main Greeting -->
                <h1 class="text-xl sm:text-2xl lg:text-4xl font-extrabold leading-tight mb-1 sm:mb-2">
                    ${timeGreeting}, ${groomerName}! 
                </h1>
                <p class="text-white/80 text-sm sm:text-base">
                    ${allInProgress.length > 0 
                        ? `You have ${allInProgress.length} pet${allInProgress.length > 1 ? 's' : ''} in progress right now! 🐕` 
                        : pendingToday.length > 0 
                            ? `${pendingToday.length} appointment${pendingToday.length > 1 ? 's' : ''} lined up for today. Let's make them beautiful! ✨`
                            : todayCompletedCount > 0
                                ? `Amazing work! You've completed ${todayCompletedCount} groom${todayCompletedCount > 1 ? 's' : ''} today! 🎉`
                                : `Ready to start your day? Check your schedule! 📅`
                    }
                </p>
            </div>
        </div>
        
        <!-- TODAY'S ROUTE SUMMARY - New Section -->
        ${totalStops > 0 ? `
        <div class="glass-card rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border-l-4 border-l-blue-500">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">route</span>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white">Today's Route</p>
                        <p class="text-xs text-slate-500">
                            ${remainingStops} stop${remainingStops !== 1 ? 's' : ''} remaining
                            ${todayCompletedCount > 0 ? ` • ${todayCompletedCount} completed` : ''}
                            • ~${estimatedMiles} mi • ~${Math.floor(estimatedDriveTime/60)}h ${estimatedDriveTime%60}m drive
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${todayRouteUrl ? `
                        <a href="${todayRouteUrl}" target="_blank" onclick="event.stopPropagation()" class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
                            <span class="material-symbols-outlined text-lg">map</span>
                            View Route
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- #2 STAT CARDS - Enhanced with Gradients & Visual Interest -->
        <div class="grid grid-cols-2 gap-2 sm:flex sm:gap-3 sm:overflow-x-auto sm:pb-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible scrollbar-hide sm:snap-x sm:snap-mandatory">
            
            <!-- In Progress Card - Purple Gradient -->
            <div onclick="document.getElementById('inprogress-section')?.scrollIntoView({behavior: 'smooth'})" class="relative overflow-hidden rounded-xl sm:rounded-2xl sm:min-w-[160px] lg:min-w-0 flex-shrink-0 sm:snap-start cursor-pointer active:scale-95 transition-all hover:shadow-lg group ${allInProgress.length > 0 ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30' : 'glass-card'}">
                ${allInProgress.length > 0 ? `
                    <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div class="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                ` : ''}
                <div class="relative p-3 sm:p-5">
                    <div class="flex items-center justify-between mb-2 sm:mb-3">
                        <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${allInProgress.length > 0 ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/30'} flex items-center justify-center">
                            <span class="material-symbols-outlined ${allInProgress.length > 0 ? 'text-white' : 'text-purple-600'} text-lg sm:text-2xl">content_cut</span>
                        </div>
                        ${allInProgress.length > 0 ? `
                            <span class="flex items-center gap-1 px-2 py-0.5 bg-white/20 text-[9px] sm:text-[10px] font-bold uppercase rounded-full">
                                <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                Live
                            </span>
                        ` : `
                            <span class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-[9px] sm:text-[10px] font-bold uppercase rounded-full">Ready</span>
                        `}
                    </div>
                    <p class="${allInProgress.length > 0 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'} text-xs sm:text-sm font-medium">In Progress</p>
                    <div class="flex items-end justify-between">
                        <p class="text-2xl sm:text-3xl lg:text-4xl font-extrabold ${allInProgress.length > 0 ? '' : 'text-slate-900 dark:text-white'}">${allInProgress.length}</p>
                        ${allInProgress.length > 0 && allInProgress[0] ? `
                            <p class="text-xs ${allInProgress.length > 0 ? 'text-white/70' : 'text-slate-400'} truncate max-w-[80px]">${allInProgress[0].petName}</p>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Next Appointment Card - Enhanced with Navigate/Call - spans 2 cols on mobile -->
            <div class="col-span-2 sm:col-span-1 relative overflow-hidden rounded-xl sm:rounded-2xl sm:min-w-[200px] lg:min-w-0 flex-shrink-0 sm:snap-start ${nextTodayAppt ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30' : 'glass-card'} transition-all hover:shadow-lg">
                ${nextTodayAppt ? `
                    <div class="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                ` : ''}
                <div class="relative p-3 sm:p-5">
                    <div class="flex items-center justify-between mb-2">
                        <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${nextTodayAppt ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-900/30'} flex items-center justify-center">
                            <span class="material-symbols-outlined ${nextTodayAppt ? 'text-white' : 'text-amber-600 dark:text-amber-400'} text-lg sm:text-2xl">schedule</span>
                        </div>
                        <span class="px-2 py-0.5 ${nextTodayAppt ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'} text-[8px] sm:text-[10px] font-bold uppercase rounded-full truncate max-w-[100px]">
                            ${nextTodayAppt ? timeUntilNext || 'Today' : 'Today'}
                        </span>
                    </div>
                    <p class="${nextTodayAppt ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'} text-xs font-medium">Next Up</p>
                    ${nextTodayAppt ? `
                        <p class="text-lg sm:text-2xl font-extrabold">${formatTime(nextTodayAppt.start_time)}</p>
                        <p class="text-xs text-white/80 font-medium truncate">${nextTodayAppt.petName} • ${nextTodayAppt.serviceName || 'Groom'}</p>
                        <!-- Quick Actions -->
                        <div class="flex gap-2 mt-2 sm:mt-3">
                            ${nextTodayAppt.customerPhone ? `
                                <a href="tel:${nextTodayAppt.customerPhone}" onclick="event.stopPropagation()" class="flex-1 flex items-center justify-center gap-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors min-h-[36px]">
                                    <span class="material-symbols-outlined text-sm">call</span>
                                    <span class="hidden sm:inline">Call</span>
                                </a>
                            ` : ''}
                            ${nextTodayAppt.customerAddress ? `
                                <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nextTodayAppt.customerAddress)}" target="_blank" onclick="event.stopPropagation()" class="flex-1 flex items-center justify-center gap-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors min-h-[36px]">
                                    <span class="material-symbols-outlined text-sm">navigation</span>
                                    <span class="hidden sm:inline">Navigate</span>
                                </a>
                            ` : ''}
                        </div>
                    ` : `
                        <p class="text-base sm:text-lg font-bold text-groomer-primary">All done! 🎉</p>
                        ${nextFutureAppt ? `
                            <p class="text-xs text-slate-400 mt-1">Next: ${formatDate(nextFutureAppt.appointment_date)}</p>
                        ` : `
                            <p class="text-xs text-slate-400 mt-1">No upcoming scheduled</p>
                        `}
                    `}
                </div>
            </div>
            
            <!-- Completed Card - Green Gradient when has completions -->
            <div onclick="document.getElementById('completed-section')?.scrollIntoView({behavior: 'smooth'})" class="relative overflow-hidden rounded-xl sm:rounded-2xl sm:min-w-[160px] lg:min-w-0 flex-shrink-0 sm:snap-start cursor-pointer active:scale-95 transition-all hover:shadow-lg ${todayCompletedCount > 0 ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30' : 'glass-card'}">
                ${todayCompletedCount > 0 ? `
                    <div class="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                ` : ''}
                <div class="relative p-3 sm:p-5">
                    <div class="flex items-center justify-between mb-2 sm:mb-3">
                        <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${todayCompletedCount > 0 ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-900/30'} flex items-center justify-center">
                            <span class="material-symbols-outlined ${todayCompletedCount > 0 ? 'text-white' : 'text-emerald-600'} text-lg sm:text-2xl">verified</span>
                        </div>
                        <span class="px-2 py-0.5 ${todayCompletedCount > 0 ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'} text-[8px] sm:text-[10px] font-bold uppercase rounded-full">
                            ${todayCompletedCount > 0 ? `$${todayEarningsAmount.toFixed(0)}` : 'Today'}
                        </span>
                    </div>
                    <p class="${todayCompletedCount > 0 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'} text-[11px] sm:text-sm font-medium">Completed</p>
                    <div class="flex items-end justify-between">
                        <p class="text-2xl sm:text-3xl lg:text-4xl font-extrabold ${todayCompletedCount > 0 ? '' : 'text-slate-900 dark:text-white'}">${todayCompletedCount}</p>
                        ${todayCompletedCount > 0 ? `
                            <p class="text-xs text-white/70">grooms today</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Mobile Tab Switcher for Columns -->
        <div class="glass-card rounded-2xl p-3 mt-4 lg:hidden">
            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 px-1">Today's Queue</p>
            <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button onclick="state.mobileTab = 'inprogress'; render();" class="px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all touch-target ${state.mobileTab === 'inprogress' || !state.mobileTab ? 'bg-tech-purple text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">
                    🔵 In Progress (${allInProgress.length})
                </button>
                <button onclick="state.mobileTab = 'upcoming'; render();" class="px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all touch-target ${state.mobileTab === 'upcoming' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">
                    🟡 Upcoming (${pendingToday.length})
                </button>
                <button onclick="state.mobileTab = 'completed'; render();" class="px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all touch-target ${state.mobileTab === 'completed' ? 'bg-groomer-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">
                    ✅ Completed (${todayCompletedCount})
                </button>
            </div>
        </div>
        
        <!-- Mobile: Single Column View -->
        <div class="lg:hidden space-y-4 mt-4">
            ${(!state.mobileTab || state.mobileTab === 'inprogress') ? `
                <!-- In Progress Section Mobile -->
                <div id="inprogress-section" class="space-y-3">
                    ${allInProgress.length > 0 ? allInProgress.map(apt => {
                        const elapsed = apt.started_at ? Math.floor((new Date() - new Date(apt.started_at)) / 60000) : 0;
                        const estimatedDuration = apt.duration_minutes || 60;
                        const progress = Math.min(Math.round((elapsed / estimatedDuration) * 100), 100);
                        const stage = elapsed < 15 ? 'Prep' : elapsed < estimatedDuration * 0.7 ? 'In Bath' : 'Finishing';
                        
                        return `
                        <div class="glass-card rounded-2xl p-4 active:scale-[0.98] transition-transform">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                                    ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-slate-400 text-2xl">pets</span>`}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between">
                                        <button onclick="event.stopPropagation(); openPetProfile('${apt.pet_id}', ${JSON.stringify({name: apt.petName, breed: apt.petBreed, weight: apt.petWeight, photo_url: apt.petPhoto, grooming_notes: apt.petNotes, owner_name: apt.customerName, owner_phone: apt.customerPhone, owner_address: apt.customerAddress}).replace(/"/g, '&quot;')})" class="font-bold text-slate-900 dark:text-white text-lg hover:text-groomer-primary transition-colors flex items-center gap-1">
                                            ${apt.petName}
                                            <span class="material-symbols-outlined text-sm text-slate-400">info</span>
                                        </button>
                                        <span class="text-tech-purple font-bold">${formatTime(apt.start_time)}</span>
                                    </div>
                                    <p class="text-sm text-slate-500">${apt.serviceName || 'Grooming'}</p>
                                </div>
                            </div>
                            
                            <!-- Progress Bar -->
                            <div class="mb-3">
                                <div class="flex items-center justify-between text-xs mb-1.5">
                                    <span class="text-tech-purple font-bold">${stage}</span>
                                    <span class="text-slate-400">${progress}%</span>
                                </div>
                                <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-gradient-to-r from-tech-purple to-tech-magenta rounded-full transition-all" style="width: ${progress}%"></div>
                                </div>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="flex gap-2">
                                <button onclick="openAppointmentDetail('${apt.id}')" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl touch-target transition-colors active:bg-slate-200">
                                    Details
                                </button>
                                <button onclick="openCompleteAppointmentModal('${apt.id}')" class="flex-1 py-3 bg-groomer-primary text-white font-bold rounded-xl touch-target transition-colors active:bg-groomer-primary/90">
                                    Complete ✓
                                </button>
                            </div>
                        </div>
                        `;
                    }).join('') : `
                        <div class="glass-card rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
                                <span class="text-5xl">🐕</span>
                            </div>
                            <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-1">Ready to Groom!</h4>
                            <p class="text-sm text-slate-500 mb-3">No pets on the table yet</p>
                            ${pendingToday.length > 0 ? `
                                <p class="text-xs text-purple-600 font-medium bg-purple-50 dark:bg-purple-900/20 rounded-lg py-2 px-3">
                                    👉 Tap "Check In" on upcoming to start
                                </p>
                            ` : `
                                <p class="text-xs text-slate-400">
                                    Your schedule is clear - enjoy the break! ☕
                                </p>
                            `}
                        </div>
                    `}
                </div>
            ` : ''}
            
            ${state.mobileTab === 'upcoming' ? `
                <!-- Upcoming Section Mobile -->
                <div class="space-y-3">
                    <!-- Today's Upcoming -->
                    ${pendingToday.length > 0 ? `
                        <p class="text-xs font-bold text-amber-600 uppercase tracking-wider px-1">Today</p>
                        ${pendingToday.map(apt => `
                        <div class="glass-card rounded-2xl p-4 active:scale-[0.98] transition-transform">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                                    ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-slate-400 text-2xl">pets</span>`}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between">
                                        <button onclick="event.stopPropagation(); openPetProfile('${apt.pet_id}', ${JSON.stringify({name: apt.petName, breed: apt.petBreed, weight: apt.petWeight, photo_url: apt.petPhoto, grooming_notes: apt.petNotes, owner_name: apt.customerName, owner_phone: apt.customerPhone, owner_address: apt.customerAddress}).replace(/"/g, '&quot;')})" class="font-bold text-slate-900 dark:text-white text-lg hover:text-groomer-primary transition-colors flex items-center gap-1">
                                            ${apt.petName}
                                            <span class="material-symbols-outlined text-sm text-slate-400">info</span>
                                        </button>
                                        <span class="text-amber-600 font-bold">${formatTime(apt.start_time)}</span>
                                    </div>
                                    <p class="text-sm text-slate-500">${apt.serviceName || 'Grooming'} • ${escapeHtml(apt.customerName)}</p>
                                </div>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="flex gap-2">
                                <button onclick="openAppointmentDetail('${apt.id}')" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl touch-target transition-colors active:bg-slate-200">
                                    Details
                                </button>
                                <button onclick="startGroomingAppointment('${apt.id}')" class="flex-1 py-3 bg-groomer-primary text-white font-bold rounded-xl touch-target transition-colors active:bg-groomer-primary/90 flex items-center justify-center gap-2">
                                    <span class="material-symbols-outlined text-lg">play_arrow</span>
                                    Check In
                                </button>
                            </div>
                        </div>
                        `).join('')}
                    ` : ''}
                    
                    <!-- Future Appointments -->
                    ${upcomingAppts.length > 0 ? `
                        <p class="text-xs font-bold text-blue-600 uppercase tracking-wider px-1 ${pendingToday.length > 0 ? 'mt-4' : ''}">Coming Up</p>
                        ${upcomingAppts.slice(0, 5).map(apt => `
                        <div onclick="openAppointmentDetail('${apt.id}')" class="glass-card rounded-2xl p-4 active:scale-[0.98] transition-transform cursor-pointer">
                            <div class="flex items-center gap-3">
                                <div class="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                                    ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-blue-400 text-2xl">pets</span>`}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between">
                                        <button onclick="event.stopPropagation(); openPetProfile('${apt.pet_id}', ${JSON.stringify({name: apt.petName, breed: apt.petBreed, weight: apt.petWeight, photo_url: apt.petPhoto, grooming_notes: apt.petNotes, owner_name: apt.customerName, owner_phone: apt.customerPhone, owner_address: apt.customerAddress}).replace(/"/g, '&quot;')})" class="font-bold text-slate-900 dark:text-white text-lg hover:text-groomer-primary transition-colors">
                                            ${apt.petName}
                                        </button>
                                        <span class="text-blue-600 font-bold text-sm">${formatDate(apt.appointment_date)}</span>
                                    </div>
                                    <p class="text-sm text-slate-500">${apt.serviceName || 'Grooming'} • ${formatTime(apt.start_time)}</p>
                                </div>
                                <span class="material-symbols-outlined text-slate-300">chevron_right</span>
                            </div>
                        </div>
                        `).join('')}
                        ${upcomingAppts.length > 5 ? `
                            <button onclick="setGroomerTab('schedule')" class="w-full py-3 glass-card rounded-xl text-sm text-slate-600 dark:text-slate-400 font-bold hover:bg-white/80 transition-colors">
                                View All ${upcomingAppts.length} Scheduled →
                            </button>
                        ` : ''}
                    ` : ''}
                    
                    ${pendingToday.length === 0 && upcomingAppts.length === 0 ? `
                        <div class="glass-card rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
                                <span class="text-5xl">📅</span>
                            </div>
                            <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-1">Schedule Clear!</h4>
                            <p class="text-sm text-slate-500 mb-3">No appointments on the books</p>
                            <p class="text-xs text-slate-400">
                                Time to relax or check your History 📋
                            </p>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            ${state.mobileTab === 'completed' ? `
                <!-- Completed Section Mobile -->
                <div id="completed-section" class="space-y-3">
                    <!-- Show today's completed first, then recent if today is empty -->
                    ${todayCompletedAppts.length > 0 ? `
                        <p class="text-xs font-bold text-groomer-primary uppercase tracking-wider px-1">Completed Today (${todayCompletedCount})</p>
                    ` : totalCompletedCount > 0 ? `
                        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Recent Completed (${totalCompletedCount} total)</p>
                    ` : ''}
                    
                    ${(todayCompletedAppts.length > 0 ? todayCompletedAppts : completedAppts.slice(0, 10)).map(apt => `
                        <div onclick="openAppointmentDetail('${apt.id}')" class="glass-card rounded-2xl p-4 active:scale-[0.98] transition-transform opacity-90">
                            <div class="flex items-center gap-3">
                                <div class="w-14 h-14 rounded-2xl bg-groomer-primary/10 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                                    ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-groomer-primary text-2xl">pets</span>`}
                                    <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-groomer-primary rounded-full flex items-center justify-center border-2 border-white">
                                        <span class="material-symbols-outlined text-white text-sm">check</span>
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between">
                                        <button onclick="event.stopPropagation(); openPetProfile('${apt.pet_id}', ${JSON.stringify({name: apt.petName, breed: apt.petBreed, weight: apt.petWeight, photo_url: apt.petPhoto, grooming_notes: apt.petNotes, owner_name: apt.customerName, owner_phone: apt.customerPhone, owner_address: apt.customerAddress}).replace(/"/g, '&quot;')})" class="font-bold text-slate-900 dark:text-white text-lg hover:text-groomer-primary transition-colors flex items-center gap-1">
                                            ${apt.petName}
                                            <span class="material-symbols-outlined text-sm text-slate-400">info</span>
                                        </button>
                                        <span class="text-slate-400 text-sm">${apt.completed_at ? new Date(apt.completed_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : formatTime(apt.start_time)}</span>
                                    </div>
                                    <p class="text-sm text-slate-500">${apt.serviceName || 'Grooming'}</p>
                                    <p class="text-xs text-groomer-primary font-medium mt-1">✓ Completed${apt.completed_at ? ' • ' + new Date(apt.completed_at).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}) : ''}</p>
                                </div>
                                <span class="material-symbols-outlined text-slate-300">chevron_right</span>
                            </div>
                        </div>
                    `).join('')}
                    
                    ${totalCompletedCount === 0 ? `
                        <div class="glass-card rounded-2xl p-8 text-center">
                            <span class="material-symbols-outlined text-5xl text-slate-300 mb-3">task_alt</span>
                            <p class="text-slate-500 font-medium">No completed appointments yet</p>
                            <p class="text-sm text-slate-400 mt-1">Complete your first groom to see it here</p>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
        
        <!-- Desktop: Three Column Kanban Layout -->
        <div class="hidden lg:grid lg:grid-cols-3 gap-6 mt-6">
            
            <!-- #5 IN PROGRESS COLUMN - Enhanced Header with colored border -->
            <div class="space-y-4">
                <div class="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border-l-4 border-purple-500">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                            <span class="material-symbols-outlined text-white text-lg">content_cut</span>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-slate-900 dark:text-white">In Progress</h3>
                            <p class="text-[10px] text-slate-500">Currently grooming</p>
                        </div>
                    </div>
                    ${allInProgress.length > 0 ? `
                        <span class="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                            <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            ${allInProgress.length} LIVE
                        </span>
                    ` : `
                        <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold rounded-full">0</span>
                    `}
                </div>
                
                <div class="space-y-3">
                    ${allInProgress.length > 0 ? allInProgress.map(apt => {
                        const elapsed = apt.started_at ? Math.floor((new Date() - new Date(apt.started_at)) / 60000) : 0;
                        const estimatedDuration = apt.duration_minutes || 60;
                        const progress = Math.min(Math.round((elapsed / estimatedDuration) * 100), 100);
                        const stage = elapsed < 15 ? 'Prep & Setup' : elapsed < estimatedDuration * 0.5 ? 'Bath & Wash' : elapsed < estimatedDuration * 0.8 ? 'Grooming' : 'Finishing Up';
                        const stageIcon = elapsed < 15 ? 'check_circle' : elapsed < estimatedDuration * 0.5 ? 'water_drop' : elapsed < estimatedDuration * 0.8 ? 'content_cut' : 'auto_awesome';
                        
                        return `
                        <!-- #6 RICHER IN-PROGRESS CARD -->
                        <div onclick="openAppointmentDetail('${apt.id}')" class="glass-card rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all border-l-4 border-purple-500 group">
                            <!-- Card Header with gradient -->
                            <div class="bg-gradient-to-r from-purple-500/5 to-transparent p-4">
                                <div class="flex items-center gap-3">
                                    <div class="relative">
                                        <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center ring-2 ring-purple-500/30">
                                            ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-slate-400 text-2xl">pets</span>`}
                                        </div>
                                        <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                            <span class="material-symbols-outlined text-white text-xs">${stageIcon}</span>
                                        </div>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center justify-between">
                                            <button onclick="event.stopPropagation(); openPetProfile('${apt.pet_id}', ${JSON.stringify({name: apt.petName, breed: apt.petBreed, weight: apt.petWeight, photo_url: apt.petPhoto, grooming_notes: apt.petNotes, owner_name: apt.customerName, owner_phone: apt.customerPhone, owner_address: apt.customerAddress}).replace(/"/g, '&quot;')})" class="font-bold text-slate-900 dark:text-white hover:text-purple-600 transition-colors text-left text-lg">${apt.petName}</button>
                                            <span class="text-xs font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">${elapsed} min</span>
                                        </div>
                                        <p class="text-xs text-slate-500">${apt.petBreed || 'Dog'} • ${apt.petWeight ? apt.petWeight + ' lbs' : ''}</p>
                                        <p class="text-xs text-slate-400 truncate">${apt.serviceName || 'Full Grooming'} • $${apt.total_price || '0'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Progress Section -->
                            <div class="px-4 pb-4">
                                <div class="flex items-center justify-between text-xs mb-2">
                                    <span class="flex items-center gap-1 text-purple-600 font-bold">
                                        <span class="material-symbols-outlined text-sm">${stageIcon}</span>
                                        ${stage}
                                    </span>
                                    <span class="text-slate-400">${progress}% complete</span>
                                </div>
                                <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                                </div>
                                
                                <button onclick="event.stopPropagation(); openCompleteAppointmentModal('${apt.id}')" class="mt-4 w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2">
                                    <span class="material-symbols-outlined text-lg">check_circle</span>
                                    Mark Complete
                                </button>
                            </div>
                        </div>
                        `;
                    }).join('') : `
                        <!-- #4 BETTER EMPTY STATE - In Progress -->
                        <div class="glass-card rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
                                <span class="text-5xl">🐕</span>
                            </div>
                            <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-1">Ready to Groom!</h4>
                            <p class="text-sm text-slate-500 mb-4">No pets on the table yet</p>
                            ${pendingToday.length > 0 ? `
                                <p class="text-xs text-purple-600 font-medium">
                                    👉 Check in your next appointment to start
                                </p>
                            ` : `
                                <p class="text-xs text-slate-400">
                                    Your schedule is clear - enjoy the break! ☕
                                </p>
                            `}
                        </div>
                    `}
                </div>
            </div>
            
            <!-- #5 UPCOMING COLUMN - Enhanced Header -->
            <div class="space-y-4">
                <div class="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                            <span class="material-symbols-outlined text-white text-lg">schedule</span>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Upcoming</h3>
                            <p class="text-[10px] text-slate-500">Scheduled appointments</p>
                        </div>
                    </div>
                    <span class="px-2.5 py-1 ${pendingToday.length > 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'} text-xs font-bold rounded-full">
                        ${pendingToday.length > 0 ? pendingToday.length + ' TODAY' : upcomingAppts.length > 0 ? upcomingAppts.length : '0'}
                    </span>
                </div>
                
                <div class="space-y-3">
                    <!-- Today's Appointments -->
                    ${pendingToday.length > 0 ? `
                        <p class="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                            <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
                            Today's Queue
                        </p>
                        ${pendingToday.slice(0, 3).map((apt, idx) => {
                            // Calculate time until appointment
                            let countdown = '';
                            if (apt.start_time) {
                                const [h, m] = apt.start_time.split(':');
                                const aptTime = new Date();
                                aptTime.setHours(parseInt(h), parseInt(m), 0);
                                const diffMs = aptTime - new Date();
                                if (diffMs > 0) {
                                    const mins = Math.floor(diffMs / 60000);
                                    countdown = mins < 60 ? mins + ' min' : Math.floor(mins/60) + 'h ' + (mins%60) + 'm';
                                }
                            }
                            return `
                        <!-- #6 RICHER UPCOMING CARD -->
                        <div onclick="openAppointmentDetail('${apt.id}')" class="glass-card rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all border-l-4 border-amber-500 group">
                            <div class="p-4">
                                <div class="flex items-center gap-3 mb-3">
                                    <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 overflow-hidden flex items-center justify-center">
                                        ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-amber-500 text-xl">pets</span>`}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center justify-between">
                                            <button onclick="event.stopPropagation(); openPetProfile('${apt.pet_id}', ${JSON.stringify({name: apt.petName, breed: apt.petBreed, weight: apt.petWeight, photo_url: apt.petPhoto, grooming_notes: apt.petNotes, owner_name: apt.customerName, owner_phone: apt.customerPhone, owner_address: apt.customerAddress}).replace(/"/g, '&quot;')})" class="font-bold text-slate-900 dark:text-white hover:text-amber-600 transition-colors text-left">${apt.petName}</button>
                                            <span class="text-sm font-bold text-amber-600">${formatTime(apt.start_time)}</span>
                                        </div>
                                        <p class="text-xs text-slate-500">${apt.serviceName || 'Grooming'} • $${apt.total_price || '0'}</p>
                                    </div>
                                </div>
                                
                                <!-- Address Preview -->
                                <div class="flex items-center gap-2 text-xs text-slate-500 mb-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                                    <span class="material-symbols-outlined text-sm text-slate-400">location_on</span>
                                    <span class="truncate">${apt.customerAddress || 'Address not provided'}</span>
                                </div>
                                
                                <!-- Countdown & Actions -->
                                <div class="flex items-center justify-between">
                                    ${countdown ? `
                                        <span class="text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full flex items-center gap-1">
                                            <span class="material-symbols-outlined text-sm">timer</span>
                                            ${countdown}
                                        </span>
                                    ` : `
                                        <span class="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                            Ready now
                                        </span>
                                    `}
                                    <button onclick="event.stopPropagation(); startGroomingAppointment('${apt.id}')" class="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                                        <span class="material-symbols-outlined text-sm">play_arrow</span>
                                        Check In
                                    </button>
                                </div>
                            </div>
                        </div>
                        `;}).join('')}
                    ` : ''}
                    
                    <!-- Future Appointments -->
                    ${upcomingAppts.length > 0 ? `
                        <p class="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1 ${pendingToday.length > 0 ? 'mt-3' : ''}">
                            <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Coming Up
                        </p>
                        ${upcomingAppts.slice(0, pendingToday.length > 0 ? 2 : 4).map(apt => `
                        <div onclick="openAppointmentDetail('${apt.id}')" class="glass-card rounded-xl p-3 cursor-pointer hover:shadow-lg transition-all border-l-4 border-blue-400 group">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 overflow-hidden flex items-center justify-center">
                                        ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-blue-400 text-lg">pets</span>`}
                                    </div>
                                    <div>
                                        <p class="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors">${apt.petName}</p>
                                        <p class="text-[10px] text-slate-500">${apt.serviceName || 'Grooming'} • $${apt.total_price || '0'}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-xs font-bold text-blue-600">${formatDate(apt.appointment_date)}</p>
                                    <p class="text-[10px] text-slate-400">${formatTime(apt.start_time)}</p>
                                </div>
                            </div>
                        </div>
                        `).join('')}
                    ` : ''}
                    
                    ${pendingToday.length === 0 && upcomingAppts.length === 0 ? `
                        <!-- #4 BETTER EMPTY STATE - Upcoming -->
                        <div class="glass-card rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
                                <span class="text-5xl">📅</span>
                            </div>
                            <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-1">Schedule Clear!</h4>
                            <p class="text-sm text-slate-500 mb-4">No appointments on the books</p>
                            <p class="text-xs text-slate-400">
                                Time to relax or check the History tab 📋
                            </p>
                        </div>
                    ` : ''}
                    
                    ${(pendingToday.length > 3 || upcomingAppts.length > 4) ? `
                        <button onclick="setGroomerTab('schedule')" class="w-full py-2.5 glass-card rounded-xl text-sm text-amber-600 font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-1">
                            View Full Schedule
                            <span class="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- #5 COMPLETED COLUMN - Enhanced Header -->
            <div class="space-y-4">
                <div class="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border-l-4 border-emerald-500">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                            <span class="material-symbols-outlined text-white text-lg">verified</span>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Completed</h3>
                            <p class="text-[10px] text-slate-500">Finished grooms</p>
                        </div>
                    </div>
                    <span class="px-2.5 py-1 ${todayCompletedCount > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'} text-xs font-bold rounded-full">
                        ${todayCompletedCount > 0 ? '$' + todayEarningsAmount.toFixed(0) : totalCompletedCount}
                    </span>
                </div>
                
                <div class="space-y-3">
                    ${todayCompletedAppts.length > 0 ? `
                        <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            Today's Grooms (${todayCompletedCount})
                        </p>
                    ` : totalCompletedCount > 0 ? `
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <span class="w-2 h-2 bg-slate-400 rounded-full"></span>
                            Recent
                        </p>
                    ` : ''}
                    
                    ${(todayCompletedAppts.length > 0 ? todayCompletedAppts.slice(0, 5) : completedAppts.slice(0, 5)).map(apt => {
                        return `
                        <!-- #6 RICHER COMPLETED CARD -->
                        <div onclick="openAppointmentDetail('${apt.id}')" class="glass-card rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all border-l-4 border-emerald-500 group">
                            <div class="p-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="relative">
                                            <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 overflow-hidden flex items-center justify-center">
                                                ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-emerald-500 text-xl">pets</span>`}
                                            </div>
                                            <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                                <span class="material-symbols-outlined text-white text-xs">check</span>
                                            </div>
                                        </div>
                                        <div>
                                            <button onclick="event.stopPropagation(); openPetProfile('${apt.pet_id}', ${JSON.stringify({name: apt.petName, breed: apt.petBreed, weight: apt.petWeight, photo_url: apt.petPhoto, grooming_notes: apt.petNotes, owner_name: apt.customerName, owner_phone: apt.customerPhone, owner_address: apt.customerAddress}).replace(/"/g, '&quot;')})" class="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors text-left">${apt.petName}</button>
                                            <p class="text-xs text-slate-500">${apt.serviceName || 'Grooming'}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm font-bold text-emerald-600">$${apt.total_price || '0'}</p>
                                        <p class="text-[10px] text-slate-400">${apt.completed_at ? new Date(apt.completed_at).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}) : ''}</p>
                                    </div>
                                </div>
                                <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span class="text-xs font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <span class="material-symbols-outlined text-xs">check_circle</span>
                                        Complete
                                    </span>
                                    <span class="text-xs text-slate-400">${apt.completed_at ? new Date(apt.completed_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : formatDate(apt.appointment_date)}</span>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                    
                    ${totalCompletedCount === 0 ? `
                        <!-- #4 BETTER EMPTY STATE - Completed -->
                        <div class="glass-card rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center">
                                <span class="text-5xl">🏆</span>
                            </div>
                            <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-1">Your Trophy Case</h4>
                            <p class="text-sm text-slate-500 mb-4">Completed grooms will appear here</p>
                            <p class="text-xs text-slate-400">
                                Start grooming to build your record! 💪
                            </p>
                        </div>
                    ` : ''}
                    
                    ${totalCompletedCount > 5 ? `
                        <button onclick="setGroomerTab('history')" class="w-full py-2.5 glass-card rounded-xl text-sm text-emerald-600 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-center gap-1">
                            View All ${totalCompletedCount} Completed
                            <span class="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// New Groomer Appointment Card (prettier version)
function renderGroomerAppointmentCardNew(apt, isUpcoming = false, isCompleted = false, isCurrentStop = false) {
    const statusColors = {
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
        in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
        completed: 'bg-green-100 text-green-700 border-green-200',
        cancelled: 'bg-red-100 text-red-700 border-red-200'
    };
    
    const fullAddress = apt.service_address || apt.customerAddress || '';
    const city = apt.service_city || apt.customerCity || '';
    const displayAddress = fullAddress ? (fullAddress + (city ? ', ' + city : '')) : 'Address not provided';
    const mapsUrl = fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}` : '';
    const phoneClean = (apt.customerPhone || '').replace(/[^0-9+]/g, '');
    
    // Combine notes: pet grooming notes + customer appointment notes
    const petNotes = apt.petNotes || apt.pet?.grooming_notes || '';
    const customerNotes = apt.customer_notes || apt.notes || '';
    const hasNotes = petNotes || customerNotes;
    
    // Calculate elapsed time if in progress
    let elapsedTime = '';
    if (apt.status === 'in_progress' && apt.started_at) {
        const started = new Date(apt.started_at);
        const now = new Date();
        const mins = Math.floor((now - started) / 60000);
        elapsedTime = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`;
    }
    
    if (apt.status === 'in_progress') {
        // Current in-progress appointment - special highlighted card
        return `
        <div class="glass-card border-l-4 border-l-tech-purple rounded-2xl p-5 soft-lift">
            <!-- Header: Pet info + Time -->
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="h-14 w-14 rounded-2xl bg-tech-purple/10 overflow-hidden ring-4 ring-tech-purple/20 flex items-center justify-center flex-shrink-0">
                        ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-2xl text-tech-purple">pets</span>`}
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h4 class="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">${apt.petName}</h4>
                            <span class="px-2 py-0.5 bg-tech-purple text-white text-[10px] font-black uppercase rounded flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                In Progress
                            </span>
                        </div>
                        <p class="text-sm text-slate-500 font-semibold">${apt.petBreed || 'Pet'} • ${apt.serviceName}</p>
                    </div>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-lg font-extrabold text-tech-purple leading-tight">${formatTime(apt.start_time)}</p>
                    <p class="text-xs text-tech-magenta font-bold uppercase tracking-tighter">${elapsedTime} elapsed</p>
                </div>
            </div>
            
            <!-- Notes Section (Pet + Customer) -->
            ${hasNotes ? `
            <div class="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                <div class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-amber-600 text-lg flex-shrink-0">warning</span>
                    <div class="text-sm">
                        ${petNotes ? `<p class="text-amber-800 dark:text-amber-200"><span class="font-bold">Pet:</span> ${petNotes}</p>` : ''}
                        ${customerNotes ? `<p class="text-amber-700 dark:text-amber-300 ${petNotes ? 'mt-1' : ''}"><span class="font-bold">Note:</span> ${customerNotes}</p>` : ''}
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Address with Navigate -->
            <div class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800 mb-3">
                <span class="material-symbols-outlined text-tech-purple flex-shrink-0">location_on</span>
                <span class="font-medium flex-1 truncate">${displayAddress}</span>
                ${mapsUrl ? `<a href="${mapsUrl}" target="_blank" class="flex-shrink-0 px-3 py-1.5 bg-groomer-primary text-white text-xs font-bold uppercase rounded-lg hover:opacity-90 transition-colors touch-target">Navigate</a>` : ''}
            </div>
            
            <!-- Customer Contact -->
            <div class="flex items-center gap-2 text-sm mb-4">
                <span class="material-symbols-outlined text-slate-400 text-lg">person</span>
                <span class="font-medium dark:text-white flex-1 truncate">${escapeHtml(apt.customerName)}</span>
                ${phoneClean ? `
                    <a href="tel:${phoneClean}" class="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors touch-target" title="Call">
                        <span class="material-symbols-outlined text-lg">call</span>
                    </a>
                    <a href="sms:${phoneClean}" class="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors touch-target" title="Text">
                        <span class="material-symbols-outlined text-lg">sms</span>
                    </a>
                ` : ''}
            </div>
            
            <!-- Complete Button -->
            <button onclick="openCompleteAppointmentModal('${apt.id}')" class="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/30 touch-target">
                <span class="material-symbols-outlined">check_circle</span>
                Complete Appointment
            </button>
        </div>`;
    }
    
    // Regular appointment card (confirmed, pending, or completed)
    return `
    <div class="glass-card ${isCurrentStop ? 'border-l-4 border-l-groomer-primary' : ''} rounded-2xl p-5 soft-lift ${isCompleted ? 'opacity-60' : ''}">
        <!-- Header: Pet info + Time -->
        <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
                <div class="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 ${isCurrentStop ? 'ring-2 ring-groomer-primary/30' : ''}">
                    ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-xl text-slate-400">pets</span>`}
                </div>
                <div class="min-w-0">
                    <h4 class="text-base font-bold text-slate-900 dark:text-white truncate">${apt.petName}</h4>
                    <p class="text-sm text-slate-500 font-medium truncate">${apt.petBreed || 'Pet'} • ${apt.serviceName}</p>
                </div>
            </div>
            <div class="text-right flex-shrink-0">
                <p class="text-base font-bold text-slate-700 dark:text-slate-300">${formatTime(apt.start_time)}</p>
                ${isCurrentStop ? `<span class="inline-block px-2 py-0.5 bg-groomer-primary/10 text-groomer-primary text-[10px] font-bold uppercase rounded">Up Next</span>` : ''}
                ${isUpcoming ? `<p class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">${formatDate(apt.appointment_date)}</p>` : ''}
                ${!isCurrentStop && !isUpcoming ? `<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[apt.status] || 'bg-slate-100 text-slate-600'}">${apt.status}</span>` : ''}
            </div>
        </div>
        
        ${!isCompleted ? `
        <!-- Notes Section (shown prominently if present) -->
        ${hasNotes ? `
        <div class="mb-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <div class="flex items-start gap-2">
                <span class="material-symbols-outlined text-amber-600 text-base flex-shrink-0">warning</span>
                <div class="text-xs">
                    ${petNotes ? `<p class="text-amber-800 dark:text-amber-200"><span class="font-bold">Pet:</span> ${petNotes}</p>` : ''}
                    ${customerNotes ? `<p class="text-amber-700 dark:text-amber-300 ${petNotes ? 'mt-0.5' : ''}"><span class="font-bold">Note:</span> ${customerNotes}</p>` : ''}
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Address Row -->
        <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
            <span class="material-symbols-outlined text-base text-slate-400 flex-shrink-0">location_on</span>
            <span class="flex-1 truncate">${displayAddress}</span>
        </div>
        
        <!-- Customer + Quick Actions Row -->
        <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-200/50 dark:border-slate-800">
            <div class="flex items-center gap-2 min-w-0">
                <span class="material-symbols-outlined text-slate-400 text-base">person</span>
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">${escapeHtml(apt.customerName)}</span>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
                ${mapsUrl ? `
                <a href="${mapsUrl}" target="_blank" class="p-2 bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-groomer-primary/10 hover:text-groomer-primary dark:hover:bg-groomer-primary/20 dark:hover:text-groomer-primary transition-colors touch-target" title="Navigate">
                    <span class="material-symbols-outlined text-lg">directions</span>
                </a>
                ` : ''}
                ${phoneClean ? `
                <a href="tel:${phoneClean}" class="p-2 bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-groomer-primary/10 hover:text-groomer-primary dark:hover:bg-groomer-primary/20 dark:hover:text-groomer-primary transition-colors touch-target" title="Call">
                    <span class="material-symbols-outlined text-lg">call</span>
                </a>
                <a href="sms:${phoneClean}" class="p-2 bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-tech-purple/10 hover:text-tech-purple dark:hover:bg-tech-purple/20 dark:hover:text-tech-purple transition-colors touch-target" title="Text">
                    <span class="material-symbols-outlined text-lg">sms</span>
                </a>
                ` : ''}
            </div>
        </div>
        
        <!-- Action Buttons -->
        ${(apt.status === 'confirmed' || apt.status === 'pending') ? `
        <div class="mt-3 flex gap-2">
            <button onclick="openAppointmentDetail('${apt.id}')" class="flex-1 py-2.5 bg-white/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors touch-target border border-slate-200/50 dark:border-slate-700">
                <span class="material-symbols-outlined text-lg">visibility</span>
                Details
            </button>
            <button onclick="startGroomingAppointment('${apt.id}')" class="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md touch-target">
                <span class="material-symbols-outlined text-lg">play_arrow</span>
                Start
            </button>
        </div>
        ` : ''}
        ` : ''}
        
        ${apt.status === 'completed' && apt.groomer_notes ? `
            <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <p class="text-xs text-slate-500 font-medium mb-1">Groomer Notes:</p>
                <p class="text-sm text-slate-600 dark:text-slate-400">${apt.groomer_notes}</p>
            </div>
        ` : ''}
    </div>`; 
}

// Groomer Schedule Content (full schedule view)
function renderGroomerScheduleContent(todayAppts, upcomingAppts, completedAppts) {
    // Initialize calendar start date if not set
    if (!state.calendarStartDate) {
        state.calendarStartDate = getWeekStart(getTodayPacific());
    }
    
    const today = getTodayPacific();
    const viewMode = state.scheduleViewMode || 'monthly';
    
    // Get ALL in-progress appointments (across all days)
    const allInProgress = (state.groomerAppointments || []).filter(a => a.status === 'in_progress');
    
    return `
    <div class="space-y-6">
        <!-- COMPACT IN PROGRESS BANNER -->
        ${allInProgress.length > 0 ? `
        <div class="glass-card rounded-xl p-3 border-l-4 border-l-tech-purple">
            <div class="flex items-center justify-between gap-4 flex-wrap">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-tech-purple animate-pulse"></div>
                    <span class="text-xs font-bold text-tech-purple uppercase tracking-wide">In Progress (${allInProgress.length})</span>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                    ${allInProgress.map(apt => `
                    <div class="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg pl-1 pr-2 py-1 border border-tech-purple/20">
                        <div class="w-7 h-7 rounded-lg bg-tech-purple/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                            ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-tech-purple text-sm">pets</span>`}
                        </div>
                        <span class="text-sm font-semibold text-slate-900 dark:text-white">${apt.petName}</span>
                        <button onclick="openCompleteAppointmentModal('${apt.id}')" class="px-2 py-0.5 bg-groomer-primary hover:bg-groomer-primary/90 text-white text-xs font-bold rounded transition-colors">
                            Done
                        </button>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- View Toggle Header -->
        <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white">My Schedule</h2>
            <div class="flex items-center gap-1 p-1 glass-card rounded-xl">
                <button onclick="setScheduleViewMode('today')" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'today' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}">
                    Today
                </button>
                <button onclick="setScheduleViewMode('weekly')" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'weekly' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}">
                    Weekly
                </button>
                <button onclick="setScheduleViewMode('monthly')" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}">
                    Monthly
                </button>
            </div>
        </div>
        
        <!-- View Content -->
        ${viewMode === 'today' ? renderTodayView(todayAppts, today) : ''}
        ${viewMode === 'weekly' ? renderWeeklyView(today) : ''}
        ${viewMode === 'monthly' ? renderMonthlyView(today) : ''}
    </div>
    
    <!-- Appointment Detail Modal -->
    ${state.showAppointmentDetail && state.selectedAppointment ? renderAppointmentDetailModal(state.selectedAppointment) : ''}
    `;
}

// =============================================
// HISTORY TAB - All Appointments View
// =============================================
function renderGroomerHistoryContent() {
    const allAppts = state.groomerAppointments || [];
    const filter = state.historyFilter || 'all';
    const search = (state.historySearch || '').toLowerCase();
    const dateRange = state.historyDateRange || 'all';
    const viewMode = state.historyViewMode || 'list'; // 'list' or 'gallery'
    
    // Calculate date range
    const today = new Date();
    let startDate = null;
    if (dateRange === 'week') {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === 'month') {
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // Filter appointments
    let filteredAppts = allAppts.filter(apt => {
        // Status filter
        if (filter === 'completed' && apt.status !== 'completed') return false;
        if (filter === 'cancelled' && apt.status !== 'cancelled') return false;
        if (filter === 'upcoming' && !['pending', 'confirmed'].includes(apt.status)) return false;
        
        // Date range filter
        if (startDate) {
            const aptDate = new Date(apt.appointment_date);
            if (aptDate < startDate) return false;
        }
        
        // Search filter
        if (search) {
            const searchable = [
                apt.petName,
                apt.customerName,
                apt.serviceName,
                apt.customerAddress
            ].filter(Boolean).join(' ').toLowerCase();
            if (!searchable.includes(search)) return false;
        }
        
        return true;
    });
    
    // Sort by date (newest first)
    filteredAppts.sort((a, b) => {
        const dateCompare = (b.appointment_date || '').localeCompare(a.appointment_date || '');
        if (dateCompare !== 0) return dateCompare;
        return (b.start_time || '').localeCompare(a.start_time || '');
    });
    
    // Stats
    const completedAppts = allAppts.filter(a => a.status === 'completed');
    const stats = {
        total: allAppts.length,
        completed: completedAppts.length,
        cancelled: allAppts.filter(a => a.status === 'cancelled').length,
        upcoming: allAppts.filter(a => ['pending', 'confirmed'].includes(a.status)).length,
        revenue: completedAppts.reduce((sum, a) => sum + (parseFloat(a.total_price) || 0), 0)
    };
    
    // Calculate weekly earnings for chart (last 4 weeks)
    const weeklyEarnings = [];
    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekRevenue = completedAppts
            .filter(a => {
                const d = new Date(a.appointment_date);
                return d >= weekStart && d <= weekEnd;
            })
            .reduce((sum, a) => sum + (parseFloat(a.total_price) || 0), 0);
        
        weeklyEarnings.push({
            label: 'Week ' + (4 - i),
            value: weekRevenue
        });
    }
    const maxEarning = Math.max(...weeklyEarnings.map(w => w.value), 1);
    
    // Count repeat customers
    const customerCounts = {};
    completedAppts.forEach(a => {
        const key = a.customer_id || a.customerName;
        customerCounts[key] = (customerCounts[key] || 0) + 1;
    });
    
    return `
    <div class="space-y-6">
        <!-- Header with View Toggle -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Appointment History</h2>
            <div class="flex items-center gap-2">
                <button onclick="exportGroomerHistory()" class="flex items-center gap-1 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold transition-colors">
                    <span class="material-symbols-outlined text-lg">download</span>
                    Export CSV
                </button>
                <div class="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button onclick="setHistoryViewMode('list')" class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        <span class="material-symbols-outlined text-lg">list</span>
                        List
                    </button>
                    <button onclick="setHistoryViewMode('gallery')" class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'gallery' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        <span class="material-symbols-outlined text-lg">grid_view</span>
                        Gallery
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Stats Cards + Earnings Chart -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Stats -->
            <div class="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="glass-card rounded-xl p-4 text-center">
                    <p class="text-3xl font-bold text-slate-900 dark:text-white">${stats.total}</p>
                    <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Total</p>
                </div>
                <div class="glass-card rounded-xl p-4 text-center">
                    <p class="text-3xl font-bold text-groomer-primary">${stats.completed}</p>
                    <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Completed</p>
                </div>
                <div class="glass-card rounded-xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-500">${stats.upcoming}</p>
                    <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Upcoming</p>
                </div>
                <div class="glass-card rounded-xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-500">$${stats.revenue.toFixed(0)}</p>
                    <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Revenue</p>
                </div>
            </div>
            
            <!-- Mini Earnings Chart -->
            <div class="glass-card rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">Weekly Earnings</h4>
                    <span class="text-xs text-slate-400">Last 4 weeks</span>
                </div>
                <div class="flex items-end justify-between gap-2 h-20">
                    ${weeklyEarnings.map(w => `
                    <div class="flex-1 flex flex-col items-center gap-1">
                        <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative" style="height: ${Math.max((w.value / maxEarning) * 100, 5)}%">
                            <div class="absolute inset-0 bg-gradient-to-t from-groomer-primary to-emerald-400 rounded-t-lg"></div>
                        </div>
                        <span class="text-[10px] text-slate-400">${w.label}</span>
                        <span class="text-xs font-bold text-slate-600 dark:text-slate-300">$${w.value.toFixed(0)}</span>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Filters -->
        <div class="glass-card rounded-xl p-4">
            <div class="flex flex-col lg:flex-row gap-4">
                <!-- Search -->
                <div class="flex-1">
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input type="text" placeholder="Search by pet, customer, service..." 
                            value="${state.historySearch || ''}"
                            onkeyup="updateHistorySearch(this.value)"
                            class="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-groomer-primary text-sm"/>
                    </div>
                </div>
                
                <!-- Status Filter -->
                <div class="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button onclick="setHistoryFilter('all')" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        All
                    </button>
                    <button onclick="setHistoryFilter('completed')" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'completed' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        Completed
                    </button>
                    <button onclick="setHistoryFilter('upcoming')" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'upcoming' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        Upcoming
                    </button>
                    <button onclick="setHistoryFilter('cancelled')" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'cancelled' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        Cancelled
                    </button>
                </div>
                
                <!-- Date Range -->
                <div class="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button onclick="setHistoryDateRange('all')" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${dateRange === 'all' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        All Time
                    </button>
                    <button onclick="setHistoryDateRange('month')" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${dateRange === 'month' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        Month
                    </button>
                    <button onclick="setHistoryDateRange('week')" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${dateRange === 'week' ? 'bg-white dark:bg-slate-700 text-groomer-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        Week
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Results Count -->
        <p class="text-sm text-slate-500">
            Showing ${filteredAppts.length} appointment${filteredAppts.length !== 1 ? 's' : ''}
            ${search ? ' matching "' + escapeHtml(search) + '"' : ''}
        </p>
        
        <!-- Content based on view mode -->
        ${viewMode === 'gallery' ? `
            <!-- PHOTO GALLERY VIEW -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                ${filteredAppts.filter(a => a.petPhoto).length > 0 ? 
                    filteredAppts.filter(a => a.petPhoto).map(apt => {
                        const visitCount = customerCounts[apt.customer_id || apt.customerName] || 1;
                        return `
                        <div onclick="openAppointmentDetail('${apt.id}')" class="group cursor-pointer">
                            <div class="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                                <img src="${apt.petPhoto}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                                <div class="absolute bottom-0 left-0 right-0 p-3">
                                    <p class="font-bold text-white text-sm">${escapeHtml(apt.petName)}</p>
                                    <p class="text-white/70 text-xs">${formatDate(apt.appointment_date)}</p>
                                </div>
                                ${visitCount > 1 ? `
                                <div class="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">refresh</span>
                                    ${visitCount}x
                                </div>
                                ` : ''}
                                ${apt.status === 'completed' ? `
                                <div class="absolute top-2 left-2 w-6 h-6 bg-groomer-primary rounded-full flex items-center justify-center">
                                    <span class="material-symbols-outlined text-white text-sm">check</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        `;
                    }).join('') : `
                    <div class="col-span-full glass-card rounded-xl p-8 text-center">
                        <span class="material-symbols-outlined text-5xl text-slate-300 mb-3">photo_library</span>
                        <p class="text-slate-500 font-medium">No photos available</p>
                        <p class="text-sm text-slate-400 mt-1">Pet photos will appear here</p>
                    </div>
                `}
            </div>
        ` : `
            <!-- LIST VIEW -->
            <div class="space-y-3">
                ${filteredAppts.length > 0 ? filteredAppts.map(apt => {
                    const visitCount = customerCounts[apt.customer_id || apt.customerName] || 1;
                    return renderHistoryAppointmentCard(apt, visitCount);
                }).join('') : `
                    <div class="glass-card rounded-xl p-8 text-center">
                        <span class="material-symbols-outlined text-5xl text-slate-300 mb-3">search_off</span>
                        <p class="text-slate-500 font-medium">No appointments found</p>
                        <p class="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
                    </div>
                `}
            </div>
        `}
    </div>
    
    ${state.showAppointmentDetail && state.selectedAppointment ? renderAppointmentDetailModal(state.selectedAppointment) : ''}
    `;
}

// History view mode toggle
function setHistoryViewMode(mode) {
    state.historyViewMode = mode;
    render();
}

// History appointment card
function renderHistoryAppointmentCard(apt) {
    const statusConfig = {
        pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-l-amber-500', icon: 'schedule' },
        confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-l-blue-500', icon: 'event_available' },
        in_progress: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-l-purple-500', icon: 'content_cut' },
        completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-l-green-500', icon: 'check_circle' },
        cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-l-red-500', icon: 'cancel' }
    };
    const config = statusConfig[apt.status] || statusConfig.pending;
    
    const petProfileData = JSON.stringify({
        name: apt.petName, breed: apt.petBreed, weight: apt.petWeight,
        photo_url: apt.petPhoto, grooming_notes: apt.petNotes,
        owner_name: apt.customerName, owner_phone: apt.customerPhone,
        owner_address: apt.customerAddress
    }).replace(/"/g, '&quot;');
    
    return `
    <div onclick="openAppointmentDetail('${apt.id}')" class="glass-card rounded-xl overflow-hidden border-l-4 ${config.border} cursor-pointer hover:shadow-lg transition-all">
        <div class="p-4">
            <div class="flex items-center gap-4">
                <!-- Pet Photo -->
                <div class="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                    ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-2xl text-slate-400">pets</span>`}
                </div>
                
                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <button onclick="event.stopPropagation(); openPetProfile('${apt.pet_id}', ${petProfileData})" class="font-bold text-slate-900 dark:text-white hover:text-groomer-primary transition-colors truncate">
                            ${apt.petName}
                        </button>
                        <span class="px-2 py-0.5 ${config.bg} ${config.text} text-xs font-bold rounded-full flex items-center gap-1 flex-shrink-0">
                            <span class="material-symbols-outlined text-xs">${config.icon}</span>
                            ${apt.status}
                        </span>
                    </div>
                    <p class="text-sm text-slate-500 truncate">${apt.serviceName || 'Grooming'} • ${escapeHtml(apt.customerName)}</p>
                    <p class="text-xs text-slate-400 mt-1">${apt.customerAddress || 'No address'}</p>
                </div>
                
                <!-- Date & Price -->
                <div class="text-right flex-shrink-0">
                    <p class="font-bold text-slate-700 dark:text-slate-300">${formatDate(apt.appointment_date)}</p>
                    <p class="text-sm text-slate-500">${formatTime(apt.start_time)}</p>
                    <p class="text-sm font-bold text-groomer-primary mt-1">$${apt.total_price || '0'}</p>
                </div>
            </div>
        </div>
    </div>
    `;
}

// History filter functions
function setHistoryFilter(filter) {
    state.historyFilter = filter;
    render();
}

function setHistoryDateRange(range) {
    state.historyDateRange = range;
    render();
}

function updateHistorySearch(value) {
    state.historySearch = value;
    // Debounce render
    clearTimeout(window.historySearchTimeout);
    window.historySearchTimeout = setTimeout(() => render(), 300);
}

// Export groomer history to CSV
function exportGroomerHistory() {
    const allAppts = state.groomerAppointments || [];
    if (allAppts.length === 0) {
        showToast('No appointments to export', 'error');
        return;
    }
    
    // CSV headers
    const headers = ['Date', 'Time', 'Pet Name', 'Breed', 'Customer', 'Phone', 'Address', 'Service', 'Price', 'Status', 'Completed At'];
    
    // Build CSV rows
    const rows = allAppts.map(apt => [
        apt.appointment_date || '',
        apt.start_time || '',
        apt.petName || '',
        apt.petBreed || '',
        apt.customerName || '',
        apt.customerPhone || '',
        '"' + (apt.customerAddress || '').replace(/"/g, '""') + '"',
        apt.serviceName || '',
        apt.total_price || '0',
        apt.status || '',
        apt.completed_at ? new Date(apt.completed_at).toLocaleString() : ''
    ]);
    
    // Sort by date descending
    rows.sort((a, b) => b[0].localeCompare(a[0]));
    
    // Build CSV content
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'grooming_history_' + new Date().toISOString().slice(0,10) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('History exported successfully!', 'success');
}

// Set schedule view mode
function setScheduleViewMode(mode) {
    state.scheduleViewMode = mode;
    render();
}

// TODAY VIEW - Full list of today's appointments
function renderTodayView(todayAppts, today) {
    const allTodayAppts = (state.groomerAppointments || [])
        .filter(a => a.appointment_date === today)
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    
    const pendingAppts = allTodayAppts.filter(a => a.status === 'pending' || a.status === 'confirmed');
    const inProgressAppts = allTodayAppts.filter(a => a.status === 'in_progress');
    const completedAppts = allTodayAppts.filter(a => a.status === 'completed');
    
    const dateObj = new Date(today + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
    // Route calculations
    const remainingStops = [...inProgressAppts, ...pendingAppts];
    const totalStops = allTodayAppts.length;
    const estimatedMiles = totalStops * 8; // ~8 mi avg between stops
    const estimatedDriveMinutes = totalStops * 15; // ~15 min avg between stops
    
    // Build Google Maps route URL
    const buildRouteUrl = (appointments) => {
        if (!appointments || appointments.length === 0) return '';
        const addresses = appointments
            .filter(a => a.customerAddress)
            .map(a => encodeURIComponent(a.customerAddress));
        if (addresses.length === 0) return '';
        if (addresses.length === 1) {
            return 'https://www.google.com/maps/dir/?api=1&destination=' + addresses[0];
        }
        const origin = addresses[0];
        const destination = addresses[addresses.length - 1];
        const waypoints = addresses.slice(1, -1).join('|');
        return 'https://www.google.com/maps/dir/?api=1&origin=' + origin + '&destination=' + destination + (waypoints ? '&waypoints=' + waypoints : '');
    };
    const routeUrl = buildRouteUrl(remainingStops);
    
    // Render appointments with drive times
    const renderApptsWithDriveTimes = (appts, isCompleted = false) => {
        return appts.map((apt, idx) => {
            const card = renderScheduleAppointmentCard(apt, isCompleted);
            // Add drive time indicator between appointments (not after the last one)
            if (idx < appts.length - 1) {
                return card + `
                <div class="flex items-center gap-2 py-2 px-4">
                    <div class="flex-1 border-t border-dashed border-slate-300 dark:border-slate-600"></div>
                    <span class="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                        <span class="material-symbols-outlined text-sm">directions_car</span>
                        ~15 min drive
                    </span>
                    <div class="flex-1 border-t border-dashed border-slate-300 dark:border-slate-600"></div>
                </div>
                `;
            }
            return card;
        }).join('');
    };
    
    return `
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">${formattedDate}</h3>
                <p class="text-sm text-slate-500">${allTodayAppts.length} appointment${allTodayAppts.length !== 1 ? 's' : ''} scheduled</p>
            </div>
        </div>
        
        <!-- ROUTE SUMMARY CARD -->
        ${totalStops > 0 ? `
        <div class="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-5 text-white shadow-lg">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined text-2xl">route</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-lg">Today's Route</h4>
                        <p class="text-white/80 text-sm">
                            ${totalStops} stop${totalStops !== 1 ? 's' : ''} • ~${estimatedMiles} miles • ~${Math.floor(estimatedDriveMinutes/60)}h ${estimatedDriveMinutes%60}m driving
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${remainingStops.length > 0 ? `
                    <span class="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                        ${remainingStops.length} remaining
                    </span>
                    ` : `
                    <span class="px-3 py-1 bg-white/20 rounded-full text-sm font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">check_circle</span>
                        All done!
                    </span>
                    `}
                    ${routeUrl ? `
                    <a href="${routeUrl}" target="_blank" class="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
                        <span class="material-symbols-outlined">map</span>
                        View Map
                    </a>
                    ` : ''}
                </div>
            </div>
        </div>
        ` : ''}
        
        ${allTodayAppts.length === 0 ? `
            <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">event_available</span>
                <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No Appointments Today</h3>
                <p class="text-slate-500 dark:text-slate-400">Enjoy your day off!</p>
            </div>
        ` : `
            <!-- In Progress - Compact Header -->
            ${inProgressAppts.length > 0 ? `
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-tech-purple uppercase tracking-wider flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-tech-purple animate-pulse"></span>
                        In Progress (${inProgressAppts.length})
                    </h4>
                    <div class="space-y-0">
                        ${renderApptsWithDriveTimes(inProgressAppts)}
                    </div>
                </div>
                
                <!-- Drive time separator between in-progress and upcoming -->
                ${pendingAppts.length > 0 ? `
                <div class="flex items-center gap-2 py-2 px-4">
                    <div class="flex-1 border-t-2 border-dashed border-amber-300 dark:border-amber-600"></div>
                    <span class="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full font-bold">
                        <span class="material-symbols-outlined text-sm">directions_car</span>
                        Next stop ~15 min away
                    </span>
                    <div class="flex-1 border-t-2 border-dashed border-amber-300 dark:border-amber-600"></div>
                </div>
                ` : ''}
            ` : ''}
            
            <!-- Upcoming Today -->
            ${pendingAppts.length > 0 ? `
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Upcoming (${pendingAppts.length})
                    </h4>
                    <div class="space-y-0">
                        ${renderApptsWithDriveTimes(pendingAppts)}
                    </div>
                </div>
            ` : ''}
            
            <!-- Completed Today -->
            ${completedAppts.length > 0 ? `
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-groomer-primary uppercase tracking-wider flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">check_circle</span>
                        Completed (${completedAppts.length})
                    </h4>
                    <div class="space-y-3 opacity-60">
                        ${completedAppts.map(apt => renderScheduleAppointmentCard(apt, true)).join('')}
                    </div>
                </div>
            ` : ''}
        `}
    </div>
    `;
}

// WEEKLY VIEW - Calendar week grid
function renderWeeklyView(today) {
    const weekDates = getWeekDatesFromStart(state.calendarStartDate);
    const appointmentCounts = getAppointmentCountsByDate();
    const weekLabel = getWeekRangeLabel(state.calendarStartDate);
    
    return `
    <div class="space-y-4">
        <!-- Calendar Header -->
        <div class="flex items-center justify-between">
            <h3 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">${weekLabel}</h3>
            <div class="flex items-center gap-1 sm:gap-2">
                <button onclick="goToPreviousWeek()" class="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors touch-target">
                    <span class="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button onclick="goToCalendarToday()" class="px-3 py-2 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Today
                </button>
                <button onclick="goToNextWeek()" class="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors touch-target">
                    <span class="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>
        </div>
        
        <!-- Week Grid - Full Width -->
        <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <!-- Day Headers -->
            <div class="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => `
                    <div class="py-2 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span class="sm:hidden">${d}</span>
                        <span class="hidden sm:inline">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                    </div>
                `).join('')}
            </div>
            
            <!-- Week Days - Larger cells for week view -->
            <div class="grid grid-cols-7">
                ${weekDates.map(dateStr => {
                    const dateObj = new Date(dateStr + 'T12:00:00');
                    const dayNum = dateObj.getDate();
                    const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
                    const count = appointmentCounts[dateStr] || 0;
                    const isTodayDate = dateStr === today;
                    const isPast = dateStr < today;
                    
                    const dayAppts = getAppointmentsForDate(dateStr);
                    const hasInProgress = dayAppts.some(a => a.status === 'in_progress');
                    const hasConfirmed = dayAppts.some(a => a.status === 'confirmed' || a.status === 'pending');
                    const hasCompleted = dayAppts.some(a => a.status === 'completed');
                    
                    return `
                    <button onclick="openDayDetailModal('${dateStr}')" 
                        class="min-h-[100px] sm:min-h-[140px] border-r border-slate-100 dark:border-slate-700 last:border-r-0 flex flex-col items-center justify-start p-2 sm:p-4 gap-1 sm:gap-2 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-[0.98] ${isTodayDate ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500 ring-inset' : ''} ${isPast && !isTodayDate ? 'opacity-50' : ''} ${count > 0 ? 'cursor-pointer' : ''}">
                        <span class="text-xl sm:text-3xl font-bold ${isTodayDate ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}">${dayNum}</span>
                        <span class="text-[9px] sm:text-xs text-slate-400">${monthShort}</span>
                        ${count > 0 ? `
                            <div class="flex flex-col items-center gap-1 mt-1 sm:mt-2">
                                <div class="flex items-center gap-1">
                                    ${hasInProgress ? `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500 animate-pulse"></span>` : ''}
                                    ${hasConfirmed ? `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500"></span>` : ''}
                                    ${hasCompleted ? `<span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500"></span>` : ''}
                                </div>
                                <span class="text-xs sm:text-sm font-bold ${isTodayDate ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}">${count} appt${count !== 1 ? 's' : ''}</span>
                            </div>
                        ` : `<span class="text-xs text-slate-300 dark:text-slate-600 mt-2">—</span>`}
                    </button>
                    `;
                }).join('')}
            </div>
        </div>
        
        <!-- Legend -->
        <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-slate-500">
            <div class="flex items-center gap-1"><span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500"></span> In Progress</div>
            <div class="flex items-center gap-1"><span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500"></span> Upcoming</div>
            <div class="flex items-center gap-1"><span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500"></span> Completed</div>
        </div>
    </div>
    
    <!-- Day Detail Modal -->
    ${state.dayDetailModal ? renderDayDetailModal(state.dayDetailModal) : ''}
    `;
}

// MONTHLY VIEW - Full month calendar
function renderMonthlyView(today) {
    // Get current month start
    const currentDate = state.calendarStartDate ? new Date(state.calendarStartDate + 'T12:00:00') : new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const startDay = (monthStart.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = monthEnd.getDate();
    
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const appointmentCounts = getAppointmentCountsByDate();
    
    // Generate calendar days
    const calendarDays = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
        calendarDays.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendarDays.push(dateStr);
    }
    
    return `
    <div class="space-y-4">
        <!-- Calendar Header -->
        <div class="flex items-center justify-between">
            <h3 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">${monthLabel}</h3>
            <div class="flex items-center gap-1 sm:gap-2">
                <button onclick="goToPreviousMonth()" class="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors touch-target">
                    <span class="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button onclick="goToCalendarToday()" class="px-3 py-2 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Today
                </button>
                <button onclick="goToNextMonth()" class="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors touch-target">
                    <span class="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>
        </div>
        
        <!-- Full Width Calendar Grid -->
        <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <!-- Day Headers -->
            <div class="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => `
                    <div class="py-2 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span class="sm:hidden">${d}</span>
                        <span class="hidden sm:inline">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                    </div>
                `).join('')}
            </div>
            
            <!-- Calendar Days -->
            <div class="grid grid-cols-7">
                ${calendarDays.map(dateStr => {
                    if (!dateStr) {
                        return `<div class="aspect-square border-r border-b border-slate-100 dark:border-slate-700 last:border-r-0 bg-slate-50/50 dark:bg-slate-800/30"></div>`;
                    }
                    
                    const dayNum = parseInt(dateStr.split('-')[2]);
                    const count = appointmentCounts[dateStr] || 0;
                    const isTodayDate = dateStr === today;
                    const isPast = dateStr < today;
                    
                    const dayAppts = getAppointmentsForDate(dateStr);
                    const hasInProgress = dayAppts.some(a => a.status === 'in_progress');
                    const hasConfirmed = dayAppts.some(a => a.status === 'confirmed' || a.status === 'pending');
                    const hasCompleted = dayAppts.some(a => a.status === 'completed');
                    
                    return `
                    <button onclick="openDayDetailModal('${dateStr}')" 
                        class="aspect-square border-r border-b border-slate-100 dark:border-slate-700 last:border-r-0 flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-95 ${isTodayDate ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500 ring-inset' : ''} ${isPast && !isTodayDate ? 'opacity-40' : ''} ${count > 0 ? 'cursor-pointer' : ''}">
                        <span class="text-sm sm:text-lg font-bold ${isTodayDate ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}">${dayNum}</span>
                        ${count > 0 ? `
                            <div class="flex items-center gap-0.5">
                                ${hasInProgress ? `<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500 animate-pulse"></span>` : ''}
                                ${hasConfirmed ? `<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500"></span>` : ''}
                                ${hasCompleted ? `<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"></span>` : ''}
                            </div>
                            <span class="text-[9px] sm:text-xs font-bold ${isTodayDate ? 'text-emerald-600' : 'text-slate-500'}">${count}</span>
                        ` : ''}
                    </button>
                    `;
                }).join('')}
            </div>
        </div>
        
        <!-- Legend -->
        <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-slate-500">
            <div class="flex items-center gap-1"><span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500"></span> In Progress</div>
            <div class="flex items-center gap-1"><span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500"></span> Upcoming</div>
            <div class="flex items-center gap-1"><span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500"></span> Completed</div>
        </div>
    </div>
    
    <!-- Day Detail Modal -->
    ${state.dayDetailModal ? renderDayDetailModal(state.dayDetailModal) : ''}
    `;
}

// Schedule Appointment Card (for Today view)
function renderScheduleAppointmentCard(apt, isCompleted = false) {
    const statusColors = {
        pending: 'border-l-amber-500',
        confirmed: 'border-l-blue-500',
        in_progress: 'border-l-purple-500',
        completed: 'border-l-emerald-500',
        cancelled: 'border-l-red-500'
    };
    
    const fullAddress = apt.service_address || apt.customerAddress || '';
    const city = apt.service_city || apt.customerCity || '';
    const displayAddress = fullAddress ? (fullAddress + (city ? ', ' + city : '')) : 'Address not provided';
    const mapsUrl = fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}` : '';
    const phoneClean = (apt.customerPhone || '').replace(/[^0-9+]/g, '');
    
    // Combine notes
    const petNotes = apt.petNotes || apt.pet?.grooming_notes || '';
    const customerNotes = apt.customer_notes || apt.notes || '';
    const hasNotes = petNotes || customerNotes;
    
    // JSON for pet profile (escaped for onclick)
    const petProfileData = JSON.stringify({
        name: apt.petName, breed: apt.petBreed, weight: apt.petWeight, 
        photo_url: apt.petPhoto, grooming_notes: apt.petNotes, 
        owner_name: apt.customerName, owner_phone: apt.customerPhone, 
        owner_address: apt.customerAddress
    }).replace(/"/g, '&quot;');
    
    return `
    <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden border-l-4 ${statusColors[apt.status] || 'border-l-slate-300'} ${isCompleted ? 'opacity-60' : ''}">
        <!-- Main clickable area -->
        <div onclick="openAppointmentDetail('${apt.id}')" class="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                    ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-xl text-slate-400">pets</span>`}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <button onclick="event.stopPropagation(); openPetProfile('${apt.pet_id}', ${petProfileData})" class="font-bold text-slate-900 dark:text-white truncate hover:text-groomer-primary transition-colors text-left">${apt.petName}</button>
                        ${apt.status === 'in_progress' ? `<span class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full flex-shrink-0">In Progress</span>` : ''}
                    </div>
                    <p class="text-sm text-slate-500 dark:text-slate-400 truncate">${apt.serviceName} • ${escapeHtml(apt.customerName)}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-lg font-bold text-slate-700 dark:text-slate-300">${formatTime(apt.start_time)}</p>
                    <p class="text-xs text-slate-500">$${apt.total_price || apt.servicePrice || '0'}</p>
                </div>
            </div>
            
            <!-- Notes Warning (shown prominently if present) -->
            ${hasNotes ? `
            <div class="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <div class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-amber-600 text-base flex-shrink-0">warning</span>
                    <div class="text-xs">
                        ${petNotes ? `<p class="text-amber-800 dark:text-amber-200"><span class="font-bold">Pet:</span> ${petNotes}</p>` : ''}
                        ${customerNotes ? `<p class="text-amber-700 dark:text-amber-300 ${petNotes ? 'mt-0.5' : ''}"><span class="font-bold">Note:</span> ${customerNotes}</p>` : ''}
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Address -->
            <p class="text-xs text-slate-400 dark:text-slate-500 truncate mt-2 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">location_on</span>
                ${displayAddress}
            </p>
        </div>
        
        ${!isCompleted ? `
        <!-- Quick Action Bar -->
        <div class="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
            <div class="flex items-center gap-1">
                ${mapsUrl ? `
                <a href="${mapsUrl}" target="_blank" onclick="event.stopPropagation()" class="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors touch-target" title="Navigate">
                    <span class="material-symbols-outlined text-lg">directions</span>
                </a>
                ` : ''}
                ${phoneClean ? `
                <a href="tel:${phoneClean}" onclick="event.stopPropagation()" class="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors touch-target" title="Call">
                    <span class="material-symbols-outlined text-lg">call</span>
                </a>
                <a href="sms:${phoneClean}" onclick="event.stopPropagation()" class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors touch-target" title="Text">
                    <span class="material-symbols-outlined text-lg">sms</span>
                </a>
                ` : ''}
            </div>
            ${(apt.status === 'confirmed' || apt.status === 'pending') ? `
            <button onclick="event.stopPropagation(); startGroomingAppointment('${apt.id}')" class="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors touch-target flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">play_arrow</span>
                Start
            </button>
            ` : apt.status === 'in_progress' ? `
            <button onclick="event.stopPropagation(); openCompleteAppointmentModal('${apt.id}')" class="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors touch-target flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">check_circle</span>
                Complete
            </button>
            ` : ''}
        </div>
        ` : ''}
    </div>
    `;
}

// Navigation functions for monthly view
function goToPreviousMonth() {
    const current = state.calendarStartDate ? new Date(state.calendarStartDate + 'T12:00:00') : new Date();
    current.setMonth(current.getMonth() - 1);
    current.setDate(1);
    state.calendarStartDate = current.toISOString().split('T')[0];
    state.selectedCalendarDate = null;
    render();
}

function goToNextMonth() {
    const current = state.calendarStartDate ? new Date(state.calendarStartDate + 'T12:00:00') : new Date();
    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
    state.calendarStartDate = current.toISOString().split('T')[0];
    state.selectedCalendarDate = null;
    render();
}

// Open day detail modal
function openDayDetailModal(dateStr) {
    state.dayDetailModal = dateStr;
    render();
}

// Close day detail modal
function closeDayDetailModal() {
    state.dayDetailModal = null;
    render();
}

// Render day detail modal (popup)
function renderDayDetailModal(dateStr) {
    const appointments = getAppointmentsForDate(dateStr);
    const dateObj = new Date(dateStr + 'T12:00:00');
    const today = getTodayPacific();
    const isToday = dateStr === today;
    const isPast = dateStr < today;
    const dayLabel = isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    // Group by status
    const inProgress = appointments.filter(a => a.status === 'in_progress');
    const upcoming = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
    const completed = appointments.filter(a => a.status === 'completed');
    const cancelled = appointments.filter(a => a.status === 'cancelled');
    
    return `
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onmousedown="if(event.target === this) closeDayDetailModal()">
        <div class="bg-white dark:bg-surface-dark w-full sm:w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
            <!-- Modal Header -->
            <div class="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-groomer-primary/10 to-emerald-500/10">
                <div>
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        ${isToday ? '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>' : ''}
                        ${dayLabel}
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        ${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}
                        ${appointments.length > 0 ? ` • $${appointments.reduce((sum, a) => sum + (parseFloat(a.total_price) || 0), 0).toFixed(0)} total` : ''}
                    </p>
                </div>
                <button onclick="closeDayDetailModal()" class="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors touch-target">
                    <span class="material-symbols-outlined text-slate-500">close</span>
                </button>
            </div>
            
            <!-- Appointments List -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                ${appointments.length === 0 ? `
                    <div class="flex flex-col items-center justify-center py-12 text-center">
                        <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <span class="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">event_available</span>
                        </div>
                        <p class="text-slate-500 dark:text-slate-400 font-medium">No appointments</p>
                        <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">${isPast ? 'This day had no bookings' : 'This day is free'}</p>
                    </div>
                ` : ''}
                
                ${inProgress.length > 0 ? `
                    <div>
                        <p class="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            In Progress (${inProgress.length})
                        </p>
                        <div class="space-y-2">
                            ${inProgress.map(apt => renderDayModalAppointmentCard(apt)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${upcoming.length > 0 ? `
                    <div>
                        <p class="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                            Upcoming (${upcoming.length})
                        </p>
                        <div class="space-y-2">
                            ${upcoming.map(apt => renderDayModalAppointmentCard(apt)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${completed.length > 0 ? `
                    <div>
                        <p class="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Completed (${completed.length})
                        </p>
                        <div class="space-y-2">
                            ${completed.map(apt => renderDayModalAppointmentCard(apt, true)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${cancelled.length > 0 ? `
                    <div>
                        <p class="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Cancelled (${cancelled.length})</p>
                        <div class="space-y-2 opacity-50">
                            ${cancelled.map(apt => renderDayModalAppointmentCard(apt, true)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <!-- Footer -->
            <div class="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 safe-bottom">
                <button onclick="closeDayDetailModal()" class="w-full py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors">
                    Close
                </button>
            </div>
        </div>
    </div>`;
}

// Render appointment card for day modal
function renderDayModalAppointmentCard(apt, isCompleted = false) {
    const statusBorder = {
        pending: 'border-l-amber-500',
        confirmed: 'border-l-emerald-500',
        in_progress: 'border-l-purple-500',
        completed: 'border-l-slate-300',
        cancelled: 'border-l-red-400'
    };
    
    const fullAddress = apt.service_address || apt.customerAddress || '';
    const mapsUrl = fullAddress ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}` : '';
    const phoneClean = (apt.customerPhone || '').replace(/[^0-9+]/g, '');
    
    return `
    <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden border-l-4 ${statusBorder[apt.status] || 'border-l-slate-300'} ${isCompleted ? 'opacity-70' : ''}">
        <div onclick="closeDayDetailModal(); setTimeout(() => openAppointmentDetail('${apt.id}'), 100);" class="p-3 sm:p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                    ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-xl text-slate-400">pets</span>`}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <h4 class="font-bold text-slate-900 dark:text-white truncate">${apt.petName || 'Pet'}</h4>
                        <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">${formatTime(apt.start_time)}</span>
                    </div>
                    <p class="text-sm text-slate-500 dark:text-slate-400 truncate">${apt.serviceName || 'Grooming'} • ${apt.customerName || 'Customer'}</p>
                    ${apt.total_price ? `<p class="text-xs text-slate-400 mt-0.5">$${apt.total_price}</p>` : ''}
                </div>
            </div>
        </div>
        ${!isCompleted ? `
        <div class="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
            <div class="flex items-center gap-1">
                ${mapsUrl ? `
                <a href="${mapsUrl}" target="_blank" onclick="event.stopPropagation()" class="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors touch-target">
                    <span class="material-symbols-outlined text-lg">directions</span>
                </a>
                ` : ''}
                ${phoneClean ? `
                <a href="tel:${phoneClean}" onclick="event.stopPropagation()" class="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors touch-target">
                    <span class="material-symbols-outlined text-lg">call</span>
                </a>
                ` : ''}
            </div>
            ${apt.status === 'in_progress' ? `
                <button onclick="event.stopPropagation(); openCompleteAppointmentModal('${apt.id}')" class="px-3 py-1.5 bg-groomer-primary hover:bg-groomer-primary/90 text-white text-xs font-bold rounded-lg transition-colors">
                    Mark Done
                </button>
            ` : apt.status === 'confirmed' || apt.status === 'pending' ? `
                <button onclick="event.stopPropagation(); startGroomingAppointment('${apt.id}')" class="px-3 py-1.5 bg-tech-purple hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors">
                    Start
                </button>
            ` : ''}
        </div>
        ` : ''}
    </div>`;
}

// Day Detail Panel (right sidebar) - keeping for desktop but hidden on mobile
function renderDayDetailPanel(dateStr, appointments) {
    const dateObj = new Date(dateStr + 'T12:00:00');
    const isToday = dateStr === getTodayPacific();
    const isPast = dateStr < getTodayPacific();
    const dayLabel = isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
    return `
    <div class="w-[380px] bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <!-- Panel Header -->
        <div class="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">${dayLabel}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">${appointments.length} Appointment${appointments.length !== 1 ? 's' : ''}</p>
            </div>
            <button onclick="closeDayPanel()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors lg:hidden">
                <span class="material-symbols-outlined text-slate-500">close</span>
            </button>
        </div>
        
        <!-- Appointments List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
            ${appointments.length > 0 ? appointments.map(apt => {
                const statusColors = {
                    pending: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20',
                    confirmed: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20',
                    in_progress: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-400',
                    completed: 'border-slate-200 bg-slate-50 dark:bg-slate-800/50 opacity-60',
                    cancelled: 'border-red-200 bg-red-50 dark:bg-red-900/20 opacity-50'
                };
                const statusBadges = {
                    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
                    confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
                    in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
                    completed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                    cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300'
                };
                
                return `
                <button onclick="openAppointmentDetail('${apt.id}')" class="w-full p-4 rounded-xl border-2 ${statusColors[apt.status] || 'border-slate-200 bg-white'} text-left transition-all hover:shadow-md">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-slate-400">pets</span>`}
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-900 dark:text-white">${apt.petName || 'Pet'}</h4>
                                <p class="text-xs text-slate-500 dark:text-slate-400">${apt.serviceName || 'Grooming'}</p>
                            </div>
                        </div>
                        <span class="px-2 py-1 text-[10px] font-bold uppercase rounded-lg ${statusBadges[apt.status] || 'bg-slate-100 text-slate-600'}">
                            ${apt.status === 'in_progress' ? 'In Progress' : apt.status}
                        </span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="font-bold text-emerald-600 dark:text-emerald-400">${formatTime(apt.start_time)}</span>
                        <span class="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">person</span>
                            ${apt.customerName || 'Customer'}
                        </span>
                    </div>
                </button>`;
            }).join('') : `
                <div class="flex flex-col items-center justify-center py-12 text-center">
                    <span class="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">event_available</span>
                    <p class="text-slate-500 dark:text-slate-400 font-medium">No appointments</p>
                    <p class="text-sm text-slate-400 dark:text-slate-500">You're free this day!</p>
                </div>
            `}
        </div>
    </div>`;
}

// Full Appointment Detail Modal
function renderAppointmentDetailModal(apt) {
    const statusColors = {
        pending: 'bg-amber-500',
        confirmed: 'bg-emerald-500',
        in_progress: 'bg-purple-500',
        completed: 'bg-slate-500',
        cancelled: 'bg-red-500'
    };
    
    const fullAddress = apt.service_address || apt.customerAddress || 'Address not provided';
    const city = apt.service_city || apt.customerCity || '';
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress + (city ? ', ' + city : ''))}`;
    
    // Calculate elapsed time if in progress
    let elapsedTime = '';
    if (apt.status === 'in_progress' && apt.started_at) {
        const started = new Date(apt.started_at);
        const now = new Date();
        const mins = Math.floor((now - started) / 60000);
        elapsedTime = mins < 60 ? `${mins} min` : `${Math.floor(mins/60)}h ${mins%60}m`;
    }
    
    const isPastAppointment = apt.appointment_date < getTodayPacific();
    const canTakeAction = !isPastAppointment && apt.status !== 'completed' && apt.status !== 'cancelled';
    
    return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onmousedown="if(event.target === this) closeAppointmentDetail()">
        <div class="bg-white dark:bg-surface-dark rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onclick="event.stopPropagation()">
            
            <!-- Header -->
            <div class="relative p-6 pb-4">
                <button onmousedown="if(event.target === this) closeAppointmentDetail()" class="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <span class="material-symbols-outlined text-slate-500">close</span>
                </button>
                
                <div class="flex items-center gap-2 mb-4">
                    <span class="w-3 h-3 rounded-full ${statusColors[apt.status] || 'bg-slate-400'} ${apt.status === 'in_progress' ? 'animate-pulse' : ''}"></span>
                    <span class="text-sm font-bold uppercase tracking-wider ${apt.status === 'in_progress' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}">
                        ${apt.status === 'in_progress' ? 'In Progress' : apt.status}
                    </span>
                    ${elapsedTime ? `<span class="text-sm text-purple-500 dark:text-purple-400 ml-2">• ${elapsedTime}</span>` : ''}
                </div>
                
                <!-- Pet Info -->
                <div class="flex items-center gap-4">
                    <div class="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden ring-4 ring-slate-100 dark:ring-slate-700">
                        ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-4xl text-slate-400">pets</span>`}
                    </div>
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">${apt.petName || 'Pet'}</h2>
                        <p class="text-slate-500 dark:text-slate-400">${apt.petBreed || 'Pet'} ${apt.petWeight ? '• ' + apt.petWeight + ' lbs' : ''}</p>
                        <button onclick="openPetProfile('${apt.pet_id}', ${JSON.stringify({name: apt.petName, breed: apt.petBreed, weight: apt.petWeight, photo_url: apt.petPhoto, grooming_notes: apt.petNotes, owner_name: apt.customerName, owner_phone: apt.customerPhone, owner_address: apt.customerAddress, owner_city: apt.customerCity}).replace(/"/g, '&quot;')})" class="mt-2 text-sm text-groomer-primary hover:text-groomer-primary/80 font-bold flex items-center gap-1 transition-colors">
                            <span class="material-symbols-outlined text-sm">visibility</span>
                            View Pet Profile
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Details Section -->
            <div class="px-6 pb-4 space-y-4">
                
                <!-- Service & Time -->
                <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-emerald-500">content_cut</span>
                            <div>
                                <p class="font-bold text-slate-900 dark:text-white">${apt.serviceName || 'Grooming'}</p>
                                <p class="text-sm text-slate-500 dark:text-slate-400">$${apt.total_price || apt.servicePrice || '0'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-emerald-600 dark:text-emerald-400">${formatTime(apt.start_time)}</p>
                            <p class="text-sm text-slate-500 dark:text-slate-400">${formatDate(apt.appointment_date)}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Customer Info -->
                <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="material-symbols-outlined text-blue-500">person</span>
                        <div class="flex-1">
                            <p class="font-bold text-slate-900 dark:text-white">${apt.customerName || 'Customer'}</p>
                        </div>
                        ${apt.customerPhone ? `
                            <a href="tel:${apt.customerPhone}" class="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors">
                                <span class="material-symbols-outlined text-lg">call</span>
                            </a>
                            <a href="sms:${apt.customerPhone}" class="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors">
                                <span class="material-symbols-outlined text-lg">sms</span>
                            </a>
                        ` : ''}
                    </div>
                    
                    <!-- Quick Text Templates -->
                    ${apt.customerPhone ? `
                        <div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Text</p>
                            <div class="flex flex-wrap gap-2">
                                <a href="sms:${apt.customerPhone}?body=${encodeURIComponent("On my way! Should arrive in about 10 minutes.")}" class="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-green-400 hover:text-green-600 transition-colors">
                                    🚗 On my way
                                </a>
                                <a href="sms:${apt.customerPhone}?body=${encodeURIComponent("I've arrived! Ready when you are.")}" class="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-green-400 hover:text-green-600 transition-colors">
                                    🏠 Arrived
                                </a>
                                <a href="sms:${apt.customerPhone}?body=${encodeURIComponent("Running about 10 minutes late, sorry for the delay!")}" class="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-green-400 hover:text-green-600 transition-colors">
                                    ⏰ Running late
                                </a>
                                <a href="sms:${apt.customerPhone}?body=${encodeURIComponent("Grooming complete! Your fur baby looks amazing. 🐕✨")}" class="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-green-400 hover:text-green-600 transition-colors">
                                    ✅ Done
                                </a>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Address -->
                <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                    <div class="flex items-start gap-3">
                        <span class="material-symbols-outlined text-rose-500 mt-0.5">location_on</span>
                        <div class="flex-1">
                            <p class="font-bold text-slate-900 dark:text-white">${fullAddress}</p>
                            ${city ? `<p class="text-sm text-slate-500 dark:text-slate-400">${city}</p>` : ''}
                        </div>
                        <a href="${mapsUrl}" target="_blank" class="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors">
                            <span class="material-symbols-outlined text-lg">directions</span>
                            Navigate
                        </a>
                    </div>
                </div>
                
                <!-- Notes -->
                ${apt.customer_notes ? `
                    <div class="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-700">
                        <div class="flex items-start gap-3">
                            <span class="material-symbols-outlined text-amber-500">note</span>
                            <div>
                                <p class="text-sm font-bold text-amber-700 dark:text-amber-300 mb-1">Customer Notes</p>
                                <p class="text-sm text-amber-800 dark:text-amber-200">${apt.customer_notes}</p>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${apt.groomer_notes ? `
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-700">
                        <div class="flex items-start gap-3">
                            <span class="material-symbols-outlined text-blue-500">edit_note</span>
                            <div>
                                <p class="text-sm font-bold text-blue-700 dark:text-blue-300 mb-1">Your Notes</p>
                                <p class="text-sm text-blue-800 dark:text-blue-200">${apt.groomer_notes}</p>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <!-- Action Buttons -->
            ${canTakeAction ? `
                <div class="p-6 pt-2 space-y-3">
                    ${apt.status === 'confirmed' || apt.status === 'pending' ? `
                        <button onclick="startGroomingAppointment('${apt.id}')" class="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20 text-lg">
                            <span class="material-symbols-outlined text-2xl">play_circle</span>
                            Start Grooming
                        </button>
                    ` : apt.status === 'in_progress' ? `
                        <div class="space-y-3">
                            <textarea id="modal-groomer-notes-${apt.id}" placeholder="Add notes about the groom (optional)..." class="w-full h-24 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-emerald-500 text-sm resize-none dark:text-white"></textarea>
                            <button onclick="groomerCompleteAppointmentFromModal('${apt.id}')" class="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 text-lg">
                                <span class="material-symbols-outlined text-2xl">check_circle</span>
                                Complete & Award Points
                            </button>
                        </div>
                    ` : ''}
                </div>
            ` : `
                <div class="p-6 pt-2">
                    <div class="py-4 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        ${apt.status === 'completed' ? '✅ This appointment has been completed' : apt.status === 'cancelled' ? '❌ This appointment was cancelled' : '📅 Past appointment'}
                    </div>
                </div>
            `}
        </div>
    </div>`;
}

// Open completion modal
function openCompleteAppointmentModal(appointmentId) {
    const apt = state.groomerAppointments.find(a => a.id === appointmentId);
    if (!apt) {
        showToast('Appointment not found', 'error');
        return;
    }
    state.showCompleteAppointmentModal = true;
    state.completingAppointmentId = appointmentId;
    state.completingAppointmentData = apt;
    state.capturedAfterPhoto = null; // Reset after photo when opening
    render();
}

// Close completion modal
function closeCompleteAppointmentModal() {
    state.showCompleteAppointmentModal = false;
    state.completingAppointmentId = null;
    state.completingAppointmentData = null;
    state.capturedAfterPhoto = null; // Clear captured after photo
    render();
}

// Submit completion from modal
async function submitAppointmentCompletion() {
    const appointmentId = state.completingAppointmentId;
    if (!appointmentId) return;
    
    const completedCheckbox = document.getElementById('completion-confirmed');
    const notesEl = document.getElementById('completion-notes');
    
    if (!completedCheckbox?.checked) {
        showToast('Please confirm the grooming was completed', 'error');
        return;
    }
    
    const notes = notesEl?.value?.trim() || null;
    const afterPhotoBase64 = state.capturedAfterPhoto; // Capture before clearing state
    
    // Close modal FIRST and clear all modal state
    state.showCompleteAppointmentModal = false;
    state.completingAppointmentId = null;
    state.completingAppointmentData = null;
    state.capturedAfterPhoto = null;
    
    // Render to close the modal visually
    render();
    
    // Then complete the appointment (this will render again when done)
    await groomerCompleteAppointment(appointmentId, notes, afterPhotoBase64);
}

// Render Before Photo Modal (shown when starting appointment)
function renderBeforePhotoModal() {
    if (!state.showBeforePhotoModal || !state.beforePhotoAppointmentData) return '';
    
    const apt = state.beforePhotoAppointmentData;
    const hasPhoto = state.capturedBeforePhoto;
    
    return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick="closeBeforePhotoModal()">
        <div class="bg-white dark:bg-surface-dark rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold">📸 Before Photo</h2>
                    <button onclick="closeBeforePhotoModal()" class="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden">
                        ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-2xl">pets</span>`}
                    </div>
                    <div>
                        <h3 class="text-lg font-bold">${apt.petName || 'Pet'}</h3>
                        <p class="text-white/80 text-sm">${apt.serviceName || 'Grooming'} • ${apt.customerName || 'Customer'}</p>
                    </div>
                </div>
            </div>
            
            <!-- Photo Capture Area -->
            <div class="p-6 space-y-4">
                <p class="text-sm text-slate-600 dark:text-slate-400 text-center">
                    Take a "before" photo to document the pet's condition before grooming. This is optional but recommended.
                </p>
                
                <!-- Photo Preview / Capture Button -->
                <div class="relative">
                    ${hasPhoto ? `
                        <div class="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <img src="${state.capturedBeforePhoto}" class="w-full h-full object-cover" alt="Before photo"/>
                            <button onclick="state.capturedBeforePhoto = null; render();" class="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg">
                                <span class="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                        <p class="text-center text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                            ✓ Photo captured! Ready to start.
                        </p>
                    ` : `
                        <button onclick="capturePhoto('before')" class="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer touch-target">
                            <div class="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span class="material-symbols-outlined text-3xl text-blue-500">photo_camera</span>
                            </div>
                            <div class="text-center">
                                <p class="font-bold text-slate-700 dark:text-slate-300">Tap to Take Photo</p>
                                <p class="text-xs text-slate-500">Use your camera</p>
                            </div>
                        </button>
                    `}
                </div>
            </div>
            
            <!-- Actions -->
            <div class="p-6 pt-0 flex gap-3">
                <button onclick="skipBeforePhotoAndStart()" class="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Skip Photo
                </button>
                <button onclick="startWithBeforePhoto()" class="flex-1 py-3 px-4 rounded-xl ${hasPhoto ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600'} text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg ${hasPhoto ? 'shadow-emerald-500/30' : 'shadow-blue-500/30'}">
                    <span class="material-symbols-outlined">${hasPhoto ? 'check_circle' : 'play_arrow'}</span>
                    ${hasPhoto ? 'Start with Photo' : 'Start Now'}
                </button>
            </div>
        </div>
    </div>`;
}

// Render completion modal
function renderCompleteAppointmentModal() {
    if (!state.showCompleteAppointmentModal || !state.completingAppointmentData) return '';
    
    const apt = state.completingAppointmentData;
    const hasAfterPhoto = state.capturedAfterPhoto;
    
    // Calculate elapsed time
    let elapsedTime = '';
    if (apt.started_at) {
        const started = new Date(apt.started_at);
        const now = new Date();
        const mins = Math.floor((now - started) / 60000);
        elapsedTime = mins < 60 ? `${mins} minutes` : `${Math.floor(mins/60)}h ${mins%60}m`;
    }
    
    return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick="closeCompleteAppointmentModal()">
        <div class="bg-white dark:bg-surface-dark rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold">Complete Appointment</h2>
                    <button onclick="closeCompleteAppointmentModal()" class="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden">
                        ${apt.petPhoto ? `<img src="${apt.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-2xl">pets</span>`}
                    </div>
                    <div>
                        <h3 class="text-lg font-bold">${apt.petName || 'Pet'}</h3>
                        <p class="text-white/80 text-sm">${apt.serviceName || 'Grooming'} • ${apt.customerName || 'Customer'}</p>
                    </div>
                </div>
                ${elapsedTime ? `<p class="mt-3 text-sm text-white/80"><span class="material-symbols-outlined text-sm align-middle mr-1">timer</span>Session duration: ${elapsedTime}</p>` : ''}
            </div>
            
            <!-- Form -->
            <div class="p-6 space-y-5">
                <!-- After Photo Section -->
                <div>
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        <span class="material-symbols-outlined text-sm align-middle mr-1">photo_camera</span>
                        After Photo (Recommended)
                    </label>
                    ${hasAfterPhoto ? `
                        <div class="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <img src="${state.capturedAfterPhoto}" class="w-full h-full object-cover" alt="After photo"/>
                            <button onclick="state.capturedAfterPhoto = null; render();" class="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg">
                                <span class="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                        <p class="text-center text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                            ✓ After photo captured!
                        </p>
                    ` : `
                        <button onclick="capturePhoto('after')" class="w-full aspect-[3/2] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-2 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer touch-target">
                            <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <span class="material-symbols-outlined text-2xl text-emerald-500">photo_camera</span>
                            </div>
                            <p class="font-medium text-slate-600 dark:text-slate-400 text-sm">Tap to capture after photo</p>
                        </button>
                    `}
                </div>
                
                <!-- Confirmation Checkbox -->
                <label class="flex items-start gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 cursor-pointer">
                    <input type="checkbox" id="completion-confirmed" class="mt-0.5 h-5 w-5 rounded border-emerald-300 text-emerald-500 focus:ring-emerald-500"/>
                    <div>
                        <p class="font-bold text-slate-900 dark:text-white">Grooming Completed</p>
                        <p class="text-sm text-slate-500 dark:text-slate-400">I confirm this grooming session has been completed successfully</p>
                    </div>
                </label>
                
                <!-- Notes -->
                <div>
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        <span class="material-symbols-outlined text-sm align-middle mr-1">notes</span>
                        Session Notes (Optional)
                    </label>
                    <textarea 
                        id="completion-notes" 
                        rows="3" 
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                        placeholder="Any observations about this grooming session..."
                    ></textarea>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="p-6 pt-0 flex gap-3">
                <button onclick="closeCompleteAppointmentModal()" class="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Cancel
                </button>
                <button onclick="submitAppointmentCompletion()" class="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
                    <span class="material-symbols-outlined">check_circle</span>
                    Mark Complete
                </button>
            </div>
        </div>
    </div>`; 
}

// Complete appointment from modal (gets notes from modal textarea)
async function groomerCompleteAppointmentFromModal(appointmentId) {
    openCompleteAppointmentModal(appointmentId);
}

// =============================================
// GROOMER AVAILABILITY TAB
// =============================================
function renderGroomerAvailabilityContent() {
    const availability = state.groomerAvailability || [];
    const timeOffRequests = state.groomerTimeOffRequests || [];
    const groomerSettings = state.groomerSettings || {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Group time off by status
    const pendingRequests = timeOffRequests.filter(r => r.status === 'pending');
    const approvedRequests = timeOffRequests.filter(r => r.status === 'approved' && new Date(r.end_date) >= new Date());
    const pastRequests = timeOffRequests.filter(r => r.status !== 'pending' && (r.status === 'denied' || new Date(r.end_date) < new Date()));
    
    // Build availability map
    const availMap = {};
    availability.forEach(a => {
        availMap[a.day_of_week] = a;
    });
    
    // Format time to 12-hour
    const formatTime12 = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return h12 + ':' + minutes + ' ' + ampm;
    };
    
    return `
    <div class="space-y-8">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">My Availability</h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1">Manage your working hours, capacity, and time off</p>
            </div>
        </div>
        
        <!-- Capacity Settings Section - NEW -->
        <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-purple-600 dark:text-purple-400">tune</span>
                    </div>
                    <div>
                        <h2 class="font-bold text-slate-900 dark:text-white">Capacity Settings</h2>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Control your daily workload</p>
                    </div>
                </div>
            </div>
            
            <div class="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Max Appointments Per Day -->
                <div class="space-y-2">
                    <label class="text-sm font-bold text-slate-700 dark:text-slate-300">Max Appointments / Day</label>
                    <select id="maxApptsPerDay" onchange="updateGroomerSetting('max_appointments_per_day', this.value)" class="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-groomer-primary text-slate-900 dark:text-white font-medium">
                        ${[4,5,6,7,8,9,10,12,15,20].map(n => `<option value="${n}" ${(groomerSettings.max_appointments_per_day || 8) == n ? 'selected' : ''}>${n} appointments</option>`).join('')}
                    </select>
                    <p class="text-xs text-slate-500">New bookings blocked after limit</p>
                </div>
                
                <!-- Buffer Between Appointments -->
                <div class="space-y-2">
                    <label class="text-sm font-bold text-slate-700 dark:text-slate-300">Buffer Between Stops</label>
                    <select id="bufferMinutes" onchange="updateGroomerSetting('buffer_minutes', this.value)" class="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-groomer-primary text-slate-900 dark:text-white font-medium">
                        ${[0,10,15,20,30,45,60].map(n => `<option value="${n}" ${(groomerSettings.buffer_minutes || 15) == n ? 'selected' : ''}>${n === 0 ? 'No buffer' : n + ' minutes'}</option>`).join('')}
                    </select>
                    <p class="text-xs text-slate-500">Travel time between appointments</p>
                </div>
            </div>
        </div>
        
        <!-- Coverage Regions Section -->
        <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">location_on</span>
                    </div>
                    <div>
                        <h2 class="font-bold text-slate-900 dark:text-white">My Coverage Regions</h2>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Assigned by admin</p>
                    </div>
                </div>
            </div>
            
            <div class="p-5">
                ${(() => {
                    const myRegions = state.currentUser?.serviceRegions || [];
                    const assignedRegions = serviceRegions.filter(r => myRegions.includes(r.id));
                    
                    if (assignedRegions.length === 0) {
                        return `
                            <div class="text-center py-6 text-slate-500 dark:text-slate-400">
                                <span class="material-symbols-outlined text-3xl mb-2">map</span>
                                <p class="text-sm">No coverage regions assigned yet.</p>
                                <p class="text-xs text-slate-400 mt-1">Contact your admin to get assigned to regions.</p>
                            </div>
                        `;
                    }
                    
                    return `
                        <div class="space-y-2">
                            ${assignedRegions.map(region => `
                                <div class="flex items-center gap-3 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                                    <div class="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                                        <span class="material-symbols-outlined text-white text-sm">check</span>
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-semibold text-sm text-slate-900 dark:text-white">${escapeHtml(region.name)}</p>
                                        <p class="text-xs text-slate-500 dark:text-slate-400">${(region.cities || []).slice(0, 4).join(', ')}${(region.cities || []).length > 4 ? '...' : ''}</p>
                                    </div>
                                    <span class="text-xs font-bold text-blue-600 dark:text-blue-400">ACTIVE</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                })()}
            </div>
        </div>
        
        <!-- Weekly Schedule Section -->
        <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-groomer-primary/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-groomer-primary">calendar_month</span>
                    </div>
                    <div>
                        <h2 class="font-bold text-slate-900 dark:text-white">Weekly Schedule</h2>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Your regular working hours <span class="text-xs">(set by admin · Pacific Time)</span></p>
                    </div>
                </div>
                <button onclick="openAvailabilityEditor()" class="flex items-center gap-2 px-4 py-2 bg-groomer-primary hover:bg-groomer-primary/90 text-white rounded-xl font-bold text-sm transition-colors" style="display:none;">
                    <span class="material-symbols-outlined text-lg">edit</span>
                    Edit Schedule
                </button>
                <span class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-medium">
                    <span class="material-symbols-outlined text-sm">lock</span>
                    Managed by admin
                </span>
            </div>
            
            <div class="p-5">
                <div class="space-y-3">
                    ${dayNames.map((day, idx) => {
                        const avail = availMap[idx];
                        const isWorking = avail?.is_available;
                        const startTime = avail?.start_time?.slice(0, 5) || '08:00';
                        const endTime = avail?.end_time?.slice(0, 5) || '18:00';
                        
                        return `
                        <div class="flex items-center justify-between p-3 rounded-xl ${isWorking ? 'bg-groomer-primary/10' : 'bg-slate-50 dark:bg-slate-800/50'}">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg ${isWorking ? 'bg-groomer-primary' : 'bg-slate-300 dark:bg-slate-600'} flex items-center justify-center">
                                    <span class="material-symbols-outlined text-white text-sm">${isWorking ? 'check' : 'close'}</span>
                                </div>
                                <span class="font-semibold text-slate-900 dark:text-white w-24">${day}</span>
                            </div>
                            <div class="text-right">
                                ${isWorking ? `
                                    <span class="text-groomer-primary font-medium">${formatTime12(startTime)} - ${formatTime12(endTime)}</span>
                                ` : `
                                    <span class="text-slate-400 dark:text-slate-500 font-medium">Day Off</span>
                                `}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-start gap-2">
                    <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg mt-0.5">info</span>
                    <p class="text-sm text-amber-700 dark:text-amber-300">Changes to your schedule affect new bookings only. Existing appointments remain unchanged.</p>
                </div>
            </div>
        </div>
        
        <!-- Time Off Section -->
        <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-orange-600 dark:text-orange-400">beach_access</span>
                    </div>
                    <div>
                        <h2 class="font-bold text-slate-900 dark:text-white">Time Off Requests</h2>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Request days off from work</p>
                    </div>
                </div>
                <button onclick="openTimeOffRequestModal()" class="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition-colors">
                    <span class="material-symbols-outlined text-lg">add</span>
                    Request Time Off
                </button>
            </div>
            
            <div class="p-5 space-y-6">
                <!-- Pending Requests -->
                ${pendingRequests.length > 0 ? `
                <div>
                    <h3 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-amber-500 text-lg">pending</span>
                        Pending Approval (${pendingRequests.length})
                    </h3>
                    <div class="space-y-3">
                        ${pendingRequests.map(r => `
                        <div class="p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                            <div class="flex items-start justify-between gap-4">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="material-symbols-outlined text-amber-600 dark:text-amber-400">event</span>
                                        <span class="font-bold text-slate-900 dark:text-white">${formatDateRange(r.start_date, r.end_date)}</span>
                                    </div>
                                    ${r.reason ? '<p class="text-sm text-slate-600 dark:text-slate-400 ml-7">' + escapeHtml(r.reason) + '</p>' : ''}
                                </div>
                                <button onclick="cancelTimeOffRequest('${r.id}')" class="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Approved Upcoming -->
                ${approvedRequests.length > 0 ? `
                <div>
                    <h3 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-groomer-primary text-lg">check_circle</span>
                        Approved Time Off (${approvedRequests.length})
                    </h3>
                    <div class="space-y-3">
                        ${approvedRequests.map(r => `
                        <div class="p-4 rounded-xl border border-groomer-primary/30 bg-groomer-primary/5">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="material-symbols-outlined text-groomer-primary">event_available</span>
                                <span class="font-bold text-slate-900 dark:text-white">${formatDateRange(r.start_date, r.end_date)}</span>
                                <span class="px-2 py-0.5 bg-groomer-primary/20 text-groomer-primary text-xs font-bold rounded-full">Approved</span>
                            </div>
                            ${r.reason ? '<p class="text-sm text-slate-600 dark:text-slate-400 ml-7">' + escapeHtml(r.reason) + '</p>' : ''}
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Empty State -->
                ${pendingRequests.length === 0 && approvedRequests.length === 0 ? `
                <div class="text-center py-8">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span class="material-symbols-outlined text-3xl text-slate-400">beach_access</span>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">No Time Off Scheduled</h3>
                    <p class="text-slate-500 dark:text-slate-400 mb-4">You haven't requested any time off yet.</p>
                </div>
                ` : ''}
            </div>
        </div>
    </div>
    
    <!-- Modals -->
    ${state.showAvailabilityEditor ? renderAvailabilityEditorModal() : ''}
    ${state.showTimeOffRequestModal ? renderTimeOffRequestModal() : ''}
    `;
}

// Helper function for date range formatting
function formatDateRange(startDate, endDate) {
    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    
    if (startDate === endDate) {
        return start.toLocaleDateString('en-US', options);
    }
    return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' - ' + end.toLocaleDateString('en-US', options);
}

// Groomer settings management
async function updateGroomerSetting(key, value) {
    if (!state.currentUser?.id) return;
    
    try {
        // Update local state first for immediate feedback
        if (!state.groomerSettings) state.groomerSettings = {};
        state.groomerSettings[key] = value;
        
        // Save to database (would need a groomer_settings table)
        _log('Updated setting:', key, '=', value);
        showToast('Setting updated', 'success');
    } catch (err) {
        console.error('Failed to update setting:', err);
        showToast('Failed to update setting', 'error');
    }
}

// Time off request modal
function renderTimeOffRequestModal() {
    return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeTimeOffRequestModal()"></div>
        <div class="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div class="p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">Request Time Off</h2>
            </div>
            <div class="p-6 space-y-4">
                <div>
                    <label class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Start Date</label>
                    <input type="date" id="timeOffStart" class="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-groomer-primary"/>
                </div>
                <div>
                    <label class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">End Date</label>
                    <input type="date" id="timeOffEnd" class="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-groomer-primary"/>
                </div>
                <div>
                    <label class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Reason (Optional)</label>
                    <input type="text" id="timeOffReason" placeholder="Vacation, appointment, etc." class="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-groomer-primary"/>
                </div>
            </div>
            <div class="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                <button onclick="closeTimeOffRequestModal()" class="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
                <button onclick="submitTimeOffRequest()" class="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl">Submit Request</button>
            </div>
        </div>
    </div>
    `;
}

function openTimeOffRequestModal() {
    state.showTimeOffRequestModal = true;
    render();
}

function closeTimeOffRequestModal() {
    state.showTimeOffRequestModal = false;
    render();
}

async function submitTimeOffRequest() {
    const startDate = document.getElementById('timeOffStart')?.value;
    const endDate = document.getElementById('timeOffEnd')?.value;
    const reason = document.getElementById('timeOffReason')?.value;
    
    if (!startDate || !endDate) {
        showToast('Please select start and end dates', 'error');
        return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
        showToast('End date must be after start date', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('groomer_time_off')
            .insert({
                groomer_id: state.currentUser.id,
                start_date: startDate,
                end_date: endDate,
                reason: reason || null,
                status: 'pending'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        if (!state.groomerTimeOffRequests) state.groomerTimeOffRequests = [];
        state.groomerTimeOffRequests.push(data);
        
        closeTimeOffRequestModal();
        showToast('Time off request submitted', 'success');
    } catch (err) {
        console.error('Failed to submit time off request:', err);
        showToast('Failed to submit request', 'error');
    }
}

async function cancelTimeOffRequest(requestId) {
    if (!confirm('Cancel this time off request?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('groomer_time_off')
            .delete()
            .eq('id', requestId);
        
        if (error) throw error;
        
        state.groomerTimeOffRequests = (state.groomerTimeOffRequests || []).filter(r => r.id !== requestId);
        showToast('Request cancelled', 'success');
        render();
    } catch (err) {
        console.error('Failed to cancel request:', err);
        showToast('Failed to cancel request', 'error');
    }
}

// Availability editor modal
function renderAvailabilityEditorModal() {
    const availability = state.groomerAvailability || [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Initialize editing state
    if (!state.editingAvailability) {
        state.editingAvailability = {};
        dayNames.forEach((day, idx) => {
            const existing = availability.find(a => a.day_of_week === idx);
            state.editingAvailability[idx] = {
                is_available: existing?.is_available || false,
                start_time: existing?.start_time?.slice(0, 5) || '08:00',
                end_time: existing?.end_time?.slice(0, 5) || '18:00'
            };
        });
    }
    
    const timeOptions = [];
    for (let h = 6; h <= 22; h++) {
        for (let m = 0; m < 60; m += 30) {
            const time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
            const h12 = h % 12 || 12;
            const ampm = h >= 12 ? 'PM' : 'AM';
            const label = h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
            timeOptions.push({ value: time, label });
        }
    }
    
    return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeAvailabilityEditor()"></div>
        <div class="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">Edit Weekly Schedule</h2>
                <p class="text-sm text-slate-500 mt-1">Set your working hours for each day</p>
            </div>
            <div class="p-6 space-y-4 overflow-y-auto flex-1">
                ${dayNames.map((day, idx) => {
                    const avail = state.editingAvailability[idx];
                    return `
                    <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div class="flex items-center justify-between mb-3">
                            <span class="font-bold text-slate-900 dark:text-white">${day}</span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" ${avail.is_available ? 'checked' : ''} onchange="toggleAvailabilityDay(${idx}, this.checked)" class="sr-only peer"/>
                                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-groomer-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-groomer-primary"></div>
                            </label>
                        </div>
                        ${avail.is_available ? `
                        <div class="flex items-center gap-2">
                            <select onchange="updateAvailabilityTime(${idx}, 'start_time', this.value)" class="flex-1 h-10 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-0 text-sm">
                                ${timeOptions.map(t => `<option value="${t.value}" ${avail.start_time === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
                            </select>
                            <span class="text-slate-400">to</span>
                            <select onchange="updateAvailabilityTime(${idx}, 'end_time', this.value)" class="flex-1 h-10 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-0 text-sm">
                                ${timeOptions.map(t => `<option value="${t.value}" ${avail.end_time === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
                            </select>
                        </div>
                        ` : `
                        <p class="text-sm text-slate-400">Day off</p>
                        `}
                    </div>
                    `;
                }).join('')}
            </div>
            <div class="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3 flex-shrink-0">
                <button onclick="closeAvailabilityEditor()" class="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
                <button onclick="saveAvailability()" class="flex-1 py-3 bg-groomer-primary hover:bg-groomer-primary/90 text-white font-bold rounded-xl">Save Changes</button>
            </div>
        </div>
    </div>
    `;
}

function openAvailabilityEditor() {
    state.editingAvailability = null; // Reset to reload from current state
    state.showAvailabilityEditor = true;
    render();
}

function closeAvailabilityEditor() {
    state.showAvailabilityEditor = false;
    state.editingAvailability = null;
    render();
}

function toggleAvailabilityDay(dayIdx, isAvailable) {
    if (!state.editingAvailability) return;
    state.editingAvailability[dayIdx].is_available = isAvailable;
    render();
}

function updateAvailabilityTime(dayIdx, field, value) {
    if (!state.editingAvailability) return;
    state.editingAvailability[dayIdx][field] = value;
}

async function saveAvailability() {
    if (!state.editingAvailability || !state.currentUser?.id) return;
    
    try {
        const updates = [];
        for (let i = 0; i < 7; i++) {
            const avail = state.editingAvailability[i];
            updates.push({
                groomer_id: state.currentUser.id,
                day_of_week: i,
                is_available: avail.is_available,
                start_time: avail.start_time + ':00',
                end_time: avail.end_time + ':00'
            });
        }
        
        // Upsert all availability records
        const { error } = await supabaseClient
            .from('groomer_availability')
            .upsert(updates, { onConflict: 'groomer_id,day_of_week' });
        
        if (error) throw error;
        
        // Update local state
        state.groomerAvailability = updates;
        closeAvailabilityEditor();
        showToast('Schedule saved successfully', 'success');
    } catch (err) {
        console.error('Failed to save availability:', err);
        showToast('Failed to save schedule', 'error');
    }
}

// Groomer Messages Content - Enhanced with Customer Messaging
function renderGroomerMessagesContent() {
    const messages = state.groomerMessages || [];
    const todayAppts = (state.groomerAppointments || []).filter(a => 
        a.appointment_date === getTodayPacific() && 
        ['pending', 'confirmed', 'in_progress'].includes(a.status)
    );
    
    // Quick message templates
    const quickTemplates = [
        { icon: 'directions_car', text: "I'm on my way! ETA ~15 minutes 🚗", label: "On my way" },
        { icon: 'location_on', text: "I've arrived at your location! 📍", label: "Arrived" },
        { icon: 'schedule', text: "Running about 10-15 minutes late, sorry for the delay!", label: "Running late" },
        { icon: 'check_circle', text: "All done! Your fur baby looks amazing! ✨🐕", label: "All done" },
        { icon: 'help', text: "Quick question about your pet...", label: "Question" }
    ];
    
    // Get conversation header based on active conversation
    const getConversationHeader = () => {
        if (state.activeConversation === 'admin') {
            return { name: 'Admin / Office', icon: 'admin_panel_settings', iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' };
        }
        // Find customer from today's appointments
        const apt = todayAppts.find(a => a.customer_id === state.activeConversation);
        if (apt) {
            return { name: apt.customerName + ' (' + apt.petName + ')', icon: 'person', iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600', phone: apt.customerPhone };
        }
        return { name: 'Unknown', icon: 'person', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' };
    };
    
    const header = state.activeConversation ? getConversationHeader() : null;
    
    return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            <!-- Conversations List -->
            <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                <div class="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 class="font-bold dark:text-white">Conversations</h3>
                </div>
                <div class="flex-1 overflow-y-auto">
                    <!-- Admin Conversation (always shown) -->
                    <button onclick="openConversation('admin')" class="w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 ${state.activeConversation === 'admin' ? 'bg-groomer-primary/10' : ''}">
                        <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span class="material-symbols-outlined text-blue-600">admin_panel_settings</span>
                        </div>
                        <div class="flex-1 text-left">
                            <p class="font-bold dark:text-white">Admin / Office</p>
                            <p class="text-sm text-slate-500 truncate">${getLastMessage('admin') || 'Start a conversation'}</p>
                        </div>
                        ${getUnreadCount('admin') > 0 ? '<span class="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">' + getUnreadCount('admin') + '</span>' : ''}
                    </button>
                    
                    <!-- Today's Customers Section -->
                    ${todayAppts.length > 0 ? `
                    <div class="px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
                        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Customers</p>
                    </div>
                    ${todayAppts.map(apt => `
                    <button onclick="openConversation('${apt.customer_id}')" class="w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 ${state.activeConversation === apt.customer_id ? 'bg-groomer-primary/10' : ''}">
                        <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center overflow-hidden">
                            ${apt.petPhoto ? '<img src="' + apt.petPhoto + '" class="w-full h-full object-cover"/>' : '<span class="material-symbols-outlined text-amber-600">pets</span>'}
                        </div>
                        <div class="flex-1 text-left">
                            <p class="font-bold dark:text-white">${escapeHtml(apt.customerName)}</p>
                            <p class="text-sm text-slate-500 truncate">${apt.petName} • ${formatTime(apt.start_time)}</p>
                        </div>
                        ${apt.status === 'in_progress' ? '<span class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>' : ''}
                    </button>
                    `).join('')}
                    ` : ''}
                </div>
            </div>
            
            <!-- Message Thread -->
            <div class="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                ${state.activeConversation && header ? `
                    <!-- Header -->
                    <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full ${header.iconBg} flex items-center justify-center">
                                <span class="material-symbols-outlined ${header.iconColor}">${header.icon}</span>
                            </div>
                            <div>
                                <p class="font-bold dark:text-white">${escapeHtml(header.name)}</p>
                                <p class="text-xs text-slate-500">${state.activeConversation === 'admin' ? 'Usually responds within minutes' : 'Todays appointment'}</p>
                            </div>
                        </div>
                        ${header.phone ? `
                        <a href="tel:${header.phone}" class="flex items-center gap-2 px-4 py-2 bg-groomer-primary/10 hover:bg-groomer-primary/20 text-groomer-primary rounded-xl font-bold text-sm transition-colors">
                            <span class="material-symbols-outlined text-lg">call</span>
                            Call
                        </a>
                        ` : ''}
                    </div>
                    
                    <!-- Quick Templates (for customers only) -->
                    ${state.activeConversation !== 'admin' ? `
                    <div class="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <p class="text-xs font-bold text-slate-500 mb-2">Quick Messages:</p>
                        <div class="flex flex-wrap gap-2">
                            ${quickTemplates.map(t => `
                            <button onclick="setQuickMessage('${t.text.replace(/'/g, "\\'")}')" class="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-groomer-primary/10 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 transition-colors">
                                <span class="material-symbols-outlined text-sm">${t.icon}</span>
                                ${t.label}
                            </button>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Messages -->
                    <div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-4">
                        ${renderMessageThread(state.activeConversation)}
                    </div>
                    
                    <!-- Input -->
                    <div class="p-4 border-t border-slate-100 dark:border-slate-800">
                        <form onsubmit="sendGroomerMessage(event)" class="flex gap-2 items-center">
                            <input type="file" id="photo-input" accept="image/*" class="hidden" onchange="handlePhotoSelect(this)"/>
                            <button type="button" onclick="document.getElementById('photo-input').click()" class="h-12 w-12 flex-shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors" title="Send photo">
                                <span class="material-symbols-outlined">photo_camera</span>
                            </button>
                            <input type="text" id="message-input" placeholder="${state.activeConversation === 'admin' ? 'Message admin...' : 'Message customer...'}" class="flex-1 h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-groomer-primary" autocomplete="off"/>
                            <button type="submit" class="h-12 px-6 bg-groomer-primary text-white font-bold rounded-xl hover:bg-groomer-primary/90 transition-colors flex items-center gap-2">
                                <span class="material-symbols-outlined">send</span>
                            </button>
                        </form>
                        <div id="photo-preview" class="hidden mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <div class="flex items-center gap-3">
                                <img id="preview-image" class="w-16 h-16 object-cover rounded-lg"/>
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-slate-700 dark:text-slate-300">Photo ready to send</p>
                                    <p class="text-xs text-slate-500">Click send to share with ${state.activeConversation === 'admin' ? 'admin' : 'customer'}</p>
                                </div>
                                <button type="button" onclick="cancelPhotoUpload()" class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <span class="material-symbols-outlined text-slate-400">close</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="flex-1 flex items-center justify-center">
                        <div class="text-center">
                            <span class="material-symbols-outlined text-6xl text-slate-300 mb-4">forum</span>
                            <p class="text-slate-500 mb-2">Select a conversation to start messaging</p>
                            <p class="text-xs text-slate-400">Message admin or today's customers</p>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Set quick message template
function setQuickMessage(text) {
    const input = document.getElementById('message-input');
    if (input) {
        input.value = text;
        input.focus();
    }
}

// Photo upload handling
let pendingPhotoData = null;

function handlePhotoSelect(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be under 5MB', 'error');
        return;
    }
    
    // Read and preview
    const reader = new FileReader();
    reader.onload = (e) => {
        pendingPhotoData = e.target.result;
        const preview = document.getElementById('photo-preview');
        const previewImg = document.getElementById('preview-image');
        if (preview && previewImg) {
            previewImg.src = pendingPhotoData;
            preview.classList.remove('hidden');
        }
    };
    reader.readAsDataURL(file);
}

function cancelPhotoUpload() {
    pendingPhotoData = null;
    const preview = document.getElementById('photo-preview');
    const input = document.getElementById('photo-input');
    if (preview) preview.classList.add('hidden');
    if (input) input.value = '';
}

// Modified sendGroomerMessage to handle photos
async function sendGroomerMessage(event) {
    event.preventDefault();
    const input = document.getElementById('message-input');
    const message = input?.value?.trim();
    
    if (!message && !pendingPhotoData) {
        return;
    }
    
    // Build message content
    let messageContent = message || '';
    if (pendingPhotoData) {
        messageContent = message ? `📷 Photo: ${message}` : '📷 Sent a photo';
    }
    
    try {
        // Try to insert into messages table if messaging admin
        if (state.activeConversation === 'admin' && typeof supabaseClient !== 'undefined') {
            const { error } = await supabaseClient
                .from('messages')
                .insert({
                    sender_id: state.currentUser?.id,
                    message: messageContent,
                    to_admin: true,
                    is_read: false
                });
            
            if (error) {
                _log('Messages table may not exist:', error);
            }
        }
    } catch (err) {
        _log('Could not save to database:', err);
    }
    
    // Add to local state for immediate feedback
    const newMessage = {
        id: 'msg_' + Date.now(),
        conversation_id: state.activeConversation,
        sender_id: state.currentUser?.id,
        message: messageContent,
        photo_url: pendingPhotoData || null,
        is_admin: state.activeConversation === 'admin',
        to_admin: state.activeConversation === 'admin',
        created_at: new Date().toISOString(),
        is_read: true
    };
    
    state.groomerMessages = [...(state.groomerMessages || []), newMessage];
    
    // Clear inputs
    if (input) input.value = '';
    cancelPhotoUpload();
    
    render();
    
    // Scroll to bottom
    setTimeout(() => {
        const container = document.getElementById('messages-container');
        if (container) container.scrollTop = container.scrollHeight;
    }, 100);
}

// Helper functions for messages
function getLastMessage(conversationId) {
    const messages = state.groomerMessages || [];
    const convMessages = messages.filter(m => m.conversation_id === conversationId || (conversationId === 'admin' && m.is_admin));
    if (convMessages.length === 0) return '';
    const last = convMessages[convMessages.length - 1];
    return last.message?.substring(0, 40) + (last.message?.length > 40 ? '...' : '');
}

function getUnreadCount(conversationId) {
    const messages = state.groomerMessages || [];
    return messages.filter(m => (m.conversation_id === conversationId || (conversationId === 'admin' && m.is_admin)) && !m.is_read && m.sender_id !== state.currentUser?.id).length;
}

function renderMessageThread(conversationId) {
    const messages = state.groomerMessages || [];
    const convMessages = messages.filter(m => m.conversation_id === conversationId || (conversationId === 'admin' && (m.is_admin || m.to_admin)));
    
    if (convMessages.length === 0) {
        return `
            <div class="h-full flex items-center justify-center">
                <div class="text-center">
                    <span class="material-symbols-outlined text-5xl text-slate-300 mb-3">chat</span>
                    <p class="text-slate-500">No messages yet. Say hello!</p>
                </div>
            </div>
        `;
    }
    
    return convMessages.map(m => {
        const isMe = m.sender_id === state.currentUser?.id;
        const time = new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return `
            <div class="flex ${isMe ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[70%] ${isMe ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'} rounded-2xl px-4 py-3">
                    ${m.photo_url ? `
                        <img src="${m.photo_url}" class="w-full max-w-[200px] rounded-lg mb-2 cursor-pointer" onclick="window.open('${m.photo_url}', '_blank')"/>
                    ` : ''}
                    <p class="text-sm">${escapeHtml(m.message)}</p>
                    <p class="text-[10px] ${isMe ? 'text-emerald-200' : 'text-slate-400'} mt-1">${time}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Groomer tab and shift functions
function setGroomerTab(tab) {
    state.groomerTab = tab;
    state.mobileTab = null; // Reset mobile tab when changing main tabs
    if (tab === 'messages') {
        state.activeConversation = 'admin';
        loadGroomerMessages();
    }
    render();
}

// Mobile menu functions
function openMobileMenu() {
    state.showMobileMenu = true;
    render();
}

function closeMobileMenu() {
    state.showMobileMenu = false;
    render();
}

// Quick actions menu
function showQuickActions() {
    state.showQuickActions = true;
    render();
}

function closeQuickActions() {
    state.showQuickActions = false;
    render();
}

// =============================================
// PET PROFILE QUICK VIEW
// =============================================
async function openPetProfile(petId, petData = null) {
    showLoading();
    
    try {
        let pet = petData;
        
        // If we don't have full pet data, fetch it
        if (!pet || !pet.id) {
            // Try to find pet from groomer appointments
            const aptWithPet = state.groomerAppointments?.find(a => a.pet_id === petId);
            if (aptWithPet) {
                pet = {
                    id: petId,
                    name: aptWithPet.petName,
                    breed: aptWithPet.petBreed,
                    weight: aptWithPet.petWeight,
                    photo_url: aptWithPet.petPhoto,
                    grooming_notes: aptWithPet.petNotes,
                    owner_name: aptWithPet.customerName,
                    owner_phone: aptWithPet.customerPhone,
                    owner_email: aptWithPet.customerEmail,
                    owner_address: aptWithPet.customerAddress,
                    owner_city: aptWithPet.customerCity
                };
            }
        }
        
        // Get appointment history for this pet
        const petAppointments = (state.groomerAppointments || [])
            .filter(a => a.pet_id === petId || a.petName === pet?.name)
            .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
        
        state.selectedPetProfile = pet;
        state.petAppointmentHistory = petAppointments;
        state.showPetProfile = true;
        
        hideLoading();
        render();
    } catch (err) {
        hideLoading();
        console.error('Error loading pet profile:', err);
        showToast('Failed to load pet profile', 'error');
    }
}

function closePetProfile() {
    state.showPetProfile = false;
    state.selectedPetProfile = null;
    state.petAppointmentHistory = [];
    render();
}

function renderPetProfileModal() {
    if (!state.showPetProfile || !state.selectedPetProfile) return '';
    
    const pet = state.selectedPetProfile;
    const history = state.petAppointmentHistory || [];
    const completedGrooms = history.filter(a => a.status === 'completed');
    const lastGroom = completedGrooms[0];
    
    // Get photos from history
    const photoHistory = completedGrooms
        .filter(a => a.before_photo_url || a.after_photo_url)
        .slice(0, 6);
    
    return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick="closePetProfile()">
        <div class="bg-white dark:bg-surface-dark rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onclick="event.stopPropagation()">
            
            <!-- Header with Pet Photo -->
            <div class="relative bg-gradient-to-br from-groomer-primary to-groomer-primary/80 p-6 text-white">
                <button onclick="closePetProfile()" class="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
                
                <div class="flex items-center gap-4">
                    <div class="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                        ${pet.photo_url || pet.petPhoto ? `<img src="${pet.photo_url || pet.petPhoto}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-5xl">pets</span>`}
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold">${escapeHtml(pet.name || pet.petName || 'Pet')}</h2>
                        <p class="text-white/80">${escapeHtml(pet.breed || pet.petBreed || 'Unknown breed')}</p>
                        ${pet.weight || pet.petWeight ? `<p class="text-white/80 text-sm">${pet.weight || pet.petWeight} lbs</p>` : ''}
                    </div>
                </div>
                
                <!-- Quick Stats -->
                <div class="flex gap-4 mt-4">
                    <div class="flex-1 bg-white/20 rounded-xl p-3 text-center">
                        <p class="text-2xl font-bold">${completedGrooms.length}</p>
                        <p class="text-xs text-white/70">Total Grooms</p>
                    </div>
                    <div class="flex-1 bg-white/20 rounded-xl p-3 text-center">
                        <p class="text-2xl font-bold">${lastGroom ? Math.floor((new Date() - new Date(lastGroom.completed_at || lastGroom.appointment_date)) / (1000 * 60 * 60 * 24)) : '-'}</p>
                        <p class="text-xs text-white/70">Days Since Last</p>
                    </div>
                </div>
            </div>
            
            <!-- Content -->
            <div class="p-6 space-y-5">
                
                <!-- Owner Info -->
                <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Owner</h3>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-bold text-slate-900 dark:text-white">${pet.owner_name || pet.customerName || 'Unknown'}</p>
                            <p class="text-sm text-slate-500">${pet.owner_address || pet.customerAddress || ''}</p>
                        </div>
                        <div class="flex gap-2">
                            ${pet.owner_phone || pet.customerPhone ? `
                                <a href="tel:${pet.owner_phone || pet.customerPhone}" class="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                                    <span class="material-symbols-outlined text-lg">call</span>
                                </a>
                                <a href="sms:${pet.owner_phone || pet.customerPhone}" class="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center">
                                    <span class="material-symbols-outlined text-lg">sms</span>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Quick Text Templates in Pet Profile -->
                    ${pet.owner_phone || pet.customerPhone ? `
                        <div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p class="text-xs font-bold text-slate-400 mb-2">Quick Text</p>
                            <div class="flex flex-wrap gap-2">
                                <a href="sms:${pet.owner_phone || pet.customerPhone}?body=${encodeURIComponent("On my way! Should arrive in about 10 minutes.")}" class="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-green-400 hover:text-green-600 transition-colors">
                                    🚗 On my way
                                </a>
                                <a href="sms:${pet.owner_phone || pet.customerPhone}?body=${encodeURIComponent("I've arrived! Ready when you are.")}" class="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-green-400 hover:text-green-600 transition-colors">
                                    🏠 Arrived
                                </a>
                                <a href="sms:${pet.owner_phone || pet.customerPhone}?body=${encodeURIComponent("Grooming complete! " + (pet.name || pet.petName || "Your fur baby") + " looks amazing. 🐕✨")}" class="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-green-400 hover:text-green-600 transition-colors">
                                    ✅ Done
                                </a>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Grooming Notes & Preferences -->
                <div class="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
                    <h3 class="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">note</span>
                        Grooming Notes
                    </h3>
                    <p class="text-sm text-slate-700 dark:text-slate-300">
                        ${pet.grooming_notes || pet.petNotes || 'No special notes recorded for this pet.'}
                    </p>
                </div>
                
                <!-- Photo Gallery -->
                ${photoHistory.length > 0 ? `
                <div>
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Photo History</h3>
                    <div class="grid grid-cols-3 gap-2">
                        ${photoHistory.map(apt => `
                            ${apt.before_photo_url ? `
                                <div class="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                                    <img src="${apt.before_photo_url}" class="w-full h-full object-cover"/>
                                    <span class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">Before</span>
                                </div>
                            ` : ''}
                            ${apt.after_photo_url ? `
                                <div class="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                                    <img src="${apt.after_photo_url}" class="w-full h-full object-cover"/>
                                    <span class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">After</span>
                                </div>
                            ` : ''}
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Appointment History -->
                <div>
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Appointments</h3>
                    <div class="space-y-2">
                        ${history.slice(0, 5).map(apt => `
                            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div>
                                    <p class="font-medium text-slate-900 dark:text-white text-sm">${apt.serviceName || 'Grooming'}</p>
                                    <p class="text-xs text-slate-500">${formatDate(apt.appointment_date)}</p>
                                </div>
                                <span class="px-2 py-1 text-xs font-bold rounded-full ${
                                    apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    apt.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                                    apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                }">${apt.status}</span>
                            </div>
                        `).join('')}
                        ${history.length === 0 ? `
                            <p class="text-sm text-slate-500 text-center py-4">No appointment history yet</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// =============================================
// QUICK TEXT TEMPLATES
// =============================================
const quickTemplates = [
    { icon: '🚗', text: "On my way! Should arrive in about 10 minutes.", category: 'arrival' },
    { icon: '⏰', text: "Running about 10 minutes late, sorry for the delay!", category: 'delay' },
    { icon: '🏠', text: "I've arrived! Ready when you are.", category: 'arrival' },
    { icon: '✂️', text: "Starting the grooming session now!", category: 'progress' },
    { icon: '🛁', text: "Bath time! Your pup is doing great.", category: 'progress' },
    { icon: '✅', text: "Grooming complete! Your fur baby looks amazing.", category: 'complete' },
    { icon: '📸', text: "Just sent you some photos of the finished groom!", category: 'complete' },
    { icon: '❓', text: "Quick question about today's appointment...", category: 'question' },
    { icon: '📅', text: "Just a reminder about your upcoming appointment!", category: 'reminder' },
    { icon: '🙏', text: "Thank you for choosing Dogfathers Plus!", category: 'thanks' }
];

function toggleQuickTemplates() {
    state.showQuickTemplates = !state.showQuickTemplates;
    render();
}

function selectQuickTemplate(template) {
    const input = document.getElementById('message-input');
    if (input) {
        input.value = template.text;
        input.focus();
    }
    state.showQuickTemplates = false;
    render();
}

function sendQuickTemplate(template) {
    // Send template directly
    const event = { preventDefault: () => {} };
    const input = document.getElementById('message-input');
    if (input) {
        input.value = template.text;
    }
    sendGroomerMessage(event);
    state.showQuickTemplates = false;
}

function startGroomerShift() {
    localStorage.setItem('groomer_shift_start', new Date().toISOString());
    showToast('Shift started! Have a great day! 🚐', 'success');
    render();
}

function endGroomerShift() {
    const start = localStorage.getItem('groomer_shift_start');
    if (start) {
        const duration = Math.floor((new Date() - new Date(start)) / 60000);
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        showToast(`Shift ended! Total time: ${hours}h ${mins}m. Great work! 🎉`, 'success');
    }
    localStorage.removeItem('groomer_shift_start');
    render();
}

function openConversation(conversationId) {
    state.activeConversation = conversationId;
    render();
    // Scroll to bottom of messages
    setTimeout(() => {
        const container = document.getElementById('messages-container');
        if (container) container.scrollTop = container.scrollHeight;
    }, 100);
}

async function loadGroomerMessages() {
    try {
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${state.currentUser.id},recipient_id.eq.${state.currentUser.id}`)
            .order('created_at', { ascending: true });
        
        if (!error && data) {
            state.groomerMessages = data;
            render();
        }
    } catch (err) {
        _log('Messages table may not exist yet');
        state.groomerMessages = [];
    }
}


// Render individual appointment card for groomer (kept for schedule view compatibility)
function renderGroomerAppointmentCard(apt, isUpcoming = false, isCompleted = false) {
    const statusColors = {
        pending: 'bg-amber-100 text-amber-700',
        confirmed: 'bg-blue-100 text-blue-700',
        in_progress: 'bg-purple-100 text-purple-700',
        completed: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700'
    };
    
    const fullAddress = apt.service_address || apt.customerAddress || 'Address not provided';
    const city = apt.service_city || apt.customerCity || '';
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress + (city ? ', ' + city : ''))}`;
    
    // Calculate elapsed time if in progress
    let elapsedTime = '';
    if (apt.status === 'in_progress' && apt.started_at) {
        const started = new Date(apt.started_at);
        const now = new Date();
        const mins = Math.floor((now - started) / 60000);
        elapsedTime = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`;
    }
    
    return `
    <div class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden ${apt.status === 'in_progress' ? 'ring-2 ring-purple-500' : ''}">
        <div class="p-5">
            <!-- Header: Time & Status -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-14 h-14 rounded-xl ${apt.status === 'in_progress' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'} flex items-center justify-center">
                        <span class="material-symbols-outlined text-2xl ${apt.status === 'in_progress' ? 'text-purple-600' : 'text-emerald-600'}">${apt.status === 'in_progress' ? 'timer' : 'schedule'}</span>
                    </div>
                    <div>
                        <p class="text-lg font-bold dark:text-white">${formatTime(apt.start_time)}</p>
                        <p class="text-sm text-slate-500">${isUpcoming ? formatDate(apt.appointment_date) : 'Today'}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${apt.status === 'in_progress' && elapsedTime ? `
                        <span class="px-2 py-1 text-xs font-bold rounded-full bg-purple-500 text-white animate-pulse">
                            ${elapsedTime} elapsed
                        </span>
                    ` : ''}
                    <span class="px-3 py-1 text-xs font-bold rounded-full uppercase ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}">
                        ${apt.status === 'in_progress' ? 'In Progress' : apt.status}
                    </span>
                </div>
            </div>
            
            <!-- Customer & Pet Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- Customer -->
                <div class="bg-slate-50 dark:bg-background-dark rounded-lg p-4">
                    <h4 class="text-xs font-semibold text-slate-400 uppercase mb-2">Customer</h4>
                    <p class="font-bold dark:text-white">${escapeHtml(apt.customerName)}</p>
                    ${apt.customerPhone ? `
                        <a href="tel:${apt.customerPhone}" class="flex items-center gap-1 text-sm text-emerald-600 hover:underline mt-1">
                            <span class="material-symbols-outlined text-sm">call</span>${apt.customerPhone}
                        </a>
                    ` : ''}
                </div>
                
                <!-- Pet -->
                <div class="bg-slate-50 dark:bg-background-dark rounded-lg p-4">
                    <h4 class="text-xs font-semibold text-slate-400 uppercase mb-2">Pet</h4>
                    <div class="flex items-center gap-3">
                        ${apt.petPhoto ? `<img src="${apt.petPhoto}" alt="${apt.petName}" class="w-12 h-12 rounded-lg object-cover"/>` : ''}
                        <div>
                            <p class="font-bold dark:text-white">${apt.petName}</p>
                            <p class="text-sm text-slate-500">${apt.petBreed || 'Unknown breed'}${apt.petWeight ? ' • ' + apt.petWeight + ' lbs' : ''}</p>
                        </div>
                    </div>
                    ${apt.petNotes ? `<p class="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">"${apt.petNotes}"</p>` : ''}
                </div>
            </div>
            
            <!-- Service & Address -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-slate-400">content_cut</span>
                    <div>
                        <p class="font-semibold dark:text-white">${apt.serviceName}</p>
                        <p class="text-sm text-slate-500">${apt.serviceDuration || 60} min • $${apt.total_price || apt.servicePrice || '0'}</p>
                    </div>
                </div>
                <a href="${mapsUrl}" target="_blank" class="flex items-center gap-3 text-emerald-600 hover:text-emerald-700">
                    <span class="material-symbols-outlined">directions</span>
                    <div>
                        <p class="font-semibold">${fullAddress}</p>
                        <p class="text-sm text-slate-500">${city}</p>
                    </div>
                </a>
            </div>
            
            ${apt.customer_notes ? `
                <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-4">
                    <p class="text-sm text-amber-800 dark:text-amber-200">
                        <span class="font-semibold">Customer Notes:</span> ${apt.customer_notes}
                    </p>
                </div>
            ` : ''}
            
            ${apt.groomer_notes ? `
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                    <p class="text-sm text-blue-800 dark:text-blue-200">
                        <span class="font-semibold">Your Notes:</span> ${apt.groomer_notes}
                    </p>
                </div>
            ` : ''}
        </div>
        
        <!-- Action Buttons -->
        ${!isCompleted && apt.status !== 'completed' && apt.status !== 'cancelled' ? `
            <div class="px-5 py-4 bg-slate-50 dark:bg-background-dark border-t border-slate-200 dark:border-border-dark">
                ${apt.status === 'confirmed' ? `
                    <!-- Start Button for confirmed appointments -->
                    <button onclick="startGroomingAppointment('${apt.id}')" 
                        class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <span class="material-symbols-outlined">play_circle</span>
                        Start Appointment
                    </button>
                ` : apt.status === 'in_progress' ? `
                    <!-- Complete Button for in-progress appointments -->
                    <div class="space-y-3">
                        <textarea id="groomer-notes-${apt.id}" placeholder="Add notes (optional): e.g., found tick, recommend shorter cut next time..." 
                            class="w-full h-20 px-4 py-3 rounded-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-sm resize-none"></textarea>
                        <button onclick="openCompleteAppointmentModal('${apt.id}')" 
                            class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <span class="material-symbols-outlined">check_circle</span>
                            Complete & Award Points
                        </button>
                    </div>
                ` : `
                    <!-- Mark Complete for pending (edge case - should go through start first) -->
                    <button onclick="startGroomingAppointment('${apt.id}')" 
                        class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <span class="material-symbols-outlined">check_circle</span>
                        Mark as Completed
                    </button>
                `}
            </div>
        ` : ''}
        
        ${isCompleted && apt.actual_duration_minutes ? `
            <div class="px-5 py-3 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-700">
                <p class="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">timer</span>
                    Duration: ${Math.floor(apt.actual_duration_minutes)} minutes
                </p>
            </div>
        ` : ''}
    </div>`;
}


