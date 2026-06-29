-- AlterTable
ALTER TABLE "ClassPass" ADD COLUMN "durationMonths" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ClassPass" ADD COLUMN "freezeDaysTotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ClassPass" ADD COLUMN "freezeDaysUsed" INTEGER NOT NULL DEFAULT 0;

-- Preserve sensible freeze limits for existing standard monthly passes.
UPDATE "ClassPass"
SET "freezeDaysTotal" = 3
WHERE "template" IN ('EIGHT', 'TWELVE', 'UNLIMITED_MONTH');

-- CreateTable
CREATE TABLE "ClassPassFreeze" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classPassId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassPassFreeze_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassPassFreeze_userId_startDate_endDate_idx" ON "ClassPassFreeze"("userId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "ClassPassFreeze_classPassId_startDate_endDate_idx" ON "ClassPassFreeze"("classPassId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "ClassPassFreeze" ADD CONSTRAINT "ClassPassFreeze_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassPassFreeze" ADD CONSTRAINT "ClassPassFreeze_classPassId_fkey" FOREIGN KEY ("classPassId") REFERENCES "ClassPass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
