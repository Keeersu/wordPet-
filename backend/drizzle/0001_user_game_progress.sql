-- User Game Progress table
-- Stores full gameState as JSONB per user for cloud sync

CREATE TABLE IF NOT EXISTS "user_game_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL UNIQUE,
  "game_state" jsonb NOT NULL,
  "version" text NOT NULL DEFAULT '1.3',
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "user_game_progress_user_id_idx" ON "user_game_progress" USING btree ("user_id");
