-- CreateTable
CREATE TABLE "ScheduleCancellation" (
    "id" TEXT NOT NULL,
    "scheduleSlotId" TEXT NOT NULL,
    "cancellationDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleCancellation_scheduleSlotId_cancellationDate_key"
ON "ScheduleCancellation"("scheduleSlotId", "cancellationDate");

-- CreateIndex
CREATE INDEX "ScheduleCancellation_cancellationDate_idx"
ON "ScheduleCancellation"("cancellationDate");

-- AddForeignKey
ALTER TABLE "ScheduleCancellation"
ADD CONSTRAINT "ScheduleCancellation_scheduleSlotId_fkey"
FOREIGN KEY ("scheduleSlotId") REFERENCES "ScheduleSlot"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
