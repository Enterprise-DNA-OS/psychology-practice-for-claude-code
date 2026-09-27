-- Psychology administration records. No extension required on PostgreSQL 14+ or PGlite.
create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table practitioners (id uuid primary key default gen_random_uuid(), name text not null, registration_due date, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on practitioners for each row execute function touch_updated_at();
create table clients (id uuid primary key default gen_random_uuid(), external_id text unique, name text not null, email text, dob date, country text not null default 'AU' check(country in ('AU','NZ')), consent_on date, contact_ok boolean not null default false, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on clients for each row execute function touch_updated_at();
create table referrals (id uuid primary key default gen_random_uuid(), client_id uuid not null references clients, name text not null unique, funder text not null check(funder in ('Better Access','ACC','EAP','Private')), referrer text not null, received_on date not null, approved integer not null check(approved>0), initial_course boolean not null default false, prior_used integer not null default 0 check(prior_used>=0), valid_until date, report_sent_on date, closed boolean not null default false, check(funder<>'Better Access' or not initial_course or approved<=6), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on referrals for each row execute function touch_updated_at();
create table annual_usage (id uuid primary key default gen_random_uuid(), client_id uuid not null references clients, year integer not null check(year between 2000 and 2200), external_individual integer not null default 0 check(external_individual between 0 and 10), checked_on date not null, unique(client_id,year), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on annual_usage for each row execute function touch_updated_at();
create table sessions (id uuid primary key default gen_random_uuid(), external_id text unique, client_id uuid not null references clients, practitioner_id uuid not null references practitioners, referral_id uuid references referrals, starts_at timestamptz not null, service_on date not null, minutes integer not null default 50 check(minutes between 5 and 240), status text not null default 'booked' check(status in ('booked','completed','cancelled','dna')), fee_cents integer not null default 0 check(fee_cents>=0), currency text not null default 'AUD' check(currency in ('AUD','NZD')), funded boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on sessions for each row execute function touch_updated_at();
create table notes (id uuid primary key default gen_random_uuid(), session_id uuid not null unique references sessions, body text not null, author text not null, finalised_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on notes for each row execute function touch_updated_at();
create table addenda (id uuid primary key default gen_random_uuid(), note_id uuid not null references notes, body text not null, author text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on addenda for each row execute function touch_updated_at();
create table outcomes (id uuid primary key default gen_random_uuid(), client_id uuid not null references clients, instrument text not null, score numeric not null, measured_on date not null, review_on date not null, comment text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on outcomes for each row execute function touch_updated_at();
create table invoices (id uuid primary key default gen_random_uuid(), name text not null unique, client_id uuid not null references clients, session_id uuid unique references sessions, payer text not null, amount_cents integer not null check(amount_cents>0), currency text not null check(currency in ('AUD','NZD')), due_on date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on invoices for each row execute function touch_updated_at();
create table payments (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references invoices, reference text not null unique, amount_cents integer not null check(amount_cents>0), paid_on date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on payments for each row execute function touch_updated_at();
create table waitlist (id uuid primary key default gen_random_uuid(), client_id uuid not null references clients, practitioner_id uuid references practitioners, requested_on date not null default current_date, preference text not null, closed boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on waitlist for each row execute function touch_updated_at();
create table activity (id uuid primary key default gen_random_uuid(), client_id uuid not null references clients, body text not null, author text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on activity for each row execute function touch_updated_at();
create table import_rows (id uuid primary key default gen_random_uuid(), source_file text not null, fingerprint text not null unique, payload jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on import_rows for each row execute function touch_updated_at();
create table security_checks (id uuid primary key default gen_random_uuid(), name text not null unique, checked_on date not null, evidence text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on security_checks for each row execute function touch_updated_at();

create index session_client_date on sessions(client_id,starts_at);
create index session_practitioner_date on sessions(practitioner_id,starts_at);
create function protect_final_note() returns trigger language plpgsql as $$
begin
 if old.finalised_at is not null then raise exception 'Finalised note is immutable; write an addendum'; end if;
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
create trigger locked_note before update or delete on notes for each row execute function protect_final_note();
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Append-only record'; end $$;
create trigger locked_addendum before update or delete on addenda for each row execute function immutable_record();
create trigger locked_activity before update or delete on activity for each row execute function immutable_record();
create trigger locked_payment before update or delete on payments for each row execute function immutable_record();
create view v_diary as
 select s.id,c.name client,p.name practitioner,s.starts_at,s.minutes,s.status,r.name referral,r.funder,s.funded,s.fee_cents,s.currency
 from sessions s join clients c on c.id=s.client_id join practitioners p on p.id=s.practitioner_id left join referrals r on r.id=s.referral_id;
create view v_referrals as
 select r.id,r.name,c.name client,r.funder,r.referrer,r.approved,r.prior_used,
 (select count(*) from sessions s where s.referral_id=r.id and s.funded and s.status='completed')::integer completed,
 (select count(*) from sessions s where s.referral_id=r.id and s.funded and s.status='booked')::integer booked,
 r.approved-r.prior_used-(select count(*) from sessions s where s.referral_id=r.id and s.funded and s.status in ('completed','booked'))::integer remaining,
 r.received_on,r.valid_until,r.report_sent_on,r.closed
 from referrals r join clients c on c.id=r.client_id;
create view v_debtors as
 select i.id,i.name,c.name client,i.payer,i.currency,i.amount_cents,
 coalesce((select sum(p.amount_cents) from payments p where p.invoice_id=i.id),0)::integer paid_cents,
 i.amount_cents-coalesce((select sum(p.amount_cents) from payments p where p.invoice_id=i.id),0)::integer balance_cents,
 i.due_on,greatest(0,current_date-i.due_on) days_overdue
 from invoices i join clients c on c.id=i.client_id;
create view v_notes_due as
 select s.id,c.name client,p.name practitioner,s.starts_at,case when n.id is null then 'missing' else 'draft' end note_status
 from sessions s join clients c on c.id=s.client_id join practitioners p on p.id=s.practitioner_id left join notes n on n.session_id=s.id
 where s.status='completed' and n.finalised_at is null;
create view v_outcomes as
 select o.id,c.name client,o.instrument,o.score,o.measured_on,o.review_on,
 o.score-first_value(o.score) over(partition by o.client_id,o.instrument order by o.measured_on,o.created_at,o.id) change_from_first,
 row_number() over(partition by o.client_id,o.instrument order by o.measured_on desc,o.created_at desc,o.id desc) latest
 from outcomes o join clients c on c.id=o.client_id;
create view v_reports_due as
 select * from v_referrals where funder='Better Access' and report_sent_on is null and (closed or prior_used+completed>=approved);
create view v_attention as
 select 'notes' kind,client,'Session note '||note_status detail from v_notes_due
 union all select 'referral',client,name||': '||remaining||' funded slots remain' from v_referrals where not closed and remaining<=1
 union all select 'report',client,name||': referrer report outstanding' from v_reports_due
 union all select 'debt',client,name||': '||currency||' '||balance_cents||' cents, '||days_overdue||' days overdue' from v_debtors where balance_cents>0 and days_overdue>0
 union all select 'outcome',client,instrument||': review due '||review_on from v_outcomes where latest=1 and review_on<current_date
 union all select 'consent',name,'No consent date recorded' from clients where active and consent_on is null;
