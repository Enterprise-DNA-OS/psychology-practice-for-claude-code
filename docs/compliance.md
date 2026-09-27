# Record checks and their limits

Sources checked 27 September 2026. This is practice administration, not clinical advice, a claiming service or a compliance certification. The clinician decides treatment and disclosure. A funding warning changes billing review, never access to care.

## Australian Better Access individual treatment

[Services Australia: referrals and reporting](https://www.servicesaustralia.gov.au/allied-health-referrals-for-mental-health-treatment-services?context=20).

Initial individual courses permit up to six services. Individual services have a combined calendar-year limit of ten. Each course needs a referral. Unused referral services can carry forward, while the annual count follows the service date. A written report goes to the referrer when a course finishes, including assessments, treatment and recommendations; an interrupted course also needs a report after the last service.

Implementation: referrals store approved services and previously used course services. Bookings reserve capacity. Cancelled and missed sessions do not consume it. Annual usage records services delivered elsewhere; local reserved and completed funded visits consume the balance. Enter the original local service date even around New Year. `annual-use` requires an explicit date for the check. `close-referral` flags interrupted courses for a report. `report-sent` records a human's completed action, never sends.

Scope: individual Better Access administration only. Group, family/carer and specialist programmes have different rules. No Medicare eligibility determination or claiming. Imported sessions are initially unallocated; reconcile funding and outside-provider use before trusting an allowance.

## New Zealand health information

[Privacy Commissioner: current Health Information Privacy Code](https://www.privacy.org.nz/privacy-principles/codes-of-practice/hipc2020/) and [Rule 5 storage and security](https://www.privacy.org.nz/privacy-principles/codes-of-practice/hipc2020/hipc-factsheet-5-storage-security-retention-and-disposal-of-health-information/).

Health agencies need safeguards against loss and unauthorised access, alteration or disclosure. `compliance` asks for evidence of access reviews, restore tests, device encryption and the agent data agreement. The 90-day review interval is a practice policy, not a statutory period. These are recorded attestations, not technical verification.

The local demo has no user authentication, role separation, encryption at rest or access audit. Before real health records are used, provision those controls, agree retention and backups, verify the host and agent provider's data terms, and review AU/NZ privacy obligations with the practice's responsible person. Keep exports, HTML and drafts in restricted storage. Never put client records into Git or an unapproved model.

## Practice rules, not legal claims

Recorded consent is required to complete a visit. Finalised notes cannot be changed or deleted through the database; corrections are dated addenda. Registration dates, note completion and outcome review dates appear as administrative reminders. Score changes carry no automated clinical interpretation. EAP and ACC approvals are entered from actual agreements; no universal session cap is assumed. Payment entries record receipts only; no money moves.

These checks do not prove legal compliance or replace a clinician's review of the actual referral, authority to disclose, health record or payer contract.
