export const EMAIL_TYPES = [
  'interview-invitation',
  'rejection',
  'request-more-info',
  'final-round-invitation',
  'offer-preparation',
];

export const TONES = ['formal', 'friendly', 'startup', 'corporate'];

const EMAIL_TYPE_LABELS = {
  'interview-invitation': 'Interview Invitation',
  rejection: 'Rejection',
  'request-more-info': 'Request for More Information',
  'final-round-invitation': 'Final Round Invitation',
  'offer-preparation': 'Offer Preparation',
};

export const EMAIL_SYSTEM_PROMPT = `You are a professional recruiter writing candidate emails. Respond with
STRICT JSON only, matching:
{ "subject": string, "body": string }
The body should be plain text (no markdown), ready to paste into an email client.`;

export function buildEmailPrompt({ type, tone, candidate, jobDescription, companyName }) {
  return [
    `Email type: ${EMAIL_TYPE_LABELS[type] || type}`,
    `Tone: ${tone}`,
    `Company: ${companyName || '[Company Name]'}`,
    `Role: ${jobDescription?.title || '[Role Title]'}`,
    `Candidate name: ${candidate.name}`,
    candidate.overallScore != null ? `Candidate match score: ${candidate.overallScore}%` : '',
    candidate.missingSkills?.length ? `Notable gaps: ${candidate.missingSkills.join(', ')}` : '',
    '',
    'Write the email as the JSON object described in the system prompt. Keep it concise, human, and free of clichés.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Deterministic fallback templates used when no AI provider is configured. */
export function fallbackEmail({ type, tone, candidate, jobDescription, companyName }) {
  const company = companyName || '[Company Name]';
  const role = jobDescription?.title || '[Role Title]';
  const greeting =
    tone === 'formal' || tone === 'corporate' ? `Dear ${candidate.name},` : `Hi ${candidate.name},`;
  const signOff = tone === 'startup' || tone === 'friendly' ? 'Best,' : 'Kind regards,';

  const bodies = {
    'interview-invitation': `${greeting}\n\nThank you for applying for the ${role} position at ${company}. We were impressed by your background and would like to invite you to an interview.\n\nCould you share a few time slots that work for you this week?\n\n${signOff}\nTalent Acquisition Team, ${company}`,
    rejection: `${greeting}\n\nThank you for taking the time to apply for the ${role} position at ${company}. After careful review, we've decided to move forward with other candidates whose experience more closely matches our current needs.\n\nWe appreciate your interest and encourage you to apply for future openings.\n\n${signOff}\nTalent Acquisition Team, ${company}`,
    'request-more-info': `${greeting}\n\nThank you for your application for the ${role} position. To continue evaluating your candidacy, could you share more detail on your recent hands-on experience with the role's core requirements?\n\n${signOff}\nTalent Acquisition Team, ${company}`,
    'final-round-invitation': `${greeting}\n\nCongratulations on making it to the final round for the ${role} position at ${company}! We'd like to schedule your final interview with the team.\n\nPlease let us know your availability over the next few days.\n\n${signOff}\nTalent Acquisition Team, ${company}`,
    'offer-preparation': `${greeting}\n\nWe're excited to move forward with an offer for the ${role} position at ${company}. Our team is finalizing the details and will follow up shortly with the full offer package.\n\nIn the meantime, please let us know if you have any questions.\n\n${signOff}\nTalent Acquisition Team, ${company}`,
  };

  return {
    subject: `${EMAIL_TYPE_LABELS[type] || type} — ${role} at ${company}`,
    body: bodies[type] || bodies['request-more-info'],
  };
}
