
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS data_retention_config jsonb NOT NULL DEFAULT '{
    "archive_after_months": 24,
    "delete_archived_months": null,
    "audit_retention_years": 3,
    "activity_log_days": 365,
    "notification_delete_days": 90
  }'::jsonb;
