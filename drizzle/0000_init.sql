CREATE TYPE "public"."dog_size" AS ENUM('small', 'medium', 'large', 'xlarge');--> statement-breakpoint
CREATE TYPE "public"."service" AS ENUM('full_groom', 'bath_brush', 'deshed', 'nail_trim');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('new', 'confirmed', 'completed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."time_window" AS ENUM('morning', 'afternoon', 'evening');--> statement-breakpoint
CREATE TABLE "appointment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "request_status" DEFAULT 'new' NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address" text NOT NULL,
	"dog_name" text NOT NULL,
	"breed" text,
	"dog_size" "dog_size" NOT NULL,
	"service" "service" NOT NULL,
	"preferred_date" date NOT NULL,
	"time_window" time_window NOT NULL,
	"customer_notes" text,
	"confirmed_date" date,
	"confirmed_time" time,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "appointment_requests_status_created_idx" ON "appointment_requests" USING btree ("status","created_at");