#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv, pick } from './lib/csv.mjs';
import { table } from './lib/format.mjs';

export const reads={
 clients:'select id,name,email,country,consent_on,contact_ok from clients order by name',
 team:'select * from practitioners order by name',
 diary:"select * from v_diary order by starts_at",
 'day-sheet':"select * from v_diary where starts_at::date=current_date order by starts_at",
 attention:'select * from v_attention order by kind,client',
 referrals:'select * from v_referrals order by name',
 'referrals-due':'select name,client,funder,approved,prior_used,completed,booked,remaining from v_referrals where not closed and (remaining<=1 or valid_until<current_date+14) order by remaining,name',
 'reports-due':'select name,client,referrer,completed,approved from v_reports_due order by name',
 'notes-due':'select * from v_notes_due order by starts_at',
 outcomes:'select client,instrument,score,measured_on,review_on,change_from_first from v_outcomes where latest=1 order by review_on',
 invoices:'select * from v_debtors order by due_on',
 debtors:'select name,client,payer,currency,balance_cents,days_overdue from v_debtors where balance_cents>0 order by days_overdue desc',
 waitlist:'select w.id,c.name client,p.name practitioner,w.requested_on,w.preference from waitlist w join clients c on c.id=w.client_id left join practitioners p on p.id=w.practitioner_id where not w.closed order by requested_on',
 'no-shows':"select c.name client,count(*) missed,max(s.starts_at) last_missed from sessions s join clients c on c.id=s.client_id where s.status='dna' group by c.name order by missed desc",
 rebooking:"select c.name client,max(s.starts_at) last_visit from clients c join sessions s on s.client_id=c.id and s.status='completed' where c.active and not exists(select 1 from sessions b where b.client_id=c.id and b.status='booked' and b.starts_at>now()) group by c.id,c.name order by last_visit",
 takings:"select i.currency,i.payer,sum(i.amount_cents)::integer billed_cents,sum(i.paid_cents)::integer paid_cents,sum(i.balance_cents)::integer outstanding_cents from v_debtors i group by i.currency,i.payer order by i.currency,i.payer",
 referrers:'select referrer,count(*) courses,sum(completed)::integer recorded_sessions,sum(case when report_sent_on is null and (closed or completed+prior_used>=approved) then 1 else 0 end)::integer reports_outstanding from v_referrals group by referrer order by referrer',
 'annual-allowance':`select c.name client,u.year,u.external_individual,u.checked_on,(select count(*) from sessions s join referrals r on r.id=s.referral_id where s.client_id=c.id and s.funded and r.funder='Better Access' and s.status in ('completed','booked') and extract(year from s.service_on)=u.year)::integer local_reserved,10-u.external_individual-(select count(*) from sessions s join referrals r on r.id=s.referral_id where s.client_id=c.id and s.funded and r.funder='Better Access' and s.status in ('completed','booked') and extract(year from s.service_on)=u.year)::integer remaining from annual_usage u join clients c on c.id=u.client_id order by c.name,u.year`,
 'archive':'select source_file,count(*) rows from import_rows group by source_file order by source_file',
 compliance:`select 'CONSENT' rule,name record,'No consent date recorded' finding from clients where active and consent_on is null
 union all select 'NOTE',client,'Completed session without finalised note' from v_notes_due
 union all select 'COURSE',name,'Recorded and reserved sessions exceed approval' from v_referrals where remaining<0
 union all select 'REPORT',name,'Course ended; no report date recorded' from v_reports_due
 union all select 'REGISTRATION',name,'Registration review overdue' from practitioners where active and registration_due<current_date
 union all select 'SECURITY',x.name,'No review evidence in last 90 days (practice policy)' from (values ('access review'),('backup restore'),('device encryption'),('agent data agreement')) x(name) where not exists(select 1 from security_checks s where s.name=x.name and checked_on>=current_date-90)
 union all select 'ANNUAL',c.name,'Missing external-use check for current year' from clients c where exists(select 1 from referrals r where r.client_id=c.id and r.funder='Better Access' and not r.closed) and not exists(select 1 from annual_usage u where u.client_id=c.id and u.year=extract(year from current_date))`
};
export const entities=['practitioners','clients','referrals','annual_usage','sessions','notes','addenda','outcomes','invoices','payments','waitlist','activity','import_rows','security_checks'];
function required(o,k){if(o[k]===undefined||o[k]==='')throw Error(`Required --${k}=...`);return o[k];}
function int(v,label,min=0,max=100000000){if(!/^\d+$/.test(String(v))||Number(v)<min||Number(v)>max)throw Error(`Invalid ${label}`);return Number(v);}
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Use a real date YYYY-MM-DD');return v;}
function timestamp(v){if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d+)?)?(Z|[+-]\d\d:\d\d)$/.test(v)||!Number.isFinite(Date.parse(v)))throw Error('Timestamp requires ISO date/time and explicit offset, e.g. 2026-10-01T09:00:00+10:00');return v;}
function bool(v){if(!['true','false'].includes(String(v)))throw Error('Use true or false');return String(v)==='true';}
export async function resolve(db,entity,term){
 const labels={clients:'name',practitioners:'name',referrals:'name',invoices:'name',sessions:'external_id',notes:'author'};
 if(!labels[entity]||!term)throw Error(`Supply a ${entity} name or ID`);
 const col=labels[entity];
 let rows=await db.query(`select id,${col} label from ${entity} where id::text=$1 or lower(${col})=lower($1)`,[term]);
 if(!rows.length)rows=await db.query(`select id,${col} label from ${entity} where starts_with(id::text,$1) or strpos(lower(coalesce(${col},'')),lower($1))>0 order by ${col}`,[term]);
 if(rows.length!==1)throw Error(`${rows.length?'Ambiguous':'No matching'} ${entity}: ${term}\n${rows.map(r=>`${r.id}  ${r.label||''}`).join('\n')}`);
 return rows[0].id;
}
async function transaction(db,fn){await db.exec('BEGIN');try{const r=await fn();await db.exec('COMMIT');return r;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function insert(db,t,values){const keys=Object.keys(values);return db.query(`insert into ${t}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(values));}
async function fundingGate(db,client,referral,starts,exclude=null){
 if(!referral)throw Error('Funded session requires --referral');
 const [r]=await db.query('select * from referrals where id=$1 for update',[referral]);
 if(!r||r.client_id!==client||r.closed)throw Error('Referral must be open and belong to this client');
 if(r.valid_until&&starts.slice(0,10)>r.valid_until)throw Error('Funding approval expired');
 if(starts.slice(0,10)<r.received_on)throw Error('Session predates referral');
 const [{n}]=await db.query("select count(*)::integer n from sessions where referral_id=$1 and funded and status in ('booked','completed') and ($2::uuid is null or id<>$2)",[referral,exclude]);
 if(n+r.prior_used>=r.approved)throw Error('Referral course has no funded sessions left');
 if(r.funder==='Better Access'){
  // Preserve the local service date, including appointments near New Year.
  const year=Number(starts.slice(0,4));
  const [u]=await db.query('select * from annual_usage where client_id=$1 and year=$2 for update',[client,year]);
  if(!u)throw Error('Record checked external annual usage before reserving Better Access sessions');
  const [{n:used}]=await db.query("select count(*)::integer n from sessions s join referrals r on r.id=s.referral_id where s.client_id=$1 and r.funder='Better Access' and s.funded and s.status in ('booked','completed') and extract(year from s.service_on)=$2 and ($3::uuid is null or s.id<>$3)",[client,year,exclude]);
  if(u.external_individual+used>=10)throw Error('Individual Better Access annual allowance exhausted; review funding, do not deny care');
 }
}
async function importZanda(db,o){
 const dir=path.resolve(required(o,'dir'));
 const files=fs.readdirSync(dir).filter(f=>f.toLowerCase().endsWith('.csv')).sort((a,b)=>{const rank=f=>/^clients\.csv$/i.test(f)?0:/appointment/i.test(f)?1:/invoice/i.test(f)?2:/payment/i.test(f)?3:4;return rank(a)-rank(b)||a.localeCompare(b);});
 if(!files.length)throw Error('No CSV files; extract Data Export.zip first');
 const mapping=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{};
 return transaction(db,async()=>{
  await db.exec('LOCK TABLE sessions, invoices, payments IN SHARE ROW EXCLUSIVE MODE');
  const report=[];
  for(const file of files){
   const rows=parseCsv(fs.readFileSync(path.join(dir,file),'utf8'));let imported=0,archived=0,operational=0;
   for(let i=0;i<rows.length;i++){
    const raw=rows[i];
    const fingerprint=createHash('sha256').update(file+'\n'+JSON.stringify(raw)).digest('hex');
    archived+=(await db.query('insert into import_rows(source_file,fingerprint,payload) values($1,$2,$3) on conflict(fingerprint) do nothing returning id',[file,fingerprint,JSON.stringify(raw)])).length;
    if(/^clients\.csv$/i.test(file)){
     const value=(key,...aliases)=>pick(raw,...(mapping[key]?[mapping[key]]:aliases));
     const ext=value('id','ClientID','Client ID','ClientId','Client Number','ClientNumber','ID');
     const name=value('name','Name','Client Name','FullName')||[value('first','FirstName','First Name'),value('last','LastName','Last Name','Surname')].filter(Boolean).join(' ');
     if(!ext||!name)throw Error(`${file} row ${i+2}: client ID and name required; use --map=columns.json`);
     const country=required(o,'country');if(!['AU','NZ'].includes(country))throw Error('--country must be AU or NZ');
     const dob=value('dob','DateOfBirth','Date of Birth','DOB');if(dob)date(dob);
     imported+=(await db.query('insert into clients(external_id,name,email,dob,country) values($1,$2,$3,$4,$5) on conflict(external_id) do nothing returning id',[`zanda:${ext}`,name,value('email','Email','EmailAddress'),dob||null,country])).length;
    }
    const spec=mapping.files?.[file];
    if(spec){
     const v=k=>{const col=spec.columns?.[k];return col?pick(raw,col):spec.defaults?.[k];};
     const req=k=>{const val=v(k);if(val===undefined||val==='')throw Error(`${file} row ${i+2}: mapped ${k} required`);return val;};
     const client=async()=>{const [c]=await db.query('select id from clients where external_id=$1',[`zanda:${req('client_id')}`]);if(!c)throw Error(`${file} row ${i+2}: unknown client`);return c.id;};
     if(spec.entity==='sessions'){
      const ext=`zanda:${req('id')}`;
      if(!(await db.query('select id from sessions where external_id=$1',[ext])).length){
       const status=spec.statuses?.[req('status')];if(!['booked','completed','cancelled','dna'].includes(status))throw Error(`${file} row ${i+2}: explicitly map appointment status`);
       let at=req('at');if(!/(Z|[+-]\d\d:\d\d)$/.test(at)&&o['utc-offset'])at=at.replace(' ','T')+o['utc-offset'];timestamp(at);
       const practitioner=spec.practitioners?.[req('practitioner')];if(!practitioner)throw Error(`${file} row ${i+2}: practitioner mapping required`);
       const pid=await resolve(db,'practitioners',practitioner),cid=await client();
       const minutes=int(req('minutes'),'minutes',5,240);
       if(['booked','completed'].includes(status)){
        const conflict=await db.query("select id from sessions where status in ('booked','completed') and (practitioner_id=$1 or client_id=$2) and starts_at<$3::timestamptz+($4::integer*interval '1 minute') and starts_at+minutes*interval '1 minute'>$3::timestamptz",[pid,cid,at,minutes]);
        if(conflict.length)throw Error(`${file} row ${i+2}: appointment overlaps existing record`);
       }
       await insert(db,'sessions',{external_id:ext,client_id:cid,practitioner_id:pid,starts_at:at,service_on:at.slice(0,10),minutes,status,fee_cents:int(req('fee_cents'),'fee_cents'),currency:req('currency'),funded:false});operational++;
      }
     }else if(spec.entity==='invoices'){
      const name=`zanda:${req('id')}`;
      if(!(await db.query('select id from invoices where name=$1',[name])).length){await insert(db,'invoices',{name,client_id:await client(),payer:req('payer'),amount_cents:int(req('amount_cents'),'amount_cents',1),currency:req('currency'),due_on:date(req('due'))});operational++;}
     }else if(spec.entity==='payments'){
      const reference=`zanda:${req('id')}`;
      if(!(await db.query('select id from payments where reference=$1',[reference])).length){
       const [inv]=await db.query('select * from v_debtors where name=$1',[`zanda:${req('invoice_id')}`]);if(!inv)throw Error(`${file} row ${i+2}: invoice missing`);
       const cents=int(req('amount_cents'),'amount_cents',1);if(cents>inv.balance_cents)throw Error(`${file} row ${i+2}: payment exceeds balance`);
       await insert(db,'payments',{invoice_id:inv.id,reference,amount_cents:cents,paid_on:date(req('date'))});operational++;
      }
     }else throw Error(`${file}: unsupported mapped entity ${spec.entity}`);
    }
   }
   report.push({file,rows:rows.length,new_clients:imported,new_archive_rows:archived,new_operational_rows:operational,mode:o['dry-run']?'preview (rolled back)':'imported'});
  }
  if(o['dry-run']){await db.exec('ROLLBACK');await db.exec('BEGIN');}
  return report;
 });
}
export async function run(db,argv){
 const o={},pos=[];
 for(const a of argv){if(a.startsWith('--')){const i=a.indexOf('=');o[a.slice(2,i<0?undefined:i)]=i<0?true:a.slice(i+1);}else pos.push(a);}
 const [cmd='help',arg]=pos;
 if(cmd==='help')return [{commands:[...Object.keys(reads),'client','add','allocate','book','complete','cancel','dna','note','finalise','addendum','outcome','invoice','pay','log','consent','annual-use','report-sent','close-referral','security-review','draft-reminder','draft-gp-letter','import','export','archive-search'].join(', ')}];
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='client'){
  const id=await resolve(db,'clients',arg);return {client:await db.query('select * from clients where id=$1',[id]),referrals:await db.query('select * from referrals where client_id=$1',[id]),sessions:await db.query('select * from sessions where client_id=$1 order by starts_at',[id]),notes:await db.query('select n.* from notes n join sessions s on s.id=n.session_id where s.client_id=$1',[id]),addenda:await db.query('select a.* from addenda a join notes n on n.id=a.note_id join sessions s on s.id=n.session_id where s.client_id=$1',[id]),outcomes:await db.query('select * from outcomes where client_id=$1 order by measured_on',[id]),activity:await db.query('select * from activity where client_id=$1 order by created_at',[id])};
 }
 if(cmd==='import'){if(arg!=='zanda')throw Error('Use import zanda');return importZanda(db,o);}
 if(cmd==='archive-search'){const text=required(o,'text');return db.query("select source_file,payload from import_rows where strpos(lower(payload::text),lower($1))>0 limit 100",[text]);}
 if(cmd==='export'){
  const dir=path.resolve(required(o,'dir'));fs.mkdirSync(dir,{recursive:true});const report=[];
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ');
  try{for(const e of entities){const rows=await db.query(`select * from ${e} order by id`);fs.writeFileSync(path.join(dir,e+'.json'),JSON.stringify(rows,null,2)+'\n',{mode:0o600});report.push({entity:e,rows:rows.length});}await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}return report;
 }
 return transaction(db,async()=>{
  if(cmd==='add'){
   if(arg==='client')return insert(db,'clients',{name:required(o,'name'),email:o.email||null,country:required(o,'country')});
   if(arg==='practitioner')return insert(db,'practitioners',{name:required(o,'name'),registration_due:date(required(o,'registration-due'))});
   if(arg==='referral')return insert(db,'referrals',{client_id:await resolve(db,'clients',required(o,'client')),name:required(o,'name'),funder:required(o,'funder'),referrer:required(o,'referrer'),received_on:date(required(o,'received')),approved:int(required(o,'approved'),'approved',1,1000),initial_course:bool(o.initial??'false'),prior_used:int(o['prior-used']??0,'prior-used'),valid_until:o.until?date(o.until):null});
   if(arg==='waitlist')return insert(db,'waitlist',{client_id:await resolve(db,'clients',required(o,'client')),practitioner_id:o.practitioner?await resolve(db,'practitioners',o.practitioner):null,preference:required(o,'preference')});
   throw Error('add client|practitioner|referral|waitlist');
  }
  if(cmd==='allocate'){
   const id=await resolve(db,'sessions',arg);const [s]=await db.query('select * from sessions where id=$1 for update',[id]);
   if(!['booked','completed'].includes(s.status))throw Error('Only booked or completed visits can be allocated');
   await db.query('select id from clients where id=$1 for update',[s.client_id]);
   const ref=await resolve(db,'referrals',required(o,'referral'));await fundingGate(db,s.client_id,ref,s.service_on+'T12:00:00Z',id);
   return db.query('update sessions set referral_id=$2,funded=true where id=$1 returning *',[id,ref]);
  }
  if(cmd==='book'){
   const c=await resolve(db,'clients',required(o,'client')),p=await resolve(db,'practitioners',required(o,'practitioner'));
   const starts=timestamp(required(o,'at')),minutes=int(o.minutes??50,'minutes',5,240),funded=bool(o.funded??'true');
   await db.query('select id from clients where id=$1 for update',[c]);await db.query('select id from practitioners where id=$1 for update',[p]);
   const [active]=await db.query('select active from practitioners where id=$1',[p]);if(!active.active)throw Error('Practitioner inactive');
   const clashes=await db.query("select id from sessions where status in ('booked','completed') and (practitioner_id=$1 or client_id=$2) and starts_at<$3::timestamptz+($4::integer*interval '1 minute') and starts_at+minutes*interval '1 minute'>$3::timestamptz",[p,c,starts,minutes]);
   if(clashes.length)throw Error('Client or practitioner already booked in this time');
   const r=o.referral?await resolve(db,'referrals',o.referral):null;
   if(r){const [rel]=await db.query('select client_id from referrals where id=$1',[r]);if(rel.client_id!==c)throw Error('Referral belongs to another client');}
   if(funded)await fundingGate(db,c,r,starts);
   return insert(db,'sessions',{client_id:c,practitioner_id:p,referral_id:r,starts_at:starts,service_on:starts.slice(0,10),minutes,fee_cents:int(required(o,'fee-cents'),'fee-cents'),currency:required(o,'currency'),funded});
  }
  if(['complete','cancel','dna'].includes(cmd)){
   const id=await resolve(db,'sessions',arg);const [s]=await db.query('select * from sessions where id=$1 for update',[id]);
   if(s.status!=='booked')throw Error('Only a booked session can change state');
   if(cmd==='complete'){
    const [c]=await db.query('select * from clients where id=$1 for update',[s.client_id]);
    if(!c.consent_on||c.consent_on>s.service_on)throw Error('Record consent valid at the session before completion');
    if(new Date(s.starts_at)>new Date())throw Error('Cannot complete a future session');
    if(s.funded)await fundingGate(db,s.client_id,s.referral_id,s.service_on+'T12:00:00Z',id);
   }
   return db.query('update sessions set status=$2 where id=$1 returning *',[id,{complete:'completed',cancel:'cancelled',dna:'dna'}[cmd]]);
  }
  if(cmd==='note'){
   const s=await resolve(db,'sessions',arg);const [session]=await db.query('select status from sessions where id=$1',[s]);if(session.status!=='completed')throw Error('Session must be completed before a clinical note is recorded');
   return db.query('insert into notes(session_id,body,author) values($1,$2,$3) on conflict(session_id) do update set body=excluded.body,author=excluded.author returning *',[s,required(o,'text'),required(o,'author')]);
  }
  if(cmd==='finalise'){const id=await resolve(db,'notes',arg);return db.query('update notes set finalised_at=now() where id=$1 returning *',[id]);}
  if(cmd==='addendum'){const id=await resolve(db,'notes',arg);const [n]=await db.query('select finalised_at from notes where id=$1',[id]);if(!n.finalised_at)throw Error('Finalise the note before adding corrections');return insert(db,'addenda',{note_id:id,body:required(o,'text'),author:required(o,'author')});}
  if(cmd==='outcome'){const score=Number(required(o,'score'));if(!Number.isFinite(score))throw Error('Score must be finite');return insert(db,'outcomes',{client_id:await resolve(db,'clients',arg),instrument:required(o,'instrument'),score,measured_on:date(required(o,'date')),review_on:date(required(o,'review')),comment:o.comment||''});}
  if(cmd==='invoice')return insert(db,'invoices',{name:required(o,'name'),client_id:await resolve(db,'clients',required(o,'client')),payer:required(o,'payer'),amount_cents:int(required(o,'cents'),'cents',1),currency:required(o,'currency'),due_on:date(required(o,'due'))});
  if(cmd==='pay'){
   const id=await resolve(db,'invoices',arg);await db.query('select id from invoices where id=$1 for update',[id]);const [i]=await db.query('select balance_cents from v_debtors where id=$1',[id]);const cents=int(required(o,'cents'),'cents',1);if(cents>i.balance_cents)throw Error('Payment exceeds balance');
   return insert(db,'payments',{invoice_id:id,reference:required(o,'reference'),amount_cents:cents,paid_on:date(required(o,'date'))});
  }
  if(cmd==='log')return insert(db,'activity',{client_id:await resolve(db,'clients',arg),body:required(o,'text'),author:required(o,'author')});
  if(cmd==='consent' && date(required(o,'date'))>new Date().toISOString().slice(0,10))throw Error('Consent date cannot be in the future');
  if(cmd==='consent')return db.query('update clients set consent_on=$2,contact_ok=$3 where id=$1 returning *',[await resolve(db,'clients',arg),date(required(o,'date')),bool(required(o,'contact'))]);
  if(cmd==='annual-use')return db.query('insert into annual_usage(client_id,year,external_individual,checked_on) values($1,$2,$3,$4) on conflict(client_id,year) do update set external_individual=excluded.external_individual,checked_on=excluded.checked_on returning *',[await resolve(db,'clients',arg),int(required(o,'year'),'year',2000,2200),int(required(o,'external'),'external',0,10),date(required(o,'checked'))]);
  if(cmd==='report-sent')return db.query('update referrals set report_sent_on=$2 where id=$1 returning *',[await resolve(db,'referrals',arg),date(required(o,'date'))]);
  if(cmd==='close-referral')return db.query('update referrals set closed=true where id=$1 returning *',[await resolve(db,'referrals',arg)]);
  if(cmd==='security-review')return db.query('insert into security_checks(name,checked_on,evidence) values($1,$2,$3) on conflict(name) do update set checked_on=excluded.checked_on,evidence=excluded.evidence returning *',[required(o,'name'),date(required(o,'date')),required(o,'evidence')]);
  if(cmd==='draft-reminder'||cmd==='draft-gp-letter'){
   let text,id;
   if(cmd==='draft-reminder'){
    id=await resolve(db,'sessions',arg);const [s]=await db.query('select s.*,c.name,c.email,c.contact_ok from sessions s join clients c on c.id=s.client_id where s.id=$1',[id]);
    if(!s.contact_ok)throw Error('No contact permission recorded');if(s.status!=='booked')throw Error('Reminder requires booked session');
    text=`DRAFT ONLY. Confirm recipient and time zone before sending.\nTo: ${s.email||'[verify address]'}\nHello ${s.name},\nYour appointment is at ${new Date(s.starts_at).toISOString()} (UTC). Please contact the practice if you need to change it.\n`;
   }else{
    id=await resolve(db,'referrals',arg);const [r]=await db.query('select * from v_referrals where id=$1',[id]);
    text=`DRAFT ONLY. Clinician must complete, verify consent and approve.\nTo: ${r.referrer}\nClient: ${r.client}\nCourse: ${r.name}\nRecorded sessions: ${r.completed}; prior sessions: ${r.prior_used}\nAssessments: [clinician to complete]\nTreatment provided: [clinician to complete]\nRecommendations: [clinician to complete]\n`;
   }
   const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${cmd}-${id}-${Date.now()}.txt`);fs.writeFileSync(file,text,{mode:0o600});return [{draft:file,sent:false}];
  }
  throw Error(`Unknown command ${cmd}; run help`);
 });
}
export function printResult(result,json=false){
 if(json)return JSON.stringify(result,null,2);
 if(!Array.isArray(result))return Object.entries(result).map(([name,rows])=>`${name}\n${printResult(rows)}`).join('\n\n');
 if(!result.length)return '(none)';
 const rows=result.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k.endsWith('_cents')?k.slice(0,-6):k,k.endsWith('_cents')&&v!==null?`${r.currency||''} ${(Number(v)/100).toFixed(2)}`.trim():v instanceof Date?v.toISOString():v&&typeof v==='object'?JSON.stringify(v):v])));
 return table(rows,Object.keys(rows[0]).map(key=>({key,label:key,width:key==='id'?10:100})));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();console.log(printResult(await run(db,process.argv.slice(2)),process.argv.includes('--json')));}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}
}
