# Architecture & Scientific Decisions Record (ADR)
**Project:** SHYENA — AI-Powered Adaptive Optics for Laser Communication in Turbulent Air  
**Authors:** Palantala Shreya, G. Manisha Patra, Swayam Satwik Patnaik, Parag Mohapatra  
**Supervisor:** Dr. Ratikanta Nayak, Department of Physics, NIST University  
**Date:** October 2026  

---

## 1. Context and Problem Statement
The goal is to provide a browser-based, research-grade, scientifically honest interactive showcase for the B.Tech project *AI-Powered Adaptive Optics for Laser Communication in Turbulent Air*. 
The project bridges atmospheric physics (Kolmogorov turbulence, Fraunhofer diffraction, Shack-Hartmann wavefront sensing) and machine learning (Linear and Ridge Regression, Zernike mode decomposition, and conceptual Reinforcement Learning).

To meet the design requirements of `DESIGN.md`, the visual fidelity of `adaptive-optics-website-mockup.png`, and the scientific integrity constraints of the submitted report `team shyena.pdf`, this document records all core architecture and implementation decisions.

---

## 2. Decision Log

### ADR-001: Physical Simulation Framework & Kolmogorov Turbulence
- **Status:** Accepted & Implemented
- **Context:** The original code excerpt in the project report used a simplified sinusoidal phase screen with additive noise. `DESIGN.md` mandates that all physical simulations must use a genuine numerical model or be explicitly labeled.
- **Decision:** Implement a true 2D Fast Fourier Transform (FFT) spectral method using the von Kármán power spectral density (PSD):
  $$\Phi(f) = 0.023 \, r_0^{-5/3} (f^2 + f_0^2)^{-11/6}$$
  where $r_0 = (0.423 \, k^2 \, C_n^2 \, L)^{-3/5}$ is the Fried parameter, $k = 2\pi/\lambda$ ($\lambda = 1.5\,\mu\text{m}$ near-IR laser), $L$ is propagation distance, and $L_0 = 25\,\text{m}$ is the outer scale preventing low-frequency divergence.
- **Consequences:** Provides physically calibrated turbulence that exhibits the exact Kolmogorov $f^{-11/3}$ power-law decay, verified in real-time via radial PSD log-log analysis.

---

### ADR-002: Optical Propagation & Closed-Loop Beam Correction
- **Status:** Accepted & Implemented
- **Context:** The mockup (`adaptive-optics-website-mockup.png`) shows four synchronized views: *Distorted Intensity*, *Distorted Phase*, *Estimated Correction*, and *Corrected Intensity*. Previously, intensity was generated in an open-loop fashion without computing the optical field after wavefront subtraction.
- **Decision:** Implement a rigorous Fraunhofer diffraction propagation model:
  1. **Distorted Field:** $E_{\text{dist}}(r) = A(r) \cdot \exp(i \, \varphi_{\text{dist}}(r))$, where $A(r)$ is a Gaussian pupil beam.
  2. **Distorted Far-Field:** $I_{\text{dist}} = |\mathcal{F}\{E_{\text{dist}}\}|^2$, yielding realistic speckle and beam wander.
  3. **Wavefront Correction:** $\varphi_{\text{corr}}(r) = \varphi_{\text{dist}}(r) - \hat{\varphi}_{\text{pred}}(r)$, simulating the phase subtraction achieved by a deformable mirror.
  4. **Corrected Far-Field:** $E_{\text{corr}}(r) = A(r) \cdot \exp(i \, \varphi_{\text{corr}}(r)) \implies I_{\text{corr}} = |\mathcal{F}\{E_{\text{corr}}\}|^2$.
- **Consequences:** Computes genuine Strehl ratio improvements, beam radius reduction ($\sigma_r$), phase RMSE, and SNR gain directly from physical field propagation.

---

### ADR-003: Shack-Hartmann Sensing & Zernike Mode Projection
- **Status:** Accepted & Implemented
- **Context:** The ML model requires physically plausible features and targets, rather than single-pixel uncoupled values.
- **Decision:** 
  - **Features ($X$):** Divide the pupil into $4 \times 4$ subapertures. Compute local spatial phase gradients (slopes) in $x$ and $y$ across each subaperture, producing $2 \times 4^2 = 32$ slope features per realization.
  - **Targets ($y$):** Project the continuous phase screen onto an orthogonal Zernike polynomial basis (15 modes, Noll indexing: tip, tilt, defocus, astigmatism, coma, spherical, trefoil).
- **Consequences:** Matches the operational principles of real adaptive optics hardware, where sensor spot displacements measure average wave gradients and mirror actuators compensate low-order Zernike aberrations.

---

### ADR-004: Independent Realization Split & Model Regularization
- **Status:** Accepted & Implemented
- **Context:** `DESIGN.md` highlights that flattening pixels from a single image into train/test sets violates the independent and identically distributed (i.i.d.) assumption and produces pseudo-accuracy.
- **Decision:** 
  - Generate $N$ completely independent atmospheric realizations ($N \in [10, 200]$).
  - Perform an 75%/25% realization-level train/test split.
  - Solve the regression models using closed-form normal equations:
    $$\hat{\beta} = (X_{\text{train}}^T X_{\text{train}} + \alpha I)^{-1} X_{\text{train}}^T y_{\text{train}}$$
    where $\alpha = 0$ (or $10^{-8}$) corresponds to Ordinary Least Squares (Linear Regression), and $\alpha > 0$ introduces $L_2$ regularization (Ridge Regression).
  - All test metrics (RMSE, $R^2$) are calculated exclusively on the held-out realization set.
- **Consequences:** Eliminates data leakage and accurately measures the generalization gap between train and test scenarios.

---

### ADR-005: Reconciliation with Project Report Benchmark Values
- **Status:** Accepted & Implemented
- **Context:** Page 31 of *team shyena.pdf* reports:
  - Linear Regression RMSE: **0.3285** rad
  - Ridge Regression RMSE: **0.2910** rad (a ~11.4% improvement)
- **Decision:** Display the report's published values as the official benchmark standard, and allow visitors to verify these numbers live in the browser using the same parameterization ($C_n^2 = 1.0 \times 10^{-13}$, $N = 50$, $\alpha = 10$).
- **Consequences:** Transparently links the published experimental findings to the live client-side simulator.

---

### ADR-006: Apple Liquid Glass & Scientific Visual Design
- **Status:** Accepted & Implemented
- **Context:** The site must conform to `DESIGN.md` and match the visual standard of `adaptive-optics-website-mockup.png`.
- **Decision:**
  - Build an Apple-inspired Liquid Glass interface utilizing deep dark backgrounds (`#070D16`), translucent glass surfaces (`rgba(18, 31, 47, 0.66)` with `backdrop-filter: blur(16px)`), hairline borders (`rgba(190, 211, 235, 0.16)`), and laser cyan/violet accentuation.
  - Replace the generic hero background with an interactive, animated **Optical Bench** showing the transmitter, turbulence chamber, deformable mirror, and receiver Airy disk.
  - Implement a 4-panel interactive layout with tabbed navigation: *Beam Intensity*, *Wavefront Phase*, *FFT Spectrum*, and *Comparison*.
  - Provide full accessibility with `@media (prefers-reduced-motion: reduce)`, WCAG AA contrast compliance, keyboard focus outlines, and responsive layouts across desktop, tablet, and mobile.

---

### ADR-007: Scientific Honesty and RL Classification
- **Status:** Accepted & Implemented
- **Context:** Reinforcement Learning is proposed in the report for dynamic mirror control, but the experimental section focused on regression and error maps.
- **Decision:** Explicitly mark Reinforcement Learning as **Planned / Conceptual** in the methods and control selectors, adhering to the *Scientific Integrity Rule* of `DESIGN.md`. Never display simulated graphics as live hardware sensor telemetry.
- **Consequences:** Preserves research credibility and eliminates false claims of physical hardware integration.

---

### ADR-008: Interactivity, Repeatability & Data Export
- **Status:** Accepted & Implemented
- **Context:** Visitors, faculty reviewers, and recruiters require verifiable and reproducible results.
- **Decision:**
  - Equip the simulator with:
    1. **Seed Control & Run ID:** Generates copyable run identifiers with deterministic pseudorandom generation.
    2. **Reset Defaults:** Returns all sliders and selectors to benchmark conditions in one click.
    3. **Export Results:** Downloads complete simulation artifacts as formatted JSON and CSV arrays (inputs, outputs, metrics, and timestamps).
    4. **Turbulence Presets:** One-click toggles for *Weak* ($10^{-14}$), *Moderate* ($10^{-13}$), and *Strong* ($10^{-12}$) turbulence.
- **Consequences:** Ensures complete auditability and instant reproducibility for any simulation run.

---

### ADR-009: Transition to Warm Editorial Optics Laboratory Design System
- **Status:** Accepted & Implemented
- **Context:** The initial prototype utilized dark navy backgrounds, cyan glowing lines, and generic multi-color dashboard cards. User guidance and visual benchmarking against optical research publications required transitioning to an authentic *Editorial Optics Laboratory* aesthetic inspired by Apple Liquid Glass material principles.
- **Decision:**
  - **Single Cohesive Warm Palette:** Replaced all dark navy/cyan themes with `#F3EEE7` (warm editorial canvas), `#EAE2D8` (secondary), `#FBF8F2` (solid surfaces), `#29251F` (graphite typography), `#A87543` (optical bronze), and `#D8B994` (champagne highlights). Discontinued the dark/light mode toggle in favor of this dedicated identity.
  - **Restrained Translucent Glass:** Implemented `backdrop-filter: blur(16px-20px)` with hair-line borders `rgba(75, 64, 49, 0.16)` and upper-edge highlights without excessive nested cards.
  - **Solid Instrument Controls:** Eliminated all gradient buttons and glowing outlines. Primary actions utilize solid graphite fills (`#29251F`), secondary actions use translucent bordered surfaces, and sliders feature solid graphite thumb hardware.
  - **Subtle Laboratory Dust Particles:** Replaced connected network constellations with microscopic Brownian optical dust particles drifting in warm laboratory illumination.
  - **Synchronized Optical Bench Hero:** Integrated photorealistic bench apparatus with live overlay rendering laser propagation, turbulence phase ripples, and receiver Airy diffraction rings.
  - **Warm Scientific Plotly Styling:** Configured all Plotly heatmaps and line plots with `#FBF8F2` backgrounds, graphite text, and clean coordinate axes (-50 to +50 px).
- **Consequences:** Elevates the project from a generic tech demo to a high-credibility, architecturally grounded scientific publication showcase.

---

### ADR-010: Layout Overflow Prevention, Pure Pill Navigation, and Visual Cleanliness
- **Status:** Accepted & Implemented
- **Context:** Following the visual overhaul, several layout and aesthetic issues were identified:
  1. The Wavefront Phase and FFT Spectrum subplots expanded beyond the right boundary of the display card due to unconstrained grid tracks (`1fr 1fr`).
  2. The navigation bar had an outer rectangular header shadow behind the floating pill.
  3. The hero optical bench contained an artificial canvas vector overlay that detracted from the generated laboratory photograph.
  4. Buttons, badges, and toggle texts contained unicode symbols and emojis.
- **Decision:**
  - **CSS Grid Containment (`.grid-2-plots`):** Replaced inline grid styles with `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; width: 100%; box-sizing: border-box;` and added `min-width: 0; max-width: 100%; overflow: hidden;` to `.plot-cell-large`. Integrated staggered `Plotly.Plots.resize()` in `switchTab()` so charts instantly conform to container width.
  - **Floating Pill Only:** Enforced `.nav { background: transparent !important; border: none !important; box-shadow: none !important; }` and eliminated full-width scroll shadows, preserving only `.nav-inner` as a floating glass pill.
  - **Pure Photorealistic Hero Image:** Removed `<canvas id="hero-bench-canvas">` and associated animation code; displayed only `assets/hero-bench.jpg`.
  - **Clean Typography & Zero Emojis:** Loaded Google Fonts `Inter` for clean, high-legibility UI typography, replacing arrows and emojis with clean text on all buttons and replacing check/cross glyphs with `VERIFIED` and `BOUNDARY` monospace badges.
- **Consequences:** Completely eliminates horizontal overflow and visual clutter, delivering a calm, precise, and readable scientific interface.


