import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const EMPTY_CART = {
  items: [],
  totals: {
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    giftWrapTotal: 0,
    grandTotal: 0
  }
};

// --- helpers ---
function normalizeId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return v._id || v.id || "";
  return String(v);
}

function getProductIdFromCartItem(it) {
  // backend cart returns { product: {...}, itemId, qty }
  const p = it?.product || it?.productId || it?.productRef || null;
  return normalizeId(p) || normalizeId(it?.productId) || "";
}

function getCartItemIdFromCartItem(it) {
  // ✅ backend uses itemId
  return normalizeId(it?.itemId || it?._id || it?.id || it?.cartItemId || it?.lineId);
}


export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  const cartIndex = useMemo(() => {
    const items = cart?.items || [];
    const byCartItemId = new Map();
    const byProductId = new Map();

    for (const it of items) {
      const cid = getCartItemIdFromCartItem(it);
      const pid = getProductIdFromCartItem(it);
      if (cid) byCartItemId.set(cid, it);
      if (pid) byProductId.set(pid, it);
    }

    return { byCartItemId, byProductId };
  }, [cart]);

  const refreshCart = async () => {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      return EMPTY_CART;
    }

    setLoading(true);
    try {
      const res = await api.get("/api/cart");
      const nextCart = res?.cart || EMPTY_CART;

      // ✅ Ensure totals exist (backend now returns totals, but keep fallback)
      const safeTotals = nextCart.totals || EMPTY_CART.totals;

      setCart({
        ...nextCart,
        totals: {
          ...EMPTY_CART.totals,
          ...safeTotals
        }
      });

      return nextCart;
    } catch (e) {
      console.error("refreshCart failed:", e);
      setCart(EMPTY_CART);
      return EMPTY_CART;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  /**
   * ✅ POST /api/cart/items
   * body: { productId, qty, isGift?, giftWrap?, giftMessage?, recipientName?, recipientPhone?, giftOccasion? }
   */
  const addToCart = async ({ productId, qty = 1, gift, ...rest } = {}) => {
    if (!isAuthenticated) throw new Error("LOGIN_REQUIRED");
    if (!productId) throw new Error("INVALID_PRODUCT");

    setLoading(true);
    try {
      // ✅ Accept gift details either nested in `gift` OR directly in rest
      const giftObj = gift && typeof gift === "object" ? gift : {};
      const payload = { productId, qty, ...rest, ...giftObj };

      const res = await api.post("/api/cart/items", payload);
      const nextCart = res?.cart || EMPTY_CART;

      setCart({
        ...nextCart,
        totals: { ...EMPTY_CART.totals, ...(nextCart.totals || {}) }
      });

      return nextCart;
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Backward compatibility:
   * addItem({ productId, qty, gift })
   * addItem(productObj, qty)
   */
  const addItem = async (arg1, arg2) => {
    if (arg1 && typeof arg1 === "object" && arg1.productId) {
      return addToCart(arg1);
    }

    if (arg1 && typeof arg1 === "object") {
      const productId = arg1._id || arg1.id;
      const qty = typeof arg2 === "number" ? arg2 : 1;
      if (!productId) throw new Error("INVALID_PRODUCT");
      return addToCart({ productId, qty });
    }

    throw new Error("INVALID_ADD_ITEM_ARGS");
  };

  // ✅ Resolve identifier: accepts cartItemId OR productId
  const resolveCartItemId = (idLike) => {
    const id = normalizeId(idLike);
    if (!id) return "";

    const byId = cartIndex.byCartItemId.get(id);
    if (byId) return getCartItemIdFromCartItem(byId);

    const byPid = cartIndex.byProductId.get(id);
    if (byPid) return getCartItemIdFromCartItem(byPid);

    return "";
  };

const updateCartItem = async (itemIdOrProductId, patch) => {
  if (!isAuthenticated) throw new Error("LOGIN_REQUIRED");

  const cartItemId = resolveCartItemId(itemIdOrProductId);
  if (!cartItemId) {
    const err = new Error("Invalid itemId (cart line id not found).");
    err.code = "INVALID_ITEM_ID";
    throw err;
  }

  // ✅ best-effort qty clamp (real stock check should happen in backend cart service)
  const safePatch = { ...(patch || {}) };
  if (typeof safePatch.qty === "number") {
    safePatch.qty = Math.max(1, Math.min(50, Math.floor(safePatch.qty)));
  }

  setLoading(true);
  try {
    const res = await api.put(`/api/cart/items/${cartItemId}`, safePatch);
    const nextCart = res?.cart || EMPTY_CART;

    setCart({
      ...nextCart,
      totals: { ...EMPTY_CART.totals, ...(nextCart.totals || {}) }
    });

    return nextCart;
  } finally {
    setLoading(false);
  }
};


  const removeCartItem = async (itemIdOrProductId) => {
    if (!isAuthenticated) throw new Error("LOGIN_REQUIRED");

    const cartItemId = resolveCartItemId(itemIdOrProductId);
    if (!cartItemId) {
      const err = new Error("Invalid itemId (cart line id not found).");
      err.code = "INVALID_ITEM_ID";
      throw err;
    }

    setLoading(true);
    try {
      const res = await api.del(`/api/cart/items/${cartItemId}`);
      const nextCart = res?.cart || EMPTY_CART;

      setCart({
        ...nextCart,
        totals: { ...EMPTY_CART.totals, ...(nextCart.totals || {}) }
      });

      return nextCart;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) throw new Error("LOGIN_REQUIRED");

    const items = cart?.items || [];
    if (!items.length) return EMPTY_CART;

    setLoading(true);
    try {
      for (const it of items) {
        const cid = getCartItemIdFromCartItem(it);
        const pid = getProductIdFromCartItem(it);
        const id = cid || pid;
        if (id) {
          const cartItemId = resolveCartItemId(id);
          if (cartItemId) {
            await api.del(`/api/cart/items/${cartItemId}`);
          }
        }
      }
      return await refreshCart();
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    refreshCart,

    addToCart,
    addItem,

    updateCartItem,
    removeCartItem,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
