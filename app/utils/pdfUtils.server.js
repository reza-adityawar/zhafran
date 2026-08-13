function esc(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
}

function slipModern(order, s) {
  const bc = s?.brandColor || "#1a1a2e";
  const ac = s?.accentColor || "#e94560";
  const font = s?.fontFamily || "Inter";
  const items = order.lineItems?.edges || [];
  return `<div style="font-family:${font},sans-serif;max-width:800px;margin:0 auto;page-break-after:always;">
  <div style="background:${bc};color:white;padding:32px 40px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      ${s?.logoUrl ? `<img src="${esc(s.logoUrl)}" style="max-height:48px;margin-bottom:8px;display:block" alt="logo"/>` : ""}
      <div style="font-size:22px;font-weight:700">${esc(s?.companyName||"Your Brand")}</div>
      <div style="opacity:.75;font-size:12px;margin-top:4px">${esc(s?.address||"")}</div>
    </div>
    <div style="text-align:right">
      <div style="background:${ac};padding:8px 16px;border-radius:6px;font-weight:700;font-size:14px">${esc(order.name)}</div>
      <div style="opacity:.75;font-size:12px;margin-top:8px">${fmtDate(order.processedAt||order.createdAt)}</div>
    </div>
  </div>
  <div style="padding:32px 40px">
    <div style="display:flex;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${ac};margin-bottom:8px;font-weight:600">Ship To</div>
        ${order.shippingAddress ? `
          <div style="font-weight:600">${esc(order.shippingAddress.name)}</div>
          <div style="color:#555;font-size:13px;line-height:1.6">
            ${esc(order.shippingAddress.address1)}<br>
            ${order.shippingAddress.address2 ? esc(order.shippingAddress.address2)+"<br>" : ""}
            ${esc(order.shippingAddress.city)}, ${esc(order.shippingAddress.province)} ${esc(order.shippingAddress.zip)}<br>
            ${esc(order.shippingAddress.country)}
          </div>` : "<div style='color:#999'>No address</div>"}
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${ac};margin-bottom:8px;font-weight:600">From</div>
        <div style="color:#555;font-size:13px;line-height:1.6">
          ${esc(s?.email||"")}${s?.phone ? "<br>"+esc(s.phone) : ""}${s?.website ? "<br>"+esc(s.website) : ""}
        </div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <thead>
        <tr style="border-bottom:2px solid ${ac}">
          <th style="text-align:left;padding:10px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${ac}">Item</th>
          <th style="text-align:left;padding:10px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${ac}">Variant</th>
          <th style="text-align:left;padding:10px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${ac}">SKU</th>
          <th style="text-align:right;padding:10px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${ac}">Qty</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(({node:it},i)=>`
          <tr style="border-bottom:1px solid #f0f0f0;background:${i%2?"#fafafa":"white"}">
            <td style="padding:12px 0;font-weight:500">${esc(it.title)}</td>
            <td style="padding:12px 0;color:#666;font-size:13px">${esc(it.variant?.title||"")}</td>
            <td style="padding:12px 0;color:#999;font-size:12px;font-family:monospace">${esc(it.sku||"—")}</td>
            <td style="padding:12px 0;text-align:right;font-weight:600;font-size:15px">${it.quantity}</td>
          </tr>`).join("")}
      </tbody>
    </table>
    ${order.note ? `<div style="background:#f8f9fa;border-left:3px solid ${ac};padding:12px 16px;margin-bottom:24px;font-size:13px"><strong>Order note:</strong> ${esc(order.note)}</div>` : ""}
    ${s?.footerNote ? `<div style="border-top:1px solid #e1e3e5;padding-top:20px;text-align:center;color:#888;font-size:12px">${esc(s.footerNote)}</div>` : ""}
  </div>
</div>`;
}

function slipClassic(order, s) {
  const bc = s?.brandColor || "#1a1a2e";
  const font = s?.fontFamily || "Georgia";
  const items = order.lineItems?.edges || [];
  return `<div style="font-family:${font},serif;max-width:800px;margin:0 auto;padding:40px;page-break-after:always;">
  <div style="border-bottom:3px double ${bc};padding-bottom:20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      ${s?.logoUrl ? `<img src="${esc(s.logoUrl)}" style="max-height:56px;margin-bottom:8px;display:block" alt="logo"/>` : ""}
      <div style="font-size:24px;font-weight:700;color:${bc}">${esc(s?.companyName||"Your Brand")}</div>
      <div style="font-size:12px;color:#555;margin-top:4px">${esc(s?.address||"")}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:700;color:${bc}">PACKING SLIP</div>
      <div style="font-size:13px;margin-top:8px;color:#555">Order: <strong>${esc(order.name)}</strong></div>
      <div style="font-size:12px;color:#777">${fmtDate(order.processedAt||order.createdAt)}</div>
    </div>
  </div>
  ${order.shippingAddress ? `<div style="margin-bottom:24px">
    <div style="font-weight:700;font-size:12px;text-transform:uppercase;margin-bottom:8px;color:${bc}">Ship To:</div>
    <div style="font-size:13px;line-height:1.7">
      <strong>${esc(order.shippingAddress.name)}</strong><br>
      ${esc(order.shippingAddress.address1)}<br>
      ${order.shippingAddress.address2 ? esc(order.shippingAddress.address2)+"<br>" : ""}
      ${esc(order.shippingAddress.city)}, ${esc(order.shippingAddress.province)} ${esc(order.shippingAddress.zip)}<br>
      ${esc(order.shippingAddress.country)}
    </div>
  </div>` : ""}
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:${bc};color:white">
        <th style="padding:10px 12px;text-align:left;font-size:12px">Description</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px">Variant</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px">SKU</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px">Qty</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(({node:it},i)=>`
        <tr style="background:${i%2?"#f5f5f5":"white"};border-bottom:1px solid #ddd">
          <td style="padding:10px 12px;font-size:13px">${esc(it.title)}</td>
          <td style="padding:10px 12px;font-size:12px;color:#555">${esc(it.variant?.title||"")}</td>
          <td style="padding:10px 12px;font-size:12px;color:#777;font-family:monospace">${esc(it.sku||"—")}</td>
          <td style="padding:10px 12px;text-align:center;font-weight:700">${it.quantity}</td>
        </tr>`).join("")}
    </tbody>
  </table>
  ${s?.footerNote ? `<div style="margin-top:32px;text-align:center;color:#777;font-size:12px;border-top:1px solid #ddd;padding-top:16px">${esc(s.footerNote)}</div>` : ""}
</div>`;
}

function slipMinimal(order, s) {
  const bc = s?.brandColor || "#1a1a2e";
  const ac = s?.accentColor || "#e94560";
  const font = s?.fontFamily || "Helvetica Neue";
  const items = order.lineItems?.edges || [];
  return `<div style="font-family:${font},sans-serif;max-width:800px;margin:0 auto;padding:60px;page-break-after:always;">
  <div style="margin-bottom:48px">
    ${s?.logoUrl ? `<img src="${esc(s.logoUrl)}" style="max-height:40px;margin-bottom:16px;display:block" alt="logo"/>` : ""}
    <div style="font-size:28px;font-weight:300;letter-spacing:3px;color:${bc};text-transform:uppercase">${esc(s?.companyName||"Your Brand")}</div>
    <div style="margin-top:16px;font-size:11px;letter-spacing:2px;color:#999;text-transform:uppercase">Packing Slip — ${esc(order.name)} — ${fmtDate(order.processedAt||order.createdAt)}</div>
  </div>
  ${order.shippingAddress ? `<div style="margin-bottom:48px">
    <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:12px">Ship To</div>
    <div style="font-size:14px;line-height:1.8">
      <strong>${esc(order.shippingAddress.name)}</strong><br>
      ${esc(order.shippingAddress.address1)}<br>
      ${order.shippingAddress.address2 ? esc(order.shippingAddress.address2)+"<br>" : ""}
      ${esc(order.shippingAddress.city)}, ${esc(order.shippingAddress.province)} ${esc(order.shippingAddress.zip)}
    </div>
  </div>` : ""}
  <div style="border-top:1px solid #eee;padding-top:24px">
    ${items.map(({node:it})=>`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #f5f5f5">
        <div>
          <div style="font-size:14px;font-weight:500">${esc(it.title)}</div>
          ${it.variant?.title && it.variant.title!=="Default Title" ? `<div style="font-size:12px;color:#999;margin-top:2px">${esc(it.variant.title)}</div>` : ""}
        </div>
        <div style="font-size:18px;font-weight:300;color:${ac}">${it.quantity}</div>
      </div>`).join("")}
  </div>
  ${s?.footerNote ? `<div style="margin-top:48px;text-align:center;color:#bbb;font-size:11px;letter-spacing:1px">${esc(s.footerNote)}</div>` : ""}
</div>`;
}

export function generatePackingSlipHtml(orders, settings, templateType = "modern") {
  const renderers = { modern: slipModern, classic: slipClassic, minimal: slipMinimal };
  const render = renderers[templateType] || slipModern;
  const slips = orders.map((o) => render(o, settings)).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Packing Slips — ${orders.map((o) => o.name).join(", ")}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#f4f4f4;font-size:14px}
    @media print{
      body{background:white}
      @page{margin:0;size:A4}
    }
  </style>
</head>
<body>
${slips}
<script>window.onload=()=>window.print()</script>
</body>
</html>`;
}
