// ═══════════════════════════════════════════════════════════════
// Main Application Controller
// Handles navigation, slider controls, simulation execution,
// scroll animations, and all user interactions
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // ─── Initialize Systems ───
  initNavigation();
  initParticleSystem();
  initPipelineDiagram();
  initDemoControls();
  initScrollAnimations();
  initHonestyBox();
  initStaticResults();

  console.log('SHYENA — AI-Powered Adaptive Optics initialized.');
});

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

function initNavigation() {
  const nav = document.getElementById('main-nav');
  const navLinks = document.getElementById('nav-links');
  const navToggle = document.getElementById('nav-toggle');
  const links = navLinks.querySelectorAll('a');

  // Scrolled state
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Mobile toggle
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close mobile menu on link click
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });

  // Active section highlighting (IntersectionObserver)
  const sections = document.querySelectorAll('section[id]');
  const observerOptions = {
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => navObserver.observe(section));
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE SYSTEM
// ═══════════════════════════════════════════════════════════════

function initParticleSystem() {
  try {
    new TurbulentParticleSystem('particle-canvas');
  } catch (e) {
    console.warn('Particle system failed to initialize:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE DIAGRAM
// ═══════════════════════════════════════════════════════════════

function initPipelineDiagram() {
  try {
    new PipelineDiagram('pipeline-container');
    initPipelineScrollAnimation();
  } catch (e) {
    console.warn('Pipeline diagram failed to initialize:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// DEMO CONTROLS
// ═══════════════════════════════════════════════════════════════

let simulationRunning = false;

function initDemoControls() {
  // ─── Cn2 Slider ───
  const cn2Slider = document.getElementById('slider-cn2');
  const cn2Value = document.getElementById('cn2-value');

  cn2Slider.addEventListener('input', () => {
    const exponent = parseFloat(cn2Slider.value);
    const cn2 = Math.pow(10, exponent);
    const mantissa = cn2 / Math.pow(10, Math.floor(exponent));

    // Format as scientific notation with nice display
    const absExp = Math.abs(Math.floor(exponent));
    const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    const expStr = String(absExp).split('').map(d => superscripts[parseInt(d)]).join('');
    cn2Value.textContent = `${mantissa.toFixed(2)} × 10⁻${expStr}`;

    // Update turbulence label
    let label = 'Moderate';
    if (exponent < -13.5) label = 'Weak';
    else if (exponent > -12.5) label = 'Strong';
  });
  // Trigger initial display
  cn2Slider.dispatchEvent(new Event('input'));

  // ─── Realizations Slider ───
  const realSlider = document.getElementById('slider-realizations');
  const realValue = document.getElementById('realizations-value');

  realSlider.addEventListener('input', () => {
    realValue.textContent = realSlider.value;
  });

  // ─── Alpha Slider ───
  const alphaSlider = document.getElementById('slider-alpha');
  const alphaValue = document.getElementById('alpha-value');

  alphaSlider.addEventListener('input', () => {
    const logAlpha = parseFloat(alphaSlider.value);
    const alpha = Math.pow(10, logAlpha);
    alphaValue.textContent = alpha.toFixed(3);
  });
  alphaSlider.dispatchEvent(new Event('input'));

  // ─── Model Radio Buttons ───
  const radioButtons = document.querySelectorAll('input[name="model-type"]');
  const optLinear = document.getElementById('opt-linear');
  const optRidge = document.getElementById('opt-ridge');

  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      optLinear.classList.toggle('selected', radio.value === 'linear' && radio.checked);
      optRidge.classList.toggle('selected', radio.value === 'ridge' && radio.checked);

      // Show/hide alpha slider based on model type
      const alphaControl = alphaSlider.closest('div[style]');
      if (alphaControl) {
        alphaControl.style.opacity = radio.value === 'ridge' ? '1' : '0.4';
      }
    });
  });

  // ─── Run Button ───
  const runBtn = document.getElementById('btn-run-simulation');
  runBtn.addEventListener('click', handleRunSimulation);
}

async function handleRunSimulation() {
  if (simulationRunning) return;

  const runBtn = document.getElementById('btn-run-simulation');
  simulationRunning = true;
  runBtn.classList.add('running');
  runBtn.textContent = 'Running...';

  // Read parameters from controls
  const cn2 = Math.pow(10, parseFloat(document.getElementById('slider-cn2').value));
  const numRealizations = parseInt(document.getElementById('slider-realizations').value);
  const ridgeAlpha = Math.pow(10, parseFloat(document.getElementById('slider-alpha').value));
  const modelType = document.querySelector('input[name="model-type"]:checked').value;

  const params = {
    cn2,
    numRealizations,
    ridgeAlpha,
    modelType,
    gridSize: 32,
    nSubap: 4
  };

  console.log('Running simulation with params:', params);

  try {
    const results = await runFullSimulation(params);

    // Display metrics
    displayMetrics(results.metrics);

    // Display result panels
    displayResultPanels(results.visualizations, results.metrics, params.gridSize);

    // Update timing note
    const timingNote = document.getElementById('demo-timing-note');
    if (timingNote) {
      timingNote.textContent = `Completed in ${results.metrics.elapsed}s. ${results.metrics.alphaAdjusted ? '⚠ Regularization was auto-adjusted.' : ''}`;
    }

  } catch (error) {
    console.error('Simulation failed:', error);
  } finally {
    simulationRunning = false;
    runBtn.classList.remove('running');
    runBtn.textContent = '⚡ Run Simulation';
  }
}

// ═══════════════════════════════════════════════════════════════
// SCROLL ANIMATIONS
// ═══════════════════════════════════════════════════════════════

function initScrollAnimations() {
  // Animate science cards on scroll
  const scienceCards = document.querySelectorAll('.science-card');
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger the three cards
        const cards = entry.target.parentElement.querySelectorAll('.science-card');
        cards.forEach((card, i) => {
          setTimeout(() => card.classList.add('visible'), i * 200);
        });
        cardObserver.disconnect();
      }
    });
  }, { threshold: 0.15 });

  if (scienceCards.length > 0) {
    cardObserver.observe(scienceCards[0]);
  }

  // Animate result summary cards
  const resultCards = document.querySelectorAll('.result-summary-card');
  const resultObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
        resultObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  resultCards.forEach(card => resultObserver.observe(card));

  // Animate team cards
  const teamCards = document.querySelectorAll('.team-card');
  const teamObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = document.querySelectorAll('.team-card');
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.style.animation = 'fadeInUp 0.5s ease forwards';
          }, i * 100);
        });
        teamObserver.disconnect();
      }
    });
  }, { threshold: 0.15 });

  if (teamCards.length > 0) {
    teamObserver.observe(teamCards[0]);
  }
}

// ═══════════════════════════════════════════════════════════════
// HONESTY BOX (collapsible)
// ═══════════════════════════════════════════════════════════════

function initHonestyBox() {
  const header = document.getElementById('honesty-header');
  const box = document.getElementById('honesty-box');

  if (header && box) {
    header.addEventListener('click', () => {
      box.classList.toggle('expanded');
    });
  }
}
