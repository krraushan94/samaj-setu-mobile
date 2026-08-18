export const COLORS = {
  primary:    '#C62828',   // Deep red — brand
  secondary:  '#1565C0',   // Blue — action
  success:    '#2E7D32',
  warning:    '#F57F17',
  danger:     '#B71C1C',
  critical:   '#D50000',
  background: '#F5F5F5',
  surface:    '#FFFFFF',
  text:       '#212121',
  textLight:  '#757575',
  border:     '#E0E0E0',
  sos:        '#FF1744',
};

export const PRIORITY_COLORS = {
  low:      '#2E7D32',
  medium:   '#F57F17',
  high:     '#E65100',
  critical: '#D50000',
};

export const STATUS_COLORS = {
  payment_pending: '#757575',
  open:            '#1565C0',
  in_progress:     '#F57F17',
  resolved:        '#2E7D32',
  closed:          '#424242',
};

export const STATUS_LABELS = {
  payment_pending: 'Payment Pending',
  open:            'Open',
  in_progress:     'In Progress',
  resolved:        'Resolved',
  closed:          'Closed',
};

export const ISSUE_CATEGORIES = [
  { key: 'infrastructure', label: 'Infrastructure',    icon: 'build',           color: '#5C6BC0' },
  { key: 'women_safety',   label: 'Women Safety',      icon: 'shield',          color: '#E91E63' },
  { key: 'security',       label: 'Security & Crime',  icon: 'security',        color: '#F44336' },
  { key: 'land_property',  label: 'Land & Property',   icon: 'home',            color: '#795548' },
  { key: 'health',         label: 'Health & Sanitation',icon: 'local-hospital', color: '#009688' },
  { key: 'education',      label: 'Education',         icon: 'school',          color: '#3F51B5' },
  { key: 'environment',    label: 'Environment',       icon: 'eco',             color: '#4CAF50' },
  { key: 'social',         label: 'Social Issues',     icon: 'people',          color: '#9C27B0' },
  { key: 'missing',        label: 'Missing / Emergency',icon: 'warning',        color: '#FF5722' },
  { key: 'development',    label: 'Development',       icon: 'location-city',   color: '#607D8B' },
  { key: 'feedback',       label: 'Feedback',          icon: 'feedback',        color: '#00BCD4' },
  { key: 'others',         label: 'Others',            icon: 'more-horiz',      color: '#9E9E9E' },
  { key: 'labour',         label: 'Labour / Workers (BMS)', icon: 'work',       color: '#00695C' },
];

export const SUB_CATEGORIES = {
  infrastructure:  ['Street Light','Road Damage','Pothole','Water Supply','Drainage/Sewage','Public Toilet','Bridge/Footpath','Disability Access (Ramps/Toilets)'],
  women_safety:    ['Eve Teasing','Harassment','Domestic Violence','Stalking','Chain Snatching','Unsafe Area'],
  security:        ['Theft','Robbery','Threat/Dhamki','Illegal Parking','Unlawful Activity'],
  land_property:   ['Land Dispute','Illegal Construction','Encroachment','Property Dispute'],
  health:          ['Open Defecation','Mosquito Breeding','Garbage Dumping','Hospital Complaint','Epidemic Alert'],
  education:       ['School Infrastructure','Teacher Absenteeism','Mid-Day Meal','Dropout Concern'],
  environment:     ['Illegal Tree Cutting','Water Body Encroachment','Pollution','Stray Animals'],
  social:          ['Drug Abuse','Child Labour','Support Needed','Domestic Abuse','Elder Abuse / Neglect','Caste-Based Discrimination','Mental Health Crisis'],
  missing:         ['Missing Person','Missing Child','Medical Emergency'],
  development:     ['Ongoing Work Complaint','Fund Misuse','Development Suggestion'],
  feedback:        ['Appreciation','Suggestion','Event Feedback','General Comment'],
  others:          ['General Complaint','Any Other'],
};

// Labour/BMS sub-categories are grouped by worker type (unlike every other category's flat
// list) so the picker can show a worker-type section header before its issues. The screen
// combines them into a single "<Worker Type> – <Issue>" string on selection — see
// IssueCategoryScreen.js — which must exactly match backend LABOUR_GROUPS
// (backend/src/config/constants.js) since that's what gets stored on the ticket.
export const LABOUR_GROUPS = {
  'Corporate / Private Office Employee': ['Salary Delayed or Not Paid', 'No Appointment Letter', 'Wrongful Termination / Forced Resignation', 'PF / ESI / Gratuity Not Deposited', 'Workplace Harassment', 'Unpaid Overtime', 'Discrimination at Workplace', 'Other'],
  'Factory / Industrial Worker':          ['Wages Below Minimum Wage', 'Unsafe Working Conditions / No Safety Gear', 'Workplace Accident, No Compensation', 'Excessive Working Hours, No Weekly Off', 'No ESI / PF Registration', 'Child Labour at Workplace', 'Wage Theft by Contractor', 'Other'],
  'Construction Worker':                  ['Wages Not Paid by Contractor', 'Unsafe Site / No Safety Equipment', 'No BOCW Welfare Registration', 'Accident at Site, No Compensation', 'No Proper Accommodation or Drinking Water', 'Migrant Worker Stranded Without Wages', 'Child Labour at Site', 'Other'],
  'Domestic Worker / Maid':               ['Salary Delayed or Not Paid', 'Physical or Verbal Abuse by Employer', 'Excessive Working Hours, No Weekly Off', 'Wrongful Accusation by Employer', 'Sudden Termination Without Notice or Dues', 'Sexual Harassment', 'No Written Work Agreement', 'Other'],
  'Auto / Taxi / Cab Driver':             ['Unfair Account Deactivation by App', 'Fare or Commission Dispute', 'Harassment or Assault by Passenger', 'Extortion by Police / RTO', 'Vehicle Permit or License Issue', 'No Insurance or Accident Support', 'Other'],
  'Bus / Transport Worker':               ['Salary Delayed or Not Paid', 'Excessive Duty Hours, No Rest', 'Unsafe Vehicle Condition', 'Harassment by Passenger or Contractor', 'Accident, No Compensation', 'Contract vs Permanent Status Dispute', 'Other'],
  'Delivery / Gig Platform Worker':       ['Unfair Account Blocking', 'Incentive or Payment Not Credited', 'Accident During Delivery, No Support', 'Harassment by Customer', 'Unsafe Working Conditions', 'Other'],
  'Security Guard':                       ['Salary Delayed or Not Paid', 'Excessive Duty Hours, No Weekly Off', 'No PF / ESI Registration', 'Harassment by Client or Site Manager', 'Wrongful Termination', 'Uniform / Equipment Cost Wrongly Deducted', 'Other'],
  'Shop / Retail Employee':               ['Salary Delayed or Not Paid', 'No Appointment Letter', 'Excessive Working Hours, No Weekly Off', 'No PF / ESI Registration', 'Harassment by Owner or Manager', 'Wrongful Termination', 'Other'],
  'Contract / Daily-Wage Labour':         ['Wage Theft by Contractor', 'Below Minimum Wage Payment', 'No Safety Measures Provided', 'Non-Payment After Work Completed', 'Bonded / Forced Labour', 'Other'],
  'Govt / PSU Outsourced Staff':          ['Salary Delayed by Contractor', 'No Regularization Despite Long Service', 'No PF / ESI Despite Legal Requirement', 'Unequal Pay for Equal Work', 'Harassment by Supervisor', 'Other'],
  'Scheme Worker (Anganwadi / ASHA / Mid-Day Meal)': ['Honorarium Delayed or Not Paid', 'No Social Security or Benefits', 'Excessive Workload', 'Lack of Recognition as Employee', 'Other'],
  'Street Vendor / Hawker':               ['Harassment or Eviction by Police / Municipal Staff', 'Extortion to Allow Vending', 'No Vending Certificate or Zone', 'Goods Confiscated Unfairly', 'Other'],
  'Agricultural Labour':                  ['Wages Not Paid by Landowner', 'Exploitation or Unfair Treatment', 'Unsafe Pesticide Exposure', 'No Labour Card or Scheme Benefit', 'Bonded Labour', 'Other'],
  'Sanitation Worker':                    ['No Safety Gear (Manual Scavenging Risk)', 'Health Hazard Exposure', 'Salary Delayed or Not Paid', 'Caste-Based Discrimination at Workplace', 'No PF / ESI', 'Other'],
  'Other Labour Issue':                   ['General Labour Dispute', 'Other'],
};
SUB_CATEGORIES.labour = LABOUR_GROUPS;

// Mirrors backend PAYMENT_EXEMPT_GROUPS/PAYMENT_EXEMPT_SUBCATEGORY_LABELS (backend/src/config/constants.js)
// — used only to show the "no payment needed" hint before submission; the backend is the source of truth.
export const PAYMENT_EXEMPT_GROUPS = ['infrastructure', 'women_safety', 'missing'];
export const PAYMENT_EXEMPT_SUBCATEGORY_LABELS = [
  'Elder Abuse / Neglect', 'Caste-Based Discrimination', 'Mental Health Crisis',
  'Domestic Worker / Maid – Physical or Verbal Abuse by Employer',
  'Domestic Worker / Maid – Sexual Harassment',
  'Corporate / Private Office Employee – Workplace Harassment',
  'Factory / Industrial Worker – Child Labour at Workplace',
  'Construction Worker – Child Labour at Site',
  'Contract / Daily-Wage Labour – Bonded / Forced Labour',
  'Agricultural Labour – Bonded Labour',
  'Sanitation Worker – No Safety Gear (Manual Scavenging Risk)',
];

// Selecting this sub-category shows the Tele-MANAS helpline immediately, before (optionally)
// continuing to a confidential report — mental health is a crisis to respond to, not a queue ticket.
export const MENTAL_HEALTH_SUBCATEGORY = 'Mental Health Crisis';

export const OFFICE_ADDRESS = 'Party Office, Ram Mandir, Hatiara, New Town, Kolkata – 700157';
export const OFFICE_EMAIL = 'sanatantejas@gmail.com';

// Must match the backend's multer upload.array('files', 5) cap in media.routes.js
export const MAX_MEDIA_ATTACHMENTS = 5;

export const ABOUT_GUIDANCE_NAME = 'Piyush Kanodia';
export const ABOUT_GUIDANCE_TITLE = 'MLA, Rajarhat New Town (North 24 Parganas)';

export const LANGUAGES = [
  { code: 'bn', label: 'বাংলা', name: 'Bengali' },
  { code: 'hi', label: 'हिन्दी', name: 'Hindi' },
  { code: 'en', label: 'English', name: 'English' },
];
