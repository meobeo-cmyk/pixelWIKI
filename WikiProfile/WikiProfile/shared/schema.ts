import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with Replit Auth integration
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username"), // Optional - for password-based auth
  password: varchar("password"), // hashed password for local auth (optional)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  role: varchar("role", { length: 50 }).default("user").notNull(), // user, moderator, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wiki entries table
export const wikiEntries = pgTable("wiki_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // approved, pending, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wiki_entries_user_id").on(table.userId),
  index("idx_wiki_entries_status").on(table.status),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  wikiEntries: many(wikiEntries),
}));

export const wikiEntriesRelations = relations(wikiEntries, ({ one }) => ({
  user: one(users, {
    fields: [wikiEntries.userId],
    references: [users.id],
  }),
}));

// User schemas
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Wiki entry schemas
export const insertWikiEntrySchema = createInsertSchema(wikiEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWikiEntrySchema = createInsertSchema(wikiEntries)
  .omit({
    id: true,
    userId: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial()
  .strict(); // Reject any extra fields including status

export type InsertWikiEntry = z.infer<typeof insertWikiEntrySchema>;
export type UpdateWikiEntry = z.infer<typeof updateWikiEntrySchema>;
export type WikiEntry = typeof wikiEntries.$inferSelect;

// User with entries for profile view
export type UserWithEntries = User & {
  wikiEntries: WikiEntry[];
};
