import {
  users,
  wikiEntries,
  type User,
  type UpsertUser,
  type WikiEntry,
  type InsertWikiEntry,
  type UpdateWikiEntry,
  type UserWithEntries,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User profile with entries
  getUserProfile(userId: string): Promise<UserWithEntries | undefined>;
  
  // Get all users with entry counts
  getAllUsersWithCounts(): Promise<(User & { entryCount: number })[]>;
  
  // Wiki entry operations
  createEntry(entry: InsertWikiEntry): Promise<WikiEntry>;
  getEntry(id: string): Promise<WikiEntry | undefined>;
  getUserEntries(userId: string): Promise<WikiEntry[]>;
  updateEntry(id: string, entry: UpdateWikiEntry): Promise<WikiEntry | undefined>;
  deleteEntry(id: string): Promise<void>;
  getApprovedEntries(): Promise<(WikiEntry & { user: User })[]>;
  
  // Admin operations
  getAllEntriesWithUsers(): Promise<(WikiEntry & { user: User })[]>;
  moderateEntry(id: string, status: string): Promise<WikiEntry | undefined>;
  deleteEntryAdmin(id: string): Promise<void>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          // Preserve or update isAdmin flag
          isAdmin: userData.isAdmin !== undefined ? userData.isAdmin : users.isAdmin,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserProfile(userId: string): Promise<UserWithEntries | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const entries = await db
      .select()
      .from(wikiEntries)
      .where(eq(wikiEntries.userId, userId))
      .orderBy(desc(wikiEntries.createdAt));

    return {
      ...user,
      wikiEntries: entries,
    };
  }

  async getAllUsersWithCounts(): Promise<(User & { entryCount: number })[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        isAdmin: users.isAdmin,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        entryCount: sql<number>`cast(count(${wikiEntries.id}) as int)`,
      })
      .from(users)
      .leftJoin(wikiEntries, eq(users.id, wikiEntries.userId))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));

    return result as any;
  }

  // Wiki entry operations
  async createEntry(entryData: InsertWikiEntry): Promise<WikiEntry> {
    const [entry] = await db
      .insert(wikiEntries)
      .values(entryData)
      .returning();
    return entry;
  }

  async getApprovedEntries(): Promise<(WikiEntry & { user: User })[]> {
    const result = await db
      .select()
      .from(wikiEntries)
      .innerJoin(users, eq(wikiEntries.userId, users.id))
      .where(eq(wikiEntries.status, "approved"))
      .orderBy(desc(wikiEntries.createdAt));

    return result.map((row) => ({
      ...row.wiki_entries,
      user: row.users,
    }));
  }

  async getEntry(id: string): Promise<WikiEntry | undefined> {
    const [entry] = await db
      .select()
      .from(wikiEntries)
      .where(eq(wikiEntries.id, id));
    return entry;
  }

  async getUserEntries(userId: string): Promise<WikiEntry[]> {
    return await db
      .select()
      .from(wikiEntries)
      .where(eq(wikiEntries.userId, userId))
      .orderBy(desc(wikiEntries.createdAt));
  }

  async updateEntry(id: string, entryData: UpdateWikiEntry): Promise<WikiEntry | undefined> {
    const [entry] = await db
      .update(wikiEntries)
      .set({
        ...entryData,
        updatedAt: new Date(),
      })
      .where(eq(wikiEntries.id, id))
      .returning();
    return entry;
  }

  async deleteEntry(id: string): Promise<void> {
    await db.delete(wikiEntries).where(eq(wikiEntries.id, id));
  }

  // Admin operations
  async getAllEntriesWithUsers(): Promise<(WikiEntry & { user: User })[]> {
    const result = await db
      .select()
      .from(wikiEntries)
      .innerJoin(users, eq(wikiEntries.userId, users.id))
      .orderBy(desc(wikiEntries.createdAt));

    return result.map((row) => ({
      ...row.wiki_entries,
      user: row.users,
    }));
  }

  async moderateEntry(id: string, status: string): Promise<WikiEntry | undefined> {
    const [entry] = await db
      .update(wikiEntries)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(wikiEntries.id, id))
      .returning();
    return entry;
  }

  async deleteEntryAdmin(id: string): Promise<void> {
    await db.delete(wikiEntries).where(eq(wikiEntries.id, id));
  }

  // User role management
  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
}

export const storage = new DatabaseStorage();
