// ============================================================================
// Interactive Pipeline Diagram
// Shows the 8-step AO simulation pipeline with animations and physics tooltips
// Uses KaTeX for LaTeX equation rendering
// ============================================================================

const PIPELINE_STEPS = [
  {
    id: 'phase-screen',
    label: 'Kolmogorov\nPhase Screen',
    shortLabel: 'Phase Screen',
    icon: '🌊',
    description: 'Random phase distortion generated using FFT-based Kolmogorov turbulence spectrum. Models the cumulative phase error a laser beam accumulates passing through turbulent atmosphere.',
    equation: '\\Phi(f) = 0.023\\, r_0^{-5/3} \\left(f^2 + f_0^2\\right)^{-11/6}',
    eqLabel: 'von Kármán Power Spectral Density',
    dimensions: 'Output: N×N phase values in radians'
  },
  {
    id: 'beam-prop',
    label: 'Gaussian Beam\nPropagation',
    shortLabel: 'Beam Prop',
    icon: '💡',
    description: 'A Gaussian beam amplitude profile is multiplied by exp(iφ) where φ is the phase screen. This creates the distorted optical field that would exist at the receiver.',
    equation: 'E(r) = A(r) \\cdot e^{i\\varphi(r)}, \\quad A(r) = e^{-r^2/w^2}',
    eqLabel: 'Distorted Electric Field',
    dimensions: 'Input: N×N phase → Output: N×N complex field'
  },
  {
    id: 'distorted',
    label: 'Distorted\nWavefront',
    shortLabel: 'Distortion',
    icon: '🔴',
    description: 'The far-field intensity is computed via Fraunhofer diffraction (2D FFT of the complex field). Stronger turbulence spreads the beam, creating speckle patterns and reducing peak intensity.',
    equation: 'I(\\mathbf{u}) = \\left| \\mathcal{F}\\{E(r)\\} \\right|^2',
    eqLabel: 'Fraunhofer Diffraction Integral',
    dimensions: 'Output: N×N intensity pattern (physically linked to phase)'
  },
  {
    id: 'sensor',
    label: 'Shack-Hartmann\nSensor',
    shortLabel: 'WFS',
    icon: '🔬',
    description: 'The wavefront is divided into subapertures. In each subaperture, the local x and y phase gradients (slopes) are measured. These slopes are what a real Shack-Hartmann sensor would produce.',
    equation: 's_x = \\frac{1}{A}\\iint \\frac{\\partial \\varphi}{\\partial x}\\,dA + \\eta',
    eqLabel: 'Slope Measurement with Noise η',
    dimensions: 'Output: 2×n_sub² slopes (32 features for 4×4 grid)'
  },
  {
    id: 'slopes',
    label: 'Slope\nMeasurements',
    shortLabel: 'Slopes',
    icon: '📊',
    description: 'The slope vector contains 2×n_sub² measurements - x and y gradients for each subaperture. These are the features fed to the ML model. Each independent turbulence realization produces one feature vector.',
    equation: '\\mathbf{s} = [s_{x_1}, \\ldots, s_{x_n}, s_{y_1}, \\ldots, s_{y_n}]^T',
    eqLabel: 'Feature Vector',
    dimensions: 'Shape: (n_realizations, 2×n_sub²)'
  },
  {
    id: 'ml-model',
    label: 'ML Model\nRidge / Linear',
    shortLabel: 'Regression',
    icon: '🧠',
    description: 'Ridge Regression finds the optimal linear mapping from slopes to Zernike coefficients. The L2 penalty prevents overfitting when training samples are limited.',
    equation: '\\hat{\\beta} = (X^TX + \\alpha I)^{-1} X^T y',
    eqLabel: 'Ridge Regression Closed-Form Solution',
    dimensions: 'β shape: (n_features, n_modes) = (32, 15)'
  },
  {
    id: 'predicted',
    label: 'Predicted\nWavefront',
    shortLabel: 'Prediction',
    icon: '🎯',
    description: 'The predicted Zernike coefficients are used to reconstruct a predicted wavefront. This is compared against the true wavefront to measure prediction accuracy.',
    equation: '\\hat{\\varphi}(r,\\theta) = \\sum_{j=1}^{J} \\hat{a}_j Z_j(r,\\theta)',
    eqLabel: 'Wavefront Reconstruction from Zernike Modes',
    dimensions: 'Output: N×N predicted phase (15 Zernike modes)'
  },
  {
    id: 'error',
    label: 'Error Map\n+ RMSE',
    shortLabel: 'Evaluation',
    icon: '📉',
    description: 'The absolute difference between true and predicted wavefronts gives the error map. RMSE is computed ONLY on held-out test data - never on training samples.',
    equation: '\\text{RMSE} = \\sqrt{\\frac{1}{n_{\\text{test}}} \\sum_i \\|\\hat{a}_i - a_i\\|^2}',
    eqLabel: 'Test-Set Root Mean Square Error',
    dimensions: 'Metrics: RMSE (rad), R² score, per-mode error'
  }
];


// ============================================================================
// PipelineDiagram - renders the interactive step nodes, connectors, and tooltip
// ============================================================================

class PipelineDiagram {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.activeTooltip = null;
    this.flowParticles = [];
    this.animId = null;
    this.rendered = false;
    this.init();
  }
  
  init() {
    this.render();
    this.bindEvents();
    this.startFlowAnimation();
  }
  
  render() {
    // Build the pipeline HTML: a track with nodes, connectors, and a tooltip panel
    const pipelineHTML = `
      <div class="pipeline-track">
        <canvas id="pipeline-flow-canvas" class="pipeline-canvas"></canvas>
        <div class="pipeline-nodes">
          ${PIPELINE_STEPS.map((step, idx) => `
            <div class="pipeline-node" data-step="${idx}" id="pipeline-node-${step.id}">
              <div class="pipeline-node-icon">${step.icon}</div>
              <div class="pipeline-node-label">${step.shortLabel}</div>
            </div>
            ${idx < PIPELINE_STEPS.length - 1 ? '<div class="pipeline-connector"><div class="pipeline-arrow">→</div></div>' : ''}
          `).join('')}
        </div>
      </div>
      <div id="pipeline-tooltip" class="pipeline-tooltip hidden">
        <button class="tooltip-close" id="tooltip-close">✕</button>
        <div class="tooltip-header">
          <span class="tooltip-icon" id="tooltip-icon"></span>
          <span class="tooltip-title" id="tooltip-title"></span>
        </div>
        <p class="tooltip-description" id="tooltip-description"></p>
        <div class="tooltip-equation" id="tooltip-equation"></div>
        <div class="tooltip-eq-label" id="tooltip-eq-label"></div>
        <div class="tooltip-dimensions" id="tooltip-dimensions"></div>
      </div>
    `;
    
    this.container.innerHTML = pipelineHTML;
    this.rendered = true;
  }
  
  showTooltip(stepIndex) {
    const step = PIPELINE_STEPS[stepIndex];
    const tooltip = document.getElementById('pipeline-tooltip');
    
    document.getElementById('tooltip-icon').textContent = step.icon;
    document.getElementById('tooltip-title').textContent = step.label.replace('\n', ' ');
    document.getElementById('tooltip-description').textContent = step.description;
    document.getElementById('tooltip-dimensions').textContent = step.dimensions;
    document.getElementById('tooltip-eq-label').textContent = step.eqLabel;
    
    // Render equation with KaTeX if available
    const eqEl = document.getElementById('tooltip-equation');
    if (typeof katex !== 'undefined') {
      try {
        katex.render(step.equation, eqEl, {
          throwOnError: false,
          displayMode: true
        });
      } catch (e) {
        eqEl.textContent = step.equation;
      }
    } else {
      eqEl.textContent = step.equation;
    }
    
    tooltip.classList.remove('hidden');
    this.activeTooltip = stepIndex;
    
    // Highlight the active node
    document.querySelectorAll('.pipeline-node').forEach((n, i) => {
      n.classList.toggle('active', i === stepIndex);
    });
  }
  
  hideTooltip() {
    const tooltip = document.getElementById('pipeline-tooltip');
    if (tooltip) tooltip.classList.add('hidden');
    this.activeTooltip = null;
    document.querySelectorAll('.pipeline-node').forEach(n => n.classList.remove('active'));
  }
  
  bindEvents() {
    // Node clicks - toggle tooltip for the clicked step
    document.querySelectorAll('.pipeline-node').forEach((node, idx) => {
      node.addEventListener('click', () => {
        if (this.activeTooltip === idx) {
          this.hideTooltip();
        } else {
          this.showTooltip(idx);
        }
      });
    });
    
    // Close button inside tooltip
    const closeBtn = document.getElementById('tooltip-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideTooltip());
    }
  }
  
  startFlowAnimation() {
    // Animated flowing dots on connectors - handled via CSS keyframes
    // on .pipeline-connector::after pseudo-elements
  }
}


// ============================================================================
// Scroll-triggered entrance animation
// Nodes stagger-fade in when the pipeline section scrolls into view
// ============================================================================

function initPipelineScrollAnimation() {
  const nodes = document.querySelectorAll('.pipeline-node');
  if (!nodes.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger animation: each node appears 150ms after the previous
        nodes.forEach((node, i) => {
          setTimeout(() => {
            node.classList.add('visible');
          }, i * 150);
        });
        observer.disconnect();  // Only animate once
      }
    });
  }, { threshold: 0.2 });
  
  const pipelineSection = document.getElementById('approach');
  if (pipelineSection) observer.observe(pipelineSection);
}
