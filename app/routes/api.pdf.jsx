import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { generatePackingSlipHtml } from "../utils/pdfUtils.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const orderIdsParam = url.searchParams.get("orderIds") || "";
  const templateType = url.searchParams.get("template") || "modern";

  const orderIds = orderIdsParam.split(",").filter(Boolean);
  if (orderIds.length === 0) {
    return new Response("No orders specified", { status: 400 });
  }

  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });

  const gql = `query GetOrders($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Order {
        id name createdAt processedAt note displayFulfillmentStatus
        customer { displayName email phone }
        shippingAddress { name address1 address2 city province zip country }
        lineItems(first: 50) {
          edges {
            node {
              title quantity sku
              variant { title price }
            }
          }
        }
      }
    }
  }`;

  const resp = await admin.graphql(gql, { variables: { ids: orderIds } });
  const { data } = await resp.json();
  const orders = (data.nodes || []).filter(Boolean);

  const html = generatePackingSlipHtml(orders, settings, templateType);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
