/**
 * HackathonPromptBuilder — Constructs AI prompts for hackathon features.
 *
 * SOLID applied:
 *  - SRP: Prompt construction is no longer the AI service's or HackathonService's job.
 *  - OCP: New prompt types are new methods. Existing prompts are never modified.
 *  - DIP: HackathonAiService depends on this builder, not on raw template strings.
 *
 * Design Pattern: Builder Pattern
 *  Separates the construction of complex AI prompt strings from their usage.
 *  Each method builds one specific prompt, independently testable.
 */
class HackathonPromptBuilder {

  /**
   * Builds a team member suggestion prompt.
   * @param {{ title: string, tracks: Array, skills: string[] }} hackathon
   * @returns {string}
   */
  teamSuggestions(hackathon) {
    const tracks = hackathon.tracks?.map(t => t.name).join(', ') || 'General';
    const skills = hackathon.skills?.join(', ') || 'Any';
    return `You are an AI system that matches hackathon participants.
Hackathon: "${hackathon.title}"
Tracks: ${tracks}
Required skills: ${skills}

Generate 5 ideal complementary team member profiles (not real users) that would form a balanced team.
For each profile, specify: role, top 3 skills, and why they complement the team.
Return ONLY a valid JSON array: [{ "role": string, "skills": string[], "reason": string }]`;
  }

  /**
   * Builds a skill gap analysis prompt.
   * @param {{ title: string, skills: string[] }} hackathon
   * @param {string[]} teamSkills - Combined unique skills of current team members
   * @returns {string}
   */
  skillGapAnalysis(hackathon, teamSkills) {
    return `Analyze this hackathon team's skill coverage.
Required skills for "${hackathon.title}": ${hackathon.skills?.join(', ') || 'Not specified'}
Team's combined skills: ${teamSkills.join(', ') || 'None yet'}

Identify skill gaps and recommend what roles/skills the team should acquire.
Return ONLY valid JSON: { "gaps": string[], "recommendations": string[], "coverageScore": number }`;
  }

  /**
   * Builds a project idea suggestion prompt.
   * @param {{ title: string, tracks: Array }} hackathon
   * @param {string[]} teamSkills
   * @returns {string}
   */
  projectIdeas(hackathon, teamSkills) {
    const tracks = hackathon.tracks?.map(t => t.name).join(', ') || 'General';
    return `Generate 3 innovative project ideas for the hackathon "${hackathon.title}".
Hackathon tracks: ${tracks}
Team skills: ${teamSkills.join(', ') || 'Not specified'}

For each idea include: title, problem statement, proposed solution, recommended tech stack, and a 30-day sprint outline.
Return ONLY a valid JSON array: [{ "title": string, "problem": string, "solution": string, "techStack": string[], "sprintOutline": string[] }]`;
  }

  /**
   * Builds a team balance analysis prompt.
   * @param {{ title: string }} hackathon
   * @param {{ name: string, members: Array }} team
   * @returns {string}
   */
  teamBalanceAnalysis(hackathon, team) {
    const memberSummaries = team.members.map(m =>
      `${m.user?.name || 'Unknown'} — Role: ${m.role || 'Not set'} — Skills: ${(m.user?.skills || []).join(', ') || 'None'}`
    ).join('\n');

    return `Evaluate the balance of this hackathon team for "${hackathon.title}".
Team: "${team.name}"
Members:\n${memberSummaries}

Rate the team's overall readiness (0-100), identify coverage strengths, and list recommended improvements.
Return ONLY valid JSON: { "score": number, "strengths": string[], "improvements": string[], "verdict": string }`;
  }

  /**
   * Builds an AI submission checklist prompt.
   * @param {{ title: string, rules: string[], judgingCriteria: Array }} hackathon
   * @returns {string}
   */
  submissionChecklist(hackathon) {
    const rules    = hackathon.rules?.join('\n') || 'Not specified';
    const criteria = hackathon.judgingCriteria?.map(c => `${c.criterion} (${c.weight}%)`).join(', ') || 'Not specified';
    return `Create a submission checklist for teams participating in "${hackathon.title}".
Rules:\n${rules}
Judging criteria: ${criteria}

Generate a clear, actionable checklist that a team should complete before submitting.
Return ONLY a valid JSON array: [{ "category": string, "items": string[] }]`;
  }
}

export default new HackathonPromptBuilder();
