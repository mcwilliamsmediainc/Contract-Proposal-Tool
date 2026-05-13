export interface MorningBriefing {
  activeClientCount: number;
  newLeadsCount: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
  reportsDueCount: number;
  flags: string[];
}

export function formatMorningBriefing(b: MorningBriefing): string {
  const lines = [
    "Good morning team. Here's your daily briefing.",
    "",
    `CLIENTS: ${b.activeClientCount} active`,
    `LEADS: ${b.newLeadsCount} new leads since yesterday`,
    `TASKS: ${b.pendingTasksCount} pending / ${b.overdueTasksCount} overdue`,
    `REPORTS: ${b.reportsDueCount} reports due this week`,
  ];

  if (b.flags.length > 0) {
    lines.push("");
    for (const flag of b.flags) {
      lines.push(`⚠ ${flag}`);
    }
  } else {
    lines.push("");
    lines.push("No flags — clean slate.");
  }

  lines.push("");
  lines.push("Have a great day.");

  return lines.join("\n");
}
