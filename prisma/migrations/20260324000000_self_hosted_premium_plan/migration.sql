-- Update default plan for new teams to datarooms-premium
ALTER TABLE "Team" ALTER COLUMN "plan" SET DEFAULT 'datarooms-premium';

-- Upgrade all existing teams to datarooms-premium
UPDATE "Team" SET "plan" = 'datarooms-premium' WHERE "plan" = 'free';
