/*
  Warnings:

  - You are about to drop the column `originalImageUrl` on the `Generation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Generation" DROP COLUMN "originalImageUrl",
ADD COLUMN     "referenceImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
