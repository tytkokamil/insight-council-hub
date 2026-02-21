
-- Add 'backlog' and 'blocked' to task_status enum
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'backlog' BEFORE 'open';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'blocked' AFTER 'in_progress';
