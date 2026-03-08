// Shared Decivio Email Template System
// All transactional emails use this consistent design system.

const APP_URL = "https://app.decivio.com";
const PRIVACY_URL = "https://decivio.com/datenschutz";
const IMPRINT_URL = "https://decivio.com/impressum";
const SUPPORT_EMAIL = "hallo@decivio.com";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>Decivio</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>` : ""}
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background-color:#030810;padding:24px 32px;text-align:center;">
    <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">Decivio</span>
  </td></tr>
  <!-- Body -->
  <tr><td style="background-color:#ffffff;padding:32px;color:#1E293B;font-size:16px;line-height:1.6;">
    ${content}
  </td></tr>
  <!-- Footer -->
  <tr><td style="background-color:#F8FAFC;padding:24px 32px;border-top:1px solid #E2E8F0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;color:#94A3B8;">
          Decivio — Decision Intelligence Platform
        </p>
        <p style="margin:0 0 8px;font-size:12px;color:#94A3B8;">
          <a href="${PRIVACY_URL}" style="color:#94A3B8;text-decoration:underline;">Datenschutz</a>
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <a href="${IMPRINT_URL}" style="color:#94A3B8;text-decoration:underline;">Impressum</a>
        </p>
        <p style="margin:0;font-size:11px;color:#CBD5E1;">
          Fragen? Antworten Sie auf diese E-Mail oder schreiben Sie an ${SUPPORT_EMAIL}
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(label: string, href: string, color = "#EF4444"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:24px 0;">
      <a href="${href}" style="display:inline-block;background-color:${color};color:#ffffff;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:600;text-decoration:none;mso-padding-alt:14px 32px;">
        ${label}
      </a>
    </td></tr>
  </table>`;
}

// ─── 1. Welcome Email ───────────────────────────────────────────────

export interface WelcomeEmailParams {
  userName: string;
  appUrl?: string;
}

export function welcomeEmail({ userName, appUrl = APP_URL }: WelcomeEmailParams): { subject: string; html: string } {
  const subject = "Willkommen bei Decivio — Ihre erste Entscheidung in 3 Minuten";
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;">Willkommen bei Decivio, ${escapeHtml(userName)}!</h1>
    <p style="margin:0 0 24px;">
      Schön, dass Sie dabei sind. Decivio hilft Ihnen, Entscheidungen schneller, transparenter und mit klarer Nachverfolgung zu treffen.
    </p>
    <div style="background-color:#F8FAFC;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0F172A;">Ihre ersten 3 Schritte:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="padding:6px 0;font-size:14px;color:#334155;">
          <span style="display:inline-block;background:#EF4444;color:#fff;width:22px;height:22px;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:10px;">1</span>
          Erste Entscheidung erstellen
        </td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#334155;">
          <span style="display:inline-block;background:#EF4444;color:#fff;width:22px;height:22px;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:10px;">2</span>
          Teammitglieder einladen
        </td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#334155;">
          <span style="display:inline-block;background:#EF4444;color:#fff;width:22px;height:22px;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:10px;">3</span>
          Dashboard erkunden
        </td></tr>
      </table>
    </div>
    ${ctaButton("Zum Dashboard →", `${appUrl}/dashboard`)}
    <p style="margin:0;font-size:13px;color:#64748B;text-align:center;">
      Brauchen Sie Hilfe? <a href="${appUrl}/help" style="color:#EF4444;text-decoration:none;">Help Center öffnen</a>
    </p>`;
  return { subject, html: layout(content, "Starten Sie jetzt mit Ihrer ersten Entscheidung.") };
}

// ─── 2. Verify Email ────────────────────────────────────────────────

export interface VerifyEmailParams {
  userName: string;
  verifyUrl: string;
}

export function verifyEmail({ userName, verifyUrl }: VerifyEmailParams): { subject: string; html: string } {
  const subject = "Bitte bestätigen Sie Ihre E-Mail-Adresse";
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;">E-Mail bestätigen</h1>
    <p style="margin:0 0 8px;">Hallo ${escapeHtml(userName)},</p>
    <p style="margin:0 0 24px;">
      bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Decivio-Konto zu aktivieren.
    </p>
    ${ctaButton("E-Mail bestätigen", verifyUrl)}
    <p style="margin:0;font-size:13px;color:#64748B;text-align:center;">
      Dieser Link ist <strong>24 Stunden</strong> gültig.<br/>
      Falls Sie sich nicht bei Decivio registriert haben, können Sie diese E-Mail ignorieren.
    </p>`;
  return { subject, html: layout(content, "Bestätigen Sie Ihre E-Mail-Adresse für Decivio.") };
}

// ─── 3. MFA OTP ─────────────────────────────────────────────────────

export interface MfaOtpEmailParams {
  userName: string;
  code: string;
}

export function mfaOtpEmail({ userName, code }: MfaOtpEmailParams): { subject: string; html: string } {
  const formatted = code.slice(0, 3) + " " + code.slice(3);
  const subject = `Ihr Sicherheitscode: ${formatted}`;
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;">Ihr Sicherheitscode</h1>
    <p style="margin:0 0 8px;">Hallo ${escapeHtml(userName)},</p>
    <p style="margin:0 0 24px;">
      verwenden Sie den folgenden Code, um Ihre Anmeldung abzuschließen:
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      <div style="display:inline-block;background-color:#F1F5F9;border:2px solid #E2E8F0;border-radius:12px;padding:20px 40px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0F172A;font-family:'Courier New',monospace;">${formatted}</span>
      </div>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#64748B;text-align:center;">
      Dieser Code ist <strong>10 Minuten</strong> gültig.
    </p>
    <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;margin:24px 0 0;">
      <p style="margin:0;font-size:13px;color:#991B1B;">
        ⚠️ Falls Sie diesen Code nicht angefordert haben, ändern Sie bitte umgehend Ihr Passwort und kontaktieren Sie unseren Support.
      </p>
    </div>`;
  return { subject, html: layout(content, `Ihr Code: ${formatted}`) };
}

// ─── 4. Team Invitation ─────────────────────────────────────────────

export interface TeamInviteEmailParams {
  inviterName: string;
  teamName: string;
  acceptUrl: string;
  decisionTitle?: string;
  costPerDay?: number;
}

export function teamInviteEmail({ inviterName, teamName, acceptUrl, decisionTitle, costPerDay }: TeamInviteEmailParams): { subject: string; html: string } {
  const subject = decisionTitle
    ? `${inviterName} wartet auf Ihre Genehmigung`
    : `${inviterName} hat Sie zu Decivio eingeladen`;

  const costBlock = costPerDay && costPerDay > 0
    ? `<div style="background-color:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;margin:0 0 16px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#92400E;">
          ⏱ Verzögerungskosten: ${Number(costPerDay).toLocaleString("de-DE")} € / Tag
        </p>
      </div>`
    : "";

  const decisionBlock = decisionTitle
    ? `<div style="background-color:#F8FAFC;border-radius:8px;padding:20px;margin:0 0 16px;">
        <p style="margin:0 0 4px;font-size:12px;color:#64748B;">Entscheidung:</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#0F172A;">${escapeHtml(decisionTitle)}</p>
      </div>`
    : "";

  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;">
      ${decisionTitle ? "Ihre Genehmigung wird benötigt" : "Team-Einladung"}
    </h1>
    <p style="margin:0 0 24px;">
      <strong>${escapeHtml(inviterName)}</strong> ${decisionTitle
        ? `wartet auf Ihre Genehmigung bei <strong>${escapeHtml(teamName)}</strong>.`
        : `hat Sie eingeladen, dem Team <strong>${escapeHtml(teamName)}</strong> auf Decivio beizutreten.`}
    </p>
    ${decisionBlock}
    ${costBlock}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
      <tr>
        <td style="padding:4px 0;font-size:14px;color:#64748B;">Eingeladen von:</td>
        <td style="padding:4px 0;font-size:14px;color:#0F172A;font-weight:600;text-align:right;">${escapeHtml(inviterName)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:14px;color:#64748B;">Team:</td>
        <td style="padding:4px 0;font-size:14px;color:#0F172A;font-weight:600;text-align:right;">${escapeHtml(teamName)}</td>
      </tr>
    </table>
    ${ctaButton(decisionTitle ? "Jetzt ansehen →" : "Einladung annehmen", acceptUrl)}
    <p style="margin:16px 0 0;font-size:13px;color:#64748B;text-align:center;">
      Diese Einladung ist <strong>7 Tage</strong> gültig.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#94A3B8;text-align:center;">
      ${escapeHtml(inviterName)} nutzt Decivio um Entscheidungen schneller und transparenter zu treffen.
    </p>`;
  return { subject, html: layout(content, decisionTitle ? `${inviterName} wartet auf Ihre Genehmigung` : `${inviterName} hat Sie zu ${teamName} eingeladen.`) };
}

// ─── 5. Review Request (One-Click Approval) ─────────────────────────

export interface ReviewRequestEmailParams {
  reviewerName: string;
  decisionTitle: string;
  description: string;
  costPerDay: number | null;
  approveUrl: string;
  rejectUrl: string;
  detailUrl: string;
}

export function reviewRequestEmail(p: ReviewRequestEmailParams): { subject: string; html: string } {
  const subject = `Review erbeten: ${p.decisionTitle}`;
  const costBlock = p.costPerDay
    ? `<div style="background-color:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;margin:0 0 24px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#92400E;">
          ⏱ Cost-of-Delay: ${Number(p.costPerDay).toLocaleString("de-DE")} € / Tag
          <span style="font-weight:400;color:#A16207;">&nbsp;·&nbsp;${(Number(p.costPerDay) * 7).toLocaleString("de-DE")} € / Woche</span>
        </p>
      </div>`
    : "";
  const content = `
    <p style="margin:0 0 8px;font-size:14px;color:#64748B;">Hallo ${escapeHtml(p.reviewerName)},</p>
    <p style="margin:0 0 16px;">Sie wurden als Reviewer für folgende Entscheidung eingetragen:</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0F172A;">${escapeHtml(p.decisionTitle)}</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">${escapeHtml(p.description)}</p>
    ${costBlock}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr>
        <td width="48%" align="center" style="padding-right:8px;">
          <a href="${p.approveUrl}" style="display:block;padding:16px 8px;background-color:#16A34A;color:#ffffff;text-decoration:none;border-radius:12px;font-size:17px;font-weight:700;text-align:center;">✓ Genehmigen</a>
        </td>
        <td width="48%" align="center" style="padding-left:8px;">
          <a href="${p.rejectUrl}" style="display:block;padding:16px 8px;background-color:#DC2626;color:#ffffff;text-decoration:none;border-radius:12px;font-size:17px;font-weight:700;text-align:center;">✗ Ablehnen</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;text-align:center;">
      <a href="${p.detailUrl}" style="font-size:14px;color:#EF4444;text-decoration:none;font-weight:500;">Details ansehen →</a>
    </p>
    <p style="margin:24px 0 0;font-size:12px;color:#94A3B8;text-align:center;">
      Die Aktions-Links sind 72 Stunden gültig und können nur einmal verwendet werden.
    </p>`;
  return { subject, html: layout(content, `Review: ${p.decisionTitle}`) };
}

// ─── 6. Trial Reminder ──────────────────────────────────────────────

export interface TrialReminderEmailParams {
  userName: string;
  daysLeft: number;
  appUrl?: string;
}

export function trialReminderEmail({ userName, daysLeft, appUrl = APP_URL }: TrialReminderEmailParams): { subject: string; html: string } {
  const subject = `Ihre Testphase endet in ${daysLeft} Tagen`;
  const content = `
    <div style="text-align:center;margin:0 0 24px;">
      <span style="display:inline-block;background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:6px 16px;font-size:13px;font-weight:600;color:#92400E;">
        ⏳ Noch ${daysLeft} Tage
      </span>
    </div>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;text-align:center;">Ihre Testphase endet bald</h1>
    <p style="margin:0 0 8px;">Hallo ${escapeHtml(userName)},</p>
    <p style="margin:0 0 24px;">
      Ihre 14-tägige Testphase bei Decivio endet in <strong>${daysLeft} Tagen</strong>. Sichern Sie sich jetzt alle Premium-Features dauerhaft.
    </p>
    <div style="background-color:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0C4A6E;">Was Sie mit dem Upgrade behalten:</p>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#075985;line-height:2;">
        <li>Echtzeit Cost-of-Delay Tracking</li>
        <li>KI Daily Brief & Copilot</li>
        <li>Alle Analytics-Module</li>
        <li>Executive Hub & Board Reports</li>
        <li>Unlimitierte Entscheidungen & Teams</li>
      </ul>
    </div>
    ${ctaButton("Jetzt upgraden — ab €59/Mo", `${appUrl}/upgrade`)}`;
  return { subject, html: layout(content, `Ihre Testphase endet in ${daysLeft} Tagen.`) };
}

// ─── 7. Trial Expired ───────────────────────────────────────────────

export interface TrialExpiredEmailParams {
  userName: string;
  appUrl?: string;
}

export function trialExpiredEmail({ userName, appUrl = APP_URL }: TrialExpiredEmailParams): { subject: string; html: string } {
  const subject = "Ihre Testphase ist abgelaufen";
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;text-align:center;">Ihre Testphase ist abgelaufen</h1>
    <p style="margin:0 0 8px;">Hallo ${escapeHtml(userName)},</p>
    <p style="margin:0 0 24px;">
      Ihre 14-tägige Testphase bei Decivio ist abgelaufen. Ihr Account wurde auf den kostenlosen Plan umgestellt.
    </p>
    <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#991B1B;">Was Sie jetzt nicht mehr nutzen können:</p>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#7F1D1D;line-height:2;">
        <li>Echtzeit Cost-of-Delay Tracking</li>
        <li>KI Daily Brief & Copilot</li>
        <li>Alle Analytics-Module</li>
        <li>Executive Hub</li>
        <li>Unlimitierte Entscheidungen</li>
        <li>Team-Kollaboration</li>
      </ul>
    </div>
    <p style="margin:0 0 24px;font-size:15px;color:#334155;">
      <strong>Keine Sorge — Ihre Daten sind sicher.</strong> Upgraden Sie jederzeit, um sofort wieder vollen Zugriff zu erhalten.
    </p>
    ${ctaButton("Weiter mit Professional — ab €59/Mo", `${appUrl}/upgrade`)}`;
  return { subject, html: layout(content, "Ihre Testphase ist abgelaufen — upgraden Sie jetzt.") };
}

// ─── 8. Trial Final Warning (1 day left) ────────────────────────────

export interface TrialFinalEmailParams {
  userName: string;
  appUrl?: string;
}

export function trialFinalEmail({ userName, appUrl = APP_URL }: TrialFinalEmailParams): { subject: string; html: string } {
  const subject = "Letzte Erinnerung: Ihre Decivio Testphase endet morgen";
  const content = `
    <div style="text-align:center;margin:0 0 24px;">
      <span style="display:inline-block;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:6px 16px;font-size:13px;font-weight:600;color:#DC2626;">
        ⏰ Nur noch 1 Tag
      </span>
    </div>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;text-align:center;">Ihre Testphase endet morgen</h1>
    <p style="margin:0 0 8px;">Hallo ${escapeHtml(userName)},</p>
    <p style="margin:0 0 24px;">
      morgen endet Ihre kostenlose Testphase. Danach wird Ihr Account auf den Free-Plan umgestellt und Premium-Features werden deaktiviert.
    </p>
    ${ctaButton("Jetzt upgraden — ab €59/Mo", `${appUrl}/upgrade`, "#DC2626")}`;
  return { subject, html: layout(content, "Ihre Testphase endet morgen!") };
}

// ─── 9. Dunning Emails ──────────────────────────────────────────────

export interface DunningEmailParams {
  userName: string;
  orgName: string;
  dunningStep: number;
  billingUrl: string;
}

export function dunningEmail({ userName, orgName, dunningStep, billingUrl }: DunningEmailParams): { subject: string; html: string } {
  const steps: Record<number, { subject: string; headline: string; body: string; ctaLabel: string; urgencyBg: string; urgencyBorder: string }> = {
    1: {
      subject: "Handlung erforderlich — Zahlung für Decivio fehlgeschlagen",
      headline: "Ihre Zahlung konnte nicht verarbeitet werden",
      body: `Leider konnte Ihre letzte Zahlung für <strong>${escapeHtml(orgName)}</strong> nicht verarbeitet werden. Bitte aktualisieren Sie Ihre Zahlungsmethode, um eine Unterbrechung Ihres Zugangs zu vermeiden.`,
      ctaLabel: "Zahlungsmethode aktualisieren",
      urgencyBg: "#FEF3C7", urgencyBorder: "#F59E0B",
    },
    2: {
      subject: `Erinnerung: Zahlungsmethode für ${orgName} aktualisieren`,
      headline: "Ihre Zahlung ist weiterhin ausstehend",
      body: `Wir haben Sie vor 3 Tagen über eine fehlgeschlagene Zahlung informiert. Bitte aktualisieren Sie Ihre Zahlungsmethode zeitnah, um Ihren vollen Zugang zu behalten.<br/><br/><strong>Ohne Aktualisierung wird Ihr Zugang in 7 Tagen auf den Free-Plan eingeschränkt.</strong>`,
      ctaLabel: "Jetzt Zahlungsmethode aktualisieren",
      urgencyBg: "#FED7AA", urgencyBorder: "#EA580C",
    },
    3: {
      subject: "Letzte Warnung: Zugang wird in 3 Tagen eingeschränkt",
      headline: "Letzte Warnung — Zugang wird eingeschränkt",
      body: `Ihre Zahlung ist seit 7 Tagen ausstehend. In <strong>3 Tagen</strong> wird Ihr Zugang auf den Free-Plan zurückgestuft.<br/><br/>
        <strong>Features die Sie verlieren:</strong>
        <ul style="margin-top:8px;padding-left:20px;line-height:1.8;">
          <li>KI Daily Brief & Copilot</li>
          <li>Cost-of-Delay Echtzeit-Tracking</li>
          <li>Alle Analytics-Module</li>
          <li>Automatisierungsregeln</li>
          <li>Unbegrenzte Entscheidungen & Teams</li>
        </ul>
        Ihre Daten bleiben erhalten — Sie können jederzeit upgraden.`,
      ctaLabel: "Jetzt Zahlungsmethode aktualisieren",
      urgencyBg: "#FEE2E2", urgencyBorder: "#DC2626",
    },
    4: {
      subject: "Ihr Zugang wurde auf Free eingeschränkt",
      headline: "Ihr Zugang wurde eingeschränkt",
      body: `Da Ihre Zahlung seit 10 Tagen ausstehend ist, wurde Ihr Plan für <strong>${escapeHtml(orgName)}</strong> auf Free zurückgestuft.<br/><br/><strong>Keine Sorge — Ihre Daten sind sicher.</strong> Aktualisieren Sie Ihre Zahlungsmethode und upgraden Sie, um sofort wieder vollen Zugang zu erhalten.`,
      ctaLabel: "Jetzt upgraden und Zugang wiederherstellen",
      urgencyBg: "#FEE2E2", urgencyBorder: "#DC2626",
    },
  };

  const tpl = steps[dunningStep] || steps[1];
  const content = `
    <div style="background:${tpl.urgencyBg};border-left:4px solid ${tpl.urgencyBorder};border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#0F172A;">${tpl.headline}</h1>
    </div>
    <p style="margin:0 0 8px;">Hallo ${escapeHtml(userName)},</p>
    <p style="margin:0 0 24px;line-height:1.6;">${tpl.body}</p>
    ${ctaButton(tpl.ctaLabel, billingUrl)}`;
  return { subject: tpl.subject, html: layout(content, tpl.headline) };
}

// ─── 10. Re-engagement Emails ───────────────────────────────────────

function unsubscribeBlock(unsubscribeUrl: string): string {
  return `<div style="text-align:center;margin:24px 0 0;padding:16px 0 0;border-top:1px solid #E2E8F0;">
    <a href="${unsubscribeUrl}" style="font-size:12px;color:#94A3B8;text-decoration:underline;">Diese E-Mails abbestellen</a>
  </div>`;
}

export interface ReengagementDay7Params {
  userName: string;
  lastDecisionTitle: string;
  costOfDelay: number;
  decisionUrl: string;
  unsubscribeUrl: string;
}

export function reengagementDay7Email(p: ReengagementDay7Params): { subject: string; html: string } {
  const subject = `Was ist aus „${p.lastDecisionTitle}" geworden?`;
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;">Ihre Entscheidung wartet</h1>
    <p style="margin:0 0 8px;">Hallo ${escapeHtml(p.userName)},</p>
    <p style="margin:0 0 24px;">
      Seit einer Woche ist Ihre Entscheidung <strong>„${escapeHtml(p.lastDecisionTitle)}"</strong> offen — und die Kosten laufen weiter.
    </p>
    <div style="background-color:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:16px 20px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#92400E;">Aktuelle Verzögerungskosten</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#92400E;">${Number(p.costOfDelay).toLocaleString("de-DE")} €</p>
    </div>
    ${ctaButton("Entscheidung fortsetzen →", p.decisionUrl)}
    ${unsubscribeBlock(p.unsubscribeUrl)}`;
  return { subject, html: layout(content, `${p.lastDecisionTitle} wartet auf Sie`) };
}

export interface ReengagementDay14Params {
  userName: string;
  openDecisionCount: number;
  totalCod: number;
  appUrl: string;
  unsubscribeUrl: string;
}

export function reengagementDay14Email(p: ReengagementDay14Params): { subject: string; html: string } {
  const subject = "Ihre offenen Entscheidungen kosten weiter Geld";
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;">Ihre offenen Entscheidungen</h1>
    <p style="margin:0 0 8px;">Hallo ${escapeHtml(p.userName)},</p>
    <p style="margin:0 0 24px;">
      Sie haben <strong>${p.openDecisionCount} offene Entscheidungen</strong>, die täglich Geld kosten.
    </p>
    <div style="background-color:#FEE2E2;border:1px solid #FECACA;border-radius:8px;padding:16px 20px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#991B1B;">Gesamte Verzögerungskosten</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#DC2626;">${Number(p.totalCod).toLocaleString("de-DE")} €</p>
    </div>
    ${ctaButton("Zurück zu Decivio →", p.appUrl)}
    ${unsubscribeBlock(p.unsubscribeUrl)}`;
  return { subject, html: layout(content, `${p.openDecisionCount} offene Entscheidungen kosten ${Number(p.totalCod).toLocaleString("de-DE")} €`) };
}

export interface ReengagementDay30Params {
  userName: string;
  features: string[];
  appUrl: string;
  unsubscribeUrl: string;
}

export function reengagementDay30Email(p: ReengagementDay30Params): { subject: string; html: string } {
  const subject = "Decivio hat sich weiterentwickelt — was gibt es Neues";
  const featureList = p.features.map(f => `<li style="padding:4px 0;">${escapeHtml(f)}</li>`).join("");
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;">Was gibt es Neues?</h1>
    <p style="margin:0 0 8px;">Hallo ${escapeHtml(p.userName)},</p>
    <p style="margin:0 0 24px;">
      Seit Ihrem letzten Besuch hat sich einiges getan. Hier sind die neuesten Verbesserungen:
    </p>
    <div style="background-color:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0C4A6E;">Neue Features:</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#075985;line-height:1.8;">
        ${featureList}
      </ul>
    </div>
    ${ctaButton("Jetzt anschauen →", p.appUrl)}
    ${unsubscribeBlock(p.unsubscribeUrl)}`;
  return { subject, html: layout(content, "Neue Features bei Decivio") };
}
