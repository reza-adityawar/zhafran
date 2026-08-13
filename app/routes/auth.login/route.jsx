import { useState } from "react";
import { Form, useActionData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { login } from "../../shopify.server";

export const loader = async ({ request }) => {
  return json({ errors: {} });
};

export const action = async ({ request }) => {
  const loginResult = await login(request);
  if (loginResult.errors.shop) {
    return json({ errors: loginResult.errors });
  }
  return redirect("/app");
};

export default function Auth() {
  const actionData = useActionData();
  const [shop, setShop] = useState("");

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "10rem" }}>
      <div style={{ maxWidth: 400, width: "100%", padding: "2rem", border: "1px solid #e1e3e5", borderRadius: 8 }}>
        <h1 style={{ marginBottom: "1.5rem", textAlign: "center", fontSize: 24 }}>SlipKit</h1>
        <Form method="post">
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Shop domain</label>
          <input
            type="text"
            name="shop"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="your-store.myshopify.com"
            style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4, marginBottom: 8 }}
          />
          {actionData?.errors?.shop && (
            <p style={{ color: "red", fontSize: 12, marginBottom: 8 }}>{actionData.errors.shop}</p>
          )}
          <button type="submit" style={{ width: "100%", padding: "0.75rem", background: "#1a1a2e", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 }}>
            Log in with Shopify
          </button>
        </Form>
      </div>
    </div>
  );
}
