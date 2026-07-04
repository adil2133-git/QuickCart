/**
 * Builds a branded HTML email for QuickKart.
 *
 * @param {object} opts
 * @param {string} opts.heading        - Main heading inside the card
 * @param {string} [opts.greeting]     - E.g. "Hi Adil,"
 * @param {string[]} [opts.paragraphs] - Body paragraphs
 * @param {{ label: string, value: string }[]} [opts.details] - Key/value table rows
 * @param {{ text: string, url: string }} [opts.cta]          - Call-to-action button
 * @param {string} [opts.footerNote]   - Override the default footer line
 */
const buildEmailHTML = ({
    heading,
    greeting,
    paragraphs = [],
    details = [],
    cta = null,
    footerNote = "",
}) => {
    const paragraphsHTML = paragraphs
        .map(
            (p) =>
                `<p style="margin:0 0 14px;color:#4a3728;font-size:15px;line-height:1.7;">${p}</p>`
        )
        .join("");

    const detailsHTML = details.length
        ? `<table style="width:100%;border-collapse:collapse;margin:22px 0;background:#fdf6ee;border-radius:10px;overflow:hidden;">
            ${details
                .map(
                    (d, i) =>
                        `<tr style="background:${i % 2 === 0 ? "#fdf6ee" : "#faf0e4"};">
                            <td style="padding:11px 16px;color:#8a7060;font-size:13px;font-weight:500;width:45%;">${d.label}</td>
                            <td style="padding:11px 16px;color:#2b1b0e;font-size:13px;font-weight:700;text-align:right;">${d.value}</td>
                        </tr>`
                )
                .join("")}
           </table>`
        : "";

    const ctaHTML = cta
        ? `<div style="text-align:center;margin:28px 0 8px;">
            <a href="${cta.url}"
               style="background:#6f4e37;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:15px;font-weight:700;display:inline-block;letter-spacing:0.3px;">
               ${cta.text}
            </a>
           </div>`
        : "";

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f5ede3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="padding:40px 16px;">

            <!-- Card -->
            <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(43,27,14,0.10);border:1px solid #e8d9cc;">

                <!-- Header -->
                <div style="background:linear-gradient(135deg,#2f1b12 0%,#4a2e1e 100%);padding:24px 32px;display:flex;align-items:center;gap:12px;">
                    <div style="width:36px;height:36px;background:#c9a97a;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                        <span style="font-size:18px;">🛒</span>
                    </div>
                    <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.5px;">QuickKart</span>
                </div>

                <!-- Body -->
                <div style="padding:32px;">
                    <h2 style="margin:0 0 20px;color:#2b1b0e;font-size:22px;font-weight:700;line-height:1.3;">${heading}</h2>
                    ${greeting ? `<p style="margin:0 0 16px;color:#4a3728;font-size:15px;font-weight:500;">${greeting}</p>` : ""}
                    ${paragraphsHTML}
                    ${detailsHTML}
                    ${ctaHTML}
                </div>

                <!-- Divider -->
                <div style="height:1px;background:linear-gradient(90deg,transparent,#e8d9cc,transparent);margin:0 32px;"></div>

                <!-- Footer -->
                <div style="background:#fdf6ee;padding:18px 32px;">
                    <p style="margin:0;color:#a08060;font-size:12px;line-height:1.6;">
                        ${footerNote || "This is an automated message from QuickKart. Please do not reply to this email."}
                    </p>
                    <p style="margin:8px 0 0;color:#c9b8a8;font-size:11px;">
                        © ${new Date().getFullYear()} QuickKart · Your neighbourhood grocery, delivered fast.
                    </p>
                </div>
            </div>

        </div>
    </body>
    </html>`;
};

module.exports = { buildEmailHTML };