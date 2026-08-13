import { useState, useCallback } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page, Layout, Card, BlockStack, Text, TextField, Button,
  Select, Divider, InlineStack, Thumbnail, DropZone, Toast, Frame,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });
  return json({ settings });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const data = {
    brandColor: formData.get("brandColor") || "#1a1a2e",
    accentColor: formData.get("accentColor") || "#e94560",
    fontFamily: formData.get("fontFamily") || "Inter",
    companyName: formData.get("companyName") || "",
    address: formData.get("address") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    website: formData.get("website") || "",
    footerNote: formData.get("footerNote") || "",
    logoUrl: formData.get("logoUrl") || null,
  };
  await prisma.shopSettings.upsert({
    where: { shop: session.shop },
    update: data,
    create: { shop: session.shop, ...data },
  });
  return json({ success: true });
};

const FONT_OPTIONS = [
  { label: "Inter (Modern sans-serif)", value: "Inter" },
  { label: "Georgia (Classic serif)", value: "Georgia" },
  { label: "Helvetica Neue (Clean)", value: "Helvetica Neue" },
  { label: "Playfair Display (Elegant)", value: "Playfair Display" },
  { label: "Roboto (Friendly)", value: "Roboto" },
];

export default function Settings() {
  const { settings } = useLoaderData();
  const submit = useSubmit();

  const [brandColor, setBrandColor] = useState(settings?.brandColor || "#1a1a2e");
  const [accentColor, setAccentColor] = useState(settings?.accentColor || "#e94560");
  const [fontFamily, setFontFamily] = useState(settings?.fontFamily || "Inter");
  const [companyName, setCompanyName] = useState(settings?.companyName || "");
  const [address, setAddress] = useState(settings?.address || "");
  const [phone, setPhone] = useState(settings?.phone || "");
  const [email, setEmail] = useState(settings?.email || "");
  const [website, setWebsite] = useState(settings?.website || "");
  const [footerNote, setFooterNote] = useState(settings?.footerNote || "");
  const [logoUrl, setLogoUrl] = useState(settings?.logoUrl || "");
  const [toastActive, setToastActive] = useState(false);

  const handleSave = () => {
    const formData = new FormData();
    formData.append("brandColor", brandColor);
    formData.append("accentColor", accentColor);
    formData.append("fontFamily", fontFamily);
    formData.append("companyName", companyName);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("website", website);
    formData.append("footerNote", footerNote);
    if (logoUrl) formData.append("logoUrl", logoUrl);
    submit(formData, { method: "post" });
    setToastActive(true);
  };

  const handleDropZoneDrop = useCallback((_dropFiles, acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setLogoUrl(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const previewStyle = { fontFamily, fontSize: 11, border: "1px solid #e1e3e5", borderRadius: 8, overflow: "hidden", minHeight: 300 };

  return (
    <Frame>
      <Page title="Brand Settings" primaryAction={{ content: "Save settings", onAction: handleSave }}>
        <Layout>
          <Layout.Section>
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd">Company Logo</Text>
                  {logoUrl && (
                    <InlineStack gap="300" align="center">
                      <Thumbnail source={logoUrl} alt="Logo" size="large" />
                      <Button onClick={() => setLogoUrl("")} tone="critical" size="slim">Remove</Button>
                    </InlineStack>
                  )}
                  <DropZone accept="image/*" type="image" onDrop={handleDropZoneDrop}>
                    <DropZone.FileUpload actionTitle="Add logo" actionHint="PNG, JPG, SVG up to 5MB" />
                  </DropZone>
                  <TextField
                    label="Or paste image URL"
                    value={logoUrl}
                    onChange={setLogoUrl}
                    placeholder="https://example.com/logo.png"
                    autoComplete="off"
                  />
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd">Brand Colors</Text>
                  <InlineStack gap="600" wrap={false}>
                    <BlockStack gap="200">
                      <Text variant="bodyMd">Primary color</Text>
                      <TextField
                        label="" labelHidden
                        value={brandColor}
                        onChange={setBrandColor}
                        prefix={<div style={{ width: 20, height: 20, borderRadius: 4, background: brandColor, border: "1px solid #ccc" }} />}
                        autoComplete="off"
                      />
                    </BlockStack>
                    <BlockStack gap="200">
                      <Text variant="bodyMd">Accent color</Text>
                      <TextField
                        label="" labelHidden
                        value={accentColor}
                        onChange={setAccentColor}
                        prefix={<div style={{ width: 20, height: 20, borderRadius: 4, background: accentColor, border: "1px solid #ccc" }} />}
                        autoComplete="off"
                      />
                    </BlockStack>
                  </InlineStack>
                  <Text variant="bodySm" tone="subdued">Enter hex codes (e.g. #1a1a2e) or use any valid CSS color</Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd">Font</Text>
                  <Select label="Document font" options={FONT_OPTIONS} value={fontFamily} onChange={setFontFamily} />
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd">Company Information</Text>
                  <TextField label="Company name" value={companyName} onChange={setCompanyName} autoComplete="organization" />
                  <TextField label="Address" value={address} onChange={setAddress} multiline={3} autoComplete="street-address" />
                  <TextField label="Phone" value={phone} onChange={setPhone} autoComplete="tel" />
                  <TextField label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
                  <TextField label="Website" value={website} onChange={setWebsite} autoComplete="url" />
                  <Divider />
                  <TextField
                    label="Footer note"
                    value={footerNote}
                    onChange={setFooterNote}
                    multiline={2}
                    placeholder="Thank you for your order! Returns accepted within 30 days."
                    helpText="Printed at the bottom of every packing slip"
                    autoComplete="off"
                  />
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd">Live Preview</Text>
                <div style={previewStyle}>
                  <div style={{ background: brandColor, color: "white", padding: "12px 16px" }}>
                    {logoUrl && <img src={logoUrl} alt="logo" style={{ maxHeight: 32, marginBottom: 6, display: "block" }} />}
                    <div style={{ fontWeight: "bold", fontSize: 14 }}>{companyName || "Your Company"}</div>
                    <div style={{ opacity: 0.7, fontSize: 11 }}>{address?.split("\n")[0] || "123 Main St"}</div>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: "bold", color: accentColor, fontSize: 12, marginBottom: 6, letterSpacing: 1 }}>PACKING SLIP</div>
                    <div style={{ fontSize: 11, color: "#666" }}>Order #1001 — {new Date().toLocaleDateString()}</div>
                    <div style={{ borderTop: `2px solid ${accentColor}`, marginTop: 10, paddingTop: 8 }}>
                      {[["Blue T-Shirt (M)", 2], ["White Sneakers", 1]].map(([name, qty], i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #f5f5f5" }}>
                          <span>{name}</span><span style={{ fontWeight: "bold" }}>{qty}</span>
                        </div>
                      ))}
                    </div>
                    {footerNote && <div style={{ marginTop: 12, fontSize: 10, color: "#888", textAlign: "center" }}>{footerNote}</div>}
                  </div>
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
      {toastActive && <Toast content="Settings saved!" onDismiss={() => setToastActive(false)} />}
    </Frame>
  );
}
