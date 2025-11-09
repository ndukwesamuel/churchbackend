import mongoose from "mongoose";
import Group from "./group.model";
import { env } from "../../config/env.config";
export const groupConfig = [
  {
    name: "Men",
    description:
      "The Men’s Fellowship focuses on spiritual growth, leadership, and service among the men of the church.",
  },
  {
    name: "Women",
    description:
      "The Women’s Ministry provides fellowship, discipleship, and outreach opportunities for women.",
  },
  {
    name: "Youth",
    description:
      "The Youth Ministry empowers young people to grow in faith and leadership within the church and community.",
  },
  {
    name: "Sunday School",
    description:
      "The Sunday School department teaches and nurtures children in biblical knowledge and Christian values.",
  },
  {
    name: "Choir",
    description:
      "The Choir leads worship through music and song during services and special events.",
  },
  {
    name: "Ushering",
    description:
      "The Ushering group provides hospitality and order during church gatherings and services.",
  },
  {
    name: "Evangelism",
    description:
      "The Evangelism team is responsible for outreach, soul winning, and spreading the Gospel.",
  },
  {
    name: "Prayer Group",
    description:
      "A dedicated team interceding for the church, members, and community through prayer.",
  },
  {
    name: "Technical & Media",
    description:
      "Handles sound, video, livestreams, and other technical aspects of church services.",
  },
  {
    name: "Drama",
    description:
      "Uses drama and creative arts to communicate the message of Christ and inspire believers.",
  },
  {
    name: "Welfare",
    description:
      "Provides support and assistance to church members in need and coordinates benevolence activities.",
  },
  {
    name: "Protocol",
    description:
      "Ensures order and coordination during events, guest visits, and special church programs.",
  },
  {
    name: "Hospitality",
    description:
      "Manages refreshments, meals, and general hospitality during church functions.",
  },
  {
    name: "Bible Study",
    description:
      "Facilitates in-depth study and understanding of the Word through small group sessions.",
  },
  {
    name: "Teens",
    description:
      "The Teens Ministry focuses on nurturing faith, fellowship, and leadership among teenagers.",
  },
  {
    name: "Media & Communications",
    description:
      "Oversees announcements, publications, and online communications for the church.",
  },
];

export async function seedGroups() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: "ChurchDB",
    });

    for (const { name, description } of groupConfig) {
      await Group.findOneAndUpdate(
        { name },
        { name, description },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`✅ Seeded/Updated group: ${name}`);
    }

    console.log("🎉 Groups seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding groups:", err);
    process.exit(1);
  }
}
