ALTER TABLE "events" ADD COLUMN "schedule" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "checklist" jsonb;--> statement-breakpoint
CREATE INDEX "idx_events_feed" ON "events" USING btree ("is_published","status","start_date");--> statement-breakpoint
CREATE INDEX "idx_products_catalog" ON "products" USING btree ("is_available","category","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_orders_user_created" ON "orders" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_reviews_product_visible" ON "product_reviews" USING btree ("product_id","is_hidden","created_at" DESC NULLS LAST);