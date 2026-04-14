-- CreateTable
CREATE TABLE `SentenceCategory` (
    `id` VARCHAR(191) NOT NULL,
    `sentenceId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `SentenceCategory_sentenceId_category_key`(`sentenceId`, `category`),
    INDEX `SentenceCategory_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SentenceCategory` ADD CONSTRAINT `SentenceCategory_sentenceId_fkey` FOREIGN KEY (`sentenceId`) REFERENCES `Sentence`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
