-- Who sent the client their post-hearing update, and when (click-to-send WhatsApp).
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS client_notified_at timestamptz;
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS client_notified_by uuid REFERENCES public.users(id);
