-- CreateTable
CREATE TABLE `UserSettings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `missLockMs` INTEGER NOT NULL DEFAULT 1000,
    `penaltyResume` VARCHAR(191) NOT NULL DEFAULT 'current',

    UNIQUE INDEX `UserSettings_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserSettings` ADD CONSTRAINT `UserSettings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
