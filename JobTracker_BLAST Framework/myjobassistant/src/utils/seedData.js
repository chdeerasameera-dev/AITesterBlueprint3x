/**
 * AI-generated seed data — 5 records for a Senior QA Engineer profile.
 * All dateApplied values are within the last 14 days so they appear on
 * the Dashboard immediately on first load.
 */

// Compute relative dates so seed data always falls within the 14-day window
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const SEED_RECORDS = [
  {
    id: 'ai-seed-001',
    companyName: 'Infosys',
    jobTitle: 'Senior QA Engineer',
    jobDescription:
      'Seeking a Senior QA Engineer with 8+ years of experience in Selenium, Java, and CI/CD pipelines for our Hyderabad delivery centre. Strong knowledge of TestNG, Maven, and Jenkins required.',
    profileMatched: true,
    interviewDetails:
      'Round 1: Technical screening with Selenium & TestNG questions. Round 2: System design and CI/CD discussion with the architecture team.',
    followUp: false,
    status: 'Rejected',
    questionsAsked:
      '1. Explain Page Object Model. 2. Difference between TestNG and JUnit. 3. How do you handle dynamic elements?',
    dateApplied: daysAgo(9),
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: 'ai-seed-002',
    companyName: 'Wipro Technologies',
    jobTitle: 'Test Automation Lead',
    jobDescription:
      'Looking for a Test Automation Lead to drive the automation strategy for a large-scale e-commerce platform. Must have hands-on experience with Cypress, Playwright, and API testing using RestAssured or Postman.',
    profileMatched: true,
    interviewDetails:
      'Preliminary call with HR. Technical round scheduled next week. Discussed Playwright vs Selenium trade-offs.',
    followUp: true,
    status: 'In Progress',
    questionsAsked: '1. How do you manage flaky tests in CI? 2. Explain shift-left testing.',
    dateApplied: daysAgo(5),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'ai-seed-003',
    companyName: 'HCL Technologies',
    jobTitle: 'SDET — Selenium/Java',
    jobDescription:
      'SDET role focused on building and maintaining automation frameworks for mobile and web applications. Expertise in Appium, Selenium WebDriver, and BDD with Cucumber is a must.',
    profileMatched: true,
    interviewDetails:
      'Two technical rounds completed. Coding challenge on Selenium POM patterns. Panel interview with QA lead and CTO.',
    followUp: false,
    status: 'Selected',
    questionsAsked:
      '1. Walk us through your automation framework architecture. 2. How do you integrate tests into a Jenkins pipeline? 3. Describe a test that saved your team from a production bug.',
    dateApplied: daysAgo(12),
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'ai-seed-004',
    companyName: 'Tech Mahindra',
    jobTitle: 'QA Manager — Agile',
    jobDescription:
      'QA Manager to lead a team of 12 QA engineers across three Agile squads. Responsible for test strategy, test planning, defect triage, and stakeholder reporting in SAFe Agile environment.',
    profileMatched: false,
    interviewDetails:
      'HR screening call only. Progressed to first round but did not match the people-management years requirement.',
    followUp: true,
    status: 'Rejected',
    questionsAsked: '1. How do you handle QA in a SAFe environment? 2. Describe your defect management strategy.',
    dateApplied: daysAgo(7),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'ai-seed-005',
    companyName: 'Cognizant',
    jobTitle: 'Senior Automation Tester',
    jobDescription:
      'Senior Automation Tester for a banking domain client. Must be proficient in API testing (RestAssured), UI automation (Selenium 4), and have prior experience in financial services QA compliance.',
    profileMatched: true,
    interviewDetails: '',
    followUp: true,
    status: 'Applied',
    questionsAsked: '',
    dateApplied: daysAgo(2),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];
