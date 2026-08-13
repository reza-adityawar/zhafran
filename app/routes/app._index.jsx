import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  InlineGrid,
  Banner,
  List,
  Badge,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [subscription, settings, templates] = await Promise.all([
    prisma.subscription.findUnique({ where: { shop } }),
    prisma.shopSettings.findUnique({ where: { shop } }),
    prisma.template.findMany({ where: { shop } }),
  ]);

  if (!subscription) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    await prisma.subscription.create({
      data: { shop, plan: "free_trial", status: "active", trialEndsAt },
    });
  }

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 14;

  return json({ subscription, settings, templateCount: templates.length || 3, trialDaysLeft });
};

export default function Index() {
  const { subscription, settings, templateCount, trialDaysLeft } = useLoaderData();
  const isTrialing = !subscription || subscription.plan === "free_trial";

  return (
    <Page title="SlipKit — Packing Slip Printer">
      <BlockStack gap="500">
        {isTrialing && (
          <Banner
            title={`Free trial: ${trialDaysLeft} days remaining`}
            tone="info"
            action={{ content: "Upgrade now", url: "/app/billing" }}
          >
            <p>Upgrade to keep printing beautiful packing slips after your trial ends.</p>
          </Banner>
        )}
        {!settings?.logoUrl && (
          <Banner
            title="Complete your brand setup"
            tone="warning"
            action={{ content: "Set up brand", url: "/app/settings" }}
          >
            <p>Add your logo and brand colors to make your packing slips look professional.</p>
          </Banner>
        )}

        <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd">Templates</Text>
              <Text variant="heading2xl" as="p">{templateCount}</Text>
              <Text tone="subdued">Ready-to-use designs</Text>
              <Button url="/app/templates" variant="plain">Manage templates</Button>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd">Quick Print</Text>
              <Text variant="bodyMd" tone="subdued">Print packing slips for recent orders instantly</Text>
              <Button url="/app/orders" variant="primary">Select orders</Button>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd">Brand Settings</Text>
              <Text variant="bodyMd" tone="subdued">Logo, colors, and fonts</Text>
              <Button url="/app/settings" variant="plain">Edit branding</Button>
            </BlockStack>
          </Card>
        </InlineGrid>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Getting started</Text>
                <List type="number">
                  <List.Item>
                    <Button url="/app/settings" variant="plain">Upload your logo</Button> and choose brand colors
                  </List.Item>
                  <List.Item>
                    <Button url="/app/templates" variant="plain">Pick a template</Button> — Modern, Classic, or Minimal
                  </List.Item>
                  <List.Item>
                    <Button url="/app/orders" variant="plain">Select orders</Button> and print or export PDF
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd">Your Plan</Text>
                <InlineStack>
                  <Badge tone={isTrialing ? "info" : "success"}>
                    {isTrialing ? `Free Trial — ${trialDaysLeft}d left` : "Basic Plan"}
                  </Badge>
                </InlineStack>
                <Text variant="bodyMd" tone="subdued">
                  {isTrialing ? "All features included during trial" : "Unlimited prints, all templates"}
                </Text>
                {isTrialing && (
                  <Button url="/app/billing" variant="primary" size="slim">
                    Upgrade — $9.99/mo
                  </Button>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
