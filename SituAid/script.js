/* ═══════════════════════════════════════════════
   SITUAID — DECISION ENGINE
   Version 1.0
═══════════════════════════════════════════════ */

'use strict';

// ── STATE ──────────────────────────────────────
let currentScenarioKey = null;
let currentNodeId      = null;
let timerInterval      = null;
let timerSeconds       = 15;
let stepCount          = 0;
let maxSteps           = 6; // estimate; updated per scenario
let decisionLog        = []; // tracks user choices

// ── SCENARIOS ──────────────────────────────────

const scenarios = {

  /* ──────────────────────────────
     CHOKING
  ────────────────────────────── */
  choking: {
    meta: {
      title:       'Choking Emergency',
      emoji:       '🫁',
      color:       '#FF6B6B',
      glow:        'rgba(255,107,107,0.25)',
      urgency:     'HIGH',
      urgencyClass:'urgency-caution',
      description: 'Someone nearby is choking. Every second counts — respond quickly and follow the steps carefully.',
      takeaway:    'In choking emergencies, identify severity first. Encourage coughing for mild cases; use abdominal thrusts (Heimlich) for severe cases. Call 112/911 immediately for unconscious victims.',
    },
    nodes: {
      start: {
        type: 'question',
        question: 'Is the person able to speak, cough, or breathe?',
        hint: 'Watch for hand-to-throat gestures and skin colour changes.',
        options: [
          { text: 'Yes — they can cough or speak', icon: '✅', next: 'mild_case' },
          { text: 'No — silent, turning blue',     icon: '🚨', next: 'severe_case' },
        ],
      },

      mild_case: {
        type: 'action',
        urgency: 'info',
        label: 'Mild Obstruction',
        message: 'Encourage strong, forceful coughing.',
        detail: 'Do NOT slap their back or attempt abdominal thrusts — you may push the object deeper. Stay beside them, keep them calm, and keep watching.',
        emergency: false,
        next: 'mild_monitor',
      },

      mild_monitor: {
        type: 'question',
        question: 'Did coughing dislodge the object?',
        options: [
          { text: 'Yes — they are breathing normally',   icon: '✅', next: 'end_safe' },
          { text: 'No — condition is getting worse',     icon: '⬇️', next: 'severe_case' },
        ],
      },

      severe_case: {
        type: 'action',
        urgency: 'critical',
        label: 'Severe Obstruction',
        message: 'Call emergency services NOW — then act.',
        detail: 'Shout for help. Dial 112 / 911. If alone, begin help immediately, then call if possible.',
        emergency: true,
        next: 'check_conscious',
      },

      check_conscious: {
        type: 'question',
        question: 'Is the person conscious and responsive?',
        options: [
          { text: 'Yes — standing / sitting upright', icon: '🧍', next: 'heimlich' },
          { text: 'No — collapsed or unconscious',    icon: '😶', next: 'cpr' },
        ],
      },

      heimlich: {
        type: 'action',
        urgency: 'critical',
        label: 'Heimlich Maneuver',
        message: 'Perform abdominal thrusts immediately.',
        detail: 'Stand behind them. Wrap arms around waist. One fist above navel, below chest. Grasp fist with other hand. Give 5 quick, inward-and-upward thrusts. Repeat until object is expelled or they lose consciousness.',
        emergency: true,
        next: 'heimlich_result',
      },

      heimlich_result: {
        type: 'question',
        question: 'Did the Heimlich maneuver work?',
        options: [
          { text: 'Yes — object expelled',          icon: '✅', next: 'end_safe' },
          { text: 'No — still choking',             icon: '🔁', next: 'heimlich' },
          { text: 'They lost consciousness',        icon: '😶', next: 'cpr' },
        ],
      },

      cpr: {
        type: 'action',
        urgency: 'critical',
        label: 'CPR Required',
        message: 'Begin CPR immediately.',
        detail: 'Lay them on their back on a firm surface. Tilt head back, lift chin. Give 2 rescue breaths. Perform 30 chest compressions (hard and fast). Check mouth for any visible object before each breath cycle.',
        emergency: true,
        next: 'end_critical',
      },

      end_safe: {
        type: 'end',
        outcome: 'safe',
        title: 'Choking Resolved ✓',
        subtitle: 'Well done — you guided through this emergency effectively.',
      },

      end_critical: {
        type: 'end',
        outcome: 'critical',
        title: 'Emergency Services Needed',
        subtitle: 'You\'ve done everything right. Keep performing CPR and stay on the line with emergency services.',
      },
    },
  },

  /* ──────────────────────────────
     BLEEDING
  ────────────────────────────── */
  bleeding: {
    meta: {
      title:       'Severe Bleeding',
      emoji:       '🩸',
      color:       '#FF4757',
      glow:        'rgba(255,71,87,0.25)',
      urgency:     'CRITICAL',
      urgencyClass:'urgency-critical',
      description: 'Uncontrolled bleeding can be life-threatening within minutes. Act immediately.',
      takeaway:    'Direct pressure is the most effective way to stop bleeding. Never remove a bandage — add more layers. Use a tourniquet for limb injuries only when pressure fails.',
    },
    nodes: {
      start: {
        type: 'question',
        question: 'Where is the wound located?',
        hint: 'This determines the treatment approach.',
        options: [
          { text: 'Arm or leg',            icon: '💪', next: 'limb_check' },
          { text: 'Torso, neck, or head',  icon: '🧠', next: 'torso_pressure' },
        ],
      },

      limb_check: {
        type: 'question',
        question: 'Is blood spurting or soaking through rapidly?',
        options: [
          { text: 'Yes — severe / arterial',     icon: '🚨', next: 'limb_tourniquet' },
          { text: 'No — slower steady bleeding', icon: '⚠️', next: 'direct_pressure' },
        ],
      },

      limb_tourniquet: {
        type: 'action',
        urgency: 'critical',
        label: 'Tourniquet Required',
        message: 'Apply a tourniquet 2–3 inches above the wound.',
        detail: 'Use a belt, tie, or cloth strip. Wrap twice and tie half-knot. Place stick / pen on knot, tie over it. Twist until bleeding stops. Note the time. Do NOT remove.',
        emergency: true,
        next: 'confirm_stop',
      },

      torso_pressure: {
        type: 'action',
        urgency: 'critical',
        label: 'Apply Pressure',
        message: 'Pack the wound and apply firm direct pressure.',
        detail: 'Use gauze, cloth, or clothing. Press hard — use body weight if needed. Do NOT remove material even if soaked — add more on top. Call emergency services now.',
        emergency: true,
        next: 'confirm_stop',
      },

      direct_pressure: {
        type: 'action',
        urgency: 'caution',
        label: 'Direct Pressure',
        message: 'Apply firm, continuous direct pressure.',
        detail: 'Use a clean cloth or bandage. Press constantly for at least 10 minutes. Elevate the limb above heart level if possible. Do not peek — keep pressure on.',
        emergency: false,
        next: 'confirm_stop',
      },

      confirm_stop: {
        type: 'question',
        question: 'Has the bleeding significantly slowed or stopped?',
        options: [
          { text: 'Yes — controlled',        icon: '✅', next: 'wound_care' },
          { text: 'No — still bleeding',     icon: '🔁', next: 'more_pressure' },
        ],
      },

      more_pressure: {
        type: 'action',
        urgency: 'critical',
        label: 'Increase Pressure',
        message: 'Add more material and press harder.',
        detail: 'Never remove blood-soaked material. Layer more clean cloth on top. If on a limb and still failing: apply a tourniquet. Maintain pressure until paramedics arrive.',
        emergency: true,
        next: 'end_critical',
      },

      wound_care: {
        type: 'action',
        urgency: 'info',
        label: 'Stabilise',
        message: 'Secure the dressing and monitor for shock.',
        detail: 'Bandage firmly. Keep person warm and still. Watch for: pale skin, rapid breathing, confusion. If signs of shock appear — lay them flat, raise legs 10–12 inches, keep warm. Seek medical care for all significant wounds.',
        emergency: false,
        next: 'end_safe',
      },

      end_safe: {
        type: 'end',
        outcome: 'safe',
        title: 'Bleeding Controlled ✓',
        subtitle: 'The bleeding is under control. Get the person to medical care for further evaluation.',
      },

      end_critical: {
        type: 'end',
        outcome: 'critical',
        title: 'Emergency Services Required',
        subtitle: 'You acted correctly. Keep pressure on the wound and stay with the person until paramedics arrive.',
      },
    },
  },

  /* ──────────────────────────────
     BURN
  ────────────────────────────── */
  burn: {
    meta: {
      title:       'Burn Injury',
      emoji:       '🔥',
      color:       '#FF9F43',
      glow:        'rgba(255,159,67,0.25)',
      urgency:     'MODERATE',
      urgencyClass:'urgency-caution',
      description: 'Burns range from mild to life-threatening. Correctly assessing severity guides your response.',
      takeaway:    'Cool the burn with cool (not cold/ice) running water for at least 10 minutes. Cover with a clean non-stick dressing. Never use ice, butter, or toothpaste.',
    },
    nodes: {
      start: {
        type: 'question',
        question: 'What caused the burn?',
        hint: 'Treatment slightly varies by burn type.',
        options: [
          { text: 'Heat / flame / scalding',  icon: '🔥', next: 'burn_severity' },
          { text: 'Chemical / acid',          icon: '⚗️', next: 'chemical_burn' },
          { text: 'Electrical',               icon: '⚡', next: 'electrical_burn' },
        ],
      },

      chemical_burn: {
        type: 'action',
        urgency: 'critical',
        label: 'Chemical Burn',
        message: 'Remove chemicals safely and flush immediately.',
        detail: 'Wear gloves if available. Brush off dry chemicals BEFORE adding water. Flood the area with large amounts of cool running water for 20+ minutes. Remove contaminated clothing. Call poison control and emergency services.',
        emergency: true,
        next: 'end_critical',
      },

      electrical_burn: {
        type: 'action',
        urgency: 'critical',
        label: 'Electrical Burn',
        message: 'DO NOT touch the person — cut power first.',
        detail: 'Turn off the power source or use a non-conducting object (dry wood) to push them away. Call emergency services immediately. Electrical burns may appear minor but cause severe internal damage. Do not remove clothing fused to skin.',
        emergency: true,
        next: 'end_critical',
      },

      burn_severity: {
        type: 'question',
        question: 'How severe does the burn appear?',
        options: [
          { text: 'Redness only — no blisters',           icon: '🟡', next: 'minor_burn' },
          { text: 'Blistering, or larger than palm size',  icon: '🔴', next: 'major_burn' },
          { text: 'White/black/charred skin',              icon: '⚫', next: 'critical_burn' },
        ],
      },

      minor_burn: {
        type: 'action',
        urgency: 'info',
        label: 'Minor Burn',
        message: 'Cool the burn with running water for 10–20 minutes.',
        detail: 'Use cool (not cold) running water. Do NOT use ice, butter, or toothpaste. Do NOT pop any blisters. Cover loosely with a clean, non-fluffy dressing. Take over-the-counter pain reliever if needed.',
        emergency: false,
        next: 'end_safe',
      },

      major_burn: {
        type: 'action',
        urgency: 'caution',
        label: 'Major Burn',
        message: 'Cool, cover, and call for help.',
        detail: 'Gently cool with running water (10–20 min). Do NOT remove clothing stuck to skin. Cover with clean cling film or non-fluffy material — do NOT wrap tightly. Call emergency services. Keep the person warm (burns cause heat loss). Do not give food or water.',
        emergency: true,
        next: 'end_caution',
      },

      critical_burn: {
        type: 'action',
        urgency: 'critical',
        label: 'Critical Burn',
        message: 'Call emergency services immediately — do NOT cool.',
        detail: 'Full-thickness burns: DO NOT apply water or any substance. Do NOT remove clothing. Cover loosely with a dry clean cloth. Keep them still and warm. Monitor breathing. Begin CPR if they lose consciousness.',
        emergency: true,
        next: 'end_critical',
      },

      end_safe: {
        type: 'end',
        outcome: 'safe',
        title: 'Minor Burn Managed ✓',
        subtitle: 'The burn is treated. Monitor for infection. See a doctor if blistering occurs or pain worsens.',
      },

      end_caution: {
        type: 'end',
        outcome: 'caution',
        title: 'Medical Attention Required',
        subtitle: 'You responded correctly. Ensure the person receives hospital evaluation for this burn.',
      },

      end_critical: {
        type: 'end',
        outcome: 'critical',
        title: 'Emergency Services En Route',
        subtitle: 'You did the right thing. Keep monitoring their airway and breathing until help arrives.',
      },
    },
  },

  /* ──────────────────────────────
     UNCONSCIOUS
  ────────────────────────────── */
  unconscious: {
    meta: {
      title:       'Unconscious Person',
      emoji:       '💤',
      color:       '#A29BFE',
      glow:        'rgba(162,155,254,0.25)',
      urgency:     'CRITICAL',
      urgencyClass:'urgency-critical',
      description: 'An unresponsive person requires immediate assessment. Follow the DRABC protocol.',
      takeaway:    'Always follow DRABC: Danger → Response → Airway → Breathing → CPR/Circulation. Call emergency services early and do not leave the person alone.',
    },
    nodes: {
      start: {
        type: 'action',
        urgency: 'critical',
        label: 'Step 1 — Check Danger',
        message: 'Ensure the scene is safe before approaching.',
        detail: 'Look for traffic, fire, electricity, or fumes. Do NOT become a second victim. If safe to approach, move to the person.',
        emergency: false,
        next: 'check_response',
      },

      check_response: {
        type: 'question',
        question: 'Tap their shoulders firmly and shout — do they respond?',
        hint: 'Shout "Are you okay?" and look for any movement.',
        options: [
          { text: 'Yes — they respond',      icon: '✅', next: 'responsive' },
          { text: 'No — no response at all', icon: '😶', next: 'call_help' },
        ],
      },

      responsive: {
        type: 'action',
        urgency: 'info',
        label: 'Person Responsive',
        message: 'Assess and monitor while waiting for help.',
        detail: 'Ask: "Are you okay? Can you hear me?" Check for injuries, bleeding, or pain. Do not move them unless in immediate danger. Call 112/911 if the condition seems serious. Stay with them.',
        emergency: false,
        next: 'end_safe',
      },

      call_help: {
        type: 'action',
        urgency: 'critical',
        label: 'Call Emergency Services',
        message: 'Call 112 / 911 immediately — or shout for someone to call.',
        detail: 'If others are present, point to one person and say "YOU — call 112 now." Then immediately check the airway.',
        emergency: true,
        next: 'check_airway',
      },

      check_airway: {
        type: 'action',
        urgency: 'critical',
        label: 'Step 3 — Open Airway',
        message: 'Tilt head back gently and lift the chin.',
        detail: 'Place one hand on the forehead, two fingers under the chin. Tilt head back to open airway. Look inside the mouth for obvious obstructions (remove if visible). Then check for breathing.',
        emergency: false,
        next: 'check_breathing',
      },

      check_breathing: {
        type: 'question',
        question: 'Is the person breathing normally?',
        hint: 'Look for chest rise. Listen and feel at their mouth for 10 seconds.',
        options: [
          { text: 'Yes — breathing normally',          icon: '✅', next: 'recovery_position' },
          { text: 'No — not breathing / gasping only', icon: '🚨', next: 'start_cpr' },
        ],
      },

      recovery_position: {
        type: 'action',
        urgency: 'caution',
        label: 'Recovery Position',
        message: 'Place them in the recovery position now.',
        detail: 'Kneel beside them. Place arm nearest to you at right angle. Pull far arm across, hold back of hand against near cheek. Pull far knee up. Gently roll toward you. Tilt head back to keep airway open. Check breathing every minute.',
        emergency: false,
        next: 'monitor',
      },

      monitor: {
        type: 'question',
        question: 'Has breathing changed?',
        options: [
          { text: 'Continues breathing normally', icon: '✅', next: 'end_monitoring' },
          { text: 'Stopped breathing',             icon: '🚨', next: 'start_cpr' },
        ],
      },

      start_cpr: {
        type: 'action',
        urgency: 'critical',
        label: 'Begin CPR',
        message: 'Start chest compressions immediately.',
        detail: 'Kneel beside chest. Place heel of hand on centre of chest. Interlock fingers. Push DOWN 5–6 cm at 100–120 compressions/min. After 30 compressions: give 2 rescue breaths (tilt head, pinch nose, blow steadily for 1 second). Continue 30:2 until help arrives or person recovers.',
        emergency: true,
        next: 'cpr_check',
      },

      cpr_check: {
        type: 'question',
        question: 'After 2 minutes of CPR, has there been any response?',
        options: [
          { text: 'Yes — signs of life / breathing', icon: '✅', next: 'recovery_position' },
          { text: 'No — continue CPR',               icon: '🔁', next: 'end_critical' },
        ],
      },

      end_safe: {
        type: 'end',
        outcome: 'safe',
        title: 'Person Is Responsive ✓',
        subtitle: 'They responded — monitor closely and call for help if condition worsens.',
      },

      end_monitoring: {
        type: 'end',
        outcome: 'caution',
        title: 'Monitoring — Breathing Stable',
        subtitle: 'Keep them in recovery position. Do not leave them. Help is on the way.',
      },

      end_critical: {
        type: 'end',
        outcome: 'critical',
        title: 'Continue CPR Until Help Arrives',
        subtitle: 'You are doing everything right. Stay on the line with emergency services. Do not stop CPR.',
      },
    },
  },
};

// ── NAVIGATION ─────────────────────────────────

function goTo(screenId) {
  const current = document.querySelector('.screen.active');
  if (current) {
    current.classList.add('exit');
    current.classList.remove('active');
    setTimeout(() => current.classList.remove('exit'), 600);
  }
  const next = document.getElementById(screenId);
  if (next) {
    requestAnimationFrame(() => {
      next.classList.add('active');
      next.scrollTop = 0;
    });
  }
}

function goToScenarioSelection() {
  goTo('screen-selection');
}

// ── SCENARIO LOADING ───────────────────────────

function loadScenario(key) {
  currentScenarioKey = key;
  const scenario = scenarios[key];
  const meta     = scenario.meta;

  // Populate start screen
  const iconWrap = document.getElementById('start-icon');
  iconWrap.textContent = meta.emoji;
  iconWrap.style.background = `linear-gradient(135deg, ${meta.color}22, ${meta.color}44)`;
  iconWrap.style.border     = `1px solid ${meta.color}44`;
  iconWrap.style.boxShadow  = `0 0 32px ${meta.glow}`;

  const urgencyBadge = document.getElementById('start-urgency-badge');
  urgencyBadge.textContent = meta.urgency;
  urgencyBadge.className   = `start-urgency-badge ${meta.urgencyClass}`;

  document.getElementById('start-title').textContent       = meta.title;
  document.getElementById('start-description').textContent = meta.description;

  goTo('screen-start');
}

// ── SIMULATION START ───────────────────────────

function startSimulation() {
  const scenario = scenarios[currentScenarioKey];
  decisionLog    = [];
  stepCount      = 0;

  // Count nodes to estimate total (exclude end nodes)
  const nodes    = scenario.nodes;
  maxSteps       = Object.values(nodes).filter(n => n.type !== 'end').length;

  // Set scenario label
  document.getElementById('sim-scenario-label').textContent = scenario.meta.title;

  goTo('screen-simulation');
  renderNode('start');
}

// ── NODE RENDERER ──────────────────────────────

function renderNode(nodeId) {
  currentNodeId = nodeId;
  const scenario = scenarios[currentScenarioKey];
  const node     = scenario.nodes[nodeId];

  if (!node) return;

  // Stop any existing timer
  clearTimer();

  // Progress
  if (node.type !== 'end') {
    stepCount++;
    updateProgress(stepCount, maxSteps);
  }

  // Body
  const body = document.getElementById('sim-body');
  body.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'node-content';

  switch (node.type) {
    case 'question': renderQuestion(wrapper, node); break;
    case 'action':   renderAction(wrapper, node);   break;
    case 'end':      showSummary(node);              return;
  }

  body.appendChild(wrapper);

  // Timer for question nodes
  if (node.type === 'question') {
    startTimer(15, () => {
      // Time's up — show warning, don't auto-advance
      showTimerWarning();
    });
  }

  // Speak the content
  speak(node.question || node.message || '');
}

// ── QUESTION NODE ──────────────────────────────

function renderQuestion(wrapper, node) {
  // Timer visible
  document.getElementById('sim-timer-wrap').classList.add('visible');

  // Label
  const label = document.createElement('div');
  label.className = 'node-question-label';
  label.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>
    </svg>
    Question
  `;
  wrapper.appendChild(label);

  // Question text
  const q = document.createElement('div');
  q.className = 'node-question';
  q.textContent = node.question;
  wrapper.appendChild(q);

  // Hint
  if (node.hint) {
    const hint = document.createElement('p');
    hint.style.cssText = 'font-size:0.82rem;color:var(--text-3);margin: -16px 0 20px;line-height:1.6';
    hint.textContent = node.hint;
    wrapper.appendChild(hint);
  }

  // Options
  const opts = document.createElement('div');
  opts.className = 'node-options';
  node.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'node-option-btn';
    btn.id        = `option-${i}`;
    btn.innerHTML = `
      <span class="option-text">${opt.text}</span>
      <span class="option-icon">${opt.icon || String.fromCharCode(65 + i)}</span>
    `;
    btn.addEventListener('click', () => {
      decisionLog.push({ step: stepCount, choice: opt.text, nodeId: currentNodeId });
      clearTimer();
      document.getElementById('sim-timer-wrap').classList.remove('visible');
      renderNode(opt.next);
    });
    opts.appendChild(btn);
  });
  wrapper.appendChild(opts);
}

// ── ACTION NODE ────────────────────────────────

function renderAction(wrapper, node) {
  // Timer hidden
  document.getElementById('sim-timer-wrap').classList.remove('visible');

  const div = document.createElement('div');
  div.className = 'action-node';

  // Urgency strip
  const strip = document.createElement('div');
  strip.className = 'action-urgency-strip';
  const stripColors = { critical: '#FF4757', caution: '#FF9F43', info: '#74B9FF', safe: '#26de81' };
  strip.style.background = stripColors[node.urgency] || '#FF4757';
  div.appendChild(strip);

  // Label
  const labelEl = document.createElement('div');
  const labelColors = { critical: 'var(--red)', caution: 'var(--orange)', info: 'var(--blue)', safe: 'var(--green)' };
  labelEl.className = 'action-label';
  labelEl.style.color = labelColors[node.urgency] || 'var(--red)';
  labelEl.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    ${node.label}
  `;
  div.appendChild(labelEl);

  // Main message
  const msg = document.createElement('div');
  msg.className = 'action-message';
  msg.textContent = node.message;
  div.appendChild(msg);

  // Detail
  if (node.detail) {
    const detail = document.createElement('p');
    detail.className = 'action-detail';
    detail.textContent = node.detail;
    div.appendChild(detail);
  }

  // Emergency banner
  if (node.emergency) {
    const banner = document.createElement('div');
    banner.className = 'action-emergency-banner';
    banner.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.83 19.79 19.79 0 01.01 8.23a2 2 0 012-2.18 2 2 0 011.72 1 15.26 15.26 0 00.83 2 2 2 0 01-.45 2.11L3.09 12a16 16 0 006 6l1.06-1.06a2 2 0 012.11-.45 15.26 15.26 0 002 .83 2 2 0 011 1.72z"/>
      </svg>
      Call emergency services: 112 / 911
    `;
    div.appendChild(banner);
  }

  // Continue button
  if (node.next) {
    const btn = document.createElement('button');
    btn.className = 'btn-continue';
    btn.id        = 'btn-action-continue';
    btn.innerHTML = `
      Understood — Continue
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    `;
    btn.addEventListener('click', () => {
      decisionLog.push({ step: stepCount, choice: node.label, nodeId: currentNodeId });
      renderNode(node.next);
    });
    div.appendChild(btn);
  }

  wrapper.appendChild(div);
}

// ── SUMMARY SCREEN ──────────────────────────────

function showSummary(endNode) {
  clearTimer();
  document.getElementById('sim-timer-wrap').classList.remove('visible');

  const scenario = scenarios[currentScenarioKey];
  const meta     = scenario.meta;

  // Icon
  const iconEl = document.getElementById('summary-icon');
  iconEl.textContent = meta.emoji;
  const outcomeColors = {
    safe:     { bg: 'rgba(38,222,129,0.15)',   border: '#26de81' },
    caution:  { bg: 'rgba(255,159,67,0.15)',   border: '#FF9F43' },
    critical: { bg: 'rgba(255,71,87,0.15)',    border: '#FF4757' },
  };
  const oc = outcomeColors[endNode.outcome] || outcomeColors.safe;
  iconEl.style.background = oc.bg;
  iconEl.style.border     = `1px solid ${oc.border}44`;
  iconEl.style.boxShadow  = `0 0 32px ${oc.border}33`;

  // Outcome badge
  const badgeEl = document.getElementById('summary-outcome-badge');
  const badgeMap = {
    safe:     { text: '✓ SAFE OUTCOME',       cls: 'urgency-safe' },
    caution:  { text: '⚠ MONITOR REQUIRED',  cls: 'urgency-caution' },
    critical: { text: '🚨 CRITICAL — HELP EN ROUTE', cls: 'urgency-critical' },
  };
  const bm = badgeMap[endNode.outcome] || badgeMap.safe;
  badgeEl.textContent = bm.text;
  badgeEl.className   = `summary-outcome-badge ${bm.cls}`;

  // Texts
  document.getElementById('summary-title').textContent    = endNode.title    || 'Scenario Complete';
  document.getElementById('summary-subtitle').textContent = endNode.subtitle || '';
  document.getElementById('summary-takeaway-text').textContent = meta.takeaway || '';

  // Decision path
  const pathEl = document.getElementById('path-steps');
  pathEl.innerHTML = '';
  decisionLog.forEach((entry, i) => {
    const step = document.createElement('div');
    step.className = 'path-step';
    step.style.animationDelay = `${i * 0.07}s`;
    step.innerHTML = `<span class="path-step-num">${i + 1}</span><span>${entry.choice}</span>`;
    pathEl.appendChild(step);
  });

  goTo('screen-summary');
  speak(endNode.title + '. ' + (endNode.subtitle || ''));
}

// ── PROGRESS BAR ────────────────────────────────

function updateProgress(current, total) {
  const pct  = Math.min(100, Math.round((current / total) * 100));
  const fill = document.getElementById('sim-progress-fill');
  const text = document.getElementById('sim-progress-text');
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = `Step ${current}`;
}

// ── TIMER ───────────────────────────────────────

function startTimer(seconds, onExpire) {
  timerSeconds = seconds;
  const countEl    = document.getElementById('timer-count');
  const circleEl   = document.getElementById('timer-circle');
  const circumference = 163.36; // 2πr = 2 * π * 26

  // Reset
  if (circleEl) circleEl.style.strokeDashoffset = 0;
  if (countEl)  countEl.textContent = seconds;

  timerInterval = setInterval(() => {
    timerSeconds--;

    if (countEl) countEl.textContent = timerSeconds;

    const offset = circumference * (1 - timerSeconds / seconds);
    if (circleEl) {
      circleEl.style.strokeDashoffset = offset;
      // Colour shift
      if (timerSeconds <= 5)  circleEl.style.stroke = '#FF4757';
      else if (timerSeconds <= 10) circleEl.style.stroke = '#FF9F43';
      else circleEl.style.stroke = 'var(--primary)';
    }
    if (countEl && timerSeconds <= 5) countEl.style.color = '#FF4757';
    else if (countEl) countEl.style.color = 'var(--text-1)';

    if (timerSeconds <= 0) {
      clearTimer();
      if (typeof onExpire === 'function') onExpire();
    }
  }, 1000);
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  // Reset circle
  const circleEl = document.getElementById('timer-circle');
  const countEl  = document.getElementById('timer-count');
  if (circleEl) { circleEl.style.strokeDashoffset = 0; circleEl.style.stroke = 'var(--primary)'; }
  if (countEl)  { countEl.textContent = '15'; countEl.style.color = 'var(--text-1)'; }
}

function showTimerWarning() {
  const body = document.getElementById('sim-body');
  const existing = body.querySelector('.timer-warning');
  if (existing) return;

  const warn = document.createElement('div');
  warn.className = 'timer-warning action-emergency-banner';
  warn.style.margin = '16px 0 0';
  warn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;flex-shrink:0">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    Time is up — please make a decision now!
  `;
  body.querySelector('.node-content').appendChild(warn);
}

// ── VOICE OUTPUT ────────────────────────────────

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate   = 0.95;
  utter.pitch  = 1;
  utter.volume = 0.9;
  // Prefer a clear English voice if available
  const voices = window.speechSynthesis.getVoices();
  const pref   = voices.find(v => v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en'));
  if (pref) utter.voice = pref;
  window.speechSynthesis.speak(utter);
}

// ── RETRY / RESTART ─────────────────────────────

function retryScenario() {
  startSimulation(); // re-uses currentScenarioKey
}

// ── INIT ────────────────────────────────────────

// Preload voices (some browsers require this)
window.speechSynthesis && window.speechSynthesis.getVoices();
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

// Landing screen ready
document.getElementById('screen-landing').classList.add('active');
