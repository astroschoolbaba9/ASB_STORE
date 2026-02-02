const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    // This can be a video URL or resource id (your viewer will use it)
    videoUrl: { type: String, default: "" },
    durationSec: { type: Number, default: 0, min: 0 },
    isFreePreview: { type: Boolean, default: false }
  },
  { _id: true }
);

const COURSE_CATEGORIES = ["General", "Beginner Programs", "Advanced Programs", "Certifications", "Workshops"];


const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, trim: true, lowercase: true },

    description: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    category: { type: String, enum: COURSE_CATEGORIES, default: "General" },

    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    featuredOrder: { type: Number, default: 0, min: 0 },
    lessons: { type: [lessonSchema], default: [] },

    // Reviews summary 
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

courseSchema.index({ slug: 1 }, { unique: true });
courseSchema.index({ title: "text", description: "text" });

module.exports = mongoose.models.Course || mongoose.model("Course", courseSchema);
