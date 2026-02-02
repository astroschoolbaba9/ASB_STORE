// services/me.service.js
const mongoose = require("mongoose");
const User = require("../models/User");
const { AppError } = require("../utils/AppError");

function isObjectIdLike(v) {
  return mongoose.Types.ObjectId.isValid(String(v || ""));
}

function cleanStr(v, max = 200) {
  return String(v || "").trim().slice(0, max);
}

function normalizeAddress(input = {}) {
  return {
    label: cleanStr(input.label || "Home", 40),
    fullName: cleanStr(input.fullName || input.name || "", 120),
    phone: cleanStr(input.phone || "", 40),

    line1: cleanStr(input.line1 || "", 200),
    line2: cleanStr(input.line2 || "", 200),
    city: cleanStr(input.city || "", 80),
    state: cleanStr(input.state || "", 80),
    pincode: cleanStr(input.pincode || input.pin || "", 20),
    landmark: cleanStr(input.landmark || "", 120),

    isDefault: !!input.isDefault
  };
}

async function getUserDoc(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return user;
}

function enforceSingleDefault(addresses) {
  // If none marked default -> keep as is
  const idx = addresses.findIndex((a) => a.isDefault);
  if (idx === -1) return;

  addresses.forEach((a, i) => {
    if (i !== idx) a.isDefault = false;
  });
}

async function getMe(userId) {
  const user = await User.findById(userId).select("name email phone role isBlocked addresses");
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  return {
    _id: user._id,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role,
    isBlocked: !!user.isBlocked,
    addresses: Array.isArray(user.addresses) ? user.addresses : []
  };
}

async function updateMe(userId, patch = {}) {
  const user = await getUserDoc(userId);

  if (patch.name != null) user.name = cleanStr(patch.name, 120);

  // Only set email/phone if your schema actually has them (you do in indexes)
  if (patch.email != null) user.email = cleanStr(patch.email, 120) || null;
  if (patch.phone != null) user.phone = cleanStr(patch.phone, 40) || null;

  await user.save();

  return {
    _id: user._id,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role,
    isBlocked: !!user.isBlocked
  };
}

async function listAddresses(userId) {
  const user = await User.findById(userId).select("addresses");
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return Array.isArray(user.addresses) ? user.addresses : [];
}

async function addAddress(userId, data = {}) {
  const user = await getUserDoc(userId);

  const addr = normalizeAddress(data);

  // if user has no address -> auto default
  if (!user.addresses.length) addr.isDefault = true;

  user.addresses.push(addr);
  enforceSingleDefault(user.addresses);

  await user.save();
  return user.addresses;
}

async function updateAddress(userId, addressId, data = {}) {
  if (!isObjectIdLike(addressId)) throw new AppError("Invalid address id", 400, "INVALID_ID");

  const user = await getUserDoc(userId);

  const addr = user.addresses.id(addressId);
  if (!addr) throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");

  const patch = normalizeAddress({ ...addr.toObject(), ...data });

  addr.label = patch.label;
  addr.fullName = patch.fullName;
  addr.phone = patch.phone;
  addr.line1 = patch.line1;
  addr.line2 = patch.line2;
  addr.city = patch.city;
  addr.state = patch.state;
  addr.pincode = patch.pincode;
  addr.landmark = patch.landmark;

  if (data.isDefault != null) addr.isDefault = !!data.isDefault;

  enforceSingleDefault(user.addresses);

  await user.save();
  return user.addresses;
}

async function deleteAddress(userId, addressId) {
  if (!isObjectIdLike(addressId)) throw new AppError("Invalid address id", 400, "INVALID_ID");

  const user = await getUserDoc(userId);
  const addr = user.addresses.id(addressId);
  if (!addr) throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");

  const wasDefault = !!addr.isDefault;

  addr.deleteOne();

  // if default removed, set first as default
  if (wasDefault && user.addresses.length) {
    user.addresses[0].isDefault = true;
  }

  enforceSingleDefault(user.addresses);

  await user.save();
  return user.addresses;
}

async function setDefaultAddress(userId, addressId) {
  if (!isObjectIdLike(addressId)) throw new AppError("Invalid address id", 400, "INVALID_ID");

  const user = await getUserDoc(userId);
  const addr = user.addresses.id(addressId);
  if (!addr) throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");

  user.addresses.forEach((a) => (a.isDefault = false));
  addr.isDefault = true;

  await user.save();
  return user.addresses;
}

module.exports = {
  getMe,
  updateMe,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
