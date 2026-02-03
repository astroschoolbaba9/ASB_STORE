// controllers/me.controller.js
const { asynchandler } = require("../utils/asyncHandler");
const meService = require("../services/me.service");

const getMe = asynchandler(async (req, res) => {
  const user = await meService.getMe(req.user._id);
  res.json({ success: true, user });
});

const updateMe = asynchandler(async (req, res) => {
  const user = await meService.updateMe(req.user._id, req.body || {});
  res.json({ success: true, user });
});

const listAddresses = asynchandler(async (req, res) => {
  const addresses = await meService.listAddresses(req.user._id);
  res.json({ success: true, addresses });
});

const addAddress = asynchandler(async (req, res) => {
  const addresses = await meService.addAddress(req.user._id, req.body || {});
  res.status(201).json({ success: true, addresses });
});

const updateAddress = asynchandler(async (req, res) => {
  const addresses = await meService.updateAddress(req.user._id, req.params.id, req.body || {});
  res.json({ success: true, addresses });
});

const deleteAddress = asynchandler(async (req, res) => {
  const addresses = await meService.deleteAddress(req.user._id, req.params.id);
  res.json({ success: true, addresses });
});

const setDefaultAddress = asynchandler(async (req, res) => {
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
