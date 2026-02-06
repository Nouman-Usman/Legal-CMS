
-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants UUID[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add conversation_id to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- 3. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = ANY(participants));

-- 5. Update RLS Policies for messages
-- Check if the policy exists and drop if it does to avoid error
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'View messages' AND tablename = 'messages') THEN
        DROP POLICY "View messages" ON public.messages;
    END IF;
END $$;

CREATE POLICY "View messages" ON public.messages FOR SELECT USING (
  sender_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND auth.uid() = ANY(c.participants)
  ) OR
  EXISTS (
    SELECT 1 FROM public.message_threads t
    JOIN public.cases cs ON cs.id = t.case_id
    WHERE t.id = messages.thread_id
      AND (
        cs.client_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.case_clients cc WHERE cc.case_id = cs.id AND cc.client_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.chamber_id = cs.chamber_id)
      )
  )
);

-- Also add policy for inserting messages into conversations
CREATE POLICY "Insert messages into conversations" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND (
    (conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id AND auth.uid() = ANY(c.participants)
    )) OR
    (thread_id IS NOT NULL) -- Thread inserts handled by existing policies or we can add more
  )
);
