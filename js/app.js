// =============================================
// DOGFATHERS PLUS — APP.JS
// =============================================

// =============================================
// SUPABASE DATA FUNCTIONS
// =============================================

// Initialize app - check for existing session
async function initApp() {
    _log('Initializing app...');
    
    // Show offline banner if starting without connection
    if (isOffline) showOfflineBanner();
    
    try {
        showLoading();
        
        // Check for password recovery token in URL first
        if (checkForPasswordRecovery()) {
            hideLoading();
            render();
            return; // Don't continue with normal init if in recovery mode
        }
        
        // Add timeout to prevent infinite loading
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Init timeout')), 8000)
        );
        
        const init = async () => {
            // Check for existing session
            if (supabaseClient) {
                const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
                if (sessionError) {
                    console.error('Session error:', sessionError);
                }
                
                if (session) {
                    _log('Found existing session');
                    state.session = session;
                    state.showOnboarding = false;
                    
                    // Load user profile and public data in parallel
                    await Promise.all([
                        loadUserProfile(session.user.id),
                        loadPublicData(),
                        loadSmartBookingSettings()
                    ]);
                } else {
                    // No session - just load public data in parallel
                    await Promise.all([
                        loadPublicData(),
                        loadSmartBookingSettings()
                    ]);
                }
                
                // Set up real-time subscriptions (non-blocking)
                setupRealtimeSubscriptions();
                startReminderInterval();
            }
        };
        
        // Race between init and timeout
        await Promise.race([init(), timeout]).catch(err => {
            _warn('Init timeout or error, continuing anyway:', err.message);
        });
        
        hideLoading();
        render();
        _log('App initialized successfully');
    } catch (err) {
        console.error('Init error:', err);
        hideLoading();
        render();
    }
}

// =============================================
// REAL-TIME SUBSCRIPTIONS (2-WAY SYNC)
// =============================================
function cleanupRealtimeSubscriptions() {
    if (!supabaseClient) return;
    try {
        supabaseClient.removeAllChannels();
        _log('Cleaned up realtime subscriptions');
    } catch(e) { console.error('Cleanup error:', e); }
}

function setupRealtimeSubscriptions() {
    if (!supabaseClient) return;
    
    // Clean up existing subscriptions before re-subscribing
    cleanupRealtimeSubscriptions();
    
    try {
        // Subscribe to appointments changes
        supabaseClient
            .channel('appointments-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, async (payload) => {
                _log('Appointment change:', payload.eventType);
                await handleRealtimeUpdate('appointments', payload);
            })
            .subscribe((status) => {
                _log('Appointments subscription:', status);
            });

        // Subscribe to pets changes
        supabaseClient
            .channel('pets-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pets' }, async (payload) => {
                _log('Pet change:', payload.eventType);
                await handleRealtimeUpdate('pets', payload);
            })
            .subscribe();

        // Subscribe to products changes
        supabaseClient
            .channel('products-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async (payload) => {
                _log('Product change:', payload.eventType);
                await handleRealtimeUpdate('products', payload);
            })
            .subscribe();

        // Subscribe to rewards changes
        supabaseClient
            .channel('rewards-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, async (payload) => {
                _log('Reward change:', payload.eventType);
                await handleRealtimeUpdate('rewards', payload);
            })
            .subscribe();

        // Subscribe to ride_along_packages changes
        supabaseClient
            .channel('ridealongs-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_along_packages' }, async (payload) => {
                _log('Ride-along change:', payload.eventType);
                await handleRealtimeUpdate('ride_along_packages', payload);
            })
            .subscribe();

        // Subscribe to profiles/customers changes (for admin)
        supabaseClient
            .channel('profiles-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, async (payload) => {
                _log('Profile change:', payload.eventType);
            await handleRealtimeUpdate('profiles', payload);
        })
        .subscribe();

    // Subscribe to services changes
    supabaseClient
        .channel('services-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, async (payload) => {
            _log('Service change:', payload.eventType);
            await handleRealtimeUpdate('services', payload);
        })
        .subscribe();

    // Subscribe to reward_redemptions changes
    supabaseClient
        .channel('redemptions-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_redemptions' }, async (payload) => {
            _log('Redemption change:', payload.eventType);
            await handleRealtimeUpdate('reward_redemptions', payload);
        })
        .subscribe();

    // Subscribe to ride_along_inquiries changes
    supabaseClient
        .channel('inquiries-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_along_inquiries' }, async (payload) => {
            _log('Inquiry change:', payload.eventType);
            await handleRealtimeUpdate('ride_along_inquiries', payload);
        })
        .subscribe();
        
    _log('Realtime subscriptions set up successfully');
    } catch (err) {
        console.error('Failed to set up realtime subscriptions:', err);
    }
}

// Handle real-time updates
async function handleRealtimeUpdate(table, payload) {
    try {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch(table) {
            case 'appointments':
                // Reload appointments for admin, groomer, and customer views
                if (state.currentUser?.role === 'admin') {
                    await loadAdminData();
                    
                    // Show specific notification based on status change
                    if (eventType === 'UPDATE' && newRecord?.status !== oldRecord?.status) {
                        const petName = newRecord.pet_name || 'Pet';
                        const groomerName = newRecord.groomer_name || 'Groomer';
                        
                        if (newRecord.status === 'in_progress') {
                            showToast(`🚀 ${groomerName} started grooming ${petName}`, 'info');
                        } else if (newRecord.status === 'completed') {
                            showToast(`✅ ${groomerName} completed ${petName}'s appointment`, 'success');
                        } else if (newRecord.status === 'cancelled') {
                            showToast(`❌ Appointment cancelled`, 'warning');
                        } else {
                            showToast(`Appointment status: ${newRecord.status}`, 'info');
                        }
                    } else {
                        showToast(`Appointment ${eventType === 'INSERT' ? 'created' : eventType === 'UPDATE' ? 'updated' : 'changed'}`, 'info');
                    }
                } else if (state.currentUser?.role === 'groomer') {
                    // Check if this appointment is assigned to current groomer
                    // Field is assigned_groomer_id in the database
                    const isMyAppointment = newRecord?.assigned_groomer_id === state.currentUser.id || 
                                            oldRecord?.assigned_groomer_id === state.currentUser.id;
                    
                    // Check if this update was made by the current user (don't notify for own actions)
                    const isOwnAction = newRecord?.completed_by === state.currentUser.id ||
                                       (newRecord?.status === 'in_progress' && newRecord?.assigned_groomer_id === state.currentUser.id);
                    
                    _log('Real-time groomer check:', {
                        eventType,
                        newGroomerId: newRecord?.assigned_groomer_id,
                        oldGroomerId: oldRecord?.assigned_groomer_id,
                        myId: state.currentUser.id,
                        isMyAppointment,
                        isOwnAction
                    });
                    
                    if (isMyAppointment) {
                        await loadGroomerData();
                        
                        // Don't show notifications for own actions (start/complete)
                        if (!isOwnAction) {
                            // Show specific notification based on event
                            if (eventType === 'INSERT' || (eventType === 'UPDATE' && newRecord?.assigned_groomer_id === state.currentUser.id && oldRecord?.assigned_groomer_id !== state.currentUser.id)) {
                                showToast('🆕 New appointment assigned to you!', 'success');
                            } else if (eventType === 'UPDATE' && newRecord?.status === 'cancelled') {
                                showToast('❌ An appointment was cancelled', 'warning');
                                // Close detail view if viewing this appointment
                                if (state.selectedAppointment?.id === newRecord.id) {
                                    closeAppointmentDetail();
                                }
                            } else if (eventType === 'DELETE') {
                                showToast('🗑️ Appointment removed', 'warning');
                                if (state.selectedAppointment?.id === oldRecord.id) {
                                    closeAppointmentDetail();
                                }
                            }
                            // Note: Removed generic "Appointment updated" toast to reduce noise
                        }
                        
                        render();
                    }
                } else if (state.currentUser) {
                    await loadCustomerData(state.currentUser.id);
                    showToast(`Appointment ${eventType === 'INSERT' ? 'created' : eventType === 'UPDATE' ? 'updated' : 'changed'}`, 'info');
                }
                break;
                
            case 'pets':
                // Update pets for the owner
                if (state.currentUser && newRecord?.owner_id === state.currentUser.id) {
                    await loadCustomerData(state.currentUser.id);
                }
                // Admin sees all changes
            if (state.currentUser?.role === 'admin') {
                await loadAdminData();
            }
            break;
            
        case 'products':
            // Reload products for everyone
            await loadPublicData();
            if (state.currentUser?.role === 'admin') {
                showToast('Products updated', 'info');
            }
            break;
            
        case 'rewards':
            // Reload rewards for everyone
            await loadPublicData();
            break;
            
        case 'ride_along_packages':
            // Reload packages for everyone
            await loadPublicData();
            break;
            
        case 'profiles':
            // Admin: reload customer list
            if (state.currentUser?.role === 'admin') {
                await loadAdminData();
            }
            // Customer: update own profile if changed
            if (newRecord?.id === state.currentUser?.id) {
                state.currentUser = {
                    ...state.currentUser,
                    name: newRecord.full_name,
                    phone: newRecord.phone,
                    loyaltyPoints: newRecord.loyalty_points,
                    address: newRecord.address,
                    city: newRecord.city,
                    zip: newRecord.zip_code
                };
            }
            break;
            
        case 'services':
            // Reload services for ALL users (admin, customer, groomer)
            // No notification needed - just silently update the data
            _log('Services updated via real-time:', eventType, newRecord?.name || oldRecord?.name);
            await loadPublicData();
            break;
            
        case 'reward_redemptions':
            // Admin sees all redemptions
            if (state.currentUser?.role === 'admin') {
                await loadAdminData();
                showToast('New reward redemption received', 'info');
            }
            break;
            
        case 'ride_along_inquiries':
            // Admin sees all inquiries
            if (state.currentUser?.role === 'admin') {
                await loadAdminData();
                showToast('New ride-along inquiry received', 'info');
            }
            break;
    }
    
    render();
    } catch (err) {
        console.error('Realtime update error:', err);
    }
}

// Manual refresh function for users
async function refreshData() {
    showLoading();
    try {
        await loadPublicData();
        if (state.currentUser?.role === 'admin') {
            await loadAdminData();
        } else if (state.currentUser) {
            await loadCustomerData(state.currentUser.id);
        }
        showToast('Data refreshed!', 'success');
    } catch (err) {
        console.error('Refresh error:', err);
        showToast('Failed to refresh data', 'error');
    }
    hideLoading();
    render();
}

// Load user profile from database
async function loadUserProfile(userId) {
    try {
        _log('Loading profile for user:', userId);
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('Profile load error:', error);
            // Don't return - try to continue
        }
        
        if (profile) {
            _log('Profile loaded:', profile);
            state.currentUser = {
                id: profile.id,
                email: profile.email,
                name: profile.full_name,
                phone: profile.phone,
                role: profile.role || 'customer',
                loyaltyPoints: profile.loyalty_points || 0,
                avatar: profile.avatar_url,
                address: profile.address,
                city: profile.city,
                zip: profile.zip_code
            };
            
            // Load user-specific data based on role
            if (profile.role === 'admin') {
                await loadAdminData();
            } else if (profile.role === 'groomer') {
                // FIX: Load groomer data on refresh
                _log('Loading groomer data for role: groomer');
                await loadGroomerData();
            } else {
                await loadCustomerData(userId);
            }
            return true;
        } else {
            _log('No profile found for user');
            return false;
        }
    } catch (err) {
        console.error('Failed to load user profile:', err);
        return false;
    }
}

// Load public data (services, products, etc)
async function loadPublicData() {
    try {
        // Run all queries in parallel for faster loading
        const [servicesResult, productsResult, rewardsResult, packagesResult, hoursResult] = await Promise.all([
            supabaseClient.from('services').select('*').order('sort_order'),
            supabaseClient.from('products').select('*').order('sort_order'),
            supabaseClient.from('rewards').select('*').eq('is_active', true),
            supabaseClient.from('ride_along_packages').select('*').eq('is_active', true).order('sort_order'),
            supabaseClient.from('business_hours').select('*').order('day_of_week')
        ]);
        
        if (servicesResult.error) console.error('Services load error:', servicesResult.error);
        state.services = servicesResult.data || [];
        _log('Services loaded:', state.services.length, 'total');
        
        if (productsResult.error) console.error('Products load error:', productsResult.error);
        state.products = productsResult.data || [];
        
        if (rewardsResult.error) console.error('Rewards load error:', rewardsResult.error);
        state.rewards = rewardsResult.data || [];
        
        if (packagesResult.error) console.error('Packages load error:', packagesResult.error);
        state.rideAlongPackages = packagesResult.data || [];
        
        if (hoursResult.error) console.error('Hours load error:', hoursResult.error);
        state.businessHours = hoursResult.data || [];
    } catch (err) {
        console.error('Failed to load public data:', err);
    }
}

// Load customer-specific data
async function loadCustomerData(userId) {
    try {
        _log('Loading customer data for:', userId);
        
        // Load pets
        const { data: pets, error: petsError } = await supabaseClient
            .from('pets')
            .select('*')
            .eq('owner_id', userId)
            .eq('is_active', true);
        if (petsError) console.error('Pets load error:', petsError);
        _log('Pets loaded:', pets?.length || 0);
        state.pets = pets || [];

        // Load appointments with JOINs
        const { data: appointments, error: apptsError } = await supabaseClient
            .from('appointments')
            .select(`
                *,
                pet:pets(name, breed),
                service:services(name)
            `)
            .eq('customer_id', userId)
            .order('created_at', { ascending: false });
        if (apptsError) console.error('Appointments load error:', apptsError);
        _log('Appointments loaded:', appointments?.length || 0, appointments);
        
        // Map appointments and resolve names from local state if JOIN failed
        state.appointments = (appointments || []).map(a => {
            // Try to get names from JOIN first, then fall back to local state
            let petName = a.pet?.name;
            let petBreed = a.pet?.breed;
            let serviceName = a.service?.name;
            
            // If JOIN didn't return pet data, look it up from local state
            if (!petName && a.pet_id && state.pets.length > 0) {
                const localPet = state.pets.find(p => p.id === a.pet_id);
                if (localPet) {
                    petName = localPet.name;
                    petBreed = localPet.breed;
                }
            }
            
            // If JOIN didn't return service data, look it up from loaded services
            if (!serviceName && a.service_id && state.services?.length > 0) {
                const localService = state.services.find(s => s.id === a.service_id);
                if (localService) {
                    serviceName = localService.name;
                }
            }
            
            return {
                ...a,
                petName: petName || 'Pet',
                petBreed: petBreed || '',
                serviceName: serviceName || 'Grooming'
            };
        });

        // Note: Onboarding is only triggered after NEW signup, not here
        // Users can add pets/address from their dashboard if needed
        
        // Load notifications
        await loadNotifications();
    } catch (err) {
        console.error('Failed to load customer data:', err);
    }
}

// Load admin data
async function loadAdminData() {
    try {
        _log('Loading admin data...');
        
        // Load all appointments with customer, pet, service, and assigned groomer info
        // Note: groomer join uses explicit FK name because profiles is referenced twice
        const { data: appointments, error: apptsError } = await supabaseClient
            .from('appointments')
            .select(`
                *,
                customer:profiles!appointments_customer_id_fkey(full_name, email, phone, address, city),
                pet:pets(name, breed, weight, grooming_notes, photo_url),
                service:services(name, duration_minutes),
                groomer:profiles!appointments_assigned_groomer_id_fkey(full_name, phone)
            `)
            .order('created_at', { ascending: false });
        
        if (apptsError) {
            console.error('Admin appointments load error:', apptsError);
            
            // Try without groomer join (in case groomer-db-setup.sql hasn't been run)
            _log('Trying query without groomer join...');
            const { data: appts2, error: err2 } = await supabaseClient
                .from('appointments')
                .select(`
                    *,
                    customer:profiles!appointments_customer_id_fkey(full_name, email, phone, address, city),
                    pet:pets(name, breed, weight, grooming_notes, photo_url),
                    service:services(name, duration_minutes)
                `)
                .order('created_at', { ascending: false });
            
            if (!err2 && appts2) {
                _log('Loaded appointments without groomer join:', appts2.length);
                state.allAppointments = (appts2 || []).map(a => ({
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
                    groomerName: null, // Groomer system not set up yet
                    groomerPhone: null
                }));
            } else {
                // Fallback: try simpler query without joins
                _log('Trying fallback query without joins...');
                const { data: simpleAppts, error: simpleError } = await supabaseClient
                    .from('appointments')
                    .select('*')
                    .order('created_at', { ascending: false });
            
                if (simpleError) {
                    console.error('Fallback query also failed:', simpleError);
                    state.allAppointments = [];
                } else {
                    _log('Fallback appointments loaded:', simpleAppts?.length || 0);
                    
                    // Need to manually fetch related data
                    const mappedAppts = await Promise.all((simpleAppts || []).map(async (a) => {
                        let customerName = 'Customer', petName = 'Pet', petBreed = '', serviceName = 'Grooming', groomerName = null;
                        
                        // Fetch customer
                        if (a.customer_id) {
                            const { data: cust } = await supabaseClient
                                .from('profiles')
                                .select('full_name, email, phone, address, city')
                                .eq('id', a.customer_id)
                                .single();
                            if (cust) customerName = cust.full_name || 'Customer';
                        }
                        
                        // Fetch pet
                        if (a.pet_id) {
                            const { data: pet } = await supabaseClient
                                .from('pets')
                                .select('name, breed, weight, grooming_notes, photo_url')
                                .eq('id', a.pet_id)
                                .single();
                            if (pet) {
                                petName = pet.name || 'Pet';
                                petBreed = pet.breed || '';
                            }
                        }
                        
                        // Fetch service
                        if (a.service_id) {
                            const { data: svc } = await supabaseClient
                                .from('services')
                                .select('name')
                                .eq('id', a.service_id)
                                .single();
                            if (svc) serviceName = svc.name || 'Grooming';
                        }
                        
                        // Fetch assigned groomer
                        if (a.assigned_groomer_id) {
                            const { data: grm } = await supabaseClient
                                .from('profiles')
                                .select('full_name')
                                .eq('id', a.assigned_groomer_id)
                                .single();
                            if (grm) groomerName = grm.full_name || 'Groomer';
                        }
                        
                        return { ...a, customerName, petName, petBreed, serviceName, groomerName };
                    }));
                    
                    state.allAppointments = mappedAppts;
                }
            }
        } else {
            _log('Admin appointments loaded:', appointments?.length || 0, appointments);
            state.allAppointments = (appointments || []).map(a => ({
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
                groomerName: a.groomer?.full_name || null,
                groomerPhone: a.groomer?.phone || null
            }));
        }

        // Load all customers
        const { data: customers, error: customersError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('role', 'customer')
            .order('created_at', { ascending: false });
        if (customersError) console.error('Customers load error:', customersError);
        _log('Customers loaded:', customers?.length || 0);
        state.allCustomers = customers || [];
        
        // Load all pets for customers
        const { data: allPets, error: petsError } = await supabaseClient
            .from('pets')
            .select('*')
            .order('name', { ascending: true });
        if (petsError) console.error('Pets load error:', petsError);
        _log('All pets loaded:', allPets?.length || 0);
        state.pets = allPets || [];
        
        // Load all groomers with full details
        const { data: groomers, error: groomersError } = await supabaseClient
            .from('profiles')
            .select('id, full_name, phone, email, specialties, is_active, hired_date, admin_notes, created_at')
            .eq('role', 'groomer')
            .order('full_name', { ascending: true });
        if (groomersError) console.error('Groomers load error:', groomersError);
        _log('Groomers loaded:', groomers?.length || 0);
        
        // Calculate stats for each groomer
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        _log('Current month for stats:', currentMonth);
        _log('All appointments with groomer IDs:', state.allAppointments.map(a => ({
            id: a.id.substring(0, 8),
            assigned_groomer_id: a.assigned_groomer_id?.substring(0, 8) || 'none',
            date: a.appointment_date
        })));
        
        state.groomers = (groomers || []).map(g => {
            // Count appointments assigned to this groomer this month
            const groomerAppts = state.allAppointments.filter(a => {
                if (a.assigned_groomer_id !== g.id) return false;
                // Handle date - check if it starts with current month
                if (!a.appointment_date) return false;
                let dateStr = a.appointment_date;
                // Fix malformed dates like "20026-01-28"
                if (dateStr.length === 11 && dateStr.startsWith('20')) {
                    dateStr = dateStr.substring(1);
                }
                return dateStr.startsWith(currentMonth);
            });
            
            _log(`Groomer ${g.full_name} (${g.id.substring(0, 8)}) - Found ${groomerAppts.length} appointments this month`);
            
            const completedAppts = groomerAppts.filter(a => a.status === 'completed');
            const monthRevenue = completedAppts.reduce((sum, a) => 
                sum + (parseFloat(a.total_price) || 0), 0
            );
            
            return {
                ...g,
                appointmentsThisMonth: groomerAppts.length,
                completedThisMonth: completedAppts.length,
                revenueThisMonth: monthRevenue,
                // Parse specialties if stored as string
                specialties: Array.isArray(g.specialties) ? g.specialties : 
                    (g.specialties ? JSON.parse(g.specialties) : [])
            };
        });
        
        // Load ride-along inquiries
        const { data: inquiries, error: inquiriesError } = await supabaseClient
            .from('ride_along_inquiries')
            .select(`
                *,
                customer:profiles(full_name, email, phone),
                package:ride_along_packages(name, price)
            `)
            .order('created_at', { ascending: false });
        if (inquiriesError) console.error('Inquiries load error:', inquiriesError);
        _log('Inquiries loaded:', inquiries?.length || 0);
        state.rideAlongInquiries = (inquiries || []).map(i => ({
            ...i,
            customerName: i.customer?.full_name || 'Customer',
            customerEmail: i.customer?.email || '',
            customerPhone: i.customer?.phone || '',
            packageName: i.package?.name || 'Package',
            packagePrice: i.package?.price || 0
        }));
        
        // Load reward redemptions
        const { data: redemptions, error: redemptionsError } = await supabaseClient
            .from('reward_redemptions')
            .select(`
                *,
                customer:profiles(full_name, email),
                reward:rewards(name, points_required)
            `)
            .order('created_at', { ascending: false });
        if (redemptionsError) console.error('Redemptions load error:', redemptionsError);
        _log('Redemptions loaded:', redemptions?.length || 0);
        state.rewardRedemptions = (redemptions || []).map(r => ({
            ...r,
            customerName: r.customer?.full_name || 'Customer',
            customerEmail: r.customer?.email || '',
            rewardName: r.reward?.name || 'Reward',
            pointsRequired: r.reward?.points_required || 0
        }));
        
        // Load notifications
        await loadNotifications();
        
        // Load pending redemptions for fulfillment queue
        await loadPendingRedemptions();
        
        // Load pending time off requests
        await loadPendingTimeOffRequests();
        
        // Load admin messages
        await loadAdminMessages();
    } catch (err) {
        console.error('Failed to load admin data:', err);
    }
}


function render() {
    try {
        const app = document.getElementById('app');
        if (!app) {
            console.error('App element not found!');
            return;
        }
        
        // Show password reset page (after clicking email link)
        if (state.showResetPassword) {
            app.innerHTML = renderResetPasswordPage();
            return;
        }
        
        // Show groomer login page
        if (state.showGroomerLogin) {
            app.innerHTML = renderGroomerLogin() + renderForgotPasswordModal();
        } else if (!state.currentUser) {
            app.innerHTML = renderAuthPage() + renderForgotPasswordModal();
        } else if (state.showOnboarding) {
            app.innerHTML = renderOnboarding();
        } else if (state.currentUser.role === 'admin') {
            app.innerHTML = renderAdminDashboard() + renderChangePasswordModal();
        } else if (state.currentUser.role === 'groomer') {
            app.innerHTML = renderGroomerDashboard() + renderChangePasswordModal() + renderCompleteAppointmentModal() + renderBeforePhotoModal() + renderPetProfileModal();
        } else {
            app.innerHTML = renderCustomerDashboard() + renderChangePasswordModal();
        }
        attachEventListeners();
    } catch (err) {
        console.error('Render error:', err);
        document.getElementById('app').innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div class="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl text-center">
                    <span class="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                    <p class="text-gray-600 mb-4">${escapeHtml(err.message)}</p>
                    <button onclick="location.reload()" class="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }
}

// Handle auth form submission
function attachEventListeners() {
    // Cancel reason dropdown handler
    const cancelReason = document.getElementById('cancel-reason');
    if (cancelReason) {
        cancelReason.addEventListener('change', function() {
            const otherDiv = document.getElementById('cancel-other-reason');
            if (this.value === 'Other') {
                otherDiv.classList.remove('hidden');
            } else {
                otherDiv.classList.add('hidden');
            }
        });
    }
    
    // Auth form
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            
            if (state.authTab === 'signup') {
                const name = document.getElementById('auth-name')?.value || '';
                const phone = document.getElementById('auth-phone')?.value || '';
                await handleSignUp(email, password, name, phone);
            } else {
                await handleSignIn(email, password);
            }
        });
    }

    // Admin login form
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            await handleAdminLogin(email, password);
        });
    }
    
    // Groomer login form
    const groomerLoginForm = document.getElementById('groomer-login-form');
    if (groomerLoginForm) {
        groomerLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('groomer-email').value;
            const password = document.getElementById('groomer-password').value;
            await handleGroomerLogin(email, password);
        });
    }
    
    // Booking form
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) bookingForm.addEventListener('submit', handleBooking);

    // Onboarding forms
    const onboardingForm1 = document.getElementById('onboarding-form-1');
    if (onboardingForm1) {
        onboardingForm1.addEventListener('submit', async (e) => {
            e.preventDefault();
            await nextOnboardingStep();
        });
    }

    const onboardingForm2 = document.getElementById('onboarding-form-2');
    if (onboardingForm2) {
        onboardingForm2.addEventListener('submit', async (e) => {
            e.preventDefault();
            await nextOnboardingStep();
        });
    }

    // Edit forms
    const editPetForm = document.getElementById('edit-pet-form');
    if (editPetForm) editPetForm.addEventListener('submit', saveEditPet);

    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) editProfileForm.addEventListener('submit', saveEditProfile);

    const editRewardForm = document.getElementById('edit-reward-form');
    if (editRewardForm) editRewardForm.addEventListener('submit', saveEditReward);

    const editProductForm = document.getElementById('edit-product-form');
    if (editProductForm) editProductForm.addEventListener('submit', saveEditProduct);

    const editAppointmentForm = document.getElementById('edit-appointment-form');
    if (editAppointmentForm) editAppointmentForm.addEventListener('submit', saveEditAppointment);

    const editRideAlongForm = document.getElementById('edit-ridealong-form');
    if (editRideAlongForm) editRideAlongForm.addEventListener('submit', saveEditRideAlong);

    const editCourseForm = document.getElementById('edit-course-form');
    if (editCourseForm) editCourseForm.addEventListener('submit', saveEditCourse);
}

// =============================================
// PWA SERVICE WORKER REGISTRATION
// =============================================

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            _log('ServiceWorker registered:', registration.scope);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        if (confirm('A new version is available! Reload to update?')) {
                            window.location.reload();
                        }
                    }
                });
            });
        } catch (error) {
            _log('ServiceWorker registration failed:', error);
        }
    });
}

// Handle PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install button if not already installed
    if (!window.matchMedia('(display-mode: standalone)').matches) {
        state.showInstallPrompt = true;
        render();
    }
});

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                _log('PWA installed');
                showToast('App installed successfully!', 'success');
            }
            deferredPrompt = null;
            state.showInstallPrompt = false;
            render();
        });
    }
}

// Detect if running as PWA
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM is already ready
    initApp();
}

