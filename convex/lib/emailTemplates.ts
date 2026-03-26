type BalanceEmailCta = {
  label: string;
  href: string;
};

const BRAND = {
  name: "BALANCE",
  tagline: "Attendance and leave",
  // Keep aligned with src/index.css: --color-brand
  brandTeal: "#2FABB9",
  brandTealHover: "#1E8F9C",
  ink: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  surface: "#ffffff",
  // Keep aligned with src/index.css page background
  background: "#FDFDFB",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type BalanceEmailParams = {
  title: string;
  preheader?: string;
  greetingName?: string;
  bodyHtml: string;
  cta?: BalanceEmailCta;
  footerNote?: string;
};

/**
 * BALANCE-branded, email-client-safe HTML wrapper.
 * - Uses tables + inline CSS for broad support.
 * - `bodyHtml` should already be escaped or otherwise safe HTML.
 */
export function renderBalanceEmail(params: BalanceEmailParams): string {
  const title = escapeHtml(params.title);
  const preheader = params.preheader ? escapeHtml(params.preheader) : "";
  const greetingName = params.greetingName ? escapeHtml(params.greetingName) : "";
  const footerNote = escapeHtml(params.footerNote ?? `This is an automated message from ${BRAND.name}.`);

  const greetingBlock = greetingName
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:22px;color:${BRAND.ink};">Hi ${greetingName},</p>`
    : "";

  const ctaBlock = params.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0;">
        <tr>
          <td bgcolor="${BRAND.brandTeal}" style="border-radius:10px;">
            <a href="${escapeHtml(params.cta.href)}"
               style="display:inline-block;padding:12px 16px;font-size:14px;line-height:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
              ${escapeHtml(params.cta.label)}
            </a>
          </td>
        </tr>
      </table>`
    : "";

  // Hidden preheader: improves inbox preview text without affecting rendering.
  const preheaderBlock = preheader
    ? `<div style="display:none;font-size:1px;color:${BRAND.background};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.background};">
    ${preheaderBlock}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.background};">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">
            <tr>
              <td style="padding:0 8px 14px;">
                <div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="left" style="font-weight:900;letter-spacing:0.08em;color:${BRAND.ink};">
                        ${BRAND.name}
                      </td>
                      <td align="right" style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.muted};">
                        ${BRAND.tagline}
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>

            <tr>
              <td style="background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:16px;padding:22px 20px;">
                <div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
                  <h1 style="margin:0 0 12px;font-size:18px;line-height:26px;color:${BRAND.ink};">${title}</h1>
                  ${greetingBlock}
                  <div style="font-size:14px;line-height:22px;color:${BRAND.ink};">
                    ${params.bodyHtml}
                  </div>
                  ${ctaBlock}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 12px 0;">
                <div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;line-height:18px;color:${BRAND.muted};">
                  ${footerNote}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function escapeBalanceEmailHtml(value: string): string {
  return escapeHtml(value);
}
