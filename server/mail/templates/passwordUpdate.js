exports.passwordUpdated = (email, name) => {
	return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Password Update Confirmation</title>
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
            
            .email-highlight {
                font-weight: bold;
                color: #4F46E5;
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
                <div class="activity-icon">🔒</div>
                <div class="title">Password Updated Successfully</div>
            </div>
            
            <div class="message">
                <p>Hello ${name},</p>
                <p>Your password has been successfully updated for your account with email <span class="email-highlight">${email}</span>.</p>
                <p>If you did not request this password change, please contact our support team immediately to secure your account.</p>
            </div>
            
            <div style="text-align: center;">
                <a href="https://fairshare.com/login" class="cta-button">Go to Login</a>
            </div>
            
            <div class="footer">
                <p>If you have any questions, please contact our support team.</p>
                <p class="signature">The FairShare Team</p>
            </div>
        </div>
    </body>
    
    </html>`;
};
