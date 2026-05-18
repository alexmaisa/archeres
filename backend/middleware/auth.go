package middleware

import (
	"fmt"
	"os"
	"strings"

	"archeres/backend/config"
	"archeres/backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// JWTSecret is the secret key used for signing session tokens
var JWTSecret = []byte(getSecret())

func getSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "supersecretjwtkeyforarcheres2026"
	}
	return secret
}

// JWTMiddleware validates the JWT token from browser cookies or Authorization header
func JWTMiddleware(c *fiber.Ctx) error {
	tokenString := c.Cookies("token")
	if tokenString == "" {
		authHeader := c.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if tokenString == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Access denied. Please log in first.",
		})
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unsupported token signing method: %v", token.Header["alg"])
		}
		return JWTSecret, nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid or expired session. Please log in again.",
		})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid session token claims.",
		})
	}

	userIDFloat, ok := claims["userID"].(float64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User ID not found in session token.",
		})
	}

	role, _ := claims["role"].(string)
	userID := uint(userIDFloat)

	// Verify that the user still exists in the database to prevent session hijacking/stale sessions
	var user models.User
	if err := config.DB.Select("id, role").First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid session. User not found in system.",
		})
	}

	// Double check that the role hasn't changed in the database to prevent privilege escalation
	if user.Role != role {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User role has changed. Please log in again.",
		})
	}

	c.Locals("userID", userID)
	c.Locals("userRole", user.Role)

	return c.Next()
}

// AdminMiddleware blocks request if the authenticated user is not an administrator
func AdminMiddleware(c *fiber.Ctx) error {
	role := c.Locals("userRole")
	if role != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Access denied. This page or feature is only accessible by Administrators.",
		})
	}
	return c.Next()
}
