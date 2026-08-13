import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { boundary } from "@shopify/shopify-app-remix/server";
import { readFileSync } from "fs";
import { resolve } from "path";
import prisma from "./db.server";

function getAppUrl() {
  if (process.env.SHOPIFY_APP_URL) return process.env.SHOPIFY_APP_URL;
  try {
    const toml = readFileSync(resolve(process.cwd(), "shopify.app.zhafran-app.toml"), "utf8");
    const match = toml.match(/application_url\s*=\s*"([^"]+)"/);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

let _shopify;
function getShopify() {
  if (!_shopify) {
    _shopify = shopifyApp({
      apiKey: process.env.SHOPIFY_API_KEY,
      apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
      apiVersion: ApiVersion.October24,
      scopes: process.env.SCOPES?.split(","),
      appUrl: getAppUrl(),
      authPathPrefix: "/auth",
      sessionStorage: new PrismaSessionStorage(prisma),
      distribution: AppDistribution.AppStore,
      ...(process.env.SHOP_CUSTOM_DOMAIN
        ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
        : {}),
    });
  }
  return _shopify;
}

function lazyProxy(getter) {
  return new Proxy(
    {},
    {
      get(_, prop) {
        const target = getter();
        const val = target[prop];
        return typeof val === "function" ? val.bind(target) : val;
      },
    }
  );
}

export default lazyProxy(getShopify);
export const apiVersion = ApiVersion.October24;
export const addDocumentResponseHeaders = (...args) =>
  getShopify().addDocumentResponseHeaders(...args);
export const authenticate = lazyProxy(() => getShopify().authenticate);
export const unauthenticated = lazyProxy(() => getShopify().unauthenticated);
export const login = (...args) => getShopify().login(...args);
export const registerWebhooks = (...args) => getShopify().registerWebhooks(...args);
export const sessionStorage = lazyProxy(() => getShopify().sessionStorage);
export { boundary };
