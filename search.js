// DOM Elements
const mobileFilterToggle = document.getElementById('mobileFilterToggle');
const filtersSidebar = document.querySelector('.filters-sidebar');
const sidebarOverlay = document.querySelector('.sidebar-overlay');
const closeMobileFilters = document.getElementById('closeMobileFilters');
const applyMobileFilters = document.getElementById('applyMobileFilters');
const applyFilters = document.getElementById('applyFilters');
const resetFilters = document.getElementById('resetFilters');
const searchInput = document.getElementById('searchInput');
const appliedFiltersContainer = document.getElementById('appliedFilters');
// DOM Elements for custom job modal
const createJobBtn = document.getElementById('createJobBtn');
const createJobModal = document.getElementById('createJobModal');
const closeJobModal = document.getElementById('closeJobModal');
const cancelJobPost = document.getElementById('cancelJobPost');
const saveJobPost = document.getElementById('saveJobPost');
const jobSkillsSearch = document.getElementById('jobSkillsSearch');
const jobSkillsOptions = document.getElementById('jobSkillsOptions');
const jobSelectedSkills = document.getElementById('jobSelectedSkills');
const jobLocationSearch = document.getElementById('jobLocationSearch');
const jobLocationOptions = document.getElementById('jobLocationOptions');
const jobSelectedLocations = document.getElementById('jobSelectedLocations');


// create job bifurcated modals
const nextToStep2Btn = document.getElementById('nextToStep2');
const nextStep3Btn = document.getElementById('nextToStep3');
const nextToStep3Btn = document.getElementById('nextToStep3');
const backToStep1Btn = document.getElementById('backToStep1');
const backToStep2Btn = document.getElementById('backToStep2');

const filterModal1 = document.getElementById('step1');
const filterModal2 = document.getElementById('step2');
const filterModal3 = document.getElementById('step3');


// Modal elements
const resumeModal = document.getElementById('resumeModal');
const closeResumeModal = document.getElementById('closeResumeModal');
const contactModal = document.getElementById('contactModal');
const closeContactModal = document.getElementById('cancelContact');
const messageSuccessModal = document.getElementById('messageSuccessModal');
const messageSuccessOk = document.getElementById('messageSuccessOk');
const saveSuccessModal = document.getElementById('saveSuccessModal');
const saveSuccessOk = document.getElementById('saveSuccessOk');

// View resume buttons
const viewResumeBtns = document.querySelectorAll('.view-resume-btn');
const contactBtns = document.querySelectorAll('.contact-btn');
const contactCandidate = document.getElementById('contactCandidate');
const downloadResume = document.getElementById('downloadResume');
const saveCandidate = document.getElementById('saveCandidate');
const sendMessage = document.getElementById('sendMessage');

// Location data for the multi-select dropdown - will be loaded from shared source
let locations = [
    "Remote", "Bangalore", "Hyderabad", "Delhi", "Pune", "Chennai", "Mumbai",
    "Gurugram", "Noida", "Kolkata", "Ahmedabad", "Jaipur",
    "Indore", "Coimbatore", "Trivandrum", "Mohali", "Chandigarh"
];

// Load shared location data
async function loadSharedLocationData() {
    try {
        const response = await fetch('/data/locations.json');
        if (response.ok) {
            const sharedLocations = await response.json();
            locations = sharedLocations;

        }
    } catch (error) {
        console.warn('Failed to load shared location data, using fallback:', error);
    }
}

// Skills data
const skills = [
    "JavaScript", "Python", "Java", "C++", "C#",
    "PHP", "Ruby", "Go", "Swift", "Kotlin",
    "TypeScript", "React", "Angular", "Vue", "Node.js",
    "Express", "Django", "Flask", "Spring", "Laravel",
    "Ruby on Rails", "ASP.NET", "AWS", "Azure", "Google Cloud",
    "Docker", "Kubernetes", "Terraform", "CI/CD", "Git",
    "SQL", "MongoDB", "PostgreSQL", "MySQL", "Redis",
    "Machine Learning", "Data Science", "TensorFlow", "PyTorch", "Pandas",
    "NumPy", "Scikit-learn", "Computer Vision", "NLP", "Blockchain",
    "Solidity", "Rust", "GraphQL", "REST API", "Microservices"
];

// Current filters state
let currentFilters = {
    skills: [],
    locations: [],
    experience: [],
    workType: [],
    jobType: [],
    salaryRange: [0, 100000],
    education: [],
    availability: "",
    selectedJob: null // Track selected job for applied filters display
};

// Global variables for job selection
let currentSelectedJobId = null;
let currentSelectedJobCriteria = null;





// Render applied filters bar
function renderAppliedFilters() {
    appliedFiltersContainer.innerHTML = '';

    // Only show the applied filters bar if there are filters applied
    const hasFilters =
        currentFilters.skills.length > 0 ||
        currentFilters.locations.length > 0 ||
        currentFilters.experience.length > 0 ||
        currentFilters.workType.length > 0 ||
        currentFilters.jobType.length > 0 ||
        (currentFilters.salaryRange[0] !== 0 || currentFilters.salaryRange[1] !== 100000) ||
        currentFilters.education.length > 0 ||
        (currentFilters.availability && currentFilters.availability !== "") ||
        currentFilters.selectedJob;

    if (!hasFilters) {
        appliedFiltersContainer.classList.add('hidden');
        return;
    }

    appliedFiltersContainer.classList.remove('hidden');

    // Selected Job filter - show at the top
    if (currentFilters.selectedJob) {
        const filter = document.createElement('div');
        filter.className = 'applied-filter job-filter';
        filter.innerHTML = `
            <i class="fas fa-briefcase mr-2"></i>Job: ${escapeHtml(currentFilters.selectedJob.title)}
            <span class="applied-filter-remove" data-type="selectedJob">&times;</span>
        `;
        appliedFiltersContainer.appendChild(filter);
    }

    // Skills filters - show all selected skills
    currentFilters.skills.forEach(skill => {
        const filter = document.createElement('div');
        filter.className = 'applied-filter';
        filter.innerHTML = `
                    Skills: ${escapeHtml(skill)}
                    <span class="applied-filter-remove" data-type="skills" data-value="${escapeHtml(skill)}">&times;</span>
                `;
        appliedFiltersContainer.appendChild(filter);
    });


    // Location filters - show all selected locations
    currentFilters.locations.forEach(location => {
        const filter = document.createElement('div');
        filter.className = 'applied-filter';
        filter.innerHTML = `
                    Location: ${escapeHtml(location)}
                    <span class="applied-filter-remove" data-type="locations" data-value="${escapeHtml(location)}">&times;</span>
                `;
        appliedFiltersContainer.appendChild(filter);
    });

    // Experience filters
    if (currentFilters.experience.length > 0) {
        currentFilters.experience.forEach(exp => {
            const filter = document.createElement('div');
            filter.className = 'applied-filter';
            let displayText = '';

            switch (exp) {
                case 'entry': displayText = 'Entry Level'; break;
                case 'mid': displayText = 'Mid Level'; break;
                case 'senior': displayText = 'Senior'; break;
                case 'exec': displayText = 'Executive'; break;
            }

            filter.innerHTML = `
                        Experience: ${displayText}
                        <span class="applied-filter-remove" data-type="experience" data-value="${exp}">&times;</span>
                    `;
            appliedFiltersContainer.appendChild(filter);
        });
    }

    // Work type filters
    if (currentFilters.workType.length > 0) {
        currentFilters.workType.forEach(type => {
            const filter = document.createElement('div');
            filter.className = 'applied-filter';
            let displayText = '';

            switch (type) {
                case 'remote': displayText = 'Remote'; break;
                case 'hybrid': displayText = 'Hybrid'; break;
                case 'office': displayText = 'In Office'; break;
            }

            filter.innerHTML = `
                        Work Type: ${displayText}
                        <span class="applied-filter-remove" data-type="workType" data-value="${type}">&times;</span>
                    `;
            appliedFiltersContainer.appendChild(filter)
        });
    }

    // Job type filters
    if (currentFilters.jobType.length > 0) {
        currentFilters.jobType.forEach(type => {
            const filter = document.createElement('div');
            filter.className = 'applied-filter';
            let displayText = '';

            switch (type) {
                case 'fulltime': displayText = 'Full Time'; break;
                case 'parttime': displayText = 'Part Time'; break;
                case 'contract': displayText = 'Contract'; break;
                case 'internship': displayText = 'Internship'; break;
            }

            filter.innerHTML = `
                        Job Type: ${displayText}
                        <span class="applied-filter-remove" data-type="jobType" data-value="${type}">&times;</span>
                    `;
            appliedFiltersContainer.appendChild(filter);
        });
    }

    // Salary range filter
    if (currentFilters.salaryRange[0] !== 0 || currentFilters.salaryRange[1] !== 100000) {
        const filter = document.createElement('div');
        filter.className = 'applied-filter';
        filter.innerHTML = `
                    Up to $${currentFilters.salaryRange[1] / 1000}k
                    <span class="applied-filter-remove" data-type="salaryRange">&times;</span>
                `;
        appliedFiltersContainer.appendChild(filter);
    }

    // Education filters
    if (currentFilters.education.length > 0) {
        currentFilters.education.forEach(edu => {
            const filter = document.createElement('div');
            filter.className = 'applied-filter';
            let displayText = '';

            switch (edu) {
                case 'highschool': displayText = 'High School'; break;
                case 'associate': displayText = 'Associate Degree'; break;
                case 'bachelor': displayText = 'Bachelor\'s Degree'; break;
                case 'master': displayText = 'Master\'s Degree'; break;
                case 'phd': displayText = 'PhD'; break;
            }

            filter.innerHTML = `
                        Education: ${displayText}
                        <span class="applied-filter-remove" data-type="education" data-value="${edu}">&times;</span>
                    `;
            appliedFiltersContainer.appendChild(filter);
        });
    }

    // Availability filter
    if (currentFilters.availability && currentFilters.availability !== "") {
        const filter = document.createElement('div');
        filter.className = 'applied-filter';
        let displayText = '';

        switch (currentFilters.availability) {
            case 'immediate': displayText = 'Immediate'; break;
            case '15 days': displayText = 'Within 15 days'; break;
            case '1 month': displayText = 'Within 1 month'; break;
        }

        filter.innerHTML = `
                    Availability: ${displayText}
                    <span class="applied-filter-remove" data-type="availability">&times;</span>
                `;
        appliedFiltersContainer.appendChild(filter);
    }

    // Add event listeners to remove buttons
    document.querySelectorAll('.applied-filter-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.getAttribute('data-type');
            const value = e.target.getAttribute('data-value');

            if (type === 'salaryRange') {
                currentFilters.salaryRange = [0, 100000];
                document.getElementById('salaryRange').value = 100000;
                document.getElementById('mobileSalaryRange').value = 100000;
                document.getElementById('maxSalary').textContent = '$100k+';
                document.getElementById('mobileMaxSalary').textContent = '$100k+';
            } else if (type === 'availability') {
                currentFilters.availability = "";
                document.querySelectorAll('.availability-btn, .mobile-availability-btn').forEach(b => {
                    b.classList.remove('active');
                });
            } else if (type === 'selectedJob') {
                // Clear selected job and reset dropdown
                currentFilters.selectedJob = null;
                currentSelectedJobId = null;
                currentSelectedJobCriteria = null;
                const dropdownBtn = document.getElementById('jobDropdownBtn');
                const textSpan = dropdownBtn.querySelector('#selectedJobTitle');
                if (textSpan) {
                    textSpan.textContent = 'Select Job';
                }
                dropdownBtn.classList.remove('job-selected', 'border-blue-500', 'bg-blue-50');
                dropdownBtn.classList.add('border-gray-200');
                
                // Clear dropdown items visual state
                document.querySelectorAll('.job-dropdown-item').forEach(item => {
                    item.classList.remove('bg-blue-50', 'border-l-4', 'border-blue-500');
                });
                
                // Re-apply filters without job criteria
                applyAllFilters();
            } else {
                currentFilters[type] = currentFilters[type].filter(item => item !== value);

                // Update checkboxes
                if (type === 'experience') {
                    document.getElementById(`exp-${value}`).checked = false;
                    document.getElementById(`mobile-exp-${value}`).checked = false;
                } else if (type === 'education') {
                    document.getElementById(`edu-${value}`).checked = false;
                    document.getElementById(`mobile-edu-${value}`).checked = false;
                }

                // Update chips
                if (type === 'workType' || type === 'jobType') {
                    document.querySelectorAll(`.${type}-btn, .mobile-${type}-btn`).forEach(b => {
                        if (b.getAttribute('data-value') === value) {
                            b.classList.remove('active');
                        }
                    });
                }
            }

            renderAppliedFilters();
        });
    });
}






// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    // Initialize filter sections
    initFilterSections();

    // Initialize multi-select dropdowns
    initMultiSelectDropdowns();

    // Initialize range slider
    initRangeSlider();

    // Initialize filter chips
    initFilterChips();

    // Set up modal interactions
    setupModals();
    // set up resume modal
    setupResumeModal();

    // Set up mobile filter toggle
    setupMobileFilters();
    
    // Create and add loading overlay to results container
    const resultsContainer = document.querySelector('.results-container');
    if (resultsContainer) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'results-loading-overlay';
        loadingOverlay.innerHTML = '<div class="spinner"></div>';
        loadingOverlay.style.display = 'none';
        resultsContainer.appendChild(loadingOverlay);
    }

    // Add real-time filtering for search input with debounce
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyAllFilters();
            }, 500); // 500ms debounce delay
        });
    }

    // Apply filters button
    applyFilters.addEventListener('click', applyAllFilters);

    // Reset filters button
    resetFilters.addEventListener('click', function() {
        // Show loading indicator on the reset button
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Resetting...';
        this.disabled = true;
        
        // Call reset function
        resetAllFilters().then(() => {
            // Restore button state
            this.innerHTML = originalText;
            this.disabled = false;
        });
    });

    // Mobile apply filters button
    applyMobileFilters.addEventListener('click', function () {
        syncFiltersFromMobile(); // Sync mobile filters to desktop
        applyAllFilters();
        closeMobileSidebar();
    });
    
    // Mobile reset filters button
    const mobileResetFilters = document.querySelector('.filters-sidebar #resetFilters');
    if (mobileResetFilters) {
        mobileResetFilters.addEventListener('click', function() {
            // Show loading indicator on the reset button
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Resetting...';
            this.disabled = true;
            
            // Call reset function
            resetAllFilters().then(() => {
                // Restore button state
                this.innerHTML = originalText;
                this.disabled = false;
                
                // Close mobile sidebar
                closeMobileSidebar();
            });
        });
    }

    // Initial render of applied filters
    renderAppliedFilters();

    // initialize Create Job Modal
    initCreateJobModal();

    // selectJobDropDown
    selectJobDropdown();



    // Load shared location data
    loadSharedLocationData();
});



// Initialize filter sections with expand/collapse functionality
function initFilterSections() {
    // Initialize both main filters and job modal filters
    const filterHeaders = document.querySelectorAll('.filter-header');

    filterHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const section = this.closest('.filter-section');
            section.classList.toggle('expanded');

            // Also find and toggle the chevron icon if it exists
            const chevron = this.querySelector('.filter-chevron');
            if (chevron) {
                chevron.classList.toggle('rotate-180');
            }
        });


    });
}

// Initialize multi-select dropdowns for skills and locations
function initMultiSelectDropdowns() {
    // Desktop skills dropdown
    initMultiSelect('skillsSearch', 'skillsOptions', 'selectedSkills', skills, 'skills');

    // Desktop locations dropdown
    initMultiSelect('locationSearch', 'locationOptions', 'selectedLocations', locations, 'locations');

    // Mobile skills dropdown
    initMultiSelect('mobileSkillsSearch', 'mobileSkillsOptions', 'mobileSelectedSkills', skills, 'skills', true);

    // Mobile locations dropdown
    initMultiSelect('mobileLocationSearch', 'mobileLocationOptions', 'mobileSelectedLocations', locations, 'locations', true);
}

// Initialize a multi-select dropdown
function initMultiSelect(inputId, optionsId, tagsId, data, filterKey, isMobile = false) {
    const input = document.getElementById(inputId);
    const options = document.getElementById(optionsId);
    const tagsContainer = document.getElementById(tagsId);

    // Validate required elements
    if (!input || !options || !tagsContainer) {
        console.warn(`Missing elements for multiselect: ${inputId}, ${optionsId}, ${tagsId}`);
        return;
    }

    // Ensure data is available and is an array
    if (!Array.isArray(data) || data.length === 0) {
        console.warn(`Invalid data for multiselect ${inputId}:`, data);
        return;
    }

    // Render selected tags
    function renderSelectedTags() {
        if (!tagsContainer) return;

        tagsContainer.innerHTML = '';
        const selectedItems = currentFilters[filterKey] || [];

        selectedItems.forEach(item => {
            const tag = document.createElement('div');
            tag.className = 'multiselect-tag';
            tag.innerHTML = `
                        <span class="tag-text">${escapeHtml(item)}</span>
                        <span class="multiselect-tag-remove" data-value="${escapeHtml(item)}" title="Remove ${escapeHtml(item)}">&times;</span>
                    `;
            tagsContainer.appendChild(tag);
        });

        // Add event listeners to remove buttons
        document.querySelectorAll(`#${tagsId} .multiselect-tag-remove`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const valueToRemove = e.target.getAttribute('data-value');
                currentFilters[filterKey] = (currentFilters[filterKey] || []).filter(item => item !== valueToRemove);
                renderSelectedTags();
                renderOptions(input.value);
                renderAppliedFilters();
                applyAllFilters(); // Apply filters immediately
            });
        });
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Render dropdown options with enhanced filtering
    function renderOptions(searchTerm = '') {
        if (!options) return;

        options.innerHTML = '';
        const selectedItems = currentFilters[filterKey] || [];

        // Enhanced filtering: support partial matches and special characters
        const filteredData = data.filter(item => {
            if (!item || typeof item !== 'string') return false;

            // Check if already selected
            if (selectedItems.includes(item)) return false;

            // If no search term, show all unselected items
            if (!searchTerm.trim()) return true;

            // Case-insensitive partial matching
            const searchLower = searchTerm.toLowerCase().trim();
            const itemLower = item.toLowerCase();

            // Support multiple search strategies
            return itemLower.includes(searchLower) ||
                   itemLower.startsWith(searchLower) ||
                   item.toLowerCase().replace(/[^a-z0-9]/g, '').includes(searchLower.replace(/[^a-z0-9]/g, ''));
        });

        // Limit results for performance (max 50 items)
        const limitedData = filteredData.slice(0, 50);

        if (limitedData.length === 0) {
            const option = document.createElement('div');
            option.className = 'multiselect-option multiselect-no-results';
            option.textContent = searchTerm.trim() ? `No results found for "${searchTerm}"` : 'No more options available';
            options.appendChild(option);
        } else {
            limitedData.forEach((item, index) => {
                const option = document.createElement('div');
                option.className = 'multiselect-option';
                option.textContent = item;
                option.setAttribute('data-value', item);
                option.setAttribute('data-index', index);

                // Highlight search term if present
                if (searchTerm.trim()) {
                    const regex = new RegExp(`(${escapeRegexForHighlight(searchTerm)})`, 'gi');
                    option.innerHTML = item.replace(regex, '<mark>$1</mark>');
                }

                options.appendChild(option);

                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (!selectedItems.includes(item)) {
                        currentFilters[filterKey] = selectedItems.concat([item]);
                        input.value = ''; // Clear search after selection
                        renderSelectedTags();
                        renderOptions(''); // Show all remaining options
                        input.focus();
                        renderAppliedFilters();
                        applyAllFilters(); // Apply filters immediately
                    }
                });

                // Add hover effects
                option.addEventListener('mouseenter', () => {
                    option.classList.add('multiselect-option-hover');
                });
                option.addEventListener('mouseleave', () => {
                    option.classList.remove('multiselect-option-hover');
                });
            });

            // Show count if results are limited
            if (filteredData.length > 50) {
                const moreOption = document.createElement('div');
                moreOption.className = 'multiselect-option multiselect-more-results';
                moreOption.textContent = `... and ${filteredData.length - 50} more. Keep typing to narrow results.`;
                options.appendChild(moreOption);
            }
        }
    }

    // Helper function to escape regex for highlighting
    function escapeRegexForHighlight(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Enhanced search functionality with debouncing
    let searchTimeout;
    input.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderOptions(e.target.value);
        }, 150); // Debounce for better performance
    });

    // Keyboard navigation support
    let selectedIndex = -1;
    input.addEventListener('keydown', (e) => {
        const optionElements = options.querySelectorAll('.multiselect-option:not(.multiselect-no-results):not(.multiselect-more-results)');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, optionElements.length - 1);
                updateSelectedOption(optionElements);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelectedOption(optionElements);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && optionElements[selectedIndex]) {
                    optionElements[selectedIndex].click();
                }
                break;
            case 'Escape':
                options.classList.remove('show');
                input.blur();
                break;
        }
    });

    function updateSelectedOption(optionElements) {
        optionElements.forEach((option, index) => {
            option.classList.toggle('multiselect-option-selected', index === selectedIndex);
        });
    }

    // Show/hide dropdown with improved handling
    input.addEventListener('focus', () => {
        options.classList.add('show');
        selectedIndex = -1; // Reset selection
        renderOptions(input.value);
    });

    input.addEventListener('blur', (e) => {
        // Delay hiding to allow option clicks
        setTimeout(() => {
            if (!options.contains(document.activeElement)) {
                options.classList.remove('show');
                selectedIndex = -1;
            }
        }, 150);
    });

    // Enhanced click outside handling
    document.addEventListener('click', (e) => {
        const container = document.querySelector(`#${inputId}`).closest('.multiselect-container');
        if (container && !container.contains(e.target)) {
            options.classList.remove('show');
            selectedIndex = -1;
        }
    });

    // Prevent dropdown from closing when clicking inside options
    options.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    // Initial render
    renderSelectedTags();

    // Return cleanup function for better memory management
    return {
        destroy: () => {
            clearTimeout(searchTimeout);
            input.removeEventListener('input', arguments[0]);
            input.removeEventListener('keydown', arguments[1]);
            input.removeEventListener('focus', arguments[2]);
            input.removeEventListener('blur', arguments[3]);
        }
    };
}

// Initialize range slider for salary
function initRangeSlider() {
    const salaryRange = document.getElementById('salaryRange');
    const minSalary = document.getElementById('minSalary');
    const maxSalary = document.getElementById('maxSalary');
    const mobileSalaryRange = document.getElementById('mobileSalaryRange');
    const mobileMinSalary = document.getElementById('mobileMinSalary');
    const mobileMaxSalary = document.getElementById('mobileMaxSalary');

    function updateSalaryDisplay(value) {
        if (value >= 200000) {
            return `$${value / 1000}k+`;
        } else {
            return `$${value / 1000}k`;
        }
    }

    salaryRange.addEventListener('input', function () {
        currentFilters.salaryRange = [0, parseInt(this.value)];
        maxSalary.textContent = updateSalaryDisplay(this.value);
        renderAppliedFilters();
        applyAllFilters(); // Apply filters immediately
    });

    mobileSalaryRange.addEventListener('input', function () {
        currentFilters.salaryRange = [0, parseInt(this.value)];
        mobileMaxSalary.textContent = updateSalaryDisplay(this.value);
        renderAppliedFilters();
        applyAllFilters(); // Apply filters immediately
    });

    // Initial display
    maxSalary.textContent = updateSalaryDisplay(salaryRange.value);
    mobileMaxSalary.textContent = updateSalaryDisplay(mobileSalaryRange.value);
}

// Initialize filter chips (buttons that can be toggled)
function initFilterChips() {
    // Work type chips - only for main search filters, not job modal
    document.querySelectorAll('[data-value="remote"], [data-value="hybrid"], [data-value="office"]').forEach(btn => {
        // Skip if this element is inside the job modal
        if (btn.closest('#createJobModal')) return;
        
        btn.addEventListener('click', function () {
            const value = this.getAttribute('data-value');
            const isActive = this.classList.contains('active');

            // For work type, only allow one selection at a time - only affect main filter elements
            document.querySelectorAll('[data-value="remote"], [data-value="hybrid"], [data-value="office"]').forEach(b => {
                if (!b.closest('#createJobModal')) {
                    b.classList.remove('active');
                }
            });

            this.classList.add('active');
            currentFilters.workType = [value];

            renderAppliedFilters();
            applyAllFilters(); // Apply filters immediately
        });
    });

    // Job type chips - only for main search filters, not job modal
    document.querySelectorAll('[data-value="fulltime"], [data-value="parttime"], [data-value="contract"], [data-value="internship"]').forEach(btn => {
        // Skip if this element is inside the job modal
        if (btn.closest('#createJobModal')) return;
        
        btn.addEventListener('click', function () {
            const value = this.getAttribute('data-value');
            const isActive = this.classList.contains('active');

            // For job type, allow multiple selections
            if (isActive) {
                this.classList.remove('active');
                currentFilters.jobType = currentFilters.jobType.filter(item => item !== value);
            } else {
                this.classList.add('active');
                currentFilters.jobType.push(value);
            }

            renderAppliedFilters();
            applyAllFilters(); // Apply filters immediately
        });
    });

    // Availability chips - only for main search filters, not job modal
    document.querySelectorAll('[data-value="immediate"], [data-value="15 days"], [data-value="1 month"]').forEach(btn => {
        // Skip if this element is inside the job modal
        if (btn.closest('#createJobModal')) return;
        
        btn.addEventListener('click', function () {
            const value = this.getAttribute('data-value');
            const isCurrentlyActive = this.classList.contains('active');
            
            // Only affect main filter elements, not job modal elements
            document.querySelectorAll('[data-value="immediate"], [data-value="15 days"], [data-value="1 month"]').forEach(b => {
                if (!b.closest('#createJobModal')) {
                    b.classList.remove('active');
                }
            });
            
            if (isCurrentlyActive) {
                // If clicking on already active button, deselect it
                currentFilters.availability = "";
            } else {
                // If clicking on inactive button, select it
                this.classList.add('active');
                currentFilters.availability = value;
            }
            
            renderAppliedFilters();
            applyAllFilters(); // Apply filters immediately
        });
    });


    // Experience checkboxes with error handling
    document.querySelectorAll('input[type="checkbox"][id^="exp-"], input[type="checkbox"][id^="mobile-exp-"]').forEach(checkbox => {
        if (!checkbox) return; // Skip if checkbox doesn't exist

        checkbox.addEventListener('change', function () {
            try {
                const value = this.id.replace('exp-', '').replace('mobile-exp-', '');

                // Ensure currentFilters.experience is an array
                if (!Array.isArray(currentFilters.experience)) {
                    currentFilters.experience = [];
                }

                if (this.checked) {
                    if (!currentFilters.experience.includes(value)) {
                        currentFilters.experience.push(value);
                    }
                } else {
                    currentFilters.experience = currentFilters.experience.filter(item => item !== value);
                }

                renderAppliedFilters();
                applyAllFilters(); // Apply filters immediately
            } catch (error) {
                console.error('Error handling experience checkbox change:', error);
            }
        });
    });

    // Education checkboxes
    document.querySelectorAll('input[type="checkbox"][id^="edu-"], input[type="checkbox"][id^="mobile-edu-"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const value = this.id.replace('edu-', '').replace('mobile-edu-', '');

            if (this.checked) {
                if (!currentFilters.education.includes(value)) {
                    currentFilters.education.push(value);
                }
            } else {
                currentFilters.education = currentFilters.education.filter(item => item !== value);
            }

            renderAppliedFilters();
            applyAllFilters(); // Apply filters immediately
        });
    });
}



// Apply all filters (search)
// Build payload including only non-default, user-selected filters
function buildSearchPayload() {
    const payload = {};

    const text = (searchInput && typeof searchInput.value === 'string') ? searchInput.value.trim() : '';
    if (text) payload.searchText = text;

    // skills
    if (Array.isArray(currentFilters.skills) && currentFilters.skills.length > 0) {
        payload.skills = currentFilters.skills.slice();
    }

    // locations
    if (Array.isArray(currentFilters.locations) && currentFilters.locations.length > 0) {
        payload.locations = currentFilters.locations.slice();
    }

    // experience
    if (Array.isArray(currentFilters.experience) && currentFilters.experience.length > 0) {
        payload.experience = currentFilters.experience.slice();
    }

    // workType
    if (Array.isArray(currentFilters.workType) && currentFilters.workType.length > 0) {
        payload.workType = currentFilters.workType.slice();
    }

    // jobType
    if (Array.isArray(currentFilters.jobType) && currentFilters.jobType.length > 0) {
        payload.jobType = currentFilters.jobType.slice();
    }

    // salaryRange
    if (Array.isArray(currentFilters.salaryRange) && (currentFilters.salaryRange[0] !== 0 || currentFilters.salaryRange[1] !== 100000)) {
        payload.salaryRange = currentFilters.salaryRange.slice();
    }

    // education
    if (Array.isArray(currentFilters.education) && currentFilters.education.length > 0) {
        payload.education = currentFilters.education.slice();
    }

    // availability
    if (currentFilters.availability && currentFilters.availability !== "") {
        payload.availability = currentFilters.availability;
    }

    // Add job criteria if a job is selected
    if (currentFilters.selectedJob && currentSelectedJobCriteria) {
        payload.jobCriteria = currentSelectedJobCriteria;
    }

    return payload;
}

// Global variable to track current request
let currentFilterController = null;

async function applyAllFilters() {
    // Get DOM elements
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');
    const loadingOverlay = document.getElementById('results-loading-overlay');

    // Track if this is a button click or real-time filtering
    const isButtonClick = document.activeElement === applyFilters || document.activeElement === applyMobileFilters;

    // Cancel any existing request
    if (currentFilterController) {
        currentFilterController.abort();

    }

    // Create new AbortController for this request
    currentFilterController = new AbortController();
    const signal = currentFilterController.signal;

    // Store the current request timestamp to handle race conditions
    const requestTimestamp = Date.now();
    window.lastFilterRequest = requestTimestamp;
    
    // Show appropriate loading indicators
    if (isButtonClick) {
        // Show loading state on button
        const clickedButton = document.activeElement;
        const originalButtonHTML = clickedButton.innerHTML;
        clickedButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Searching...';
        clickedButton.disabled = true;
        
        // Store original button state for later restoration
        window.originalButtonState = {
            button: clickedButton,
            html: originalButtonHTML
        };
    }
    
    // Always show the loading overlay for real-time feedback
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    
    // Update count to indicate loading
    resultsCount.textContent = '...';
    
    // Cache current scroll position
    const scrollPosition = window.scrollY;

    try {
        // Prepare search parameters (only non-default filters)
        const searchParams = buildSearchPayload();

        // make api call with abort signal
        const response = await fetch('/filter/candidates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchParams),
            signal: signal // Use AbortController signal
        });

        // Check if this is still the most recent request
        if (window.lastFilterRequest !== requestTimestamp) {

            return; // Ignore outdated results
        }
        
        if (!response.ok) {
            throw new Error('Search failed')
        }

        const result = await response.json();

        // Handle response and update results count
        if (result.candidates) {
            // Backend returns data structure with candidates array
            updateResults(result.candidates);
            updateResultsCount(result.candidates.length);
        } else {
            // Fallback for direct array response
            updateResults(result);
            updateResultsCount(result.length);
        }

    } catch (error) {
        // Handle AbortError (request was cancelled)
        if (error.name === 'AbortError') {

            return; // Don't show error for cancelled requests
        }

        console.error('Search error:', error);

        // Check if this is still the most recent request
        if (window.lastFilterRequest !== requestTimestamp) {
            return; // Ignore outdated errors
        }

        // Show user-friendly error message
        const errorMessage = error.message.includes('Failed to fetch')
            ? 'Network error. Please check your connection and try again.'
            : 'Error performing search. Please try again.';

        resultsList.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6 text-center">
                <h4 class="text-lg font-medium text-red-600">Search Error</h4>
                <p class="mt-2 text-gray-500">${errorMessage}</p>
                <button onclick="applyAllFilters()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Try Again
                </button>
            </div>
        `;
        resultsCount.textContent = '0';

        // Show toast notification instead of alert for better UX
        if (isButtonClick) {
            showToast(errorMessage, 'error');
        }
    } finally {
        // Clean up AbortController if this was the current request
        if (currentFilterController && currentFilterController.signal === signal) {
            currentFilterController = null;
        }

        // Check if this is still the most recent request
        if (window.lastFilterRequest !== requestTimestamp) {
            return; // Don't update UI for outdated requests
        }

        // Hide loading overlay
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // Restore button state if this was a button click
        if (window.originalButtonState) {
            window.originalButtonState.button.innerHTML = window.originalButtonState.html;
            window.originalButtonState.button.disabled = false;
            window.originalButtonState = null;
            
            // close sidebar if open
            if (typeof closeMobileSidebar === 'function') {
                closeMobileSidebar();
            }
        }
        
        // Restore scroll position for better UX during real-time filtering
        if (!isButtonClick) {
            window.scrollTo(0, scrollPosition);
        }
    }
}








// Helper function to update results count display
function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = count;
    }
}

// Helper function to render skill tags with limit and proper ordering
function renderSkillTags(skills) {
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
        return '<span class="text-sm text-gray-500 italic">No skills listed</span>';
    }

    // Sort skills alphabetically for consistency
    const sortedSkills = [...skills].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    const maxSkillsToShow = 7;
    const skillsToShow = sortedSkills.slice(0, maxSkillsToShow);
    const remainingCount = sortedSkills.length - maxSkillsToShow;

    let skillsHtml = skillsToShow.map(skill => `
        <span class="skill-tag inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mr-1 mb-1">${escapeHtml(skill)}</span>
    `).join('');

    if (remainingCount > 0) {
        skillsHtml += `<span class="skill-tag inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full mr-1 mb-1" title="View resume to see all ${sortedSkills.length} skills">+${remainingCount} more</span>`;
    }

    return skillsHtml;
}

// Helper function to render action buttons based on user role
function renderActionButtons(candidate) {
    // Get current user role from global variable or localStorage
    const currentUser = getCurrentUser();
    const userRole = currentUser?.role || currentUser?.type;

    console.log('Rendering action buttons for user role:', userRole, 'Current user:', currentUser);

    // Only show Contact button for employers
    if (userRole === 'employer') {
        console.log('Showing action buttons for employer user');
        return `
            <button class="contact-btn inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                data-resume-id="${candidate._id}"
                data-user-id="${candidate.userId}">
                <i class="fas fa-envelope mr-1"></i> Contact
            </button>
        `;
    }

    // For engineers or other roles, don't show action buttons
    console.log('Hiding action buttons for non-employer user (role:', userRole, ')');
    return '';
}

// Helper function to get current user information
function getCurrentUser() {
    // First try to get from global window object (set by server-side template)
    if (window.currentUser) {
        return window.currentUser;
    }

    // Fallback: try to get from localStorage
    const storedUser = localStorage.getItem('engineerCVUser');
    if (storedUser) {
        try {
            return JSON.parse(storedUser);
        } catch (e) {
            console.warn('Failed to parse stored user data:', e);
        }
    }

    // Fallback: try to fetch from API
    fetchCurrentUserFromAPI();

    // Return null if no user data found
    return null;
}

// Helper function to fetch user data from API
async function fetchCurrentUserFromAPI() {
    try {
        const response = await fetch('/api/currentUser', {
            credentials: 'include'
        });

        if (response.ok) {
            const userData = await response.json();
            if (userData.success) {
                // Store in window object for immediate use
                window.currentUser = {
                    id: userData.id,
                    name: userData.name.fullName || userData.name,
                    email: userData.email,
                    role: userData.type,
                    type: userData.type
                };

                // Also store in localStorage for persistence
                localStorage.setItem('engineerCVUser', JSON.stringify(window.currentUser));

                return window.currentUser;
            }
        }
    } catch (error) {
        console.warn('Failed to fetch current user from API:', error);
    }
    return null;
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to safely escape JSON for HTML attributes
function escapeJsonForAttribute(obj) {
    try {
        // First stringify the object
        const jsonString = JSON.stringify(obj);

        // Then escape for HTML attribute context
        return jsonString
            .replace(/\\/g, '\\\\')  // Escape backslashes first
            .replace(/"/g, '&quot;') // Escape quotes
            .replace(/'/g, '&#039;') // Escape single quotes
            .replace(/\n/g, '\\n')   // Escape newlines
            .replace(/\r/g, '\\r')   // Escape carriage returns
            .replace(/\t/g, '\\t');  // Escape tabs
    } catch (error) {
        console.error('Error escaping JSON for attribute:', error);
        return '{}'; // Return empty object as fallback
    }
}

// Helper function to convert MongoDB array-like objects to true arrays
function ensureArray(value) {
    if (Array.isArray(value)) {
        return value;
    }
    if (value && typeof value === 'object') {
        // Check if it's an array-like object (has numeric keys and length)
        if (value.length !== undefined && typeof value.length === 'number') {
            return Object.values(value);
        }
        // If it's a single object that should be in an array
        if (Object.keys(value).length > 0) {
            return [value];
        }
    }
    return [];
}

// Helper function to safely parse JSON from HTML attributes
function parseJsonFromAttribute(attributeValue) {
    try {
        if (!attributeValue) {
            throw new Error('Empty attribute value');
        }

        // Unescape HTML entities back to JSON
        const unescapedJson = attributeValue
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');

        return JSON.parse(unescapedJson);
    } catch (error) {
        console.error('Error parsing JSON from attribute:', error);
        throw error;
    }
}

// Function to update results in UI
function updateResults(candidates) {
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');

    // Update count
    resultsCount.textContent = candidates.length;

    // Clear existing results
    resultsList.innerHTML = '';

    if (candidates.length === 0) {
        resultsList.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6 text-center">
                <h4 class="text-lg font-medium text-gray-900">No candidates found</h4>
                <p class="mt-2 text-gray-500">Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }

    // Backend already calculates match scores, just ensure they have proper format and class
    candidates = candidates.map(candidate => ({
        ...candidate,
        matchScore: candidate.matchScore || 0,
        matchClass: candidate.matchClass || getMatchClass(candidate.matchScore || 0)
    }));

    // Sort by match score (highest first) - this is important for job-based filtering
    candidates.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    // Add new results
    candidates.forEach(candidate => {
        const card = document.createElement('div');
        card.className = 'candidate-card bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-200';
        card.setAttribute('data-resume-id', candidate._id);
        // Pass the full resume payload for modal rendering; fallback to candidate itself
        const fullResumePayload = candidate.fullResumeData || candidate;

        // Use safe JSON escaping for HTML attributes
        try {
            // Validate fullResumePayload before escaping
            if (!fullResumePayload || typeof fullResumePayload !== 'object') {
                throw new Error('Invalid fullResumePayload structure');
            }

            card.setAttribute('data-full-resume', escapeJsonForAttribute(fullResumePayload));

        } catch (error) {
            console.error('Error setting resume data for candidate:', candidate.name, error);
            console.error('FullResumePayload:', fullResumePayload);

            // Set minimal fallback data
            const fallbackData = {
                _id: candidate._id || '',
                name: candidate.name || 'Unknown',
                title: candidate.title || 'Not specified',
                email: candidate.email || '',
                phone: candidate.phone || '',
                location: candidate.location || '',
                summary: candidate.summary || 'No summary available',
                skills: Array.isArray(candidate.skills) ? candidate.skills : [],
                experience: [],
                education: {},
                projects: [],
                userId: candidate.userId || ''
            };

            card.setAttribute('data-full-resume', escapeJsonForAttribute(fallbackData));
            console.log('Set fallback data for candidate:', candidate.name);
        }

        card.setAttribute('data-user-id', candidate.userId);

        card.innerHTML = `
            <div class="p-6">
                <div class="flex flex-col md:flex-row md:items-start">
                    <div class="flex-shrink-0 mb-4 md:mb-0 md:mr-4">
                        <div class="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                            ${getInitials(candidate.name)}
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between">
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">${candidate.name || 'Not specified'}</h3>
                                <p class="text-sm text-gray-500">${candidate.title || 'Not specified'}</p>
                            </div>
                            <div class="match-score ${candidate.matchClass}">
                                ${candidate.matchScore}%
                            </div>
                        </div>
                        <div class="mt-2">
                            <div class="flex items-center text-sm text-gray-500">
                                <i class="fas fa-map-marker-alt mr-1"></i>
                                <span>${candidate.location || 'Location not specified'}</span>
                            </div>
                            <div class="flex items-center text-sm text-gray-500 mt-1">
                                <i class="fas fa-briefcase mr-1"></i>
                                <span>${candidate.experienceText || 'Experience not specified'}</span>
                            </div>
                        </div>
                        <div class="mt-3">
                            ${renderSkillTags(candidate.skills)}
                        </div>
                        <div class="mt-4">
                            <p class="text-sm text-gray-600 line-clamp-2">
                                ${candidate.summary || 'No summary available'}
                            </p>
                        </div>
                        <div class="mt-4 flex justify-between items-center">
                            <div class="flex items-center">
                                <i class="fas fa-graduation-cap text-gray-400 mr-1"></i>
                                <span class="text-sm text-gray-600">
                                    ${candidate.education || 'Education not specified'}
                                </span>
                            </div>
                            <div class="flex space-x-2">
                                <button class="view-resume-btn inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    data-resume-id="${candidate._id}"
                                    data-user-id="${candidate.userId}"
                                    data-full-resume='${JSON.stringify(candidate)}'>
                                    <i class="fas fa-eye mr-1"></i> View Resume
                                </button>
                                ${renderActionButtons(candidate)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        resultsList.appendChild(card);
    });

    // Re-attach event listeners to new buttons
    setupResumeModal();
}

// fn to update job dropdown with new job
function updateJobDropdown(newJob) {
    const dropdown = document.getElementById('jobDropdown');
    const dropdownContent = dropdown.querySelector('.py-2');

    // Create the complete job dropdown item structure that matches server-rendered jobs
    const newJobItem = document.createElement('div');
    newJobItem.className = 'job-dropdown-item flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200';
    newJobItem.setAttribute('data-job-id', newJob._id);
    
    // Store the complete job criteria for immediate use (only if we have the data)
    if (newJob.requiredSkills !== undefined) {
        newJobItem.setAttribute('data-job-criteria', JSON.stringify({
            requiredSkills: newJob.requiredSkills || [],
            requiredLocations: newJob.requiredLocations || [],
            requiredJobType: newJob.requiredJobType || [],
            requiredWorkType: newJob.requiredWorkType || [],
            requiredAvailability: newJob.requiredAvailability || '',
            requiredEducation: newJob.requiredEducation || [],
            requiredExperience: newJob.requiredExperience || [],
            requiredSalary: newJob.requiredSalary || [0, 0]
        }));
    }

    newJobItem.innerHTML = `
        <a href="#"
           class="flex-1 job-option"
           data-job-id="${newJob._id}"
           data-job-title="${escapeHtml(newJob.jobTitle)}">
            <div class="flex flex-col">
                <span class="truncate font-medium">${escapeHtml(newJob.jobTitle)}</span>
                ${newJob.jobDescription ? `
                    <span class="text-xs text-gray-500 truncate mt-1">
                        ${escapeHtml(newJob.jobDescription.length > 50 ? newJob.jobDescription.substring(0, 50) + '...' : newJob.jobDescription)}
                    </span>
                ` : ''}
            </div>
        </a>
    `;

    // Find the position to insert - after the "Deselect Job" option and separator
    const clearOption = dropdownContent.querySelector('.job-clear-option');
    
    if (clearOption) {
        // Look for the separator div that comes after the clear option
        const separator = dropdownContent.querySelector('.border-t.border-gray-100');
        
        if (separator) {
            // Insert right after the separator
            separator.insertAdjacentElement('afterend', newJobItem);
            console.log('Job inserted after separator');
        } else {
            // If no separator exists, insert right after the clear option
            clearOption.insertAdjacentElement('afterend', newJobItem);
            console.log('Job inserted after clear option (no separator found)');
        }
    } else {
        // Fallback: insert at the beginning of dropdown content
        dropdownContent.insertBefore(newJobItem, dropdownContent.firstChild);
        console.log('Job inserted at beginning (no clear option found)');
    }

    console.log('Job added to dropdown:', newJob.jobTitle);
}

// Function to generate and download PDF from resume data
async function generateAndDownloadPDF(resumeId) {
    try {
        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            throw new Error('PDF generation library not loaded');
        }

        // Get the resume data from the currently viewed candidate
        const resumeData = getCurrentResumeData();
        if (!resumeData) {
            throw new Error('No resume data available to download');
        }

        // Get candidate name for filename
        const candidateName = resumeData.name || 'Resume';

        // Create a clean PDF structure with the resume data
        const pdfContent = createPDFContentFromData(resumeData);

        // Configure PDF options for better formatting and single page layout
        const opt = {
            margin: [10, 10, 10, 10], // Small margins in mm
            filename: `${candidateName.replace(/\s+/g, '-').toLowerCase()}-resume.pdf`,
            image: { type: 'jpeg', quality: 0.92 },
            html2canvas: { 
                scale: 1.2,
                useCORS: true,
                letterRendering: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                width: 794,
                height: 1123,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait',
                compress: true,
                putOnlyUsedFonts: true
            },
            pagebreak: { 
                mode: ['avoid-all'],
                before: '.page-break-before',
                after: '.page-break-after'
            }
        };

        // Generate and download PDF
        await html2pdf().set(opt).from(pdfContent).save();
        
    } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
    }
}

// Global variable to store current resume data for PDF generation
let currentResumeDataForPDF = null;

// Function to get current resume data from stored global variable
function getCurrentResumeData() {
    return currentResumeDataForPDF;
}



// Function to create PDF content from resume data
function createPDFContentFromData(resumeData) {
    const pdfContainer = document.createElement('div');
    pdfContainer.style.cssText = `
        font-family: 'Arial', 'Helvetica', sans-serif;
        line-height: 1.3;
        color: #333;
        max-width: 750px;
        margin: 0 auto;
        padding: 10px;
        background: white;
        font-size: 11px;
    `;

    // Header Section
    const header = document.createElement('div');
    header.style.cssText = `
        text-align: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid #2563eb;
    `;
    
    const name = document.createElement('h1');
    name.style.cssText = `
        color: #2563eb;
        margin: 0 0 5px 0;
        font-size: 24px;
        font-weight: bold;
    `;
    name.textContent = resumeData.name || 'Unknown Candidate';
    
    const title = document.createElement('h2');
    title.style.cssText = `
        color: #666;
        margin: 0 0 10px 0;
        font-size: 16px;
        font-weight: normal;
    `;
    title.textContent = resumeData.title || resumeData.experience?.[0]?.title || 'Professional';
    
    const contactInfo = document.createElement('div');
    contactInfo.style.cssText = `
        color: #666;
        font-size: 11px;
        margin-top: 8px;
    `;
    
    const contactItems = [];
    if (resumeData.email) contactItems.push(`📧 ${resumeData.email}`);
    if (resumeData.phone) contactItems.push(`📞 ${resumeData.phone}`);
    if (resumeData.location) contactItems.push(`📍 ${resumeData.location}`);
    
    contactInfo.textContent = contactItems.join(' • ');
    
    header.appendChild(name);
    header.appendChild(title);
    header.appendChild(contactInfo);
    pdfContainer.appendChild(header);

    // Summary Section
    if (resumeData.summary || resumeData.professionalSummary) {
        const summarySection = createSection('Professional Summary', 
            resumeData.summary || resumeData.professionalSummary);
        pdfContainer.appendChild(summarySection);
    }

    // Skills Section
    if (resumeData.skills && resumeData.skills.length > 0) {
        const skillsSection = createSkillsSection(resumeData.skills);
        pdfContainer.appendChild(skillsSection);
    }

    // Experience Section
    if (resumeData.experience && resumeData.experience.length > 0) {
        const experienceSection = createExperienceSection(resumeData.experience);
        pdfContainer.appendChild(experienceSection);
    }

    // Education Section
    if (resumeData.education && (Array.isArray(resumeData.education) ? resumeData.education.length > 0 : true)) {
        const educationSection = createEducationSection(resumeData.education);
        pdfContainer.appendChild(educationSection);
    }

    // Projects Section
    if (resumeData.projects && resumeData.projects.length > 0) {
        const projectsSection = createProjectsSection(resumeData.projects);
        pdfContainer.appendChild(projectsSection);
    }

    // Add a note if no content sections are available
    const hasContent = (resumeData.summary || resumeData.professionalSummary) ||
                      (resumeData.skills && resumeData.skills.length > 0) ||
                      (resumeData.experience && resumeData.experience.length > 0) ||
                      (resumeData.education) ||
                      (resumeData.projects && resumeData.projects.length > 0);

    if (!hasContent) {
        const noContentNote = document.createElement('div');
        noContentNote.style.cssText = `
            text-align: center;
            color: #666;
            font-style: italic;
            margin-top: 20px;
            padding: 20px;
            border: 1px dashed #ccc;
        `;
        noContentNote.textContent = 'Resume content is being processed. Please try downloading again in a moment.';
        pdfContainer.appendChild(noContentNote);
    }

    return pdfContainer;
}

// Helper function to create a section
function createSection(title, content) {
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom: 12px;`;
    
    const sectionTitle = document.createElement('h3');
    sectionTitle.style.cssText = `
        color: #2563eb;
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 8px 0;
        padding-bottom: 3px;
        border-bottom: 1px solid #e5e7eb;
    `;
    sectionTitle.textContent = title;
    
    const sectionContent = document.createElement('p');
    sectionContent.style.cssText = `
        margin: 0;
        line-height: 1.5;
        text-align: justify;
    `;
    sectionContent.textContent = content;
    
    section.appendChild(sectionTitle);
    section.appendChild(sectionContent);
    return section;
}

// Helper function to create skills section
function createSkillsSection(skills) {
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom: 12px;`;
    
    const title = document.createElement('h3');
    title.style.cssText = `
        color: #2563eb;
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 8px 0;
        padding-bottom: 3px;
        border-bottom: 1px solid #e5e7eb;
    `;
    title.textContent = 'Technical Skills';
    
    const skillsContainer = document.createElement('div');
    skillsContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 5px;
    `;
    
    skills.forEach(skill => {
        const skillTag = document.createElement('span');
        skillTag.style.cssText = `
            background-color: #f3f4f6;
            color: #374151;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            border: 1px solid #d1d5db;
            display: inline-block;
            margin: 2px;
        `;
        skillTag.textContent = skill;
        skillsContainer.appendChild(skillTag);
    });
    
    section.appendChild(title);
    section.appendChild(skillsContainer);
    return section;
}

// Helper function to create experience section
function createExperienceSection(experience) {
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom: 15px;`;
    
    const title = document.createElement('h3');
    title.style.cssText = `
        color: #2563eb;
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 8px 0;
        padding-bottom: 3px;
        border-bottom: 1px solid #e5e7eb;
    `;
    title.textContent = 'Professional Experience';
    section.appendChild(title);
    
    experience.forEach((exp, index) => {
        const expItem = document.createElement('div');
        expItem.style.cssText = `margin-bottom: ${index < experience.length - 1 ? '12px' : '0'};`;
        
        const expHeader = document.createElement('div');
        expHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 3px;
        `;
        
        const expTitle = document.createElement('h4');
        expTitle.style.cssText = `
            font-size: 12px;
            font-weight: bold;
            margin: 0;
            color: #1f2937;
        `;
        expTitle.textContent = exp.title || exp.position || 'Position';
        
        const expDates = document.createElement('span');
        expDates.style.cssText = `
            font-size: 10px;
            color: #666;
            white-space: nowrap;
        `;
        const startDate = exp.startDate || '';
        const endDate = exp.endDate || 'Present';
        expDates.textContent = `${startDate} - ${endDate}`;
        
        expHeader.appendChild(expTitle);
        expHeader.appendChild(expDates);
        
        const expCompany = document.createElement('p');
        expCompany.style.cssText = `
            font-size: 11px;
            color: #666;
            margin: 0 0 5px 0;
            font-style: italic;
        `;
        expCompany.textContent = `${exp.company || 'Company'}${exp.location ? `, ${exp.location}` : ''}`;
        
        expItem.appendChild(expHeader);
        expItem.appendChild(expCompany);
        
        if (exp.description) {
            const expDesc = document.createElement('div');
            expDesc.style.cssText = `
                font-size: 11px;
                line-height: 1.4;
                color: #374151;
            `;
            
            if (Array.isArray(exp.description)) {
                const ul = document.createElement('ul');
                ul.style.cssText = `margin: 0; padding-left: 15px;`;
                exp.description.forEach(item => {
                    const li = document.createElement('li');
                    li.style.cssText = `margin-bottom: 2px;`;
                    li.textContent = item;
                    ul.appendChild(li);
                });
                expDesc.appendChild(ul);
            } else {
                expDesc.textContent = exp.description;
            }
            expItem.appendChild(expDesc);
        }
        
        section.appendChild(expItem);
    });
    
    return section;
}

// Helper function to create education section
function createEducationSection(education) {
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom: 15px;`;
    
    const title = document.createElement('h3');
    title.style.cssText = `
        color: #2563eb;
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 8px 0;
        padding-bottom: 3px;
        border-bottom: 1px solid #e5e7eb;
    `;
    title.textContent = 'Education';
    
    const eduContent = document.createElement('div');
    
    // Handle both array and single object
    const eduArray = Array.isArray(education) ? education : [education];
    
    eduArray.forEach((edu, index) => {
        const eduItem = document.createElement('div');
        eduItem.style.cssText = `margin-bottom: ${index < eduArray.length - 1 ? '8px' : '0'};`;
        
        const eduHeader = document.createElement('div');
        eduHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        `;
        
        const eduInstitution = document.createElement('h4');
        eduInstitution.style.cssText = `
            font-size: 12px;
            font-weight: bold;
            margin: 0;
            color: #1f2937;
        `;
        eduInstitution.textContent = edu.institution || edu.school || 'Institution';
        
        const eduDates = document.createElement('span');
        eduDates.style.cssText = `
            font-size: 10px;
            color: #666;
        `;
        eduDates.textContent = `${edu.startYear || ''} - ${edu.endYear || ''}`.trim();
        
        eduHeader.appendChild(eduInstitution);
        if (eduDates.textContent !== ' -') {
            eduHeader.appendChild(eduDates);
        }
        
        const eduDegree = document.createElement('p');
        eduDegree.style.cssText = `
            font-size: 11px;
            color: #666;
            margin: 2px 0 0 0;
        `;
        const degreeText = edu.degree || '';
        const fieldText = edu.field ? ` in ${edu.field}` : '';
        eduDegree.textContent = `${degreeText}${fieldText}`;
        
        eduItem.appendChild(eduHeader);
        if (eduDegree.textContent.trim()) {
            eduItem.appendChild(eduDegree);
        }
        
        if (edu.gpa) {
            const gpa = document.createElement('p');
            gpa.style.cssText = `
                font-size: 10px;
                color: #666;
                margin: 2px 0 0 0;
            `;
            gpa.textContent = `GPA: ${edu.gpa}`;
            eduItem.appendChild(gpa);
        }
        
        eduContent.appendChild(eduItem);
    });
    
    section.appendChild(title);
    section.appendChild(eduContent);
    return section;
}

// Helper function to create projects section
function createProjectsSection(projects) {
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom: 15px;`;
    
    const title = document.createElement('h3');
    title.style.cssText = `
        color: #2563eb;
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 8px 0;
        padding-bottom: 3px;
        border-bottom: 1px solid #e5e7eb;
    `;
    title.textContent = 'Projects';
    section.appendChild(title);
    
    projects.forEach((project, index) => {
        const projectItem = document.createElement('div');
        projectItem.style.cssText = `margin-bottom: ${index < projects.length - 1 ? '10px' : '0'};`;
        
        const projectTitle = document.createElement('h4');
        projectTitle.style.cssText = `
            font-size: 12px;
            font-weight: bold;
            margin: 0 0 3px 0;
            color: #1f2937;
        `;
        projectTitle.textContent = project.title || project.name || 'Project';
        
        projectItem.appendChild(projectTitle);
        
        if (project.technologies) {
            const tech = document.createElement('p');
            tech.style.cssText = `
                font-size: 10px;
                color: #666;
                margin: 0 0 3px 0;
                font-style: italic;
            `;
            tech.textContent = `Technologies: ${project.technologies}`;
            projectItem.appendChild(tech);
        }
        
        if (project.description) {
            const desc = document.createElement('p');
            desc.style.cssText = `
                font-size: 11px;
                line-height: 1.4;
                color: #374151;
                margin: 0;
            `;
            const description = Array.isArray(project.description) ? 
                project.description.join(' ') : project.description;
            desc.textContent = description;
            projectItem.appendChild(desc);
        }
        
        section.appendChild(projectItem);
    });
    
    return section;
}



// Helper function to get initials
function getInitials(name) {
    if (!name) return 'NN';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

// Helper function to format experience text
function getExperienceText(years) {
    if (!years || years === 0) return 'Experience not specified';

    const roundedYears = Math.round(years * 10) / 10; // Round to 1 decimal place

    if (roundedYears < 1) {
        const months = Math.round(years * 12);
        return `${months} months experience`;
    } else if (roundedYears < 2) {
        return `${roundedYears} year experience`;
    } else {
        return `${roundedYears} years experience`;
    }
}

// Reset all filters to default
function resetAllFilters() {
    return new Promise((resolve) => {
        // Store original scroll position
        const scrollPosition = window.scrollY;
        
        // Show loading overlay
        const loadingOverlay = document.getElementById('results-loading-overlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        // Reset filter state
        currentFilters = {
            skills: [],
            locations: [],
            experience: [],
            workType: [],
            jobType: [],
            salaryRange: [0, 100000],
            education: [],
            availability: "",
            selectedJob: null
        };
        
        // Clear job selection
        currentSelectedJobId = null;
        currentSelectedJobCriteria = null;

    // Update UI to reflect reset
    const salaryRange = document.getElementById('salaryRange');
    const mobileSalaryRange = document.getElementById('mobileSalaryRange');
    const maxSalary = document.getElementById('maxSalary');
    const mobileMaxSalary = document.getElementById('mobileMaxSalary');

    if (salaryRange) salaryRange.value = 100000;
    if (mobileSalaryRange) mobileSalaryRange.value = 100000;
    if (maxSalary) maxSalary.textContent = '$100k+';
    if (mobileMaxSalary) mobileMaxSalary.textContent = '$100k+';

    // Reset checkboxes - only try to reset elements that exist
    const checkboxes = [
        'exp-mid', 'exp-senior', 'mobile-exp-mid', 'mobile-exp-senior',
        'edu-bachelor', 'mobile-edu-bachelor'
    ];

    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.checked = id === 'exp-mid' || id === 'mobile-exp-mid' ||
                id === 'edu-bachelor' || id === 'mobile-edu-bachelor';
        }
    });

    // Reset chips - only try to reset elements that exist
    const chipElements = [
        'work-type-remote-btn', '.job-type-btn[data-value="fulltime"]',
        '.mobile-work-type-btn[data-value="remote"]',
        '.mobile-job-type-btn[data-value="fulltime"]'
    ];

    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });

    chipElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('active');
        }
    });

    // Reset job dropdown
    const dropdownBtn = document.getElementById('jobDropdownBtn');
    if (dropdownBtn) {
        const textSpan = dropdownBtn.querySelector('#selectedJobTitle');
        if (textSpan) {
            textSpan.textContent = 'Select Job';
        }
        dropdownBtn.classList.remove('job-selected', 'border-blue-500', 'bg-blue-50');
        dropdownBtn.classList.add('border-gray-200');
        
        // Clear dropdown items visual state
        document.querySelectorAll('.job-dropdown-item').forEach(item => {
            item.classList.remove('bg-blue-50', 'border-l-4', 'border-blue-500');
        });
    }

    // Re-render multi-select tags
    const tagContainers = [
        'selectedSkills', 'selectedLocations',
        'mobileSelectedSkills', 'mobileSelectedLocations'
    ];

    tagContainers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = '';
        }
    });

    // Re-render default tags
    const renderTags = (containerId, values) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        values.forEach(value => {
            const tag = document.createElement('div');
            tag.className = 'multiselect-tag';
            tag.innerHTML = `
                ${value}
                <span class="multiselect-tag-remove" data-value="${value}">&times;</span>
            `;
            container.appendChild(tag);
        });
    };

    renderTags('selectedSkills', currentFilters.skills);
    renderTags('mobileSelectedSkills', currentFilters.skills);
    renderTags('selectedLocations', currentFilters.locations);
    renderTags('mobileSelectedLocations', currentFilters.locations);

    // Re-add event listeners
    document.querySelectorAll('.multiselect-tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const valueToRemove = e.target.getAttribute('data-value');
            const type = e.target.closest('#selectedSkills, #mobileSelectedSkills') ? 'skills' : 'locations';
            currentFilters[type] = currentFilters[type].filter(item => item !== valueToRemove);

            // Remove from both desktop and mobile views
            document.querySelectorAll(`.multiselect-tag-remove[data-value="${valueToRemove}"]`).forEach(el => {
                el.closest('.multiselect-tag').remove();
            });

            renderAppliedFilters();
        });
    });

    renderAppliedFilters();
    
    // Apply filters to update results
    applyAllFilters().then(() => {
        // Restore scroll position after filters are applied
        window.scrollTo(0, scrollPosition);
        // Resolve the promise
        resolve();
    });
    });
}

// Set up mobile filter sidebar
function setupMobileFilters() {
    if (mobileFilterToggle && closeMobileFilters && sidebarOverlay) {
        mobileFilterToggle.addEventListener('click', () => {
            syncFiltersToMobile(); // Sync filters before opening
            openMobileSidebar();
        });
        closeMobileFilters.addEventListener('click', closeMobileSidebar);
        sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }
}

// Synchronize filters between desktop and mobile views
function syncFiltersToMobile() {
    try {
        // Sync skills
        const desktopSkills = document.getElementById('selectedSkills');
        const mobileSkills = document.getElementById('mobileSelectedSkills');
        if (desktopSkills && mobileSkills) {
            mobileSkills.innerHTML = desktopSkills.innerHTML;
        }

        // Sync locations
        const desktopLocations = document.getElementById('selectedLocations');
        const mobileLocations = document.getElementById('mobileSelectedLocations');
        if (desktopLocations && mobileLocations) {
            mobileLocations.innerHTML = desktopLocations.innerHTML;
        }

        // Sync salary range
        const desktopSalaryRange = document.getElementById('salaryRange');
        const mobileSalaryRange = document.getElementById('mobileSalaryRange');
        if (desktopSalaryRange && mobileSalaryRange) {
            mobileSalaryRange.value = desktopSalaryRange.value;
            // Update mobile salary display
            const mobileMaxSalary = document.getElementById('mobileMaxSalary');
            if (mobileMaxSalary) {
                const value = parseInt(desktopSalaryRange.value);
                mobileMaxSalary.textContent = value >= 200000 ? `$${value / 1000}k+` : `$${value / 1000}k`;
            }
        }

        // Sync filter chips (work type, job type, experience, education)
        syncFilterChips();

        console.log('Filters synchronized to mobile view');
    } catch (error) {
        console.error('Error synchronizing filters to mobile:', error);
    }
}

function syncFiltersFromMobile() {
    try {
        // Sync skills
        const mobileSkills = document.getElementById('mobileSelectedSkills');
        const desktopSkills = document.getElementById('selectedSkills');
        if (mobileSkills && desktopSkills) {
            desktopSkills.innerHTML = mobileSkills.innerHTML;
        }

        // Sync locations
        const mobileLocations = document.getElementById('mobileSelectedLocations');
        const desktopLocations = document.getElementById('selectedLocations');
        if (mobileLocations && desktopLocations) {
            desktopLocations.innerHTML = mobileLocations.innerHTML;
        }

        // Sync salary range
        const mobileSalaryRange = document.getElementById('mobileSalaryRange');
        const desktopSalaryRange = document.getElementById('salaryRange');
        if (mobileSalaryRange && desktopSalaryRange) {
            desktopSalaryRange.value = mobileSalaryRange.value;
            // Update desktop salary display
            const maxSalary = document.getElementById('maxSalary');
            if (maxSalary) {
                const value = parseInt(mobileSalaryRange.value);
                maxSalary.textContent = value >= 200000 ? `$${value / 1000}k+` : `$${value / 1000}k`;
            }
        }

        // Sync filter chips
        syncFilterChips();

        console.log('Filters synchronized from mobile view');
    } catch (error) {
        console.error('Error synchronizing filters from mobile:', error);
    }
}

function syncFilterChips() {
    // Sync active filter chips between desktop and mobile
    const filterChipSelectors = [
        '[data-value="remote"]',
        '[data-value="hybrid"]',
        '[data-value="office"]',
        '[data-value="fulltime"]',
        '[data-value="parttime"]',
        '[data-value="contract"]',
        '[data-value="internship"]'
    ];

    filterChipSelectors.forEach(selector => {
        const desktopChip = document.querySelector(`.filters-container ${selector}`);
        const mobileChip = document.querySelector(`.filters-sidebar ${selector}`);

        if (desktopChip && mobileChip) {
            // Sync active state
            if (desktopChip.classList.contains('active')) {
                mobileChip.classList.add('active');
            } else {
                mobileChip.classList.remove('active');
            }
        }
    });

    // Sync checkboxes (experience and education)
    const checkboxes = [
        'exp-entry', 'exp-mid', 'exp-senior', 'exp-exec',
        'edu-highschool', 'edu-associate', 'edu-bachelor', 'edu-master', 'edu-phd'
    ];

    checkboxes.forEach(id => {
        const desktopCheckbox = document.getElementById(id);
        const mobileCheckbox = document.getElementById(`mobile-${id}`);

        if (desktopCheckbox && mobileCheckbox) {
            mobileCheckbox.checked = desktopCheckbox.checked;
        }
    });
}

function openMobileSidebar() {
    filtersSidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
    filtersSidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Set up modal interactions
function setupModals() {


    // Contact buttons
    contactBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            resumeModal.classList.add('hidden');
            contactModal.classList.remove('hidden');
        });
    });

    // Contact from resume modal
    contactCandidate.addEventListener('click', () => {
        const resumeId = contactCandidate.getAttribute('data-resume-id');
        const userId = contactCandidate.getAttribute('data-user-id');
        console.log('Contacting from modal - Resume ID:', resumeId, 'User ID:', userId);
        resumeModal.classList.add('hidden');
        contactModal.classList.remove('hidden');
    });

    // Close resume modal
    closeResumeModal.addEventListener('click', () => {
        resumeModal.classList.add('hidden');
    });

    // Close contact modal
    closeContactModal.addEventListener('click', () => {
        contactModal.classList.add('hidden');
    });

    // Download resume
    downloadResume.addEventListener('click', async () => {
        const resumeId = downloadResume.getAttribute('data-resume-id');
        if (!resumeId) {
            showToast('No resume selected for download', 'error');
            return;
        }

        try {
            // Show loading state
            const originalText = downloadResume.innerHTML;
            downloadResume.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Generating PDF...';
            downloadResume.disabled = true;

            await generateAndDownloadPDF(resumeId);

            // Restore button state
            downloadResume.innerHTML = originalText;
            downloadResume.disabled = false;
            
            showToast('Resume downloaded successfully!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            
            // Provide specific error messages
            let errorMessage = 'Failed to download resume. Please try again.';
            if (error.message.includes('PDF generation library not loaded')) {
                errorMessage = 'PDF generation is temporarily unavailable. Please try refreshing the page.';
            } else if (error.message.includes('No resume content available')) {
                errorMessage = 'No resume content available to download.';
            }
            
            showToast(errorMessage, 'error');
            
            // Restore button state
            downloadResume.innerHTML = originalText;
            downloadResume.disabled = false;
        }
    });

    // Save candidate
    saveCandidate.addEventListener('click', () => {
        resumeModal.classList.add('hidden');
        saveSuccessModal.classList.remove('hidden');
    });


    async function handleConversation() {
        // metadat for the contact modal
        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const message = document.getElementById('contactMessage').value;
        const jobOpportunity = document.getElementById('jobOpportunity').value;
        const resumeId = contactCandidate.getAttribute('data-resume-id');
        const userId = contactCandidate.getAttribute('data-user-id');


        console.log('Sending message with resumeId:', resumeId, 'userId:', userId);
        const messageData = {
            resumeId: resumeId,
            userId: userId,
            name: name,
            email: email,
            message: message,
            jobOpportunity: jobOpportunity,
        }

        try {
            const response = await fetch('/search/message', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(messageData),
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const result = await response.json();
            console.log('Message sent successfully:', result);

        } catch (error) {
            console.error('Error sending message data', error);
            alert('Error sending message. Please try again later.');
        }
    }

    // Send message
    sendMessage.addEventListener('click', async () => {
        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const message = document.getElementById('contactMessage').value;
        console.log('Send message clicked', name, email, message);
        if (!name || !email || !message) {
            alert('Please fill in all required fields');
            return;
        }
        // handle sending message data
        try {
            await handleConversation();
            // Close modals on success
            contactModal.classList.add('hidden');
            messageSuccessModal.classList.remove('hidden');
        } catch (error) {
            alert(error.message || 'Error sending message. Please try again later.');
        }
    });

    // Close success modals
    messageSuccessOk.addEventListener('click', () => {
        messageSuccessModal.classList.add('hidden');
    });

    saveSuccessOk.addEventListener('click', () => {
        saveSuccessModal.classList.add('hidden');
    });

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === resumeModal) {
            resumeModal.classList.add('hidden');
        }
        if (event.target === contactModal) {
            contactModal.classList.add('hidden');
        }
        if (event.target === messageSuccessModal) {
            messageSuccessModal.classList.add('hidden');
        }
        if (event.target === saveSuccessModal) {
            saveSuccessModal.classList.add('hidden');
        }
    });
}

// new specific function for resume modal setup
function setupResumeModal() {
    // View resume buttons  use event delegation 
    // for dynamically added elements
    document.addEventListener('click', function (e) {
        if (e.target.closest('.view-resume-btn')) {
            const btn = e.target.closest('.view-resume-btn');
            const resumeId = btn.getAttribute('data-resume-id');
            const userId = btn.getAttribute('data-user-id');

            // Enhanced JSON parsing with error handling
            let resumeData;
            try {
                const rawData = btn.getAttribute('data-full-resume');
                if (!rawData) {
                    throw new Error('No resume data found in data-full-resume attribute');
                }

                console.log('Parsing resume data for candidate ID:', resumeId);
                const candidateData = parseJsonFromAttribute(rawData);

                // Validate required fields
                if (!candidateData || typeof candidateData !== 'object') {
                    throw new Error('Invalid candidate data structure');
                }

                // Extract fullResumeData from candidate object
                resumeData = candidateData.fullResumeData || candidateData;



                // Validate that we have the correct resume data structure
                if (!resumeData || typeof resumeData !== 'object') {
                    throw new Error('Invalid resume data structure after extraction');
                }



            } catch (error) {
                console.error('Error parsing resume data for candidate:', resumeId, error);

                // Show user-friendly error message
                alert('Unable to load resume data. Please try refreshing the page.');
                return;
            }

            if (contactCandidate) {
                contactCandidate.setAttribute('data-resume-id', resumeId);
                contactCandidate.setAttribute('data-user-id', userId);
            }

            // populating the modal with specific candidates data
            populateResumeModal(resumeData, resumeId, userId);

            // show the modal
            resumeModal.classList.remove('hidden')
        }
        if (e.target.closest('.contact-btn')) {
            const btn = e.target.closest('.contact-btn');
            const resumeId = btn.getAttribute('data-resume-id');
            const userId = btn.getAttribute('data-user-id');
            // Set the resume ID for contact button

            if (contactCandidate) {

                contactCandidate.setAttribute('data-resume-id', resumeId);
                contactCandidate.setAttribute('data-user-id', userId);
                console.log('Contact button clicked for resume user ID:', userId);
            }
            // show the contact modal
            resumeModal.classList.add('hidden');
            contactModal.classList.remove('hidden');




        }
    });

    closeResumeModal.addEventListener('click', function () {
        resumeModal.classList.add('hidden');
    });


    // Close when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === resumeModal) {
            resumeModal.classList.add('hidden');
        }
    });


    function populateResumeModal(resumeData, resumeId, userId) {

        // Store resume data globally for PDF generation
        currentResumeDataForPDF = resumeData;

        // Ensure resumeData exists and has basic structure
        if (!resumeData || typeof resumeData !== 'object') {
            console.error('No valid resume data provided:', resumeData);

            // Show error in modal
            const resumeContent = document.getElementById('resumeContent');
            if (resumeContent) {
                resumeContent.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Unable to Load Resume</h3>
                        <p class="text-gray-600">The resume data could not be loaded. Please try refreshing the page.</p>
                    </div>
                `;
            }
            return;
        }

        // Validate and set required fields with fallbacks
        const candidateName = resumeData.name || resumeData.fullName || 'Unknown Candidate';
        const candidateTitle = resumeData.title || resumeData.currentTitle || 'Not specified';
        const candidateEmail = resumeData.email || resumeData.contactInfo?.email || '';
        const candidatePhone = resumeData.phone || resumeData.contactInfo?.phone || '';
        const candidateLocation = resumeData.location || resumeData.address || '';
        const candidateSummary = resumeData.summary || resumeData.professionalSummary || 'No summary available';

        // update modal title with candidate name
        const resumeNameElement = document.getElementById('resumeName');
        if (resumeNameElement) {
            resumeNameElement.textContent = `${candidateName}'s Resume`;
        }

        // Update the contact/download/save buttons with the resume ID and handle role-based access
        const contactBtn = document.getElementById('contactCandidate');
        const downloadBtn = document.getElementById('downloadResume');
        const saveBtn = document.getElementById('saveCandidate');

        // Get current user role for access control
        const currentUser = getCurrentUser();
        const userRole = currentUser?.role || currentUser?.type;

        if (downloadBtn) downloadBtn.setAttribute('data-resume-id', resumeId);
        if (saveBtn) saveBtn.setAttribute('data-resume-id', resumeId);

        // Hide buttons for engineer role users
        if (userRole === 'engineer') {
            if (contactBtn) {
                contactBtn.style.display = 'none';
                console.log('Hidden contact button for engineer user');
            }
            if (saveBtn) {
                saveBtn.style.display = 'none';
                console.log('Hidden save button for engineer user');
            }
            if (downloadBtn) {
                downloadBtn.style.display = 'none';
                console.log('Hidden download button for engineer user');
            }
        } else {
            // Show buttons for employer users
            if (contactBtn) contactBtn.style.display = '';
            if (saveBtn) saveBtn.style.display = '';
            if (downloadBtn) downloadBtn.style.display = '';
        }

        const resumeContent = document.getElementById('resumeContent');
        if (!resumeContent) {
            console.error('Resume content element not found');
            return;
        }



        // Safely handle potentially undefined properties with comprehensive fallbacks using utility function
        const skills = ensureArray(resumeData.skills).length > 0 ? ensureArray(resumeData.skills) :
                      ensureArray(resumeData.technicalSkills);

        // Fix experience handling using utility function
        const experience = ensureArray(resumeData.experience).length > 0 ? ensureArray(resumeData.experience) :
                          ensureArray(resumeData.workExperience);



        // Fix education handling using utility function
        let educationDisplay = null;
        const educationArray = ensureArray(resumeData.education).length > 0 ? ensureArray(resumeData.education) :
                              ensureArray(resumeData.educationDetails);

        if (educationArray.length > 0) {
            educationDisplay = educationArray[0]; // Take first education entry
        }




        // Update the contact/download/save buttons with both IDs
        // if (contactCandidate) {
        //     console.log(contactCandidate);

        // }

        // Generate safe HTML content with proper escaping
        resumeContent.innerHTML = `
        <div class="flex justify-between items-start mb-6">
            <div>
                <h1 class="text-2xl font-bold">${escapeHtml(candidateName)}</h1>
                <p class="text-gray-600">${escapeHtml(candidateTitle)}</p>
            </div>
            <div class="text-sm text-gray-500">
                ${candidateEmail ? `<p><i class="fas fa-envelope mr-1"></i> ${escapeHtml(candidateEmail)}</p>` : ''}
                ${candidatePhone ? `<p><i class="fas fa-phone mr-1"></i> ${escapeHtml(candidatePhone)}</p>` : ''}
                ${candidateLocation ? `<p><i class="fas fa-map-marker-alt mr-1"></i> ${escapeHtml(candidateLocation)}</p>` : ''}
            </div>
        </div>

        <div class="mb-6">
            <h2 class="text-xl font-semibold border-b pb-1 mb-2">Summary</h2>
            <p>${escapeHtml(candidateSummary)}</p>
        </div>

        <div class="mb-6">
            <h2 class="text-xl font-semibold border-b pb-1 mb-2">Skills</h2>
            <div class="flex flex-wrap gap-2">
                ${skills.length ? skills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('') : '<span class="text-gray-500 italic">No skills listed</span>'}
            </div>
        </div>

        <div class="mb-6">
            <h2 class="text-xl font-semibold border-b pb-1 mb-2">Experience</h2>
            ${experience.length ? experience.map(exp => {
                // Safely handle experience description
                let descriptionHtml = '';
                if (exp.description) {
                    if (Array.isArray(exp.description)) {
                        descriptionHtml = `
                            <ul class="list-disc pl-5 mt-2 space-y-1">
                                ${exp.description.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                            </ul>
                        `;
                    } else if (typeof exp.description === 'string') {
                        descriptionHtml = `<p class="mt-2">${escapeHtml(exp.description)}</p>`;
                    }
                }

                return `
                    <div class="mb-4">
                        <div class="flex justify-between">
                            <h3 class="font-semibold">${escapeHtml(exp.title || exp.position || 'Not specified')}</h3>
                            <p class="text-gray-600">${escapeHtml(exp.startDate || '')} ${exp.endDate ? `- ${escapeHtml(exp.endDate)}` : '- Present'}</p>
                        </div>
                        ${exp.company ? `<p class="text-gray-600">${escapeHtml(exp.company)}${exp.location ? `, ${escapeHtml(exp.location)}` : ''}</p>` : ''}
                        ${descriptionHtml}
                    </div>
                `;
            }).join('') : '<p class="text-gray-500 italic">No experience listed</p>'}
        </div>

        <div class="mb-6">
            <h2 class="text-xl font-semibold border-b pb-1 mb-2">Education</h2>
            ${educationDisplay ? `
                <div class="flex justify-between">
                    <h3 class="font-semibold">${escapeHtml(educationDisplay.institution || educationDisplay.school || 'Institution not specified')}</h3>
                    <p class="text-gray-600">${escapeHtml(educationDisplay.startYear || '')} ${educationDisplay.endYear ? `- ${escapeHtml(educationDisplay.endYear)}` : ''}</p>
                </div>
                ${educationDisplay.degree ? `<p class="text-gray-600">${escapeHtml(educationDisplay.degree)}${(educationDisplay.field && typeof educationDisplay.field === 'string') ? ` in ${escapeHtml(educationDisplay.field)}` : ''}</p>` : ''}
                ${educationDisplay.gpa ? `<p class="text-sm text-gray-500">GPA: ${escapeHtml(educationDisplay.gpa)}</p>` : ''}
            ` : '<p class="text-gray-500 italic">No education information available</p>'}
        </div>

        ${(() => {
            // Process projects data using utility function
            const projects = ensureArray(resumeData.projects);



            if (projects.length > 0) {
                return `
                <div class="mb-6">
                    <h2 class="text-xl font-semibold border-b pb-1 mb-2">Projects</h2>
                    ${projects.map(project => `
                        <div class="mb-4">
                            <div class="flex justify-between items-start">
                                <h3 class="font-semibold">${escapeHtml(project.title || project.name || 'Untitled Project')}</h3>
                                ${project.url ? `<a href="${escapeHtml(project.url)}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm"><i class="fas fa-external-link-alt"></i></a>` : ''}
                            </div>
                            ${project.technologies ? `<p class="text-sm text-gray-600 mb-2">Technologies: ${escapeHtml(project.technologies)}</p>` : ''}
                            ${project.description ? `<p class="text-gray-700">${escapeHtml(Array.isArray(project.description) ? project.description.join(' ') : project.description)}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                `;
            } else {
                return '';
            }
        })()}
    `;

    }

}

// Job modal filter state - completely separate from main filters
let jobModalFilters = {
    requiredSkills: [],
    requiredLocations: [],
    requiredExperience: ["mid"],
    requiredWorkType: ["remote"],
    requiredJobType: ["fulltime"],
    requiredSalary: [0, 100000],
    requiredEducation: ["bachelor"],
    requiredAvailability: "1 month"
};

// Update modal stepper visual state
function updateModalStepper(currentStep) {
    const stepper = document.querySelector('.modal-stepper');
    if (!stepper) return;

    const steps = stepper.querySelectorAll('.step');
    const bars = stepper.querySelectorAll('.bar');

    steps.forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        const stepIndex = index + 1;
        if (stepIndex < currentStep) {
            stepEl.classList.add('completed');
        } else if (stepIndex === currentStep) {
            stepEl.classList.add('active');
        }
    });

    bars.forEach((barEl, index) => {
        // Activate bars before the current step
        if (index < currentStep - 1) {
            barEl.classList.add('active');
        } else {
            barEl.classList.remove('active');
        }
    });
}

function showFilterModal1() {
    filterModal3.classList.add('hidden');
    filterModal1.classList.remove('hidden');
    updateModalStepper(1);
}

// Initialize Create Job Modal
function initCreateJobModal() {


    // Toggle modal
    createJobBtn.addEventListener('click', function () {
        createJobModal.classList.toggle('hidden');
        document.body.classList.toggle('overflow-hidden');
        filterModal3.classList.add('hidden');
        filterModal2.classList.add('hidden');
        filterModal1.classList.remove('hidden');
        updateModalStepper(1);
    });

    // Close modal
    function closeModal() {
        createJobModal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        resetJobModalFilters();
    }

    // Reset job modal filters to prevent interference with main search
    function resetJobModalFilters() {
        // Reset job modal filter state
        jobModalFilters = {
            requiredSkills: [],
            requiredLocations: [],
            requiredExperience: ["mid"],
            requiredWorkType: ["remote"],
            requiredJobType: ["fulltime"],
            requiredSalary: [0, 100000],
            requiredEducation: ["bachelor"],
            requiredAvailability: "1 month"
        };

        // Clear form inputs
        const jobTitle = document.getElementById('jobTitle');
        const jobDescription = document.getElementById('jobDescription');
        if (jobTitle) jobTitle.value = '';
        if (jobDescription) jobDescription.value = '';

        // Clear selected skills and locations
        if (jobSelectedSkills) jobSelectedSkills.innerHTML = '';
        if (jobSelectedLocations) jobSelectedLocations.innerHTML = '';

        // Reset checkboxes in job modal
        document.querySelectorAll('#createJobModal input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Set default checkboxes
        const defaultExpCheckbox = document.getElementById('job-exp-mid');
        const defaultEduCheckbox = document.getElementById('job-edu-bachelor');
        if (defaultExpCheckbox) defaultExpCheckbox.checked = true;
        if (defaultEduCheckbox) defaultEduCheckbox.checked = true;

        // Reset filter chips in job modal
        document.querySelectorAll('#createJobModal .filter-chip').forEach(chip => {
            chip.classList.remove('active');
        });

        // Set default active chips
        const defaultRemoteChip = document.querySelector('#createJobModal .filter-chip[data-value="remote"]');
        const defaultFulltimeChip = document.querySelector('#createJobModal .filter-chip[data-value="fulltime"]');
        const defaultAvailabilityChip = document.querySelector('#createJobModal .filter-chip[data-value="1 month"]');
        
        if (defaultRemoteChip) defaultRemoteChip.classList.add('active');
        if (defaultFulltimeChip) defaultFulltimeChip.classList.add('active');
        if (defaultAvailabilityChip) defaultAvailabilityChip.classList.add('active');

        // Reset salary range in job modal
        const jobSalaryRange = document.getElementById('jobSalaryRange');
        const jobMinSalary = document.getElementById('jobMinSalary');
        const jobMaxSalary = document.getElementById('jobMaxSalary');
        
        if (jobSalaryRange) jobSalaryRange.value = 100000;
        if (jobMinSalary) jobMinSalary.textContent = '$0';
        if (jobMaxSalary) jobMaxSalary.textContent = '$100,000+';

        // Reset modal steps
        filterModal3.classList.add('hidden');
        filterModal2.classList.add('hidden');
        filterModal1.classList.remove('hidden');
        updateModalStepper(1);
    }

    closeJobModal.addEventListener('click', closeModal);
    cancelJobPost.addEventListener('click', closeModal);

    // Close when clicking outside
    createJobModal.addEventListener('click', function (event) {
        if (event.target === createJobModal) {
            closeModal();
        }
    });

    // Helper function to add selected skills
    function addSelectedSkill(skill, container) {
        if (container.querySelector(`[data-skill="${skill}"]`)) return;

        const tag = document.createElement('div');
        tag.className = 'multiselect-tag';
        tag.dataset.skill = skill;
        tag.innerHTML = `
            ${skill}
            <span class="multiselect-tag-remove" data-skill="${skill}">
                &times;
            </span>
        `;
        container.appendChild(tag);

        // Add remove functionality
        tag.querySelector('.multiselect-tag-remove').addEventListener('click', function (e) {
            e.stopPropagation();
            jobModalFilters.requiredSkills = jobModalFilters.requiredSkills.filter(s => s !== skill);
            tag.remove();
        });
    }

    // Helper function to add selected locations
    function addSelectedLocation(location, container) {
        if (container.querySelector(`[data-location="${location}"]`)) return;

        const tag = document.createElement('div');
        tag.className = 'multiselect-tag';
        tag.dataset.location = location;
        tag.innerHTML = `
            ${location}
            <span class="multiselect-tag-remove" data-location="${location}">
                &times;
            </span>
        `;
        container.appendChild(tag);

        // Add remove functionality
        tag.querySelector('.multiselect-tag-remove').addEventListener('click', function (e) {
            e.stopPropagation();
            jobModalFilters.requiredLocations = jobModalFilters.requiredLocations.filter(l => l !== location);
            tag.remove();
        });
    }

    // Initialize skills multiselect for job modal
    jobSkillsSearch.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        jobSkillsOptions.innerHTML = '';

        if (searchTerm.length > 1) {
            const filteredSkills = skills.filter(skill =>
                skill.toLowerCase().includes(searchTerm) &&
                !jobModalFilters.requiredSkills.includes(skill));

            if (filteredSkills.length > 0) {
                filteredSkills.forEach(skill => {
                    const option = document.createElement('div');
                    option.className = 'multiselect-option';
                    option.textContent = skill;
                    option.addEventListener('click', function () {
                        addSelectedSkill(skill, jobSelectedSkills);
                        jobModalFilters.requiredSkills.push(skill);
                        jobSkillsOptions.classList.remove('show');
                        jobSkillsSearch.value = '';
                    });
                    jobSkillsOptions.appendChild(option);
                });
                jobSkillsOptions.classList.add('show');
            } else {
                jobSkillsOptions.classList.remove('show');
            }
        } else {
            jobSkillsOptions.classList.remove('show');
        }
    });

    // Initialize location multiselect for job modal
    jobLocationSearch.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        jobLocationOptions.innerHTML = '';

        if (searchTerm.length > 1) {
            const filteredLocations = locations.filter(location =>
                location.toLowerCase().includes(searchTerm) &&
                !jobModalFilters.requiredLocations.includes(location));

            if (filteredLocations.length > 0) {
                filteredLocations.forEach(location => {
                    const option = document.createElement('div');
                    option.className = 'multiselect-option';
                    option.textContent = location;
                    option.addEventListener('click', function () {
                        addSelectedLocation(location, jobSelectedLocations);
                        jobModalFilters.requiredLocations.push(location);
                        jobLocationOptions.classList.remove('show');
                        jobLocationSearch.value = '';
                    });
                    jobLocationOptions.appendChild(option);
                });
                jobLocationOptions.classList.add('show');
            } else {
                jobLocationOptions.classList.remove('show');
            }
        } else {
            jobLocationOptions.classList.remove('show');
        }
    });

    // Initialize experience checkboxes for job modal
    document.querySelectorAll('#createJobModal input[type="checkbox"][id^="job-exp-"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const value = this.id.replace('job-exp-', '');

            if (this.checked) {
                if (!jobModalFilters.requiredExperience.includes(value)) {
                    jobModalFilters.requiredExperience.push(value);
                }
            } else {
                jobModalFilters.requiredExperience = jobModalFilters.requiredExperience.filter(item => item !== value);
            }
        });
    });

    // Initialize work type filter chips in job modal
    document.querySelectorAll('#createJobModal .filter-chip[data-value="remote"], #createJobModal .filter-chip[data-value="hybrid"], #createJobModal .filter-chip[data-value="office"]').forEach(chip => {
        chip.addEventListener('click', function () {
            const parent = this.parentElement;
            parent.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            jobModalFilters.requiredWorkType = [this.dataset.value];
        });
    });

    // Initialize job type filter chips in job modal
    document.querySelectorAll('#createJobModal .filter-chip[data-value="fulltime"], #createJobModal .filter-chip[data-value="parttime"], #createJobModal .filter-chip[data-value="contract"], #createJobModal .filter-chip[data-value="internship"]').forEach(chip => {
        chip.addEventListener('click', function () {
            const parent = this.parentElement;
            parent.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            jobModalFilters.requiredJobType = [this.dataset.value];
        });
    });

    // Initialize education checkboxes for job modal
    document.querySelectorAll('#createJobModal input[type="checkbox"][id^="job-edu-"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const value = this.id.replace('job-edu-', '');

            if (this.checked) {
                if (!jobModalFilters.requiredEducation.includes(value)) {
                    jobModalFilters.requiredEducation.push(value);
                }
            } else {
                jobModalFilters.requiredEducation = jobModalFilters.requiredEducation.filter(item => item !== value);
            }
        });
    });


    // Availability chips in modal
    const availabilityChips = createJobModal.querySelectorAll('.filter-chip[data-value="immediate"], .filter-chip[data-value="15 days"], .filter-chip[data-value="1 month"]');
    availabilityChips.forEach(chip => {
        chip.addEventListener('click', function () {
            const parent = this.closest('.flex.flex-wrap.gap-2');
            if (parent) {
                parent.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                jobModalFilters.requiredAvailability = this.dataset.value;
            } else {
                console.warn('Parent container for availability chips not found');
                this.classList.add('active');
                jobModalFilters.requiredAvailability = this.dataset.value;
            }
        });
    });

    const jobSalaryRange = document.getElementById('jobSalaryRange');
    const jobMinSalary = document.getElementById('jobMinSalary');
    const jobMaxSalary = document.getElementById('jobMaxSalary');

    // Salary range slider for job modal
    jobSalaryRange.addEventListener('input', function () {
        const minSalary = 0;
        const maxSalary = parseInt(this.value);
        jobModalFilters.requiredSalary = [minSalary, maxSalary];
        jobMinSalary.textContent = `$${minSalary.toLocaleString()}`;
        jobMaxSalary.textContent = `$${maxSalary.toLocaleString()}+`;

        console.log('Updated job salary range:', jobModalFilters.requiredSalary);
    });

    // Enhanced step navigation with validation
    nextToStep2Btn.addEventListener('click', function() {
        if (validateStep1()) {
            showFilterModal2();
        }
    });

    nextToStep3Btn.addEventListener('click', function() {
        if (validateStep2()) {
            showfilterModal3();
        }
    });

    backToStep1Btn.addEventListener('click', function() {
        hideFilterModal2();
    });

    backToStep2Btn.addEventListener('click', function() {
        hideFilterModal3();
    });

    // Enhanced save job post with final validation
    saveJobPost.addEventListener('click', async function () {
        if (!validateStep3()) {
            return;
        }

        const jobTitle = document.getElementById('jobTitle').value.trim();
        const jobDescription = document.getElementById('jobDescription').value.trim();

        console.log('Job Post:', {
            title: jobTitle,
            description: jobDescription,
            candidateFilters: jobModalFilters,
            updatedFilters: currentFilters
        });

        // Show loading state
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating Job...';
        this.disabled = true;

        try {
            const newJob = await handleCreateNewJob(jobTitle, jobDescription);
            updateJobDropdown(newJob);
            showToast('Job post created successfully!', 'success');
            closeModal();
        } catch (error) {
            console.error('Job creation error:', error);
            showToast('Failed to create job post. Please try again.', 'error');
        } finally {
            // Restore button state
            this.innerHTML = originalText;
            this.disabled = false;
        }

        // Clear form
        // setTimeout(() => {
        //     document.getElementById('jobTitle').value = '';
        //     document.getElementById('jobDescription').value = '';
        //     jobSelectedSkills.innerHTML = '';
        //     jobSelectedLocations.innerHTML = '';

        //     // Reset modal filters to defaults
        //     jobModalFilters.requiredSkills = [];
        //     jobModalFilters.requiredLocations = [];
        //     jobModalFilters.requiredExperience = ["mid"];
        //     jobModalFilters.requiredWorkType = ["remote"];
        //     jobModalFilters.requiredJobType = ["fulltime"];
        //     jobModalFilters.requiredSalaryRange = [0, 100000];
        //     jobModalFilters.requiredEducation = ["bachelor"];
        //     jobModalFilters.requiredAvailability = "1month";

        //     // Reset checkboxes and chips
        //     document.querySelectorAll('#createJobModal input[type="checkbox"]').forEach(checkbox => {
        //         checkbox.checked = false;
        //     });
        //     document.getElementById('job-exp-mid').checked = true;
        //     document.getElementById('job-edu-bachelor').checked = true;

        //     document.querySelectorAll('#createJobModal .filter-chip').forEach(chip => {
        //         chip.classList.remove('active');
        //     });
        //     document.querySelector('#createJobModal .filter-chip[data-value="remote"]').classList.add('active');
        //     document.querySelector('#createJobModal .filter-chip[data-value="fulltime"]').classList.add('active');
        //     document.querySelector('#createJobModal .filter-chip[data-value="1month"]').classList.add('active');

        //     // Reset salary range display
        //     jobSalaryRange.value = 100000;
        //     jobMinSalary.textContent = '$0';
        //     jobMaxSalary.textContent = '$100k+';
        // },5000)

    });
}

async function handleCreateNewJob(jobTitle, jobDescription) {
    try {
        const filterData = {
            jobTitle: jobTitle,
            jobDescription: jobDescription,
            requiredSkills: jobModalFilters.requiredSkills,
            requiredLocations: jobModalFilters.requiredLocations,
            requiredAvailability: jobModalFilters.requiredAvailability,
            requiredJobType: jobModalFilters.requiredJobType,
            requiredEducation: jobModalFilters.requiredEducation,
            requiredExperience: jobModalFilters.requiredExperience,
            requiredWorkType: jobModalFilters.requiredWorkType,
            requiredSalary: jobModalFilters.requiredSalary || [0, 10000]
        }

        console.log('Sending filterData', filterData);

        const response = await fetch('/search/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filterData)
        })

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.message || 'saveJob upload data failed');
        }

        return responseData.newJob;
    } catch (error) {
        console.error('Upload error detail')
    }
}




function showFilterModal2() {
    filterModal1.classList.add('hidden');
    filterModal2.classList.remove('hidden');
    updateModalStepper(2);
}

function showfilterModal3() {
    filterModal2.classList.add('hidden');
    filterModal3.classList.remove('hidden');
    updateModalStepper(3);
}

function hideFilterModal3() {
    filterModal3.classList.add('hidden');
    filterModal2.classList.remove('hidden');
    updateModalStepper(2);
}

function hideFilterModal2() {
    filterModal2.classList.add('hidden');
    filterModal1.classList.remove('hidden');
    updateModalStepper(1);
}


// Enhanced step navigation with validation (these are handled in initCreateJobModal now)
// nextToStep2Btn.addEventListener('click', showFilterModal2);
// nextToStep3Btn.addEventListener('click', showfilterModal3);
// backToStep1Btn.addEventListener('click', hideFilterModal2);
// backToStep2Btn.addEventListener('click', hideFilterModal3)

// Step validation functions
function validateStep1() {
    const jobTitle = document.getElementById('jobTitle').value.trim();
    const jobDescription = document.getElementById('jobDescription').value.trim();

    // Clear previous errors
    clearValidationErrors();

    let isValid = true;

    // Job Title validation (min 3 chars)
    if (!jobTitle || jobTitle.length < 3) {
        showValidationError('jobTitle', 'Job title must be at least 3 characters long');
        isValid = false;
    }

    // Job Description validation (min 10 chars)
    if (!jobDescription || jobDescription.length < 10) {
        showValidationError('jobDescription', 'Job description must be at least 10 characters long');
        isValid = false;
    }

    if (!isValid) {
        showToast('Please fix the errors before proceeding', 'error');
    }

    return isValid;
}

function validateStep2() {
    // Clear previous errors
    clearValidationErrors();

    let isValid = true;

    // Skills validation (at least one skill required)
    if (!jobModalFilters.requiredSkills || jobModalFilters.requiredSkills.length === 0) {
        showValidationError('jobSkillsSearch', 'At least one skill is required');
        isValid = false;
    }

    // Location validation (at least one location required)
    if (!jobModalFilters.requiredLocations || jobModalFilters.requiredLocations.length === 0) {
        showValidationError('jobLocationSearch', 'At least one location is required');
        isValid = false;
    }

    if (!isValid) {
        showToast('Please select at least one skill and one location', 'error');
    }

    return isValid;
}

function validateStep3() {
    // Clear previous errors
    clearValidationErrors();

    let isValid = true;

    // Experience level validation
    if (!jobModalFilters.requiredExperience || jobModalFilters.requiredExperience.length === 0) {
        showValidationError('job-exp-entry', 'Please select at least one experience level', true);
        isValid = false;
    }

    // Work type validation
    if (!jobModalFilters.requiredWorkType || jobModalFilters.requiredWorkType.length === 0) {
        showValidationError('work-type-remote', 'Please select a work type', true);
        isValid = false;
    }

    // Job type validation
    if (!jobModalFilters.requiredJobType || jobModalFilters.requiredJobType.length === 0) {
        showValidationError('job-type-fulltime', 'Please select a job type', true);
        isValid = false;
    }

    // Education validation
    if (!jobModalFilters.requiredEducation || jobModalFilters.requiredEducation.length === 0) {
        showValidationError('job-edu-bachelor', 'Please select at least one education level', true);
        isValid = false;
    }

    // Availability validation
    if (!jobModalFilters.requiredAvailability) {
        showValidationError('availability-immediate', 'Please select availability preference', true);
        isValid = false;
    }

    // Salary range validation
    if (!jobModalFilters.requiredSalary || !Array.isArray(jobModalFilters.requiredSalary) ||
        jobModalFilters.requiredSalary.length !== 2 || jobModalFilters.requiredSalary[1] <= 0) {
        showValidationError('jobSalaryRange', 'Please set a valid salary range');
        isValid = false;
    }

    if (!isValid) {
        showToast('Please complete all required fields in this step', 'error');
    }

    return isValid;
}

// Update the selectJobDropdown function to handle dynamic updates

function selectJobDropdown() {
    const dropdownBtn = document.getElementById('jobDropdownBtn');
    const dropdown = document.getElementById('jobDropdown');
    let currentSelectedJobId = null;

    // Toggle dropdown
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
        
        // Update chevron icon
        const chevron = dropdownBtn.querySelector('.fa-chevron-down, .fa-chevron-up');
        if (chevron) {
            chevron.classList.toggle('fa-chevron-down');
            chevron.classList.toggle('fa-chevron-up');
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
            // Reset chevron icon
            const chevron = dropdownBtn.querySelector('.fa-chevron-up');
            if (chevron) {
                chevron.classList.remove('fa-chevron-up');
                chevron.classList.add('fa-chevron-down');
            }
        }
    });

    // Use event delegation for dynamic job options
    dropdown.addEventListener('click', async (e) => {
        // Handle job deletion
        if (e.target.classList.contains('job-delete-btn') || e.target.closest('.job-delete-btn')) {
            e.preventDefault();
            e.stopPropagation();

            const deleteBtn = e.target.classList.contains('job-delete-btn') ? e.target : e.target.closest('.job-delete-btn');
            const jobId = deleteBtn.getAttribute('data-job-id');
            const jobTitle = deleteBtn.getAttribute('data-job-title');

            if (!jobId || !jobTitle) {
                showToast('Error: Missing job information', 'error');
                return;
            }

            // Show confirmation dialog
            const confirmed = await showConfirmationDialog(
                'Delete Job',
                `Are you sure you want to delete the job '${jobTitle}'? This action cannot be undone.`,
                'Delete',
                'Cancel',
                'danger'
            );

            if (confirmed) {
                await deleteJob(jobId, jobTitle);
            }
            return;
        }

        // Handle job deselection
        if (e.target.classList.contains('job-clear-option') || e.target.getAttribute('data-action') === 'clear-job') {
            e.preventDefault();
            
            // Clear visual selection
            clearJobSelection();
            
            // Hide dropdown
            dropdown.classList.add('hidden');
            
            // Reset chevron icon
            const chevron = dropdownBtn.querySelector('.fa-chevron-up');
            if (chevron) {
                chevron.classList.remove('fa-chevron-up');
                chevron.classList.add('fa-chevron-down');
            }
            
            // Show loading state
            showJobSelectionLoading(true);
            
            try {
                // Re-run search using current filters (no jobCriteria)
                await applyAllFilters();
                showToast('Job filter cleared', 'success');
            } catch (err) {
                console.error('Error reloading after deselecting job:', err);
                showToast('Error clearing job filter', 'error');
            } finally {
                showJobSelectionLoading(false);
            }
            return;
        }

        // Handle job selection
        if (e.target.classList.contains('job-option') || e.target.closest('.job-option')) {
            e.preventDefault();
            
            const jobOption = e.target.classList.contains('job-option') ? e.target : e.target.closest('.job-option');
            const jobId = jobOption.getAttribute('data-job-id');
            const jobTitle = jobOption.getAttribute('data-job-title');

            if (!jobId || !jobTitle) {
                console.error('No job ID or title found on selected option');
                showToast('Error: Invalid job selection', 'error');
                return;
            }

            // Don't reselect the same job
            if (currentSelectedJobId === jobId) {
                dropdown.classList.add('hidden');
                return;
            }

            console.log('Selected job:', jobTitle, 'ID:', jobId);
            
            // Show loading state
            showJobSelectionLoading(true);
            
            try {
                // Update visual selection
                updateJobSelection(jobId, jobTitle);
                
                // Hide dropdown
                dropdown.classList.add('hidden');
                
                // Reset chevron icon
                const chevron = dropdownBtn.querySelector('.fa-chevron-up');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-up');
                    chevron.classList.add('fa-chevron-down');
                }

                // Check if job criteria is already available (for newly created jobs)
                const jobDropdownItem = document.querySelector(`.job-dropdown-item[data-job-id="${jobId}"]`);
                let jobCriteria;
                
                if (jobDropdownItem && jobDropdownItem.hasAttribute('data-job-criteria')) {
                    // Use stored criteria for newly created jobs
                    try {
                        jobCriteria = JSON.parse(jobDropdownItem.getAttribute('data-job-criteria'));
                        console.log('Using stored job criteria:', jobCriteria);
                    } catch (parseError) {
                        console.warn('Failed to parse stored job criteria, falling back to API:', parseError);
                        jobCriteria = null;
                    }
                }
                
                if (!jobCriteria) {
                    // Fetch the complete job data from API for existing jobs
                    const response = await fetch(`/api/jobs/${jobId}/criteria`);
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                    }
                    jobCriteria = await response.json();
                    console.log('Job criteria loaded from API:', jobCriteria);
                }

                // Store job criteria globally
                currentSelectedJobCriteria = {
                    requiredSkills: jobCriteria.requiredSkills || [],
                    requiredLocations: jobCriteria.requiredLocations || [],
                    requiredExperience: jobCriteria.requiredExperience || [],
                    requiredWorkType: jobCriteria.requiredWorkType || [],
                    requiredJobType: jobCriteria.requiredJobType || [],
                    requiredSalary: jobCriteria.requiredSalary || [0, 100000],
                    requiredEducation: jobCriteria.requiredEducation || [],
                    requiredAvailability: jobCriteria.requiredAvailability || ""
                };
                
                // Update current selected job
                currentSelectedJobId = jobId;

                // Use the regular filtering system with job criteria integrated
                await applyAllFilters();
                
                showToast(`Filtering candidates for "${jobTitle}"`, 'success');

            } catch (error) {
                console.error('Error applying job filters:', error);
                showToast('Error applying job filter', 'error');
                clearJobSelection();
            } finally {
                showJobSelectionLoading(false);
            }
        }
    });

    // Helper functions
    function updateJobSelection(jobId, jobTitle) {
        // Update button text
        const textSpan = dropdownBtn.querySelector('#selectedJobTitle');
        if (textSpan) {
            textSpan.textContent = jobTitle;
        }
        
        // Update currentFilters to track selected job
        currentFilters.selectedJob = {
            id: jobId,
            title: jobTitle
        };
        
        // Add visual indicator that a job is selected
        dropdownBtn.classList.add('job-selected');
        dropdownBtn.classList.remove('border-gray-200');
        dropdownBtn.classList.add('border-blue-500', 'bg-blue-50');
        
        // Update dropdown items visual state
        document.querySelectorAll('.job-dropdown-item').forEach(item => {
            if (item.getAttribute('data-job-id') === jobId) {
                item.classList.add('bg-blue-50', 'border-l-4', 'border-blue-500');
            } else {
                item.classList.remove('bg-blue-50', 'border-l-4', 'border-blue-500');
            }
        });
        
        // Update applied filters display
        renderAppliedFilters();
    }
    
    function clearJobSelection() {
        // Reset button text
        const textSpan = dropdownBtn.querySelector('#selectedJobTitle');
        if (textSpan) {
            textSpan.textContent = 'Select Job';
        }
        
        // Clear selected job from currentFilters and global variables
        currentFilters.selectedJob = null;
        currentSelectedJobId = null;
        currentSelectedJobCriteria = null;
        
        // Remove visual indicators
        dropdownBtn.classList.remove('job-selected', 'border-blue-500', 'bg-blue-50');
        dropdownBtn.classList.add('border-gray-200');
        
        // Clear dropdown items visual state
        document.querySelectorAll('.job-dropdown-item').forEach(item => {
            item.classList.remove('bg-blue-50', 'border-l-4', 'border-blue-500');
        });
        
        // Update applied filters display
        renderAppliedFilters();
    }
    
    function showJobSelectionLoading(show) {
        const textSpan = dropdownBtn.querySelector('#selectedJobTitle');
        if (!textSpan) return;
        
        if (show) {
            textSpan.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
            dropdownBtn.disabled = true;
        } else {
            dropdownBtn.disabled = false;
            // Reset text based on current selection state
            if (currentSelectedJobId && currentFilters.selectedJob) {
                textSpan.textContent = currentFilters.selectedJob.title;
            } else {
                textSpan.textContent = 'Select Job';
            }
        }
    }
}

// Helper function to integrate job criteria with existing user filters
function integrateJobCriteriaWithFilters(jobCriteria, userFilters) {
    const integrated = { ...userFilters };

    if (!jobCriteria) return integrated;

    // Job criteria take precedence, then merge with user filters
    if (jobCriteria.requiredSkills && jobCriteria.requiredSkills.length > 0) {
        // Merge job skills with user-selected skills (union)
        const allSkills = [...new Set([...jobCriteria.requiredSkills, ...(userFilters.skills || [])])];
        integrated.skills = allSkills;
    }

    if (jobCriteria.requiredLocations && jobCriteria.requiredLocations.length > 0) {
        // Job locations take priority, but include user locations as secondary
        integrated.locations = [...new Set([...jobCriteria.requiredLocations, ...(userFilters.locations || [])])];
    }

    if (jobCriteria.requiredExperience && jobCriteria.requiredExperience.length > 0) {
        integrated.experience = jobCriteria.requiredExperience;
    }

    if (jobCriteria.requiredWorkType && jobCriteria.requiredWorkType.length > 0) {
        integrated.workType = jobCriteria.requiredWorkType;
    }

    if (jobCriteria.requiredJobType && jobCriteria.requiredJobType.length > 0) {
        integrated.jobType = jobCriteria.requiredJobType;
    }

    if (jobCriteria.requiredEducation && jobCriteria.requiredEducation.length > 0) {
        integrated.education = jobCriteria.requiredEducation;
    }

    if (jobCriteria.requiredAvailability) {
        integrated.availability = jobCriteria.requiredAvailability;
    }

    if (jobCriteria.requiredSalary && Array.isArray(jobCriteria.requiredSalary) && jobCriteria.requiredSalary.length === 2) {
        // Use job salary range if specified, otherwise keep user range
        integrated.salaryRange = jobCriteria.requiredSalary;
    }

    return integrated;
}

// This function has been integrated into updateResults()

// Function to calculate weighted match score
function calculateMatchScore(candidate, jobCriteria) {
    if (!candidate || !jobCriteria) return 0;

    let totalScore = 0;
    let maxPossibleScore = 0;

    // Skills match: 30% weight
    if (jobCriteria.requiredSkills && jobCriteria.requiredSkills.length > 0) {
        const candidateSkills = candidate.skills || [];
        const matchingSkills = jobCriteria.requiredSkills.filter(skill =>
            candidateSkills.some(candidateSkill =>
                candidateSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(candidateSkill.toLowerCase())
            )
        );
        const skillScore = (matchingSkills.length / jobCriteria.requiredSkills.length) * 30;
        totalScore += skillScore;
        maxPossibleScore += 30;
    }

    // Experience level: 20% weight
    if (jobCriteria.requiredExperience && jobCriteria.requiredExperience.length > 0) {
        const candidateExperience = candidate.totalExperienceYears || 0;
        const experienceMatch = checkExperienceMatch(candidateExperience, jobCriteria.requiredExperience);
        totalScore += experienceMatch ? 20 : 0;
        maxPossibleScore += 20;
    }

    // Work Type: 15% weight
    if (jobCriteria.requiredWorkType && jobCriteria.requiredWorkType.length > 0) {
        const candidateWorkTypes = candidate.metadata?.selectedJobTypes || [];
        const workTypeMatch = jobCriteria.requiredWorkType.some(type => candidateWorkTypes.includes(type));
        totalScore += workTypeMatch ? 15 : 0;
        maxPossibleScore += 15;
    }

    // Job Type: 15% weight
    if (jobCriteria.requiredJobType && jobCriteria.requiredJobType.length > 0) {
        const candidateJobType = candidate.metadata?.jobMainType;
        const jobTypeMatch = jobCriteria.requiredJobType.includes(candidateJobType);
        totalScore += jobTypeMatch ? 15 : 0;
        maxPossibleScore += 15;
    }

    // Location/Education/Other: 20% weight (5% each)
    if (jobCriteria.requiredLocations && jobCriteria.requiredLocations.length > 0) {
        const candidateLocations = [
            candidate.location,
            ...(candidate.metadata?.selectedPreferredLocation || [])
        ].filter(Boolean);
        const locationMatch = jobCriteria.requiredLocations.some(loc =>
            candidateLocations.some(candidateLoc =>
                candidateLoc.toLowerCase().includes(loc.toLowerCase())
            )
        );
        totalScore += locationMatch ? 5 : 0;
        maxPossibleScore += 5;
    }

    // Education match: 5% weight
    if (jobCriteria.requiredEducation && jobCriteria.requiredEducation.length > 0) {
        const candidateEducation = candidate.education || [];
        const educationMatch = checkEducationMatch(candidateEducation, jobCriteria.requiredEducation);
        totalScore += educationMatch ? 5 : 0;
        maxPossibleScore += 5;
    }

    // Availability match: 5% weight
    if (jobCriteria.requiredAvailability) {
        const candidateAvailability = candidate.metadata?.availability;
        const availabilityMatch = candidateAvailability === jobCriteria.requiredAvailability;
        totalScore += availabilityMatch ? 5 : 0;
        maxPossibleScore += 5;
    }

    // Salary match: 5% weight
    if (jobCriteria.requiredSalary && Array.isArray(jobCriteria.requiredSalary)) {
        const candidateSalary = candidate.metadata?.minCtcRequirements?.annualCtc?.amount || 0;
        const [minSalary, maxSalary] = jobCriteria.requiredSalary;
        const salaryMatch = candidateSalary >= minSalary && candidateSalary <= maxSalary;
        totalScore += salaryMatch ? 5 : 0;
        maxPossibleScore += 5;
    }

    // Calculate percentage and cap at 100%
    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    return Math.min(Math.round(percentage), 100);
}

// Helper function to check experience match
function checkExperienceMatch(candidateYears, requiredLevels) {
    for (const level of requiredLevels) {
        switch (level) {
            case 'entry':
                if (candidateYears >= 0 && candidateYears <= 2) return true;
                break;
            case 'mid':
                if (candidateYears > 2 && candidateYears <= 5) return true;
                break;
            case 'senior':
                if (candidateYears > 5 && candidateYears <= 10) return true;
                break;
            case 'exec':
                if (candidateYears > 10) return true;
                break;
        }
    }
    return false;
}

// Helper function to check education match
function checkEducationMatch(candidateEducation, requiredEducation) {
    if (!Array.isArray(candidateEducation) || candidateEducation.length === 0) return false;

    const candidateDegrees = candidateEducation.map(edu => edu.degree?.toLowerCase() || '');

    return requiredEducation.some(reqEdu => {
        switch (reqEdu) {
            case 'highschool':
                return candidateDegrees.some(degree => /high school|secondary/.test(degree));
            case 'associate':
                return candidateDegrees.some(degree => /associate/.test(degree));
            case 'bachelor':
                return candidateDegrees.some(degree => /bachelor|b\.?tech|b\.?e|b\.?sc/.test(degree));
            case 'master':
                return candidateDegrees.some(degree => /master|m\.?tech|m\.?e|m\.?sc/.test(degree));
            case 'phd':
                return candidateDegrees.some(degree => /ph\.?d|doctorate/.test(degree));
            default:
                return false;
        }
    });
}

// Function to add visual match score indicators
function addMatchScoreIndicators(candidates) {
    setTimeout(() => {
        const candidateCards = document.querySelectorAll('.candidate-card');
        candidateCards.forEach((card, index) => {
            if (candidates[index] && candidates[index].matchScore !== undefined) {
                const matchScore = candidates[index].matchScore;

                // Remove existing match indicators
                const existingIndicator = card.querySelector('.match-score-indicator');
                if (existingIndicator) {
                    existingIndicator.remove();
                }

                // Add new match score indicator
                const indicator = document.createElement('div');
                indicator.className = 'match-score-indicator';
                indicator.innerHTML = `
                    <div class="match-score-badge ${getScoreClass(matchScore)}">
                        <span class="match-percentage">${matchScore}%</span>
                        <span class="match-label">Match</span>
                    </div>
                `;

                // Insert at the top of the card
                const cardContent = card.querySelector('.p-6') || card.firstElementChild;
                if (cardContent) {
                    cardContent.insertBefore(indicator, cardContent.firstChild);
                }
            }
        });
    }, 100);
}

// Helper function to get CSS class based on match score
function getScoreClass(score) {
    if (score >= 80) return 'match-excellent';
    if (score >= 60) return 'match-good';
    if (score >= 40) return 'match-fair';
    return 'match-poor';
}

// Validation helper functions
function showValidationError(fieldId, message, isGroup = false) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Add error styling
    if (isGroup) {
        // For checkbox/radio groups, highlight the parent container
        const container = field.closest('.space-y-2, .flex.flex-wrap.gap-2, .mt-4');
        if (container) {
            container.classList.add('validation-error');
        }
    } else {
        field.classList.add('validation-error');
    }

    // Create or update error message
    let errorElement = document.getElementById(`${fieldId}-error`);
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = `${fieldId}-error`;
        errorElement.className = 'validation-error-message';

        if (isGroup) {
            const container = field.closest('.space-y-2, .flex.flex-wrap.gap-2, .mt-4');
            if (container) {
                container.appendChild(errorElement);
            }
        } else {
            field.parentNode.appendChild(errorElement);
        }
    }

    errorElement.textContent = message;
}

function clearValidationErrors() {
    // Remove error styling
    document.querySelectorAll('.validation-error').forEach(element => {
        element.classList.remove('validation-error');
    });

    // Remove error messages
    document.querySelectorAll('.validation-error-message').forEach(element => {
        element.remove();
    });
}

// Reset job modal filters
function resetJobModalFilters() {
    jobModalFilters = {
        requiredSkills: [],
        requiredLocations: [],
        requiredExperience: [],
        requiredWorkType: [],
        requiredJobType: [],
        requiredSalary: [0, 100000],
        requiredEducation: [],
        requiredAvailability: null
    };

    // Clear form fields
    document.getElementById('jobTitle').value = '';
    document.getElementById('jobDescription').value = '';

    // Clear selected skills and locations
    document.getElementById('jobSelectedSkills').innerHTML = '';
    document.getElementById('jobSelectedLocations').innerHTML = '';

    // Reset checkboxes
    document.querySelectorAll('#createJobModal input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Reset filter chips
    document.querySelectorAll('#createJobModal .filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });

    // Reset salary range
    const jobSalaryRange = document.getElementById('jobSalaryRange');
    if (jobSalaryRange) {
        jobSalaryRange.value = 100000;
        document.getElementById('jobMinSalary').textContent = '$0';
        document.getElementById('jobMaxSalary').textContent = '$100k+';
    }

    // Clear validation errors
    clearValidationErrors();
}

// Toast notification function (if not already defined)
function showToast(message, type = 'info') {
    // Check if toast container exists, create if not
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} bg-white border-l-4 p-4 shadow-lg rounded-md max-w-sm`;

    // Set border color based on type
    const borderColors = {
        success: 'border-green-500',
        error: 'border-red-500',
        warning: 'border-yellow-500',
        info: 'border-blue-500'
    };

    toast.classList.add(borderColors[type] || borderColors.info);

    // Set icon based on type
    const icons = {
        success: 'fas fa-check-circle text-green-500',
        error: 'fas fa-exclamation-circle text-red-500',
        warning: 'fas fa-exclamation-triangle text-yellow-500',
        info: 'fas fa-info-circle text-blue-500'
    };

    toast.innerHTML = `
        <div class="flex items-center">
            <i class="${icons[type] || icons.info} mr-3"></i>
            <span class="text-gray-800">${message}</span>
            <button class="ml-auto text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add to container
    toastContainer.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Job deletion functionality
async function deleteJob(jobId, jobTitle) {
    try {
        // Show loading state
        showToast('Deleting job...', 'info');

        const response = await fetch(`/api/jobs/${jobId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' // Include cookies for authentication
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Remove job from dropdown
            removeJobFromDropdown(jobId);

            // Show success message
            showToast(`Job "${jobTitle}" deleted successfully`, 'success');

            // If this was the selected job, clear the selection
            const dropdownBtn = document.getElementById('jobDropdownBtn');
            const selectedJobTitle = dropdownBtn.querySelector('#selectedJobTitle') || dropdownBtn.querySelector('span');
            if (selectedJobTitle && selectedJobTitle.textContent === jobTitle) {
                selectedJobTitle.textContent = 'Select Job';
                // Re-run search without job criteria
                await applyAllFilters();
            }

        } else {
            // Handle error response
            const errorMessage = result.message || 'Failed to delete job';
            showToast(errorMessage, 'error');
            console.error('Job deletion failed:', result);
        }

    } catch (error) {
        console.error('Error deleting job:', error);
        showToast('Network error while deleting job. Please try again.', 'error');
    }
}

// Remove job from dropdown UI
function removeJobFromDropdown(jobId) {
    const dropdown = document.getElementById('jobDropdown');
    const jobElement = dropdown.querySelector(`[data-job-id="${jobId}"]`);

    if (jobElement) {
        // Remove the entire job container (div with flex layout)
        const jobContainer = jobElement.closest('.flex.items-center.justify-between');
        if (jobContainer) {
            jobContainer.remove();
        } else {
            // Fallback: remove just the job element
            jobElement.remove();
        }

        console.log(`Removed job ${jobId} from dropdown`);
    }
}

// Enhanced confirmation dialog
function showConfirmationDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning') {
    return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50';

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6';

        // Set colors based on type
        const colors = {
            danger: {
                icon: 'text-red-600',
                button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            },
            warning: {
                icon: 'text-yellow-600',
                button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
            },
            info: {
                icon: 'text-blue-600',
                button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }
        };

        const colorScheme = colors[type] || colors.warning;

        modal.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-triangle ${colorScheme.icon} text-2xl"></i>
                </div>
                <div class="ml-4 flex-1">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">${title}</h3>
                    <p class="text-sm text-gray-600 mb-6">${message}</p>
                    <div class="flex justify-end space-x-3">
                        <button id="cancelBtn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            ${cancelText}
                        </button>
                        <button id="confirmBtn" class="px-4 py-2 text-sm font-medium text-white ${colorScheme.button} border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Add event listeners
        const confirmBtn = modal.querySelector('#confirmBtn');
        const cancelBtn = modal.querySelector('#cancelBtn');

        const cleanup = () => {
            document.body.removeChild(backdrop);
        };

        confirmBtn.addEventListener('click', () => {
            cleanup();
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(false);
        });

        // Close on backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                cleanup();
                resolve(false);
            }
        });

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                cleanup();
                resolve(false);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus the confirm button
        setTimeout(() => confirmBtn.focus(), 100);
    });
}







