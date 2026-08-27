// Admin Settings JavaScript
// VAN//MOD - App/Game/Tool Management (CRUD)

let currentUser = null;
let editMode = false;
let editItemId = null;
let editItemType = 'apps';

// ==================== AUTH CHECK ====================
function checkAuth() {
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
    editItemType = urlParams.get('type') || 'apps';
    
    if (editItemId) {
        editMode = true;
        loadItemForEdit();
    }
    
    initForm();
}

// ==================== LOAD ITEM FOR EDIT ====================
async function loadItemForEdit() {
    try {
        let manager;
        switch (editItemType) {
            case 'games':
                manager = VANMOD.gamesManager;
                break;
            case 'tools':
                manager = VANMOD.toolsManager;
                break;
            default:
                manager = VANMOD.appsManager;
        }
        
        const item = await manager.getById(editItemId);
        
        if (!item) {
            alert('Item not found');
            return;
        }
        
        // Populate form
        document.getElementById('item-name').value = item.name || '';
        document.getElementById('item-description').value = item.description || '';
        document.getElementById('item-version').value = item.version || '';
        document.getElementById('item-size').value = item.size || '';
        document.getElementById('item-category').value = item.category || '';
        document.getElementById('item-developer').value = item.developer || '';
        document.getElementById('item-package').value = item.packageName || '';
        document.getElementById('item-android-version').value = item.androidVersion || '';
        document.getElementById('item-license').value = item.license || '';
        document.getElementById('item-download-url').value = item.downloadUrl || '';
        document.getElementById('item-tags').value = item.tags ? item.tags.join(', ') : '';
        document.getElementById('item-mod-type').value = item.modType || '';
        
        // Update page title
        const pageTitle = document.querySelector('h1');
        if (pageTitle) {
            pageTitle.textContent = `// EDIT ${editItemType.toUpperCase()} > ${item.name.toUpperCase()}`;
        }
        
        // Update submit button text
        const submitBtn = document.querySelector('button[type="submit"]');
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
    
    // Type selector
    const typeButtons = document.querySelectorAll('[data-type]');
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('border-primary-container', 'text-primary-container'));
            btn.classList.add('border-primary-container', 'text-primary-container');
            editItemType = btn.dataset.type;
        });
    });
}

// ==================== HANDLE SUBMIT ====================
async function handleSubmit() {
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="relative z-10 flex items-center gap-2">
            <span class="animate-pulse">PROCESSING...</span>
        </span>
    `;
    
    try {
        // Collect form data
        const formData = {
            name: document.getElementById('item-name').value.trim(),
            description: document.getElementById('item-description').value.trim(),
            version: document.getElementById('item-version').value.trim(),
            size: document.getElementById('item-size').value.trim(),
            category: document.getElementById('item-category').value.trim(),
            developer: document.getElementById('item-developer').value.trim(),
            packageName: document.getElementById('item-package').value.trim(),
            androidVersion: document.getElementById('item-android-version').value.trim(),
            license: document.getElementById('item-license').value.trim(),
            downloadUrl: document.getElementById('item-download-url').value.trim(),
            tags: document.getElementById('item-tags').value.split(',').map(t => t.trim()).filter(t => t),
            modType: document.getElementById('item-mod-type').value.trim(),
            icon: document.getElementById('icon-preview')?.src || 'https://via.placeholder.com/128'
        };
        
        // Validate
        if (!formData.name) {
            alert('Name is required');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
            return;
        }
        
        // Get manager
        let manager;
        switch (editItemType) {
            case 'games':
                manager = VANMOD.gamesManager;
                break;
            case 'tools':
                manager = VANMOD.toolsManager;
                break;
            default:
                manager = VANMOD.appsManager;
        }
        
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
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
    }
}

// ==================== HANDLE ICON UPLOAD ====================
async function handleIconUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
    }
    
    try {
        // Show preview locally (no Firebase Storage needed)
        const previewContainer = document.getElementById('icon-preview-container');
        const reader = new FileReader();
        
        reader.onload = function(e) {
            if (previewContainer) {
                previewContainer.innerHTML = `
                    <img id="icon-preview" src="${e.target.result}" class="w-full h-full object-cover img-greyscale" alt="Icon preview">
                `;
            }
        };
        
        reader.readAsDataURL(file);
        
        // Show info about URL input
        alert('⚠️ CATATAN:\n\nGambar akan di-preview, tapi untuk menyimpan:\n\n1. Upload gambar Anda ke ImgBB.com\n2. Copy "Direct link" URL\n3. Paste URL ke field "Icon URL" di bawah\n\nURL format: https://i.ibb.co/xxxxx/image.png');
        
    } catch (error) {
        console.error('Preview error:', error);
        alert('Failed to preview image');
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
        let manager;
        switch (editItemType) {
            case 'games':
                manager = VANMOD.gamesManager;
                break;
            case 'tools':
                manager = VANMOD.toolsManager;
                break;
            default:
                manager = VANMOD.appsManager;
        }
        
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
            <h2 class="font-headline-lg text-headline-lg text-primary mb-sm uppercase">${message}</h2>
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
