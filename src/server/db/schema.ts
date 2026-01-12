import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTableCreator,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => name);

export const user = createTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),

  // Cerfikator-specific info
  role: text("role").notNull().default("user"),
});

export const session = createTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = createTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const verification = createTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$defaultFn(
    () => new Date(),
  ),
});

export const categories = createTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    iconUrl: text("icon_url"),
    color: text("color").default("#3498DB"),
    order: integer("order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  // Indexing
  (table) => ({
    slugIdx: uniqueIndex("categories_slug_idx").on(table.slug),
    activeOrderIdx: index("categories_active_order_idx").on(
      table.isActive,
      table.order,
    ),
  }),
);

export const templates = createTable("templates", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    canvasData: jsonb("canvas_data").notNull(),
    placeholders: jsonb("placeholders").notNull().default([]),
    previewImageUrl: text("preview_image_url"),
    isPublic: boolean("is_public").notNull().default(false),
    isVerified: boolean("is_verified").notNull().default(false),
    downloads: integer("downloads").notNull().default(0),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  // Indexing
  (table) => ({
    userDeletedIdx: index("templates_user_deleted_idx").on(
      table.userId,
      table.deletedAt,
    ),
    categoryPublicIdx: index("templates_category_public_idx").on(
      table.categoryId,
      table.isPublic,
      table.deletedAt,
    ),
    verifiedIdx: index("templates_verified_idx").on(
      table.isVerified,
      table.isPublic,
      table.deletedAt,
    ),
  }),
);

export const certificates = createTable("certificates", {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id").references(() => templates.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientName: text("recipient_name").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    recipientData: jsonb("recipient_data").notNull(),
    certificateUrl: text("certificate_url").notNull(),
    validationToken: text("validation_token")
      .notNull()
      .unique(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  // Indexing
  (table) => ({
    validationTokenIdx: uniqueIndex("certificates_validation_token_idx").on(
      table.validationToken,
    ),
    userCreatedIdx: index("certificates_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    categoryCreatedIdx: index("certificates_category_created_idx").on(
      table.categoryId,
      table.createdAt,
    ),
    recipientEmailIdx: index("certificates_recipient_email_idx").on(
      table.recipientEmail,
      table.createdAt,
    ),
    sentAtIdx: index("certificates_sent_at_idx").on(table.sentAt),
  }),
);

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  templates: many(templates),
  certificates: many(certificates),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  templates: many(templates),
  certificates: many(certificates),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  user: one(user, { fields: [templates.userId], references: [user.id] }),
  category: one(categories, {
    fields: [templates.categoryId],
    references: [categories.id],
  }),
  certificates: many(certificates),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(user, { fields: [certificates.userId], references: [user.id] }),
  template: one(templates, {
    fields: [certificates.templateId],
    references: [templates.id],
  }),
  category: one(categories, {
    fields: [certificates.categoryId],
    references: [categories.id],
  }),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  categories,
  templates,
  certificates
};
