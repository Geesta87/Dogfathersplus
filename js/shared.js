// =============================================
// DOGFATHERS PLUS — SHARED.JS
// =============================================

// =============================================
// DEBUG & CONFIGURATION
// =============================================
const DEBUG = false; // Set to true for development logging
const _log = DEBUG ? console.log.bind(console) : () => {};
const _warn = DEBUG ? console.warn.bind(console) : () => {};
// console.error always logs (real errors)

// =============================================
// SUPABASE CONFIGURATION
// =============================================
const SUPABASE_URL = 'https://cxtxkyitvybmyflsjexr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dHhreWl0dnlibXlmbHNqZXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzEwMzcsImV4cCI6MjA4MTg0NzAzN30.wNt6chJJxCXsvNZxIVhPDeqllj4U3J7aQP2udxfbqBY';

let supabaseClient = null;

// Initialize Supabase client
function initSupabase() {
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            _log('Supabase client created');
            return true;
        } else {
            console.error('Supabase library not loaded');
            return false;
        }
    } catch (e) {
        console.error('Failed to create Supabase client:', e);
        return false;
    }
}

// Try to initialize Supabase
initSupabase();

// Function to update Supabase config
function updateSupabaseConfig(url, key) {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
    location.reload();
}

// Show config modal if key seems invalid
function showConfigModal() {
    const modal = document.createElement('div');
    modal.id = 'config-modal';
    modal.className = 'fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <h2 class="text-2xl font-bold text-slate-900 mb-2">Configure Supabase</h2>
            <p class="text-slate-600 mb-6">Enter your Supabase credentials from Dashboard > Settings > API</p>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Project URL</label>
                    <input type="url" id="config-url" value="${SUPABASE_URL}" placeholder="https://xxxxx.supabase.co" 
                        class="w-full h-12 px-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Anon Public Key</label>
                    <input type="text" id="config-key" value="${SUPABASE_ANON_KEY.includes('placeholder') ? '' : SUPABASE_ANON_KEY}" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                        class="w-full h-12 px-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none font-mono text-xs">
                </div>
                <button onclick="saveConfig()" class="w-full h-12 bg-primary hover:bg-sky-600 text-white font-bold rounded-lg transition-colors mt-4">
                    Save & Reload
                </button>
                <button onclick="document.getElementById('config-modal').remove()" class="w-full h-10 text-slate-500 hover:text-slate-700 font-medium">
                    Skip (Use Demo Mode)
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function saveConfig() {
    const url = document.getElementById('config-url').value.trim();
    const key = document.getElementById('config-key').value.trim();
    if (url && key) {
        updateSupabaseConfig(url, key);
    }
}

// =============================================
// PRICING: BREED-TO-COAT & WEIGHT-TO-SIZE
// =============================================

// Breed → coat type mapping from official Dogfathers price sheet
const BREED_COAT_MAP = {
    // SHORT COAT
    'Chihuahua': 'short', 'Boxer': 'short', 'Pug': 'short', 'Bulldog': 'short',
    'French Bulldog': 'short', 'Beagle': 'short', 'Labrador Retriever': 'short',
    'Dachshund': 'short', 'Great Dane': 'short', 'Doberman Pinscher': 'short',
    'Rottweiler': 'short', 'Boston Terrier': 'short', 'Pit Bull': 'short',
    'American Staffordshire Terrier': 'short', 'Weimaraner': 'short',
    'Vizsla': 'short', 'Whippet': 'short', 'Greyhound': 'short',
    'Italian Greyhound': 'short', 'Basenji': 'short', 'Rhodesian Ridgeback': 'short',
    'Miniature Pinscher': 'short', 'Cane Corso': 'short', 'Mastiff': 'short',
    'English Mastiff': 'short', 'Bull Terrier': 'short',

    // WIRE COAT
    'Jack Russell Terrier': 'wire', 'Scottish Terrier': 'wire', 'Schnauzer': 'wire',
    'Miniature Schnauzer': 'wire', 'Giant Schnauzer': 'wire', 'Standard Schnauzer': 'wire',
    'Wire Fox Terrier': 'wire', 'Airedale Terrier': 'wire', 'Border Terrier': 'wire',
    'Irish Wolfhound': 'wire', 'Brussels Griffon': 'wire', 'Wirehaired Pointing Griffon': 'wire',
    'Welsh Terrier': 'wire', 'Cairn Terrier': 'wire', 'Norwich Terrier': 'wire',
    'Norfolk Terrier': 'wire', 'Lakeland Terrier': 'wire',

    // SOFT COAT
    'Maltese': 'soft', 'Shih Tzu': 'soft', 'Yorkshire Terrier': 'soft',
    'Golden Retriever': 'soft', 'Sheltie': 'soft', 'Shetland Sheepdog': 'soft',
    'Cavalier King Charles Spaniel': 'soft', 'Cocker Spaniel': 'soft',
    'English Springer Spaniel': 'soft', 'Havanese': 'soft', 'Lhasa Apso': 'soft',
    'Papillon': 'soft', 'Bichon Frise': 'soft', 'Tibetan Terrier': 'soft',
    'Afghan Hound': 'soft', 'Irish Setter': 'soft', 'English Setter': 'soft',
    'Silky Terrier': 'soft', 'Japanese Chin': 'soft',

    // DOUBLE COAT
    'Siberian Husky': 'double', 'Akita': 'double', 'Pomeranian': 'double',
    'Pekingese': 'double', 'German Shepherd': 'double', 'Bernese Mountain Dog': 'double',
    'Australian Shepherd': 'double', 'Border Collie': 'double', 'Corgi': 'double',
    'Pembroke Welsh Corgi': 'double', 'Cardigan Welsh Corgi': 'double',
    'Samoyed': 'double', 'Alaskan Malamute': 'double', 'Chow Chow': 'double',
    'Keeshond': 'double', 'Shiba Inu': 'double', 'Finnish Spitz': 'double',
    'American Eskimo Dog': 'double', 'Newfoundland': 'double',
    'Great Pyrenees': 'double', 'Saint Bernard': 'double', 'Collie': 'double',

    // DOODLE BREED
    'Poodle': 'doodle', 'Goldendoodle': 'doodle', 'Golden Doodle': 'doodle',
    'Labradoodle': 'doodle', 'Bernedoodle': 'doodle', 'Aussiedoodle': 'doodle',
    'Cavapoo': 'doodle', 'Cockapoo': 'doodle', 'Maltipoo': 'doodle',
    'Sheepadoodle': 'doodle', 'Schnoodle': 'doodle', 'Yorkipoo': 'doodle',
    'Pomapoo': 'doodle', 'Whoodle': 'doodle', 'Irish Doodle': 'doodle',
    'Standard Poodle': 'doodle', 'Miniature Poodle': 'doodle', 'Toy Poodle': 'doodle',
    'Portugese Water Dog': 'doodle', 'Portuguese Water Dog': 'doodle'
};

// Detect coat type from breed name
function detectCoatType(breed) {
    if (!breed) return null;
    // Exact match first
    if (BREED_COAT_MAP[breed]) return BREED_COAT_MAP[breed];
    // Case-insensitive match
    const lower = breed.toLowerCase();
    for (const [key, val] of Object.entries(BREED_COAT_MAP)) {
        if (key.toLowerCase() === lower) return val;
    }
    // Check if breed name contains "doodle", "poo", or "oodle"
    if (lower.includes('doodle') || lower.includes('oodle') || lower.endsWith('poo')) return 'doodle';
    return null;
}

// Get size category from weight (lbs) — per official price sheet
function getSizeFromWeight(weight) {
    if (!weight || weight <= 0) return null;
    if (weight <= 9) return 'small';
    if (weight <= 24) return 'medium';
    if (weight <= 69) return 'large';
    return 'xl';
}

const SIZE_LABELS = { small: 'Small (0-9 lbs)', medium: 'Medium (10-24 lbs)', large: 'Large (25-69 lbs)', xl: 'XL (70-160+ lbs)' };
const COAT_LABELS = { short: 'Short Coat', wire: 'Wire Coat', soft: 'Soft Coat', double: 'Double Coat', doodle: 'Doodle Breed' };

// =============================================
// STATE MANAGEMENT
// =============================================
let state = { 
    currentUser: null,
    session: null,
    currentTab: 'dashboard', 
    authTab: 'login', 
    showMobileMenu: false, 
    showBookingModal: false,
    bookingPreselect: null, // { petId, serviceId, serviceName } for pre-selecting options 
    storeCategory: 'all',
    darkMode: localStorage.getItem('darkMode') === 'true',
    rememberMe: localStorage.getItem('rememberMe') === 'true',
    showPassword: false,
    isLoading: false,
    confirmDialog: null,
    // PWA
    showInstallPrompt: false,
    isPWA: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
    // Onboarding
    showOnboarding: false,
    onboardingStep: 1,
    showAdminLogin: false,
    // Edit Modals
    editModal: null, // { type: 'pet'|'appointment'|'product'|'reward'|'profile', data: {...} }
    groomingServiceModal: null, // Modal for adding/editing grooming services
    editItems: {}, // Temporary storage for items to edit
    onboardingData: {
        phone: '',
        address: '',
        city: '',
        state: 'CA',
        zip: '',
        petName: '',
        petBreed: '',
        petBreedOther: '',
        petWeight: '',
        petGender: 'male',
        petBirthMonth: '',
        petBirthYear: '',
        petPhoto: '',
        petNotes: ''
    },
    // Data from Supabase
    services: [],
    products: [],
    rewards: [],
    pets: [],
    appointments: [],
    rideAlongPackages: [],
    businessHours: [],
    allAppointments: [], // For admin
    allCustomers: [], // For admin
    rideAlongInquiries: [], // For admin - customer inquiries
    rewardRedemptions: [], // For admin - redemption history
    // Groomer system
    groomers: [], // List of users with role='groomer' (for admin)
    groomerAppointments: [], // Appointments assigned to logged-in groomer
    showGroomerLogin: false, // Toggle groomer login page
    // Groomer management modals
    showAddGroomerModal: false,
    showEditGroomerModal: false,
    showGroomerScheduleModal: false,
    editingGroomer: null, // Groomer being edited
    viewingGroomerSchedule: null, // Groomer whose schedule is being viewed
    adminScheduleMonth: null, // Current month being viewed in admin groomer schedule (0-11)
    adminScheduleYear: null, // Current year being viewed in admin groomer schedule
    adminScheduleSelectedDate: null, // Selected date in admin groomer schedule
    // Admin Services/Products sub-tab
    adminServicesSubTab: 'grooming', // 'grooming' | 'products' | 'ridealongs' | 'education'
    // Admin Loyalty sub-tab
    loyaltySubTab: 'rewards', // 'rewards' | 'redemptions' | 'customers'
    // Dashboard filters
    dashboardScheduleFilter: 'all', // 'all' | 'confirmed' | 'pending' | 'in_progress'
    dashboardScheduleView: 'day', // 'day' | 'week' | 'month'
    groomerFilter: 'active', // 'all' | 'active' | 'inactive'
    productFilter: 'all', // 'all' | 'active' | 'inactive'
    // Appointments tab filters
    appointmentSearchQuery: '',
    appointmentStatusFilter: '',
    appointmentPage: 1,
    adminAppointmentsView: 'list', // 'list' or 'gallery'
    adminGalleryGroomerFilter: '',
    adminGalleryDateFilter: 'all', // 'all', 'week', 'month'
    adminGallerySearch: '',
    adminGalleryLightbox: null, // appointment object for fullscreen view
    editingGroomerAvailability: [], // availability data when editing a groomer
    filteredAppointmentsCount: 0,
    // Quick View Modal
    quickViewAppointment: null,
    // Customer tab
    customerSearchQuery: '',
    customerSort: 'name', // 'name' | 'points' | 'recent'
    customerPage: 1,
    customerDetailModal: null,
    // Password Reset
    showForgotPassword: false,
    showResetPassword: false, // For setting new password after email link
    showChangePassword: false, // For logged-in users changing password
    forgotPasswordEmail: '',
    resetPasswordToken: null,
    // Smart Location Booking
    smartBookingData: null, // { recommended, goodOptions, available, customerCoords }
    selectedBookingDate: null, // Currently selected date from smart picker
    customerBookingCoords: null, // Geocoded customer address for booking
    // Phase 1: Data Integrity Modals
    petDeletionBlocked: null, // { petId, petName, appointments[] } - when pet has active appointments
    cancelAppointmentModal: null, // { appointmentId, reason } - cancel with reason capture
    groomerDeactivationBlocked: null, // { groomerId, groomerName, appointments[] } - when groomer has assignments
    // Phase 2: Notifications
    notifications: [],
    unreadNotifications: 0,
    showNotifications: false,
    // Phase 2: Groomer Availability
    groomerAvailability: [], // Current groomer's weekly schedule
    groomerTimeOffRequests: [], // Current groomer's time off requests
    pendingTimeOffRequests: [], // For admin - pending requests to review
    showTimeOffModal: false,
    // Phase 2: Redemption Fulfillment
    pendingRedemptions: [], // For admin - redemptions to fulfill
    showRedemptionModal: null, // { redemption, action: 'fulfill' | 'cancel' }
    // Phase 2: Groomer Portal Enhancements
    groomerTab: 'dashboard', // 'dashboard' | 'schedule' | 'history' | 'availability' | 'messages'
    // Groomer completion modal
    showCompleteAppointmentModal: false,
    completingAppointmentId: null,
    completingAppointmentData: null,
    groomerMessages: [], // Messages for groomer
    unreadGroomerMessages: 0,
    activeConversation: null, // Current conversation ID
    // Phase 2: Admin Messages
    adminMessages: [], // Messages for admin
    adminActiveConversation: null,
    // Phase 3: Groomer Schedule Calendar
    scheduleViewMode: 'monthly', // 'today' | 'weekly' | 'monthly'
    selectedCalendarDate: null, // Currently selected date (YYYY-MM-DD)
    calendarStartDate: null, // Start of visible calendar range
    showDayPanel: false, // Is day detail panel open
    selectedAppointment: null, // Full appointment detail view
    showAppointmentDetail: false, // Is appointment detail modal open
    // Phase 4: Admin Appointment Creation
    showAdminAddAppointment: false, // Show add appointment modal
    adminAppointmentStep: 1, // 1=customer, 2=pet, 3=appointment
    adminCustomerSearch: '', // Search query for customer
    adminCustomerSearchResults: [], // Search results
    adminSelectedCustomer: null, // Selected/created customer
    adminSelectedPet: null, // Selected/created pet
    adminNewCustomer: null, // New customer being created inline
    adminNewPet: null, // New pet being created inline
    // Phase 5: Photo Capture
    showBeforePhotoModal: false, // Show before photo capture modal
    beforePhotoAppointmentId: null, // Appointment ID for before photo
    beforePhotoAppointmentData: null, // Appointment data for before photo modal
    capturedBeforePhoto: null, // Base64 captured before photo
    capturedAfterPhoto: null, // Base64 captured after photo
    photoUploadProgress: 0, // Upload progress percentage
    // Phase 6: Pet Profile Quick View
    showPetProfile: false, // Show pet profile modal
    selectedPetProfile: null, // Selected pet data for profile view
    petAppointmentHistory: [], // Appointment history for selected pet
    // Phase 7: Quick Text Templates
    showQuickTemplates: false, // Show quick templates picker
    mobileTab: null, // Mobile tab state for dashboard
    showQuickActions: false, // Quick actions menu state
    // Phase 8: History Tab
    historyFilter: 'all', // 'all' | 'completed' | 'cancelled' | 'upcoming'
    historySearch: '', // Search query for history
    historyDateRange: 'all' // 'all' | 'week' | 'month' | 'custom'
};

// Initialize dark mode
if (state.darkMode) document.documentElement.classList.add('dark');

const LOGO_MAIN = 'https://storage.googleapis.com/msgsndr/5ZO7GDI0tRsPLerwiyMJ/media/69471b85aca6ab5d44c15e0b.jpg';
const LOGO_ACADEMY = 'https://storage.googleapis.com/msgsndr/5ZO7GDI0tRsPLerwiyMJ/media/6830663caca6ab25bac0a498.png';

// =============================================
// NETWORK STATUS MONITORING
// =============================================
let isOffline = !navigator.onLine;

function showOfflineBanner() {
    let banner = document.getElementById('offline-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.className = 'fixed top-0 left-0 right-0 z-[250] bg-amber-500 text-white text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2 safe-top';
        banner.innerHTML = '<span class="material-symbols-outlined text-base">wifi_off</span> You\'re offline — some features may be unavailable';
        document.body.prepend(banner);
    }
    banner.style.display = 'flex';
}

function hideOfflineBanner() {
    const banner = document.getElementById('offline-banner');
    if (banner) banner.style.display = 'none';
}

window.addEventListener('online', () => {
    isOffline = false;
    hideOfflineBanner();
    showToast('Back online', 'success');
});

window.addEventListener('offline', () => {
    isOffline = true;
    showOfflineBanner();
    showToast('You\'re offline', 'warning');
});

// Safe Supabase fetch wrapper with retry
async function safeFetch(queryFn, { retries = 1, label = 'request' } = {}) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            if (isOffline) throw new Error('No internet connection');
            const result = await queryFn();
            if (result.error) throw result.error;
            return result;
        } catch (err) {
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                continue;
            }
            console.error(`${label} failed:`, err.message);
            if (isOffline) {
                showToast('No internet connection. Please try again later.', 'warning');
            }
            throw err;
        }
    }
}

// =============================================
// TIME FORMATTING - PACIFIC TIME (LOS ANGELES)
// =============================================
const TIMEZONE = 'America/Los_Angeles';

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format time string (HH:MM:SS or HH:MM) to 12-hour format in Pacific Time
function formatTime(timeStr) {
    if (!timeStr) return 'TBD';
    // If it's already a simple time like "09:00" or "09:00:00", convert to 12-hour
    const timeParts = timeStr.split(':');
    if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0], 10);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
}

// Format date string (YYYY-MM-DD) to readable format
function formatDate(dateStr, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
    if (!dateStr) return 'TBD';
    // Parse date in local timezone to avoid off-by-one errors
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', options);
}

// Format date and time together
function formatDateTime(dateStr, timeStr) {
    return `${formatDate(dateStr)} at ${formatTime(timeStr)}`;
}

// Get today's date in YYYY-MM-DD format (Pacific Time)
function getTodayPacific() {
    return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

// Check if a date string is today (Pacific Time)
function isToday(dateStr) {
    return dateStr === getTodayPacific();
}

// Format timestamp to readable time
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        timeZone: TIMEZONE,
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

// Show service description when dropdown changes (Recommendation #3)
function showServiceDescription(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const description = selectedOption?.dataset?.description || 'Complete grooming service tailored to your pet\'s needs.';
    const descBox = document.getElementById('service-desc-text');
    if (descBox) {
        descBox.textContent = description;
    }
}

// =============================================
// CALENDAR HELPER FUNCTIONS
// =============================================

// Get start of week (Monday) for a given date
function getWeekStart(dateStr) {
    const date = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
}

// Get array of 7 dates for a week starting from given date
function getWeekDatesFromStart(startDateStr) {
    const dates = [];
    const startDate = new Date(startDateStr + 'T12:00:00');
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

// Get array of dates for a month grid (includes padding days)
function getMonthDates(year, month) {
    const dates = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the Monday before or on the first day
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Monday-based
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDay);
    
    // Generate 6 weeks (42 days) to cover all possibilities
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push({
            dateStr: date.toISOString().split('T')[0],
            isCurrentMonth: date.getMonth() === month,
            isToday: date.toISOString().split('T')[0] === getTodayPacific()
        });
    }
    return dates;
}

// Get appointments for a specific date
function getAppointmentsForDate(dateStr) {
    const appointments = state.groomerAppointments || [];
    return appointments.filter(a => a.appointment_date === dateStr)
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
}

// Get appointment counts grouped by date
function getAppointmentCountsByDate() {
    const appointments = state.groomerAppointments || [];
    const counts = {};
    appointments.forEach(a => {
        if (a.appointment_date && a.status !== 'cancelled') {
            counts[a.appointment_date] = (counts[a.appointment_date] || 0) + 1;
        }
    });
    return counts;
}

// Navigate calendar
function goToPreviousWeek() {
    const current = state.calendarStartDate || getWeekStart(getTodayPacific());
    const date = new Date(current + 'T12:00:00');
    date.setDate(date.getDate() - 7);
    state.calendarStartDate = date.toISOString().split('T')[0];
    state.selectedCalendarDate = null;
    state.showDayPanel = false;
    render();
}

function goToNextWeek() {
    const current = state.calendarStartDate || getWeekStart(getTodayPacific());
    const date = new Date(current + 'T12:00:00');
    date.setDate(date.getDate() + 7);
    state.calendarStartDate = date.toISOString().split('T')[0];
    state.selectedCalendarDate = null;
    state.showDayPanel = false;
    render();
}

function goToCalendarToday() {
    state.calendarStartDate = getWeekStart(getTodayPacific());
    state.selectedCalendarDate = getTodayPacific();
    state.showDayPanel = true;
    render();
}

function selectCalendarDate(dateStr) {
    state.selectedCalendarDate = dateStr;
    state.showDayPanel = true;
    state.selectedAppointment = null;
    state.showAppointmentDetail = false;
    render();
}

function closeDayPanel() {
    state.showDayPanel = false;
    state.selectedCalendarDate = null;
    state.selectedAppointment = null;
    state.showAppointmentDetail = false;
    render();
}

function openAppointmentDetail(appointmentId) {
    const appointments = state.groomerAppointments || [];
    state.selectedAppointment = appointments.find(a => a.id === appointmentId);
    state.showAppointmentDetail = true;
    render();
}

function closeAppointmentDetail() {
    state.selectedAppointment = null;
    state.showAppointmentDetail = false;
    render();
}

// Get week range label (e.g., "Jan 20 - 26, 2025")
function getWeekRangeLabel(startDateStr) {
    const start = new Date(startDateStr + 'T12:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = end.getFullYear();
    
    if (startMonth === endMonth) {
        return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
}

// Predefined groomer specialties
const GROOMER_SPECIALTIES = [
    { id: 'large_dogs', label: 'Large Dogs (50+ lbs)', icon: '🐕' },
    { id: 'small_breeds', label: 'Small Breeds (under 25 lbs)', icon: '🐩' },
    { id: 'anxious_pets', label: 'Anxious/Nervous Pets', icon: '😰' },
    { id: 'puppies', label: 'Puppies (under 1 year)', icon: '🐶' },
    { id: 'senior_dogs', label: 'Senior Dogs (7+ years)', icon: '🦮' },
    { id: 'dematting', label: 'Dematting & Tangles', icon: '✂️' },
    { id: 'breed_cuts', label: 'Breed-Specific Cuts', icon: '💇' },
    { id: 'cats', label: 'Cats', icon: '🐱' }
];

// =============================================
// SMART LOCATION-BASED BOOKING SYSTEM
// =============================================

// Service Regions (loaded from database, these are defaults)
let serviceRegions = [];

// Business home base (default - will be loaded from settings)
let businessHomeBase = { latitude: 34.2381, longitude: -118.5365, address: 'Northridge, CA' };
let smartBookingSettings = { enabled: true };

// Cache for geocoded addresses
const geocodeCache = new Map();

// Load smart booking settings and regions from database
async function loadSmartBookingSettings() {
    try {
        // Load service regions
        const { data: regionSettings, error: regionError } = await supabaseClient
            .from('business_settings')
            .select('*')
            .eq('setting_key', 'service_regions')
            .single();
        
        if (!regionError && regionSettings && regionSettings.setting_value?.regions) {
            serviceRegions = regionSettings.setting_value.regions;
            _log('Loaded service regions:', serviceRegions.length);
        }
        
        // Load business settings (home base etc.)
        const { data: settings, error: settingsError } = await supabaseClient
            .from('business_settings')
            .select('*')
            .eq('setting_key', 'smart_booking')
            .single();
        
        if (!settingsError && settings) {
            const value = settings.setting_value;
            smartBookingSettings = {
                enabled: value.enabled ?? true
            };
            if (value.home_base) {
                businessHomeBase = value.home_base;
            }
            _log('Loaded smart booking settings:', smartBookingSettings);
        }
    } catch (err) {
        _log('Smart booking settings not available, using defaults');
    }
}

// Match a city name to a service region
function getRegionForCity(cityName) {
    if (!cityName || !serviceRegions.length) return null;
    
    const cityLower = cityName.toLowerCase().trim();
    
    for (const region of serviceRegions) {
        if (!region.cities) continue;
        const match = region.cities.some(c => c.toLowerCase() === cityLower);
        if (match) return region;
    }
    
    // Partial match fallback (e.g. "North Hollywood" in address parsed as "North Hollywood")
    for (const region of serviceRegions) {
        if (!region.cities) continue;
        const match = region.cities.some(c => 
            cityLower.includes(c.toLowerCase()) || c.toLowerCase().includes(cityLower)
        );
        if (match) return region;
    }
    
    return null;
}

// Check if a region has any active groomer assigned
function isRegionCovered(regionId) {
    return (state.groomers || []).some(g => 
        g.is_active !== false && 
        g.service_regions && 
        g.service_regions.includes(regionId)
    );
}

// Get all region IDs that have at least one groomer assigned
function getCoveredRegionIds() {
    const covered = new Set();
    (state.groomers || []).forEach(g => {
        if (g.is_active !== false && g.service_regions) {
            g.service_regions.forEach(rId => covered.add(rId));
        }
    });
    return Array.from(covered);
}

// Get groomers who cover a specific region
function getGroomersForRegion(regionId) {
    if (!regionId) return [];
    return (state.groomers || []).filter(g => 
        g.is_active !== false && 
        g.service_regions && 
        g.service_regions.includes(regionId)
    );
}

// Haversine formula - Calculate distance between two coordinates in miles
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 3959; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}


// Geocode an address using OpenStreetMap Nominatim (free)
async function geocodeAddress(address, city, stateCode = 'CA', zip = '') {
    if (!address && !zip && !city) return null;
    
    // Build full address string
    const fullAddress = [address, city, stateCode, zip].filter(Boolean).join(', ');
    
    // Check cache first
    if (geocodeCache.has(fullAddress)) {
        _log('Geocode cache hit:', fullAddress);
        return geocodeCache.get(fullAddress);
    }
    
    try {
        // Try OpenStreetMap Nominatim
        const query = encodeURIComponent(fullAddress);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=us&addressdetails=1`,
            { headers: { 'User-Agent': 'DogfathersPlus-App/1.0' } }
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                const addr = data[0].address || {};
                const result = {
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon),
                    display_name: data[0].display_name,
                    zip: addr.postcode || zip || '',
                    city: addr.city || addr.town || addr.village || addr.suburb || city || ''
                };
                geocodeCache.set(fullAddress, result);
                _log('Geocoded:', fullAddress, '→', result.latitude, result.longitude, 'ZIP:', result.zip);
                return result;
            }
        }
    } catch (err) {
        _warn('Nominatim geocoding failed:', err);
    }
    
    // Fallback: city-based approximate coordinates for LA-area cities
    const cityCoord = getCityFallbackCoordinates(city);
    if (cityCoord) {
        const result = {
            latitude: cityCoord.latitude,
            longitude: cityCoord.longitude,
            display_name: `${city}, ${stateCode} ${zip}`.trim(),
            zip: zip || '',
            city: city || ''
        };
        geocodeCache.set(fullAddress, result);
        _log('Using city fallback coords for:', city, '→', result.latitude, result.longitude);
        return result;
    }
    
    return null;
}

// City-based fallback coordinates for LA County + Orange County areas
function getCityFallbackCoordinates(city) {
    if (!city) return null;
    const normalized = city.toLowerCase().trim();
    
    const cityCoords = {
        // San Fernando Valley
        'northridge': { latitude: 34.2381, longitude: -118.5365 },
        'reseda': { latitude: 34.2012, longitude: -118.5370 },
        'encino': { latitude: 34.1584, longitude: -118.5014 },
        'tarzana': { latitude: 34.1717, longitude: -118.5500 },
        'woodland hills': { latitude: 34.1681, longitude: -118.6059 },
        'canoga park': { latitude: 34.2011, longitude: -118.5973 },
        'chatsworth': { latitude: 34.2572, longitude: -118.5951 },
        'granada hills': { latitude: 34.2743, longitude: -118.5006 },
        'porter ranch': { latitude: 34.2810, longitude: -118.5637 },
        'north hills': { latitude: 34.2364, longitude: -118.4810 },
        'van nuys': { latitude: 34.1864, longitude: -118.4490 },
        'sherman oaks': { latitude: 34.1508, longitude: -118.4489 },
        'studio city': { latitude: 34.1435, longitude: -118.3952 },
        'north hollywood': { latitude: 34.1870, longitude: -118.3813 },
        'sun valley': { latitude: 34.2267, longitude: -118.3724 },
        'panorama city': { latitude: 34.2262, longitude: -118.4412 },
        'arleta': { latitude: 34.2362, longitude: -118.4384 },
        'pacoima': { latitude: 34.2567, longitude: -118.4173 },
        'sylmar': { latitude: 34.3086, longitude: -118.4468 },
        'mission hills': { latitude: 34.2724, longitude: -118.4580 },
        'lake balboa': { latitude: 34.1832, longitude: -118.5015 },
        'winnetka': { latitude: 34.2132, longitude: -118.5712 },
        'west hills': { latitude: 34.2037, longitude: -118.6412 },
        // Burbank / Glendale
        'burbank': { latitude: 34.1808, longitude: -118.3090 },
        'glendale': { latitude: 34.1425, longitude: -118.2551 },
        'la crescenta': { latitude: 34.2325, longitude: -118.2359 },
        'montrose': { latitude: 34.2092, longitude: -118.2295 },
        'la canada flintridge': { latitude: 34.2122, longitude: -118.1878 },
        'sunland': { latitude: 34.2645, longitude: -118.3015 },
        'tujunga': { latitude: 34.2518, longitude: -118.2876 },
        'shadow hills': { latitude: 34.2654, longitude: -118.3507 },
        // Pasadena Area
        'pasadena': { latitude: 34.1478, longitude: -118.1445 },
        'south pasadena': { latitude: 34.1161, longitude: -118.1502 },
        'altadena': { latitude: 34.1897, longitude: -118.1310 },
        'san marino': { latitude: 34.1215, longitude: -118.1065 },
        'sierra madre': { latitude: 34.1617, longitude: -118.0529 },
        'arcadia': { latitude: 34.1397, longitude: -118.0353 },
        'monrovia': { latitude: 34.1442, longitude: -117.9990 },
        'duarte': { latitude: 34.1395, longitude: -117.9773 },
        'temple city': { latitude: 34.1073, longitude: -118.0579 },
        // Westside
        'santa monica': { latitude: 34.0195, longitude: -118.4912 },
        'beverly hills': { latitude: 34.0736, longitude: -118.4004 },
        'west hollywood': { latitude: 34.0900, longitude: -118.3617 },
        'culver city': { latitude: 34.0211, longitude: -118.3965 },
        'brentwood': { latitude: 34.0594, longitude: -118.4755 },
        'pacific palisades': { latitude: 34.0428, longitude: -118.5268 },
        'westwood': { latitude: 34.0586, longitude: -118.4451 },
        'century city': { latitude: 34.0565, longitude: -118.4180 },
        'playa del rey': { latitude: 33.9564, longitude: -118.4427 },
        'marina del rey': { latitude: 33.9803, longitude: -118.4517 },
        'venice': { latitude: 33.9850, longitude: -118.4695 },
        'mar vista': { latitude: 34.0039, longitude: -118.4283 },
        'west los angeles': { latitude: 34.0368, longitude: -118.4384 },
        'palms': { latitude: 34.0178, longitude: -118.4118 },
        // Central / Downtown LA
        'los angeles': { latitude: 34.0522, longitude: -118.2437 },
        'downtown': { latitude: 34.0407, longitude: -118.2468 },
        'echo park': { latitude: 34.0782, longitude: -118.2606 },
        'silver lake': { latitude: 34.0869, longitude: -118.2702 },
        'los feliz': { latitude: 34.1083, longitude: -118.2847 },
        'atwater village': { latitude: 34.1157, longitude: -118.2619 },
        'eagle rock': { latitude: 34.1386, longitude: -118.2142 },
        'highland park': { latitude: 34.1113, longitude: -118.1901 },
        'glassell park': { latitude: 34.1203, longitude: -118.2286 },
        'mount washington': { latitude: 34.0967, longitude: -118.2138 },
        'koreatown': { latitude: 34.0577, longitude: -118.3015 },
        'mid-wilshire': { latitude: 34.0624, longitude: -118.3285 },
        'hancock park': { latitude: 34.0736, longitude: -118.3368 },
        // South Bay
        'torrance': { latitude: 33.8358, longitude: -118.3406 },
        'redondo beach': { latitude: 33.8492, longitude: -118.3884 },
        'manhattan beach': { latitude: 33.8847, longitude: -118.4109 },
        'hermosa beach': { latitude: 33.8622, longitude: -118.3995 },
        'el segundo': { latitude: 33.9192, longitude: -118.4165 },
        'hawthorne': { latitude: 33.9164, longitude: -118.3526 },
        'gardena': { latitude: 33.8883, longitude: -118.3090 },
        'carson': { latitude: 33.8317, longitude: -118.2818 },
        'lomita': { latitude: 33.7926, longitude: -118.3151 },
        'palos verdes': { latitude: 33.7444, longitude: -118.3870 },
        'rancho palos verdes': { latitude: 33.7444, longitude: -118.3870 },
        'rolling hills': { latitude: 33.7584, longitude: -118.3576 },
        // Santa Clarita Valley
        'santa clarita': { latitude: 34.3917, longitude: -118.5426 },
        'valencia': { latitude: 34.4436, longitude: -118.6115 },
        'newhall': { latitude: 34.3844, longitude: -118.5310 },
        'saugus': { latitude: 34.3956, longitude: -118.5287 },
        'stevenson ranch': { latitude: 34.3875, longitude: -118.5768 },
        'castaic': { latitude: 34.4894, longitude: -118.6288 },
        'canyon country': { latitude: 34.4217, longitude: -118.4500 },
        'agua dulce': { latitude: 34.4964, longitude: -118.3269 },
        // San Gabriel Valley
        'alhambra': { latitude: 34.0953, longitude: -118.1270 },
        'monterey park': { latitude: 34.0625, longitude: -118.1228 },
        'rosemead': { latitude: 34.0806, longitude: -118.0728 },
        'el monte': { latitude: 34.0686, longitude: -118.0276 },
        'san gabriel': { latitude: 34.0961, longitude: -118.1058 },
        'west covina': { latitude: 34.0686, longitude: -117.9390 },
        'covina': { latitude: 34.0900, longitude: -117.8903 },
        'glendora': { latitude: 34.1361, longitude: -117.8653 },
        'azusa': { latitude: 34.1336, longitude: -117.9076 },
        'baldwin park': { latitude: 34.0853, longitude: -117.9609 },
        'irwindale': { latitude: 34.1070, longitude: -117.9353 },
        // North Orange County
        'anaheim': { latitude: 33.8366, longitude: -117.9143 },
        'fullerton': { latitude: 33.8703, longitude: -117.9243 },
        'brea': { latitude: 33.9167, longitude: -117.9001 },
        'yorba linda': { latitude: 33.8886, longitude: -117.8131 },
        'placentia': { latitude: 33.8722, longitude: -117.8703 },
        'buena park': { latitude: 33.8675, longitude: -117.9981 },
        'la habra': { latitude: 33.9319, longitude: -117.9462 },
        'orange': { latitude: 33.7878, longitude: -117.8531 },
        // South Orange County
        'irvine': { latitude: 33.6846, longitude: -117.8265 },
        'mission viejo': { latitude: 33.6000, longitude: -117.6720 },
        'laguna beach': { latitude: 33.5427, longitude: -117.7854 },
        'laguna niguel': { latitude: 33.5225, longitude: -117.7076 },
        'lake forest': { latitude: 33.6469, longitude: -117.6892 },
        'rancho santa margarita': { latitude: 33.6409, longitude: -117.6031 },
        'san clemente': { latitude: 33.4270, longitude: -117.6120 },
        'dana point': { latitude: 33.4672, longitude: -117.6981 },
        'aliso viejo': { latitude: 33.5676, longitude: -117.7256 },
        'ladera ranch': { latitude: 33.5572, longitude: -117.6364 },
        // Conejo Valley / Simi
        'thousand oaks': { latitude: 34.1705, longitude: -118.8376 },
        'simi valley': { latitude: 34.2694, longitude: -118.7815 },
        'moorpark': { latitude: 34.2856, longitude: -118.8820 },
        'newbury park': { latitude: 34.1847, longitude: -118.9103 },
        'agoura hills': { latitude: 34.1364, longitude: -118.7748 },
        'westlake village': { latitude: 34.1459, longitude: -118.8056 },
        'calabasas': { latitude: 34.1578, longitude: -118.6387 },
        'oak park': { latitude: 34.1792, longitude: -118.7626 }
    };
    
    return cityCoords[normalized] || null;
}

// Appointment slot configuration
const APPOINTMENT_SLOTS = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'];
const SLOT_DURATION_MINUTES = 120;

// Get smart date/time recommendations for booking (Multi-Groomer System)
async function getSmartDateRecommendations(customerLat, customerLng, daysAhead = 90) {
    if (!customerLat || !customerLng) {
        _log('No customer coordinates for smart booking');
        return { bestAvailable: [], moreAvailable: [], noCoordinates: true };
    }
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    try {
        // Try to use the database function first
        const { data: dbSlots, error: dbError } = await supabaseClient
            .rpc('get_available_slots_multi_groomer', {
                p_start_date: todayStr,
                p_end_date: endDateStr,
                p_customer_lat: customerLat,
                p_customer_lng: customerLng
            });
        
        if (!dbError && dbSlots && dbSlots.length > 0) {
            _log('Using database function for smart booking:', dbSlots.length, 'slots');
            return processAvailableSlots(dbSlots, customerLat, customerLng);
        }
        
        // Fallback to JavaScript calculation if DB function not available
        _log('Falling back to JS calculation for smart booking');
        return await calculateAvailableSlotsJS(customerLat, customerLng, todayStr, endDateStr);
        
    } catch (err) {
        console.error('Error in smart booking:', err);
        return await calculateAvailableSlotsJS(customerLat, customerLng, todayStr, endDateStr);
    }
}

// Process slots from database function
function processAvailableSlots(slots, customerLat, customerLng) {
    // Sort by distance (best matches first)
    const sortedSlots = slots.sort((a, b) => {
        const distA = a.distance_from_prev ?? 999;
        const distB = b.distance_from_prev ?? 999;
        if (distA !== distB) return distA - distB;
        // Then by date/time
        if (a.slot_date !== b.slot_date) return a.slot_date.localeCompare(b.slot_date);
        return a.slot_time.localeCompare(b.slot_time);
    });
    
    // Categorize: Best (<10 miles) vs More Available — no artificial caps
    const bestAvailable = sortedSlots
        .filter(s => s.distance_from_prev !== null && s.distance_from_prev < 10)
        .map(s => formatSlotForDisplay(s));
    
    const moreAvailable = sortedSlots
        .filter(s => s.distance_from_prev === null || s.distance_from_prev >= 10)
        .map(s => formatSlotForDisplay(s));
    
    _log('Smart booking results:', { bestAvailable: bestAvailable.length, moreAvailable: moreAvailable.length });
    
    return { bestAvailable, moreAvailable };
}

// Format slot for display
function formatSlotForDisplay(slot) {
    const dateObj = new Date(slot.slot_date + 'T12:00:00');
    return {
        date: slot.slot_date,
        time: slot.slot_time.slice(0, 5), // "07:00:00" -> "07:00"
        groomerId: slot.groomer_id,
        groomerName: slot.groomer_name,
        distance: slot.distance_from_prev,
        dayOfWeek: dateObj.getDay(),
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()],
        displayDate: dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        displayTime: formatTime(slot.slot_time)
    };
}

// Get the Monday of a given week offset (0 = this week, 1 = next week, etc.)
function getWeekStartDate(weekOffset = 0) {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon...
    const diffToMonday = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

// Get week date range label (e.g. "Feb 17 - Feb 21")
function getWeekLabel(weekOffset) {
    const monday = getWeekStartDate(weekOffset);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    const opts = { month: 'short', day: 'numeric' };
    return `${monday.toLocaleDateString('en-US', opts)} - ${friday.toLocaleDateString('en-US', opts)}`;
}

// Get all dates (Mon-Fri) for a given week offset
function getWeekDates(weekOffset) {
    const monday = getWeekStartDate(weekOffset);
    const dates = [];
    for (let i = 0; i < 5; i++) { // Mon-Fri
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push({
            dateStr: d.toISOString().split('T')[0],
            dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i],
            dayNum: d.getDate(),
            monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
            isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
            isPast: d < new Date(new Date().setHours(0,0,0,0))
        });
    }
    return dates;
}

// Filter slots for a specific week
function getSlotsForWeek(allSlots, weekOffset) {
    const dates = getWeekDates(weekOffset);
    const dateSet = new Set(dates.map(d => d.dateStr));
    return allSlots.filter(s => dateSet.has(s.date));
}

// Group slots by date for week view
function groupSlotsByDate(slots) {
    const grouped = {};
    slots.forEach(s => {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
    });
    // Sort times within each date
    Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => a.time.localeCompare(b.time));
    });
    return grouped;
}

// Get max week offset (how far ahead we have slots)
function getMaxWeekOffset(allSlots) {
    if (!allSlots || allSlots.length === 0) return 0;
    const lastDate = allSlots.reduce((max, s) => s.date > max ? s.date : max, '');
    const lastDateObj = new Date(lastDate + 'T12:00:00');
    const now = new Date();
    const diffWeeks = Math.ceil((lastDateObj - now) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(0, diffWeeks);
}

// JavaScript fallback calculation for available slots
async function calculateAvailableSlotsJS(customerLat, customerLng, startDate, endDate) {
    // 1. Get all groomers
    const { data: rawGroomers, error: groomersError } = await supabaseClient
        .from('profiles')
        .select('id, full_name, home_latitude, home_longitude, service_regions, is_active')
        .eq('role', 'groomer');
    
    // Filter out explicitly deactivated groomers in JS (avoids NULL issues in SQL)
    const groomers = (rawGroomers || []).filter(g => g.is_active !== false);
    
    if (groomersError || !groomers.length) {
        console.error('No groomers found:', groomersError);
        return { bestAvailable: [], moreAvailable: [], error: true };
    }
    
    // Filter groomers by customer's region (only if groomers have regions assigned)
    const customerRegion = state.customerBookingRegion;
    let eligibleGroomers = groomers;
    
    // Only apply region filter if at least one groomer has regions configured
    const anyGroomerHasRegions = groomers.some(g => g.service_regions && g.service_regions.length > 0);
    
    if (customerRegion && anyGroomerHasRegions) {
        eligibleGroomers = groomers.filter(g => 
            g.service_regions && g.service_regions.includes(customerRegion.id)
        );
        _log('Filtered groomers for region', customerRegion.id, ':', eligibleGroomers.length, 'of', groomers.length);
        
        if (!eligibleGroomers.length) {
            return { bestAvailable: [], moreAvailable: [], noGroomersInRegion: true };
        }
    } else if (customerRegion && !anyGroomerHasRegions) {
        _log('No groomers have regions assigned yet — showing all groomers');
    }
    
    // 2. Get groomer availability schedules
    const { data: availability } = await supabaseClient
        .from('groomer_availability')
        .select('groomer_id, day_of_week, start_time, end_time, is_available')
        .eq('is_available', true);
    
    // 3. Get time off requests
    const { data: timeOff } = await supabaseClient
        .from('groomer_time_off')
        .select('groomer_id, start_date, end_date')
        .gte('end_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'approved');
    
    // 4. Get existing appointments
    const { data: appointments } = await supabaseClient
        .from('appointments')
        .select('id, appointment_date, start_time, assigned_groomer_id, latitude, longitude')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .not('status', 'in', '("cancelled","no_show")');
    
    // Build lookup maps
    const availabilityMap = {};
    (availability || []).forEach(a => {
        if (!availabilityMap[a.groomer_id]) availabilityMap[a.groomer_id] = {};
        availabilityMap[a.groomer_id][a.day_of_week] = a;
    });
    
    const timeOffSet = new Set();
    (timeOff || []).forEach(t => {
        const start = new Date(t.start_date);
        const end = new Date(t.end_date);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            timeOffSet.add(`${t.groomer_id}_${d.toISOString().split('T')[0]}`);
        }
    });
    
    const bookedSlots = new Set();
    const appointmentsByGroomerDate = {};
    (appointments || []).forEach(a => {
        bookedSlots.add(`${a.assigned_groomer_id}_${a.appointment_date}_${a.start_time?.slice(0,5)}`);
        const key = `${a.assigned_groomer_id}_${a.appointment_date}`;
        if (!appointmentsByGroomerDate[key]) appointmentsByGroomerDate[key] = [];
        appointmentsByGroomerDate[key].push(a);
    });
    
    // 5. Generate all available slots
    const allSlots = [];
    const currentDate = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    
    while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();
        
        for (const groomer of eligibleGroomers) {
            // Check if groomer works this day
            const groomerAvail = availabilityMap[groomer.id]?.[dayOfWeek];
            if (!groomerAvail) continue;
            
            // Check for time off
            if (timeOffSet.has(`${groomer.id}_${dateStr}`)) continue;
            
            // Check each slot
            for (const slot of APPOINTMENT_SLOTS) {
                // Check if within groomer's hours
                if (slot < groomerAvail.start_time?.slice(0,5) || slot >= groomerAvail.end_time?.slice(0,5)) continue;
                
                // Check if already booked
                if (bookedSlots.has(`${groomer.id}_${dateStr}_${slot}`)) continue;
                
                // Calculate distance from previous appointment or home base
                const dayAppts = appointmentsByGroomerDate[`${groomer.id}_${dateStr}`] || [];
                const prevAppt = dayAppts
                    .filter(a => a.start_time?.slice(0,5) < slot)
                    .sort((a, b) => b.start_time.localeCompare(a.start_time))[0];
                
                let distance = null;
                if (prevAppt?.latitude && prevAppt?.longitude) {
                    distance = calculateDistance(customerLat, customerLng, parseFloat(prevAppt.latitude), parseFloat(prevAppt.longitude));
                } else if (groomer.home_latitude && groomer.home_longitude) {
                    distance = calculateDistance(customerLat, customerLng, parseFloat(groomer.home_latitude), parseFloat(groomer.home_longitude));
                } else {
                    distance = calculateDistance(customerLat, customerLng, businessHomeBase.latitude, businessHomeBase.longitude);
                }
                
                allSlots.push({
                    slot_date: dateStr,
                    slot_time: slot,
                    groomer_id: groomer.id,
                    groomer_name: groomer.full_name,
                    distance_from_prev: distance ? Math.round(distance * 100) / 100 : null
                });
            }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return processAvailableSlots(allSlots, customerLat, customerLng);
}

// Legacy function for compatibility - redirects to new system
async function getSmartDateRecommendationsLegacy(customerLat, customerLng, daysAhead = 90) {
    const result = await getSmartDateRecommendations(customerLat, customerLng, daysAhead);
    
    // Convert new format to old format for backward compatibility
    if (result.bestAvailable || result.moreAvailable) {
        return {
            recommended: result.bestAvailable || [],
            goodOptions: [],
            available: result.moreAvailable || [],
            outOfArea: []
        };
    }
    return result;
}

// Store coordinates when creating/updating appointments
async function geocodeAndStoreAppointmentLocation(appointmentId, address, city, zip) {
    const coords = await geocodeAddress(address, city, 'CA', zip);
    
    if (coords && appointmentId) {
        const { error } = await supabaseClient
            .from('appointments')
            .update({
                latitude: coords.latitude,
                longitude: coords.longitude
            })
            .eq('id', appointmentId);
        
        if (error) {
            console.error('Failed to store appointment coordinates:', error);
        } else {
            _log('Stored appointment coordinates:', coords);
        }
    }
    
    return coords;
}

// Store coordinates when updating customer profile
async function geocodeAndStoreProfileLocation(profileId, address, city, zip) {
    const coords = await geocodeAddress(address, city, 'CA', zip);
    
    if (coords && profileId) {
        const { error } = await supabaseClient
            .from('profiles')
            .update({
                latitude: coords.latitude,
                longitude: coords.longitude,
                address_geocoded_at: new Date().toISOString()
            })
            .eq('id', profileId);
        
        if (error) {
            console.error('Failed to store profile coordinates:', error);
        } else {
            _log('Stored profile coordinates:', coords);
            // Update local state
            if (state.currentUser) {
                state.currentUser.latitude = coords.latitude;
                state.currentUser.longitude = coords.longitude;
            }
        }
    }
    
    return coords;
}

// Format distance for display
function formatDistance(miles) {
    if (miles === null || miles === undefined) return '';
    if (miles < 0.5) return '< 0.5 mi';
    return `${miles.toFixed(1)} mi`;
}


// =============================================
// ADDRESS SERVICE AREA VERIFICATION
// =============================================

// Debounce utility
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Debounced version for input events (400ms delay)
const debouncedAddressCheck = debounce(checkAddressServiceArea, 400);

// Check address and show service area badge
async function checkAddressServiceArea() {
    const addressInput = document.getElementById('booking-address');
    const badge = document.getElementById('address-service-badge');
    const checkIcon = document.getElementById('address-check-icon');
    
    if (!addressInput) return;
    
    const address = addressInput.value.trim();
    if (!address || address.length < 5) {
        if (badge) { badge.innerHTML = ''; badge.classList.add('hidden'); }
        if (checkIcon) checkIcon.classList.add('hidden');
        return;
    }
    
    try {
        // Parse address
        const parts = address.split(',').map(p => p.trim());
        const street = parts[0] || address;
        const city = state.currentUser?.city || parts[1] || '';
        const zip = state.currentUser?.zip || '';
        
        // Geocode the address
        const coords = await geocodeAddress(street, city, 'CA', zip);
        
        if (!coords) {
            if (badge) {
                badge.innerHTML = renderServiceAreaBadge(null, null);
                badge.classList.remove('hidden');
            }
            if (checkIcon) checkIcon.classList.add('hidden');
            return;
        }
        
        // Store coordinates for booking
        state.customerBookingCoords = coords;
        
        // Match city to a region
        const detectedCity = coords.city || city || state.currentUser?.city || '';
        const displayZip = coords.zip || zip || state.currentUser?.zip || '';
        const region = getRegionForCity(detectedCity);
        
        // Determine coverage: region exists AND has groomers assigned
        const hasCoverage = region ? getGroomersForRegion(region.id).length > 0 : false;
        // If no regions in database at all, allow booking (system not configured yet)
        const regionsExist = serviceRegions.length > 0;
        const inCoverage = !regionsExist || hasCoverage;
        
        // Show the badge
        if (badge) {
            if (!regionsExist) {
                // No regions set up yet — just show address confirmed
                badge.innerHTML = renderServiceAreaBadge(region, detectedCity, displayZip, true);
            } else {
                badge.innerHTML = renderServiceAreaBadge(region, detectedCity, displayZip, hasCoverage);
            }
            badge.classList.remove('hidden');
        }
        
        // Show green checkmark on input if in coverage
        if (checkIcon) {
            if (inCoverage) {
                checkIcon.classList.remove('hidden');
            } else {
                checkIcon.classList.add('hidden');
            }
        }
        
        // Reload smart date picker if in coverage area
        if (inCoverage) {
            state.customerBookingRegion = region;
            state.smartBookingData = null;
            loadSmartDatePicker();
        }
        
    } catch (err) {
        console.error('Error checking service area:', err);
    }
}

// Render the service area badge UI
function renderServiceAreaBadge(region, city = '', zip = '', hasCoverage = false) {
    // Couldn't geocode
    if (!region && !city) {
        return `
            <div class="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                <span class="material-symbols-outlined text-amber-600 dark:text-amber-400">location_off</span>
                <div class="flex-1">
                    <p class="text-sm font-medium text-amber-800 dark:text-amber-200">Couldn't verify address</p>
                    <p class="text-xs text-amber-600 dark:text-amber-400">Please enter a valid address with city name</p>
                </div>
            </div>
        `;
    }
    
    // No matching region or no groomers covering it
    if (!hasCoverage) {
        return `
            <div class="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                <span class="material-symbols-outlined text-red-600 dark:text-red-400">wrong_location</span>
                <div class="flex-1">
                    <p class="text-sm font-medium text-red-800 dark:text-red-200">Outside Coverage Area</p>
                    <p class="text-xs text-red-600 dark:text-red-400">${city ? escapeHtml(city) + ' — ' : ''}We don't currently serve this area</p>
                    <p class="text-sm text-red-600 dark:text-red-400 mt-1">Please try a different address or call us at (626) 863-6926</p>
                </div>
            </div>
        `;
    }
    
    // Build location text with zip
    const locationParts = [];
    if (city) locationParts.push(city);
    if (zip) locationParts.push('CA ' + zip);
    const locationText = locationParts.length > 0 ? locationParts.join(', ') : '';
    
    // In coverage area — show green confirmed badge
    return `
        <div class="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg">
            <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl fill-1">check_circle</span>
            </div>
            <div class="flex-1">
                <div class="flex items-center gap-1.5">
                    <p class="text-sm font-bold text-emerald-800 dark:text-emerald-200">Address Confirmed</p>
                    <span class="material-symbols-outlined text-emerald-500 text-base fill-1">verified</span>
                </div>
                ${locationText ? `<p class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">${escapeHtml(locationText)}</p>` : ''}
                ${region && region.name ? `<p class="text-xs text-emerald-600 dark:text-emerald-400">${escapeHtml(region.name)} coverage area</p>` : ''}
            </div>
        </div>
    `;
}


// =============================================
// FALLBACK DATA (for demo when database is empty)
// =============================================
const fallbackData = {
    services: [
        { id: '1', name: 'Full Grooming', description: 'Complete grooming package', duration_minutes: 90, base_price: 85, price_small: 65, price_medium: 85, price_large: 105 },
        { id: '2', name: 'Bath & Brush', description: 'Thorough bath and brushing', duration_minutes: 60, base_price: 55, price_small: 45, price_medium: 55, price_large: 70 },
        { id: '3', name: 'Puppy First Groom', description: 'Gentle intro for puppies', duration_minutes: 45, base_price: 45 },
        { id: '4', name: 'Nail Trim', description: 'Quick nail trimming', duration_minutes: 15, base_price: 20, is_addon: true }
    ],
    products: [
        { id: '1', name: 'Soothing Oatmeal Shampoo', price: 14.99, category: 'grooming', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMKgUmjvDBkj1cS2xNNGiY6RxULqo_q_qTbUWOJk7DBZYrF3zP8DpSUHcgGfbH8zpSf9NqqLhQrEloqgKWve4BVE9bWl41KHvdV7rKFUPMhcoJkX_WqH8dlN-ReLiSQhWqYdzZion6BRW4vFG2kbqH25uuBAQMPtnfBawmO8ueSzNPj7TG-b_GBe1DxAerdgmn3X-P5jOnFEP2_LtSjwIM_Ly6ov8dX0enxErJC81GkXDnpXkVa21RQPQ-lr6fNXwdtpJtOZg7FveL', description: 'Hypoallergenic formula', badge: 'popular' },
        { id: '2', name: 'Pro Slicker Brush', price: 22.50, category: 'grooming', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhRyB6hZU9Y9Vmd6rp_OesEand1Ucr8YLYYMVQH0nIzfB0qMa-4Rd_PyiEoJDtN24jE2Y_mM_3ACLp29R0qBTbpe5kipzat_nuE8wiDbTgj7tHuvtjhXx6l8KegMMQgzL_iN75VoHstS-7CbAFyuzNnkE-bzeTEfIyae0rcMI_C2XjFH9Ld84BBTT9zxx8jSfjZOj4MDihRtDSfanSxRNKIJ_hIumhhiaokmVM2RRauG8sUpm5-OpZx_dESHIlljuPRSyVe0NtlPHa', description: 'Remove tangles easily' }
    ],
    rewards: [
        { id: '1', name: 'Free Bath & Brush', points_required: 500, description: 'Complete bath service' },
        { id: '2', name: '$20 Off Full Groom', points_required: 300, description: 'Discount on grooming' },
        { id: '3', name: 'Free Nail Trim', points_required: 150, description: 'Nail trimming service' }
    ],
    rideAlongPackages: [
        { id: '1', name: 'Observer Package', price: 199, duration: '4 hours', description: 'Shadow a professional groomer for a half day.', features: ['4-hour shadowing session', 'Watch 2-3 complete grooms', 'Q&A with instructor', 'Digital handbook included'] },
        { id: '2', name: 'Hands-On Package', price: 399, duration: 'Full Day', description: 'Get hands-on experience under direct supervision.', features: ['8-hour full day session', 'Hands-on with 4-5 dogs', 'Certificate of completion', 'Lunch included'], is_popular: true },
        { id: '3', name: 'Mentorship Package', price: 999, duration: '3 Days', description: 'Comprehensive 3-day intensive training.', features: ['3 full days of training', 'Groom 12+ dogs hands-on', 'Business coaching session', '30-day follow-up support'] }
    ]
};

// Use fallback data if database is empty
function getServices() { return state.services.length ? state.services : fallbackData.services; }
function getProducts() { return state.products.length ? state.products : fallbackData.products; }
function getRewards() { return state.rewards.length ? state.rewards : fallbackData.rewards; }
function getRideAlongPackages() { return state.rideAlongPackages.length ? state.rideAlongPackages : fallbackData.rideAlongPackages; }

// Legacy data object for backward compatibility with existing render functions
const data = {
    get users() { return []; }, // No longer using mock users
    get products() { return getProducts(); },
    get rewards() { return getRewards(); },
    get appointments() { return state.allAppointments; },
    get rideAlongs() { return getRideAlongPackages().map(p => ({...p, features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features, popular: p.is_popular })); }
};

// Toast Notification System
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
    const colors = { 
        success: 'bg-green-500', 
        error: 'bg-red-500', 
        warning: 'bg-amber-500', 
        info: 'bg-blue-500' 
    };
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white ${colors[type]} toast-enter`;
    toast.innerHTML = `<span class="material-symbols-outlined">${icons[type]}</span><span class="font-medium">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Confirm Dialog System
function showConfirm(title, message, onConfirm, onCancel = () => {}, confirmText = 'Confirm') {
    const modal = document.getElementById('confirm-modal');
    const isDestructive = confirmText === 'Delete';
    modal.innerHTML = `
        <div class="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4" onclick="closeConfirm()">
            <div class="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-md w-full p-6" onclick="event.stopPropagation()">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">warning</span>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold dark:text-white">${title}</h3>
                        <p class="text-sm text-text-sub-light dark:text-text-sub-dark">${message}</p>
                    </div>
                </div>
                <div class="flex gap-3 mt-6">
                    <button onclick="closeConfirm()" class="flex-1 h-11 rounded-lg border border-border-light dark:border-border-dark font-bold hover:bg-background-light dark:hover:bg-background-dark dark:text-white touch-target">Cancel</button>
                    <button onclick="confirmAction()" class="flex-1 h-11 rounded-lg ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-sky-600'} text-white font-bold touch-target">${confirmText}</button>
                </div>
            </div>
        </div>`;
    state.confirmDialog = { onConfirm, onCancel };
}

function closeConfirm() {
    document.getElementById('confirm-modal').innerHTML = '';
    if (state.confirmDialog?.onCancel) state.confirmDialog.onCancel();
    state.confirmDialog = null;
}

function confirmAction() {
    if (state.confirmDialog?.onConfirm) state.confirmDialog.onConfirm();
    document.getElementById('confirm-modal').innerHTML = '';
    state.confirmDialog = null;
}

// Loading State
function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

// Simulate async action with loading
async function withLoading(action, delay = 800) {
    showLoading();
    await new Promise(resolve => setTimeout(resolve, delay));
    await action();
    hideLoading();
}

// Dark Mode Toggle
function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    localStorage.setItem('darkMode', state.darkMode);
    if (state.darkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    render();
    showToast(state.darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info', 2000);
}

// Password Toggle
function togglePassword() {
    state.showPassword = !state.showPassword;
    const input = document.getElementById('auth-password');
    if (input) {
        input.type = state.showPassword ? 'text' : 'password';
    }
    // Update the eye icon
    const btn = input?.parentElement?.querySelector('.material-symbols-outlined');
    if (btn) {
        btn.textContent = state.showPassword ? 'visibility_off' : 'visibility';
    }
}

// Remember Me Toggle
function toggleRememberMe() {
    state.rememberMe = !state.rememberMe;
    localStorage.setItem('rememberMe', state.rememberMe);
}

// Booking Handler with Toast

function deleteItem(type, id, name) {
    showConfirm(
        'Confirm Delete',
        `Are you sure you want to delete "${name}"? This action cannot be undone.`,
        async () => {
            await withLoading(async () => {
                // Simulate delete
                showToast(`${name} has been deleted`, 'success');
            });
            render();
        },
        () => {},
        'Delete'
    );
}

function setAuthTab(tab) { state.authTab = tab; state.showPassword = false; render(); }
function setTab(tab) { state.currentTab = tab; state.showMobileMenu = false; render(); }
function setStoreCategory(cat) { state.storeCategory = cat; render(); }
function toggleMobileMenu() { state.showMobileMenu = !state.showMobileMenu; render(); }

// Dashboard view toggle with scroll preservation
function setDashboardView(view) {
    // Find the scrollable content area
    const scrollContainer = document.querySelector('.overflow-y-auto');
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    
    // Update state
    state.dashboardScheduleView = view;
    
    // Render
    render();
    
    // Restore scroll position after render
    requestAnimationFrame(() => {
        const newScrollContainer = document.querySelector('.overflow-y-auto');
        if (newScrollContainer) {
            newScrollContainer.scrollTop = scrollTop;
        }
    });
}

// Select a date from calendar and switch to day view (preserves scroll)
function selectDashboardDate(dateStr) {
    const scrollContainer = document.querySelector('.overflow-y-auto');
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    
    state.dashboardScheduleView = 'day';
    state.adminDashboardSelectedDate = dateStr;
    
    render();
    
    requestAnimationFrame(() => {
        const newScrollContainer = document.querySelector('.overflow-y-auto');
        if (newScrollContainer) {
            newScrollContainer.scrollTop = scrollTop;
        }
    });
}


function logout() { 
    showConfirm(
        'Sign Out',
        'Are you sure you want to sign out?',
        async () => {
            await handleSignOut();
        },
        () => {},
        'Sign Out'
    );
}



