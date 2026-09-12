// Admin Settings JavaScript
// VAN//MOD - App/Game/Tool Management (CRUD)

let currentUser = null;
let editMode = false;
let editItemId = null;
let editItemType = 'apps';
let currentItem = null;

const VALID_TYPES = ['apps', 'games', 'tools'];

// Null-safe value getter
function fieldValue(id) {
    return document.getElementById(id)?.value.trim() || '';
}

// ==================== AUTH CHECK ====================
function checkAuth() {
    if (!window.VANMOD) {
        window.location.href = 'adminlogin.html';
        return;
    }
    VANMOD.checkAuthState((user) => {
        if (!user) {
            window.location.href = 'adminlogin.html';
        } else {
            currentUser = user;
            initPage();
        }
    });
}

// ==================== INIT PAGE ====================
function initPage() {
    // Check if editing existing item
    const urlParams = new URLSearchParams(window.location.search);
    editItemId = urlParams.get('edit');
    const typeParam = urlParams.get('type');
    if (typeParam && VALID_TYPES.includes(typeParam)) {
        editItemType = typeParam;
    }

    initForm();
    paintTypeButtons();

    if (editItemId) {
        editMode = true;
        // Show delete button only in edit mode
        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
            deleteBtn.classList.remove('hidden');
            deleteBtn.classList.add('flex');
        }
        loadItemForEdit();
    }
}

// ==================== TYPE SELECTOR ====================
function paintTypeButtons() {
    const typeButtons = document.querySelectorAll('[data-type]');
    typeButtons.forEach(btn => {
        const active = btn.dataset.type === editItemType;
        btn.classList.toggle('border-primary-container', active);
        btn.classList.toggle('text-primary-container', active);
        btn.classList.toggle('border-outline-variant', !active);
        btn.classList.toggle('text-on-surface-variant', !active);
    });
}

// ==================== LOAD ITEM FOR EDIT ====================
async function loadItemForEdit() {
    try {
        const manager = VANMOD.getManager(editItemType);
        const item = await manager.getById(editItemId);

        if (!item) {
            alert('Item not found');
            window.location.href = 'dashbordadmin.html';
            return;
        }

        currentItem = item;

        // Populate form
        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };
        set('item-name', item.name);
        set('item-description', item.description);
        set('item-version', item.version);
        set('item-size', item.size);
        set('item-category', item.category);
        set('item-developer', item.developer);
        set('item-package', item.packageName);
        set('item-android-version', item.androidVersion);
        set('item-license', item.license);
        set('item-download-url', item.downloadUrl);
        set('item-tags', item.tags ? item.tags.join(', ') : '');
        set('item-mod-type', item.modType);
        set('item-icon-url', item.icon);

        // Show existing icon preview so saving keeps it
        if (item.icon) {
            renderIconPreview(item.icon);
        }

        // Update page title
        const formTitle = document.getElementById('form-title');
        if (formTitle) {
            formTitle.innerHTML = `<span class="text-primary-container mr-2">//</span>EDIT_${editItemType.toUpperCase()}`;
        }
        const formSubtitle = document.getElementById('form-subtitle');
        if (formSubtitle) {
            formSubtitle.textContent = `Modifying entry: ${item.name || editItemId}`;
        }

        // Update submit button text
        const submitBtn = document.querySelector('#item-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = `
                <span class="relative z-10 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[20px]">save</span>
                    UPDATE ENTRY
                </span>
            `;
        }

    } catch (error) {
        console.error('Failed to load item:', error);
        alert('Failed to load item data');
    }
}

// ==================== INIT FORM ====================
function initForm() {
    const form = document.getElementById('item-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSubmit();
    });

    // Image upload preview
    const iconInput = document.getElementById('item-icon');
    if (iconInput) {
        iconInput.addEventListener('change', handleIconUpload);
    }

    // Icon URL manual input -> live preview
    const iconUrlInput = document.getElementById('item-icon-url');
    if (iconUrlInput) {
        iconUrlInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) renderIconPreview(url);
        });
    }

    // Type selector
    const typeButtons = document.querySelectorAll('[data-type]');
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            editItemType = btn.dataset.type;
            paintTypeButtons();
        });
    });
}

// ==================== HANDLE SUBMIT ====================
async function handleSubmit() {
    const submitBtn = document.querySelector('#item-form button[type="submit"]');
    if (!submitBtn) return;

    const originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="relative z-10 flex items-center gap-2">
            <span class="animate-pulse">PROCESSING...</span>
        </span>
    `;

    const restoreButton = () => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
    };

    try {
        const iconUrl = fieldValue('item-icon-url');
        const previewSrc = document.getElementById('icon-preview')?.src || '';
        // Prefer explicit URL field; keep stored icon on edit; never store
        // giant base64 data-URLs in Firestore (1MB doc limit).
        const icon = iconUrl
            || (previewSrc && !previewSrc.startsWith('data:') ? previewSrc : '')
            || (currentItem && currentItem.icon) || '';

        // Collect form data
        const formData = {
            name: fieldValue('item-name'),
            description: fieldValue('item-description'),
            version: fieldValue('item-version'),
            size: fieldValue('item-size'),
            category: fieldValue('item-category'),
            developer: fieldValue('item-developer'),
            packageName: fieldValue('item-package'),
            androidVersion: fieldValue('item-android-version'),
            license: fieldValue('item-license'),
            downloadUrl: fieldValue('item-download-url'),
            tags: fieldValue('item-tags').split(',').map(t => t.trim()).filter(t => t),
            modType: fieldValue('item-mod-type'),
            icon
        };

        // Validate
        if (!formData.name) {
            alert('Name is required');
            restoreButton();
            return;
        }

        // Get manager
        const manager = VANMOD.getManager(editItemType);

        if (editMode && editItemId) {
            // Update existing item
            await manager.update(editItemId, formData);
            showSuccessMessage('ITEM UPDATED SUCCESSFULLY');
        } else {
            // Create new item
            const newId = await manager.create(formData);
            showSuccessMessage('ITEM CREATED SUCCESSFULLY');
            editItemId = newId;
            editMode = true;
        }

        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'dashbordadmin.html';
        }, 2000);

    } catch (error) {
        console.error('Failed to save item:', error);
        alert('Failed to save item. Please try again.');
        restoreButton();
    }
}

// ==================== ICON PREVIEW ====================
function renderIconPreview(src) {
    const previewContainer = document.getElementById('icon-preview-container');
    if (!previewContainer) return;
    previewContainer.innerHTML = `
        <img id="icon-preview" src="${VANMOD.escapeHtml(src)}" class="w-full h-full object-cover img-greyscale" alt="Icon preview" onerror="this.onerror=null;this.src='${VANMOD.PLACEHOLDER_ICON}'">
    `;
}

// ==================== HANDLE ICON UPLOAD ====================
async function handleIconUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        event.target.value = '';
        return;
    }

    // Validate file size (max 2MB, matches storage.rules)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        event.target.value = '';
        return;
    }

    const iconUrlInput = document.getElementById('item-icon-url');

    try {
        // Try a real Firebase Storage upload (works when logged in as admin
        // and Storage is enabled with the bundled storage.rules).
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `icons/${Date.now()}_${safeName}`;
        const result = await VANMOD.uploadFile(file, path);

        if (result.success) {
            if (iconUrlInput) iconUrlInput.value = result.url;
            renderIconPreview(result.url);
            return;
        }
        throw new Error(result.error || 'Upload failed');
    } catch (error) {
        console.warn('Storage upload failed, using local preview:', error);
        // Fallback: local preview + ask admin to paste a hosted URL
        const reader = new FileReader();
        reader.onload = function (e) {
            renderIconPreview(e.target.result);
        };
        reader.readAsDataURL(file);
        alert(
            'Storage upload gagal (' + (error.message || 'unknown error') + ').\n\n' +
            'Solusi:\n' +
            '1. Pastikan Firebase Storage sudah diaktifkan, atau\n' +
            '2. Upload gambar ke ImgBB.com lalu paste Direct link ke field "Icon URL".'
        );
    }
}

// ==================== DELETE ITEM ====================
async function deleteItem() {
    if (!editMode || !editItemId) {
        alert('No item to delete');
        return;
    }

    const confirmed = confirm('Are you sure you want to delete this item? This action cannot be undone.');
    if (!confirmed) return;

    try {
        const manager = VANMOD.getManager(editItemType);
        await manager.delete(editItemId);

        showSuccessMessage('ITEM DELETED SUCCESSFULLY');

        setTimeout(() => {
            window.location.href = 'dashbordadmin.html';
        }, 1500);

    } catch (error) {
        console.error('Failed to delete item:', error);
        alert('Failed to delete item. Please try again.');
    }
}

// Make deleteItem available globally
window.deleteItem = deleteItem;

// ==================== SUCCESS MESSAGE ====================
function showSuccessMessage(message) {
    const successOverlay = document.createElement('div');
    successOverlay.className = 'fixed inset-0 bg-surface-container-lowest/90 backdrop-blur-sm z-50 flex items-center justify-center';
    successOverlay.innerHTML = `
        <div class="bg-surface-container border-2 border-primary-container p-xl text-center brutalist-shadow-hover">
            <span class="material-symbols-outlined text-[64px] text-primary-container mb-md block" style="font-variation-settings: 'FILL' 1;">check_circle</span>
            <h2 class="font-headline-lg text-headline-lg text-primary mb-sm uppercase">${VANMOD.escapeHtml(message)}</h2>
            <p class="font-label-md text-on-surface-variant uppercase tracking-widest">Redirecting...</p>
        </div>
    `;
    document.body.appendChild(successOverlay);
}

// ==================== CANCEL ====================
function cancelEdit() {
    if (confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
        window.location.href = 'dashbordadmin.html';
    }
}

// Make cancelEdit available globally
window.cancelEdit = cancelEdit;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
