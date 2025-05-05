exports.notificationEmail = (
    email,
    name,
    message,
    activityType = null,
    activity = null
) => {
    let title = 'Notification from FairShare';
    let buttonText = 'Go to FairShare';
    let buttonUrl = 'https://fairshare.com/dashboard';
    
    // If it's an activity-based notification
    if (activityType && activity) {
        // Customize button URL based on activity type
        if (activity.group) {
            buttonText = 'View Group';
            buttonUrl = `https://fairshare.com/groups/${activity.group}`;
        } else if (activity.expense) {
            buttonText = 'View Expense';
            buttonUrl = `https://fairshare.com/expenses/${activity.expense}`;
        } else if (activity.type === 'FRIEND_ADDED') {
            buttonText = 'View Friend';
            buttonUrl = `https://fairshare.com/friends`;
        }
    }
    
    const getActivityIcon = (type) => {
        switch(type) {
            case 'GROUP_ADDED': 
            case 'GROUP_CREATED':
            case 'GROUP_MEMBER_ADDED':
                return '👥';
            case 'EXPENSE_ADDED':
            case 'EXPENSE_UPDATED':
            case 'EXPENSE_DELETED':
                return '💰';
            case 'FRIEND_ADDED':
                return '👋';
            case 'MESSAGE_RECEIVED':
                return '💬';
            default:
                return '🔔';
        }
    };
    
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>FairShare Notification</title>
        <style>
            body {
                background-color: #f8f9fa;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.5;
                color: #333333;
                margin: 0;
                padding: 0;
            }
    
            .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 30px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
    
            .logo {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .logo img {
                max-width: 150px;
            }
    
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .activity-icon {
                font-size: 36px;
                margin-bottom: 10px;
            }
    
            .title {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin: 10px 0;
            }
    
            .message {
                background-color: #f5f7f9;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
                font-size: 18px;
                line-height: 1.6;
            }
    
            .cta-button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #4F46E5;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: bold;
                margin-top: 20px;
                text-align: center;
            }
    
            .footer {
                margin-top: 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
                border-top: 1px solid #eee;
                padding-top: 20px;
            }
            
            .signature {
                margin-top: 20px;
                font-style: italic;
            }
        </style>
    </head>
    
    <body>
        <div class="container">
            <div class="logo">
                <img src="https://i.ibb.co/MgNJwsB/fairshare-logo.png" alt="FairShare Logo">
            </div>
            
            <div class="header">
                <div class="activity-icon">${activityType ? getActivityIcon(activityType) : '🔔'}</div>
                <div class="title">FairShare Notification</div>
            </div>
            
            <div class="message">
                <p>Hello ${name},</p>
                <p>${message}</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${buttonUrl}" class="cta-button">${buttonText}</a>
            </div>
            
            <div class="footer">
                <p>If you have any questions, please contact our support team.</p>
                <p class="signature">The FairShare Team</p>
            </div>
        </div>
    </body>
    
    </html>`
}
  