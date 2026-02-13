/*
  Warnings:

  - You are about to drop the column `riskLevel` on the `Investment` table. All the data in the column will be lost.
  - You are about to drop the column `riskLevel` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Investment" DROP COLUMN "riskLevel";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "riskLevel";
