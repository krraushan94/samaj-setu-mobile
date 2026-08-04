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

// Mirrors backend PAYMENT_EXEMPT_GROUPS/PAYMENT_EXEMPT_SUBCATEGORY_LABELS (backend/src/config/constants.js)
// — used only to show the "no payment needed" hint before submission; the backend is the source of truth.
export const PAYMENT_EXEMPT_GROUPS = ['infrastructure', 'women_safety', 'missing'];
export const PAYMENT_EXEMPT_SUBCATEGORY_LABELS = ['Elder Abuse / Neglect', 'Caste-Based Discrimination', 'Mental Health Crisis'];

// Selecting this sub-category shows the Tele-MANAS helpline immediately, before (optionally)
// continuing to a confidential report — mental health is a crisis to respond to, not a queue ticket.
export const MENTAL_HEALTH_SUBCATEGORY = 'Mental Health Crisis';

export const OFFICE_ADDRESS = 'Party Office, Ram Mandir, Hatiara, New Town, Kolkata – 700157';

export const LANGUAGES = [
  { code: 'bn', label: 'বাংলা', name: 'Bengali' },
  { code: 'hi', label: 'हिन्दी', name: 'Hindi' },
  { code: 'en', label: 'English', name: 'English' },
];
