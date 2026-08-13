import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page, Layout, Card, BlockStack, Text, IndexTable, useIndexResourceState,
  Button, Badge, TextField, Banner, Frame, Toast,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("query") || "";

  const gql = `query Orders($first: Int!, $query: String) {
    orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id name createdAt displayFulfillmentStatus
          customer { displayName email }
          lineItems(first: 5) { edges { node { title quantity } } }
          shippingAddress { name address1 city province zip country }
        }
      }
    }
  }`;

  const resp = await admin.graphql(gql, { variables: { first: 25, query: query || undefined } });
  const { data } = await resp.json();

  const orders = data.orders.edges.map(({ node: o }) => ({
    id: o.id,
    name: o.name,
    createdAt: o.createdAt,
    fulfillmentStatus: o.displayFulfillmentStatus,
    customerName: o.customer?.displayName || "Guest",
    itemCount: o.lineItems.edges.length,
  }));

  const [settings, defaultTemplate] = await Promise.all([
    prisma.shopSettings.findUnique({ where: { shop: session.shop } }),
    prisma.template.findFirst({ where: { shop: session.shop, isDefault: true } }),
  ]);

  return json({ orders, settings, defaultTemplate });
};

const STATUS_TONE = {
  FULFILLED: "success", UNFULFILLED: "attention",
  PARTIALLY_FULFILLED: "warning", IN_PROGRESS: "info",
};

export default function Orders() {
  const { orders, defaultTemplate } = useLoaderData();
  const [search, setSearch] = useState("");
  const [toastActive, setToastActive] = useState(false);
  const fetcher = useFetcher();

  const displayOrders = fetcher.data?.orders || orders;
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(displayOrders);

  const handleSearch = (val) => {
    setSearch(val);
    fetcher.load(`/app/orders?query=${encodeURIComponent(val)}`);
  };

  const handlePrint = () => {
    const ids = selectedResources.join(",");
    const tpl = defaultTemplate?.type || "modern";
    window.open(`/api/pdf?orderIds=${encodeURIComponent(ids)}&template=${tpl}`, "_blank");
  };

  const rowMarkup = displayOrders.map((order, idx) => (
    <IndexTable.Row id={order.id} key={order.id} selected={selectedResources.includes(order.id)} position={idx}>
      <IndexTable.Cell><Text fontWeight="bold">{order.name}</Text></IndexTable.Cell>
      <IndexTable.Cell>{order.customerName}</IndexTable.Cell>
      <IndexTable.Cell><Text tone="subdued">{new Date(order.createdAt).toLocaleDateString()}</Text></IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={STATUS_TONE[order.fulfillmentStatus] || "default"}>
          {(order.fulfillmentStatus || "Unknown").replace(/_/g, " ")}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>{order.itemCount} item(s)</IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Frame>
      <Page
        title="Print Orders"
        subtitle={selectedResources.length > 0 ? `${selectedResources.length} selected` : "Select orders to print"}
        primaryAction={{
          content: selectedResources.length > 0 ? `Print (${selectedResources.length})` : "Print",
          onAction: handlePrint,
          disabled: selectedResources.length === 0,
        }}
      >
        <BlockStack gap="400">
          {!defaultTemplate && (
            <Banner tone="warning" title="No template selected">
              Go to <Button url="/app/templates" variant="plain">Templates</Button> and activate a design first.
            </Banner>
          )}
          <Card>
            <BlockStack gap="300">
              <TextField
                label="" labelHidden
                placeholder="Search by order number or customer..."
                value={search}
                onChange={handleSearch}
                clearButton
                onClearButtonClick={() => handleSearch("")}
                autoComplete="off"
              />
              <IndexTable
                resourceName={{ singular: "order", plural: "orders" }}
                itemCount={displayOrders.length}
                selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: "Order" }, { title: "Customer" }, { title: "Date" },
                  { title: "Fulfillment" }, { title: "Items" },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            </BlockStack>
          </Card>

          {selectedResources.length > 0 && (
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd">{selectedResources.length} order(s) ready to print</Text>
                <Text tone="subdued">Template: <strong>{defaultTemplate?.name || "Modern"}</strong></Text>
                <Button onClick={handlePrint} variant="primary" size="large">
                  Print / Export PDF ({selectedResources.length} slip{selectedResources.length > 1 ? "s" : ""})
                </Button>
              </BlockStack>
            </Card>
          )}
        </BlockStack>
      </Page>
      {toastActive && <Toast content="Opening PDF..." onDismiss={() => setToastActive(false)} />}
    </Frame>
  );
}
