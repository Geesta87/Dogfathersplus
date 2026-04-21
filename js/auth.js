// =============================================
// DOGFATHERS PLUS — AUTH.JS
// =============================================

// Normalize email: trim whitespace + lowercase. Prevents duplicate accounts
// from "Sarah@x.com" vs "sarah@x.com" and login failures from trailing spaces.
function normalizeEmail(raw) {
    return (raw || '').trim().toLowerCase();
}

// =============================================
// AUTHENTICATION FUNCTIONS
// =============================================

async function handleSignUp(email, password, fullName, phone) {
    email = normalizeEmail(email);
    showLoading();

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone: phone
            }
        }
    });
    
    hideLoading();
    
    if (error) {
        showToast(error.message, 'error');
        return false;
    }
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
        showToast('Check your email to confirm your account!', 'success');
        state.authTab = 'login';
        render();
    } else if (data.session) {
        // Auto-confirmed - NEW USER, show onboarding
        // IMPORTANT: Set onboarding flags FIRST before setting currentUser
        // This prevents a flash of dashboard during the transition
        state.showOnboarding = true;
        state.onboardingStep = 1;
        
        state.session = data.session;
        
        // Set up basic user info
        state.currentUser = {
            id: data.user.id,
            email: data.user.email,
            name: fullName,
            phone: phone,
            role: 'customer',
            loyaltyPoints: 0
        };
        
        // Load public data (services, products, etc)
        await loadPublicData();
        
        showToast(`Welcome, ${fullName}! Let's set up your account.`, 'success');
        render();
    }
    return true;
}

async function handleSignIn(email, password) {
    email = normalizeEmail(email);
    showLoading();

    // Reset onboarding state - login should NEVER show onboarding
    state.showOnboarding = false;
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            hideLoading();
            showToast(error.message, 'error');
            return false;
        }
        
        _log('Sign in successful, loading profile...');
        state.session = data.session;
        
        // Try to load user profile
        const profileLoaded = await loadUserProfile(data.user.id);
        
        // If profile didn't load, create a basic one from auth data
        if (!state.currentUser) {
            _log('Profile not found, using auth data');
            state.currentUser = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.full_name || email.split('@')[0],
                role: 'customer',
                loyaltyPoints: 0
            };
            
            // Try to load customer data anyway
            await loadCustomerData(data.user.id);
        }
        
        await loadPublicData();
        hideLoading();
        showToast(`Welcome back, ${state.currentUser?.name || 'there'}!`, 'success');
        render();
        return true;
    } catch (err) {
        console.error('Sign in exception:', err);
        hideLoading();
        showToast('Login failed: ' + err.message, 'error');
        return false;
    }
}

async function handleSignOut() {
    showLoading();
    stopReminderInterval();
    cleanupRealtimeSubscriptions();
    await supabaseClient.auth.signOut();
    state.currentUser = null;
    state.session = null;
    state.pets = [];
    state.appointments = [];
    state.allAppointments = [];
    state.allCustomers = [];
    state.rideAlongInquiries = [];
    state.rewardRedemptions = [];
    state.groomers = [];
    state.groomerAppointments = [];
    state.showGroomerLogin = false;
    state.showAdminLogin = false;

    // If we're on a staff portal, re-arm that portal's login view so the
    // signed-out user lands back on the correct login (not the customer form).
    if (window.__PORTAL === 'groomer') state.showGroomerLogin = true;
    if (window.__PORTAL === 'admin') state.showAdminLogin = true;

    hideLoading();
    showToast('Signed out successfully', 'info');
    render();
}


// =============================================
// GROOMER LOGIN PAGE
// =============================================
function renderGroomerLogin() {
    return `
    <div class="flex flex-1 w-full min-h-screen">
        <div class="hidden lg:flex lg:w-1/2 relative bg-emerald-600 items-center justify-center overflow-hidden">
            <div class="absolute inset-0 z-0">
                <img alt="Dog grooming professional" class="w-full h-full object-cover opacity-40" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAgB_Ncu0Jwq7NoOkvrWM3LGmNdBpAvJUbF63k_Xj9ezgydcIjvE6ICw5DsWJPlgZ5OAkQu_V81UIU9qbm1qZ6jJvuGb7NSlCZ9l2elEVA1AdGbc2gqs-Qcflihvblt2dmv7_bhd6nC-BDxrA3AuKq663UGylWq-VkgYnjpJKcbP_6mU7YoSnvb5-bzJQReNiTzDYO5B_lEB1sPJQGHUr_CvYOx9sErYMiLLlVrM1DPw9IAGvTFteiACwuGtOkYAjnJShJTBJnZh45"/>
                <div class="absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-emerald-800/40 to-transparent"></div>
            </div>
            <div class="relative z-10 text-center text-white px-12">
                <div class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <span class="material-symbols-outlined text-5xl">content_cut</span>
                </div>
                <h2 class="text-4xl font-black mb-4">Groomer Portal</h2>
                <p class="text-xl text-white/80 max-w-md mx-auto">Access your assigned appointments and manage your daily schedule.</p>
            </div>
        </div>
        <div class="flex flex-1 w-full lg:w-1/2 items-center justify-center px-6 py-12 bg-background-light dark:bg-background-dark">
            <div class="w-full max-w-md">
                <div class="flex items-center gap-3 mb-8">
                    <div class="w-14 h-14 rounded-xl overflow-hidden shadow-lg">
                        <img src="${LOGO_MAIN}" alt="Dogfathersplus" class="w-full h-full object-cover"/>
                    </div>
                    <div>
                        <h1 class="text-2xl font-black dark:text-white">Dogfathers<span class="text-emerald-600">plus</span></h1>
                        <p class="text-sm text-emerald-600 font-semibold">Groomer Login</p>
                    </div>
                </div>
                
                <div class="bg-surface-light dark:bg-surface-dark rounded-2xl p-8 shadow-xl border border-border-light dark:border-border-dark">
                    <h2 class="text-2xl font-bold mb-2 dark:text-white">Welcome Back</h2>
                    <p class="text-text-sub-light dark:text-text-sub-dark mb-6">Sign in to view your assignments</p>
                    
                    <form id="groomer-login-form" class="space-y-5">
                        <div>
                            <label class="block text-sm font-semibold mb-2 dark:text-white">Email</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-sub-light">mail</span>
                                <input id="groomer-email" type="email" required placeholder="groomer@dogfathersplus.com" 
                                    class="w-full h-12 pl-11 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"/>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-2 dark:text-white">Password</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-sub-light">lock</span>
                                <input id="groomer-password" type="password" required placeholder="••••••••" 
                                    class="w-full h-12 pl-11 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"/>
                            </div>
                        </div>
                        <button type="submit" class="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <span class="material-symbols-outlined">login</span>
                            Sign In as Groomer
                        </button>
                        <div class="text-center mt-3">
                            <a href="#" onclick="openForgotPassword(document.getElementById('groomer-email')?.value || ''); return false;" class="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">Forgot password?</a>
                        </div>
                    </form>
                    
                    ${window.__PORTAL === 'groomer' ? '' : `
                    <div class="mt-6 pt-6 border-t border-border-light dark:border-border-dark text-center">
                        <button onclick="state.showGroomerLogin = false; render();" class="text-primary hover:underline text-sm font-medium">
                            ← Back to Customer Login
                        </button>
                    </div>`}
                </div>
            </div>
        </div>
    </div>`;
}


function renderAuthPage() {
    return `
    <div class="flex flex-1 w-full min-h-screen">
        <div class="hidden lg:flex lg:w-1/2 relative bg-primary/10 items-center justify-center overflow-hidden">
            <div class="absolute inset-0 z-0">
                <img alt="Dog grooming" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAgB_Ncu0Jwq7NoOkvrWM3LGmNdBpAvJUbF63k_Xj9ezgydcIjvE6ICw5DsWJPlgZ5OAkQu_V81UIU9qbm1qZ6jJvuGb7NSlCZ9l2elEVA1AdGbc2gqs-Qcflihvblt2dmv7_bhd6nC-BDxrA3AuKq663UGylWq-VkgYnjpJKcbP_6mU7YoSnvb5-bzJQReNiTzDYO5B_lEB1sPJQGHUr_CvYOx9sErYMiLLlVrM1DPw9IAGvTFteiACwuGtOkYAjnJShJTBJnZh45"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            </div>
            <div class="relative z-10 p-12 text-white max-w-2xl">
                <div class="flex items-center gap-3 mb-6">
                    <div class="size-12 rounded-xl shadow-lg overflow-hidden"><img src="${LOGO_MAIN}" alt="Dogfathersplus" class="w-full h-full object-cover"/></div>
                    <h2 class="text-3xl font-bold text-white">Dogfathersplus</h2>
                </div>
                <h1 class="text-5xl font-bold leading-tight mb-6">Professional grooming at your doorstep.</h1>
                <p class="text-lg opacity-90 mb-8">Join thousands of happy pet owners who save time with our mobile grooming service.</p>
                <div class="flex items-center gap-2 text-yellow-400">
                    <span class="material-symbols-outlined fill-1">star</span><span class="material-symbols-outlined fill-1">star</span><span class="material-symbols-outlined fill-1">star</span><span class="material-symbols-outlined fill-1">star</span><span class="material-symbols-outlined fill-1">star</span>
                    <span class="text-white text-sm ml-2">Trusted by 5,000+ owners</span>
                </div>
            </div>
        </div>
        <div class="w-full lg:w-1/2 flex flex-col bg-surface-light dark:bg-surface-dark overflow-y-auto">
            <div class="lg:hidden p-6 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg overflow-hidden"><img src="${LOGO_MAIN}" alt="Dogfathersplus" class="w-full h-full object-cover"/></div>
                    <span class="font-bold text-xl dark:text-white">Dogfathersplus</span>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="toggleDarkMode()" class="p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark touch-target">
                        <span class="material-symbols-outlined">${state.darkMode ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-24 max-w-3xl mx-auto w-full">
                <div class="hidden lg:flex justify-end items-center mb-4">
                    <button onclick="toggleDarkMode()" class="p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark touch-target flex items-center gap-2 text-sm text-text-sub-light dark:text-text-sub-dark">
                        <span class="material-symbols-outlined">${state.darkMode ? 'light_mode' : 'dark_mode'}</span>
                        ${state.darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                </div>
                <div class="mb-8 text-center">
                    <h2 class="text-3xl font-bold mb-2 dark:text-white">${state.authTab === 'login' ? 'Welcome Back' : 'Join the Pack'}</h2>
                    <p class="text-text-sub-light dark:text-text-sub-dark">${state.authTab === 'login' ? 'Sign in to manage appointments.' : 'Create an account to get started.'}</p>
                </div>
                <div class="mb-8 flex border-b border-border-light dark:border-border-dark">
                    <button onclick="setAuthTab('login')" class="flex-1 pb-4 pt-2 text-sm font-bold touch-target ${state.authTab === 'login' ? 'text-primary border-b-[3px] border-primary' : 'text-text-sub-light dark:text-text-sub-dark border-b-[3px] border-transparent'}">Log In</button>
                    <button onclick="setAuthTab('signup')" class="flex-1 pb-4 pt-2 text-sm font-bold touch-target ${state.authTab === 'signup' ? 'text-primary border-b-[3px] border-primary' : 'text-text-sub-light dark:text-text-sub-dark border-b-[3px] border-transparent'}">Create Account</button>
                </div>
                <div id="auth-error" class="hidden mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                    <span class="material-symbols-outlined text-lg">error</span>
                    <span id="auth-error-text"></span>
                </div>
                <form id="auth-form" class="flex flex-col gap-5">
                    ${state.authTab === 'signup' ? `
                    <label class="flex flex-col gap-2"><span class="text-sm font-semibold dark:text-white">Full Name</span>
                        <div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub-light dark:text-text-sub-dark material-symbols-outlined text-xl">person</span>
                        <input id="auth-name" class="w-full h-12 pl-11 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" placeholder="John Smith" type="text" required/></div>
                    </label>
                    <label class="flex flex-col gap-2"><span class="text-sm font-semibold dark:text-white">Phone Number</span>
                        <div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub-light dark:text-text-sub-dark material-symbols-outlined text-xl">phone</span>
                        <input id="auth-phone" class="w-full h-12 pl-11 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" placeholder="(555) 123-4567" type="tel"/></div>
                    </label>
                    ` : ''}
                    <label class="flex flex-col gap-2"><span class="text-sm font-semibold dark:text-white">Email</span>
                        <div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub-light dark:text-text-sub-dark material-symbols-outlined text-xl">mail</span>
                        <input id="auth-email" class="w-full h-12 pl-11 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" placeholder="jane@example.com" type="email" required/></div>
                    </label>
                    <label class="flex flex-col gap-2"><span class="text-sm font-semibold dark:text-white">Password</span>
                        <div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub-light dark:text-text-sub-dark material-symbols-outlined text-xl">lock</span>
                        <input id="auth-password" class="w-full h-12 pl-11 pr-12 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary outline-none dark:text-white" placeholder="${state.authTab === 'signup' ? 'Create a password (min 6 chars)' : 'Enter password'}" type="${state.showPassword ? 'text' : 'password'}" required minlength="${state.authTab === 'signup' ? '6' : '1'}"/>
                        <button type="button" onclick="togglePassword()" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub-light dark:text-text-sub-dark hover:text-primary p-1">
                            <span class="material-symbols-outlined text-xl">${state.showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button></div>
                    </label>
                    ${state.authTab === 'login' ? `
                    <div class="flex items-center justify-between">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="remember-me" ${state.rememberMe ? 'checked' : ''} onchange="toggleRememberMe()" class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"/>
                            <span class="text-sm text-text-sub-light dark:text-text-sub-dark">Remember me</span>
                        </label>
                        <a href="#" onclick="openForgotPassword(document.getElementById('auth-email')?.value || ''); return false;" class="text-sm text-primary hover:underline">Forgot password?</a>
                    </div>` : ''}
                    <button type="submit" class="mt-4 w-full h-12 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 touch-target transition-all active:scale-[0.98]">
                        <span id="auth-btn-text">${state.authTab === 'login' ? 'Sign In' : 'Create Account'}</span>
                        <span class="material-symbols-outlined">arrow_forward</span>
                    </button>
                </form>
                <div class="mt-6 p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg text-sm text-center text-text-sub-light dark:text-text-sub-dark">
                    <strong class="text-text-main-light dark:text-white">Create an account or sign in to book appointments!</strong>
                </div>
                
                <!-- Staff access is via dedicated URLs (/admin, /groomer) — no link here by design. -->

            </div>
        </div>
    </div>
    ${state.showAdminLogin ? renderAdminLoginModal() : ''}`;
}

// Admin Login Modal
function renderAdminLoginModal() {
    return `
    <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onclick="closeAdminLogin()">
        <div class="bg-surface-light dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl" onclick="event.stopPropagation()">
            <div class="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                        <span class="material-symbols-outlined text-amber-600 dark:text-amber-400">admin_panel_settings</span>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold dark:text-white">Admin Login</h2>
                        <p class="text-xs text-text-sub-light dark:text-text-sub-dark">Authorized personnel only</p>
                    </div>
                </div>
                <button onclick="closeAdminLogin()" class="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-lg transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <form id="admin-login-form" class="p-6 space-y-5">
                <div id="admin-auth-error" class="hidden p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                    <span class="material-symbols-outlined text-lg">error</span>
                    <span id="admin-auth-error-text"></span>
                </div>
                <label class="block">
                    <span class="text-sm font-semibold mb-2 block dark:text-white">Admin Email</span>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-sub-light">mail</span>
                        <input id="admin-email" type="email" required placeholder="admin@dogfathersplus.com" 
                            class="w-full h-12 pl-12 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-amber-500 outline-none dark:text-white">
                    </div>
                </label>
                <label class="block">
                    <span class="text-sm font-semibold mb-2 block dark:text-white">Password</span>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-sub-light">lock</span>
                        <input id="admin-password" type="password" required placeholder="Enter admin password" 
                            class="w-full h-12 pl-12 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-amber-500 outline-none dark:text-white">
                    </div>
                </label>
                <button type="submit" class="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 touch-target transition-all shadow-lg shadow-amber-500/20">
                    <span class="material-symbols-outlined">login</span>
                    Sign In as Admin
                </button>
                <div class="text-center mt-3">
                    <a href="#" onclick="openForgotPassword(document.getElementById('admin-email')?.value || ''); return false;" class="text-sm text-amber-600 hover:text-amber-700 hover:underline">Forgot password?</a>
                </div>
            </form>
            <div class="px-6 pb-6">
                <div class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                    <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg mt-0.5">info</span>
                    <p class="text-xs text-amber-800 dark:text-amber-300">This area is for Dogfathersplus staff only. Unauthorized access attempts are logged.</p>
                </div>
            </div>
        </div>
    </div>`;
}

// Full-page admin login (used on /admin.html). Reuses the same input IDs as
// renderAdminLoginModal so the existing form handler in attachEventListeners works unchanged.
function renderAdminLoginPage() {
    return `
    <div class="flex flex-1 w-full min-h-screen">
        <div class="hidden lg:flex lg:w-1/2 relative bg-amber-600 items-center justify-center overflow-hidden">
            <div class="absolute inset-0 z-0 bg-gradient-to-br from-amber-500 to-amber-800"></div>
            <div class="relative z-10 text-center text-white px-12">
                <div class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <span class="material-symbols-outlined text-5xl">admin_panel_settings</span>
                </div>
                <h2 class="text-4xl font-black mb-4">Admin Portal</h2>
                <p class="text-xl text-white/80 max-w-md mx-auto">Manage appointments, groomers, services, and customer accounts.</p>
            </div>
        </div>
        <div class="flex flex-1 w-full lg:w-1/2 items-center justify-center px-6 py-12 bg-background-light dark:bg-background-dark">
            <div class="w-full max-w-md">
                <div class="flex items-center gap-3 mb-8">
                    <div class="w-14 h-14 rounded-xl overflow-hidden shadow-lg">
                        <img src="${LOGO_MAIN}" alt="Dogfathersplus" class="w-full h-full object-cover"/>
                    </div>
                    <div>
                        <h1 class="text-2xl font-black dark:text-white">Dogfathers<span class="text-amber-600">plus</span></h1>
                        <p class="text-sm text-amber-600 font-semibold">Admin Login</p>
                    </div>
                </div>

                <div class="bg-surface-light dark:bg-surface-dark rounded-2xl p-8 shadow-xl border border-border-light dark:border-border-dark">
                    <h2 class="text-2xl font-bold mb-2 dark:text-white">Welcome Back</h2>
                    <p class="text-text-sub-light dark:text-text-sub-dark mb-6">Authorized personnel only</p>

                    <form id="admin-login-form" class="space-y-5">
                        <div id="admin-auth-error" class="hidden p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                            <span class="material-symbols-outlined text-lg">error</span>
                            <span id="admin-auth-error-text"></span>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-2 dark:text-white">Admin Email</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-sub-light">mail</span>
                                <input id="admin-email" type="email" required placeholder="admin@dogfathersplus.com"
                                    class="w-full h-12 pl-11 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-amber-500 outline-none dark:text-white"/>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-2 dark:text-white">Password</label>
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-sub-light">lock</span>
                                <input id="admin-password" type="password" required placeholder="••••••••"
                                    class="w-full h-12 pl-11 pr-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-amber-500 outline-none dark:text-white"/>
                            </div>
                        </div>
                        <button type="submit" class="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20">
                            <span class="material-symbols-outlined">login</span>
                            Sign In as Admin
                        </button>
                        <div class="text-center mt-3">
                            <a href="#" onclick="openForgotPassword(document.getElementById('admin-email')?.value || ''); return false;" class="text-sm text-amber-600 hover:text-amber-700 hover:underline">Forgot password?</a>
                        </div>
                    </form>

                    <div class="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                        <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg mt-0.5">info</span>
                        <p class="text-xs text-amber-800 dark:text-amber-300">This area is for Dogfathersplus staff only. Unauthorized access attempts are logged.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

function openAdminLogin() {
    state.showAdminLogin = true;
    render();
}

function closeAdminLogin() {
    state.showAdminLogin = false;
    render();
}

async function handleAdminLogin(email, password) {
    email = normalizeEmail(email);
    showLoading();

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) {
        hideLoading();
        const errorDiv = document.getElementById('admin-auth-error');
        const errorText = document.getElementById('admin-auth-error-text');
        errorText.textContent = error.message;
        errorDiv.classList.remove('hidden');
        return false;
    }
    
    // Load profile to check if admin
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
    
    if (!profile || profile.role !== 'admin') {
        // Not an admin - sign out and show error
        await supabaseClient.auth.signOut();
        hideLoading();
        const errorDiv = document.getElementById('admin-auth-error');
        const errorText = document.getElementById('admin-auth-error-text');
        errorText.textContent = 'Access denied. This account is not authorized for admin access.';
        errorDiv.classList.remove('hidden');
        return false;
    }
    
    // Success - load admin data
    state.session = data.session;
    state.currentUser = {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
        loyaltyPoints: profile.loyalty_points || 0,
        avatar: profile.avatar_url
    };
    
    await loadAdminData();
    await loadPublicData();
    
    state.showAdminLogin = false;
    hideLoading();
    showToast(`Welcome back, ${profile.full_name || 'Admin'}!`, 'success');
    render();
    return true;
}

// =============================================
// PASSWORD RESET SYSTEM
// =============================================

// Open Forgot Password Modal
function openForgotPassword(prefilledEmail = '') {
    state.showForgotPassword = true;
    state.forgotPasswordEmail = prefilledEmail;
    state.showAdminLogin = false;
    state.showGroomerLogin = false;
    render();
}

// Close Forgot Password Modal
function closeForgotPassword() {
    state.showForgotPassword = false;
    state.forgotPasswordEmail = '';
    render();
}

// Handle Forgot Password Request
async function handleForgotPassword(e) {
    e.preventDefault();
    showLoading();

    const email = normalizeEmail(document.getElementById('forgot-email').value);

    if (!email) {
        hideLoading();
        showToast('Please enter your email address', 'error');
        return;
    }
    
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname
        });
        
        if (error) {
            hideLoading();
            showToast('Error: ' + error.message, 'error');
            return;
        }
        
        hideLoading();
        closeForgotPassword();
        showToast('Password reset email sent! Check your inbox.', 'success');
        
    } catch (err) {
        hideLoading();
        console.error('Forgot password error:', err);
        showToast('Failed to send reset email', 'error');
    }
}

// Check for password recovery token in URL (called on app init)
function checkForPasswordRecovery() {
    const hash = window.location.hash;
    
    // Supabase sends recovery links with hash like: #access_token=...&type=recovery
    if (hash && hash.includes('type=recovery')) {
        _log('Password recovery detected');
        state.showResetPassword = true;
        render();
        return true;
    }
    
    // Also check for error in URL (e.g., expired link)
    if (hash && hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1));
        const errorDesc = params.get('error_description');
        if (errorDesc) {
            showToast(decodeURIComponent(errorDesc.replace(/\+/g, ' ')), 'error');
        }
        // Clear the hash
        history.replaceState(null, '', window.location.pathname);
    }
    
    return false;
}

// Handle Setting New Password (after clicking email link)
async function handleResetPassword(e) {
    e.preventDefault();
    showLoading();
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    if (newPassword.length < 6) {
        hideLoading();
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        hideLoading();
        showToast('Passwords do not match', 'error');
        return;
    }
    
    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });
        
        if (error) {
            hideLoading();
            showToast('Error: ' + error.message, 'error');
            return;
        }
        
        // Clear the hash from URL
        history.replaceState(null, '', window.location.pathname);
        
        // Sign out and redirect to login
        await supabaseClient.auth.signOut();
        
        state.showResetPassword = false;
        state.currentUser = null;
        state.session = null;
        
        hideLoading();
        showToast('Password updated successfully! Please log in with your new password.', 'success');
        render();
        
    } catch (err) {
        hideLoading();
        console.error('Reset password error:', err);
        showToast('Failed to reset password', 'error');
    }
}

// Open Change Password Modal (for logged-in users)
function openChangePassword() {
    state.showChangePassword = true;
    render();
}

// Close Change Password Modal
function closeChangePassword() {
    state.showChangePassword = false;
    render();
}

// Handle Change Password (for logged-in users)
async function handleChangePassword(e) {
    e.preventDefault();
    showLoading();
    
    const newPassword = document.getElementById('change-new-password').value;
    const confirmPassword = document.getElementById('change-confirm-password').value;
    
    if (newPassword.length < 6) {
        hideLoading();
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        hideLoading();
        showToast('Passwords do not match', 'error');
        return;
    }
    
    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });
        
        if (error) {
            hideLoading();
            showToast('Error: ' + error.message, 'error');
            return;
        }
        
        hideLoading();
        closeChangePassword();
        showToast('Password changed successfully!', 'success');
        
    } catch (err) {
        hideLoading();
        console.error('Change password error:', err);
        showToast('Failed to change password', 'error');
    }
}

// Render Forgot Password Modal
function renderForgotPasswordModal() {
    if (!state.showForgotPassword) return '';
    
    return `
    <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onclick="closeForgotPassword()">
        <div class="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl" onclick="event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 dark:border-border-dark">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary">lock_reset</span>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-slate-900 dark:text-white">Forgot Password</h2>
                            <p class="text-xs text-slate-500 dark:text-slate-400">We'll send you a reset link</p>
                        </div>
                    </div>
                    <button onclick="closeForgotPassword()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <span class="material-symbols-outlined text-slate-400">close</span>
                    </button>
                </div>
            </div>
            
            <form onsubmit="handleForgotPassword(event)" class="p-6 space-y-5">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                    <input type="email" id="forgot-email" required value="${state.forgotPasswordEmail || ''}"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="you@example.com">
                </div>
                
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>
                
                <button type="submit" class="w-full py-3.5 bg-primary hover:bg-sky-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25">
                    <span class="material-symbols-outlined">send</span>
                    Send Reset Link
                </button>
                
                <button type="button" onclick="closeForgotPassword()" class="w-full py-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors">
                    Back to Login
                </button>
            </form>
        </div>
    </div>`;
}

// Render Reset Password Page (after clicking email link)
function renderResetPasswordPage() {
    return `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-background-dark dark:to-surface-dark flex items-center justify-center p-4">
        <div class="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-border-dark">
            <div class="p-6 border-b border-slate-200 dark:border-border-dark text-center">
                <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-outlined text-primary text-3xl">lock_reset</span>
                </div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Set New Password</h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1">Enter your new password below</p>
            </div>
            
            <form onsubmit="handleResetPassword(event)" class="p-6 space-y-5">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                    <input type="password" id="new-password" required minlength="6"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="••••••••">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                    <input type="password" id="confirm-new-password" required minlength="6"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        placeholder="••••••••">
                </div>
                
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    Password must be at least 6 characters long.
                </p>
                
                <button type="submit" class="w-full py-3.5 bg-primary hover:bg-sky-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25">
                    <span class="material-symbols-outlined">check</span>
                    Update Password
                </button>
            </form>
        </div>
    </div>`;
}

// Render Change Password Modal (for logged-in users)
function renderChangePasswordModal() {
    if (!state.showChangePassword) return '';
    
    return `
    <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onclick="closeChangePassword()">
        <div class="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl" onclick="event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 dark:border-border-dark">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                            <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400">password</span>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-slate-900 dark:text-white">Change Password</h2>
                            <p class="text-xs text-slate-500 dark:text-slate-400">Update your account password</p>
                        </div>
                    </div>
                    <button onclick="closeChangePassword()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <span class="material-symbols-outlined text-slate-400">close</span>
                    </button>
                </div>
            </div>
            
            <form onsubmit="handleChangePassword(event)" class="p-6 space-y-5">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                    <input type="password" id="change-new-password" required minlength="6"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                        placeholder="••••••••">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                    <input type="password" id="change-confirm-password" required minlength="6"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                        placeholder="••••••••">
                </div>
                
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    Password must be at least 6 characters long.
                </p>
                
                <button type="submit" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25">
                    <span class="material-symbols-outlined">check</span>
                    Update Password
                </button>
            </form>
        </div>
    </div>`;
}


