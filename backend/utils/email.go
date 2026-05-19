package utils

import (
	"fmt"
	"net/smtp"
	"os"
)

// SendResetEmail connects to SMTP and sends a custom recovery email
func SendResetEmail(to, token string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")

	if host == "" || port == "" || user == "" || pass == "" {
		return fmt.Errorf("SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables")
	}

	if from == "" {
		from = user
	}

	// Dynamic app URL configuration
	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:3000"
	}

	resetURL := fmt.Sprintf("%s/auth/reset-password?token=%s&email=%s", appURL, token, to)

	subject := "Subject: [Archeres] Reset Your Research Account Password\r\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\r\n\r\n"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a0f; color: #ffffff; padding: 2rem; margin: 0;">
			<div style="max-width: 500px; margin: 0 auto; background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2.5rem; box-shadow: 0 24px 64px rgba(0,0,0,0.6);">
				<h2 style="margin-top: 0; background: linear-gradient(135deg, #a78bfa 0%%, #38bdf8 100%%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 1.85rem; font-weight: 800; letter-spacing: -0.05em; margin-bottom: 1.5rem;">Archeres</h2>
				<p style="color: rgba(255,255,255,0.8); line-height: 1.6; font-size: 0.95rem; margin-bottom: 2rem;">
					We received a request to reset your Archeres account password. Click the button below to reset your password securely. This recovery link is valid for **15 minutes**.
				</p>
				<div style="text-align: center; margin: 2.5rem 0;">
					<a href="%s" style="background: linear-gradient(135deg, #7c3aed 0%%, #0891b2 100%%); color: #ffffff; text-decoration: none; padding: 0.85rem 1.75rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; display: inline-block; box-shadow: 0 8px 24px rgba(124,58,237,0.3); transition: all 0.2s ease;">
						Reset Your Password
					</a>
				</div>
				<p style="color: rgba(255,255,255,0.5); font-size: 0.8rem; line-height: 1.5; margin-bottom: 0;">
					If you did not request this, you can safely ignore this email. Your password will not change without your consent.
				</p>
				<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 2rem 0;">
				<p style="color: rgba(255,255,255,0.4); font-size: 0.75rem; line-height: 1.4; word-break: break-all; margin: 0;">
					Alternative link:<br>
					<a href="%s" style="color: #38bdf8; text-decoration: underline;">%s</a>
				</p>
			</div>
		</body>
		</html>
	`, resetURL, resetURL, resetURL)

	msg := []byte("To: " + to + "\r\n" + subject + mime + body)
	auth := smtp.PlainAuth("", user, pass, host)

	addr := fmt.Sprintf("%s:%s", host, port)
	err := smtp.SendMail(addr, auth, from, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send SMTP mail: %w", err)
	}

	return nil
}

// SendWelcomeEmail sends a welcome email to a newly registered user containing their recovery key
func SendWelcomeEmail(to, name, recoveryKey string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")

	if host == "" || port == "" || user == "" || pass == "" {
		return fmt.Errorf("SMTP configuration is missing")
	}

	if from == "" {
		from = user
	}

	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:3000"
	}

	loginURL := fmt.Sprintf("%s/auth/login", appURL)

	displayName := name
	// Check if the name looks like an E2EE encrypted base64 string
	if len(name) >= 20 {
		isEncrypted := true
		for _, char := range name {
			if char == ' ' {
				isEncrypted = false
				break
			}
		}
		if isEncrypted {
			// Fallback to email prefix
			for i, char := range to {
				if char == '@' {
					displayName = to[:i]
					break
				}
			}
		}
	}

	subject := "Subject: [Archeres] Welcome — Save Your Recovery Key\r\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\r\n\r\n"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a0f; color: #ffffff; padding: 2rem; margin: 0;">
			<div style="max-width: 520px; margin: 0 auto; background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2.5rem; box-shadow: 0 24px 64px rgba(0,0,0,0.6);">
				<h2 style="margin-top: 0; background: linear-gradient(135deg, #a78bfa 0%%, #38bdf8 100%%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 1.85rem; font-weight: 800; letter-spacing: -0.05em; margin-bottom: 0.5rem;">Archeres</h2>
				<p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-top: 0; margin-bottom: 2rem;">Research Assistant Platform</p>
				<p style="color: rgba(255,255,255,0.85); font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">Welcome, %s! 🎉</p>
				<p style="color: rgba(255,255,255,0.7); line-height: 1.6; font-size: 0.9rem; margin-bottom: 1.5rem;">
					Your Archeres account has been successfully created. Below is your unique <strong>Recovery Key</strong> used to restore access to your research vault if you forget your password.
				</p>
				<div style="background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.25); border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
					<p style="color: rgba(255,255,255,0.5); font-size: 0.75rem; margin: 0 0 0.5rem 0; text-transform: uppercase; letter-spacing: 0.08em;">Your Recovery Key</p>
					<code style="display: block; color: #a78bfa; font-family: 'Courier New', Courier, monospace; font-size: 0.85rem; word-break: break-all; line-height: 1.6;">%s</code>
				</div>
				<div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 8px; padding: 1rem; margin-bottom: 2rem;">
					<p style="color: #fca5a5; font-size: 0.82rem; margin: 0; line-height: 1.5;">
						⚠️ <strong>Save this key in a very secure place.</strong> This key cannot be recovered by our system. Do not share this key with anyone, including the Archeres team.
					</p>
				</div>
				<div style="text-align: center; margin-bottom: 2rem;">
					<a href="%s" style="background: linear-gradient(135deg, #7c3aed 0%%, #0891b2 100%%); color: #ffffff; text-decoration: none; padding: 0.85rem 1.75rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; display: inline-block; box-shadow: 0 8px 24px rgba(124,58,237,0.3);">
						Log in to Workspace
					</a>
				</div>
				<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 0;">
				<p style="color: rgba(255,255,255,0.35); font-size: 0.75rem; margin: 1.5rem 0 0 0; line-height: 1.5;">
					If you did not register this account, please ignore this email. No further action is required.
				</p>
			</div>
		</body>
		</html>
	`, displayName, recoveryKey, loginURL)

	msg := []byte("To: " + to + "\r\n" + subject + mime + body)
	auth := smtp.PlainAuth("", user, pass, host)

	addr := fmt.Sprintf("%s:%s", host, port)
	if err := smtp.SendMail(addr, auth, from, []string{to}, msg); err != nil {
		return fmt.Errorf("failed to send welcome email: %w", err)
	}

	return nil
}
