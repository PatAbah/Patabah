class NotificationSystem {
    constructor() {
        this.zone = document.getElementById('notificationZone');
        this.checkNotifications();
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
        const message = notifications.map(n => n.message).join(' | ');
        this.zone.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${this.escapeHtml(message)}</div>
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