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

	subject := "Subject: [Archeres] Reset Sandi Akun Penelitian Anda\r\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\r\n\r\n"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a0f; color: #ffffff; padding: 2rem; margin: 0;">
			<div style="max-width: 500px; margin: 0 auto; background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2.5rem; box-shadow: 0 24px 64px rgba(0,0,0,0.6);">
				<h2 style="margin-top: 0; background: linear-gradient(135deg, #a78bfa 0%%, #38bdf8 100%%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 1.85rem; font-weight: 800; letter-spacing: -0.05em; margin-bottom: 1.5rem;">Archeres</h2>
				<p style="color: rgba(255,255,255,0.8); line-height: 1.6; font-size: 0.95rem; margin-bottom: 2rem;">
					Kami menerima permintaan untuk mengatur ulang kata sandi akun Archeres Anda. Klik tombol di bawah ini untuk mereset kata sandi Anda secara aman. Tautan pemulihan ini berlaku selama **15 menit**.
				</p>
				<div style="text-align: center; margin: 2.5rem 0;">
					<a href="%s" style="background: linear-gradient(135deg, #7c3aed 0%%, #0891b2 100%%); color: #ffffff; text-decoration: none; padding: 0.85rem 1.75rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; display: inline-block; box-shadow: 0 8px 24px rgba(124,58,237,0.3); transition: all 0.2s ease;">
						Reset Kata Sandi Anda
					</a>
				</div>
				<p style="color: rgba(255,255,255,0.5); font-size: 0.8rem; line-height: 1.5; margin-bottom: 0;">
					Jika Anda tidak mengajukan permohonan ini, Anda dapat mengabaikan email ini dengan aman. Kata sandi Anda tidak akan berubah tanpa persetujuan Anda.
				</p>
				<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 2rem 0;">
				<p style="color: rgba(255,255,255,0.4); font-size: 0.75rem; line-height: 1.4; word-break: break-all; margin: 0;">
					Tautan alternatif:<br>
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

	subject := "Subject: [Archeres] Selamat Datang — Simpan Kunci Pemulihan Anda\\r\\n"
	mime := "MIME-version: 1.0;\\nContent-Type: text/html; charset=\\\"UTF-8\\\";\\r\\n\\r\\n"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a0f; color: #ffffff; padding: 2rem; margin: 0;">
			<div style="max-width: 520px; margin: 0 auto; background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2.5rem; box-shadow: 0 24px 64px rgba(0,0,0,0.6);">
				<h2 style="margin-top: 0; background: linear-gradient(135deg, #a78bfa 0%%, #38bdf8 100%%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 1.85rem; font-weight: 800; letter-spacing: -0.05em; margin-bottom: 0.5rem;">Archeres</h2>
				<p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-top: 0; margin-bottom: 2rem;">Platform Asisten Penelitian</p>
				<p style="color: rgba(255,255,255,0.85); font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">Selamat datang, %s! 🎉</p>
				<p style="color: rgba(255,255,255,0.7); line-height: 1.6; font-size: 0.9rem; margin-bottom: 1.5rem;">
					Akun Archeres Anda telah berhasil dibuat. Berikut adalah <strong>Kunci Pemulihan</strong> unik Anda yang digunakan untuk memulihkan akses ke vault penelitian Anda jika Anda lupa kata sandi.
				</p>
				<div style="background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.25); border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
					<p style="color: rgba(255,255,255,0.5); font-size: 0.75rem; margin: 0 0 0.5rem 0; text-transform: uppercase; letter-spacing: 0.08em;">Kunci Pemulihan Anda</p>
					<code style="display: block; color: #a78bfa; font-family: 'Courier New', Courier, monospace; font-size: 0.85rem; word-break: break-all; line-height: 1.6;">%s</code>
				</div>
				<div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 8px; padding: 1rem; margin-bottom: 2rem;">
					<p style="color: #fca5a5; font-size: 0.82rem; margin: 0; line-height: 1.5;">
						⚠️ <strong>Simpan kunci ini di tempat yang sangat aman.</strong> Kunci ini tidak dapat dipulihkan kembali oleh sistem kami. Jangan bagikan kunci ini kepada siapa pun, termasuk tim Archeres.
					</p>
				</div>
				<div style="text-align: center; margin-bottom: 2rem;">
					<a href="%s" style="background: linear-gradient(135deg, #7c3aed 0%%, #0891b2 100%%); color: #ffffff; text-decoration: none; padding: 0.85rem 1.75rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; display: inline-block; box-shadow: 0 8px 24px rgba(124,58,237,0.3);">
						Masuk ke Workspace
					</a>
				</div>
				<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 0;">
				<p style="color: rgba(255,255,255,0.35); font-size: 0.75rem; margin: 1.5rem 0 0 0; line-height: 1.5;">
					Jika Anda tidak mendaftarkan akun ini, abaikan email ini. Tidak ada tindakan lebih lanjut yang diperlukan.
				</p>
			</div>
		</body>
		</html>
	`, name, recoveryKey, loginURL)

	msg := []byte("To: " + to + "\r\n" + subject + mime + body)
	auth := smtp.PlainAuth("", user, pass, host)

	addr := fmt.Sprintf("%s:%s", host, port)
	if err := smtp.SendMail(addr, auth, from, []string{to}, msg); err != nil {
		return fmt.Errorf("failed to send welcome email: %w", err)
	}

	return nil
}

