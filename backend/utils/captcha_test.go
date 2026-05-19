package utils

import (
	"strings"
	"testing"
	"time"

	"archeres/backend/middleware"
	"github.com/golang-jwt/jwt/v5"
)

func TestGenerateCaptcha(t *testing.T) {
	token, answer, svg, err := GenerateCaptcha()
	if err != nil {
		t.Fatalf("Failed to generate captcha: %v", err)
	}

	if token == "" {
		t.Error("Expected non-empty token")
	}

	if answer == "" {
		t.Error("Expected non-empty answer")
	}

	if svg == "" {
		t.Error("Expected non-empty SVG string")
	}

	if !strings.HasPrefix(svg, "<svg") || !strings.HasSuffix(svg, "</svg>") {
		t.Error("Expected valid SVG enclosing tags")
	}

	if !strings.Contains(svg, "+") || !strings.Contains(svg, "=") || !strings.Contains(svg, "?") {
		t.Error("Expected math puzzle characters inside SVG string")
	}
}

func TestVerifyCaptcha_Success(t *testing.T) {
	token, answer, _, err := GenerateCaptcha()
	if err != nil {
		t.Fatalf("Failed to generate captcha: %v", err)
	}

	err = VerifyCaptcha(token, answer)
	if err != nil {
		t.Errorf("Expected successful verification, got error: %v", err)
	}
}

func TestVerifyCaptcha_IncorrectAnswer(t *testing.T) {
	token, answer, _, err := GenerateCaptcha()
	if err != nil {
		t.Fatalf("Failed to generate captcha: %v", err)
	}

	wrongAnswer := answer + "1"
	err = VerifyCaptcha(token, wrongAnswer)
	if err == nil {
		t.Error("Expected error for incorrect answer, got nil")
	}

	if err.Error() != "Incorrect captcha verification answer. Please try again." {
		t.Errorf("Unexpected error message: %s", err.Error())
	}
}

func TestVerifyCaptcha_ExpiredToken(t *testing.T) {
	// Generate an expired token manually using middleware.JWTSecret
	expiredTokenClaim := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"ans": "10",
		"exp": time.Now().Add(-5 * time.Minute).Unix(),
	})

	token, err := expiredTokenClaim.SignedString(middleware.JWTSecret)
	if err != nil {
		t.Fatalf("Failed to sign expired token: %v", err)
	}

	err = VerifyCaptcha(token, "10")
	if err == nil {
		t.Error("Expected error for expired token, got nil")
	}

	if !strings.Contains(err.Error(), "expired") {
		t.Errorf("Expected expired message, got: %s", err.Error())
	}
}

func TestVerifyCaptcha_MissingInputs(t *testing.T) {
	err := VerifyCaptcha("", "10")
	if err == nil || err.Error() != "Missing captcha verification token." {
		t.Errorf("Expected missing token error, got: %v", err)
	}

	err = VerifyCaptcha("some-token", "")
	if err == nil || err.Error() != "Please solve the captcha verification puzzle." {
		t.Errorf("Expected missing answer error, got: %v", err)
	}
}
