import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page, Layout, Card, BlockStack, Text, Button, Badge,
  List, Divider, InlineStack, Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  let subscription = await prisma.subscription.findUnique({ where: { shop } });
  if (!subscription) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    subscription = await prisma.subscription.create({
      data: { shop, plan: "free_trial", status: "active", trialEndsAt },
    });
  }

  const trialDaysLeft = subscription.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / 86400000))
    : 0;

  return json({ subscription, trialDaysLeft });
};

export const action = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);

  const { confirmationUrl } = await billing.require({
    plans: [{
      name: "Basic Plan",
      amount: 9.99,
      currencyCode: "USD",
      interval: "EVERY_30_DAYS",
      trialDays: 14,
    }],
    isTest: process.env.NODE_ENV !== "production",
    onFailure: async () => { throw new Response("Billing failed", { status: 500 }); },
  });

  return redirect(confirmationUrl);
};

export default function Billing() {
  const { subscription, trialDaysLeft } = useLoaderData();
  const isTrialing = subscription?.plan === "free_trial";
  const isActive = subscription?.plan === "basic" && subscription?.status === "active";

  return (
    <Page title="Billing & Plan">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {isTrialing && trialDaysLeft > 0 && (
              <Banner title={`Free trial: ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} remaining`} tone="info">
                <p>After your trial, subscribe to continue printing branded packing slips.</p>
              </Banner>
            )}
            {isTrialing && trialDaysLeft === 0 && (
              <Banner title="Your trial has ended" tone="critical">
                <p>Subscribe to continue using SlipKit.</p>
              </Banner>
            )}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text variant="headingLg">Basic Plan</Text>
                  <Badge tone={isActive ? "success" : isTrialing ? "info" : "critical"}>
                    {isActive ? "Active" : isTrialing ? `Trial — ${trialDaysLeft}d left` : "Inactive"}
                  </Badge>
                </InlineStack>
                <InlineStack gap="100" blockAlign="end">
                  <Text variant="heading2xl">$9.99</Text>
                  <Text tone="subdued">/ month</Text>
                </InlineStack>
                <Divider />
                <List type="bullet">
                  <List.Item>Unlimited packing slip printing</List.Item>
                  <List.Item>All 3 templates — Modern, Classic, Minimal</List.Item>
                  <List.Item>Custom logo, colors &amp; fonts</List.Item>
                  <List.Item>Bulk print multiple orders at once</List.Item>
                  <List.Item>PDF export via browser print dialog</List.Item>
                  <List.Item>Real-time preview with your brand</List.Item>
                  <List.Item>Priority email support</List.Item>
                </List>
                {!isActive && (
                  <form method="post">
                    <Button submit variant="primary" size="large">
                      {isTrialing ? "Subscribe — $9.99/month" : "Reactivate subscription"}
                    </Button>
                  </form>
                )}
                {isActive && (
                  <Text tone="subdued">
                    Next billing date:{" "}
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : "Contact support"}
                  </Text>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Why upgrade?</Text>
              <Text tone="subdued">
                Branded packing slips create a professional unboxing experience that builds repeat purchase behaviour and customer trust.
              </Text>
              <Divider />
              <Text variant="headingMd">Cancel anytime</Text>
              <Text tone="subdued">
                No lock-in. Cancel from your Shopify billing settings at any time.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
