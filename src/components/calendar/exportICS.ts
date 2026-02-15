import { format } from "date-fns";

/**
 * Generate an ICS calendar file from decisions with due dates and trigger download.
 */
export function exportDecisionsAsICS(decisions: any[]) {
  const withDue = decisions.filter((d) => d.due_date);
  if (withDue.length === 0) return;

  const formatICSDate = (dateStr: string) => {
    // due_date is yyyy-MM-dd, ICS all-day events use VALUE=DATE format
    return dateStr.replace(/-/g, "");
  };

  const escapeICS = (text: string) =>
    text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");

  const events = withDue.map((d) => {
    const dtStart = formatICSDate(d.due_date);
    // All-day event: DTEND is next day
    const endDate = new Date(d.due_date);
    endDate.setDate(endDate.getDate() + 1);
    const dtEnd = format(endDate, "yyyyMMdd");

    const description = [
      d.description && `Beschreibung: ${d.description}`,
      `Status: ${d.status}`,
      `Priorität: ${d.priority}`,
      `Kategorie: ${d.category}`,
    ]
      .filter(Boolean)
      .join("\\n");

    return [
      "BEGIN:VEVENT",
      `UID:${d.id}@decisions`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${escapeICS(d.title)}`,
      `DESCRIPTION:${escapeICS(description)}`,
      `CATEGORIES:${d.category}`,
      `PRIORITY:${d.priority === "critical" ? 1 : d.priority === "high" ? 3 : d.priority === "medium" ? 5 : 9}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DecisionHub//Decisions//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Entscheidungen",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `entscheidungen-${format(new Date(), "yyyy-MM-dd")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
