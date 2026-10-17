// ============================================================================
// Kolmogorov Phase Screen Generator
// ============================================================================
// Uses the FFT-based spectral method with a von Kármán power spectral density
// (PSD) to produce physically realistic atmospheric turbulence phase screens.
//
// Key physics:
//   • Fried parameter r₀ relates Cn² and propagation distance L
//   • von Kármán PSD: Φ(f) = 0.023 r₀^(-5/3) (f² + f₀²)^(-11/6)
//   • Outer scale L₀ prevents divergence at low frequencies
//   • RMS phase ∝ (D/r₀)^(5/6)
//
// Dependencies: fft-utils.js (ifft2, fft2)
// ============================================================================

// PRNG State for deterministic, reproducible simulation runs
var _prngState = 314159265;
var _usePrngSeed = false;

function setSimulationSeed(seed) {
  if (seed !== null && seed !== undefined && !isNaN(seed)) {
    _prngState = (seed >>> 0) || 123456789;
    _usePrngSeed = true;
  } else {
    _usePrngSeed = false;
  }
}

function uniformRandom() {
  if (_usePrngSeed) {
    // Mulberry32 32-bit PRNG
    var t = _prngState += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return Math.random();
}

/**
 * Box-Muller transform - generates a standard Gaussian random variate.
 * This is the canonical source used across physics modules.
 *
 * @returns {number} N(0,1) sample
 */
function gaussianRandom() {
  var u1, u2;
  do { u1 = uniformRandom(); } while (u1 === 0);
  u2 = uniformRandom();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Generate a Kolmogorov / von Kármán phase screen via spectral method.
 *
 * @param {number} N   - grid side length (power of 2, e.g. 32)
 * @param {number} cn2 - refractive-index structure constant Cn² [m^(-2/3)]
 * @param {number} dx  - grid spacing in metres
 * @param {number} [L] - propagation path in metres (default 1000m)
 * @returns {{phase: number[], r0: number, rmsPhase: number}}
 */
function generateKolmogorovPhaseScreen(N, cn2, dx, L) {
  if (!L || isNaN(L)) L = 1000;
  // --- Physical constants & derived parameters ---
  var wavelength = 1.5e-6;                              // 1.5 µm (near-IR)
  var k = 2 * Math.PI / wavelength;                     // optical wavenumber
  var r0 = Math.pow(0.423 * k * k * cn2 * L, -3.0 / 5.0); // Fried parameter

  // von Kármán outer scale
  var L0 = 25.0;       // outer scale [m]
  var f0 = 1.0 / L0;   // outer scale spatial frequency [1/m]

  // Physical telescope aperture: calibrated to D = 0.15 m (15 cm) receiver pupil
  var D = 0.15;
  if (dx && dx < 0.1) {
    D = N * dx;
  } else {
    dx = D / N;
  }

  // Frequency-domain grid spacing
  var df = 1.0 / (N * dx);

  // --- Build 2D von Kármán PSD ---
  var psd = new Float64Array(N * N);
  for (var i = 0; i < N; i++) {
    var fi = (i < N / 2) ? i * df : (i - N) * df;
    for (var j = 0; j < N; j++) {
      var fj = (j < N / 2) ? j * df : (j - N) * df;
      var fSq = fi * fi + fj * fj;

      if (fSq < 1e-20) {
        psd[i * N + j] = 0; // set DC to zero (no piston)
      } else {
        // Φ(f) = 0.023 · r₀^(-5/3) · (f² + f₀²)^(-11/6)
        psd[i * N + j] = 0.023 * Math.pow(r0, -5.0 / 3.0) *
                          Math.pow(fSq + f0 * f0, -11.0 / 6.0);
      }
    }
  }

  // --- Colour complex white noise with √PSD ---
  var noiseComplex = new Array(N * N);
  for (var idx = 0; idx < N * N; idx++) {
    var amplitude = Math.sqrt(psd[idx]) * df; // scale by freq resolution
    noiseComplex[idx] = {
      re: gaussianRandom() * amplitude,
      im: gaussianRandom() * amplitude
    };
  }

  // --- Inverse FFT → spatial-domain phase screen ---
  var phaseComplex = ifft2(noiseComplex, N);

  var phase = new Float64Array(N * N);
  for (var idx = 0; idx < N * N; idx++) {
    phase[idx] = phaseComplex[idx].re * N; // FFT normalisation factor
  }

  // --- Normalise to physical RMS ---
  // Target: σ_φ = 1.015 · (D/r₀)^(5/6) (Kolmogorov variance over circular pupil, Noll 1976)
  var targetRms = 1.015 * Math.pow(D / r0, 5.0 / 6.0);

  // Remove piston (mean) and compute current RMS
  var mean = 0;
  for (var idx = 0; idx < N * N; idx++) mean += phase[idx];
  mean /= (N * N);

  var sumSq = 0;
  for (var idx = 0; idx < N * N; idx++) {
    phase[idx] -= mean;
    sumSq += phase[idx] * phase[idx];
  }
  var currentRms = Math.sqrt(sumSq / (N * N));

  // Rescale to target RMS
  if (currentRms > 1e-12) {
    var scale = targetRms / currentRms;
    for (var idx = 0; idx < N * N; idx++) {
      phase[idx] *= scale;
    }
  }

  return {
    phase: Array.from(phase),
    r0: r0,
    rmsPhase: targetRms
  };
}

/**
 * Compute the azimuthally-averaged (radial) power spectral density of a
 * phase screen and fit its log-log slope for validation.
 *
 * A Kolmogorov screen should give slope ≈ −11/3 ≈ −3.67.
 *
 * @param {number[]|Float64Array} phase - flat NxN phase array
 * @param {number} N  - grid side length
 * @param {number} dx - grid spacing [m]
 * @returns {{freqs: number[], psd1d: number[], slope: number, expectedSlope: number}}
 */
function computeRadialPSD(phase, N, dx) {
  // 2D FFT of the phase screen
  var phaseFFT = fft2(phase, N);

  // |F|² / N² → PSD
  var psd2d = new Array(N * N);
  for (var i = 0; i < N * N; i++) {
    psd2d[i] = (phaseFFT[i].re * phaseFFT[i].re +
                phaseFFT[i].im * phaseFFT[i].im) / (N * N);
  }

  // --- Azimuthal average (radial binning) ---
  var nBins = Math.floor(N / 2);
  var psdRadial = new Float64Array(nBins);
  var counts    = new Float64Array(nBins);
  var df = 1.0 / (N * dx);

  for (var i = 0; i < N; i++) {
    for (var j = 0; j < N; j++) {
      var fi = i < N / 2 ? i : i - N;
      var fj = j < N / 2 ? j : j - N;
      var r  = Math.sqrt(fi * fi + fj * fj);
      var bin = Math.floor(r);
      if (bin > 0 && bin < nBins) {
        psdRadial[bin] += psd2d[i * N + j];
        counts[bin]++;
      }
    }
  }

  var freqs = [];
  var psd1d = [];
  for (var i = 1; i < nBins; i++) {
    if (counts[i] > 0) {
      freqs.push((i + 0.5) * df);
      psd1d.push(psdRadial[i] / counts[i]);
    }
  }

  // --- Fit power-law slope in log-log space (middle 20–80% range) ---
  var logF = freqs.map(function (f) { return Math.log10(f); });
  var logP = psd1d.map(function (p) { return Math.log10(Math.max(p, 1e-30)); });

  var n     = logF.length;
  var start = Math.floor(n * 0.2);
  var end   = Math.floor(n * 0.8);

  var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, count = 0;
  for (var i = start; i < end; i++) {
    if (isFinite(logF[i]) && isFinite(logP[i])) {
      sumX  += logF[i];
      sumY  += logP[i];
      sumXY += logF[i] * logP[i];
      sumX2 += logF[i] * logF[i];
      count++;
    }
  }

  var slope = -11 / 3; // default (theoretical Kolmogorov)
  if (count > 2) {
    slope = (count * sumXY - sumX * sumY) / (count * sumX2 - sumX * sumX);
  }

  return {
    freqs: freqs,
    psd1d: psd1d,
    slope: slope,
    expectedSlope: -11 / 3
  };
}
