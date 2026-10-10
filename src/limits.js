// Character caps for every text input. They mirror the backend validation
// (@Size and PayloadSupport) so the UI blocks what the API would reject.
export const LIMITS = Object.freeze({
  briefText: 5000,
  subject: 150,
  projectType: 150,
  pdfNote: 1000,
  answer: 2000,
  clientName: 120,
  company: 120,
  agencyName: 120,
  ownerName: 120,
  email: 255,
  catalogName: 120,
  requirementName: 120,
  roleName: 120,
  description: 1000,
  passwordMin: 8,
  password: 100,
  search: 80,
});

// PDF upload caps, same as PdfBriefReader on the backend.
export const PDF_LIMITS = Object.freeze({
  maxBytes: 10 * 1024 * 1024,
  maxPages: 30,
});

// The counter appears once the user is close to the cap, so short fields stay quiet.
export const COUNTER_VISIBLE_FROM = 0.7;
export const COUNTER_WARNING_FROM = 0.9;
