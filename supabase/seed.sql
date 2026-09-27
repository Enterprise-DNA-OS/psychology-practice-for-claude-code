-- Fictional records only; stable IDs and conflict handling make this seed repeatable.
insert into practitioners(id,name,registration_due) values
 ('10000000-0000-0000-0000-000000000001','Dr Maya Chen',current_date+90),
 ('10000000-0000-0000-0000-000000000002','Aroha Wilson',current_date-3) on conflict do nothing;
insert into clients(id,name,email,country,consent_on,contact_ok) values
 ('20000000-0000-0000-0000-000000000001','Alex Morgan','alex@example.invalid','AU',current_date-90,true),
 ('20000000-0000-0000-0000-000000000002','Jamie Patel','jamie@example.invalid','AU',current_date-80,true),
 ('20000000-0000-0000-0000-000000000003','Riley King','riley@example.invalid','NZ',null,false),
 ('20000000-0000-0000-0000-000000000004','Alex Martin','martin@example.invalid','NZ',current_date-20,true) on conflict do nothing;
insert into referrals(id,client_id,name,funder,referrer,received_on,approved,initial_course,prior_used) values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','AM-COURSE-1','Better Access','Dr Lin, Harbour General Practice',current_date-60,6,true,4),
 ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','JP-COURSE-1','Better Access','Dr Lin, Harbour General Practice',current_date-60,6,true,5),
 ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','RK-EAP-1','EAP','Workplace Support',current_date-20,3,false,0) on conflict do nothing;
insert into annual_usage(client_id,year,external_individual,checked_on) values
 ('20000000-0000-0000-0000-000000000001',extract(year from current_date),4,current_date),
 ('20000000-0000-0000-0000-000000000002',extract(year from current_date),5,current_date) on conflict do nothing;
insert into sessions(id,client_id,practitioner_id,referral_id,starts_at,service_on,status,fee_cents,currency) values
 ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',current_date-7+time '10:00',current_date-7,'completed',22000,'AUD'),
 ('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',current_date+1+time '10:00',current_date+1,'booked',22000,'AUD'),
 ('40000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',current_date-3+time '11:00',current_date-3,'completed',22000,'AUD'),
 ('40000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000003',current_date-4+time '10:00',current_date-4,'dna',18000,'NZD') on conflict do nothing;
insert into notes(id,session_id,body,author) values('50000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Fictional demo: session summary awaiting clinician review.','Dr Maya Chen') on conflict do nothing;
insert into outcomes(id,client_id,instrument,score,measured_on,review_on,comment) values
 ('60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Practice goal rating',3,current_date-50,current_date-30,'Client-defined goal, no diagnostic meaning'),
 ('60000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Practice goal rating',6,current_date-20,current_date-6,'Clinician to interpret') on conflict do nothing;
insert into invoices(id,name,client_id,payer,amount_cents,currency,due_on) values
 ('70000000-0000-0000-0000-000000000001','INV-1001','20000000-0000-0000-0000-000000000001','Alex Morgan',22000,'AUD',current_date-21),
 ('70000000-0000-0000-0000-000000000002','INV-1002','20000000-0000-0000-0000-000000000003','Workplace Support',18000,'NZD',current_date-12) on conflict do nothing;
insert into payments(id,invoice_id,reference,amount_cents,paid_on) values('80000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','BANK-1001',7000,current_date-10) on conflict do nothing;
insert into waitlist(id,client_id,practitioner_id,requested_on,preference) values('90000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002',current_date-16,'Tuesday mornings') on conflict do nothing;
