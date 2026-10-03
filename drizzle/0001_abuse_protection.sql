ALTER TABLE "appointment_requests" ADD COLUMN "submission_id" uuid;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN "client_ip_hash" text;--> statement-breakpoint
CREATE INDEX "appointment_requests_ip_created_idx" ON "appointment_requests" USING btree ("client_ip_hash","created_at");--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_submission_id_unique" UNIQUE("submission_id");