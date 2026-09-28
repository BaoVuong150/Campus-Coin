-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "params" JSONB,
ADD COLUMN     "template" TEXT;

-- CreateTable
CREATE TABLE "point_events" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "point_events_user_id_created_at_idx" ON "point_events"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "point_events_user_id_dedupe_key_key" ON "point_events"("user_id", "dedupe_key");

-- AddForeignKey
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

