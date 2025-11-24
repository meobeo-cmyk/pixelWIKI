import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { registerAuthRoutes } from "./authRoutes";
import { insertWikiEntrySchema, updateWikiEntrySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Password auth routes
  await registerAuthRoutes(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.json(null);
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.json(null);
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsersWithCounts();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/profile/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Wiki entry routes
  app.get('/api/entries/approved', async (req, res) => {
    try {
      const entries = await storage.getApprovedEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching approved entries:", error);
      res.status(500).json({ message: "Failed to fetch entries" });
    }
  });

  app.post('/api/entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertWikiEntrySchema.parse({
        ...req.body,
        userId,
      });

      const entry = await storage.createEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      console.error("Error creating entry:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create entry" });
    }
  });

  app.get('/api/entries/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await storage.getEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error fetching entry:", error);
      res.status(500).json({ message: "Failed to fetch entry" });
    }
  });

  app.patch('/api/entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      // Check if entry exists and belongs to user
      const existingEntry = await storage.getEntry(id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      if (existingEntry.userId !== userId) {
        return res.status(403).json({ message: "Forbidden - You can only edit your own entries" });
      }

      // Explicitly remove status field if present to prevent status escalation
      const { status, ...bodyWithoutStatus } = req.body;
      const validatedData = updateWikiEntrySchema.parse(bodyWithoutStatus);
      
      // Force status back to pending on edit to require re-moderation
      const entry = await storage.updateEntry(id, validatedData);
      if (entry) {
        await storage.moderateEntry(id, "pending");
      }
      
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      res.json(entry);
    } catch (error: any) {
      console.error("Error updating entry:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update entry" });
    }
  });

  app.delete('/api/entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      // Check if entry exists and belongs to user
      const existingEntry = await storage.getEntry(id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      if (existingEntry.userId !== userId) {
        return res.status(403).json({ message: "Forbidden - You can only delete your own entries" });
      }

      await storage.deleteEntry(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting entry:", error);
      res.status(500).json({ message: "Failed to delete entry" });
    }
  });

  // Admin routes
  app.get('/api/admin/entries', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const entries = await storage.getAllEntriesWithUsers();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching entries for admin:", error);
      res.status(500).json({ message: "Failed to fetch entries" });
    }
  });

  app.patch('/api/admin/entries/:id/moderate', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["approved", "pending", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const entry = await storage.moderateEntry(id, status);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      res.json(entry);
    } catch (error) {
      console.error("Error moderating entry:", error);
      res.status(500).json({ message: "Failed to moderate entry" });
    }
  });

  app.delete('/api/admin/entries/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEntryAdmin(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting entry (admin):", error);
      res.status(500).json({ message: "Failed to delete entry" });
    }
  });

  // Developer panel routes (admin only)
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id/role', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!["user", "moderator", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUserRole(id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
