-- Create storage bucket for note images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-images',
  'note-images',
  true,
  10485760, -- 10 MB per file
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

-- RLS policies for note-images bucket

-- Users can upload their own images (path must start with their user_id)
create policy "Users can upload their own note images"
  on storage.objects for insert
  with check (
    bucket_id = 'note-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone authenticated can view images (needed for cross-device access)
create policy "Authenticated users can view note images"
  on storage.objects for select
  using (
    bucket_id = 'note-images'
    and auth.role() = 'authenticated'
  );

-- Users can delete their own images
create policy "Users can delete their own note images"
  on storage.objects for delete
  using (
    bucket_id = 'note-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
