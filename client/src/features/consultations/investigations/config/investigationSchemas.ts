/**
 * Configurări data-driven pentru formularele investigațiilor structurate.
 * Fiecare investigație definește o listă de câmpuri tipizate, cu unități,
 * intervale fiziologice și (opțional) intervale anormale.
 *
 * Renderer-ul (StructuredFormRenderer) iterează prin câmpuri și produce
 * input-uri specifice tipului — astfel adăugarea unui tip nou nu necesită
 * scrierea unei componente noi, doar adăugarea unei intrări în acest fișier.
 */

export type FieldType = 'number' | 'integer' | 'string' | 'boolean' | 'select' | 'group'

export interface FieldSpec {
  /** Cheie folosită în obiectul JSON (camelCase per convenția JS). */
  name: string
  /** Etichetă afișată în UI. */
  label: string
  type: FieldType
  unit?: string
  min?: number
  max?: number
  /** Praguri de valoare normală – dacă valoarea iese din interval, se afișează AbnormalIndicator. */
  normalMin?: number
  normalMax?: number
  options?: { value: string; label: string }[]
  placeholder?: string
  /** Pentru câmpuri auto-calculate (read-only, calculate din alte câmpuri). */
  computed?: boolean
  /** Pentru type='group' — sub-câmpuri grupate sub un sub-obiect. */
  fields?: FieldSpec[]
  /** Lățime în coloane grilă (default 1 din 3). */
  cols?: 1 | 2 | 3
}

export interface InvestigationFormSchema {
  typeCode: string
  /** Tab-ul intern al formularului (când investigația are mai multe secțiuni - ex. PSG). */
  sections?: { title: string; fields: FieldSpec[] }[]
  /** Schemă plată (când nu există secțiuni). */
  fields?: FieldSpec[]
}

// ───────── Pneumology ─────────
const SPIROMETRY: InvestigationFormSchema = {
  typeCode: 'Spirometry',
  fields: [
    { name: 'fvc', label: 'FVC', type: 'number', unit: 'L', min: 0, max: 8 },
    { name: 'fvc_Predicted', label: 'FVC %prezis', type: 'number', unit: '%', min: 0, max: 200 },
    { name: 'fev1', label: 'FEV1', type: 'number', unit: 'L', min: 0, max: 8 },
    { name: 'fev1_Predicted', label: 'FEV1 %prezis', type: 'number', unit: '%', min: 0, max: 200 },
    { name: 'fev1_FVC_Ratio', label: 'FEV1/FVC', type: 'number', unit: '%', min: 0, max: 100, normalMin: 70, computed: true },
    { name: 'pef', label: 'PEF', type: 'number', unit: 'L/s', min: 0, max: 20 },
    { name: 'pef_Predicted', label: 'PEF %prezis', type: 'number', unit: '%', min: 0, max: 200 },
    { name: 'fef25_75', label: 'FEF25-75', type: 'number', unit: 'L/s', min: 0, max: 15 },
    { name: 'gold_Stage', label: 'Stadiu GOLD', type: 'select', options: [
      { value: '', label: '—' },
      { value: 'GOLD 1', label: 'GOLD 1 (ușoară)' },
      { value: 'GOLD 2', label: 'GOLD 2 (moderată)' },
      { value: 'GOLD 3', label: 'GOLD 3 (severă)' },
      { value: 'GOLD 4', label: 'GOLD 4 (foarte severă)' },
    ] },
    { name: 'postBronchodilator', label: 'Post-bronhodilatator', type: 'boolean' },
    { name: 'reversibility_Percent', label: 'Reversibilitate', type: 'number', unit: '%', min: -100, max: 100, normalMin: 12 },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

const DLCO: InvestigationFormSchema = {
  typeCode: 'DLCO',
  fields: [
    { name: 'dlco', label: 'DLCO', type: 'number', unit: 'mL/min/mmHg', min: 0, max: 60 },
    { name: 'dlco_Predicted', label: 'DLCO %prezis', type: 'number', unit: '%', min: 0, max: 200, normalMin: 80 },
    { name: 'dlco_VA', label: 'DLCO/VA', type: 'number', unit: 'mL/min/mmHg/L', min: 0, max: 10 },
    { name: 'va', label: 'VA', type: 'number', unit: 'L', min: 0, max: 10 },
    { name: 'kco', label: 'KCO', type: 'number', unit: 'mL/min/mmHg/L', min: 0, max: 10 },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

const ABG: InvestigationFormSchema = {
  typeCode: 'ABG',
  fields: [
    { name: 'pH', label: 'pH', type: 'number', min: 6.5, max: 8, normalMin: 7.35, normalMax: 7.45 },
    { name: 'paO2', label: 'PaO2', type: 'number', unit: 'mmHg', min: 0, max: 600, normalMin: 80, normalMax: 100 },
    { name: 'paCO2', label: 'PaCO2', type: 'number', unit: 'mmHg', min: 0, max: 200, normalMin: 35, normalMax: 45 },
    { name: 'hcO3', label: 'HCO3', type: 'number', unit: 'mEq/L', min: 0, max: 60, normalMin: 22, normalMax: 26 },
    { name: 'be', label: 'BE', type: 'number', unit: 'mEq/L', min: -30, max: 30, normalMin: -2, normalMax: 2 },
    { name: 'saO2', label: 'SaO2', type: 'number', unit: '%', min: 0, max: 100, normalMin: 95 },
    { name: 'lactate', label: 'Lactate', type: 'number', unit: 'mmol/L', min: 0, max: 20, normalMax: 2 },
    { name: 'fiO2', label: 'FiO2', type: 'string', placeholder: '21% / 4 L/min' },
    { name: 'interpretation', label: 'Interpretare', type: 'string', cols: 3 },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

const OXIMETRY: InvestigationFormSchema = {
  typeCode: 'Oximetry',
  fields: [
    { name: 'spO2_Rest', label: 'SpO2 repaus', type: 'number', unit: '%', min: 0, max: 100, normalMin: 95 },
    { name: 'spO2_Min', label: 'SpO2 minim', type: 'number', unit: '%', min: 0, max: 100, normalMin: 90 },
    { name: 'spO2_Mean', label: 'SpO2 mediu', type: 'number', unit: '%', min: 0, max: 100 },
    { name: 'hr_Rest', label: 'HR repaus', type: 'integer', unit: 'bpm', min: 0, max: 250, normalMin: 60, normalMax: 100 },
    { name: 'hr_Max', label: 'HR maxim', type: 'integer', unit: 'bpm', min: 0, max: 250 },
    { name: 'desaturationIndex', label: 'Index desaturări (ODI)', type: 'integer', min: 0, max: 200, normalMax: 5 },
    { name: 'timeBelow90_Percent', label: 'T90', type: 'number', unit: '%', min: 0, max: 100, normalMax: 5 },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

const SIX_MWT: InvestigationFormSchema = {
  typeCode: 'SixMWT',
  fields: [
    { name: 'distanceMeters', label: 'Distanță parcursă', type: 'integer', unit: 'm', min: 0, max: 1500 },
    { name: 'distancePredictedMeters', label: 'Distanță prezisă', type: 'integer', unit: 'm', min: 0, max: 1500 },
    { name: 'spO2_Start', label: 'SpO2 start', type: 'number', unit: '%', min: 0, max: 100 },
    { name: 'spO2_End', label: 'SpO2 final', type: 'number', unit: '%', min: 0, max: 100 },
    { name: 'spO2_Min', label: 'SpO2 minim', type: 'number', unit: '%', min: 0, max: 100, normalMin: 90 },
    { name: 'hr_Start', label: 'HR start', type: 'integer', unit: 'bpm', min: 0, max: 250 },
    { name: 'hr_End', label: 'HR final', type: 'integer', unit: 'bpm', min: 0, max: 250 },
    { name: 'hr_Max', label: 'HR maxim', type: 'integer', unit: 'bpm', min: 0, max: 250 },
    { name: 'borg_Dyspnea_Start', label: 'Borg dispnee start', type: 'integer', min: 0, max: 10 },
    { name: 'borg_Dyspnea_End', label: 'Borg dispnee final', type: 'integer', min: 0, max: 10 },
    { name: 'borg_Fatigue_Start', label: 'Borg oboseală start', type: 'integer', min: 0, max: 10 },
    { name: 'borg_Fatigue_End', label: 'Borg oboseală final', type: 'integer', min: 0, max: 10 },
    { name: 'stopsCount', label: 'Număr opriri', type: 'integer', min: 0, max: 50 },
    { name: 'usedSupplementalO2', label: 'O2 suplimentar', type: 'boolean' },
    { name: 'o2_Lpm', label: 'Flux O2', type: 'number', unit: 'L/min', min: 0, max: 15 },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

// ───────── Cardiology ─────────
const ECG: InvestigationFormSchema = {
  typeCode: 'ECG',
  fields: [
    { name: 'rhythm', label: 'Ritm', type: 'string', placeholder: 'Sinusal regulat' },
    { name: 'heartRate', label: 'Frecvență cardiacă', type: 'integer', unit: 'bpm', min: 0, max: 300, normalMin: 60, normalMax: 100 },
    { name: 'pR_ms', label: 'PR', type: 'integer', unit: 'ms', min: 0, max: 500, normalMin: 120, normalMax: 200 },
    { name: 'qrS_ms', label: 'QRS', type: 'integer', unit: 'ms', min: 0, max: 300, normalMax: 120 },
    { name: 'qT_ms', label: 'QT', type: 'integer', unit: 'ms', min: 0, max: 800 },
    { name: 'qTc_ms', label: 'QTc', type: 'integer', unit: 'ms', min: 0, max: 800, normalMax: 450 },
    { name: 'axis', label: 'Ax electric', type: 'string', placeholder: '−30° până +90°' },
    { name: 'atrialFibrillation', label: 'Fibrilație atrială', type: 'boolean' },
    { name: 'lbbb', label: 'BRS (LBBB)', type: 'boolean' },
    { name: 'rbbb', label: 'BRD (RBBB)', type: 'boolean' },
    { name: 'lvh', label: 'HVS (LVH)', type: 'boolean' },
    { name: 'rvh', label: 'HVD (RVH)', type: 'boolean' },
    { name: 'stElevation', label: 'Supradenivelare ST', type: 'boolean' },
    { name: 'stDepression', label: 'Subdenivelare ST', type: 'boolean' },
    { name: 'tWaveInversion', label: 'Inversiune T', type: 'boolean' },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

const ECHO: InvestigationFormSchema = {
  typeCode: 'Echocardiography',
  fields: [
    { name: 'lvef', label: 'LVEF', type: 'number', unit: '%', min: 0, max: 90, normalMin: 55 },
    { name: 'lveDD', label: 'LVEDD', type: 'number', unit: 'mm', min: 0, max: 100, normalMax: 55 },
    { name: 'lveSD', label: 'LVESD', type: 'number', unit: 'mm', min: 0, max: 100 },
    { name: 'ivSd', label: 'IVSd', type: 'number', unit: 'mm', min: 0, max: 30, normalMax: 12 },
    { name: 'pWd', label: 'PWd', type: 'number', unit: 'mm', min: 0, max: 30, normalMax: 12 },
    { name: 'laVi', label: 'LAVi', type: 'number', unit: 'mL/m²', min: 0, max: 100, normalMax: 34 },
    { name: 'e_A_Ratio', label: 'E/A', type: 'number', min: 0, max: 5 },
    { name: 'e_e_Ratio', label: 'E/e\'', type: 'number', min: 0, max: 30, normalMax: 14 },
    { name: 'pasp', label: 'PASP', type: 'number', unit: 'mmHg', min: 0, max: 100, normalMax: 35 },
    { name: 'tapse', label: 'TAPSE', type: 'number', unit: 'mm', min: 0, max: 40, normalMin: 17 },
    { name: 'aorticValve', label: 'Valvă aortică', type: 'string' },
    { name: 'mitralValve', label: 'Valvă mitrală', type: 'string' },
    { name: 'tricuspidValve', label: 'Valvă tricuspidă', type: 'string' },
    { name: 'pulmonicValve', label: 'Valvă pulmonară', type: 'string' },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

const HOLTER_ECG: InvestigationFormSchema = {
  typeCode: 'Holter_ECG',
  fields: [
    { name: 'durationHours', label: 'Durată', type: 'integer', unit: 'h', min: 0, max: 168 },
    { name: 'averageHR', label: 'HR mediu', type: 'integer', unit: 'bpm', min: 0, max: 250, normalMin: 60, normalMax: 100 },
    { name: 'minHR', label: 'HR minim', type: 'integer', unit: 'bpm', min: 0, max: 250 },
    { name: 'maxHR', label: 'HR maxim', type: 'integer', unit: 'bpm', min: 0, max: 250 },
    { name: 'pvC_Count', label: 'Extrasistole ventriculare', type: 'integer', min: 0, max: 100000 },
    { name: 'paC_Count', label: 'Extrasistole atriale', type: 'integer', min: 0, max: 100000 },
    { name: 'vT_Episodes', label: 'Episoade TV', type: 'integer', min: 0, max: 1000 },
    { name: 'svT_Episodes', label: 'Episoade TSV', type: 'integer', min: 0, max: 1000 },
    { name: 'aFibDetected', label: 'FA detectată', type: 'boolean' },
    { name: 'aFibBurdenPercent', label: 'Burden FA', type: 'number', unit: '%', min: 0, max: 100 },
    { name: 'pausesOver2sec', label: 'Pauze > 2s', type: 'integer', min: 0, max: 1000 },
    { name: 'longestPause_ms', label: 'Pauză maximă', type: 'integer', unit: 'ms', min: 0, max: 10000 },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

const HOLTER_BP: InvestigationFormSchema = {
  typeCode: 'Holter_BP',
  fields: [
    { name: 'durationHours', label: 'Durată', type: 'integer', unit: 'h', min: 0, max: 168 },
    { name: 'avg24hSBP', label: 'TAS 24h', type: 'number', unit: 'mmHg', min: 0, max: 300, normalMax: 130 },
    { name: 'avg24hDBP', label: 'TAD 24h', type: 'number', unit: 'mmHg', min: 0, max: 200, normalMax: 80 },
    { name: 'avgDaySBP', label: 'TAS zi', type: 'number', unit: 'mmHg', min: 0, max: 300, normalMax: 135 },
    { name: 'avgDayDBP', label: 'TAD zi', type: 'number', unit: 'mmHg', min: 0, max: 200, normalMax: 85 },
    { name: 'avgNightSBP', label: 'TAS noapte', type: 'number', unit: 'mmHg', min: 0, max: 300, normalMax: 120 },
    { name: 'avgNightDBP', label: 'TAD noapte', type: 'number', unit: 'mmHg', min: 0, max: 200, normalMax: 70 },
    { name: 'nocturnalDipPercent', label: 'Dip nocturn', type: 'number', unit: '%', min: -50, max: 50, normalMin: 10, normalMax: 20 },
    { name: 'dipperPattern', label: 'Pattern', type: 'select', options: [
      { value: '', label: '—' },
      { value: 'dipper', label: 'Dipper (10-20%)' },
      { value: 'non-dipper', label: 'Non-dipper (<10%)' },
      { value: 'extreme', label: 'Extreme dipper (>20%)' },
      { value: 'reverse', label: 'Reverse dipper' },
    ] },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

const STRESS_TEST: InvestigationFormSchema = {
  typeCode: 'StressTest',
  fields: [
    { name: 'protocol', label: 'Protocol', type: 'select', options: [
      { value: '', label: '—' },
      { value: 'Bruce', label: 'Bruce' },
      { value: 'ModifiedBruce', label: 'Bruce modificat' },
      { value: 'Naughton', label: 'Naughton' },
    ] },
    { name: 'durationSeconds', label: 'Durată', type: 'integer', unit: 's', min: 0, max: 3600 },
    { name: 'meTs', label: 'METs', type: 'integer', min: 0, max: 25, normalMin: 7 },
    { name: 'peakHR', label: 'HR maxim', type: 'integer', unit: 'bpm', min: 0, max: 250 },
    { name: 'peakSBP', label: 'TAS maximă', type: 'integer', unit: 'mmHg', min: 0, max: 300 },
    { name: 'peakDBP', label: 'TAD maximă', type: 'integer', unit: 'mmHg', min: 0, max: 200 },
    { name: 'stChanges', label: 'Modificări ST', type: 'boolean' },
    { name: 'symptoms', label: 'Simptome', type: 'string', cols: 2 },
    { name: 'conclusion', label: 'Concluzie', type: 'string', cols: 3 },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

// ───────── Sleep ─────────
const PSG_DIAGNOSTIC: InvestigationFormSchema = {
  typeCode: 'PSG_Diagnostic',
  sections: [
    { title: 'Arhitectura somnului', fields: [
      { name: 'sleepArchitecture.tsT_min', label: 'TST', type: 'number', unit: 'min', min: 0, max: 720 },
      { name: 'sleepArchitecture.sleepEfficiency', label: 'Eficiență somn', type: 'number', unit: '%', min: 0, max: 100, normalMin: 85 },
      { name: 'sleepArchitecture.sleepLatency_min', label: 'Latență somn', type: 'number', unit: 'min', min: 0, max: 240, normalMax: 30 },
      { name: 'sleepArchitecture.remLatency_min', label: 'Latență REM', type: 'number', unit: 'min', min: 0, max: 360 },
      { name: 'sleepArchitecture.n1_Percent', label: 'N1', type: 'number', unit: '%', min: 0, max: 100 },
      { name: 'sleepArchitecture.n2_Percent', label: 'N2', type: 'number', unit: '%', min: 0, max: 100 },
      { name: 'sleepArchitecture.n3_Percent', label: 'N3', type: 'number', unit: '%', min: 0, max: 100 },
      { name: 'sleepArchitecture.reM_Percent', label: 'REM', type: 'number', unit: '%', min: 0, max: 100 },
    ] },
    { title: 'Evenimente respiratorii', fields: [
      { name: 'respiratoryEvents.ahI_Total', label: 'AHI total', type: 'number', min: 0, max: 200, normalMax: 5 },
      { name: 'respiratoryEvents.ahI_REM', label: 'AHI REM', type: 'number', min: 0, max: 200 },
      { name: 'respiratoryEvents.ahI_NREM', label: 'AHI NREM', type: 'number', min: 0, max: 200 },
      { name: 'respiratoryEvents.ahI_Supine', label: 'AHI supin', type: 'number', min: 0, max: 200 },
      { name: 'respiratoryEvents.ahI_NonSupine', label: 'AHI non-supin', type: 'number', min: 0, max: 200 },
      { name: 'respiratoryEvents.centralApneas', label: 'Apnei centrale', type: 'integer', min: 0, max: 1000 },
      { name: 'respiratoryEvents.obstructiveApneas', label: 'Apnei obstructive', type: 'integer', min: 0, max: 1000 },
      { name: 'respiratoryEvents.mixedApneas', label: 'Apnei mixte', type: 'integer', min: 0, max: 1000 },
      { name: 'respiratoryEvents.hypopneas', label: 'Hipopnei', type: 'integer', min: 0, max: 2000 },
      { name: 'respiratoryEvents.rdi', label: 'RDI', type: 'number', min: 0, max: 200 },
    ] },
    { title: 'Oximetrie', fields: [
      { name: 'oximetry.spO2_Mean', label: 'SpO2 mediu', type: 'number', unit: '%', min: 0, max: 100, normalMin: 90 },
      { name: 'oximetry.spO2_Min', label: 'SpO2 minim', type: 'number', unit: '%', min: 0, max: 100, normalMin: 88 },
      { name: 'oximetry.t90_Percent', label: 'T90', type: 'number', unit: '%', min: 0, max: 100, normalMax: 5 },
      { name: 'oximetry.odi', label: 'ODI', type: 'number', min: 0, max: 200, normalMax: 5 },
    ] },
    { title: 'PLM / Cardiac / Poziție / Sforăit', fields: [
      { name: 'plm.plmi', label: 'PLMI', type: 'integer', min: 0, max: 200 },
      { name: 'plm.plmS_Index', label: 'PLMS', type: 'integer', min: 0, max: 200 },
      { name: 'cardiac.avgHR', label: 'HR mediu', type: 'integer', unit: 'bpm', min: 0, max: 250 },
      { name: 'cardiac.minHR', label: 'HR minim', type: 'integer', unit: 'bpm', min: 0, max: 250 },
      { name: 'cardiac.maxHR', label: 'HR maxim', type: 'integer', unit: 'bpm', min: 0, max: 250 },
      { name: 'position.supinePercent', label: '% supin', type: 'number', unit: '%', min: 0, max: 100 },
      { name: 'position.nonSupinePercent', label: '% non-supin', type: 'number', unit: '%', min: 0, max: 100 },
      { name: 'snoring.snoringPercent', label: '% sforăit', type: 'number', unit: '%', min: 0, max: 100 },
    ] },
    { title: 'Concluzii', fields: [
      { name: 'osA_Severity', label: 'Severitate OSA', type: 'select', options: [
        { value: '', label: '—' },
        { value: 'None', label: 'Fără OSA (AHI <5)' },
        { value: 'Mild', label: 'Ușoară (5-15)' },
        { value: 'Moderate', label: 'Moderată (15-30)' },
        { value: 'Severe', label: 'Severă (>30)' },
      ] },
      { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
    ] },
  ],
}

const PSG_SPLIT_NIGHT: InvestigationFormSchema = {
  typeCode: 'PSG_SplitNight',
  fields: [
    { name: 'diagnosticHalf.ahI_Total', label: 'AHI faza diagnostică', type: 'number', min: 0, max: 200, normalMax: 5 },
    { name: 'cpaP_PressureRange', label: 'Plajă presiune CPAP', type: 'string', placeholder: '5-12 cmH2O' },
    { name: 'titrationHalf.ahI_Total', label: 'AHI faza titrare', type: 'number', min: 0, max: 200 },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

const CPAP_TITRATION: InvestigationFormSchema = {
  typeCode: 'CPAP_Titration',
  fields: [
    { name: 'device', label: 'Dispozitiv', type: 'select', options: [
      { value: '', label: '—' },
      { value: 'CPAP', label: 'CPAP' },
      { value: 'BiPAP', label: 'BiPAP' },
      { value: 'AutoPAP', label: 'AutoPAP' },
    ] },
    { name: 'optimalPressure_cmH2O', label: 'Presiune optimă', type: 'number', unit: 'cmH2O', min: 0, max: 30 },
    { name: 'ipap', label: 'IPAP', type: 'number', unit: 'cmH2O', min: 0, max: 30 },
    { name: 'epap', label: 'EPAP', type: 'number', unit: 'cmH2O', min: 0, max: 30 },
    { name: 'residualAHI', label: 'AHI rezidual', type: 'number', min: 0, max: 100, normalMax: 5 },
    { name: 'maskType', label: 'Tip mască', type: 'string' },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

const CPAP_FOLLOWUP: InvestigationFormSchema = {
  typeCode: 'CPAP_FollowUp',
  fields: [
    { name: 'usageHoursPerNight', label: 'Utilizare', type: 'number', unit: 'h/noapte', min: 0, max: 24, normalMin: 4 },
    { name: 'adherencePercent', label: 'Aderență', type: 'number', unit: '%', min: 0, max: 100, normalMin: 70 },
    { name: 'residualAHI', label: 'AHI rezidual', type: 'number', min: 0, max: 100, normalMax: 5 },
    { name: 'leakLpm', label: 'Scurgeri', type: 'number', unit: 'L/min', min: 0, max: 100, normalMax: 24 },
    { name: 'patientReportedSymptoms', label: 'Simptome raportate', type: 'string', cols: 3 },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

// ───────── Metabolic ─────────
const TTGO: InvestigationFormSchema = {
  typeCode: 'TTGO',
  fields: [
    { name: 'glucose_0min', label: 'Glicemie 0 min', type: 'number', unit: 'mg/dL', min: 0, max: 1000, normalMax: 100 },
    { name: 'glucose_60min', label: 'Glicemie 60 min', type: 'number', unit: 'mg/dL', min: 0, max: 1000 },
    { name: 'glucose_120min', label: 'Glicemie 120 min', type: 'number', unit: 'mg/dL', min: 0, max: 1000, normalMax: 140 },
    { name: 'insulin_0min', label: 'Insulină 0 min', type: 'number', unit: 'µU/mL', min: 0, max: 1000 },
    { name: 'insulin_60min', label: 'Insulină 60 min', type: 'number', unit: 'µU/mL', min: 0, max: 1000 },
    { name: 'insulin_120min', label: 'Insulină 120 min', type: 'number', unit: 'µU/mL', min: 0, max: 1000 },
    { name: 'interpretation', label: 'Interpretare', type: 'select', options: [
      { value: '', label: '—' },
      { value: 'Normal', label: 'Normal' },
      { value: 'IFG', label: 'IFG (glicemie bazală modificată)' },
      { value: 'IGT', label: 'IGT (toleranță alterată)' },
      { value: 'DM', label: 'Diabet zaharat' },
    ] },
    { name: 'notes', label: 'Observații', type: 'string', cols: 3 },
  ],
}

export const STRUCTURED_SCHEMAS: Record<string, InvestigationFormSchema> = {
  Spirometry: SPIROMETRY,
  DLCO,
  ABG,
  Oximetry: OXIMETRY,
  SixMWT: SIX_MWT,
  ECG,
  Echocardiography: ECHO,
  Holter_ECG: HOLTER_ECG,
  Holter_BP: HOLTER_BP,
  StressTest: STRESS_TEST,
  PSG_Diagnostic: PSG_DIAGNOSTIC,
  PSG_SplitNight: PSG_SPLIT_NIGHT,
  CPAP_Titration: CPAP_TITRATION,
  CPAP_FollowUp: CPAP_FOLLOWUP,
  TTGO,
}

// ───────── Questionnaires (auto-scored) ─────────
export interface QuestionnaireQuestion {
  key: string
  text: string
  /** Răspunsuri; valoarea numerică contribuie la scor. */
  options: { value: number; label: string }[]
}

export interface QuestionnaireSchema {
  typeCode: string
  introductionMd?: string
  questions: QuestionnaireQuestion[]
  /** Calculează scor + interpretare textuală. */
  scoring: (answers: Record<string, number | undefined>) => { totalScore: number; interpretation: string }
}

const epworthOptions = [
  { value: 0, label: '0 — niciodată' },
  { value: 1, label: '1 — șanse mici' },
  { value: 2, label: '2 — șanse moderate' },
  { value: 3, label: '3 — șanse mari' },
]

const EPWORTH: QuestionnaireSchema = {
  typeCode: 'Epworth',
  questions: [
    { key: 'q1', text: 'Stând și citind', options: epworthOptions },
    { key: 'q2', text: 'Privind la TV', options: epworthOptions },
    { key: 'q3', text: 'Stând inactiv într-un loc public (ex. teatru, întâlnire)', options: epworthOptions },
    { key: 'q4', text: 'Ca pasager într-o mașină timp de 1 oră fără pauză', options: epworthOptions },
    { key: 'q5', text: 'Întins pentru a vă odihni după-amiază', options: epworthOptions },
    { key: 'q6', text: 'Stând și discutând cu cineva', options: epworthOptions },
    { key: 'q7', text: 'Stând liniștit după prânz fără alcool', options: epworthOptions },
    { key: 'q8', text: 'În mașină, oprită câteva minute în trafic', options: epworthOptions },
  ],
  scoring: (a) => {
    const total = ['q1','q2','q3','q4','q5','q6','q7','q8'].reduce((s, k) => s + (a[k] ?? 0), 0)
    let interp = 'Normal (0-10)'
    if (total >= 11 && total <= 12) interp = 'Somnolență ușoară (11-12)'
    else if (total >= 13 && total <= 15) interp = 'Somnolență moderată (13-15)'
    else if (total >= 16) interp = 'Somnolență severă (16-24)'
    return { totalScore: total, interpretation: interp }
  },
}

const yesNoOptions = [
  { value: 0, label: 'Nu' },
  { value: 1, label: 'Da' },
]

const STOP_BANG: QuestionnaireSchema = {
  typeCode: 'STOP_BANG',
  questions: [
    { key: 'snoring', text: 'Sforăiți zgomotos? (mai tare decât vorbirea)', options: yesNoOptions },
    { key: 'tired', text: 'Vă simțiți obosit/somnolent în timpul zilei?', options: yesNoOptions },
    { key: 'observed', text: 'A observat cineva că opriți respirația în somn?', options: yesNoOptions },
    { key: 'pressure', text: 'Aveți (sau ați fost diagnosticat cu) HTA?', options: yesNoOptions },
    { key: 'bMI_Over35', text: 'IMC > 35 kg/m²?', options: yesNoOptions },
    { key: 'age_Over50', text: 'Vârsta > 50 ani?', options: yesNoOptions },
    { key: 'neck_Over40', text: 'Circumferința gâtului > 40 cm?', options: yesNoOptions },
    { key: 'male', text: 'Sex masculin?', options: yesNoOptions },
  ],
  scoring: (a) => {
    const total = ['snoring','tired','observed','pressure','bMI_Over35','age_Over50','neck_Over40','male']
      .reduce((s, k) => s + (a[k] ?? 0), 0)
    let interp = 'Risc scăzut (0-2)'
    if (total >= 3 && total <= 4) interp = 'Risc intermediar (3-4)'
    else if (total >= 5) interp = 'Risc ridicat (5-8)'
    return { totalScore: total, interpretation: interp }
  },
}

const catOptions = (low: string, high: string) => [0,1,2,3,4,5].map(v => ({ value: v, label: `${v}` + (v === 0 ? ` (${low})` : v === 5 ? ` (${high})` : '') }))

const CAT: QuestionnaireSchema = {
  typeCode: 'CAT',
  questions: [
    { key: 'q1', text: 'Niciodată tușesc / Tușesc tot timpul', options: catOptions('niciodată', 'tot timpul') },
    { key: 'q2', text: 'Fără secreții bronșice / Plin de secreții', options: catOptions('fără', 'plin') },
    { key: 'q3', text: 'Fără senzație de strângere / Strângere puternică', options: catOptions('fără', 'puternic') },
    { key: 'q4', text: 'Fără dispnee la efort / Dispnee severă la efort', options: catOptions('fără', 'severă') },
    { key: 'q5', text: 'Activitățile casnice nu sunt limitate / Sever limitate', options: catOptions('deloc', 'sever') },
    { key: 'q6', text: 'Mă simt încrezător să ies din casă / Nu mă simt deloc încrezător', options: catOptions('încrezător', 'deloc') },
    { key: 'q7', text: 'Dorm profund / Nu dorm profund din cauza pneumopatiei', options: catOptions('profund', 'deloc') },
    { key: 'q8', text: 'Am multă energie / Nu am energie deloc', options: catOptions('multă', 'deloc') },
  ],
  scoring: (a) => {
    const total = ['q1','q2','q3','q4','q5','q6','q7','q8'].reduce((s, k) => s + (a[k] ?? 0), 0)
    let interp = 'Impact redus (<10)'
    if (total >= 10 && total <= 20) interp = 'Impact moderat (10-20)'
    else if (total >= 21 && total <= 30) interp = 'Impact mare (21-30)'
    else if (total >= 31) interp = 'Impact foarte mare (>30)'
    return { totalScore: total, interpretation: interp }
  },
}

const MMRC: QuestionnaireSchema = {
  typeCode: 'mMRC',
  questions: [
    { key: 'grade', text: 'Selectați gradul', options: [
      { value: 0, label: '0 — Dispnee numai la efort intens' },
      { value: 1, label: '1 — Dispnee la mers rapid pe teren plat sau urcușuri ușoare' },
      { value: 2, label: '2 — Mers mai încet decât persoanele de aceeași vârstă' },
      { value: 3, label: '3 — Necesitate de pauze la 100 m / câteva minute' },
      { value: 4, label: '4 — Dispnee la îmbrăcat / nu poate ieși din casă' },
    ] },
  ],
  scoring: (a) => {
    const grade = a.grade ?? 0
    const labels = ['Foarte ușor', 'Ușor', 'Moderat', 'Sever', 'Foarte sever']
    return { totalScore: grade, interpretation: labels[grade] ?? '' }
  },
}

export const QUESTIONNAIRE_SCHEMAS: Record<string, QuestionnaireSchema> = {
  Epworth: EPWORTH,
  STOP_BANG,
  CAT,
  mMRC: MMRC,
}

/** Helper: pentru un câmp dot-path ('respiratoryEvents.ahI_Total'), citește valoarea dintr-un obiect imbricat. */
export function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

/** Helper: setează o valoare imbricată după dot-path, returnând un obiect nou (imutabil). */
export function setNested<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const next: Record<string, unknown> = { ...obj }
  let cursor: Record<string, unknown> = next
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    cursor[k] = { ...((cursor[k] as Record<string, unknown>) ?? {}) }
    cursor = cursor[k] as Record<string, unknown>
  }
  cursor[keys[keys.length - 1]] = value
  return next as T
}

/** Verifică dacă o valoare iese din intervalul normal definit de spec. */
export function isAbnormal(value: number | undefined, field: FieldSpec): boolean {
  if (value === undefined || value === null || Number.isNaN(value)) return false
  if (field.normalMin !== undefined && value < field.normalMin) return true
  if (field.normalMax !== undefined && value > field.normalMax) return true
  return false
}
