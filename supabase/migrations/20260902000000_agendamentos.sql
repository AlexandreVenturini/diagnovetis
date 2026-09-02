create table if not exists agendamentos (
  id bigint primary key,
  dog_id integer references pets(id),
  dog_name text not null,
  dog_age text,
  dog_breed text,
  kind text not null,
  tutor_name text not null,
  date text not null,
  time text not null,
  service_type text not null,
  veterinarian text not null,
  notes text,
  status text not null default 'confirmed',
  cancellation_reason text,
  reminders jsonb not null default '[]'
);
