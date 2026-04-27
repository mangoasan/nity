-- CreateEnum
CREATE TYPE "ClassPassTemplate" AS ENUM ('TRIAL', 'EIGHT', 'TWELVE', 'UNLIMITED_MONTH');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "classPassId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "ClassPass" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "template" "ClassPassTemplate" NOT NULL,
    "totalClasses" INTEGER,
    "remainingClasses" INTEGER,
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassPass_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_classPassId_fkey" FOREIGN KEY ("classPassId") REFERENCES "ClassPass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassPass" ADD CONSTRAINT "ClassPass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
