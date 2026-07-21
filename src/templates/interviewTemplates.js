export const INTERVIEW_SYSTEM_PROMPT = `You are an expert technical interviewer preparing an interview kit for a
single shortlisted candidate. Respond with STRICT JSON only, matching:
{
  "technical": string[],
  "behavioural": string[],
  "cultureFit": string[],
  "resumeSpecific": string[],
  "followUps": string[]
}
Each array should contain 3-5 sharp, non-generic questions.`;

export function buildInterviewPrompt(candidate, jobDescription) {
  return [
    `Job title: ${jobDescription.title}`,
    `Key requirements: ${jobDescription.skills.join(', ') || 'see full JD'}`,
    '',
    `Candidate: ${candidate.name}`,
    `Candidate skills: ${candidate.skills?.join(', ') || 'unknown'}`,
    `Candidate experience summary: ${candidate.experience?.raw?.slice(0, 800) || 'not provided'}`,
    `Candidate projects: ${candidate.projects?.join(', ') || 'not provided'}`,
    '',
    'Generate a tailored interview kit as the JSON object described in the system prompt.',
  ].join('\n');
}

/** Deterministic fallback question bank used when no AI provider is configured. */
export function fallbackInterviewKit(candidate, jobDescription) {
  const skill = jobDescription.skills[0] || 'their core stack';
  return {
    technical: [
      `Walk me through how you would design a system that uses ${skill} at scale.`,
      'Describe the most technically challenging bug you have fixed recently.',
      'How do you approach testing and code review in your current role?',
    ],
    behavioural: [
      'Tell me about a time you disagreed with a teammate on a technical decision.',
      'Describe a project that did not go as planned. What did you learn?',
    ],
    cultureFit: [
      'What kind of team environment helps you do your best work?',
      'How do you like to receive feedback?',
    ],
    resumeSpecific: candidate.projects?.length
      ? [`Tell me more about "${candidate.projects[0]}" — what was your specific contribution?`]
      : ['Walk me through the project on your resume you are proudest of.'],
    followUps: ['What would you want to accomplish in your first 90 days in this role?'],
  };
}

export function renderInterviewMarkdown(candidate, jobDescription, kit) {
  const section = (title, items) => `## ${title}\n\n${(items || []).map((q) => `- ${q}`).join('\n')}\n`;

  return [
    `# Interview Kit — ${candidate.name}`,
    '',
    `**Role:** ${jobDescription.title}`,
    `**Generated:** ${new Date().toISOString()}`,
    '',
    section('Technical Questions', kit.technical),
    section('Behavioural Questions', kit.behavioural),
    section('Culture-Fit Questions', kit.cultureFit),
    section('Resume-Specific Questions', kit.resumeSpecific),
    section('Follow-Up Questions', kit.followUps),
  ].join('\n');
}
