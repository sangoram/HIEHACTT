// Generated from the app's built-in list by the build — the starting point of the master list.
export default [
 {
  "id": "s1",
  "n": 1,
  "title": "Delivery Room — Immediate Resuscitation",
  "window": "0–10 min",
  "headerNote": "High HIE risk if PPV > 10 min or Apgar < 6 at 10 min → notify NICU & activate the cooling pathway",
  "headerNoteTone": "clay",
  "items": [
   {
    "id": "s1d",
    "label": "Obtain cord gases",
    "critical": true,
    "detail": "Arterial AND venous — draw before the cord dries."
   },
   {
    "id": "s1g",
    "label": "Enter birth weight in Health Connect ASAP",
    "critical": true
   },
   {
    "id": "s1e",
    "label": "Assign & document Apgar scores at 1, 5 & 10 min",
    "deadlineMin": 10,
    "timerLabel": "Apgar at 10 min",
    "apgar": true
   },
   {
    "id": "s1h",
    "label": "Request that OB sends placenta to pathology",
    "detail": "Placental pathology is critical for etiology and medicolegal documentation."
   }
  ]
 },
 {
  "id": "s2",
  "n": 2,
  "title": "Rapid HIE Screening & Cooling Decision",
  "window": "10–60 min",
  "algo": true,
  "phones": true,
  "sarnatHeader": true,
  "items": [
   {
    "id": "s2iv",
    "label": "Establish a peripheral IV and obtain a venous blood gas with a glucose within 30 minutes of life",
    "critical": true,
    "deadlineMin": 30,
    "timerLabel": "Venous gas + glucose by 30 min",
    "followup": "If glucose ≤ 40 mg/dL → IV dextrose, then recheck"
   },
   {
    "id": "s2os",
    "label": "Drop order set — Infant Body Cooling (NICU): “Active Cooling Prior to Transport” (Katrina Marie Jhun, M.D.)",
    "critical": true
   },
   {
    "id": "s2vitk",
    "label": "Vitamin K — high-priority nursing task; give prior to line placement",
    "critical": true
   },
   {
    "id": "s2ul",
    "label": "Umbilical line placement (UAC/UVC)",
    "detail": "Stylistic variation in sequencing — teams differ on the order of lines vs. temp probe vs. labs. Depth estimates auto-calculate in the header from birth weight."
   },
   {
    "id": "s2bg",
    "label": "Order Babygram — verify UVC/UAC line placement & ETT position; assess whether the baby needs surfactant"
   },
   {
    "id": "s2abx",
    "label": "Antibiotics — consider ampicillin + cefotaxime if AKI / creatinine concern or worsening acidosis"
   },
   {
    "id": "s2c",
    "label": "Initiate passive cooling NOW — turn off the radiant warmer; do not actively warm",
    "critical": true,
    "followup": "Arrange active servo-controlled cooling, or emergent transfer to a cooling center"
   },
   {
    "id": "s2e",
    "label": "Guard against iatrogenic hyperthermia — even brief temp elevation worsens secondary injury"
   }
  ]
 },
 {
  "id": "s3",
  "n": 3,
  "title": "Initiation of Therapeutic Hypothermia",
  "window": "ASAP · within 6 h",
  "items": [
   {
    "id": "s3a",
    "label": "Set target core temp 33.5 °C (esophageal probe positioned in lower third of esophagus — confirm on X-ray)",
    "followup": "Maintain 33.5 °C continuously for 72 hours",
    "detail": "Landmark: nose-to-ear-to-xiphoid, or per nursing-policy OG-measurement method. ~17 cm at term; 13–14 cm typical range. Sits in the distal esophagus, lower third."
   },
   {
    "id": "s3d",
    "label": "GA 35 0/7–35 6/7: cooling case-by-case with family · not recommended < 35 wk",
    "showIf": "ga35"
   },
   {
    "id": "s3e",
    "label": "Apply aEEG (BrainZ) to monitor for seizures",
    "note": "Up to 50% of moderate–severe HIE seize in the first 72 h; most are electrographic-only"
   }
  ]
 },
 {
  "id": "s4",
  "n": 4,
  "title": "Initial Laboratory Workup",
  "window": "First 1–2 h",
  "items": [
   {
    "id": "s4a",
    "label": "Blood gas & glucose — point-of-care, serial monitoring"
   },
   {
    "id": "s4c",
    "label": "CBC with differential"
   },
   {
    "id": "s4d",
    "label": "Chemistries — Chem 10, AST/ALT"
   },
   {
    "id": "s4h",
    "label": "Coagulation — PT, PTT, fibrinogen"
   },
   {
    "id": "s4i",
    "label": "Lactate"
   },
   {
    "id": "s4j",
    "label": "Neonatal Blood Culture — STAT"
   }
  ]
 },
 {
  "id": "s6",
  "n": 5,
  "title": "Respiratory Management",
  "window": "Ongoing",
  "items": [
   {
    "id": "s6vent",
    "label": "If intubated — starting vent settings: SIMV Volume Guarantee 5 mL/kg, Rate 40, iTime 0.4, PEEP 5–6"
   },
   {
    "id": "s6a",
    "label": "Target SpO₂ 91–95% — avoid hyperoxia, which worsens reperfusion injury",
    "critical": true
   },
   {
    "id": "s6b",
    "label": "Target PaCO₂ 45–55 mmHg — strictly avoid hypocapnia (< 35 worsens cerebral vasoconstriction)",
    "critical": true
   },
   {
    "id": "s6c",
    "label": "Temperature-correct all blood gases while cooling"
   },
   {
    "id": "s6d",
    "label": "Anticipate comorbidities needing treatment if high FiO₂ — intubation for surfactant, nitric oxide for pulmonary hypertension, blood for volume loss / fetomaternal hemorrhage"
   }
  ]
 },
 {
  "id": "s7",
  "n": 6,
  "title": "Hemodynamic Support",
  "window": "Ongoing",
  "items": [
   {
    "id": "s7a",
    "label": "Maintain MAP ≥ 40 mmHg (or ≥ gestational age in weeks)",
    "critical": true
   },
   {
    "id": "s7b",
    "label": "Consider Early ECHO or targeted Neonatal ECHO — assess LV function, filling, PPHN, PDA shunt direction, CCHD"
   },
   {
    "id": "s7c",
    "label": "Cautious fluid bolus only for documented hypovolemia — avoid volume overload"
   },
   {
    "id": "s7d",
    "label": "Vasopressor Support — Dopamine 5 mcg/kg/min initiation, not to exceed 10 mcg/kg/min if PPHN suspected; add dobutamine or epinephrine if volume replete"
   },
   {
    "id": "s7acet",
    "label": "Sodium acetate — full (not half) for arterial-line fluids in severe acidosis (~1 mL/hr)",
    "critical": true,
    "detail": "Flag: currently missing from the order panel — enter manually."
   },
   {
    "id": "s7coag",
    "label": "Coagulopathy / transfusion thresholds — call Blood Bank x44260 directly for fastest response",
    "detail": "pRBCs 15–20 mL/kg (O-neg uncrossmatched if suspected major blood loss & hypovolemic shock — do NOT order in HC → call Blood Bank!).\nCryoprecipitate for fibrinogen < 150.\nFFP for elevated PT / INR / PTT.\nPlatelets for Plts < 50."
   }
  ]
 },
 {
  "id": "s8",
  "n": 7,
  "title": "Metabolic Homeostasis",
  "window": "Ongoing",
  "items": [
   {
    "id": "s8e",
    "label": "Restrict continuous fluids to 40–60 mL/kg/d, especially if other products given and AKI suspected"
   },
   {
    "id": "s8a",
    "label": "Glucose 50–100 mg/dL — both hypo- and hyperglycemia worsen outcome",
    "critical": true
   },
   {
    "id": "s8b",
    "label": "Sodium 135–145; replace ongoing losses, watch for SIADH"
   },
   {
    "id": "s8c",
    "label": "Ionized calcium > 1.0 mmol/L; magnesium 1.8–2.5 mg/dL"
   },
   {
    "id": "s8d",
    "label": "Do NOT rapidly correct metabolic acidosis with bicarbonate"
   }
  ]
 },
 {
  "id": "s9",
  "n": 8,
  "title": "Seizure Management",
  "window": "As needed",
  "headerNote": "Consult Peds Neuro via ClinConnect for seizure-management guidance",
  "headerNoteTone": "sage",
  "items": [
   {
    "id": "s9a",
    "label": "cEEG-guided treatment — treat both electrographic & electroclinical seizures",
    "critical": true
   },
   {
    "id": "s9b",
    "label": "1st line — phenobarbital 20 mg/kg IV load; may repeat to 40 mg/kg total"
   },
   {
    "id": "s9c",
    "label": "2nd line — levetiracetam 40–60 mg/kg IV, or fosphenytoin 20 mg/kg IV"
   },
   {
    "id": "s9d",
    "label": "3rd line — midazolam infusion 0.05–0.4 mg/kg/h (or lidocaine where protocol)"
   },
   {
    "id": "s9e",
    "label": "Reassess EEG burden after each load before stacking agents"
   }
  ]
 },
 {
  "id": "s10",
  "n": 9,
  "title": "Pain & Sedation",
  "window": "Ongoing",
  "items": [
   {
    "id": "s10a",
    "label": "Score with N-PASS q4h — cooling is uncomfortable; under-sedation drives shivering"
   },
   {
    "id": "s10b",
    "label": "Morphine 10–20 mcg/kg/hr infusion; avoid bolus if hemodynamically unstable"
   },
   {
    "id": "s10prec",
    "label": "Dexmedetomidine (Precedex) drip 0.02 mcg/kg/min baseline — adjunct to reduce morphine use; spot-dose morphine before starting the drip"
   },
   {
    "id": "s10c",
    "label": "Avoid shivering — undermines cooling and increases metabolic demand",
    "critical": true
   },
   {
    "id": "s10d",
    "label": "Use lowest effective dose; opioids accumulate with renal/hepatic dysfunction"
   }
  ]
 },
 {
  "id": "s11",
  "n": 10,
  "title": "Documentation & Communication",
  "window": "Throughout",
  "items": [
   {
    "id": "s11a",
    "label": "Document Resuscitation Note — Apgars & resuscitation details. Consider Voice Memos live in the delivery room to track key timepoints (intubation / CPAP / PPV, O₂ saturations, etc.) to help nursing & physician recreate the DR timeline; include cord gases and the modified Sarnat evaluation"
   },
   {
    "id": "s11b",
    "label": "Modified Sarnat evaluation every 1–2 h until stable, transferred, or no longer a cooling candidate"
   },
   {
    "id": "s11c",
    "label": "Update family at admission of the cooling decision — consent for lines, transport, and blood-product administration at the same time"
   },
   {
    "id": "s11e",
    "label": "Notify Referring OB (H1 · x43347) — remind to send placenta to pathology, inform them baby is transferring, and consider arranging possible maternal transfer"
   },
   {
    "id": "s11reg",
    "label": "Add patient to HIE registry (HealthConnect HIE list)"
   },
   {
    "id": "s11do",
    "label": "Place Discharge Order at time of transfer"
   },
   {
    "id": "s11ds",
    "label": "Complete Discharge Summary prior to transport arrival",
    "critical": true
   },
   {
    "id": "s11neuro",
    "label": "Serial modified Sarnat evaluations over the first 4 h (reassess q1–2 h)",
    "detail": "Document in a separate .peenhancedneuro dotphrase, or in the admission H&P and discharge summary."
   }
  ]
 },
 {
  "id": "s12",
  "n": 11,
  "title": "Anticipatory Planning",
  "window": "Day 1+",
  "items": [
   {
    "id": "s12a",
    "label": "Brain MRI between day 4–5 (after rewarming completed)",
    "critical": true
   },
   {
    "id": "s12b",
    "label": "Rewarm at 0.5 °C/hr over 6–10 h after 72 h at target temperature"
   },
   {
    "id": "s12c",
    "label": "Watch for seizure rebound during rewarming — keep cEEG running"
   },
   {
    "id": "s12d",
    "label": "RCEB referral, HRIF referral"
   },
   {
    "id": "s12f",
    "label": "Family neurodevelopmental counseling & resource handoff"
   }
  ]
 }
];
