/**
 * Standardized Event Taxonomy for Decivio
 * 
 * All audit_log actions, automation triggers, and notification events
 * MUST use these constants to ensure consistency across the platform.
 */

export const EventTypes = {
  // Decision lifecycle
  DECISION_CREATED: "decision.created",
  DECISION_UPDATED: "decision.updated",
  DECISION_STATUS_CHANGED: "decision.status_changed",
  DECISION_DELETED: "decision.deleted",
  DECISION_RESTORED: "decision.restored",
  DECISION_ARCHIVED: "decision.archived",
  DECISION_SHARED: "decision.shared",
  DECISION_TEMPLATE_UPGRADED: "decision.template_upgraded",

  // Review flow
  REVIEW_CREATED: "review.created",
  REVIEW_APPROVED: "review.approved",
  REVIEW_REJECTED: "review.rejected",
  REVIEW_DELEGATED: "review.delegated",

  // Task lifecycle
  TASK_CREATED: "task.created",
  TASK_UPDATED: "task.updated",
  TASK_STATUS_CHANGED: "task.status_changed",
  TASK_DELETED: "task.deleted",
  TASK_RESTORED: "task.restored",

  // Escalation
  ESCALATION_TRIGGERED: "escalation.triggered",
  ESCALATION_RESOLVED: "escalation.resolved",

  // Automation
  AUTOMATION_RULE_EXECUTED: "automation.rule_executed",

  // Team
  TEAM_MEMBER_ADDED: "team.member_added",
  TEAM_MEMBER_REMOVED: "team.member_removed",
  TEAM_CREATED: "team.created",

  // Risk
  RISK_CREATED: "risk.created",
  RISK_UPDATED: "risk.updated",
  RISK_LINKED: "risk.linked",

  // Collaboration
  COMMENT_CREATED: "comment.created",
  STAKEHOLDER_POSITION_CHANGED: "stakeholder.position_changed",
  GOAL_LINKED: "goal.linked",
  GOAL_UNLINKED: "goal.unlinked",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

/** Human-readable labels for event types (German) */
export const eventLabels: Record<string, string> = {
  [EventTypes.DECISION_CREATED]: "Entscheidung erstellt",
  [EventTypes.DECISION_UPDATED]: "Entscheidung bearbeitet",
  [EventTypes.DECISION_STATUS_CHANGED]: "Status geändert",
  [EventTypes.DECISION_DELETED]: "Entscheidung gelöscht (soft)",
  [EventTypes.DECISION_RESTORED]: "Entscheidung wiederhergestellt",
  [EventTypes.DECISION_ARCHIVED]: "Entscheidung archiviert",
  [EventTypes.DECISION_SHARED]: "Entscheidung geteilt",
  [EventTypes.DECISION_TEMPLATE_UPGRADED]: "Template-Upgrade",
  [EventTypes.REVIEW_CREATED]: "Review erstellt",
  [EventTypes.REVIEW_APPROVED]: "Review genehmigt",
  [EventTypes.REVIEW_REJECTED]: "Review abgelehnt",
  [EventTypes.REVIEW_DELEGATED]: "Review delegiert",
  [EventTypes.TASK_CREATED]: "Aufgabe erstellt",
  [EventTypes.TASK_UPDATED]: "Aufgabe bearbeitet",
  [EventTypes.TASK_STATUS_CHANGED]: "Aufgabenstatus geändert",
  [EventTypes.TASK_DELETED]: "Aufgabe gelöscht (soft)",
  [EventTypes.TASK_RESTORED]: "Aufgabe wiederhergestellt",
  [EventTypes.ESCALATION_TRIGGERED]: "Eskalation ausgelöst",
  [EventTypes.ESCALATION_RESOLVED]: "Eskalation gelöst",
  [EventTypes.AUTOMATION_RULE_EXECUTED]: "Automation ausgeführt",
  [EventTypes.TEAM_MEMBER_ADDED]: "Teammitglied hinzugefügt",
  [EventTypes.TEAM_MEMBER_REMOVED]: "Teammitglied entfernt",
  [EventTypes.TEAM_CREATED]: "Team erstellt",
  [EventTypes.RISK_CREATED]: "Risiko erstellt",
  [EventTypes.RISK_UPDATED]: "Risiko bearbeitet",
  [EventTypes.RISK_LINKED]: "Risiko verknüpft",
  [EventTypes.COMMENT_CREATED]: "Kommentar erstellt",
  [EventTypes.STAKEHOLDER_POSITION_CHANGED]: "Stakeholder-Position geändert",
  [EventTypes.GOAL_LINKED]: "Ziel verknüpft",
  [EventTypes.GOAL_UNLINKED]: "Ziel-Verknüpfung entfernt",
};
