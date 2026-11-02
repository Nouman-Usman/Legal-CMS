-- Most of a chamber's clients never have an app account: keep the client's
-- name and (WhatsApp) phone on the case. cases.client_id stays as an optional
-- link to a client user who joins the portal.
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS client_phone text;
