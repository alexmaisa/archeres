package handlers

import (
	"time"

	"arche/backend/config"
	"arche/backend/middleware"
	"arche/backend/models"
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
