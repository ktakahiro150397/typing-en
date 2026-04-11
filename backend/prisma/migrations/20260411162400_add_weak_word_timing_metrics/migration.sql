-- AlterTable
ALTER TABLE `SessionWord`
    ADD COLUMN `activeDurationMs` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `stallCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `stallDurationMs` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `WeakWord`
    ADD COLUMN `activeDurationMs` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `msPerChar` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `stallCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `stallDurationMs` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `weaknessScore` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `primaryReason` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `WeakWord_userId_weaknessScore_idx` ON `WeakWord`(`userId`, `weaknessScore`);
