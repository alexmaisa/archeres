package utils

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"time"

	"archeres/backend/middleware"
	"github.com/golang-jwt/jwt/v5"
)

// GenerateRandomInt returns a secure random integer in [min, max]
func GenerateRandomInt(min, max int64) int64 {
	n, _ := rand.Int(rand.Reader, big.NewInt(max-min+1))
	return n.Int64() + min
}

// GenerateCaptcha returns a signed JWT token, the plain answer, and a customized distorted SVG string
func GenerateCaptcha() (string, string, string, error) {
	// 1. Generate numbers
	a := GenerateRandomInt(1, 9)
	b := GenerateRandomInt(1, 9)
	answer := fmt.Sprintf("%d", a+b)
	challenge := fmt.Sprintf("%d + %d = ?", a, b)

	// 2. Generate signed JWT token containing answer and expiration
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"ans": answer,
		"exp": time.Now().Add(5 * time.Minute).Unix(),
	})

	tokenString, err := token.SignedString(middleware.JWTSecret)
	if err != nil {
		return "", "", "", err
	}

	// 3. Generate a beautiful, highly distorted, responsive SVG
	// Using a viewport of 180x50 with randomized curves and dots
	svgWidth := 180
	svgHeight := 50

	// Draw base background and visual grid curves
	svg := fmt.Sprintf(`<svg viewBox="0 0 %d %d" width="100%%" height="100%%" xmlns="http://www.w3.org/2000/svg" style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); overflow: hidden; user-select: none;">`, svgWidth, svgHeight)

	// Add random noise paths (curved lines) to distort OCR
	for i := 0; i < 4; i++ {
		x1 := GenerateRandomInt(0, 40)
		y1 := GenerateRandomInt(10, 40)
		x2 := GenerateRandomInt(50, 100)
		y2 := GenerateRandomInt(10, 40)
		x3 := GenerateRandomInt(110, 180)
		y3 := GenerateRandomInt(10, 40)
		strokeColor := fmt.Sprintf("rgba(192, 132, 252, 0.%d)", GenerateRandomInt(15, 35)) // purple accent
		svg += fmt.Sprintf(`<path d="M %d %d Q %d %d %d %d" fill="none" stroke="%s" stroke-width="%d" />`, 
			x1, y1, x2, y2, x3, y3, strokeColor, GenerateRandomInt(1, 2))
	}

	// Add random dots noise
	for i := 0; i < 25; i++ {
		cx := GenerateRandomInt(5, 175)
		cy := GenerateRandomInt(5, 45)
		r := GenerateRandomInt(1, 3)
		dotColor := fmt.Sprintf("rgba(255, 255, 255, 0.%d)", GenerateRandomInt(1, 4))
		svg += fmt.Sprintf(`<circle cx="%d" cy="%d" r="%d" fill="%s" />`, cx, cy, r, dotColor)
	}

	// Draw characters individually with randomized rotation, font size, and translation
	chars := []rune(challenge)
	startX := 15
	spacing := 22

	for i, char := range chars {
		x := startX + (i * spacing)
		y := GenerateRandomInt(32, 38)
		rot := GenerateRandomInt(-12, 12)
		fontSize := GenerateRandomInt(22, 28)
		// Give operators or numbers slightly different colors
		color := "rgba(255, 255, 255, 0.85)"
		if char == '+' || char == '=' {
			color = "#c084fc" // brand purple accent
		} else if char == '?' {
			color = "#a855f7" // darker violet
		}
		svg += fmt.Sprintf(`<text x="%d" y="%d" font-size="%dpx" font-weight="bold" font-family="monospace, Courier" fill="%s" transform="rotate(%d %d %d)">%c</text>`, 
			x, y, fontSize, color, rot, x, y, char)
	}

	svg += "</svg>"

	return tokenString, answer, svg, nil
}

// VerifyCaptcha verifies the JWT token and the submitted answer
func VerifyCaptcha(tokenString string, submittedAnswer string) error {
	if tokenString == "" {
		return errors.New("Missing captcha verification token.")
	}
	if submittedAnswer == "" {
		return errors.New("Please solve the captcha verification puzzle.")
	}

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unsupported token signing method: %v", t.Header["alg"])
		}
		return middleware.JWTSecret, nil
	})

	if err != nil || !token.Valid {
		return errors.New("Captcha validation token has expired. Please refresh the captcha.")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return errors.New("Invalid captcha token claims.")
	}

	expectedAnswer, ok := claims["ans"].(string)
	if !ok {
		return errors.New("Malformed captcha token data.")
	}

	if expectedAnswer != submittedAnswer {
		return errors.New("Incorrect captcha verification answer. Please try again.")
	}

	return nil
}
