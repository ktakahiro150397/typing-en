CREATE TEMPORARY TABLE `SentenceCanonical` AS
SELECT MIN(`id`) AS `canonicalId`, `text`
FROM `Sentence`
GROUP BY `text`;

INSERT INTO `SentenceCategory` (`id`, `sentenceId`, `category`)
SELECT
    REPLACE(UUID(), '-', ''),
    canonical.`canonicalId`,
    category.`category`
FROM `SentenceCategory` category
INNER JOIN `Sentence` sentence ON sentence.`id` = category.`sentenceId`
INNER JOIN `SentenceCanonical` canonical ON canonical.`text` = sentence.`text`
LEFT JOIN `SentenceCategory` existing
    ON existing.`sentenceId` = canonical.`canonicalId`
   AND existing.`category` = category.`category`
WHERE existing.`id` IS NULL;

UPDATE `SessionSentence` sessionSentence
INNER JOIN `Sentence` sentence ON sentence.`id` = sessionSentence.`sentenceId`
INNER JOIN `SentenceCanonical` canonical ON canonical.`text` = sentence.`text`
SET sessionSentence.`sentenceId` = canonical.`canonicalId`
WHERE sessionSentence.`sentenceId` <> canonical.`canonicalId`;

DELETE sentence
FROM `Sentence` sentence
INNER JOIN `SentenceCanonical` canonical ON canonical.`text` = sentence.`text`
WHERE sentence.`id` <> canonical.`canonicalId`;

ALTER TABLE `Sentence` DROP FOREIGN KEY `Sentence_userId_fkey`;

ALTER TABLE `Sentence`
    CHANGE COLUMN `userId` `createdByUserId` VARCHAR(191) NULL;

DROP INDEX `Sentence_userId_text_key` ON `Sentence`;

CREATE INDEX `Sentence_createdByUserId_idx` ON `Sentence`(`createdByUserId`);
CREATE UNIQUE INDEX `Sentence_text_key` ON `Sentence`(`text`(500));

ALTER TABLE `Sentence`
    ADD CONSTRAINT `Sentence_createdByUserId_fkey`
    FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

DROP TEMPORARY TABLE `SentenceCanonical`;
