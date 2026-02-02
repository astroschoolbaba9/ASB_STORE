// controllers/me.controller.js
const { asyncHandler } = require("../utils/asynchandler");
const meService = require("../services/me.service");

const getMe = asyncHandler(async (req, res) => {
  const user = await meService.getMe(req.user._id);
  res.json({ success: true, user });
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await meService.updateMe(req.user._id, req.body || {});
  res.json({ success: true, user });
});

const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await meService.listAddresses(req.user._id);
  res.json({ success: true, addresses });
});

const addAddress = asyncHandler(async (req, res) => {
  const addresses = await meService.addAddress(req.user._id, req.body || {});
  res.status(201).json({ success: true, addresses });
});

const updateAddress = asyncHandler(async (req, res) => {
  const addresses = await meService.updateAddress(req.user._id, req.params.id, req.body || {});
  res.json({ success: true, addresses });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const addresses = await meService.deleteAddress(req.user._id, req.params.id);
  res.json({ success: true, addresses });
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const addresses = await meService.setDefaultAddress(req.user._id, req.params.id);
  res.json({ success: true, addresses });
});

module.exports = {
  getMe,
  updateMe,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
