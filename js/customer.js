// =============================================
// DOGFATHERS PLUS — CUSTOMER.JS
// =============================================

// =============================================
// PET MANAGEMENT
// =============================================

async function addPet(petData) {
    // Validation safeguard
    if (!petData.name || !petData.name.trim()) {
        showToast('Please enter your pet\'s name', 'error');
        return null;
    }
    const weight = parseFloat(petData.weight);
    if (weight && (weight < 1 || weight > 300)) {
        showToast('Please enter a valid weight (1-300 lbs)', 'error');
        return null;
    }
    
    showLoading();
    const { data, error } = await supabaseClient
        .from('pets')
        .insert({
            owner_id: state.currentUser.id,
            name: petData.name,
            breed: petData.breed,
            weight: weight || null,
            gender: petData.gender,
            age_years: petData.age,
            color: petData.color,
            grooming_notes: petData.notes,
            photo_url: petData.photo,
            is_active: true  // IMPORTANT: Must be true to show up
        })
        .select()
        .single();
    
    hideLoading();
    
    if (error) {
        showToast('Failed to add pet: ' + error.message, 'error');
        return null;
    }
    
    state.pets.push(data);
    showToast(`${petData.name} added successfully!`, 'success');
    render();
    return data;
}

async function updatePet(petId, petData) {
    showLoading();
    const { data, error } = await supabaseClient
        .from('pets')
        .update(petData)
        .eq('id', petId)
        .select()
        .single();
    
    hideLoading();
    
    if (error) {
        showToast('Failed to update pet', 'error');
        return null;
    }
    
    const index = state.pets.findIndex(p => p.id === petId);
    if (index !== -1) state.pets[index] = data;
    showToast('Pet updated!', 'success');
    render();
    return data;
}

// Safe pet deletion with appointment check
async function deletePet(petId) {
    showLoading();
    
    // First check if pet can be deleted
    const { data: checkResult, error: checkError } = await supabaseClient
        .rpc('can_delete_pet', { pet_uuid: petId });
    
    hideLoading();
    
    if (checkError) {
        console.error('Error checking pet deletion:', checkError);
        // Fallback to simple soft delete if function doesn't exist
        await simpleSoftDeletePet(petId);
        return;
    }
    
    // If pet has active appointments, show blocking modal
    if (!checkResult.can_delete) {
        state.petDeletionBlocked = {
            petId: petId,
            petName: state.pets.find(p => p.id === petId)?.name || 'This pet',
            appointments: checkResult.appointments || []
        };
        render();
        return;
    }
    
    // Safe to delete - perform soft delete
    await performPetDeletion(petId);
}

// Fallback simple soft delete (if DB function not available)
async function simpleSoftDeletePet(petId) {
    showLoading();
    const { error } = await supabaseClient
        .from('pets')
        .update({ 
            is_active: false,
            deactivated_at: new Date().toISOString()
        })
        .eq('id', petId);
    
    hideLoading();
    
    if (error) {
        showToast('Failed to delete pet', 'error');
        return;
    }
    
    state.pets = state.pets.filter(p => p.id !== petId);
    showToast('Pet removed', 'success');
    render();
}

// Perform the actual pet deletion after checks pass
async function performPetDeletion(petId) {
    showLoading();
    
    // Try the RPC first, fallback to direct update
    const { data, error } = await supabaseClient
        .rpc('soft_delete_pet', { 
            pet_uuid: petId,
            reason: 'User requested deletion'
        });
    
    if (error) {
        // Fallback to direct update
        _log('soft_delete_pet RPC not available, using direct update');
        await simpleSoftDeletePet(petId);
        return;
    }
    
    hideLoading();
    
    if (!data?.success) {
        console.error('Deletion error:', data?.error);
        showToast(data?.error || 'Failed to delete pet', 'error');
        return;
    }
    
    // Update local state
    state.pets = state.pets.filter(p => p.id !== petId);
    state.petDeletionBlocked = null;
    showToast('Pet removed successfully', 'success');
    render();
}

// Close pet deletion blocked modal
function closePetDeletionBlockedModal() {
    state.petDeletionBlocked = null;
    render();
}

// Render pet deletion blocked modal
function renderPetDeletionBlockedModal() {
    if (!state.petDeletionBlocked) return '';
    
    const { petName, appointments } = state.petDeletionBlocked;
    
    return `
        <div class="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4" onclick="closePetDeletionBlockedModal()">
            <div class="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-md w-full p-6" onclick="event.stopPropagation()">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <span class="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">block</span>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold dark:text-white">Cannot Delete Pet</h3>
                        <p class="text-sm text-text-sub-light dark:text-text-sub-dark">${petName} has upcoming appointments</p>
                    </div>
                </div>
                
                <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
                    <p class="text-sm text-amber-800 dark:text-amber-200 mb-2">
                        <strong>Please cancel these appointments first:</strong>
                    </p>
                    <ul class="space-y-2">
                        ${appointments.map(apt => `
                            <li class="flex items-center justify-between text-sm">
                                <span class="text-amber-700 dark:text-amber-300">
                                    ${new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${apt.time}
                                </span>
                                <span class="px-2 py-0.5 rounded-full text-xs font-medium ${apt.status === 'pending' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'}">
                                    ${apt.status}
                                </span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="closePetDeletionBlockedModal()" class="flex-1 h-11 rounded-lg border border-border-light dark:border-border-dark font-bold hover:bg-background-light dark:hover:bg-background-dark dark:text-white">
                        Got It
                    </button>
                    <button onclick="closePetDeletionBlockedModal(); setTab('appointments');" class="flex-1 h-11 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold">
                        View Appointments
                    </button>
                </div>
            </div>
        </div>
    `;
}

// =============================================
// APPOINTMENT MANAGEMENT
// =============================================

async function createAppointment(appointmentData) {
    showLoading();
    
    // Get pet and service details for storing names directly
    const pet = state.pets.find(p => p.id === appointmentData.petId);
    const service = state.services?.find(s => s.id === appointmentData.serviceId);
    
    _log('Creating appointment:', appointmentData);
    _log('Pet found:', pet);
    _log('Service found:', service);
    
    // Build appointment data - store names directly for reliability
    const appointmentRecord = {
        customer_id: state.currentUser.id,
        pet_id: appointmentData.petId,
        appointment_date: appointmentData.date,
        start_time: appointmentData.time,
        duration_minutes: appointmentData.duration || 120, // Default 2 hours
        service_address: appointmentData.address,
        service_city: appointmentData.city,
        service_state: 'CA',
        service_zip: appointmentData.zip,
        base_price: appointmentData.price,
        total_price: appointmentData.price,
        customer_notes: appointmentData.notes,
        status: 'confirmed' // Auto-confirm since slot was available
    };
    
    // Add coordinates if provided (for smart booking optimization)
    if (appointmentData.latitude && appointmentData.longitude) {
        appointmentRecord.latitude = appointmentData.latitude;
        appointmentRecord.longitude = appointmentData.longitude;
    }
    
    // Auto-assign groomer if provided from smart booking
    if (appointmentData.groomerId && appointmentData.groomerId.length > 10) {
        appointmentRecord.assigned_groomer_id = appointmentData.groomerId;
        _log('Auto-assigning groomer:', appointmentData.groomerId);
    }
    
    // Only add service_id if it's a valid UUID (from actual database)
    // Don't add if it's from fallback data (simple string like '1', '2')
    if (service && appointmentData.serviceId && appointmentData.serviceId.length > 10) {
        appointmentRecord.service_id = appointmentData.serviceId;
    }
    
    const { data, error } = await supabaseClient
        .from('appointments')
        .insert(appointmentRecord)
        .select()
        .single();
    
    if (error) {
        console.error('Appointment creation error:', error);
        hideLoading();
        showToast('Failed to book appointment: ' + error.message, 'error');
        return null;
    }
    
    _log('Appointment created:', data);
    
    // If no coordinates were provided, geocode asynchronously after creation
    if (!appointmentData.latitude && !appointmentData.longitude && data.id) {
        geocodeAndStoreAppointmentLocation(data.id, appointmentData.address, appointmentData.city, appointmentData.zip);
    }
    
    // Note: Loyalty points are awarded when appointment is COMPLETED, not at booking
    // This prevents gaming the system by booking and cancelling
    
    // Add to local state immediately with resolved names
    const newAppointment = {
        ...data,
        petName: pet?.name || 'Pet',
        petBreed: pet?.breed || '',
        serviceName: service?.name || appointmentData.serviceName || 'Grooming',
        customerName: state.currentUser.name || 'Customer'
    };
    state.appointments.unshift(newAppointment);
    
    // Also add to allAppointments if admin is viewing
    if (state.currentUser.role === 'admin') {
        state.allAppointments.unshift(newAppointment);
    }
    
    hideLoading();
    showToast('🎉 Appointment booked successfully! You\'ll earn 50 points when completed.', 'success');
    
    // Notify admins of new booking
    try {
        const dateStr = new Date(appointmentData.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        await notifyAllAdmins(
            'New Booking! 📅',
            `${state.currentUser.name} booked ${pet?.name || 'a pet'} for ${dateStr} at ${appointmentData.time}`,
            'booking_created',
            'appointment',
            data.id
        );
    } catch (notifyErr) {
        _log('Could not send admin notification:', notifyErr);
    }
    
    // Create customer confirmation notification
    try {
        await createNotification(
            state.currentUser.id,
            'Booking Confirmed! 🎉',
            `Your appointment for ${pet?.name || 'your pet'} on ${new Date(appointmentData.date).toLocaleDateString()} is pending confirmation.`,
            'booking_created',
            'appointment',
            data.id
        );
    } catch (notifyErr) {
        _log('Could not create customer notification:', notifyErr);
    }
    
    render();
    return data;
}

async function cancelAppointment(appointmentId, reason = 'No reason provided') {
    showLoading();
    
    // Direct database update (bypasses RPC functions that may not exist)
    const { error } = await supabaseClient
        .from('appointments')
        .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancelled_by: state.currentUser.id,
            cancellation_reason: reason
        })
        .eq('id', appointmentId);
    
    hideLoading();
    
    if (error) {
        showToast('Failed to cancel appointment: ' + error.message, 'error');
        return;
    }
    
    // Reload appointments based on role
    if (state.currentUser.role === 'admin') {
        await loadAdminData();
    } else if (state.currentUser.role === 'groomer') {
        await loadGroomerData(state.currentUser.id);
    } else {
        await loadCustomerData(state.currentUser.id);
    }
    
    showToast('Appointment cancelled', 'info');
    render();
}

// Customer-facing cancel with confirmation and reason
function confirmCancelAppointment(appointmentId) {
    state.cancelAppointmentModal = {
        appointmentId: appointmentId,
        reason: ''
    };
    render();
}

// Render cancel appointment modal with reason dropdown
function renderCancelAppointmentModal() {
    if (!state.cancelAppointmentModal) return '';
    
    const reasons = [
        'Schedule conflict',
        'Pet is sick',
        'Weather concerns',
        'Found alternative service',
        'Financial reasons',
        'Moving/relocating',
        'Other'
    ];
    
    return `
        <div class="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4" onclick="closeCancelAppointmentModal()">
            <div class="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-md w-full p-6" onclick="event.stopPropagation()">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <span class="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">event_busy</span>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold dark:text-white">Cancel Appointment</h3>
                        <p class="text-sm text-text-sub-light dark:text-text-sub-dark">This action cannot be undone</p>
                    </div>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Reason for cancellation
                    </label>
                    <select id="cancel-reason" class="w-full h-11 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark dark:text-white">
                        <option value="">Select a reason...</option>
                        ${reasons.map(r => `<option value="${r}">${r}</option>`).join('')}
                    </select>
                </div>
                
                <div id="cancel-other-reason" class="mb-4 hidden">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Please specify
                    </label>
                    <input type="text" id="cancel-reason-other" placeholder="Enter your reason..." 
                        class="w-full h-11 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark dark:text-white">
                </div>
                
                <div class="flex gap-3">
                    <button onclick="closeCancelAppointmentModal()" class="flex-1 h-11 rounded-lg border border-border-light dark:border-border-dark font-bold hover:bg-background-light dark:hover:bg-background-dark dark:text-white">
                        Keep Appointment
                    </button>
                    <button onclick="submitCancelAppointment()" class="flex-1 h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold">
                        Cancel Appointment
                    </button>
                </div>
            </div>
        </div>

    `;
}

function closeCancelAppointmentModal() {
    state.cancelAppointmentModal = null;
    render();
}

async function submitCancelAppointment() {
    const reasonSelect = document.getElementById('cancel-reason');
    const reasonOther = document.getElementById('cancel-reason-other');
    
    let reason = reasonSelect?.value || 'No reason provided';
    if (reason === 'Other' && reasonOther?.value) {
        reason = reasonOther.value;
    }
    
    if (!reason || reason === '') {
        showToast('Please select a reason for cancellation', 'warning');
        return;
    }
    
    const appointmentId = state.cancelAppointmentModal?.appointmentId;
    state.cancelAppointmentModal = null;
    
    await cancelAppointment(appointmentId, reason);
}

// =============================================
// RIDE-ALONG INQUIRIES
// =============================================
async function inquireRideAlong(packageId, packageName, packagePrice) {
    if (!state.currentUser) {
        showToast('Please log in to inquire about ride-alongs', 'error');
        return;
    }
    
    showConfirm(
        'Inquire About Ride-Along',
        `Would you like to inquire about the "${packageName}" package ($${packagePrice})? We'll contact you to schedule.`,
        async () => {
            showLoading();
            
            try {
                const { data, error } = await supabaseClient
                    .from('ride_along_inquiries')
                    .insert({
                        customer_id: state.currentUser.id,
                        package_id: packageId,
                        status: 'pending',
                        notes: ''
                    })
                    .select()
                    .single();
                
                hideLoading();
                
                if (error) {
                    // If table doesn't exist, show friendly message
                    if (error.code === '42P01') {
                        showToast('Thank you for your interest! Please contact us directly to book.', 'info');
                    } else {
                        console.error('Inquiry error:', error);
                        showToast('Failed to submit inquiry: ' + error.message, 'error');
                    }
                    return;
                }
                
                showToast('🎉 Inquiry submitted! We\'ll contact you soon to schedule.', 'success');
            } catch (err) {
                hideLoading();
                console.error('Inquiry exception:', err);
                showToast('Thank you for your interest! Please contact us directly.', 'info');
            }
        }
    );
}

// =============================================
// LOYALTY REWARDS REDEMPTION
// =============================================
async function redeemReward(rewardId, rewardName, pointsRequired) {
    if (!state.currentUser) {
        showToast('Please log in to redeem rewards', 'error');
        return;
    }
    
    const currentPoints = state.currentUser.loyaltyPoints || 0;
    
    if (currentPoints < pointsRequired) {
        showToast(`You need ${pointsRequired - currentPoints} more points to redeem this reward.`, 'error');
        return;
    }
    
    showConfirm(
        'Redeem Reward',
        `Redeem "${rewardName}" for ${pointsRequired} points? You currently have ${currentPoints} points.`,
        async () => {
            showLoading();
            
            try {
                // First, try to record the redemption
                const { error: redemptionError } = await supabaseClient
                    .from('reward_redemptions')
                    .insert({
                        customer_id: state.currentUser.id,
                        reward_id: rewardId,
                        points_cost: pointsRequired,
                        status: 'pending'
                    });
                
                // If table doesn't exist, just deduct points anyway
                if (redemptionError && redemptionError.code !== '42P01') {
                    console.error('Redemption record error:', redemptionError);
                }
                
                // Deduct points from user's profile
                const newPoints = currentPoints - pointsRequired;
                const { error: updateError } = await supabaseClient
                    .from('profiles')
                    .update({ loyalty_points: newPoints })
                    .eq('id', state.currentUser.id);
                
                hideLoading();
                
                if (updateError) {
                    console.error('Points update error:', updateError);
                    showToast('Failed to redeem: ' + updateError.message, 'error');
                    return;
                }
                
                // Update local state
                state.currentUser.loyaltyPoints = newPoints;
                
                showToast(`🎉 "${rewardName}" redeemed! We'll apply this to your next visit.`, 'success');
                render();
            } catch (err) {
                hideLoading();
                console.error('Redemption exception:', err);
                showToast('Error: ' + err.message, 'error');
            }
        }
    );
}

// Admin: Update appointment status
async function updateAppointmentStatus(appointmentId, status) {
    showLoading();
    
    const updateData = { status };
    if (status === 'confirmed') updateData.confirmed_at = new Date().toISOString();
    if (status === 'completed') updateData.completed_at = new Date().toISOString();
    if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString();
    
    const { error } = await supabaseClient
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);
    
    hideLoading();
    
    if (error) {
        showToast('Failed to update appointment', 'error');
        return;
    }
    
    // Award loyalty points when appointment is COMPLETED
    if (status === 'completed') {
        // Find the appointment to get customer_id
        const appointment = state.allAppointments.find(a => a.id === appointmentId);
        if (appointment && appointment.customer_id) {
            try {
                // Get current customer points
                const { data: customer } = await supabaseClient
                    .from('profiles')
                    .select('loyalty_points')
                    .eq('id', appointment.customer_id)
                    .single();
                
                if (customer) {
                    const newPoints = (customer.loyalty_points || 0) + 50;
                    await supabaseClient
                        .from('profiles')
                        .update({ loyalty_points: newPoints })
                        .eq('id', appointment.customer_id);
                    
                    _log(`Awarded 50 loyalty points to customer ${appointment.customer_id}. New total: ${newPoints}`);
                }
            } catch (pointsErr) {
                console.error('Failed to award loyalty points:', pointsErr);
                // Don't fail the whole operation for points error
            }
        }
    }
    
    await loadAdminData();
    showToast(`Appointment ${status}!${status === 'completed' ? ' Customer earned 50 loyalty points!' : ''}`, 'success');
    render();
}

// Get available time slots for a date
async function getAvailableSlots(date, serviceId) {
    const dayOfWeek = new Date(date).getDay();
    const hours = state.businessHours.find(h => h.day_of_week === dayOfWeek);
    
    if (!hours || hours.is_closed) return [];
    
    // Get existing appointments for that date
    const { data: existingAppts } = await supabaseClient
        .from('appointments')
        .select('start_time, end_time, duration_minutes')
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed', 'in_progress']);
    
    // Get blocked times
    const { data: blocked } = await supabaseClient
        .from('blocked_times')
        .select('start_datetime, end_datetime')
        .gte('start_datetime', `${date}T00:00:00`)
        .lte('end_datetime', `${date}T23:59:59`);
    
    // Generate available slots
    const slots = [];
    let [openHour, openMin] = hours.open_time.split(':').map(Number);
    const [closeHour, closeMin] = hours.close_time.split(':').map(Number);
    
    while (openHour < closeHour || (openHour === closeHour && openMin < closeMin)) {
        const timeStr = `${String(openHour).padStart(2, '0')}:${String(openMin).padStart(2, '0')}`;
        
        // Check if slot is busy
        const isBusy = (existingAppts || []).some(appt => {
            const apptStart = appt.start_time.slice(0, 5);
            return timeStr >= apptStart && timeStr < appt.end_time?.slice(0, 5);
        });
        
        const isBlocked = (blocked || []).some(b => {
            const blockStart = new Date(b.start_datetime).toTimeString().slice(0, 5);
            const blockEnd = new Date(b.end_datetime).toTimeString().slice(0, 5);
            return timeStr >= blockStart && timeStr < blockEnd;
        });
        
        if (!isBusy && !isBlocked) {
            slots.push(timeStr);
        }
        
        // Add 30 minutes
        openMin += 30;
        if (openMin >= 60) {
            openMin = 0;
            openHour++;
        }
    }
    
    return slots;
}


// =============================================
// ONBOARDING FLOW
// =============================================
function renderOnboarding() {
    const step = state.onboardingStep;
    const totalSteps = 3;
    
    return `
    <div class="min-h-screen bg-gradient-to-br from-primary/5 via-background-light to-sky-50 dark:from-background-dark dark:via-background-dark dark:to-slate-900 flex flex-col">
        <!-- Header -->
        <header class="p-4 flex justify-between items-center">
            <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-xl overflow-hidden shadow-md"><img src="${LOGO_MAIN}" alt="Dogfathersplus" class="w-full h-full object-cover"/></div>
                <span class="font-bold text-xl dark:text-white">Dogfathersplus</span>
            </div>
            <button onclick="skipOnboarding()" class="text-sm text-text-sub-light dark:text-text-sub-dark hover:text-primary">Skip for now</button>
        </header>

        <!-- Progress Bar -->
        <div class="px-6 py-4 max-w-2xl mx-auto w-full">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-text-sub-light dark:text-text-sub-dark">Step ${step} of ${totalSteps}</span>
                <span class="text-sm font-medium text-primary">${Math.round((step/totalSteps)*100)}% Complete</span>
            </div>
            <div class="h-2 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-primary to-sky-400 rounded-full transition-all duration-500" style="width: ${(step/totalSteps)*100}%"></div>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 flex items-center justify-center p-6">
            <div class="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                ${step === 1 ? renderOnboardingStep1() : ''}
                ${step === 2 ? renderOnboardingStep2() : ''}
                ${step === 3 ? renderOnboardingStep3() : ''}
            </div>
        </div>
    </div>`;
}

function renderOnboardingStep1() {
    return `
    <div class="p-8">
        <div class="text-center mb-8">
            <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-symbols-outlined text-4xl text-primary">waving_hand</span>
            </div>
            <h1 class="text-3xl font-bold mb-2 dark:text-white">Welcome to Dogfathersplus!</h1>
            <p class="text-text-sub-light dark:text-text-sub-dark">Let's get you set up in just a few steps. First, we need your address for mobile grooming visits.</p>
        </div>

        <form id="onboarding-form-1" class="space-y-4">
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Phone Number *</label>
                <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-sub-light">phone</span>
                    <input type="tel" id="ob-phone" value="${state.onboardingData.phone}" placeholder="(555) 123-4567" 
                        class="w-full h-12 pl-12 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
                </div>
            </div>
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Street Address *</label>
                <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-sub-light">home</span>
                    <input type="text" id="ob-address" value="${state.onboardingData.address}" placeholder="123 Main Street" 
                        class="w-full h-12 pl-12 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold mb-2 dark:text-white">City *</label>
                    <input type="text" id="ob-city" value="${state.onboardingData.city}" placeholder="Los Angeles" 
                        class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2 dark:text-white">ZIP Code *</label>
                    <input type="text" id="ob-zip" value="${state.onboardingData.zip}" placeholder="90001" 
                        class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
                </div>
            </div>

            <div class="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                <span class="material-symbols-outlined text-primary">info</span>
                <p class="text-sm text-text-sub-light dark:text-text-sub-dark">We come to you! Your phone number helps our groomer reach you on appointment day.</p>
            </div>

            <div class="pt-4">
                <button type="submit" class="w-full h-12 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 touch-target transition-all">
                    Continue <span class="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </form>
    </div>`;
}

function renderOnboardingStep2() {
    const popularBreeds = [
        'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'French Bulldog', 'Bulldog',
        'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Boxer',
        'Dachshund', 'Shih Tzu', 'Siberian Husky', 'Great Dane', 'Doberman Pinscher',
        'Chihuahua', 'Maltese', 'Pomeranian', 'Cocker Spaniel', 'Bernese Mountain Dog',
        'Other'
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 25}, (_, i) => currentYear - i);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const showOtherBreed = state.onboardingData.petBreed === 'Other';

    return `
    <div class="p-8">
        <div class="text-center mb-6">
            <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-symbols-outlined text-4xl text-primary">pets</span>
            </div>
            <h1 class="text-3xl font-bold mb-2 dark:text-white">Tell us about your pet!</h1>
            <p class="text-text-sub-light dark:text-text-sub-dark">We'd love to meet your furry friend. This helps us prepare the perfect grooming experience.</p>
        </div>

        <form id="onboarding-form-2" class="space-y-4">
            <!-- Pet Photo Upload -->
            <div class="flex justify-center mb-4">
                <div class="relative">
                    <div id="pet-photo-preview" class="w-28 h-28 rounded-full bg-background-light dark:bg-background-dark border-2 border-dashed border-border-light dark:border-border-dark flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors" onclick="document.getElementById('ob-pet-photo').click()">
                        ${state.onboardingData.petPhoto ? 
                            `<img src="${state.onboardingData.petPhoto}" class="w-full h-full object-cover"/>` : 
                            `<div class="text-center p-2">
                                <span class="material-symbols-outlined text-3xl text-text-sub-light">add_a_photo</span>
                                <p class="text-xs text-text-sub-light mt-1">Add Photo</p>
                            </div>`
                        }
                    </div>
                    <input type="file" id="ob-pet-photo" accept="image/*" class="hidden" onchange="handlePetPhotoUpload(event)">
                    ${state.onboardingData.petPhoto ? `
                    <button type="button" onclick="removePetPhoto()" class="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>` : ''}
                </div>
            </div>

            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Pet's Name *</label>
                <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-sub-light">badge</span>
                    <input type="text" id="ob-pet-name" value="${state.onboardingData.petName}" placeholder="Max" 
                        class="w-full h-12 pl-12 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
                </div>
            </div>

            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Breed *</label>
                <select id="ob-pet-breed" onchange="handleBreedChange(this.value)"
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white appearance-none cursor-pointer" required>
                    <option value="">Select breed...</option>
                    ${popularBreeds.map(breed => `<option value="${breed}" ${state.onboardingData.petBreed === breed ? 'selected' : ''}>${breed}</option>`).join('')}
                </select>
            </div>

            ${showOtherBreed ? `
            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Specify Breed *</label>
                <input type="text" id="ob-pet-breed-other" value="${state.onboardingData.petBreedOther}" placeholder="Enter your dog's breed" 
                    class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
            </div>` : ''}

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold mb-2 dark:text-white">Weight (lbs) *</label>
                    <input type="number" id="ob-pet-weight" value="${state.onboardingData.petWeight}" placeholder="50" min="1" max="300" 
                        class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" required>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2 dark:text-white">Gender</label>
                    <select id="ob-pet-gender"
                        class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
                        <option value="male" ${state.onboardingData.petGender === 'male' ? 'selected' : ''}>Male</option>
                        <option value="female" ${state.onboardingData.petGender === 'female' ? 'selected' : ''}>Female</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Birthday (optional)</label>
                <div class="grid grid-cols-2 gap-4">
                    <select id="ob-pet-birth-month"
                        class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
                        <option value="">Month</option>
                        ${months.map((month, i) => `<option value="${i + 1}" ${state.onboardingData.petBirthMonth == (i + 1) ? 'selected' : ''}>${month}</option>`).join('')}
                    </select>
                    <select id="ob-pet-birth-year"
                        class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white">
                        <option value="">Year</option>
                        ${years.map(year => `<option value="${year}" ${state.onboardingData.petBirthYear == year ? 'selected' : ''}>${year}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-semibold mb-2 dark:text-white">Special Notes (optional)</label>
                <textarea id="ob-pet-notes" placeholder="Any allergies, sensitivities, or special care instructions..." 
                    class="w-full h-20 px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white resize-none">${state.onboardingData.petNotes}</textarea>
            </div>

            <div class="pt-4 flex gap-3">
                <button type="button" onclick="prevOnboardingStep()" class="flex-1 h-12 border border-border-light dark:border-border-dark rounded-lg font-bold hover:bg-background-light dark:hover:bg-background-dark dark:text-white touch-target transition-all">
                    <span class="material-symbols-outlined align-middle">arrow_back</span> Back
                </button>
                <button type="submit" class="flex-1 h-12 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 touch-target transition-all">
                    Continue <span class="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </form>
    </div>`;
}

// Save current onboarding form data to state (prevents data loss on re-render)
function saveOnboardingFormData() {
    // Step 1 fields
    const address = document.getElementById('ob-address');
    const city = document.getElementById('ob-city');
    const zip = document.getElementById('ob-zip');
    if (address) state.onboardingData.address = address.value;
    if (city) state.onboardingData.city = city.value;
    if (zip) state.onboardingData.zip = zip.value;
    
    // Step 2 fields
    const petName = document.getElementById('ob-pet-name');
    const petBreed = document.getElementById('ob-pet-breed');
    const petBreedOther = document.getElementById('ob-pet-breed-other');
    const petWeight = document.getElementById('ob-pet-weight');
    const petGender = document.getElementById('ob-pet-gender');
    const petBirthMonth = document.getElementById('ob-pet-birth-month');
    const petBirthYear = document.getElementById('ob-pet-birth-year');
    const petNotes = document.getElementById('ob-pet-notes');
    
    if (petName) state.onboardingData.petName = petName.value;
    if (petBreed) state.onboardingData.petBreed = petBreed.value;
    if (petBreedOther) state.onboardingData.petBreedOther = petBreedOther.value;
    if (petWeight) state.onboardingData.petWeight = petWeight.value;
    if (petGender) state.onboardingData.petGender = petGender.value;
    if (petBirthMonth) state.onboardingData.petBirthMonth = petBirthMonth.value;
    if (petBirthYear) state.onboardingData.petBirthYear = petBirthYear.value;
    if (petNotes) state.onboardingData.petNotes = petNotes.value;
}

// Handle pet photo upload
function handlePetPhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be less than 5MB', 'error');
            return;
        }
        // Save current form data before re-render
        saveOnboardingFormData();
        
        const reader = new FileReader();
        reader.onload = function(e) {
            state.onboardingData.petPhoto = e.target.result;
            render();
            showToast('Photo uploaded!', 'success');
        };
        reader.readAsDataURL(file);
    }
}

function removePetPhoto() {
    // Save current form data before re-render
    saveOnboardingFormData();
    state.onboardingData.petPhoto = '';
    render();
}

function handleBreedChange(value) {
    // Save current form data before re-render
    saveOnboardingFormData();
    state.onboardingData.petBreed = value;
    if (value !== 'Other') {
        state.onboardingData.petBreedOther = '';
    }
    render();
}

function renderOnboardingStep3() {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const birthDisplay = state.onboardingData.petBirthMonth && state.onboardingData.petBirthYear 
        ? `${months[parseInt(state.onboardingData.petBirthMonth)]} ${state.onboardingData.petBirthYear}` 
        : null;
        
    return `
    <div class="p-8 text-center">
        <div class="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="material-symbols-outlined text-5xl text-green-600 dark:text-green-400">check_circle</span>
        </div>
        <h1 class="text-3xl font-bold mb-2 dark:text-white">You're All Set! 🎉</h1>
        <p class="text-text-sub-light dark:text-text-sub-dark mb-6">Welcome to the Dogfathersplus family! Your account is ready and ${state.onboardingData.petName || 'your pet'} is registered.</p>

        <div class="bg-background-light dark:bg-background-dark rounded-xl p-6 mb-6 text-left">
            <h3 class="font-bold mb-4 dark:text-white flex items-center gap-2"><span class="material-symbols-outlined text-primary">summarize</span>Your Information</h3>
            
            <!-- Pet Card -->
            <div class="flex items-center gap-4 p-4 bg-surface-light dark:bg-surface-dark rounded-xl mb-4 border border-border-light dark:border-border-dark">
                <div class="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                    ${state.onboardingData.petPhoto 
                        ? `<img src="${state.onboardingData.petPhoto}" class="w-full h-full object-cover"/>` 
                        : `<span class="material-symbols-outlined text-3xl text-primary">pets</span>`}
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-lg dark:text-white">${state.onboardingData.petName}</h4>
                    <p class="text-sm text-text-sub-light dark:text-text-sub-dark">${state.onboardingData.petBreed}</p>
                    <div class="flex flex-wrap gap-2 mt-2">
                        <span class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">${state.onboardingData.petWeight} lbs</span>
                        <span class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium capitalize">${state.onboardingData.petGender}</span>
                        ${birthDisplay ? `<span class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">Born ${birthDisplay}</span>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Address -->
            <div class="flex items-start gap-3 text-sm">
                <span class="material-symbols-outlined text-primary">home</span>
                <div>
                    <p class="font-medium dark:text-white">Grooming Address</p>
                    <p class="text-text-sub-light dark:text-text-sub-dark">${state.onboardingData.address}, ${state.onboardingData.city} ${state.onboardingData.zip}</p>
                </div>
            </div>
        </div>

        <div class="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
            <p class="text-sm"><strong class="text-primary">🎁 Welcome Gift:</strong> <span class="text-text-sub-light dark:text-text-sub-dark">You've earned <strong>50 bonus points</strong> for completing your profile!</span></p>
        </div>

        <button onclick="completeOnboarding()" class="w-full h-14 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 touch-target transition-all text-lg">
            Go to Dashboard <span class="material-symbols-outlined">arrow_forward</span>
        </button>
    </div>`;
}

// Onboarding Functions
function startOnboarding() {
    state.showOnboarding = true;
    state.onboardingStep = 1;
    render();
}

function skipOnboarding() {
    state.showOnboarding = false;
    showToast('You can complete your profile later in Settings', 'info');
    render();
}

function prevOnboardingStep() {
    if (state.onboardingStep > 1) {
        state.onboardingStep--;
        render();
    }
}

async function nextOnboardingStep() {
    if (state.onboardingStep === 1) {
        // Save address + phone data
        state.onboardingData.phone = document.getElementById('ob-phone')?.value || '';
        state.onboardingData.address = document.getElementById('ob-address')?.value || '';
        state.onboardingData.city = document.getElementById('ob-city')?.value || '';
        state.onboardingData.zip = document.getElementById('ob-zip')?.value || '';
        
        // Update profile with address + phone
        await supabaseClient
            .from('profiles')
            .update({
                phone: state.onboardingData.phone,
                address: state.onboardingData.address,
                city: state.onboardingData.city,
                zip_code: state.onboardingData.zip
            })
            .eq('id', state.currentUser.id);
        
        state.currentUser.phone = state.onboardingData.phone;
        state.currentUser.address = state.onboardingData.address;
        state.currentUser.city = state.onboardingData.city;
        state.currentUser.zip = state.onboardingData.zip;
        
        state.onboardingStep = 2;
        render();
    } else if (state.onboardingStep === 2) {
        // Save pet data
        state.onboardingData.petName = document.getElementById('ob-pet-name')?.value || '';
        state.onboardingData.petBreed = document.getElementById('ob-pet-breed')?.value || '';
        state.onboardingData.petBreedOther = document.getElementById('ob-pet-breed-other')?.value || '';
        state.onboardingData.petWeight = document.getElementById('ob-pet-weight')?.value || '';
        state.onboardingData.petGender = document.getElementById('ob-pet-gender')?.value || 'male';
        state.onboardingData.petBirthMonth = document.getElementById('ob-pet-birth-month')?.value || '';
        state.onboardingData.petBirthYear = document.getElementById('ob-pet-birth-year')?.value || '';
        state.onboardingData.petNotes = document.getElementById('ob-pet-notes')?.value || '';
        
        // VALIDATION - Check required fields and valid ranges
        if (!state.onboardingData.petName.trim()) {
            showToast('Please enter your pet\'s name', 'error');
            return;
        }
        if (!state.onboardingData.petBreed) {
            showToast('Please select a breed', 'error');
            return;
        }
        const weight = parseFloat(state.onboardingData.petWeight);
        if (!weight || weight < 1 || weight > 300) {
            showToast('Please enter a valid weight (1-300 lbs)', 'error');
            return;
        }
        
        // Determine final breed (use Other input if selected)
        const finalBreed = state.onboardingData.petBreed === 'Other' 
            ? state.onboardingData.petBreedOther 
            : state.onboardingData.petBreed;
        
        // Calculate age if birthday provided
        let ageYears = null;
        if (state.onboardingData.petBirthYear) {
            const birthYear = parseInt(state.onboardingData.petBirthYear);
            ageYears = new Date().getFullYear() - birthYear;
        }
        
        showLoading();
        
        // Create pet in database
        const petData = {
            owner_id: state.currentUser.id,
            name: state.onboardingData.petName,
            breed: finalBreed,
            weight: weight,
            gender: state.onboardingData.petGender,
            grooming_notes: state.onboardingData.petNotes,
            is_active: true
        };
        
        // Add optional fields
        if (ageYears !== null) petData.age_years = ageYears;
        if (state.onboardingData.petBirthMonth) petData.birth_month = parseInt(state.onboardingData.petBirthMonth);
        if (state.onboardingData.petBirthYear) petData.birth_year = parseInt(state.onboardingData.petBirthYear);
        if (state.onboardingData.petPhoto) petData.photo_url = state.onboardingData.petPhoto;
        
        _log('Creating pet:', petData);
        
        const { data: pet, error } = await supabaseClient
            .from('pets')
            .insert(petData)
            .select()
            .single();
        
        if (error) {
            console.error('Failed to create pet:', error);
            hideLoading();
            showToast('Failed to add pet: ' + error.message, 'error');
            return;
        }
        
        if (pet) {
            _log('Pet created successfully:', pet);
            state.pets.push(pet);
        }
        
        // Add 50 bonus points
        await supabaseClient
            .from('profiles')
            .update({ loyalty_points: (state.currentUser.loyaltyPoints || 0) + 50 })
            .eq('id', state.currentUser.id);
        
        state.currentUser.loyaltyPoints = (state.currentUser.loyaltyPoints || 0) + 50;
        
        // Store final breed for display
        state.onboardingData.petBreed = finalBreed;
        
        hideLoading();
        state.onboardingStep = 3;
        render();
    }
}

async function completeOnboarding() {
    state.showOnboarding = false;
    showToast('Welcome to Dogfathersplus! 🎉', 'success');
    render();
}


function renderCustomerDashboard() {
    const user = state.currentUser;
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'home' },
        { id: 'pets', label: 'My Pets', icon: 'pets' },
        { id: 'appointments', label: 'Appointments', icon: 'calendar_month' },
        { id: 'rewards', label: 'Rewards', icon: 'loyalty' },
        { id: 'store', label: 'Store', icon: 'storefront' },
        { id: 'ridealongs', label: 'Ride-Alongs', icon: 'directions_car' },
        { id: 'education', label: 'Academy', icon: 'school' }
    ];
    const isFullWidth = ['store', 'ridealongs', 'education'].includes(state.currentTab);

    // PWA Install Banner (only shown when install is available)
    const installBanner = state.showInstallPrompt && !state.isPWA ? `
    <div class="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-50 bg-gradient-to-r from-primary to-sky-600 text-white p-4 rounded-2xl shadow-2xl shadow-primary/30 flex items-center gap-3 safe-bottom">
        <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-2xl">install_mobile</span>
        </div>
        <div class="flex-1 min-w-0">
            <p class="font-bold text-sm">Install Dogfathers Plus</p>
            <p class="text-xs text-white/80">Add to home screen for the best experience</p>
        </div>
        <button onclick="installPWA()" class="px-3 py-2 bg-white text-primary font-bold text-xs rounded-lg hover:bg-white/90 transition-colors flex-shrink-0">Install</button>
        <button onclick="state.showInstallPrompt = false; render();" class="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <span class="material-symbols-outlined text-lg">close</span>
        </button>
    </div>` : '';

    return `
    ${installBanner}
    <header class="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between safe-top">
        <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg overflow-hidden"><img src="${LOGO_MAIN}" alt="Dogfathersplus" class="w-full h-full object-cover"/></div><span class="font-bold text-lg dark:text-white">Dogfathersplus</span></div>
        <div class="flex items-center gap-1">
            <button onclick="toggleNotifications()" class="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-lg touch-target relative" title="Notifications">
                <span class="material-symbols-outlined">notifications</span>
                ${state.unreadNotifications > 0 ? `<span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">${state.unreadNotifications > 9 ? '9+' : state.unreadNotifications}</span>` : ''}
            </button>
            <button onclick="refreshData()" class="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-lg touch-target" title="Refresh"><span class="material-symbols-outlined">refresh</span></button>
            <button onclick="toggleDarkMode()" class="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-lg touch-target"><span class="material-symbols-outlined">${state.darkMode ? 'light_mode' : 'dark_mode'}</span></button>
            <button onclick="toggleMobileMenu()" class="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-lg touch-target"><span class="material-symbols-outlined">${state.showMobileMenu ? 'close' : 'menu'}</span></button>
        </div>
    </header>
    ${state.showMobileMenu ? `
    <div class="lg:hidden fixed inset-0 z-40 bg-black/50" onclick="toggleMobileMenu()">
        <div class="absolute left-0 top-0 bottom-0 w-72 bg-surface-light dark:bg-surface-dark shadow-xl" onclick="event.stopPropagation()">
            <div class="p-6 border-b border-border-light dark:border-border-dark flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl overflow-hidden"><img src="${LOGO_MAIN}" alt="Dogfathersplus" class="w-full h-full object-cover"/></div>
                <div><p class="font-bold dark:text-white">${user.name}</p><p class="text-sm text-text-sub-light dark:text-text-sub-dark">${user.loyaltyPoints} pts</p></div>
            </div>
            <nav class="p-4">${navItems.map(i => `<button onclick="setTab('${i.id}')" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left mb-1 touch-target ${state.currentTab === i.id ? 'bg-primary text-white' : 'hover:bg-background-light dark:hover:bg-background-dark dark:text-white'}"><span class="material-symbols-outlined">${i.icon}</span>${i.label}</button>`).join('')}</nav>
            <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-border-light dark:border-border-dark safe-bottom">
                <button onclick="toggleDarkMode()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark dark:text-white mb-1 touch-target"><span class="material-symbols-outlined">${state.darkMode ? 'light_mode' : 'dark_mode'}</span>${state.darkMode ? 'Light Mode' : 'Dark Mode'}</button>
                <button onclick="openChangePassword()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark dark:text-white mb-1 touch-target"><span class="material-symbols-outlined">password</span>Change Password</button>
                <button onclick="logout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 touch-target"><span class="material-symbols-outlined">logout</span>Sign Out</button>
            </div>
        </div>
    </div>` : ''}
    <div class="flex min-h-screen">
        <aside class="hidden lg:flex lg:flex-col w-72 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark fixed left-0 top-0 bottom-0 z-40">
            <div class="p-6 border-b border-border-light dark:border-border-dark">
                <div class="flex items-center gap-3 mb-6"><div class="w-10 h-10 rounded-xl overflow-hidden shadow-md"><img src="${LOGO_MAIN}" alt="Dogfathersplus" class="w-full h-full object-cover"/></div><span class="font-bold text-xl dark:text-white">Dogfathersplus</span></div>
                <div class="flex items-center gap-3 p-3 bg-background-light dark:bg-background-dark rounded-xl cursor-pointer hover:bg-border-light dark:hover:bg-border-dark transition-colors" onclick="openEditModal('profile', state.currentUser)">
                    <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">${user.name?.charAt(0) || 'U'}</div>
                    <div class="flex-1"><p class="font-semibold dark:text-white">${user.name}</p><p class="text-sm text-text-sub-light dark:text-text-sub-dark">${user.loyaltyPoints} pts</p></div>
                    <span class="material-symbols-outlined text-text-sub-light text-sm">edit</span>
                </div>
            </div>
            <nav class="flex-1 p-4 overflow-y-auto">${navItems.map(i => `<button onclick="setTab('${i.id}')" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left mb-1 touch-target ${state.currentTab === i.id ? 'bg-primary text-white' : 'hover:bg-background-light dark:hover:bg-background-dark dark:text-white'}"><span class="material-symbols-outlined">${i.icon}</span>${i.label}</button>`).join('')}</nav>
            <div class="p-4 border-t border-border-light dark:border-border-dark">
                <button onclick="refreshData()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark dark:text-white mb-1 touch-target"><span class="material-symbols-outlined">refresh</span>Refresh Data</button>
                <button onclick="toggleDarkMode()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark dark:text-white mb-1 touch-target"><span class="material-symbols-outlined">${state.darkMode ? 'light_mode' : 'dark_mode'}</span>${state.darkMode ? 'Light Mode' : 'Dark Mode'}</button>
                <button onclick="openChangePassword()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark dark:text-white mb-1 touch-target"><span class="material-symbols-outlined">password</span>Change Password</button>
                <button onclick="logout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 touch-target"><span class="material-symbols-outlined">logout</span>Sign Out</button>
            </div>
        </aside>
        <main class="flex-1 lg:ml-72 pt-16 lg:pt-0 pb-24 lg:pb-8 bg-background-light dark:bg-background-dark min-h-screen safe-bottom overflow-x-hidden"><div class="${isFullWidth ? '' : 'p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto'}">${renderCustomerContent()}</div></main>
    </div>
    
    <!-- #1 Mobile Bottom Tab Bar -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-border-light dark:border-border-dark safe-bottom">
        <div class="flex items-center justify-around h-16 px-1">
            <button onclick="setTab('dashboard')" class="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${state.currentTab === 'dashboard' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}">
                <span class="material-symbols-outlined text-xl ${state.currentTab === 'dashboard' ? 'fill-1' : ''}">home</span>
                <span class="text-[10px] font-bold mt-0.5">Home</span>
            </button>
            <button onclick="setTab('pets')" class="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${state.currentTab === 'pets' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}">
                <span class="material-symbols-outlined text-xl ${state.currentTab === 'pets' ? 'fill-1' : ''}">pets</span>
                <span class="text-[10px] font-bold mt-0.5">Pets</span>
            </button>
            <div class="relative -mt-6">
                <button onclick="openBookingModal()" class="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/40 active:scale-95 transition-transform">
                    <span class="material-symbols-outlined text-2xl">calendar_add_on</span>
                </button>
            </div>
            <button onclick="setTab('appointments')" class="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${state.currentTab === 'appointments' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}">
                <span class="material-symbols-outlined text-xl ${state.currentTab === 'appointments' ? 'fill-1' : ''}">calendar_month</span>
                <span class="text-[10px] font-bold mt-0.5">Appts</span>
            </button>
            <button onclick="setTab('rewards')" class="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all relative ${state.currentTab === 'rewards' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}">
                <span class="material-symbols-outlined text-xl ${state.currentTab === 'rewards' ? 'fill-1' : ''}">loyalty</span>
                <span class="text-[10px] font-bold mt-0.5">Rewards</span>
            </button>
        </div>
    </nav>
    
    ${state.showBookingModal ? renderBookingModal() : ''}
    ${state.editModal ? renderEditModal() : ''}
    ${state.confirmDialog ? renderConfirmDialog() : ''}
    ${state.petDeletionBlocked ? renderPetDeletionBlockedModal() : ''}
    ${state.cancelAppointmentModal ? renderCancelAppointmentModal() : ''}
    ${state.showNotifications ? renderNotificationsPanel() : ''}`;
}

// #16 Skeleton loading states
function renderCustomerSkeleton() {
    return `
        <!-- Hero Skeleton -->
        <div class="rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 bg-slate-200 dark:bg-slate-700 p-4 sm:p-6 lg:p-8 animate-pulse">
            <div class="h-6 w-48 skeleton mb-3 rounded"></div>
            <div class="h-4 w-64 skeleton mb-6 rounded"></div>
            <div class="h-16 skeleton rounded-xl mb-4"></div>
            <div class="h-12 w-48 skeleton rounded-xl"></div>
        </div>
        <!-- Stat Cards Skeleton -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            ${[1,2,3,4].map(() => `<div class="bg-surface-light dark:bg-surface-dark rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-3"><div class="w-10 h-10 skeleton rounded-xl"></div><div><div class="h-6 w-8 skeleton rounded mb-1"></div><div class="h-3 w-12 skeleton rounded"></div></div></div>`).join('')}
        </div>
        <!-- Pet Cards Skeleton -->
        <div class="bg-surface-light dark:bg-surface-dark rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div class="h-5 w-24 skeleton rounded mb-4"></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${[1,2].map(() => `<div class="bg-background-light dark:bg-background-dark rounded-xl p-4"><div class="flex gap-4"><div class="w-16 h-16 skeleton rounded-2xl flex-shrink-0"></div><div class="flex-1"><div class="h-5 w-24 skeleton rounded mb-2"></div><div class="h-3 w-32 skeleton rounded mb-3"></div><div class="h-6 w-28 skeleton rounded-full"></div></div></div></div>`).join('')}
            </div>
        </div>
    `;
}

function renderCustomerContent() {
    const user = state.currentUser;
    const pets = state.pets || [];
    const appointments = state.appointments || [];
    
    // Show skeleton while initial data loads
    if (state.currentTab === 'dashboard' && state.loading && pets.length === 0 && appointments.length === 0) {
        return renderCustomerSkeleton();
    }
    
    // Categorize appointments
    const upcomingAppointments = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
    const inProgressAppointments = appointments.filter(a => a.status === 'in_progress');
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const nextAppt = upcomingAppointments[0];
    const activeAppt = inProgressAppointments[0];
    
    // Time-based greeting for customer
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙';
    let countdownDays = 0;
    if (nextAppt && nextAppt.appointment_date) {
        const apptDate = new Date(nextAppt.appointment_date + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = apptDate - today;
        countdownDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (countdownDays === 0) countdownText = 'Today!';
        else if (countdownDays === 1) countdownText = 'Tomorrow';
        else if (countdownDays > 0) countdownText = `In ${countdownDays} days`;
        else countdownText = '';
    }
    
    // Calculate "last groomed" for each pet
    const getPetLastGroom = (petId) => {
        const petGrooms = completedAppointments.filter(a => a.pet_id === petId);
        if (petGrooms.length === 0) return null;
        // Sort by date descending
        petGrooms.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
        const lastGroom = petGrooms[0];
        const lastDate = new Date(lastGroom.appointment_date || lastGroom.completed_at);
        const daysSince = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
        return { date: lastDate, daysSince, weeksSince: Math.floor(daysSince / 7) };
    };
    
    // Business phone number (you can make this configurable)
    const businessPhone = '(626) 863-6926';
    const businessPhoneClean = businessPhone.replace(/\D/g, '');
    
    // Contextual subtitle for greeting
    let contextSubtitle = '';
    if (activeAppt) {
        contextSubtitle = `${activeAppt.petName || 'Your pet'} is being pampered right now! ✨`;
    } else if (nextAppt && countdownDays === 0) {
        contextSubtitle = `${nextAppt.petName || 'Your pet'}'s groom is today! 🎉`;
    } else if (nextAppt && countdownDays === 1) {
        contextSubtitle = `${nextAppt.petName || 'Your pet'}'s groom is tomorrow!`;
    } else if (nextAppt && countdownDays <= 3) {
        contextSubtitle = `${nextAppt.petName || 'Your pet'}'s groom is in ${countdownDays} days`;
    } else {
        const oldestUngroomed = pets.find(p => { const lg = getPetLastGroom(p.id); return lg && lg.weeksSince >= 6 && !upcomingAppointments.some(a => a.pet_id === p.id); });
        if (oldestUngroomed) {
            contextSubtitle = `${oldestUngroomed.name} is due for a groom — book today! 🐾`;
        } else if (pets.length > 0) {
            contextSubtitle = `Your ${pets.length === 1 ? 'pup looks' : 'pups look'} great! ${user.loyaltyPoints || 0} loyalty points earned 🏆`;
        } else {
            contextSubtitle = 'Add your first pet to get started! 🐕';
        }
    }

    if (state.currentTab === 'dashboard') {
        return `
        <!-- #1 HERO SECTION - Prominent Book Now + Phone + Countdown -->
        <div class="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 bg-gradient-to-br from-primary via-sky-500 to-cyan-400 p-4 sm:p-6 lg:p-8 text-white shadow-xl shadow-primary/20 animate-fade-in-up">
            <!-- Background Pattern -->
            <div class="absolute inset-0 opacity-10">
                <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <pattern id="paw-customer" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
                            <circle cx="6" cy="6" r="2.5" fill="currentColor"/>
                            <circle cx="12" cy="4" r="2" fill="currentColor"/>
                            <circle cx="17" cy="7" r="2" fill="currentColor"/>
                            <circle cx="10" cy="12" r="2" fill="currentColor"/>
                        </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#paw-customer)"/>
                </svg>
            </div>
            
            <div class="relative z-10">
                <!-- Top Row: Greeting & Phone -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div class="flex items-center gap-2">
                        <span class="text-xl sm:text-2xl">${greetingEmoji}</span>
                        <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold">${timeGreeting}, ${user.name?.split(' ')[0] || 'there'}!</h1>
                    </div>
                    ${contextSubtitle ? `<p class="text-white/80 text-xs sm:text-sm mt-1 lg:hidden">${contextSubtitle}</p>` : ''}
                    <a href="tel:${businessPhoneClean}" class="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2 rounded-full transition-colors text-xs sm:text-sm font-bold self-start sm:self-auto">
                        <span class="material-symbols-outlined text-base sm:text-lg">call</span>
                        <span class="hidden sm:inline">${businessPhone}</span>
                        <span class="sm:hidden">Call Us</span>
                    </a>
                </div>
                
                <!-- Appointment Status -->
                ${activeAppt ? `
                    <!-- PET IN PROGRESS -->
                    <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center">
                                <span class="material-symbols-outlined text-2xl animate-pulse">content_cut</span>
                            </div>
                            <div class="flex-1">
                                <p class="font-bold text-lg">${activeAppt.petName || 'Your pet'} is being groomed! 🐕</p>
                                <p class="text-white/80 text-sm">${activeAppt.serviceName || 'Grooming'}</p>
                            </div>
                        </div>
                        ${activeAppt.started_at ? `
                            <div class="mb-2">
                                <div class="flex justify-between text-xs mb-1">
                                    <span>In Progress</span>
                                    <span>${Math.floor((new Date() - new Date(activeAppt.started_at)) / 60000)} min elapsed</span>
                                </div>
                                <div class="h-2 bg-white/30 rounded-full overflow-hidden">
                                    <div class="h-full bg-white rounded-full animate-pulse" style="width: ${Math.min(Math.round(((new Date() - new Date(activeAppt.started_at)) / 60000) / (activeAppt.duration_minutes || 60) * 100), 95)}%"></div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : nextAppt ? `
                    <!-- NEXT APPOINTMENT COUNTDOWN -->
                    <div class="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4">
                        <div class="flex flex-col gap-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/30 flex items-center justify-center flex-shrink-0">
                                    <span class="material-symbols-outlined text-xl sm:text-2xl">event</span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-white/80 text-xs sm:text-sm">Next appointment ${countdownText ? `• ${countdownText}` : ''}</p>
                                    <p class="font-bold text-base sm:text-lg truncate">${nextAppt.petName || 'Pet'} • ${nextAppt.serviceName || 'Grooming'}</p>
                                    <p class="text-white/80 text-xs sm:text-sm">${formatDate(nextAppt.appointment_date)} at ${formatTime(nextAppt.start_time)}</p>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="confirmCancelAppointment('${nextAppt.id}')" class="flex-1 sm:flex-initial px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-bold transition-colors min-h-[40px]">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ` : `
                    <!-- NO APPOINTMENTS -->
                    <p class="text-white/80 mb-4">You don't have any upcoming appointments. Book one today!</p>
                `}
                
                <!-- Primary CTA Buttons -->
                <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button onclick="openBookingModal()" class="flex-1 bg-white text-primary font-bold px-4 sm:px-6 py-3 sm:py-4 rounded-xl hover:bg-white/90 flex items-center justify-center gap-2 shadow-lg shadow-black/10 transition-all hover:scale-[1.02] min-h-[48px]">
                        <span class="material-symbols-outlined text-xl sm:text-2xl">calendar_add_on</span>
                        <span class="text-base sm:text-lg">Book Appointment</span>
                    </button>
                    ${nextAppt ? `
                        <button onclick="setTab('appointments')" class="px-4 sm:px-6 py-3 sm:py-4 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors min-h-[48px]">
                            <span class="material-symbols-outlined">visibility</span>
                            <span class="hidden sm:inline">View Details</span>
                            <span class="sm:hidden">Details</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <!-- #6 CONDENSED STAT CARDS (4 cards including loyalty) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6 animate-fade-in animate-delay-100">
            <div class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-primary text-lg sm:text-base">pets</span>
                </div>
                <div>
                    <p class="text-lg sm:text-2xl font-bold dark:text-white">${pets.length}</p>
                    <p class="text-[10px] sm:text-xs text-text-sub-light dark:text-text-sub-dark">Pets</p>
                </div>
            </div>
            <div class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-lg sm:text-base">check_circle</span>
                </div>
                <div>
                    <p class="text-lg sm:text-2xl font-bold dark:text-white">${completedAppointments.length}</p>
                    <p class="text-[10px] sm:text-xs text-text-sub-light dark:text-text-sub-dark">Grooms</p>
                </div>
            </div>
            <div class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg sm:text-base">calendar_month</span>
                </div>
                <div>
                    <p class="text-lg sm:text-2xl font-bold dark:text-white">${upcomingAppointments.length}</p>
                    <p class="text-[10px] sm:text-xs text-text-sub-light dark:text-text-sub-dark">Upcoming</p>
                </div>
            </div>
            <button onclick="setTab('rewards')" class="bg-gradient-to-br from-primary to-sky-600 text-white rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:shadow-lg transition-all text-left">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-lg sm:text-base">loyalty</span>
                </div>
                <div>
                    <p class="text-lg sm:text-2xl font-bold">${user.loyaltyPoints || 0}</p>
                    <p class="text-[10px] sm:text-xs text-white/80">Points</p>
                </div>
            </button>
        </div>

        <!-- #7 MY PETS with Visual Status Cards -->
        <div class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in animate-delay-200">
            <div class="flex justify-between items-center mb-3 sm:mb-4">
                <h3 class="text-base sm:text-lg font-bold flex items-center gap-2 dark:text-white">
                    <span class="material-symbols-outlined text-primary text-lg sm:text-base">pets</span>My Pets
                </h3>
                <div class="flex gap-2">
                    <button onclick="openEditModal('pet', {})" class="text-primary text-xs sm:text-sm font-medium hover:underline flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs sm:text-sm">add</span>Add Pet
                    </button>
                </div>
            </div>
            
            ${pets.length > 0 ? `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    ${pets.map(pet => {
                        const lastGroom = getPetLastGroom(pet.id);
                        const needsGroom = lastGroom && lastGroom.weeksSince >= 6;
                        const hasUpcoming = upcomingAppointments.some(a => a.pet_id === pet.id);
                        const isInProgress = inProgressAppointments.some(a => a.pet_id === pet.id);
                        
                        // Status banner config
                        let bannerClass, bannerIcon, bannerText;
                        if (isInProgress) {
                            bannerClass = 'bg-purple-500 text-white';
                            bannerIcon = 'content_cut';
                            bannerText = 'Being Groomed Now ✨';
                        } else if (hasUpcoming) {
                            const apt = upcomingAppointments.find(a => a.pet_id === pet.id);
                            bannerClass = 'bg-green-500 text-white';
                            bannerIcon = 'event';
                            bannerText = 'Scheduled ' + (apt ? formatDate(apt.appointment_date) : '');
                        } else if (needsGroom) {
                            bannerClass = 'bg-amber-500 text-white';
                            bannerIcon = 'warning';
                            bannerText = 'Due for Groom (' + lastGroom.weeksSince + ' wks)';
                        } else if (lastGroom) {
                            bannerClass = 'bg-slate-400 dark:bg-slate-600 text-white';
                            bannerIcon = 'check_circle';
                            bannerText = 'Groomed ' + lastGroom.weeksSince + ' weeks ago';
                        } else {
                            bannerClass = 'bg-slate-300 dark:bg-slate-600 text-white';
                            bannerIcon = 'info';
                            bannerText = 'New Pet — No History';
                        }
                        
                        return `
                        <div class="bg-background-light dark:bg-background-dark rounded-xl sm:rounded-2xl overflow-hidden ${needsGroom && !hasUpcoming ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-slate-900' : ''} hover:shadow-md transition-all">
                            <!-- Status Banner -->
                            <div class="${bannerClass} px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold">
                                <span class="material-symbols-outlined text-xs">${bannerIcon}</span>
                                ${bannerText}
                            </div>
                            <div class="p-3 sm:p-4">
                                <div class="flex items-center gap-3 sm:gap-4">
                                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-cover bg-center border-2 border-primary/20 shadow-lg flex-shrink-0" style="background-image: url('${pet.photo_url || 'https://via.placeholder.com/150'}')"></div>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-bold text-lg sm:text-xl dark:text-white truncate">${escapeHtml(pet.name)}</p>
                                        <p class="text-xs sm:text-sm text-text-sub-light dark:text-text-sub-dark truncate">${pet.breed || 'Unknown breed'} • ${pet.weight || '?'} lbs</p>
                                        
                                        ${!hasUpcoming && !isInProgress ? `
                                            <button onclick="openBookingModalForPet('${pet.id}')" class="mt-2 sm:mt-3 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1 transition-colors min-h-[36px]">
                                                <span class="material-symbols-outlined text-xs sm:text-sm">calendar_add_on</span>
                                                Book ${escapeHtml(pet.name)}
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            ` : `
                <div class="text-center py-8">
                    <div class="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                        <span class="material-symbols-outlined text-3xl text-primary">pets</span>
                    </div>
                    <p class="text-text-sub-light dark:text-text-sub-dark mb-4">No pets added yet</p>
                    <button onclick="openEditModal('pet', {})" class="bg-primary text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 mx-auto">
                        <span class="material-symbols-outlined">add</span>Add Your First Pet
                    </button>
                </div>
            `}
        </div>
        
        <!-- #10 Quick Profile Card -->
        <div class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg sm:rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 animate-fade-in animate-delay-300">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">${user.name?.charAt(0) || 'U'}</div>
                    <div>
                        <p class="font-bold dark:text-white">${user.name}</p>
                        <p class="text-xs text-text-sub-light dark:text-text-sub-dark">${user.email || ''}</p>
                        <p class="text-xs text-text-sub-light dark:text-text-sub-dark">${user.phone || 'No phone added'} • ${user.address ? user.address + (user.city ? ', ' + user.city : '') : 'No address'}</p>
                    </div>
                </div>
                <button onclick="openEditModal('profile', state.currentUser)" class="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-lg text-text-sub-light hover:text-primary transition-colors" title="Edit Profile">
                    <span class="material-symbols-outlined">edit</span>
                </button>
            </div>
        </div>
        
        <!-- #9 Contextual Promotional Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 animate-fade-in animate-delay-400">
            <button onclick="setTab('ridealongs')" class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-left text-white hover:shadow-lg hover:scale-[1.02] transition-all group">
                <span class="material-symbols-outlined text-2xl mb-2 opacity-80">directions_car</span>
                <p class="font-bold text-sm sm:text-base">Learn to Groom at Home</p>
                <p class="text-[10px] sm:text-xs text-white/70 mt-1">Shadow a pro groomer on a real appointment</p>
            </button>
            <button onclick="setTab('education')" class="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-left text-white hover:shadow-lg hover:scale-[1.02] transition-all group">
                <span class="material-symbols-outlined text-2xl mb-2 opacity-80">school</span>
                <p class="font-bold text-sm sm:text-base">Grooming Academy</p>
                <p class="text-[10px] sm:text-xs text-white/70 mt-1">Tips to maintain your pup's coat between grooms</p>
            </button>
            <button onclick="setTab('store')" class="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-left text-white hover:shadow-lg hover:scale-[1.02] transition-all group">
                <span class="material-symbols-outlined text-2xl mb-2 opacity-80">storefront</span>
                <p class="font-bold text-sm sm:text-base">${pets.length > 0 ? 'Products for ' + pets[0].name : 'Shop Grooming Tools'}</p>
                <p class="text-[10px] sm:text-xs text-white/70 mt-1">Curated picks by the Dogfathers team</p>
            </button>
        </div>
        `;
    }

    if (state.currentTab === 'pets') {
        // Store pets for editing
        pets.forEach((pet, i) => { state.editItems['pet_' + i] = {...pet}; });
        return `<div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8"><div><h1 class="text-2xl sm:text-3xl font-bold mb-2 dark:text-white">My Pets</h1><p class="text-text-sub-light dark:text-text-sub-dark text-sm sm:text-base">Manage your furry family</p></div><button onclick="openEditModal('pet', {})" class="bg-primary text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"><span class="material-symbols-outlined">add</span>Add Pet</button></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">${pets.length > 0 ? pets.map((pet, i) => `<div class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-4 sm:p-6"><div class="flex gap-3 sm:gap-4"><div class="relative group">
            <div class="w-20 h-20 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl bg-cover bg-center border-2 border-primary/20 shadow-lg flex-shrink-0" style="background-image: url('${pet.photo_url || 'https://via.placeholder.com/150'}')"></div>
        </div><div class="flex-1 min-w-0"><div class="flex justify-between"><div class="min-w-0"><h3 class="text-lg sm:text-xl font-bold dark:text-white truncate">${escapeHtml(pet.name)}</h3><p class="text-text-sub-light dark:text-text-sub-dark text-sm truncate">${pet.breed || 'Unknown breed'}</p></div><button onclick="openEditModal('pet', ${i})" class="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-lg text-text-sub-light hover:text-primary flex-shrink-0"><span class="material-symbols-outlined">edit</span></button></div><span class="inline-block mt-2 px-3 py-1 bg-background-light dark:bg-background-dark rounded-full text-xs sm:text-sm dark:text-white">${pet.weight || '?'} lbs</span></div></div>${pet.grooming_notes ? `<div class="mt-3 sm:mt-4 p-3 bg-background-light dark:bg-background-dark rounded-lg text-xs sm:text-sm text-text-sub-light dark:text-text-sub-dark"><strong>Notes:</strong> ${pet.grooming_notes}</div>` : ''}</div>`).join('') : '<div class="col-span-2 text-center py-8 sm:py-12 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark"><span class="material-symbols-outlined text-5xl sm:text-6xl text-text-sub-light mb-4">pets</span><p class="text-text-sub-light dark:text-text-sub-dark">No pets added yet</p><button onclick="openEditModal(\'pet\', {})" class="mt-4 bg-primary text-white font-bold px-4 py-2 rounded-lg">Add Your First Pet</button></div>'}</div>`;
    }

    if (state.currentTab === 'appointments') {
        // Separate appointments by status
        const upcomingAppts = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
        const pastAppts = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'no_show');
        
        return `<div class="flex justify-between items-start mb-8"><div><h1 class="text-3xl font-bold mb-2 dark:text-white">Appointments</h1><p class="text-text-sub-light dark:text-text-sub-dark">View and manage sessions</p></div><button onclick="openBookingModal()" class="bg-primary text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2"><span class="material-symbols-outlined">add</span>Book New</button></div>
        
        ${upcomingAppts.length > 0 ? `<h3 class="text-lg font-bold mb-4 dark:text-white flex items-center gap-2"><span class="material-symbols-outlined text-primary">upcoming</span>Upcoming (${upcomingAppts.length})</h3>` : ''}
        <div class="space-y-4 mb-8">${upcomingAppts.length > 0 ? upcomingAppts.map(apt => `
            <div class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center"><span class="material-symbols-outlined text-primary">pets</span></div>
                        <div>
                            <p class="font-bold dark:text-white">${apt.petName || 'Pet'}</p>
                            <p class="text-sm text-text-sub-light dark:text-text-sub-dark">${apt.serviceName || apt.service || 'Grooming'}${apt.total_price ? ' • $' + apt.total_price : ''}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-sm text-text-sub-light dark:text-text-sub-dark text-right">
                            <div class="flex items-center gap-1 mb-1"><span class="material-symbols-outlined text-base">calendar_month</span>${formatDate(apt.appointment_date || apt.date)}</div>
                            <div class="flex items-center gap-1"><span class="material-symbols-outlined text-base">schedule</span>${formatTime(apt.start_time || apt.time)}</div>
                        </div>
                        <span class="px-3 py-1 text-xs font-bold rounded-full uppercase ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">${apt.status}</span>
                    </div>
                </div>
                <div class="flex gap-2 mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                    <button onclick="rescheduleAppointment('${apt.id}')" class="flex-1 px-4 py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center justify-center gap-1 transition-colors">
                        <span class="material-symbols-outlined text-base">edit_calendar</span>Reschedule
                    </button>
                    <button onclick="confirmCancelAppointment('${apt.id}')" class="flex-1 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg flex items-center justify-center gap-1 transition-colors">
                        <span class="material-symbols-outlined text-base">cancel</span>Cancel
                    </button>
                </div>
            </div>`).join('') : '<div class="text-center py-12 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark"><span class="material-symbols-outlined text-6xl text-text-sub-light mb-4">calendar_month</span><p class="text-text-sub-light dark:text-text-sub-dark">No upcoming appointments</p><button onclick="openBookingModal()" class="mt-4 bg-primary text-white font-bold px-4 py-2 rounded-lg">Book Your First Appointment</button></div>'}</div>
        
        ${pastAppts.length > 0 ? `
        <h3 class="text-lg font-bold mb-4 dark:text-white flex items-center gap-2"><span class="material-symbols-outlined text-slate-400">history</span>Past Appointments (${pastAppts.length})</h3>
        <div class="space-y-4">${pastAppts.map(apt => `
            <div class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 opacity-90 hover:opacity-100 transition-opacity">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center"><span class="material-symbols-outlined text-slate-400">pets</span></div>
                        <div>
                            <p class="font-bold dark:text-white">${apt.petName || 'Pet'}</p>
                            <p class="text-sm text-text-sub-light dark:text-text-sub-dark">${apt.serviceName || apt.service || 'Grooming'}${apt.total_price ? ' • $' + apt.total_price : ''}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-sm text-text-sub-light dark:text-text-sub-dark text-right">
                            <div class="flex items-center gap-1 mb-1"><span class="material-symbols-outlined text-base">calendar_month</span>${formatDate(apt.appointment_date || apt.date)}</div>
                        </div>
                        <span class="px-3 py-1 text-xs font-bold rounded-full uppercase ${apt.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : apt.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}">${apt.status}</span>
                    </div>
                </div>
                ${(apt.before_photo_url || apt.after_photo_url) ? `
                <div class="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                    <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-1"><span class="material-symbols-outlined text-sm">photo_camera</span>Grooming Photos</p>
                    <div class="grid grid-cols-2 gap-3">
                        ${apt.before_photo_url ? `
                        <div class="relative">
                            <img src="${apt.before_photo_url}" class="w-full aspect-[4/3] object-cover rounded-xl" alt="Before grooming"/>
                            <span class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs font-bold rounded">Before</span>
                        </div>
                        ` : ''}
                        ${apt.after_photo_url ? `
                        <div class="relative">
                            <img src="${apt.after_photo_url}" class="w-full aspect-[4/3] object-cover rounded-xl" alt="After grooming"/>
                            <span class="absolute bottom-2 left-2 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded">After ✨</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                ${apt.groomer_notes ? `<div class="mt-4 pt-4 border-t border-border-light dark:border-border-dark"><p class="text-sm text-text-sub-light dark:text-text-sub-dark"><span class="font-semibold">Groomer Notes:</span> ${apt.groomer_notes}</p></div>` : ''}
                
                <!-- Quick Rebook Button (Recommendation #8) -->
                ${apt.status === 'completed' ? `
                <div class="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                    <button onclick="rebookAppointment('${apt.id}')" class="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <span class="material-symbols-outlined text-lg">replay</span>
                        Book Again
                    </button>
                </div>
                ` : ''}
            </div>`).join('')}</div>` : ''}`;
    }

    if (state.currentTab === 'rewards') {
        const rewards = getRewards();
        const loyaltyPoints = user.loyaltyPoints || 0;
        return `<div class="mb-8"><h1 class="text-3xl font-bold mb-2 dark:text-white">Loyalty Rewards</h1><p class="text-text-sub-light dark:text-text-sub-dark">Earn points with every groom</p></div>
        <div class="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-white mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><p class="text-sm opacity-80 uppercase mb-1">Your Points</p><p class="text-5xl font-bold">${loyaltyPoints}</p></div><div class="text-sm opacity-90"><p>50 points per groom</p><p>500 pts = Free Bath</p></div></div>
        <h3 class="text-xl font-bold mb-4 dark:text-white">Available Rewards</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">${rewards.map(r => {
            const pts = r.points_required || r.points || 0;
            const canRedeem = loyaltyPoints >= pts;
            return `<div class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5"><div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4"><span class="material-symbols-outlined text-primary">redeem</span></div><h4 class="font-bold mb-1 dark:text-white">${r.name}</h4><p class="text-sm text-text-sub-light dark:text-text-sub-dark mb-4">${r.description || ''}</p><div class="flex justify-between items-center"><span class="font-bold text-primary">${pts} pts</span><button onclick="redeemReward('${r.id}', '${(r.name || '').replace(/'/g, "\\'")}', ${pts})" class="px-3 py-1.5 text-sm font-bold rounded-lg ${canRedeem ? 'bg-primary text-white hover:bg-sky-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}" ${!canRedeem ? 'disabled' : ''}>Redeem</button></div></div>`;
        }).join('')}</div>`;
    }

    if (state.currentTab === 'store') {
        const categories = ['all', 'grooming', 'treats', 'toys', 'health'];
        const filteredProducts = state.storeCategory === 'all' ? data.products : data.products.filter(p => p.category === state.storeCategory);
        
        // #11 Personalized recommendations based on pet size
        const petSizeCategory = pets.length > 0 ? (pets[0].weight > 50 ? 'large' : pets[0].weight > 20 ? 'medium' : 'small') : null;
        const petBreed = pets.length > 0 ? pets[0].breed : '';
        const recommendedProducts = petSizeCategory ? data.products.filter(p => {
            const desc = (p.description || '').toLowerCase() + ' ' + (p.name || '').toLowerCase();
            if (petSizeCategory === 'large') return desc.includes('large') || desc.includes('shed') || desc.includes('strong') || p.category === 'grooming';
            if (petSizeCategory === 'small') return desc.includes('small') || desc.includes('gentle') || desc.includes('sensitive') || p.category === 'treats';
            return p.badge === 'groomer' || p.category === 'grooming';
        }).slice(0, 4) : [];
        
        return `
        <div class="p-4 md:p-8 max-w-[1200px] mx-auto">
            <div class="flex min-h-[280px] flex-col gap-4 bg-cover bg-center bg-no-repeat rounded-2xl items-start justify-end px-6 pb-8 shadow-md relative overflow-hidden mb-6" style="background-image: linear-gradient(rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuA-l9fQMzQ46NScwNxTOmvji96VyFtz0DEvfpIZPoEI2n98qWiqORYpMz7mP_SVLo7HdvDLy8EJTaPankBpfjSozf9kya8F5CF_NPLPoOIRnWnInstxdoCboZDO_Jh-HX8KlgRqD-iK-4O4hhgEOQCOpjBMqmREQEtYekCqzViyHxE6z6Puj8og0W3QwDAaug3ho0OLzxE_vW35ZF38i4Fc9u2Yk5igndj6fupyo-gv5B9oOXhPOqrpa8qscpgF9auQBUCmE-vGwUYy');">
                <div class="absolute top-4 left-4 z-10"><img src="${LOGO_ACADEMY}" alt="Dogfathersplus Academy" class="h-16 w-auto drop-shadow-lg"/></div>
                <div class="flex flex-col gap-2 text-left z-10 max-w-2xl"><h1 class="text-white text-3xl font-black leading-tight">Curated Grooming Essentials</h1><p class="text-white/90 text-sm">Handpicked by the Dogfathers Team.</p></div>
                <button class="flex items-center gap-2 rounded-lg h-11 px-5 bg-primary hover:bg-sky-400 text-white text-sm font-bold shadow-lg z-10 mt-2">Explore Deals <span class="material-symbols-outlined text-sm">arrow_forward</span></button>
            </div>
            
            ${recommendedProducts.length > 0 ? `
            <div class="mb-6">
                <h2 class="text-lg font-bold dark:text-white flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-primary">auto_awesome</span>
                    Recommended for ${pets[0].name}
                    <span class="text-xs font-normal text-text-sub-light dark:text-text-sub-dark">(${petBreed} • ${petSizeCategory} breed)</span>
                </h2>
                <div class="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                    ${recommendedProducts.map(p => `
                        <a href="${p.link}" target="_blank" class="flex-shrink-0 w-48 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 overflow-hidden hover:shadow-lg transition-all group">
                            <div class="w-full h-32 bg-cover bg-center" style="background-image: url('${p.image}');"></div>
                            <div class="p-3">
                                <p class="font-bold text-sm dark:text-white truncate">${escapeHtml(p.name)}</p>
                                <div class="flex items-center justify-between mt-1">
                                    <span class="font-bold text-primary">$${p.price.toFixed(2)}</span>
                                    <span class="material-symbols-outlined text-primary text-sm">open_in_new</span>
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="flex flex-col md:flex-row justify-between gap-4 py-3 sticky top-16 lg:top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm mb-6">
                <div class="flex w-full md:w-80 items-center rounded-lg bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark px-3 h-11 shadow-sm"><span class="material-symbols-outlined text-text-sub-light dark:text-text-sub-dark">search</span><input class="w-full bg-transparent border-none focus:ring-0 text-sm px-2 placeholder:text-text-sub-light dark:placeholder:text-text-sub-dark dark:text-white" placeholder="Search products..."/></div>
                <div class="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">${categories.map(cat => `<button onclick="setStoreCategory('${cat}')" class="flex h-10 shrink-0 items-center justify-center rounded-full px-5 text-sm font-medium transition-all ${state.storeCategory === cat ? 'bg-primary text-white' : 'bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark dark:text-white'}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`).join('')}</div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-8">
                ${filteredProducts.map(p => `<div class="flex flex-col rounded-xl bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark overflow-hidden hover:shadow-lg transition-all group"><div class="relative w-full aspect-[4/3] bg-gray-100 dark:bg-slate-800 overflow-hidden">${p.badge ? `<div class="absolute top-3 left-3 z-10"><span class="${p.badge === 'groomer' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' : p.badge === 'sale' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'} text-xs font-bold px-2 py-1 rounded">${p.badge === 'groomer' ? "Groomer's Choice" : p.badge === 'sale' ? 'Sale 20% Off' : 'New'}</span></div>` : ''}<div class="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style="background-image: url('${p.image}');"></div></div><div class="flex flex-col flex-1 p-4 gap-3"><div class="flex-1"><h3 class="font-bold dark:text-white group-hover:text-primary transition-colors">${escapeHtml(p.name)}</h3><p class="text-sm text-text-sub-light dark:text-text-sub-dark">${p.description}</p></div><div class="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark">${p.originalPrice ? `<div class="flex flex-col"><span class="text-xs line-through text-text-sub-light dark:text-text-sub-dark">$${p.originalPrice.toFixed(2)}</span><span class="text-lg font-bold text-red-600 dark:text-red-400">$${p.price.toFixed(2)}</span></div>` : `<span class="text-lg font-bold dark:text-white">$${p.price.toFixed(2)}</span>`}<a href="${p.link}" class="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Buy <span class="material-symbols-outlined text-base">open_in_new</span></a></div></div></div>`).join('')}
            </div>
            <footer class="text-center py-6 border-t border-border-light dark:border-border-dark"><p class="text-xs text-text-sub-light dark:text-text-sub-dark"><strong>Affiliate Disclosure:</strong> We may earn a commission at no extra cost to you.</p></footer>
        </div>`;
    }

    if (state.currentTab === 'ridealongs') {
        return `
        <div class="min-h-screen">
            <section class="px-4 md:px-10 py-10 max-w-[960px] mx-auto">
                <div class="flex flex-col gap-6 lg:flex-row lg:gap-10 items-center">
                    <div class="w-full lg:w-1/2 aspect-video bg-cover bg-center rounded-xl shadow-lg relative overflow-hidden" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCEoD1IZ_9OcIUbyU-lBHFtgnYLJ7VIoAdkkgFir2Jl5HBHKwCgHsNIVed366p0Wj2YOfADguhRocugY0iYtljzef8zHCjbg_y4hYONRTQqiUkzIJtwzGZ4CViGl_qLCXzU6jQbedXer7II9ey9tZVmtc1GoWQUUc_qgQSXrVZwSV8PTa5gRP7MmAc3qek43ZGfQ5vjGUDEhNKBBPYePrVevGB74UjHhZHTH5HK73uOCZghNocaNAvpdSgZLQhFSvDDg44uCW43W5RE');">
                        <div class="absolute top-4 left-4"><img src="${LOGO_ACADEMY}" alt="Dogfathersplus Academy" class="h-14 w-auto drop-shadow-lg"/></div>
                    </div>
                    <div class="flex flex-col gap-6 lg:w-1/2">
                        <div><h1 class="text-4xl md:text-5xl font-black leading-tight">Ride-Along Experiences</h1><p class="text-text-sub-light mt-2">Learn hands-on from professional groomers. Shadow, practice, and master the art of mobile dog grooming.</p></div>
                        <button class="w-fit px-6 h-12 bg-primary hover:bg-sky-500 text-white font-bold rounded-lg flex items-center gap-2"><span class="material-symbols-outlined">school</span>Start Learning</button>
                    </div>
                </div>
            </section>
            <section class="px-4 md:px-10 py-10 bg-white dark:bg-surface-dark">
                <div class="max-w-[960px] mx-auto">
                    <div class="text-center mb-8"><h2 class="text-3xl font-bold mb-2">Choose Your Learning Path</h2><p class="text-text-sub-light">From observer to expert - we have a package for every skill level.</p></div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        ${data.rideAlongs.map((pkg, i) => `
                        <div class="relative flex flex-col gap-5 rounded-xl ${pkg.popular ? 'border-2 border-primary bg-white dark:bg-surface-dark shadow-xl md:-translate-y-2 z-10' : 'border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark'} p-6 transition-all">
                            ${pkg.popular ? '<div class="absolute top-0 right-0 left-0 -mt-3 flex justify-center"><span class="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Most Popular</span></div>' : ''}
                            <div class="${pkg.popular ? 'mt-2' : ''}">
                                <h3 class="text-lg font-bold">${pkg.name}</h3>
                                <p class="text-sm text-text-sub-light mt-1">${pkg.duration || ''}</p>
                                <p class="flex items-baseline gap-1 mt-2"><span class="text-4xl font-black">$${pkg.price}</span></p>
                            </div>
                            <p class="text-sm text-text-sub-light">${pkg.description || ''}</p>
                            <button onclick="inquireRideAlong('${pkg.id}', '${(pkg.name || '').replace(/'/g, "\\'")}', ${pkg.price})" class="w-full h-10 px-4 ${pkg.popular ? 'bg-primary text-white shadow-md' : 'bg-slate-200 text-text-main-light hover:bg-slate-300'} font-bold rounded-lg transition-colors">Book Now</button>
                            <div class="flex flex-col gap-2 pt-4 border-t border-border-light">${(pkg.features || []).map(f => `<div class="flex gap-3 items-start text-sm"><span class="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span><span>${f}</span></div>`).join('')}</div>
                        </div>`).join('')}
                    </div>
                </div>
            </section>
            <section class="px-4 md:px-10 py-12 max-w-[960px] mx-auto">
                <div class="flex flex-col gap-8">
                    <div><h2 class="text-3xl font-bold">Why Learn With Us?</h2><p class="text-text-sub-light mt-2">Get real-world experience that courses can't teach.</p></div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div class="flex flex-col gap-4 rounded-xl border border-border-light bg-white p-6 shadow-sm"><div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span class="material-symbols-outlined text-2xl">person</span></div><div><h3 class="text-lg font-bold">1-on-1 Mentorship</h3><p class="text-text-sub-light text-sm">Learn directly from experienced pros.</p></div></div>
                        <div class="flex flex-col gap-4 rounded-xl border border-border-light bg-white p-6 shadow-sm"><div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span class="material-symbols-outlined text-2xl">pets</span></div><div><h3 class="text-lg font-bold">Real Dogs, Real Skills</h3><p class="text-text-sub-light text-sm">Practice on actual clients' pets.</p></div></div>
                        <div class="flex flex-col gap-4 rounded-xl border border-border-light bg-white p-6 shadow-sm"><div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span class="material-symbols-outlined text-2xl">workspace_premium</span></div><div><h3 class="text-lg font-bold">Certificate Included</h3><p class="text-text-sub-light text-sm">Proof of your hands-on training.</p></div></div>
                    </div>
                </div>
            </section>
            <footer class="border-t border-border-light dark:border-border-dark py-8 text-center"><p class="text-text-sub-light/70 dark:text-text-sub-dark/70 text-sm">© ${new Date().getFullYear()} Dogfathersplus. All rights reserved.</p></footer>
        </div>`;
    }

    if (state.currentTab === 'education') {
        return `
        <div class="min-h-screen max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10 flex flex-col gap-12">
            <section class="flex flex-col-reverse lg:flex-row gap-8 items-center">
                <div class="flex flex-col gap-6 flex-1 text-center lg:text-left items-center lg:items-start">
                    <div class="space-y-4">
                        <img src="${LOGO_ACADEMY}" alt="Dogfathersplus Academy" class="h-20 w-auto mx-auto lg:mx-0"/>
                        <h1 class="text-4xl md:text-5xl font-black leading-tight">Master Dog Grooming <span class="text-primary">at Home</span></h1>
                        <p class="text-text-sub-light max-w-xl">Join our exclusive Skool community to learn professional techniques and safety tips.</p>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-4">
                        <a href="https://www.skool.com/dogfathersplus" target="_blank" class="flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-primary text-white font-bold shadow-lg">Join Skool Course <span class="material-symbols-outlined text-sm">arrow_outward</span></a>
                        <button class="h-12 px-6 rounded-lg border border-border-light bg-white font-bold">Watch Preview</button>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-text-sub-light"><span class="font-medium">Joined by 500+ pet owners</span></div>
                </div>
                <div class="w-full lg:w-1/2">
                    <div class="relative aspect-video max-h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl">
                        <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7UBx2cL4iT0nvTzBW8ZGt9p0gUezChZOdjKFTuKT0D3VzISQ3sbnEVvOv1Qde40FTjCEAmwRCRzTTUNC1mTR_n-cFb9mCgO6PSOXw3YUEOlpIZ8ipr6jkLpBN575EWZUsxjn6l38psNI3-2Ryuo_qiuW2i-LrURKgO6lCtvlwmBKM7mIXz8UGOGxTgK7p_NlvAs0ja8Fe5gNc4R-sWN0sS1sRHyE46v8BO3Ep5W8Kec-i3PZIt1Bis3-ag6NjdP7e8vciSPGvzuXK');"></div>
                        <div class="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg flex items-center gap-4"><div class="bg-primary/20 p-3 rounded-full text-primary"><span class="material-symbols-outlined">play_circle</span></div><div><p class="text-sm font-bold">Module 1: Getting Started</p><p class="text-xs text-text-sub-light">12 mins - Introduction to Tools</p></div></div>
                    </div>
                </div>
            </section>
            <section class="flex flex-col gap-8">
                <div class="border-b border-border-light pb-6"><h2 class="text-2xl md:text-3xl font-bold mb-2">What You'll Learn</h2><p class="text-text-sub-light">Comprehensive modules from basic hygiene to advanced styling.</p></div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${[{icon:'content_cut',title:'Professional Techniques',desc:'Safe scissoring and clipping methods.'},{icon:'shower',title:'Bathing & Drying',desc:'Best practices for all coat types.'},{icon:'health_and_safety',title:'Health Checks',desc:'Spot early signs of issues.'},{icon:'construction',title:'Tools of the Trade',desc:'Complete equipment guide.'},{icon:'groups',title:'Community Access',desc:'Q&A with expert groomers.'},{icon:'verified',title:'Certification',desc:'Earn your Home Groomer certificate.'}].map(item => `<div class="group flex flex-col gap-4 p-6 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark hover:shadow-lg transition-all"><div class="size-12 rounded-lg bg-blue-50 dark:bg-primary/20 text-primary flex items-center justify-center"><span class="material-symbols-outlined text-2xl">${item.icon}</span></div><div><h3 class="text-lg font-bold mb-2 dark:text-white">${item.title}</h3><p class="text-text-sub-light dark:text-text-sub-dark text-sm">${item.desc}</p></div></div>`).join('')}
                </div>
            </section>
            <section class="rounded-3xl bg-primary/10 border border-primary/20 p-8 md:p-16 text-center">
                <div class="max-w-3xl mx-auto flex flex-col items-center gap-6">
                    <h2 class="text-3xl md:text-4xl font-black">Ready to become a home grooming pro?</h2>
                    <p class="text-text-sub-light">Get unlimited access to all materials and weekly live Q&A.</p>
                    <div class="flex flex-col items-center gap-2 my-4"><span class="text-4xl font-black text-primary">$49<span class="text-xl font-medium text-text-sub-light">/month</span></span><span class="text-sm font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full">Free for Premium Members</span></div>
                    <a href="https://www.skool.com/dogfathersplus" target="_blank" class="min-w-[200px] h-14 px-8 rounded-lg bg-primary text-white text-lg font-bold shadow-xl flex items-center justify-center gap-2">Start Learning <span class="material-symbols-outlined">arrow_forward</span></a>
                    <p class="text-xs text-text-sub-light">30-day money-back guarantee.</p>
                </div>
            </section>
            <footer class="border-t border-border-light dark:border-border-dark py-8 text-center"><p class="text-sm text-text-sub-light dark:text-text-sub-dark">© ${new Date().getFullYear()} Dogfathersplus</p></footer>
        </div>`;
    }
    return '';
}

function renderBookingModal() {
    const user = state.currentUser;
    const pets = state.pets || [];
    // Use actual DB services - only show ACTIVE services to customers
    const services = (state.services || []).filter(s => s.is_active !== false);
    const hasRealServices = services.length > 0;
    
    // Get preselect values (from pet card or rebook)
    const preselect = state.bookingPreselect || {};
    
    // Get today's date for min validation (prevent past bookings)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Pre-fill address from user profile
    const userAddress = user?.address || '';
    const userCity = user?.city || '';
    const userZip = user?.zip || '';
    const fullAddress = userAddress + (userCity ? ', ' + userCity : '');
    
    // Get smart booking data
    const smartData = state.smartBookingData;
    const selectedDate = state.selectedBookingDate;
    
    // Get first service description for initial display
    const firstService = services.length > 0 ? services.filter(s => !s.is_addon)[0] : null;
    const initialDescription = firstService?.description || 'Complete grooming service tailored to your pet\'s needs.';
    
    return `<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4" onclick="closeBookingModal()">
        <div class="bg-surface-light dark:bg-surface-dark rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
            <div class="p-4 sm:p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center sticky top-0 bg-surface-light dark:bg-surface-dark z-10">
                <div>
                    <h2 class="text-xl sm:text-2xl font-bold dark:text-white">Book Appointment</h2>
                    <p class="text-xs sm:text-sm text-text-sub-light dark:text-text-sub-dark">Schedule your pet's next grooming</p>
                </div>
                <button onclick="closeBookingModal()" class="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-lg">
                    <span class="material-symbols-outlined dark:text-white">close</span>
                </button>
            </div>
            <form id="booking-form" class="p-4 sm:p-6 space-y-4 sm:space-y-5">
                ${!hasRealServices ? '<div class="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-200 text-sm mb-2"><span class="font-semibold">Note:</span> Services not loaded from database. Please contact admin to set up services.</div>' : ''}
                
                <!-- Pet & Service Selection -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label class="block">
                        <span class="text-sm font-semibold mb-2 block dark:text-white">Select Pet</span>
                        <select id="booking-pet" class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark dark:text-white">
                            ${pets.length > 0 ? pets.map(p => `<option value="${p.id}" ${preselect.petId === p.id ? 'selected' : ''}>${escapeHtml(p.name)} (${p.breed || 'Unknown'})</option>`).join('') : '<option value="">No pets - please add a pet first</option>'}
                        </select>
                    </label>
                    <label class="block">
                        <span class="text-sm font-semibold mb-2 block dark:text-white">Service</span>
                        <select id="booking-service-select" onchange="showServiceDescription(this)" class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark dark:text-white">
                            ${hasRealServices ? services.filter(s => !s.is_addon).map(s => `<option value="${s.id}" data-name="${escapeHtml(s.name)}" data-price="${s.base_price}" data-duration="${s.duration_minutes || 60}" data-description="${(s.description || '').replace(/"/g, '&quot;')}" ${preselect.serviceId === s.id ? 'selected' : ''}>${escapeHtml(s.name)} - $${s.base_price}</option>`).join('') : '<option value="default" data-name="Full Groom" data-price="85" data-duration="90" data-description="Complete grooming including bath, brush, haircut, nail trim, and ear cleaning.">Full Groom - $85</option><option value="default" data-name="Bath & Brush" data-price="45" data-duration="45" data-description="Thorough bath with premium shampoo and complete brush out.">Bath & Brush - $45</option>'}
                        </select>
                    </label>
                </div>
                
                <!-- Service Description Box (Recommendation #3) -->
                <div id="service-description-box" class="p-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg">
                    <div class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-primary text-lg mt-0.5">info</span>
                        <div>
                            <p class="text-sm font-semibold text-primary dark:text-sky-400">What's included:</p>
                            <p class="text-sm text-text-sub-light dark:text-text-sub-dark" id="service-desc-text">${initialDescription}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Address Section -->
                <div class="space-y-3">
                    <label class="block">
                        <span class="text-sm font-semibold mb-2 block dark:text-white">Service Address</span>
                        <div class="relative">
                            <input type="text" id="booking-address" value="${fullAddress}" placeholder="Street address, City" class="w-full h-12 px-4 pr-12 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark dark:text-white" required oninput="debouncedAddressCheck()" onblur="checkAddressServiceArea()">
                            <div id="address-check-icon" class="absolute right-3 top-1/2 -translate-y-1/2 hidden">
                                <span class="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                            </div>
                        </div>
                    </label>
                    <!-- Service Area Check (hidden from customer, used internally) -->
                    <div id="address-service-badge" class="hidden"></div>
                    <input type="hidden" id="booking-city" value="${userCity}">
                    <input type="hidden" id="booking-zip" value="${userZip}">
                </div>
                
                <!-- Smart Date Picker - Auto-loads, shows loading state -->
                <div id="smart-date-picker">
                    ${smartData ? renderSmartDatePicker(smartData, selectedDate) : `
                        <div class="p-6 bg-background-light dark:bg-background-dark rounded-xl text-center">
                            <div class="inline-flex items-center gap-2 text-text-sub-light dark:text-text-sub-dark">
                                <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Finding best available dates...</span>
                            </div>
                        </div>
                    `}
                </div>
                
                <!-- Time Selection (shown after date is selected) -->
                <div id="time-selection-wrapper" class="${selectedDate ? '' : 'hidden'}">
                    <label class="block">
                        <span class="text-sm font-semibold mb-2 block dark:text-white">Time</span>
                        <select id="booking-time" class="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark dark:text-white" required>
                            <option value="">Select a time</option>
                        </select>
                        <p id="booking-time-hint" class="text-xs text-slate-500 dark:text-slate-400 mt-1 hidden"></p>
                    </label>
                </div>
                
                <!-- Hidden date input for form submission -->
                <input type="hidden" id="booking-date" value="${selectedDate || ''}">
                
                <!-- Notes -->
                <label class="block">
                    <span class="text-sm font-semibold mb-2 block dark:text-white">Notes (optional)</span>
                    <textarea id="booking-notes" placeholder="Any special requests or notes..." class="w-full h-20 px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark dark:text-white resize-none"></textarea>
                </label>
                
                <button type="button" onclick="showBookingConfirmation()" class="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 touch-target transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${!selectedDate ? 'disabled' : ''} id="booking-review-btn">
                    Review & Confirm
                    <span class="material-symbols-outlined">arrow_forward</span>
                </button>
            </form>
            
            <!-- #2 Booking Confirmation Summary (hidden by default) -->
            <div id="booking-confirmation-summary" class="p-4 sm:p-6 hidden">
                <div class="flex items-center gap-2 mb-4">
                    <button onclick="hideBookingConfirmation()" class="p-1 hover:bg-background-light dark:hover:bg-background-dark rounded-lg"><span class="material-symbols-outlined dark:text-white">arrow_back</span></button>
                    <h3 class="text-lg font-bold dark:text-white">Confirm Your Booking</h3>
                </div>
                <div id="booking-summary-content" class="space-y-3 mb-6"></div>
                <button onclick="submitBookingFromConfirmation()" class="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 touch-target transition-colors">
                    <span class="material-symbols-outlined">check_circle</span>
                    Confirm Booking
                </button>
            </div>
        </div>
    </div>`;
}

// Render smart date picker with time slots
function renderSmartDatePicker(smartData, selectedSlot) {
    if (!smartData) return '';
    
    // Support both old and new format
    const { bestAvailable, moreAvailable, recommended, goodOptions, available, noCoordinates, error } = smartData;
    
    // Use new format if available, otherwise fall back to old
    const best = bestAvailable || recommended || [];
    const more = moreAvailable || [...(goodOptions || []), ...(available || [])];
    
    if (noCoordinates) {
        return `
            <div class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                <div class="flex items-start gap-3">
                    <span class="material-symbols-outlined text-amber-600">location_off</span>
                    <div>
                        <p class="font-semibold text-amber-800 dark:text-amber-200">Location not found</p>
                        <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">We couldn't find your address. Please enter a valid address with city and try again.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (error) {
        return `
            <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                <p class="text-red-800 dark:text-red-200">Error loading available times. Using standard date picker.</p>
                <input type="date" id="booking-date-fallback" min="${new Date().toISOString().split('T')[0]}" onchange="handleFallbackDateChange()" class="mt-3 w-full h-12 px-4 rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark dark:text-white">
            </div>
        `;
    }
    
    // Render slot card (date + time)
    const renderSlotCard = (slot, isSelected) => {
        // Handle both old format (date only) and new format (date + time)
        const hasTime = slot.time || slot.displayTime;
        const slotKey = hasTime ? `${slot.date}_${slot.time}` : slot.date;
        const selectedKey = (selectedSlot && typeof selectedSlot === 'object') ? `${selectedSlot.date}_${selectedSlot.time}` : selectedSlot;
        const isSlotSelected = slotKey === selectedKey || slot.date === selectedSlot;
        
        // Format display
        const displayDate = slot.displayDate || formatDate(slot.date, { weekday: 'short', month: 'short', day: 'numeric' });
        const displayTime = slot.displayTime || (slot.time ? formatTime(slot.time) : '');
        
        return `
            <button type="button" onclick="selectBookingSlot('${slot.date}', '${slot.time || ''}', '${slot.groomerId || ''}')" 
                class="flex flex-col items-center p-4 rounded-xl border-2 transition-all min-w-[110px] min-h-[70px] touch-target active:scale-95 ${isSlotSelected ? 'border-primary bg-primary/10 dark:bg-primary/20' : 'border-slate-200 dark:border-slate-600 hover:border-primary/50 bg-white dark:bg-slate-800'}">
                <span class="text-sm font-semibold ${isSlotSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}">${displayDate}</span>
                ${displayTime ? `<span class="text-lg font-bold ${isSlotSelected ? 'text-primary' : 'text-slate-900 dark:text-white'} mt-1">${displayTime}</span>` : ''}
            </button>
        `;
    };
    
    let html = '<div class="space-y-4">';
    
    // Best Available Times
    if (best.length > 0) {
        html += `
            <div>
                <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-emerald-600 fill-1">star</span>
                    <span class="font-semibold text-emerald-700 dark:text-emerald-400">Best Available Times</span>
                </div>
                <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    ${best.slice(0, 8).map(s => renderSlotCard(s, selectedSlot)).join('')}
                </div>
            </div>
        `;
    }
    
    // More Available Times
    if (more.length > 0) {
        html += `
            <div>
                <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-slate-500">calendar_today</span>
                    <span class="font-semibold text-slate-700 dark:text-slate-300">More Available Times</span>
                </div>
                <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    ${more.slice(0, 12).map(s => renderSlotCard(s, selectedSlot)).join('')}
                </div>
            </div>
        `;
    }
    
    // No times available message
    if (best.length === 0 && more.length === 0) {
        html += `
            <div class="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">event_busy</span>
                <p class="text-slate-600 dark:text-slate-400">No available times in the next 30 days. Please call us to schedule.</p>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// Select a booking slot (date + time + groomer)
function selectBookingSlot(dateStr, timeStr, groomerId) {
    state.selectedBookingDate = dateStr;
    state.selectedBookingTime = timeStr;
    state.selectedBookingGroomer = groomerId;
    
    // Update hidden inputs
    const dateInput = document.getElementById('booking-date');
    if (dateInput) dateInput.value = dateStr;
    
    // If time is provided, auto-select it
    if (timeStr) {
        const timeSelect = document.getElementById('booking-time');
        if (timeSelect) {
            // Check if option exists, if not add it
            let option = Array.from(timeSelect.options).find(o => o.value === timeStr);
            if (!option) {
                option = document.createElement('option');
                option.value = timeStr;
                option.textContent = formatTime(timeStr);
                timeSelect.appendChild(option);
            }
            timeSelect.value = timeStr;
        }
        
        // Show time selection wrapper
        const timeWrapper = document.getElementById('time-selection-wrapper');
        if (timeWrapper) timeWrapper.classList.remove('hidden');
    }
    
    // Enable submit button
    const submitBtn = document.querySelector('form[onsubmit*="handleBookingSubmit"] button[type="submit"]');
    if (submitBtn) submitBtn.disabled = !dateStr;
    
    // Update the picker UI
    const pickerContainer = document.getElementById('smart-date-picker');
    if (pickerContainer && state.smartBookingData) {
        pickerContainer.innerHTML = renderSmartDatePicker(state.smartBookingData, { date: dateStr, time: timeStr });
    }
    
    // Load available times for selected date (if time not pre-selected)
    if (!timeStr) {
        loadTimeSlotsForDate(dateStr);
    }
}

// Load smart date picker based on address
async function loadSmartDatePicker() {
    const addressInput = document.getElementById('booking-address');
    const pickerContainer = document.getElementById('smart-date-picker');
    
    if (!addressInput || !pickerContainer) return;
    
    const address = addressInput.value.trim();
    if (!address) {
        showToast('Please enter an address first', 'error');
        return;
    }
    
    // Show loading
    pickerContainer.innerHTML = `
        <div class="flex items-center justify-center p-8">
            <div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full spinner"></div>
            <span class="ml-3 text-slate-600 dark:text-slate-400">Finding best dates for your location...</span>
        </div>
    `;
    pickerContainer.classList.remove('hidden');
    
    try {
        // Parse address to extract city and zip if possible
        const parts = address.split(',').map(p => p.trim());
        const street = parts[0] || address;
        const city = state.currentUser?.city || parts[1] || '';
        const zip = state.currentUser?.zip || '';
        
        // Geocode the address
        const coords = await geocodeAddress(street, city, 'CA', zip);
        
        if (!coords) {
            state.smartBookingData = { noCoordinates: true };
            pickerContainer.innerHTML = renderSmartDatePicker(state.smartBookingData, null);
            return;
        }
        
        _log('Customer coords:', coords);
        
        // Store coordinates for later
        state.customerBookingCoords = coords;
        
        // Calculate distance and get tier for badge
        const distance = calculateDistance(
            coords.latitude, coords.longitude,
            businessHomeBase.latitude, businessHomeBase.longitude
        );
        const tier = getTravelFeeTier(distance);
        
        // If outside service area, don't load dates
        if (tier.fee_amount < 0) {
            state.smartBookingData = { outOfArea: true };
            pickerContainer.innerHTML = `
                <div class="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-center">
                    <span class="material-symbols-outlined text-4xl text-red-400 mb-2">wrong_location</span>
                    <p class="text-red-800 dark:text-red-200 font-medium">We don't currently service this area</p>
                    <p class="text-sm text-red-600 dark:text-red-400 mt-1">Please try a different address or call us at (626) 863-6926</p>
                </div>
            `;
            return;
        }
        
        // Get smart date recommendations
        const recommendations = await getSmartDateRecommendations(coords.latitude, coords.longitude);
        
        state.smartBookingData = recommendations;
        state.selectedBookingDate = null;
        
        pickerContainer.innerHTML = renderSmartDatePicker(recommendations, null);
        
    } catch (err) {
        console.error('Error loading smart date picker:', err);
        state.smartBookingData = { error: true };
        pickerContainer.innerHTML = renderSmartDatePicker(state.smartBookingData, null);
    }
}

// Select a booking date from smart picker
async function selectBookingDate(dateStr) {
    // Legacy function - redirect to new slot-based selection
    selectBookingSlot(dateStr, '', '');
}

// Load time slots for a specific date
async function loadTimeSlotsForDate(dateStr) {
    const timeSelect = document.getElementById('booking-time');
    const timeHint = document.getElementById('booking-time-hint');
    const serviceSelect = document.getElementById('booking-service-select');
    const timeWrapper = document.getElementById('time-selection-wrapper');
    
    if (timeWrapper) timeWrapper.classList.remove('hidden');
    if (!timeSelect) return;
    
    // Show loading state
    timeSelect.innerHTML = '<option value="">Loading available times...</option>';
    timeSelect.disabled = true;
    
    try {
        const serviceId = serviceSelect?.value;
        const slots = await getAvailableSlots(dateStr, serviceId);
        
        if (slots.length === 0) {
            timeSelect.innerHTML = '<option value="">No available times</option>';
            if (timeHint) {
                timeHint.textContent = 'This date is fully booked. Please try another date.';
                timeHint.classList.remove('hidden');
            }
        } else {
            const options = slots.map(slot => {
                const display = formatTime(slot);
                return `<option value="${slot}">${display}</option>`;
            });
            timeSelect.innerHTML = '<option value="">Select time</option>' + options.join('');
            if (timeHint) {
                timeHint.textContent = `${slots.length} time slot${slots.length > 1 ? 's' : ''} available`;
                timeHint.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Failed to load time slots:', err);
        // Fallback to 2-hour slots
        timeSelect.innerHTML = `
            <option value="">Select time</option>
            <option value="07:00">7:00 AM</option>
            <option value="09:00">9:00 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="13:00">1:00 PM</option>
            <option value="15:00">3:00 PM</option>
            <option value="17:00">5:00 PM</option>
        `;
    }
    
    timeSelect.disabled = false;
}

// Fallback date change handler
function handleFallbackDateChange() {
    const dateInput = document.getElementById('booking-date-fallback');
    if (dateInput) {
        state.selectedBookingDate = dateInput.value;
        document.getElementById('booking-date').value = dateInput.value;
        
        const timeWrapper = document.getElementById('time-selection-wrapper');
        if (timeWrapper) timeWrapper.classList.remove('hidden');
        
        const submitBtn = document.querySelector('#booking-form button[type="submit"]');
        if (submitBtn) submitBtn.disabled = false;
        
        handleBookingDateChange();
    }
}

// Handle date change - load available time slots dynamically
async function handleBookingDateChange() {
    const dateInput = document.getElementById('booking-date');
    const timeSelect = document.getElementById('booking-time');
    const timeHint = document.getElementById('booking-time-hint');
    const serviceSelect = document.getElementById('booking-service-select');
    
    if (!dateInput || !timeSelect) return;
    
    const selectedDate = dateInput.value;
    if (!selectedDate) {
        timeSelect.innerHTML = '<option value="">Select a date first</option>';
        return;
    }
    
    // Show loading state
    timeSelect.innerHTML = '<option value="">Loading available times...</option>';
    timeSelect.disabled = true;
    
    try {
        const serviceId = serviceSelect?.value;
        const slots = await getAvailableSlots(selectedDate, serviceId);
        
        if (slots.length === 0) {
            // Check if it's a closed day
            const dayOfWeek = new Date(selectedDate).getDay();
            const hours = state.businessHours.find(h => h.day_of_week === dayOfWeek);
            
            if (!hours || hours.is_closed) {
                timeSelect.innerHTML = '<option value="">We are closed on this day</option>';
                if (timeHint) {
                    timeHint.textContent = 'Please select a different date. We are open Monday-Saturday.';
                    timeHint.classList.remove('hidden');
                }
            } else {
                timeSelect.innerHTML = '<option value="">No available times - fully booked</option>';
                if (timeHint) {
                    timeHint.textContent = 'This date is fully booked. Please try another date.';
                    timeHint.classList.remove('hidden');
                }
            }
        } else {
            // Format slots for display (convert 24hr to 12hr)
            const options = slots.map(slot => {
                const [hour, min] = slot.split(':');
                const h = parseInt(hour);
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
                const display = `${h12}:${min} ${ampm}`;
                return `<option value="${slot}">${display}</option>`;
            });
            
            timeSelect.innerHTML = '<option value="">Select time</option>' + options.join('');
            if (timeHint) {
                timeHint.textContent = `${slots.length} time slot${slots.length > 1 ? 's' : ''} available`;
                timeHint.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Failed to load available slots:', err);
        // Fallback to default times if dynamic loading fails
        timeSelect.innerHTML = `
            <option value="">Select time</option>
            <option value="09:00">9:00 AM</option>
            <option value="10:00">10:00 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="13:00">1:00 PM</option>
            <option value="14:00">2:00 PM</option>
            <option value="15:00">3:00 PM</option>
            <option value="16:00">4:00 PM</option>
        `;
        if (timeHint) {
            timeHint.textContent = 'Could not verify availability. Please call to confirm.';
            timeHint.classList.remove('hidden');
        }
    }
    
    timeSelect.disabled = false;
}


// =============================================
// NOTIFICATION SYSTEM
// =============================================

// Load notifications for current user
async function loadNotifications() {
    if (!state.currentUser) return;
    
    try {
        const { data: notifications, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', state.currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            _log('Notifications table may not exist yet:', error.message);
            state.notifications = [];
            state.unreadNotifications = 0;
            return;
        }
        
        state.notifications = notifications || [];
        state.unreadNotifications = notifications?.filter(n => !n.is_read).length || 0;
        
        // #5 Generate local appointment reminders
        checkAppointmentReminders();
    } catch (err) {
        console.error('Error loading notifications:', err);
        state.notifications = [];
        state.unreadNotifications = 0;
    }
}

// #5 Appointment reminder system
function checkAppointmentReminders() {
    if (!state.currentUser || state.currentUser.role === 'admin') return;
    const appointments = state.appointments || [];
    const upcoming = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
    const now = new Date();
    const today = new Date(); today.setHours(0,0,0,0);
    
    const existingIds = (state.notifications || []).map(n => n.id || n.local_id);
    
    upcoming.forEach(apt => {
        if (!apt.appointment_date) return;
        const apptDate = new Date(apt.appointment_date + 'T00:00:00');
        const diffDays = Math.ceil((apptDate - today) / (1000 * 60 * 60 * 24));
        const petName = apt.petName || 'Your pet';
        const reminderId24 = 'reminder_24h_' + apt.id;
        const reminderIdToday = 'reminder_today_' + apt.id;
        
        // Tomorrow reminder
        if (diffDays === 1 && !existingIds.includes(reminderId24)) {
            state.notifications.unshift({
                local_id: reminderId24,
                id: reminderId24,
                title: 'Appointment Tomorrow',
                message: `${petName}'s groom is tomorrow at ${formatTime(apt.start_time)}! Make sure your gate is accessible.`,
                type: 'reminder',
                is_read: false,
                created_at: now.toISOString()
            });
            state.unreadNotifications++;
        }
        
        // Day-of reminder
        if (diffDays === 0 && !existingIds.includes(reminderIdToday)) {
            state.notifications.unshift({
                local_id: reminderIdToday,
                id: reminderIdToday,
                title: 'Groom Today! 🐕',
                message: `${petName}'s grooming appointment is today at ${formatTime(apt.start_time)}. Your groomer will arrive at your address.`,
                type: 'reminder',
                is_read: false,
                created_at: now.toISOString()
            });
            state.unreadNotifications++;
        }
    });
    
    // Check for pets due for grooming (>8 weeks)
    const pets = state.pets || [];
    const completedAppts = appointments.filter(a => a.status === 'completed');
    pets.forEach(pet => {
        const petGrooms = completedAppts.filter(a => a.pet_id === pet.id);
        if (petGrooms.length === 0) return;
        petGrooms.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
        const lastDate = new Date(petGrooms[0].appointment_date);
        const weeksSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24 * 7));
        const hasUpcoming = upcoming.some(a => a.pet_id === pet.id);
        const dueId = 'due_groom_' + pet.id + '_w' + weeksSince;
        
        if (weeksSince >= 8 && !hasUpcoming && !existingIds.includes(dueId)) {
            state.notifications.unshift({
                local_id: dueId,
                id: dueId,
                title: `${escapeHtml(pet.name)} Needs a Groom`,
                message: `It's been ${weeksSince} weeks since ${escapeHtml(pet.name)}'s last groom. Book an appointment to keep them looking great!`,
                type: 'reminder',
                is_read: false,
                created_at: now.toISOString()
            });
            state.unreadNotifications++;
        }
    });
}

// Start periodic reminder check (every 30 min)
let reminderInterval = null;
function startReminderInterval() {
    if (reminderInterval) clearInterval(reminderInterval);
    reminderInterval = setInterval(() => {
        if (state.currentUser && state.currentUser.role !== 'admin') {
            checkAppointmentReminders();
        }
    }, 30 * 60 * 1000);
}
function stopReminderInterval() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
    }
}

// Toggle notifications panel
function toggleNotifications() {
    state.showNotifications = !state.showNotifications;
    render();
}

// Close notifications panel
function closeNotifications() {
    state.showNotifications = false;
    render();
}

// Mark notification as read
async function markNotificationRead(notificationId) {
    try {
        const { error } = await supabaseClient
            .rpc('mark_notification_read', {
                p_notification_id: notificationId,
                p_user_id: state.currentUser.id
            });
        
        if (error) {
            // Fallback to direct update
            await supabaseClient
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('id', notificationId);
        }
        
        // Update local state
        const notification = state.notifications.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
            notification.is_read = true;
            notification.read_at = new Date().toISOString();
            state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
            render();
        }
    } catch (err) {
        console.error('Error marking notification read:', err);
    }
}

// Mark all notifications as read
async function markAllNotificationsRead() {
    try {
        const { error } = await supabaseClient
            .rpc('mark_all_notifications_read', {
                p_user_id: state.currentUser.id
            });
        
        if (error) {
            // Fallback to direct update
            await supabaseClient
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('user_id', state.currentUser.id)
                .eq('is_read', false);
        }
        
        // Update local state
        state.notifications.forEach(n => {
            n.is_read = true;
            n.read_at = new Date().toISOString();
        });
        state.unreadNotifications = 0;
        render();
        showToast('All notifications marked as read', 'success');
    } catch (err) {
        console.error('Error marking all notifications read:', err);
    }
}

// Create notification (called after actions)
async function createNotification(userId, title, message, type, referenceType = null, referenceId = null) {
    try {
        const { error } = await supabaseClient
            .rpc('create_notification', {
                p_user_id: userId,
                p_title: title,
                p_message: message,
                p_type: type,
                p_reference_type: referenceType,
                p_reference_id: referenceId
            });
        
        if (error) {
            // Fallback to direct insert
            await supabaseClient
                .from('notifications')
                .insert({
                    user_id: userId,
                    title: title,
                    message: message,
                    type: type,
                    reference_type: referenceType,
                    reference_id: referenceId
                });
        }
    } catch (err) {
        console.error('Error creating notification:', err);
    }
}

// Notify all admins
async function notifyAllAdmins(title, message, type, referenceType = null, referenceId = null) {
    try {
        // Get all admin IDs
        const { data: admins } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
            .eq('is_active', true);
        
        if (admins) {
            for (const admin of admins) {
                await createNotification(admin.id, title, message, type, referenceType, referenceId);
            }
        }
    } catch (err) {
        console.error('Error notifying admins:', err);
    }
}

// Render notifications panel
function renderNotificationsPanel() {
    const notifications = state.notifications || [];
    const notificationIcons = {
        booking_created: 'calendar_add_on',
        booking_confirmed: 'event_available',
        booking_cancelled: 'event_busy',
        appointment_started: 'play_circle',
        appointment_completed: 'check_circle',
        groomer_assigned: 'person_add',
        points_earned: 'stars',
        reward_redeemed: 'redeem',
        reward_fulfilled: 'celebration',
        time_off_requested: 'event_note',
        time_off_approved: 'thumb_up',
        time_off_denied: 'thumb_down',
        system: 'info'
    };
    
    const notificationColors = {
        booking_created: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
        booking_confirmed: 'text-green-500 bg-green-100 dark:bg-green-900/30',
        booking_cancelled: 'text-red-500 bg-red-100 dark:bg-red-900/30',
        appointment_started: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
        appointment_completed: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
        groomer_assigned: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
        points_earned: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
        reward_redeemed: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30',
        reward_fulfilled: 'text-green-500 bg-green-100 dark:bg-green-900/30',
        time_off_approved: 'text-green-500 bg-green-100 dark:bg-green-900/30',
        time_off_denied: 'text-red-500 bg-red-100 dark:bg-red-900/30',
        system: 'text-slate-500 bg-slate-100 dark:bg-slate-800'
    };
    
    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };
    
    return `
        <div class="fixed inset-0 z-[100] bg-black/50" onclick="closeNotifications()">
            <div class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-surface-dark shadow-2xl overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                <!-- Header -->
                <div class="p-4 border-b border-slate-200 dark:border-border-dark flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary">notifications</span>
                        <h2 class="text-lg font-bold dark:text-white">Notifications</h2>
                        ${state.unreadNotifications > 0 ? `
                            <span class="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">${state.unreadNotifications}</span>
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        ${state.unreadNotifications > 0 ? `
                            <button onclick="markAllNotificationsRead()" class="text-sm text-primary hover:underline">
                                Mark all read
                            </button>
                        ` : ''}
                        <button onclick="closeNotifications()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
                
                <!-- Notifications List -->
                <div class="flex-1 overflow-y-auto">
                    ${notifications.length > 0 ? notifications.map(n => `
                        <div class="p-4 border-b border-slate-100 dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${n.is_read ? 'opacity-70' : ''}"
                             onclick="markNotificationRead('${n.id}')">
                            <div class="flex gap-3">
                                <div class="w-10 h-10 rounded-full ${notificationColors[n.type] || notificationColors.system} flex items-center justify-center flex-shrink-0">
                                    <span class="material-symbols-outlined text-lg">${notificationIcons[n.type] || 'info'}</span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-start justify-between gap-2">
                                        <p class="font-semibold text-slate-900 dark:text-white text-sm">${n.title}</p>
                                        ${!n.is_read ? '<span class="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>' : ''}
                                    </div>
                                    <p class="text-sm text-slate-600 dark:text-slate-400 mt-0.5">${n.message}</p>
                                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">${formatTime(n.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="p-8 text-center">
                            <span class="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">notifications_off</span>
                            <p class="text-slate-500 dark:text-slate-400">No notifications yet</p>
                            <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">You'll see updates about your appointments here</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}


async function handleBooking(e) { 
    e.preventDefault();
    
    // Get form values using IDs (more reliable than array indices)
    const petId = document.getElementById('booking-pet')?.value;
    const serviceSelect = document.getElementById('booking-service-select');
    const selectedOption = serviceSelect?.selectedOptions[0];
    const serviceId = selectedOption?.value;
    const serviceName = selectedOption?.dataset?.name || 'Full Groom';
    const servicePrice = parseFloat(selectedOption?.dataset?.price) || 85;
    const serviceDuration = parseInt(selectedOption?.dataset?.duration) || 60;
    const date = document.getElementById('booking-date')?.value;
    const time = document.getElementById('booking-time')?.value;
    const address = document.getElementById('booking-address')?.value;
    const notes = document.getElementById('booking-notes')?.value || '';
    
    // Get coordinates from smart booking state (for route optimization)
    const customerCoords = state.customerBookingCoords || null;
    
    // Get pre-selected groomer from smart booking (if available)
    const selectedGroomerId = state.selectedBookingGroomer || null;
    
    // Validate required fields
    if (!petId || petId === '') {
        showToast('Please add a pet first', 'error');
        return;
    }
    if (!date) {
        showToast('Please select a date', 'error');
        return;
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
        showToast('Cannot book appointments in the past', 'error');
        return;
    }
    
    if (!time || time === '') {
        showToast('Please select a time', 'error');
        return;
    }
    if (!address) {
        showToast('Please enter an address', 'error');
        return;
    }
    
    // Double-check availability before booking (prevent race conditions)
    showLoading();
    try {
        const slots = await getAvailableSlots(date, serviceId);
        // Convert time to 24hr format if needed for comparison
        const time24 = time.includes(':') ? time.slice(0, 5) : time;
        
        if (!slots.includes(time24)) {
            hideLoading();
            showToast('Sorry, this time slot is no longer available. Please select another time.', 'error');
            // Refresh the available slots
            handleBookingDateChange();
            return;
        }
    } catch (err) {
        console.error('Availability check failed:', err);
        // Continue anyway if check fails - the slot might still be available
    }
    hideLoading();
    
    _log('Booking appointment:', { petId, serviceId, serviceName, servicePrice, serviceDuration, date, time, address, notes, customerCoords, selectedGroomerId });
    
    // Create the appointment with coordinates and groomer assignment
    const result = await createAppointment({
        petId,
        serviceId: serviceId !== 'default' ? serviceId : null,  // Don't store invalid IDs
        date,
        time,
        address,
        city: state.currentUser.city || '',
        zip: state.currentUser.zip || '',
        price: servicePrice,
        duration: serviceDuration,
        notes,
        serviceName: serviceName,
        latitude: customerCoords?.latitude || null,
        longitude: customerCoords?.longitude || null,
        groomerId: selectedGroomerId  // Auto-assign groomer from smart booking
    });
    
    if (result) {
        // Reset smart booking state
        state.smartBookingData = null;
        state.selectedBookingDate = null;
        state.selectedBookingTime = null;
        state.selectedBookingGroomer = null;
        state.customerBookingCoords = null;
        closeBookingModal();
    }
}

// Delete with Confirmation

function openBookingModal(options = {}) { 
    state.showBookingModal = true;
    // Store pre-selected options for the modal
    state.bookingPreselect = {
        petId: options.petId || null,
        serviceId: options.serviceId || null,
        serviceName: options.serviceName || null
    };
    render();
    
    // Auto-load smart date picker after modal renders (Recommendation #2)
    setTimeout(() => {
        if (!state.smartBookingData) {
            loadSmartDatePicker();
        }
    }, 100);
}

// Open booking modal with a specific pet pre-selected (Recommendation #7)
function openBookingModalForPet(petId) {
    openBookingModal({ petId });
}

// Quick rebook from past appointment (Recommendation #8)
function rebookAppointment(appointmentId) {
    const appointments = state.appointments || [];
    const appt = appointments.find(a => a.id === appointmentId);
    if (appt) {
        openBookingModal({
            petId: appt.pet_id,
            serviceId: appt.service_id,
            serviceName: appt.serviceName || appt.service
        });
    }
}

// #3 Reschedule: cancel old + open booking pre-filled
function rescheduleAppointment(appointmentId) {
    const appointments = state.appointments || [];
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt) return;
    
    showConfirm(
        'Reschedule Appointment',
        `We'll cancel the current appointment for ${appt.petName || 'your pet'} on ${formatDate(appt.appointment_date)} and open booking with the same details pre-filled. Continue?`,
        async () => {
            // Cancel the old appointment silently
            await cancelAppointment(appointmentId, 'Rescheduled by customer');
            
            // Open booking with same pet/service
            openBookingModal({
                petId: appt.pet_id,
                serviceId: appt.service_id,
                serviceName: appt.serviceName || appt.service
            });
            
            showToast('Pick a new date and time for ' + (appt.petName || 'your pet'), 'info');
        }
    );
}

function closeBookingModal() { 
    state.showBookingModal = false;
    // Reset smart booking state
    state.smartBookingData = null;
    state.selectedBookingDate = null;
    state.customerBookingCoords = null;
    state.bookingPreselect = null;
    render(); 
}

// #2 Booking confirmation summary
function showBookingConfirmation() {
    const petSelect = document.getElementById('booking-pet');
    const serviceSelect = document.getElementById('booking-service-select');
    const addressInput = document.getElementById('booking-address');
    const dateInput = document.getElementById('booking-date');
    const timeSelect = document.getElementById('booking-time');
    const notesInput = document.getElementById('booking-notes');
    
    const petName = petSelect?.options[petSelect.selectedIndex]?.text || 'N/A';
    const serviceName = serviceSelect?.options[serviceSelect.selectedIndex]?.getAttribute('data-name') || serviceSelect?.options[serviceSelect.selectedIndex]?.text || 'N/A';
    const servicePrice = serviceSelect?.options[serviceSelect.selectedIndex]?.getAttribute('data-price') || '';
    const serviceDuration = serviceSelect?.options[serviceSelect.selectedIndex]?.getAttribute('data-duration') || '60';
    const address = addressInput?.value || 'N/A';
    const date = dateInput?.value ? formatDate(dateInput.value) : 'N/A';
    const time = timeSelect?.value ? formatTime(timeSelect.value) : (state.selectedBookingTime ? formatTime(state.selectedBookingTime) : 'N/A');
    const notes = notesInput?.value || 'None';
    
    if (!dateInput?.value) { showToast('Please select a date', 'warning'); return; }
    if (!timeSelect?.value && !state.selectedBookingTime) { showToast('Please select a time', 'warning'); return; }
    
    const summaryHTML = `
        <div class="bg-background-light dark:bg-background-dark rounded-xl p-4 space-y-3">
            <div class="flex items-center gap-3 pb-3 border-b border-border-light dark:border-border-dark">
                <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><span class="material-symbols-outlined text-primary">pets</span></div>
                <div><p class="text-xs text-text-sub-light dark:text-text-sub-dark">Pet</p><p class="font-bold dark:text-white">${petName}</p></div>
            </div>
            <div class="flex items-center gap-3 pb-3 border-b border-border-light dark:border-border-dark">
                <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><span class="material-symbols-outlined text-primary">content_cut</span></div>
                <div class="flex-1"><p class="text-xs text-text-sub-light dark:text-text-sub-dark">Service</p><p class="font-bold dark:text-white">${serviceName}</p></div>
                ${servicePrice ? `<span class="text-lg font-bold text-primary">$${servicePrice}</span>` : ''}
            </div>
            <div class="flex items-center gap-3 pb-3 border-b border-border-light dark:border-border-dark">
                <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><span class="material-symbols-outlined text-primary">calendar_month</span></div>
                <div><p class="text-xs text-text-sub-light dark:text-text-sub-dark">Date & Time</p><p class="font-bold dark:text-white">${date} at ${time}</p><p class="text-xs text-text-sub-light dark:text-text-sub-dark">~${serviceDuration} min</p></div>
            </div>
            <div class="flex items-center gap-3 pb-3 border-b border-border-light dark:border-border-dark">
                <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><span class="material-symbols-outlined text-primary">location_on</span></div>
                <div><p class="text-xs text-text-sub-light dark:text-text-sub-dark">Address</p><p class="font-bold dark:text-white">${address}</p></div>
            </div>
            ${notes && notes !== 'None' ? `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><span class="material-symbols-outlined text-primary">notes</span></div>
                <div><p class="text-xs text-text-sub-light dark:text-text-sub-dark">Notes</p><p class="text-sm dark:text-white">${notes}</p></div>
            </div>` : ''}
        </div>
    `;
    
    const summaryEl = document.getElementById('booking-summary-content');
    const summaryPanel = document.getElementById('booking-confirmation-summary');
    const form = document.getElementById('booking-form');
    if (summaryEl) summaryEl.innerHTML = summaryHTML;
    if (summaryPanel) summaryPanel.classList.remove('hidden');
    if (form) form.classList.add('hidden');
}

function hideBookingConfirmation() {
    const summaryPanel = document.getElementById('booking-confirmation-summary');
    const form = document.getElementById('booking-form');
    if (summaryPanel) summaryPanel.classList.add('hidden');
    if (form) form.classList.remove('hidden');
}

function submitBookingFromConfirmation() {
    hideBookingConfirmation();
    const form = document.getElementById('booking-form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}


