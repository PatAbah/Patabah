// Bank Suggestions and Validation
class BankSuggestions {
    constructor() {
        this.bankInput = document.getElementById('bank-name');
        this.bankList = null;
        this.suggestionsContainer = null;
        this.errorElement = null;
        this.debounceTimer = null;
        
        this.init();
    }
    
    async init() {
        this.createSuggestionsContainer();
        
        this.createErrorElement();
        
        await this.loadBankData();
        
        this.addEventListeners();
    }
    
    createSuggestionsContainer() {
        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.className = 'suggestions-container';
        this.suggestionsContainer.style.display = 'none';
        
        // Insert after the bank input
        this.bankInput.parentNode.appendChild(this.suggestionsContainer);
    }
    
    createErrorElement() {
        this.errorElement = document.createElement('div');
        this.errorElement.className = 'error-message';
        this.errorElement.style.cssText = `
            color: var(--error-color);
            font-size: var(--font-size-sm);
            margin-bottom: var(--spacing-sm);
            display: none;
        `;
        
        // Insert before the bank input
        this.bankInput.parentNode.insertBefore(this.errorElement, this.bankInput);
    }
    
    async loadBankData() {
        try {
            const response = await fetch('/get-banks');
            if (!response.ok) {
                throw new Error('Failed to load bank data');
            }
            this.bankList = await response.json();
            console.log('Bank data loaded successfully');
        } catch (error) {
            console.error('Error loading bank data:', error);
            this.bankList = {};
        }
    }
    
    addEventListeners() {
        this.bankInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });
        
        this.bankInput.addEventListener('focus', () => {
            if (this.bankInput.value.length >= 2) {
                this.showSuggestions(this.bankInput.value);
            }
            this.hideError();
        });
        
        this.bankInput.addEventListener('blur', () => {
            setTimeout(() => {
                this.validateBankInput();
                this.hideSuggestions();
            }, 200);
        });
        
        // Keydown event for navigation
        this.bankInput.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
            window.scrollTo(0, document.body.scrollHeight);
        });
        
        // Click outside to hide suggestions
        document.addEventListener('click', (e) => {
            if (!this.bankInput.contains(e.target) && !this.suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }
    
    handleInput(value) {
        clearTimeout(this.debounceTimer);
        this.hideError();
        
        if (value.length < 2) {
            this.hideSuggestions();
            return;
        }
        
        this.debounceTimer = setTimeout(() => {
            this.showSuggestions(value);
        }, 300);
    }
    
    showSuggestions(query) {
        if (!this.bankList || Object.keys(this.bankList).length === 0) {
            return;
        }
        
        const suggestions = this.getFilteredSuggestions(query);
        
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        this.suggestionsContainer.innerHTML = '';
        
        suggestions.forEach(bankName => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = bankName;
            
            suggestionItem.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent blur event
                this.selectSuggestion(bankName);
            });
            
            suggestionItem.addEventListener('mouseenter', () => {
                this.highlightSuggestion(suggestionItem);
            });
            
            this.suggestionsContainer.appendChild(suggestionItem);
        });
        
        this.suggestionsContainer.style.display = 'block';
    }
    
    getFilteredSuggestions(query) {
        const searchTerm = query.toLowerCase();
        return Object.keys(this.bankList).filter(bankName => 
            bankName.toLowerCase().includes(searchTerm)
        ).slice(0, 10); // Limit to 10 suggestions
    }
    
    hideSuggestions() {
        this.suggestionsContainer.style.display = 'none';
    }
    
    selectSuggestion(bankName) {
        this.bankInput.value = bankName;
        this.hideSuggestions();
        this.hideError();
        
        // Trigger input event to update any form validation
        this.bankInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    highlightSuggestion(suggestionItem) {
        // Remove highlight from all suggestions
        this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.style.backgroundColor = '';
        });
        
        // Highlight current suggestion
        suggestionItem.style.backgroundColor = 'var(--secondary-color)';
    }
    
    handleKeyNavigation(e) {
        const suggestions = this.suggestionsContainer.querySelectorAll('.suggestion-item');
        const currentHighlighted = this.suggestionsContainer.querySelector('.suggestion-item[style*="background-color"]');
        let currentIndex = Array.from(suggestions).indexOf(currentHighlighted);
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentIndex = (currentIndex + 1) % suggestions.length;
                this.highlightSuggestion(suggestions[currentIndex]);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                currentIndex = currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1;
                this.highlightSuggestion(suggestions[currentIndex]);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (currentHighlighted) {
                    this.selectSuggestion(currentHighlighted.textContent);
                }
                break;
                
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }
    
    validateBankInput() {
        const inputValue = this.bankInput.value.trim();
        
        if (!inputValue) {
            this.hideError();
            return true;
        }
        
        const isValid = this.bankList && Object.keys(this.bankList).some(bankName => 
            bankName.toLowerCase() === inputValue.toLowerCase()
        );
        
        if (!isValid) {
            this.showError('Please select a valid bank from the suggestions. Your input was not found in our records.');
            return false;
        }
        
        this.hideError();
        return true;
    }
    
    showError(message) {
        this.errorElement.textContent = message;
        this.errorElement.style.display = 'block';
        
        // Add error styling to input
        this.bankInput.style.borderColor = 'var(--error-color)';
    }
    
    hideError() {
        this.errorElement.style.display = 'none';
        this.bankInput.style.borderColor = '';
    }
    
    // Public method to validate bank input from form submission
    validate() {
        return this.validateBankInput();
    }
    
    // Public method to get bank code
    getBankCode() {
        const bankName = this.bankInput.value.trim();
        return this.bankList ? this.bankList[bankName] : null;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new BankSuggestions();
});