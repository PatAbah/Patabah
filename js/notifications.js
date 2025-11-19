class NotificationSystem {
    constructor() {
        this.zone = document.getElementById('notificationZone');
        if (this.zone) {
            this.checkNotifications();
        }
    }

    async checkNotifications() {
        try {
            const response = await fetch('/ajax/notifications/check');
            const result = await response.json();
            
            if (result.success && result.notifications.length > 0) {
                this.showNotifications(result.notifications);
            }
        } catch (error) {
            console.error('Notification check failed:', error);
        }
    }

    showNotifications(notifications) {
        const bellSvg = `<svg class="notification-bell" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>`;
        
        const message = notifications.map(n => n.message).join(' | ');
        this.zone.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">
                    ${bellSvg}
                    <span>${this.escapeHtml(message)}</span>
                </div>
                <button class="notification-ok" onclick="notificationSystem.markAsSeen()">OK</button>
            </div>
        `;
        this.zone.style.display = 'block';
    }

    async markAsSeen() {
        try {
            await fetch('/ajax/notifications/mark-seen', {method: 'POST'});
            this.zone.style.display = 'none';
        } catch (error) {
            console.error('Mark seen failed:', error);
            this.zone.style.display = 'none';
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
const notificationSystem = new NotificationSystem();