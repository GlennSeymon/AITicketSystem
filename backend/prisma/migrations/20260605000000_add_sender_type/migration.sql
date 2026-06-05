-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('CUSTOMER', 'AGENT');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "senderType" "SenderType";
