import mongoose from "mongoose";
import { Category } from "./category.model";
import { env } from "../../config/env.config";
export const categoryConfig = [
  {
    name: "Service Announcement",
    description: "Announcements about church services",
    icon: "megaphone", // string key
  },
  {
    name: "Newsletter",
    description: "General church newsletters and updates",
    icon: "mail",
  },
  {
    name: "Event",
    description: "Event announcements and invitations",
    icon: "calendar",
  },
  {
    name: "Pastoral Care",
    description: "Messages focused on pastoral care and encouragement",
    icon: "heart",
  },
  {
    name: "Members Care",
    description: "Messages directed at member support and follow-up",
    icon: "users",
  },

  {
    name: "Birthday",
    description: "Birthday wishes, celebrations, and special greetings",
    icon: "gift",
  },
];

export async function seedCategories() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: "ChurchDB",
    });

    for (const { name, description, icon } of categoryConfig) {
      await Category.findOneAndUpdate(
        { name }, // match by name
        { name, description, icon }, // replace/update fields
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`✅ Seeded/Updated category: ${name}`);
    }

    console.log("🎉 Categories seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding categories:", err);
    process.exit(1);
  }
}
