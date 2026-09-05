-- ============================================================================
-- Demo seed data — one salon ("Studio Nude") with the services, weekly
-- availability described in the project brief. Safe to run multiple times
-- locally (uses a fixed tenant id + delete-then-insert).
-- ============================================================================

insert into tenants (id, slug, name, description, phone, primary_color, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  'studio-nude',
  'Studio Nude',
  'Manicure e pedicure com hora marcada e conforto de verdade.',
  '5511999999999',
  '#D9A5B3',
  true
)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  phone = excluded.phone,
  primary_color = excluded.primary_color,
  is_active = excluded.is_active;

delete from services where tenant_id = '00000000-0000-0000-0000-000000000001';

insert into services
  (tenant_id, category, name, description, price_cents, duration_minutes, deposit_percentage, display_order)
values
  ('00000000-0000-0000-0000-000000000001', 'maos', 'Manicure Simples', 'Cutilagem, lixamento e esmaltação tradicional.', 4500, 40, 50, 1),
  ('00000000-0000-0000-0000-000000000001', 'maos', 'Esmaltação em Gel', 'Esmaltação em gel com maior durabilidade e brilho.', 7000, 60, 50, 2),
  ('00000000-0000-0000-0000-000000000001', 'maos', 'Blindagem', 'Fortalecimento e proteção da unha natural.', 8500, 70, 50, 3),
  ('00000000-0000-0000-0000-000000000001', 'maos', 'Alongamento', 'Alongamento de unhas em gel ou fibra.', 12000, 120, 50, 4),
  ('00000000-0000-0000-0000-000000000001', 'maos', 'Manutenção de Alongamento', 'Manutenção do alongamento já existente.', 9000, 90, 50, 5),
  ('00000000-0000-0000-0000-000000000001', 'pes', 'Pedicure Simples', 'Cutilagem, lixamento e esmaltação tradicional dos pés.', 5000, 45, 50, 6),
  ('00000000-0000-0000-0000-000000000001', 'pes', 'Spa dos Pés', 'Esfoliação, hidratação profunda e massagem relaxante.', 9000, 75, 50, 7),
  ('00000000-0000-0000-0000-000000000001', 'pes', 'Pedicure Gel', 'Pedicure com esmaltação em gel de longa duração.', 7500, 60, 50, 8),
  ('00000000-0000-0000-0000-000000000001', 'combo', 'Mão + Pé', 'Manicure simples + pedicure simples.', 9000, 80, 50, 9),
  ('00000000-0000-0000-0000-000000000001', 'combo', 'Mão + Pé + Spa', 'Manicure simples + spa dos pés completo.', 13500, 130, 50, 10);

delete from availability where tenant_id = '00000000-0000-0000-0000-000000000001';

-- Terça a sábado, 09:00–18:00 (segunda e domingo fechado)
insert into availability (tenant_id, day_of_week, start_time, end_time)
values
  ('00000000-0000-0000-0000-000000000001', 2, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000001', 3, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000001', 4, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000001', 5, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000001', 6, '09:00', '16:00');
