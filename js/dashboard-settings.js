let selectedLogoFile = null;
let cropperInstance = null;
let originalFile = null;
const MAX_FILE_SIZE = 200 * 1024;

function initLogoUpload() {
    const fileInput = document.getElementById('logoFileInput');
    const uploadArea = document.getElementById('logoUploadArea');
    const form = document.getElementById('logoForm');

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleLogoFileSelect);

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            handleLogoFileSelect({ target: { files } });
        }
    });

    form.addEventListener('submit', handleLogo);
}

function handleLogoFileSelect({ target: { files } }) {
    const file = files[0];
    const errorDiv = document.getElementById('logoError');
    errorDiv.style.display = 'none';

    if (!file) return;
    if (!file.type.startsWith('image/')) {
        return showLogoError('Please select an image file (PNG, JPG, GIF)');
    }

    originalFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('logoUploadArea').style.display = 'none';
        document.getElementById('logoPreviewArea').style.display = 'none';
        document.getElementById('cropContainer').style.display = 'block';
        
        const cropImage = document.getElementById('cropImage');
        cropImage.src = e.target.result;
        
        if (cropperInstance) {
            cropperInstance.destroy();
        }
        
        cropImage.onload = function() {
            cropperInstance = new Cropper(cropImage, {
                aspectRatio: NaN,
                viewMode: 1,
                autoCropArea: 0.8,
                responsive: true,
                background: true,
                movable: true,
                zoomable: true,
                rotatable: true,
                scalable: true,
                cropBoxResizable: true,
                cropBoxMovable: true,
                guides: true,
                center: true,
                highlight: true,
                dragMode: 'move'
            });
        };
    };
    reader.readAsDataURL(file);
}

function applyCrop() {
    if (!cropperInstance) return;

    const canvas = cropperInstance.getCroppedCanvas({
        maxWidth: 2000,
        maxHeight: 2000,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    canvas.toBlob((blob) => {
        if (blob.size > MAX_FILE_SIZE) {
            showLogoError(`Cropped image size (${(blob.size / 1024).toFixed(2)}KB) exceeds 200KB limit. Please crop a smaller area or use an image compression tool.`);
            return;
        }

        selectedLogoFile = new File([blob], originalFile.name, {
            type: originalFile.type,
            lastModified: Date.now(),
        });

        const previewUrl = canvas.toDataURL();
        document.getElementById('logoPreview').src = previewUrl;
        document.getElementById('cropContainer').style.display = 'none';
        document.getElementById('logoPreviewArea').style.display = 'block';
        
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
    }, originalFile.type);
}

function cancelCrop() {
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
    document.getElementById('cropContainer').style.display = 'none';
    document.getElementById('logoUploadArea').style.display = 'block';
    document.getElementById('logoFileInput').value = '';
    document.getElementById('logoError').style.display = 'none';
    originalFile = null;
}

function showLogoError(message) {
    const errorDiv = document.getElementById('logoError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    selectedLogoFile = null;
}

async function handleLogo(e) {
    e.preventDefault();
    
    if (cropperInstance) {
        applyCrop();
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!selectedLogoFile) {
        return showLogoError('Please select and crop a logo to upload');
    }

    const formData = new FormData();
    formData.append('logo', selectedLogoFile);

    const progressDiv = document.getElementById('logoUploadProgress');
    const progressBar = document.getElementById('logoProgressBar');
    const progressText = document.getElementById('logoProgressText');
    const submitBtn = document.getElementById('logoSubmitBtn');

    progressDiv.style.display = 'block';
    submitBtn.disabled = true;

    try {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                progressBar.style.width = percent + '%';
                progressText.textContent = `Uploading... ${Math.round(percent)}%`;
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const { success, message } = JSON.parse(xhr.responseText);
                if (success) {
                    progressText.textContent = 'Upload complete!';
                    setTimeout(() => {
                        closeLogoModal();
                        location.reload();
                    }, 1000);
                } else {
                    showLogoError(message || 'Upload failed');
                    progressDiv.style.display = 'none';
                    submitBtn.disabled = false;
                }
            } else {
                showLogoError('Upload failed. Please try again.');
                progressDiv.style.display = 'none';
                submitBtn.disabled = false;
            }
        });

        xhr.addEventListener('error', () => {
            showLogoError('Network error. Please check your connection.');
            progressDiv.style.display = 'none';
            submitBtn.disabled = false;
        });

        xhr.open('POST', '/dashboard/settings/logo', true);
        xhr.send(formData);
    } catch {
        showLogoError('An error occurred. Please try again.');
        progressDiv.style.display = 'none';
        submitBtn.disabled = false;
    }
}

async function handleOtherOfficials(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('financial_secretary_name', document.getElementById('financialSecretaryName').value);
    formData.append('financial_secretary_phone', document.getElementById('financialSecretaryPhone').value);
    formData.append('treasurer_name', document.getElementById('treasurerName').value);
    formData.append('treasurer_phone', document.getElementById('treasurerPhone').value);

    try {
        const response = await fetch('/dashboard/settings/officials', { method: 'POST', body: formData });
        const { success, message } = await response.json();
        alert(success ? 'Officials information updated successfully!' : message || 'Failed to update officials information');
        if (success) closeOtherOfficialsModal();
    } catch (error) {
        alert('An error occurred. Please try again.');
        console.error('Error:', error);
    }
}

function closeLogoModal() {
    document.getElementById('logoModal').style.display = 'none';
    document.getElementById('logoForm').reset();
    document.getElementById('logoUploadArea').style.display = 'block';
    document.getElementById('cropContainer').style.display = 'none';
    document.getElementById('logoPreviewArea').style.display = 'none';
    document.getElementById('logoUploadProgress').style.display = 'none';
    document.getElementById('logoError').style.display = 'none';
    document.getElementById('logoSubmitBtn').disabled = false;
    
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
    
    selectedLogoFile = null;
    originalFile = null;
}

async function loadSettings() {
    try {
        const response = await fetch('/dashboard/settings/fetchsettings');
        const { success, officials, logo } = await response.json();
        
        if (success) {
            if (officials.financial_secretary) {
                document.getElementById('financialSecretaryName').value = officials.financial_secretary.name || '';
                document.getElementById('financialSecretaryPhone').value = officials.financial_secretary.phone || '';
            }
            
            if (officials.treasurer) {
                document.getElementById('treasurerName').value = officials.treasurer.name || '';
                document.getElementById('treasurerPhone').value = officials.treasurer.phone || '';
            }
            
            if (logo) {
                selectedLogoFile = true;
                document.getElementById('logoPreview').src = logo;
                document.getElementById('logoUploadArea').style.display = 'none';
                document.getElementById('logoPreviewArea').style.display = 'block';
            }
            
            document.getElementById('logoSubmitBtn').disabled = false;
            document.getElementById('officialsSubmitBtn').disabled = false;
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
        document.getElementById('logoSubmitBtn').disabled = false;
        document.getElementById('officialsSubmitBtn').disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initLogoUpload();
    const officialsForm = document.getElementById('otherOfficialsForm');
    if (officialsForm) officialsForm.addEventListener('submit', handleOtherOfficials);
    
    document.getElementById('logoSubmitBtn').disabled = true;
    document.getElementById('officialsSubmitBtn').disabled = true;
    
    loadSettings();
});