# SHYENA — Adaptive Optics Project Website Design Specification

**Project:** AI-Powered Adaptive Optics for Laser Communication in Turbulent Air  
**Team:** SHYENA  
**Design direction:** Apple-inspired restraint, Liquid Glass used as a functional material, optical/prism visual language, research-grade scientific visualization  
**Document status:** Product and implementation specification; not evidence that the simulations or model endpoints already exist.

> **Scientific integrity rule:** the website must never display illustrative graphics as measured results. Every output must be calculated by the documented simulation/model implementation, or be explicitly marked **Illustrative demo**. Do not hard-code benchmark metrics into live result components.

---

## 1. Product intent

Build a research showcase that lets a visitor understand the problem, explore a controlled turbulence simulation, inspect wavefront estimates and residual errors, compare regression models, and understand what is implemented versus planned.

The project report describes this pipeline:

1. Generate distorted light-intensity patterns and simulated wavefronts.
2. Analyse spatial-frequency content with the Fast Fourier Transform (FFT).
3. Estimate wavefront error using Linear Regression and Ridge Regression.
4. Visualize predictions and absolute-error maps.
5. Explore reinforcement-learning (RL) control as part of the proposed adaptive-optics method.

The report lists Python, NumPy, SciPy, Matplotlib, scikit-learn, and an OpenAI Gym environment as project technologies. Its limitations section also states that the current work uses pre-generated/simulated data, has no physical wavefront-sensor feedback, has not yet fully evaluated communication-level metrics, and needs further RL and hardware validation.

**Primary user:** a student, reviewer, faculty member, or technical recruiter who wants to understand the project and check its outputs without reading the full report first.

**Primary task:** run a simulation and trace how a distorted wavefront becomes a predicted correction and a residual error map.

**Secondary tasks:** compare Linear and Ridge regression, inspect frequency-domain effects, read the method, review limitations, and reproduce a saved run.

### Success criteria

- A first-time visitor can explain the pipeline within one minute.
- A user can run/reset a repeatable demo without a page reload.
- Every chart has a named quantity, units where applicable, a legend/color scale, and a short interpretation.
- All reported metrics can be traced to a run ID, dataset split, model configuration, and computation.
- A phone-sized viewport still exposes the main visualization and its essential controls.
- Unimplemented or unvalidated methods are labelled honestly.

---

## 2. Design references and design-file access

### Official Apple resources

- **Apple Design Resources (official Figma and Sketch UI kits):** https://developer.apple.com/design/resources/
- **Apple Liquid Glass overview:** https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass
- **Apple Human Interface Guidelines — Materials:** https://developer.apple.com/design/human-interface-guidelines/materials
- **Apple Human Interface Guidelines — Motion:** https://developer.apple.com/design/human-interface-guidelines/motion
- **Apple Human Interface Guidelines — Design principles:** https://developer.apple.com/design/human-interface-guidelines/design-principles
- **Figma Help — Get started with Apple's UI kit:** https://help.figma.com/hc/en-us/articles/24037833895831-Get-started-with-Apple-s-UI-kit

Apple’s Design Resources page currently lists its platform UI kits, including Figma resources for the current platform releases. Open the official page, choose the appropriate Figma UI kit, then accept Apple's design-resource licence when prompted. Use the kit to study spacing, type hierarchy, control states, and material behaviour; do not copy Apple branding or imply this research site is an Apple product.

### How to interpret Liquid Glass for a website

Liquid Glass is a native Apple-platform material, not a CSS framework. On the web, implement a restrained visual analogue with translucent surfaces, `backdrop-filter`, edge highlights, subtle refraction-like gradients, and carefully tested fallbacks. Do **not** promise pixel-identical native Liquid Glass behaviour.

Follow the intent of Apple's guidance:

- Reserve glass for navigation, toolbars, floating controls, and transient controls.
- Keep scientific plots, explanatory copy, and result tables on solid or near-solid surfaces.
- Use stronger translucency only where the background is visually rich and text remains legible.
- Motion must clarify change or state; it must not delay a task or carry information by itself.

---

## 3. Visual concept

### The core metaphor: a beam passing through a prism

Use a single visual idea derived from the actual project: coherent light enters a turbulent medium, its wavefront distorts, a correction is estimated, and the residual is measured. The prism is a visual motif—not a claim that a prism is part of the simulated hardware. Make that distinction clear in labels or captions wherever a stylized prism is used.

Avoid the default “AI dashboard” look: no wall of identical cards, no gratuitous purple gradients behind every section, no floating neon blobs, no faux-terminal text, no oversized meaningless KPI numbers, and no decorative chart with invented data.

### Color tokens

Use color as a scientific cue, not as decoration.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#070D16` | Main dark background |
| `--bg-raised` | `#0D1725` | Raised content areas and chart frames |
| `--surface` | `#111F30` | Opaque content surface |
| `--glass` | `rgba(18, 31, 47, 0.66)` | Navigation and controls only |
| `--text` | `#F4F7FB` | Primary text |
| `--text-muted` | `#A6B4C7` | Secondary text |
| `--line` | `rgba(190, 211, 235, 0.16)` | Dividers and chart-frame edges |
| `--laser-cyan` | `#72E7F2` | Beam path, active focus, input/output link |
| `--phase-violet` | `#8D8BFF` | Phase/wavefront identity, selected method |
| `--spectrum-amber` | `#FFB86B` | High-frequency/energy highlights when semantically justified |
| `--success` | `#7BE0B2` | Valid run/completed state |
| `--warning` | `#FFCB76` | Experimental or incomplete state |
| `--error` | `#FF8C95` | Failed run or invalid result |

Heatmap palettes must be chosen for scientific readability and perceptual separation. Do not use the brand accent as a substitute for a color scale. Use a diverging scale centred at zero for signed phase/error values and a sequential scale for non-negative intensity or absolute error. Preserve numeric color-scale ticks. Provide a text/table alternative for color-only interpretation.

### Typography

- Use a neutral system sans-serif stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Use a monospaced stack only for model parameters, run IDs, and compact numerical readouts.
- Hero headline: 56–68 px desktop, 40–48 px tablet, 36–42 px mobile; line-height around 1.02–1.08.
- Body: 16–18 px; line-height 1.55–1.7.
- Plot titles and controls: 13–15 px, not smaller than necessary.
- Do not rely on Apple's proprietary font as a required web dependency.

### Shape, spacing, and depth

- Use an 8 px base spacing scale.
- Content max-width: 1280 px; wide simulation canvas can reach 1440 px.
- Corner radii: 12 px for charts/controls, 18 px for major surfaces, 999 px for compact pills where suitable.
- Border: one low-contrast edge; avoid multiple nested outlines.
- Shadow: soft and shallow. The glow should come from the beam visualization, not from every container.
- Avoid nested glass panels. A glass toolbar above solid scientific content is enough.

---

## 4. Information architecture

### Global navigation

**Brand:** SHYENA wordmark with a restrained beam/falcon mark; use the team's own identity only.  
**Navigation:** Overview · Live Lab · Methods · Results · Limitations  
**Utility action:** `Run a demo` or `Open Live Lab`  
**Status indicator:** `Simulation environment` (only if the backend is genuinely a simulation; do not imply hardware is connected).

Desktop navigation is a thin floating glass strip. On mobile it becomes a compact top bar plus a clearly accessible menu; do not hide the run action behind multiple menu levels.

### Page sections

1. **Overview** — thesis, project goal, one interactive optical path, primary CTA.
2. **Live Lab** — parameters, run controls, live plots, run status, reproducibility details.
3. **Methods** — turbulence generation, intensity/wavefront generation, regression, correction, FFT, RL status.
4. **Results** — comparison plots, metrics, model configuration, export.
5. **Limitations** — simulation assumptions, missing sensor/hardware evidence, known failure cases, future work.
6. **About** — project team, faculty guide, university, source report, code/repository link when available.

Use anchor-based scroll navigation for this research showcase. Avoid elaborate page transitions that obscure browser history or make direct links impossible.

---

## 5. Overview / hero design

### Desktop composition

A 12-column layout with generous space and a clean baseline:

- **Left 5 columns:** kicker `AI-POWERED ADAPTIVE OPTICS`, headline `Correct the wave. Preserve the signal.`, two-sentence description, primary `Open Live Lab` button, secondary `Explore the method` text link.
- **Right 7 columns:** a scientific optical path visualization showing source → turbulent phase screen → correction element → receiver plane. In the idle state, show a restrained preview. When a run is active, drive the beam, phase screen, correction element, and receiver spot from the same run state shown in the plots. If the idle preview is illustrative rather than computed, label it accordingly.
- **Under the hero:** a single horizontal process strip: `Distort → Estimate → Correct → Evaluate`.

### Hero content

Suggested copy:

> **Correct the wave. Preserve the signal.**  
> Explore a simulation-first approach to wavefront estimation and correction for laser communication through turbulent air. Adjust the conditions, inspect the predicted wavefront, and measure the residual error.

Do not write “real-time”, “production-ready”, “defence grade”, “guaranteed”, or “improves communication reliability” unless an implementation and validation protocol support those claims.

### Prism treatment

Use a narrow spectral edge on the beam and a faint chromatic split where the visual transitions into frequency space. The prism effect should be subtle and local: a 1–2 px spectral edge, not a large rainbow gradient across the page. The wavefront visualization should remain the most prominent, scientifically meaningful color field.

### Scroll behaviour

- Use native scroll; do not hijack scroll or add scroll-jacking.
- Reveal section headings with a short opacity/translate transition only when motion is permitted.
- Let the optical beam visualization evolve as its own visualization, not as a background animation on every section.
- Keep navigation position stable and maintain visible focus outlines.

---

## 6. Live Lab — the centrepiece

This is the most important screen. Its purpose is not to resemble a generic dashboard; it should feel like a compact optical bench with inspectable outputs.

### Main layout

**Top:** page title `Live Lab`, short status label, run ID / seeded run number, `Run simulation`, `Reset`, and `Export results` controls.  
**Left rail (desktop) / collapsible parameter sheet (mobile):** parameters and method selection.  
**Main canvas:** one dominant optical path above a synchronized grid of scientific plots.  
**Bottom:** compact interpretation and reproducibility metadata.

### Parameters

Only expose a parameter if it has a defined meaning in the implementation. Recommended controls after the backend supports them:

- Turbulence preset: Weak / Moderate / Strong. Define each preset in terms of actual simulation parameters; do not use the labels as uncalibrated physical truth.
- Random seed: integer, editable; same seed + same configuration must reproduce the same output.
- Estimator: Linear Regression / Ridge Regression.
- Ridge `alpha`: show only when Ridge is selected; apply it to the actual model fit or loaded model configuration.
- Plot selection: Intensity / Phase / Predicted phase / Residual phase / FFT spectrum.
- Normalization: expose only if the plot and metric logic correctly use it; indicate whether the display is normalized.

Use sliders for continuous parameters only when the range and unit are defined. For a small number of scientifically meaningful presets, use a segmented control or select instead. Show exact values beside controls. Debounce visual-only controls, but never silently debounce or skip model runs in a way that misrepresents the final parameter state.

### Output visualization set

1. **Distorted intensity** — non-negative irradiance/intensity field; include normalization and units/status.
2. **Distorted phase/wavefront** — signed phase field; include units such as radians only if the backend stores actual phase in radians.
3. **Predicted wavefront** — result from the selected, actually loaded/trained estimator.
4. **Residual error** — `reference phase − predicted/corrected phase` using a clearly named sign convention; show signed residual and/or absolute error as separate views, not interchangeable labels.
5. **FFT / spatial-frequency view** — only if a real transform is calculated from the selected field. Define axis units and whether magnitudes are linear, log-scaled, or power.
6. **Comparison view** — actual/reference versus predicted values with an identity line, plus a metric panel calculated from the same evaluation samples.

A user should be able to select a plot, inspect its exact values/coordinates if practical, and download the underlying arrays as CSV or `.npy` plus run metadata as JSON. Image export can be an additional convenience, not the only export.

### Interaction behaviour

- `Run simulation` enters a clear running state, disables duplicate submissions, and reports progress if the backend provides meaningful progress. Do not fake a progress bar.
- All plots must update from one run result object. Do not calculate the hero beam from one random seed and the heatmaps from another.
- `Reset` restores documented defaults and the initial seed; it must not silently preserve hidden parameter state.
- On failure, preserve current settings and show a concise error with a retry action. Do not render stale results as if they were produced by the failed run.
- Switching plot views must not re-run training unless the method/parameters require it.
- The app should expose the run configuration and a copyable run ID near the results.

### Interpretation text

Each chart gets one concise, data-driven sentence. Example format: “The selected estimator leaves larger residual phase errors near the centre of this sample.” This sentence must be generated from observed data or authored as a neutral instruction; it must not state that one method wins unless the displayed comparison supports it.

---

## 7. Scientific model and accuracy contract

### Required distinction

There are three separate product modes. Name them explicitly in UI and exports:

- **Illustrative demo:** a simplified, deterministic visual meant to teach the pipeline; no claims of physical fidelity.
- **Simulation run:** output from an implemented and documented numerical model with declared assumptions and parameters.
- **Evaluated model result:** model performance calculated on a held-out evaluation set using a documented split and metric protocol.

Never let a visitor mistake one mode for another.

### Important audit items from the submitted report

These are implementation requirements, not cosmetic details:

1. The report describes Kolmogorov turbulence, but the example wavefront code shown in the report generates sinusoidal structure plus random noise. That code alone does not demonstrate a calibrated Kolmogorov phase-screen generator. If the implementation remains simplified, label it as such; do not call it a physically validated Kolmogorov simulation.
2. The code excerpt appears to flatten a single 64×64 intensity and wavefront pair into pixel-level samples for regression. If that reflects the real training pipeline, spatially correlated pixels are not a substitute for independent simulated examples. Generate multiple independent phase-screen realizations and split by realization/run, not by pixels from the same realization.
3. The report’s prose gives final RMSE values of **0.3285** for Linear Regression and **0.2910** for Ridge Regression, while the page 28 summary graphic appears to show different RMSE annotations. Resolve this discrepancy by regenerating the figure and metric table from one evaluation artifact before publishing numerical results.
4. The regression code excerpt does not document a robust held-out evaluation protocol. The site must never imply generalization accuracy unless training and evaluation samples are isolated and the split procedure is documented.
5. The report discusses an RL controller conceptually, but its shown outputs/results focus on regression and error plots. Do not present a functional RL controller or RL performance comparison until the actual environment, agent, reward, training process, and test results are implemented and reproducible.
6. The report states that live physical sensor data and communication-level validation are absent. Do not imply hardware telemetry, physical deployment, measured link throughput, bit-error rate, or real-world reliability improvements.

### Calculation contract

For scientifically meaningful mode, the same engine must compute all related outputs. A possible order is:

1. Validate parameters and random seed.
2. Generate the turbulence/phase screen using a documented numerical method and assumptions.
3. Generate the observation/intensity field through the defined optical model.
4. Apply the chosen estimator using the correct feature representation.
5. Calculate the estimated correction and residual using an explicit sign convention.
6. Produce FFT-derived views from the selected actual field.
7. Compute metrics over the specified held-out samples, not over a display-only subset unless that subset is stated.
8. Package arrays, parameters, model version, seed, split ID, metrics, warnings, and software versions into a single run object.

Do not invent values for wavelength, aperture, propagation distance, refractive-index structure parameter, Fried parameter, outer/inner scale, sensor noise, or actuator geometry. Add any of these as controls only after it exists in the numerical model and has a documented unit/range.

### Metrics

- **RMSE:** label units, evaluated arrays, phase normalization, and sample count.
- **MAE:** optional complementary metric, computed from the same evaluation samples.
- **Residual RMS / Strehl ratio / beam quality / throughput / BER:** do not show by default. Include only if the simulation implements the required physics and the metric is defined correctly.
- **Runtime:** distinguish wall-clock end-to-end runtime from inference time and from a simulated control-loop timestep.
- **Training time:** never present it as inference latency.

Every benchmark table must include model name, dataset/simulation version, training/evaluation split, seed policy, preprocessing, metric units, and aggregation method.

---

## 8. Methods page

Use a readable scientific narrative rather than a row of marketing cards. Each method section has: a small diagram, a compact “input → operation → output” line, a short explanation, and an implementation status.

### Sections

- **Atmospheric turbulence:** what the model simulates, assumptions, selected phase-screen method, and limitations.
- **Intensity and wavefront generation:** how arrays are produced and which fields are synthetic versus measured.
- **Regression-based estimation:** feature/target definition, Linear Regression baseline, Ridge regularization, training and split protocol.
- **Error analysis:** residual definition, RMSE equation, error-map interpretation.
- **FFT:** what field is transformed, transform convention, axes/units, and what the resulting spectrum means.
- **Reinforcement learning:** state, action, reward, episode design, controller, baseline, and evaluation—display only what is implemented; otherwise mark as proposed/future work.

Use compact equations where they help. For example, show RMSE as `sqrt(mean((y_true − y_pred)^2))`, but make the metric definition match the actual evaluation arrays.

### Implementation status labels

Use plain text with a semantic icon only if needed; colour alone cannot communicate status:

- `Implemented` — code exists and passes tests.
- `Experimental` — code runs, but validation is incomplete.
- `Planned` — not yet implemented.
- `Unavailable` — currently cannot run in the published environment.

Do not use “AI-powered” as a substitute for describing a model.

---

## 9. Results page

The results page should be a reproducible experiment record, not a promotional scoreboard.

### Required sections

- Run/experiment identifier and timestamp.
- Simulation configuration and random seed.
- Model and version, including Ridge alpha if applicable.
- Exact train/validation/test split policy.
- Side-by-side reference, prediction, signed residual, and absolute error maps.
- Actual-versus-predicted plot with an identity line.
- Metric table computed from the same run artifact.
- Sample count and units.
- Export controls for arrays and metadata.
- A “known limitations” note tied to the selected run.

### Benchmark presentation

The report’s prose currently reports Linear RMSE = 0.3285 and Ridge RMSE = 0.2910. These should be shown only as **reported in the project report** until the plot discrepancy and evaluation protocol are resolved. Prefer a review note over a KPI tile. Once recomputed from a reproducible held-out evaluation, replace them with generated values and link to the run configuration.

A model may be called better only for a named metric and evaluation setting. Avoid global labels like `Winner` or `Best AI model` unless there is a predefined selection criterion and reliable evidence.

---

## 10. Motion, interactions, and Liquid Glass

### Motion language

Use smooth, short, state-driven motion:

- 160–240 ms for hover/focus/press feedback.
- 220–360 ms for plot transitions and section entrances where necessary.
- Use ease-out for entering and ease-in for leaving.
- The beam animation should be slow enough to inspect and should stop/pause when the Live Lab is not visible or the user pauses it.
- Transition data updates with a short crossfade or progressive draw. Keep axes and scales stable unless they actually change; explain when the scale changes.
- No scroll hijacking, scroll-triggered zoom of the entire page, endless parallax, wobbling glass, cursor-follow glow, or long page intro sequence.

### Live simulation effects — required, not decorative

The Live Lab must visibly respond while a simulation is running. Do not stop at a static dashboard or a looping hero animation. The effects below are part of the interface contract; each must be driven by the simulation state or clearly labelled as an illustrative preview.

1. **Beam propagation:** show a restrained moving light pulse travelling from the source through the turbulence region, across the correction element, and to the receiver. During a run, its path/intensity and receiver spot should reflect the current computed state. Do not animate unrelated CSS lights that imply a correction is working when the model has not produced that result.
2. **Evolving turbulence / phase screen:** update the phase-screen or wavefront display from a documented seeded sequence of simulation states. For a static single-run model, keep the computed field static and animate only the playback/progressive reveal; do not invent temporal turbulence that the numerical model does not simulate.
3. **Adaptive correction:** visualize the deformable mirror or correction surface responding to the selected estimator/controller output. If a real actuator/control model is not implemented, present this as an explicitly labelled conceptual animation and do not claim it is an actual RL controller.
4. **Before/after comparison:** keep distorted and corrected intensity views side by side. When correction is enabled or the estimator changes, update the corrected field, residual map, and metrics from the same returned result object. If the current backend only estimates phase and does not propagate a corrected optical field, label the output as an estimated correction rather than corrected physical intensity.
5. **Parameter response:** changes to turbulence strength, estimator, Ridge alpha, or seed must cause the corresponding computation to rerun or clearly mark the visible state as “pending run”. The UI must not imply that a slider has changed scientific output before the computation finishes.
6. **FFT response:** update the spectrum only when a new underlying field is selected or computed. Keep axes, units, normalization, and color scales accurate and labelled.
7. **Playback controls:** provide `Run`, `Pause`, `Step`, and `Reset` only where their behavior is implemented. A seeded run should be replayable; the same seed/configuration must reproduce the same result within a documented tolerance. Use a timeline scrubber only when stored simulation frames or time steps actually exist.
8. **Live status:** show concise states such as `Ready`, `Running`, `Complete`, and `Failed`, plus a run ID/seed for completed runs. Only display progress when the backend reports meaningful progress; never fake a percentage or live sensor telemetry.

#### Motion and rendering implementation

- Prefer SVG for the optical path, CSS/SVG stroke animation for a subtle beam pulse, and Canvas/WebGL for a changing field only if profiling justifies it. For the report's 64×64 fields, a scientific heatmap rendered with Canvas or a plotting library is likely sufficient; do not add 3D rendering just for spectacle.
- Drive synchronized views from one state object, for example `{ runId, seed, parameters, frameIndex, arrays, metrics, status }`. The front end must not generate separate random arrays for the beam, heatmaps, and metric readouts.
- Use a smooth transition between frames, but do not interpolate values in a way that changes the interpretation of the underlying data. When a new discrete run arrives, use a brief crossfade or progressive reveal and retain a clear link to its run ID.
- Keep ambient beam motion slower and subtler than the data interaction. Pause ambient motion when the Live Lab leaves the viewport, when the user pauses, or when the page is hidden. Computation must not depend on animation frame rate.
- For scientific runs, the output arrays and metrics remain the source of truth. Animation is a presentation layer, never a substitute for the numerical model.

#### Required live-effect tests

- Increasing turbulence strength changes the computed phase/intensity field in the expected direction for the implemented model; verify the outcome numerically, not just visually.
- Switching Linear ↔ Ridge selects the actual corresponding estimator and refreshes all dependent views consistently.
- Changing the seed changes stochastic realizations, while repeating the same seed and configuration reproduces the same arrays/metrics within tolerance.
- Pause stops playback without discarding results; Reset returns to documented defaults; failed runs never leave stale outputs labelled as current.
- The optical path, heatmaps, error view, and metrics all display the same run ID and configuration.
- In reduced-motion mode, disable ambient animation and use immediate or simple-fade updates while preserving the complete simulation and its controls.

Implement `@media (prefers-reduced-motion: reduce)` so ambient motion and large transitions are removed or replaced with simple fades. The simulation and its results must remain fully understandable with all animation disabled.

### Liquid Glass rules

- Apply translucent glass to the top navigation, small floating control bar, popovers, and focused interactive tool controls.
- Use a clear/stronger glass variant only over darker or visually rich regions; use a darker opaque fallback to retain contrast.
- Do not put long technical paragraphs, axes, legends, or heatmaps under heavy blur.
- Never use blur as the sole visual indicator of hierarchy or disabled/enabled state.
- Add a solid-color fallback for browsers that do not support `backdrop-filter`.
- Check contrast with the actual content beneath every translucent surface.

### Keyboard and accessible interactions

- All controls work with keyboard as well as mouse/touch.
- Visible focus rings must not be removed.
- Sliders expose their current value and units to assistive technology.
- Colour maps have labelled scales and alternative text/table summaries.
- Status changes such as “running”, “complete”, and “failed” are announced through an appropriate live region.
- Never rely on colour or animation alone to report convergence or error severity.

---

## 11. Responsive rules

### Desktop (≥ 1100 px)

- Hero: text and optical-path canvas side by side.
- Live Lab: parameters on a narrow left rail, primary visualization and plots in the main region.
- Heatmaps: 2×2 or 3-column layout when labels remain readable.

### Tablet (720–1099 px)

- Hero canvas moves below the headline or uses a 5/7 split if it remains legible.
- Parameters become a compact top row or collapsible side sheet.
- Heatmaps use two columns.

### Mobile (< 720 px)

- Single-column content; preserve reading order.
- Main run action remains visible near parameters.
- Put parameter controls in a native-looking expandable sheet, not a tiny permanent sidebar.
- Stack heatmaps; do not shrink them into illegible thumbnails.
- Provide horizontal pan/zoom for plot detail only where it improves inspection; keep page-level horizontal overflow disabled.
- Make control targets comfortable for touch (roughly 44 px minimum target height).
- Allow technical titles, labels, and legends to wrap without clipping.

---

## 12. Suggested technical architecture

Keep the numerical model independent from the visual layer.

### Frontend

- React + TypeScript (Next.js or Vite; choose one, not both).
- CSS variables or a small token layer for theming; do not add a utility framework solely to reproduce glass effects.
- Plotly.js or another well-maintained scientific plotting library for heatmaps, axes, legends, scatter plots, and export. Use one plotting system consistently.
- WebGL/canvas only if profiling shows the visualization needs it. The report’s 64×64 arrays do not by themselves require elaborate 3D rendering.
- Use SVG for the optical path illustration and light-weight transitions.

### Numerical backend

- Python API (e.g. FastAPI) around the actual NumPy/SciPy/scikit-learn implementation.
- One simulation service that returns a single typed result object; frontend code should not reproduce scientific equations independently.
- Store each run’s configuration and metadata together with outputs. If persistence is not implemented, state that exports are local/download-only.
- Version the simulation and model configuration.

### Suggested API shape

`POST /api/simulations` — validate a complete configuration and create/run a simulation.  
`GET /api/simulations/{run_id}` — fetch status and result metadata.  
`GET /api/simulations/{run_id}/arrays/{array_name}` — retrieve a named numeric output, if storage supports it.  
`GET /api/simulations/{run_id}/export` — package arrays and metadata for download.

Example request shape (illustrative API contract only; field names must match the actual implementation):

```json
{
  "seed": 31415,
  "turbulence_preset": "moderate",
  "estimator": "ridge",
  "ridge_alpha": 10.0
}
```

Example result shape should include `run_id`, `status`, `simulation_version`, `parameters`, `model`, `metrics`, `units`, `warnings`, `arrays`, and `reproducibility`. Do not send chart-only invented data as a substitute for the backend results.

### Repeatability

- Same software version + same seed + same configuration must return the same result within a defined numerical tolerance.
- Record random seeds for every stochastic stage, not just the visible UI.
- Avoid training a model on every slider movement. Define whether the estimator is pre-trained, trained per simulation, or trained offline; make that choice visible.
- Pin dependencies and add a simple reproducibility test in CI.

---

## 13. Copy and content rules

Prefer concrete scientific language:

- “Estimate phase from simulated intensity features.”
- “Compare predicted and reference wavefronts.”
- “Inspect residual error under the selected configuration.”
- “This result is generated from a simulated phase screen.”

Avoid unsupported claims:

- “Revolutionary AI optics.”
- “Real-time correction” without measured latency and control loop evidence.
- “Near-perfect signal.”
- “Works in any weather.”
- “Improves communication by X%” without a reproducible communications-level experiment.

Every displayed metric must answer: what was measured, on what samples, in what units, under what model/configuration, and how it was calculated?

---

## 14. Performance and quality gates

### Performance

- Target a responsive interaction at 60 fps for simple interface motion on a typical laptop, but do not animate large heatmap canvases continuously.
- Keep the initial route light; lazy-load plot libraries and detail sections where useful.
- Avoid recalculating FFT/model inference on every render.
- Cancel stale requests when users start a new run, and ensure the last-completed response cannot overwrite a newer run.
- Show computation errors clearly; don't fall back to decorative mock data without switching the mode label to `Illustrative demo`.

### Required tests before publishing

1. Parameter validation and invalid-value errors.
2. Same-seed determinism/repeatability.
3. Correct synchronization of all panels for a single run ID.
4. Metric calculation unit tests checked against hand-computable arrays.
5. Held-out evaluation split prevents samples from the same generated realization crossing train/test boundaries.
6. Figure labels/units match backend result metadata.
7. Exported arrays reproduce the metric shown in the UI.
8. Error/failure state never leaves stale results labelled as current.
9. Keyboard-only navigation, screen reader labels, mobile layout, reduced-motion mode, and contrast over glass surfaces.
10. Browser fallback when `backdrop-filter` or WebGL is unavailable.

### Release checklist

- [ ] The page states whether it is an illustrative demo, actual simulation, or evaluated model result.
- [ ] Current report metric discrepancy is resolved before presenting benchmark superiority.
- [ ] Turbulence simulation method is documented and matches implementation.
- [ ] Regression training and held-out evaluation operate on independent generated realizations.
- [ ] RL is marked planned/experimental unless its runnable implementation and evaluation are present.
- [ ] No fake live telemetry or hardware connection indicators.
- [ ] All visible buttons perform a real action.
- [ ] Responsive and reduced-motion behaviour tested.
- [ ] Run configuration and scientific outputs are exportable.

---

## 15. Implementation milestones

**Milestone 1 — content and layout:** responsive overview, methods, results, limitations, team; static figures clearly labelled as report material.

**Milestone 2 — reproducible simulation API:** consolidate the Python simulation into tested functions; define deterministic inputs/outputs; add typed run metadata and error handling.

**Milestone 3 — Live Lab:** connect controls to the API; synchronize state-driven beam, phase-screen, correction, heatmaps, and metrics; add real pause/step/reset where supported, deterministic runs, run IDs, exports, and useful error states. Mark any model-independent visual preview as illustrative.

**Milestone 4 — validation and results:** generate independent phase-screen realizations, define split protocol, regenerate tables/plots from artifacts, resolve metric inconsistency.

**Milestone 5 — advanced control:** implement and evaluate the RL environment as a separate experiment; compare to an explicit baseline before surfacing its performance claim.

**Milestone 6 — refinement:** motion tuning, keyboard and screen-reader audit, small-screen plot layouts, load/performance testing, documentation.

---

## 16. Visual reference mockup

A generated concept mockup is supplied separately as `adaptive-optics-website-mockup.png`. Treat it as a visual direction only. Some labels or visualized fields in a concept image may not correspond to implemented measurements; the shipped interface must be generated by real components and real outputs, not reproduce any unverified mockup metric.

---

## Reference notes

The design guidance above is based on the official Apple resources linked in Section 2 and on the uploaded 37-page project report, *AI-Powered Adaptive Optical for Laser Communication in Turbulent Air* (Team SHYENA). The project report supports the project framing, listed tools, regression comparisons, FFT analysis, conceptual RL integration, and stated limitations. It does **not**, by itself, establish real-world communication performance or validate a production-ready physical turbulence model.
