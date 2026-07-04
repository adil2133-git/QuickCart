const buildEmailHTML = ({
    heading,
    greeting,
    paragraphs = [],
    details = [],
    cta = null,
    footerNote = "",
}) => {
    const paragraphsHTML = paragraphs
        .map((p) => `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">${p}</p>`)
        .join("");

    const detailsHTML = details.length
        ? `<table style="width:100%;border-collapse:collapse;margin:20px 0;">
            ${details
                .map(
                    (d) => `<tr>
                        <td style="padding:8px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #f0f0f0;">${d.label}</td>
                        <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">${d.value}</td>
                    </tr>`
                )
                .join("")}
           </table>`
        : "";

    const ctaHTML = cta
        ? `<div style="text-align:center;margin:28px 0 8px;">
            <a href="${cta.url}" style="background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">${cta.text}</a>
           </div>`
        : "";

    return `
    <div style="background:#f4f5f7;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:#16a34a;padding:20px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.3px;">QuickKart</span>
            </div>
            <div style="padding:28px;">
                <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">${heading}</h2>
                ${greeting ? `<p style="margin:0 0 16px;color:#111827;font-size:15px;">${greeting}</p>` : ""}
                ${paragraphsHTML}
                ${detailsHTML}
                ${ctaHTML}
            </div>
            <div style="background:#f9fafb;padding:16px 28px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#9ca3af;font-size:12px;">${footerNote || "This is an automated email from QuickKart. Please do not reply."}</p>
            </div>
        </div>
    </div>`;
};

module.exports = { buildEmailHTML };