document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('receiptSearchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        searchReceipts();
    });
});

async function searchReceipts() {
    const matnumber = document.getElementById('matnumber').value;
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    
    if (!matnumber && !fullname && !email && !phone) {
        alert('Please fill all fields');
        return;
    }
    
    const searchBtn = document.querySelector('.submit-btn');
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    
    try {
        const formData = new FormData();
        formData.append('matnumber', matnumber);
        formData.append('fullname', fullname);
        formData.append('email', email);
        formData.append('phone', phone);
        
        const response = await fetch('/search/receipts', {
            method: 'POST',
            body: formData
        });
        
        const { success, receipts, message } = await response.json();
        
        if (success) {
            displayReceipts(receipts);
        } else {
            alert(message || 'Search failed');
        }
    } catch (error) {
        console.error('Search error:', error);
        alert('Search failed. Please try again.');
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search Receipts';
    }
}

function displayReceipts(receipts) {
    const resultsContainer = document.getElementById('receiptResults');
    
    if (receipts.length === 0) {
        resultsContainer.innerHTML = '<div class="no-receipts">No receipts found matching your search criteria</div>';
        return;
    }
    document.getElementById('receiptResults').scrollIntoView();
    resultsContainer.innerHTML = receipts.map(receipt => `
        <div class="receipt-item">
            <div class="receipt-name">${receipt.fullname}</div>
            <div class="receipt-details">
                <span class="receipt-arn">${receipt.arn.replace(/ /g, '').toUpperCase()}</span> 
                • ${receipt.association_name} 
                • ₦${parseFloat(receipt.amount).toFixed(2)}
                • ${new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                ${receipt.president_name ? `• ${receipt.president_name}` : ''}
            </div>
            <form class="download-form" action="/download-receipt" method="POST">
                <input type="hidden" name="arn" value="${receipt.arn}">
                <button type="submit" class="secondary-btn">Download</button>
            </form>
        </div>
    `).join('');
}