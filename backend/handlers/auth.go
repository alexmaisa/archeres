package handlers

import (
	"crypto/rand"
	"encoding/hex"
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
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
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
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashedPassword),
		Role:     role,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save new user to database.",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Registration successful. Please sign in.",
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
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
		"role":  user.Role,
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
		// Log error but show a clear descriptive message
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Layanan pengiriman email saat ini tidak tersedia. Silakan hubungi admin atau coba lagi nanti.",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Instruksi pemulihan kata sandi telah dikirim ke email Anda.",
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
			"error": "Tautan reset tidak valid atau telah kedaluwarsa.",
		})
	}

	if user.ResetTokenExpiry == nil || time.Now().After(*user.ResetTokenExpiry) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Tautan reset telah kedaluwarsa (berlaku 15 menit). Silakan ajukan ulang.",
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
		"message": "Kata sandi Anda telah berhasil diperbarui. Silakan masuk.",
	})
}
