const { asyncHandler } = require("../utils/asynchandler");
const { AppError } = require("../utils/AppError");
const courseService = require("../services/course.service");
const { coursesQuerySchema } = require("../validators/course.validators");

const getCourses = asyncHandler(async (req, res) => {
  const parsed = coursesQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError("Invalid query params", 400, "VALIDATION_ERROR", parsed.error.flatten());

  const result = await courseService.listCourses(parsed.data);
  res.json({ success: true, ...result });
});

const getCourseById = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseById(req.params.id);
  res.json({ success: true, course });
});

const buyCourse = asyncHandler(async (req, res) => {
  // This will initiate PayU and return actionUrl+fields OR return alreadyPurchased/free
  const result = await courseService.buyCourseWithPayU(req.user, req.params.id, req.body?.customer || {});
  res.status(201).json({ success: true, ...result });
});


const getCourseContent = asyncHandler(async (req, res) => {
  const content = await courseService.getCourseContent(req.user._id, req.params.id);
  res.json({ success: true, content });
});

const getMyCourses = asyncHandler(async (req, res) => {
  const items = await courseService.getMyCourses(req.user._id);
  res.json({ success: true, items });
});

module.exports = { getCourses, getCourseById, buyCourse, getCourseContent, getMyCourses };
