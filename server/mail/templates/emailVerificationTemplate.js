const otpTemplate = (otp) => {
	return `<!DOCTYPE html>
	<html>
	
	<head>
		<meta charset="UTF-8">
		<title>OTP Verification Email</title>
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
			
			.otp-code {
				font-size: 28px;
				font-weight: bold;
				color: #4F46E5;
				letter-spacing: 2px;
				margin: 20px 0;
				text-align: center;
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
				<div class="activity-icon">🔐</div>
				<div class="title">Account Verification</div>
			</div>
			
			<div class="message">
				<p>Hello there,</p>
				<p>Thank you for registering with FairShare. To complete your registration, please use the following OTP (One-Time Password) to verify your account:</p>
				
				<div class="otp-code">${otp}</div>
				
				<p>This OTP is valid for 5 minutes. If you did not request this verification, please disregard this email.</p>
				<p>Once your account is verified, you will have access to our platform and all its features.</p>
			</div>
			
			<div style="text-align: center;">
				<a href="https://fairshare.com/login" class="cta-button">Return to Login</a>
			</div>
			
			<div class="footer">
				<p>If you have any questions, please contact our support team.</p>
				<p class="signature">The FairShare Team</p>
			</div>
		</div>
	</body>
	
	</html>`;
};
module.exports = otpTemplate;
