package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"time"

	"archeres/backend/config"
	"archeres/backend/middleware"
	"archeres/backend/models"
	"archeres/backend/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// RegisterInput models the expected JSON parameters for user sign-up
type RegisterInput struct {
	Name          string `json:"name"`
	Email         string `json:"email"`
	Password      string `json:"password"`
	PasswordVault string `json:"passwordVault"` // AES-GCM wrapped MEK (password-derived key)
	RecoveryVault string `json:"recoveryVault"` // AES-GCM wrapped MEK (recovery-key-derived key)
	VaultSalt     string `json:"vaultSalt"`     // PBKDF2 salt (base64)
	RecoveryKey   string `json:"recoveryKey"`   // plaintext recovery key — sent to email, not stored
	CaptchaToken  string `json:"captchaToken"`
	CaptchaAnswer string `json:"captchaAnswer"`
}

// LoginInput models the expected JSON parameters for user sign-in
type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Register creates a new user in the SQLite database, dynamically making the first user an admin
func Register(c *fiber.Ctx) error {
	var input RegisterInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input data format.",
		})
	}

	// Verify Captcha Challenge
	if err := utils.VerifyCaptcha(input.CaptchaToken, input.CaptchaAnswer); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if input.Name == "" || input.Email == "" || input.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name, email, and password are required.",
		})
	}

	// Verify if the email is already in use
	var existingUser models.User
	if err := config.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "This email address is already registered.",
		})
	}

	// Hash password using bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to process password encryption.",
		})
	}

	// Check if this is the first registered user to dynamically assign admin role
	var count int64
	config.DB.Model(&models.User{}).Count(&count)

	role := "user"
	if count == 0 {
		role = "admin"
	}

	user := models.User{
		Name:          input.Name,
		Email:         input.Email,
		Password:      string(hashedPassword),
		Role:          role,
		PasswordVault: input.PasswordVault,
		RecoveryVault: input.RecoveryVault,
		VaultSalt:     input.VaultSalt,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save new user to database.",
		})
	}

	// Send welcome email (graceful — registration succeeds even if email fails)
	go func(email, name string) {
		if err := utils.SendWelcomeEmail(email, name); err != nil {
			log.Printf("[SMTP] Failed to send welcome email to %s: %v", email, err)
		} else {
			log.Printf("[SMTP] Welcome email successfully sent to %s", email)
		}
	}(user.Email, user.Name)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Registration successful. Please ensure you have securely saved your recovery key.",
	})
}

// Login validates user credentials, builds claims, and cookies the signed JWT
func Login(c *fiber.Ctx) error {
	var input LoginInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid login input format.",
		})
	}

	if input.Email == "" || input.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email and password are required.",
		})
	}

	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Incorrect email address or password.",
		})
	}

	// Validate hash match
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Incorrect email address or password.",
		})
	}

	// Build JWT Token (expires in 24 hours)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID": user.ID,
		"role":   user.Role,
		"exp":    time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(middleware.JWTSecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to issue security session token.",
		})
	}

	// Set HttpOnly cookie for CSRF-protected web access
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    tokenString,
		Expires:  time.Now().Add(time.Hour * 24),
		HTTPOnly: true,
		Secure:   false, // Set true when serving over HTTPS
		SameSite: "Lax",
		Path:     "/",
	})

	// Insert an anonymous, zero-identity login event for telemetry line charts
	config.DB.Create(&models.LoginTelemetry{})

	return c.JSON(fiber.Map{
		"message": "Authentication successful.",
		"token":   tokenString,
		"user": fiber.Map{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
		// E2EE vault data returned so the client can unwrap the MEK
		"passwordVault": user.PasswordVault,
		"vaultSalt":     user.VaultSalt,
	})
}

// Logout clears the HTTP-only JWT cookie
func Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour * 24), // Set expiry in past to delete
		HTTPOnly: true,
		Path:     "/",
	})

	return c.JSON(fiber.Map{
		"message": "Session ended. Logout successful.",
	})
}

// Me returns the active user session structure based on the parsed JWT claims
func Me(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User account not active or not found.",
		})
	}

	return c.JSON(fiber.Map{
		"id":           user.ID,
		"name":         user.Name,
		"email":        user.Email,
		"role":         user.Role,
		// E2EE vault data for client session refresh
		"passwordVault": user.PasswordVault,
		"vaultSalt":     user.VaultSalt,
	})
}

// ResetVaultInput models the expected JSON parameters for re-wrapping the MEK after a password reset
type ResetVaultInput struct {
	Email            string `json:"email"`
	NewPasswordVault string `json:"newPasswordVault"` // MEK re-wrapped with new password-derived key
	NewVaultSalt     string `json:"newVaultSalt"`     // New PBKDF2 salt
}

// ResetVault updates the passwordVault and vaultSalt after a successful password reset.
// Called from the recover-vault UI page after the user provides their recovery key.
func ResetVault(c *fiber.Ctx) error {
	var input ResetVaultInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input format.",
		})
	}

	if input.Email == "" || input.NewPasswordVault == "" || input.NewVaultSalt == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email, newPasswordVault, and newVaultSalt are required.",
		})
	}

	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found.",
		})
	}

	user.PasswordVault = input.NewPasswordVault
	user.VaultSalt = input.NewVaultSalt

	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update vault.",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Vault updated successfully. Please sign in with your new password.",
	})
}

// ForgotPasswordInput models the expected JSON parameter for requesting a reset link
type ForgotPasswordInput struct {
	Email string `json:"email"`
}

// ResetPasswordInput models the expected JSON parameters for updating the password with a token
type ResetPasswordInput struct {
	Email       string `json:"email"`
	Token       string `json:"token"`
	NewPassword string `json:"newPassword"`
}

func generateRandomToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// ForgotPassword handles account recovery, generating a reset token and sending an email
func ForgotPassword(c *fiber.Ctx) error {
	var input ForgotPasswordInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input format.",
		})
	}

	if input.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email address is required.",
		})
	}

	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		// Secure account enumeration prevention
		return c.JSON(fiber.Map{
			"message": "Jika email terdaftar di sistem kami, instruksi pemulihan telah dikirim.",
		})
	}

	token, err := generateRandomToken()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate security token.",
		})
	}

	expiry := time.Now().Add(time.Minute * 15)
	user.ResetToken = &token
	user.ResetTokenExpiry = &expiry

	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save recovery token.",
		})
	}

	// Trigger email transmission
	if err := utils.SendResetEmail(user.Email, token); err != nil {
		// Log error to console so developers can see the token in development
		fmt.Printf("\n[DEVELOPMENT RESET TOKEN] Email: %s, Token: %s\n\n", user.Email, token)
		
		if os.Getenv("SMTP_HOST") == "" {
			return c.JSON(fiber.Map{
				"message": "Password recovery instructions created (development mode). Please check server logs for your token.",
				"devToken": token,
			})
		}
		
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Email delivery service is currently unavailable. Please contact an administrator or try again later.",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Password recovery instructions have been sent to your email.",
	})
}

// ResetPassword validates the recovery token and updates the user's password
func ResetPassword(c *fiber.Ctx) error {
	var input ResetPasswordInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input format.",
		})
	}

	if input.Email == "" || input.Token == "" || input.NewPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email, token, and new password are required.",
		})
	}

	var user models.User
	if err := config.DB.Where("email = ? AND reset_token = ?", input.Email, input.Token).First(&user).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid or expired reset link.",
		})
	}

	if user.ResetTokenExpiry == nil || time.Now().After(*user.ResetTokenExpiry) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Reset link has expired (valid for 15 minutes). Please request a new one.",
		})
	}

	// Encrypt the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to encrypt new password.",
		})
	}

	// Clear reset token fields
	user.Password = string(hashedPassword)
	user.ResetToken = nil
	user.ResetTokenExpiry = nil

	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update password in database.",
		})
	}

	return c.JSON(fiber.Map{
		"message":       "Your password has been successfully updated.",
		"recoveryVault": user.RecoveryVault,
		"vaultSalt":     user.VaultSalt,
	})
}

// GetCaptcha generates a new cryptographic math challenge and returns its SVG + token
func GetCaptcha(c *fiber.Ctx) error {
	token, _, svg, err := utils.GenerateCaptcha()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate captcha puzzle.",
		})
	}
	return c.JSON(fiber.Map{
		"captchaToken": token,
		"captchaSvg":   svg,
	})
}
