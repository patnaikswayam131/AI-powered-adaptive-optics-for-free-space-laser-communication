// ============================================================================
// Zernike Polynomial Module
// ============================================================================
// Generates Noll-ordered Zernike basis functions on a circular aperture and
// projects arbitrary phase screens onto them for modal decomposition.
//
// Key physics:
//   • Zernike polynomials are the natural orthogonal basis on a unit disk
//   • Low-order modes correspond to classical aberrations (tip, tilt, defocus …)
//   • Noll ordering is the standard in adaptive optics literature
//   • Modal coefficients provide physically interpretable wavefront description
//
// This replaces ad-hoc coefficient extraction with proper inner-product
// projection (fixes Flaw 7).
// ============================================================================

// --- Human-readable names for the first 15 Noll-ordered modes ---
var ZERNIKE_NAMES = [
  'Piston',                 // j = 1
  'Tip (Y)',                // j = 2
  'Tilt (X)',               // j = 3
  'Defocus',                // j = 4
  'Astig (45°)',            // j = 5
  'Astig (0°)',             // j = 6
  'Coma (Y)',               // j = 7
  'Coma (X)',               // j = 8
  'Trefoil (Y)',            // j = 9
  'Trefoil (X)',            // j = 10
  'Spherical',              // j = 11
  'Secondary Astig (Y)',    // j = 12
  'Secondary Astig (X)',    // j = 13
  'Secondary Coma (Y)',     // j = 14
  'Secondary Coma (X)'     // j = 15
];

// Pre-computed (n, m) radial and azimuthal orders for Noll indices 1–15
var ZERNIKE_NM = [
  [0,  0],   // j=1:  Piston
  [1,  1],   // j=2:  Tip
  [1, -1],   // j=3:  Tilt
  [2,  0],   // j=4:  Defocus
  [2, -2],   // j=5:  Astigmatism (oblique)
  [2,  2],   // j=6:  Astigmatism (vertical)
  [3, -1],   // j=7:  Coma (vertical)
  [3,  1],   // j=8:  Coma (horizontal)
  [3, -3],   // j=9:  Trefoil (vertical)
  [3,  3],   // j=10: Trefoil (oblique)
  [4,  0],   // j=11: Spherical
  [4,  2],   // j=12: Secondary Astigmatism
  [4, -2],   // j=13: Secondary Astigmatism
  [4,  4],   // j=14: Quadrafoil
  [4, -4]    // j=15: Quadrafoil
];

/**
 * Compute n! (factorial).
 * @param {number} n — non-negative integer
 * @returns {number}
 */
function factorial(n) {
  if (n <= 1) return 1;
  var result = 1;
  for (var i = 2; i <= n; i++) result *= i;
  return result;
}

/**
 * Evaluate the radial polynomial R_n^|m|(ρ).
 *
 * @param {number} n   — radial order
 * @param {number} m   — azimuthal order
 * @param {number} rho — radial coordinate (0 ≤ ρ ≤ 1)
 * @returns {number}
 */
function zernikeRadial(n, m, rho) {
  var absM = Math.abs(m);
  if ((n - absM) % 2 !== 0) return 0; // undefined for odd (n − |m|)

  var result = 0;
  var kMax = (n - absM) / 2;
  for (var k = 0; k <= kMax; k++) {
    var sign = (k % 2 === 0) ? 1 : -1;
    var num = factorial(n - k);
    var den = factorial(k) *
              factorial((n + absM) / 2 - k) *
              factorial((n - absM) / 2 - k);
    result += sign * (num / den) * Math.pow(rho, n - 2 * k);
  }
  return result;
}

/**
 * Generate a single Zernike mode Z_n^m on an NxN pixel grid.
 * The mode is normalised to unit RMS over the unit circle.
 *
 * @param {number} N — grid side length
 * @param {number} n — radial order
 * @param {number} m — azimuthal order
 * @returns {number[]} — flat NxN array
 */
function generateZernikeMode(N, n, m) {
  var mode = new Float64Array(N * N);
  var cx = (N - 1) / 2;
  var cy = (N - 1) / 2;
  var radius = N / 2; // map grid to unit circle

  for (var i = 0; i < N; i++) {
    for (var j = 0; j < N; j++) {
      var x = (j - cx) / radius;
      var y = (i - cy) / radius;
      var rho   = Math.sqrt(x * x + y * y);
      var theta = Math.atan2(y, x);

      if (rho <= 1.0) {
        var R = zernikeRadial(n, m, rho);
        if (m > 0) {
          mode[i * N + j] = R * Math.cos(m * theta);
        } else if (m < 0) {
          mode[i * N + j] = R * Math.sin(-m * theta);
        } else {
          mode[i * N + j] = R;
        }
      }
      // pixels outside unit circle remain 0
    }
  }

  // --- Normalise to unit RMS over the aperture ---
  var sumSq = 0;
  var count = 0;
  for (var i = 0; i < N; i++) {
    for (var j = 0; j < N; j++) {
      var x = (j - cx) / radius;
      var y = (i - cy) / radius;
      if (x * x + y * y <= 1.0) {
        sumSq += mode[i * N + j] * mode[i * N + j];
        count++;
      }
    }
  }
  var rms = Math.sqrt(sumSq / (count || 1));
  if (rms > 1e-12) {
    for (var k = 0; k < N * N; k++) mode[k] /= rms;
  }

  return Array.from(mode);
}

// --- Basis cache to avoid redundant recomputation ---
var _zernikeBasisCache = null;
var _zernikeBasisN = 0;
var _zernikeBasisModes = 0;

/**
 * Generate (or retrieve cached) Zernike basis set.
 *
 * @param {number} N        — grid side length
 * @param {number} numModes — number of Noll-ordered modes
 * @returns {Array<number[]>} — array of numModes flat NxN arrays
 */
function generateZernikeBasis(N, numModes) {
  if (_zernikeBasisCache &&
      _zernikeBasisN === N &&
      _zernikeBasisModes === numModes) {
    return _zernikeBasisCache;
  }

  var basis = [];
  for (var j = 0; j < numModes; j++) {
    var nm = ZERNIKE_NM[j];
    basis.push(generateZernikeMode(N, nm[0], nm[1]));
  }

  _zernikeBasisCache = basis;
  _zernikeBasisN     = N;
  _zernikeBasisModes = numModes;
  return basis;
}

/**
 * Project a phase screen onto the Zernike basis via inner product.
 *
 * @param {number[]|Float64Array} phase — flat NxN phase array
 * @param {number} N        — grid side length
 * @param {number} [numModes=15] — number of Zernike modes
 * @returns {number[]} — array of modal coefficients
 */
function projectOntoZernike(phase, N, numModes) {
  if (!numModes) numModes = 15;
  var basis  = generateZernikeBasis(N, numModes);
  var cx     = (N - 1) / 2;
  var cy     = (N - 1) / 2;   // ← fixed: was missing in original spec
  var radius = N / 2;

  // Count pixels inside the unit-circle aperture
  var apertureCount = 0;
  for (var i = 0; i < N; i++) {
    for (var j = 0; j < N; j++) {
      var x = (j - cx) / radius;
      var y = (i - cy) / radius;
      if (x * x + y * y <= 1.0) apertureCount++;
    }
  }

  // Inner product of phase with each basis mode
  var coefficients = new Array(numModes);
  for (var m = 0; m < numModes; m++) {
    var dot = 0;
    for (var k = 0; k < N * N; k++) {
      dot += phase[k] * basis[m][k];
    }
    coefficients[m] = dot / (apertureCount || 1);
  }

  return coefficients;
}

/**
 * Reconstruct a phase screen from Zernike coefficients.
 *
 * @param {number[]} coeffs — modal coefficients
 * @param {number} N — grid side length
 * @returns {number[]} — flat NxN phase array
 */
function reconstructFromZernike(coeffs, N) {
  var numModes = coeffs.length;
  var basis = generateZernikeBasis(N, numModes);
  var result = new Float64Array(N * N);

  for (var m = 0; m < numModes; m++) {
    for (var k = 0; k < N * N; k++) {
      result[k] += coeffs[m] * basis[m][k];
    }
  }

  return Array.from(result);
}
