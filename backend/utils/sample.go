package utils

import (
	"math"
)

// CalculateSlovin implements the Taro Yamane / Slovin formula: n = N / (1 + N * e^2)
func CalculateSlovin(N int, e float64) int {
	if N <= 0 || e <= 0 {
		return 0
	}
	denominator := 1.0 + float64(N)*(e*e)
	return int(math.Ceil(float64(N) / denominator))
}

// CalculateCochran implements Cochran's formula for infinite populations: n0 = (Z^2 * p * q) / e^2
func CalculateCochran(z float64, p float64, e float64) int {
	if e <= 0 || p < 0 || p > 1 {
		return 0
	}
	q := 1.0 - p
	return int(math.Ceil((z * z * p * q) / (e * e)))
}

// CalculateLemeshow implements WHO Lemeshow's formula for known and unknown populations.
// Unknown population uses infinite Cochran. Known population applies finite correction: n = n0 / (1 + (n0 - 1) / N)
func CalculateLemeshow(z float64, P float64, d float64, N int) int {
	n0 := CalculateCochran(z, P, d)
	if N <= 0 {
		return n0
	}
	denominator := 1.0 + (float64(n0-1) / float64(N))
	return int(math.Ceil(float64(n0) / denominator))
}

// CalculateKrejcieMorgan implements the Krejcie & Morgan formula:
// s = (X^2 * N * P * (1-P)) / (d^2 * (N-1) + X^2 * P * (1-P))
func CalculateKrejcieMorgan(N int, confidenceLevel float64, d float64) int {
	if N <= 0 || d <= 0 {
		return 0
	}
	// Chi-square for 1 degree of freedom: 95% -> 3.841, 99% -> 6.635
	chiSquare := 3.841
	if confidenceLevel == 99 {
		chiSquare = 6.635
	}
	P := 0.5 // Default proportion for maximum sample size
	numerator := chiSquare * float64(N) * P * (1.0 - P)
	denominator := (d * d * float64(N-1)) + (chiSquare * P * (1.0 - P))
	return int(math.Ceil(numerator / denominator))
}

// CalculateYamane is mathematically identical to Slovin's formula
func CalculateYamane(N int, d float64) int {
	return CalculateSlovin(N, d)
}

// CalculateDaniel implements Daniel's simple random sampling for estimating proportions
func CalculateDaniel(z float64, p float64, d float64, N int) int {
	return CalculateLemeshow(z, p, d, N)
}

// CalculateIsaacMichael implements the Isaac & Michael (1981) formula.
// Identical structure to Krejcie-Morgan but allows 1%, 5%, and 10% significance levels.
func CalculateIsaacMichael(N int, errorRate float64) int {
	if N <= 0 || errorRate <= 0 {
		return 0
	}

	var chiSquare float64
	// Map common error rates to chi-square values (df=1)
	if errorRate <= 0.01 {
		chiSquare = 6.635 // 1% error
	} else if errorRate <= 0.05 {
		chiSquare = 3.841 // 5% error
	} else {
		chiSquare = 2.706 // 10% error
	}

	P := 0.5 // Default proportion for maximum sample size
	numerator := chiSquare * float64(N) * P * (1.0 - P)
	denominator := (errorRate * errorRate * float64(N-1)) + (chiSquare * P * (1.0 - P))
	return int(math.Ceil(numerator / denominator))
}

// CalculateArikunto implements Suharsimi Arikunto's rule of thumb.
// If N < 100, use total sampling (N). Else, use the specified percentage (usually 10-25%).
func CalculateArikunto(N int, percent float64) int {
	if N <= 0 {
		return 0
	}
	if N < 100 {
		return N
	}
	if percent <= 0 || percent > 1.0 {
		percent = 0.10 // Default to 10% if invalid
	}
	return int(math.Ceil(float64(N) * percent))
}

// CalculateGayDiehl implements Gay & Diehl (1992) rule of thumb based on design type.
func CalculateGayDiehl(designType string, N int, numVariables int) int {
	switch designType {
	case "Correlational":
		return 30
	case "Experimental", "Quasi-Experimental", "Causal-Comparative":
		return 60 // Assume minimum 30 per group for 2 groups
	case "Survey / Descriptive":
		if N <= 0 {
			return 100
		}
		// 10% of population
		sample := int(math.Ceil(float64(N) * 0.10))
		// If population is small (< 1000), typically 20% is recommended
		if N < 1000 {
			sample = int(math.Ceil(float64(N) * 0.20))
		}
		if sample > N {
			return N
		}
		return sample
	default:
		if numVariables > 0 {
			return 10 * numVariables
		}
		return 30 // Safe baseline
	}
}

// CalculateKishLeslie is mathematically identical to Cochran's formula for infinite populations.
func CalculateKishLeslie(z float64, p float64, e float64) int {
	return CalculateCochran(z, p, e)
}
