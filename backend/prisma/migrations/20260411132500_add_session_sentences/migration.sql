-- DropForeignKey
ALTER TABLE `Session` DROP FOREIGN KEY `Session_sentenceId_fkey`;

-- AlterTable
ALTER TABLE `Session` DROP COLUMN `sentenceId`;

-- CreateTable
CREATE TABLE `SessionSentence` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `sentenceId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,

    UNIQUE INDEX `SessionSentence_sessionId_position_key`(`sessionId`, `position`),
    INDEX `SessionSentence_sentenceId_idx`(`sentenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SessionSentence` ADD CONSTRAINT `SessionSentence_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionSentence` ADD CONSTRAINT `SessionSentence_sentenceId_fkey` FOREIGN KEY (`sentenceId`) REFERENCES `Sentence`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
