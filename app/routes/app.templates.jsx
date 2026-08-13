import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page, InlineGrid, Card, BlockStack, Text, Button, Badge, InlineStack, Toast, Frame,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

const BUILT_IN = [
  { id: "modern", name: "Modern", description: "Bold header, accent stripe. Great for lifestyle brands." },
  { id: "classic", name: "Classic", description: "Traditional invoice layout. Great for B2B merchants." },
  { id: "minimal", name: "Minimal", description: "Ultra-clean typographic design. Great for luxury brands." },
];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const [settings, defaultTemplate] = await Promise.all([
    prisma.shopSettings.findUnique({ where: { shop } }),
    prisma.template.findFirst({ where: { shop, isDefault: true } }),
  ]);
  return json({ settings, defaultTemplate });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const templateType = formData.get("templateType");
  const tplName = BUILT_IN.find((t) => t.id === templateType)?.name || templateType;

  await prisma.template.updateMany({ where: { shop }, data: { isDefault: false } });
  const existing = await prisma.template.findFirst({ where: { shop, type: templateType } });
  if (existing) {
    await prisma.template.update({ where: { id: existing.id }, data: { isDefault: true } });
  } else {
    await prisma.template.create({
      data: { shop, name: tplName, type: templateType, isDefault: true, layout: "{}" },
    });
  }
  return json({ success: true });
};

function TemplatePreview({ type, settings }) {
  const bc = settings?.brandColor || "#1a1a2e";
  const ac = settings?.accentColor || "#e94560";
  const font = settings?.fontFamily || "Inter";
  const company = settings?.companyName || "Your Brand";
  const base = { fontFamily: font, fontSize: 11, border: "1px solid #e1e3e5", borderRadius: 8, overflow: "hidden", userSelect: "none" };
  const items = [["Blue T-Shirt (M)", 2], ["White Sneakers (42)", 1]];

  if (type === "modern") return (
    <div style={base}>
      <div style={{ background: bc, color: "white", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: "bold", fontSize: 13 }}>{company}</div>
          <div style={{ opacity: 0.7, fontSize: 10 }}>Packing Slip</div>
        </div>
        <div style={{ background: ac, padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: "bold" }}>ORDER #1001</div>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${ac}`, paddingBottom: 6, marginBottom: 6, color: ac, fontWeight: "bold", fontSize: 10 }}>
          <span>Product</span><span>Qty</span>
        </div>
        {items.map(([n, q], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #f5f5f5" }}>
            <span>{n}</span><span style={{ fontWeight: "bold" }}>{q}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (type === "classic") return (
    <div style={base}>
      <div style={{ padding: 12, borderBottom: `3px double ${bc}` }}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: bc }}>{company}</div>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 12, color: bc, marginBottom: 8 }}>PACKING SLIP</div>
        <div style={{ background: bc, color: "white", display: "flex", justifyContent: "space-between", padding: "4px 8px", fontSize: 10, borderRadius: 3 }}>
          <span>Description</span><span>Qty</span>
        </div>
        {items.map(([n, q], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: i % 2 ? "#f9f9f9" : "white" }}>
            <span>{n}</span><span>{q}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // minimal
  return (
    <div style={base}>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: "300", letterSpacing: 3, color: bc, textTransform: "uppercase", marginBottom: 10 }}>{company}</div>
        <div style={{ fontSize: 9, color: "#aaa", marginBottom: 10, borderBottom: "1px solid #eee", paddingBottom: 8, letterSpacing: 1 }}>PACKING SLIP — ORDER #1001</div>
        {items.map(([n, q], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f5f5f5" }}>
            <span>{n}</span><span style={{ color: ac, fontWeight: "300" }}>{q}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Templates() {
  const { settings, defaultTemplate } = useLoaderData();
  const submit = useSubmit();
  const [toastActive, setToastActive] = useState(false);

  const handleSetDefault = (templateType) => {
    const fd = new FormData();
    fd.append("templateType", templateType);
    submit(fd, { method: "post" });
    setToastActive(true);
  };

  return (
    <Frame>
      <Page title="Templates" subtitle="Choose a design for your packing slips">
        <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
          {BUILT_IN.map((tpl) => {
            const isDefault = defaultTemplate?.type === tpl.id;
            return (
              <Card key={tpl.id} padding="400">
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <Text variant="headingMd">{tpl.name}</Text>
                    {isDefault && <Badge tone="success">Active</Badge>}
                  </InlineStack>
                  <TemplatePreview type={tpl.id} settings={settings} />
                  <Text variant="bodySm" tone="subdued">{tpl.description}</Text>
                  <Button
                    onClick={() => handleSetDefault(tpl.id)}
                    variant={isDefault ? "secondary" : "primary"}
                    size="slim"
                  >
                    {isDefault ? "Currently active" : "Use this template"}
                  </Button>
                </BlockStack>
              </Card>
            );
          })}
        </InlineGrid>
      </Page>
      {toastActive && <Toast content="Template activated!" onDismiss={() => setToastActive(false)} />}
    </Frame>
  );
}
