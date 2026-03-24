/* ═══════════════════════════════════════════════════════════════════
   FACTION EVENTS SYSTEM — City of Lies / Merrehope
   ═══════════════════════════════════════════════════════════════════
   Pops a choice modal every 2–7 minutes during gameplay.
   Each event belongs to a faction, offers 2–3 choices, and
   honestly shows the player the meter consequences upfront.
   30% of choices carry a bonus (new evidence) or penalty
   (evidence flagged inadmissible for Final Report).

   LocalStorage keys:
     col_faction_seen      — array of event IDs already shown
     col_faction_penalties — { evidenceId: true } inadmissible items
     col_faction_bonuses   — array of bonus evidence IDs already given
     col_save              — influence, cityCorrupt, streetCred
═══════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  /* ── FACTION CONFIG ── */
  const FACTIONS = {
    police:   { name:'Merrehope Police Department', icon:'🚔', color:'#4080c0', label:'Law Enforcement' },
    council:  { name:'City Council',                icon:'🏛', color:'#a8832e', label:'Municipal Government' },
    security: { name:'Private Security Firms',      icon:'🛡', color:'#888888', label:'Corporate Security' },
    syndicate:{ name:'Crime Syndicates',            icon:'💀', color:'#c43030', label:'Organised Crime' },
    activist: { name:'Activist Groups',             icon:'✊', color:'#3a9a5a', label:'Civil Society' },
    media:    { name:'Media Outlets',               icon:'📰', color:'#c0a030', label:'Press & Publishing' },
  };

  /* ── EVIDENCE POOL for bonuses ── */
  const BONUS_EVIDENCE_POOL = [
    {
      id:       'COL-001-A-BFAC-001',
      name:     'Anonymous Tip — Encrypted Note',
      location: 'Received via encrypted drop — faction source',
      date:     'Received during investigation',
      owner:    'Unknown — anonymous source',
      why:      'An anonymous tip passed through a faction contact. The note references a specific meeting between Victor Marre and an unnamed council member at Kessler Wharf two weeks before the incident. The source has not been identified but the details are specific enough to warrant follow-up.',
      status:   'logged',
    },
    {
      id:       'COL-001-A-BFAC-002',
      name:     'Internal Memo — Harbour Authority',
      location: 'Obtained via faction source — Harbour Authority records',
      date:     'Leaked during investigation',
      owner:    'Harbour Authority (leaked)',
      why:      'An internal memo obtained through a faction contact shows that Bay 7 security rotation was altered two days before the incident — specifically swapping Ashford onto the night shift. The change was requested verbally with no written authorisation.',
      status:   'logged',
    },
    {
      id:       'COL-001-A-BFAC-003',
      name:     'Witness Statement — Informal',
      location: 'Obtained via activist network contact',
      date:     'Collected during investigation',
      owner:    'Anonymous — identity protected',
      why:      'An informal statement obtained through an activist group contact describes seeing a dark saloon vehicle parked near Harlow Street at approximately 21:30 on Mar 04. The witness declined to make a formal statement but provided a partial plate number: ME**-4.',
      status:   'logged',
    },
    {
      id:       'COL-001-A-BFAC-004',
      name:     'Financial Disclosure — Off-Record',
      location: 'Obtained via media source — background briefing',
      date:     'Provided during investigation',
      owner:    'Source: journalist (name withheld)',
      why:      'A journalist provided off-record financial background on Marre Import Co., revealing a pattern of quarterly cash withdrawals that align with known council lobbying periods. The source cannot be named but the pattern is documentable through cross-referencing with public council records.',
      status:   'logged',
    },
    {
      id:       'COL-001-A-BFAC-005',
      name:     'Street Intelligence Report',
      location: 'Provided by syndicate-adjacent source',
      date:     'Received during investigation',
      owner:    'Source: street-level contact',
      why:      'Intelligence from a syndicate-adjacent source indicates that the envelope delivered to the victim the night of the incident was not the first — at least two prior deliveries were made over three weeks, each following a cash withdrawal from the Marre Import Co. account. The source will not testify.',
      status:   'logged',
    },
    {
      id:       'COL-001-A-BFAC-006',
      name:     'Security Contract — Redacted Copy',
      location: 'Leaked by private security firm insider',
      date:     'Received during investigation',
      owner:    'Source: private security firm (unnamed)',
      why:      'A redacted copy of a private security contract between a Marre Import Co. subsidiary and an unnamed security firm, dated 14 months before the incident. The contract covers "executive protection and site access management" at locations including Bay 7. Several names are redacted but the Harbour Authority stamp is visible.',
      status:   'logged',
    },
  ];

  /* ── EVENT DEFINITIONS ──
     Each event: id, faction, title, situation, choices[]
     Each choice: text, meters{influence,cityCorrupt,streetCred},
                  outcome (narrative after selection),
                  bonus? { type:'evidence'|'meter', ... }
                  penalty? { evidenceId, reason }
  ── */
  const FACTION_EVENTS = [

    /* ══════════════ MEDIA EVENTS ══════════════ */
    {
      id: 'MED-001',
      faction: 'media',
      title: 'Independent Blogger — Comment Request',
      situation: 'A local independent blogger, known for covering Merrehope corruption, sends a direct message requesting a comment on the COL-001-A investigation. She has a small but dedicated readership and a reputation for accuracy.',
      choices: [
        {
          text: 'Speak openly and honestly',
          meters: { influence: +5, cityCorrupt: -4, streetCred: -6 },
          outcome: 'You give a measured, factual account of the investigation\'s progress. The story runs positively. Your integrity gets a quiet boost — but the streets notice you\'re playing it straight.',
          bonus: { type:'evidence', poolIndex:3 },
          bonusChance: 0.30,
        },
        {
          text: 'Provide misleading information',
          meters: { influence: +8, cityCorrupt: +5, streetCred: +4 },
          outcome: 'You feed her a plausible but misleading version of events. She runs the story. Powerful people are pleased. The streets respect the play.',
          penalty: { evidenceId:'COL-001-A-E05', reason:'Ledger chain of custody questioned following misleading press briefing. Admissibility under challenge.' },
          penaltyChance: 0.30,
        },
        {
          text: '"No comment"',
          meters: { influence: 0, cityCorrupt: +2, streetCred: -2 },
          outcome: 'The blogger publishes the silence as the story. Corruption fills vacuums.',
        },
      ],
    },

    {
      id: 'MED-002',
      faction: 'media',
      title: 'Major News Outlet — Leaked Document',
      situation: 'A senior journalist from Merrehope\'s largest daily newspaper contacts you. They claim to have received an anonymous leak of evidence from your case. They\'re offering to delay publication in exchange for an exclusive briefing.',
      choices: [
        {
          text: 'Grant the exclusive briefing',
          meters: { influence: +4, cityCorrupt: -6, streetCred: -5 },
          outcome: 'The story runs with your framing. City Corruption drops as public scrutiny increases, but the underworld sees you\'re working with the press.',
          bonus: { type:'evidence', poolIndex:0 },
          bonusChance: 0.30,
        },
        {
          text: 'Threaten legal action to suppress',
          meters: { influence: +10, cityCorrupt: +8, streetCred: +3 },
          outcome: 'The story is killed. Powerful interests note your willingness to play hardball. The streets see someone who can make things disappear.',
        },
        {
          text: 'Tip off the journalist about Marre',
          meters: { influence: -5, cityCorrupt: -10, streetCred: -4 },
          outcome: 'The story becomes explosive. City Corruption drops sharply as the public turns against Marre. Your influence takes a hit — you\'ve become a target.',
          bonus: { type:'evidence', poolIndex:3 },
          bonusChance: 0.30,
        },
      ],
    },

    {
      id: 'MED-003',
      faction: 'media',
      title: 'True Crime Podcast — Interview Request',
      situation: 'A popular true crime podcast with a national audience requests an interview about the Harlow Street case. Going on record could sway public opinion significantly.',
      choices: [
        {
          text: 'Appear and discuss the case',
          meters: { influence: -3, cityCorrupt: -8, streetCred: -5 },
          outcome: 'Public interest in the case surges. Witnesses feel safer coming forward. City Corruption drops as accountability becomes visible.',
          bonus: { type:'evidence', poolIndex:2 },
          bonusChance: 0.30,
        },
        {
          text: 'Decline politely',
          meters: { influence: +2, cityCorrupt: +3, streetCred: 0 },
          outcome: 'The podcast runs the episode without you — speculating freely. The narrative drifts in an unhelpful direction.',
        },
        {
          text: 'Agree but control the narrative',
          meters: { influence: +6, cityCorrupt: +4, streetCred: -3 },
          outcome: 'You appear but carefully guide the conversation away from sensitive threads. Influence grows. The truth gets a little more managed.',
        },
      ],
    },

    /* ══════════════ POLICE DEPARTMENT EVENTS ══════════════ */
    {
      id: 'POL-001',
      faction: 'police',
      title: 'Deputy Commissioner — Pressure to Close',
      situation: 'The Deputy Commissioner calls you into her office. She wants the case resolved quickly and quietly. She implies that a swift closure — even without a strong conviction — would be "beneficial for the department." She doesn\'t say it directly, but the suggestion is clear.',
      choices: [
        {
          text: 'Agree to wrap it up quickly',
          meters: { influence: +12, cityCorrupt: +10, streetCred: +5 },
          outcome: 'You signal willingness to play ball. The department is pleased. The streets note that you\'re someone who takes orders. Your independence is quietly diminished.',
          penalty: { evidenceId:'COL-001-A-E06', reason:'USB drive evidence access restricted following internal directive. Chain of custody suspended pending review.' },
          penaltyChance: 0.30,
        },
        {
          text: 'Refuse and continue the investigation',
          meters: { influence: -8, cityCorrupt: -6, streetCred: +4 },
          outcome: 'You walk out without agreeing to anything. Your standing with the department takes a hit, but your credibility with independent observers grows.',
          bonus: { type:'evidence', poolIndex:1 },
          bonusChance: 0.30,
        },
        {
          text: 'Agree — but keep digging privately',
          meters: { influence: +5, cityCorrupt: +4, streetCred: +2 },
          outcome: 'You say what she wants to hear and continue the investigation quietly. A calculated compromise — but one that will define who you become.',
        },
      ],
    },

    {
      id: 'POL-002',
      faction: 'police',
      title: 'Internal Affairs — Surveillance Notice',
      situation: 'You receive a confidential notice that Internal Affairs has opened a file on your investigation methods. Det. Sylvia Okafor\'s department is watching. You can respond formally, ignore it, or reach out directly to Okafor.',
      choices: [
        {
          text: 'Respond formally through proper channels',
          meters: { influence: -2, cityCorrupt: -3, streetCred: 0 },
          outcome: 'The formal response slows things down but keeps you clean. The file stays open but inactive.',
        },
        {
          text: 'Ignore it and keep working',
          meters: { influence: +3, cityCorrupt: +5, streetCred: +3 },
          outcome: 'You proceed. IA watches. The file accumulates. At some point this will matter.',
          penalty: { evidenceId:'COL-001-A-E21', reason:'Enhanced CCTV still admissibility queried by IA following procedural irregularity flag on investigation file.' },
          penaltyChance: 0.30,
        },
        {
          text: 'Reach out to Det. Okafor directly',
          meters: { influence: -4, cityCorrupt: -5, streetCred: +6 },
          outcome: 'Okafor meets you off the record. She doesn\'t confirm or deny her Bay 7 presence but hints that she was there for reasons unrelated to Marre — and that someone asked her to be there.',
          bonus: { type:'evidence', poolIndex:1 },
          bonusChance: 0.30,
        },
      ],
    },

    {
      id: 'POL-003',
      faction: 'police',
      title: 'Forensics Lab — Budget Pressure',
      situation: 'The Forensics Lab supervisor informs you that budget cuts are forcing a prioritisation. Two of your submitted evidence items will be deprioritised unless you can justify their value to the division head — or find alternative funding.',
      choices: [
        {
          text: 'Make the formal case to the division head',
          meters: { influence: -3, cityCorrupt: -2, streetCred: +2 },
          outcome: 'Your justification is accepted. Both items proceed. You\'ve spent political capital but kept the evidence pipeline intact.',
        },
        {
          text: 'Accept the deprioritisation',
          meters: { influence: +2, cityCorrupt: +4, streetCred: 0 },
          outcome: 'Two items move to the bottom of the queue. Analysis will be delayed significantly.',
          penalty: { evidenceId:'COL-001-A-E04', reason:'Bloodstained cloth deprioritised following budget review. Lab analysis delayed indefinitely — inadmissible until further notice.' },
          penaltyChance: 0.30,
        },
        {
          text: 'Use informal channels to expedite',
          meters: { influence: +6, cityCorrupt: +6, streetCred: +4 },
          outcome: 'You call in a favour. Both items jump the queue. Someone owes you something now, and that something will have a cost.',
        },
      ],
    },

    /* ══════════════ CITY COUNCIL EVENTS ══════════════ */
    {
      id: 'CON-001',
      faction: 'council',
      title: 'Alderman Cross — Private Meeting Request',
      situation: 'Alderman Raymond Cross requests a private meeting. He claims he has information relevant to the Marre investigation — but he\'ll only share it in exchange for assurances that his name stays out of any report. The ledger\'s coded entry "R.C./Fvr" makes his involvement a live question.',
      choices: [
        {
          text: 'Agree to the meeting and the terms',
          meters: { influence: +8, cityCorrupt: +7, streetCred: +5 },
          outcome: 'Cross gives you a partial lead — enough to move. But you\'ve made a promise to a man who may be deeply complicit. The ledger entry hangs over this arrangement.',
          bonus: { type:'evidence', poolIndex:0 },
          bonusChance: 0.30,
        },
        {
          text: 'Meet him — but make no promises',
          meters: { influence: +3, cityCorrupt: +2, streetCred: +2 },
          outcome: 'Cross is cagey without the assurance but drops enough hints to pursue a new thread. He leaves annoyed. The game between you has started.',
        },
        {
          text: 'Decline and flag the contact to IA',
          meters: { influence: -6, cityCorrupt: -8, streetCred: -3 },
          outcome: 'You report the contact. Internal Affairs notes it. Cross is now on record attempting to interfere with the investigation — a fact that may prove useful.',
          bonus: { type:'evidence', poolIndex:3 },
          bonusChance: 0.30,
        },
      ],
    },

    {
      id: 'CON-002',
      faction: 'council',
      title: 'Planning Committee — Zoning Records Request',
      situation: 'A contact on the council\'s planning committee quietly indicates that Bay 7\'s zoning records — which include ownership and access history going back a decade — are being quietly archived. They\'ll be inaccessible within 48 hours unless someone formally requests them.',
      choices: [
        {
          text: 'File a formal evidence preservation request',
          meters: { influence: -4, cityCorrupt: -6, streetCred: +2 },
          outcome: 'The records are preserved. The council is not pleased. You\'ve created a paper trail that protects the evidence — and marks you as an obstacle.',
          bonus: { type:'evidence', poolIndex:5 },
          bonusChance: 0.30,
        },
        {
          text: 'Obtain them informally before they\'re archived',
          meters: { influence: +4, cityCorrupt: +3, streetCred: +5 },
          outcome: 'Your contact pulls the records before the window closes. You have what you need — through a method that can\'t be cited in court.',
        },
        {
          text: 'Let it go — focus on what you have',
          meters: { influence: +2, cityCorrupt: +5, streetCred: 0 },
          outcome: 'The records are archived. A thread goes cold. The council breathes easier.',
          penalty: { evidenceId:'COL-001-A-E08', reason:'Boot print cast chain of custody compromised following failure to preserve supporting location records.' },
          penaltyChance: 0.30,
        },
      ],
    },

    {
      id: 'CON-003',
      faction: 'council',
      title: 'Council Whistleblower — Anonymous Contact',
      situation: 'An anonymous council employee reaches out through a secure drop. They claim to have documentation of a series of payments from Marre Import Co. to a council discretionary fund — but they\'re terrified of exposure and will only communicate through intermediaries.',
      choices: [
        {
          text: 'Establish the secure contact and protect them',
          meters: { influence: -5, cityCorrupt: -9, streetCred: +3 },
          outcome: 'The whistleblower trusts you with partial documentation. City Corruption drops as a financial trail becomes visible. You\'ve taken on responsibility for their safety.',
          bonus: { type:'evidence', poolIndex:3 },
          bonusChance: 0.30,
        },
        {
          text: 'Accept what they send but don\'t commit to protection',
          meters: { influence: +2, cityCorrupt: -3, streetCred: +1 },
          outcome: 'You get the documents without the commitment. The source goes quiet shortly after — whether they backed out or were silenced is unclear.',
        },
        {
          text: 'Report the contact to your supervisor',
          meters: { influence: +6, cityCorrupt: +5, streetCred: -4 },
          outcome: 'Your supervisor thanks you. The source is never heard from again. The documentation never surfaces. You followed procedure.',
        },
      ],
    },

    /* ══════════════ CRIME SYNDICATE EVENTS ══════════════ */
    {
      id: 'SYN-001',
      faction: 'syndicate',
      title: 'Harbour District Syndicate — Warning Delivered',
      situation: 'Two-Stop finds you with a message — not his words, someone else\'s. Someone in the harbour district wants you to know that the investigation is getting "close to things that shouldn\'t be touched." No explicit threat, but the implication is clear. They\'re offering a counter-proposal.',
      choices: [
        {
          text: 'Acknowledge the message and back off Bay 7',
          meters: { influence: +5, cityCorrupt: +10, streetCred: +12 },
          outcome: 'Word travels fast in the harbour. You\'ve shown you listen. The streets trust you more. The institutions trust you less.',
          penalty: { evidenceId:'COL-001-A-E06', reason:'USB evidence from Bay 7 access restricted following investigative scope adjustment. Not available for Final Report.' },
          penaltyChance: 0.30,
        },
        {
          text: 'Refuse and continue the Bay 7 thread',
          meters: { influence: -3, cityCorrupt: -4, streetCred: -8 },
          outcome: 'The message was delivered. You sent it back. Someone in the harbour district now knows you don\'t scare. That\'s either very good or very bad.',
          bonus: { type:'evidence', poolIndex:4 },
          bonusChance: 0.30,
        },
        {
          text: 'Ask what they know about Marre',
          meters: { influence: 0, cityCorrupt: +4, streetCred: +6 },
          outcome: 'They don\'t answer directly — but they confirm Marre has protection you haven\'t yet found. A name surfaces, not clearly enough to act on. Yet.',
          bonus: { type:'evidence', poolIndex:4 },
          bonusChance: 0.30,
        },
      ],
    },

    {
      id: 'SYN-002',
      faction: 'syndicate',
      title: 'Syndicate Offer — Evidence for Loyalty',
      situation: 'Through Patch, a higher-level syndicate contact makes a direct proposal. They have surveillance from the night of the incident — footage from a source you don\'t have access to. They\'ll hand it over in exchange for a specific favour: ensure that a particular name never appears in your final report.',
      choices: [
        {
          text: 'Accept the deal',
          meters: { influence: +10, cityCorrupt: +12, streetCred: +15 },
          outcome: 'The footage arrives. It\'s genuinely useful. A name gets quietly buried. You\'ve crossed a line that doesn\'t have a way back across it.',
          bonus: { type:'evidence', poolIndex:4 },
          bonusChance: 1.0,
        },
        {
          text: 'Refuse the deal',
          meters: { influence: -4, cityCorrupt: -3, streetCred: -10 },
          outcome: 'The footage stays with them. Your street credibility takes a significant hit — refusing a syndicate offer has costs. But your report stays clean.',
        },
        {
          text: 'Accept — but don\'t honour it',
          meters: { influence: +6, cityCorrupt: +8, streetCred: -5 },
          outcome: 'You take the footage and make no actual commitment. The name appears in your report anyway. Someone in the harbour district will remember this. So will the meters.',
          bonus: { type:'evidence', poolIndex:4 },
          bonusChance: 1.0,
        },
      ],
    },

    {
      id: 'SYN-003',
      faction: 'syndicate',
      title: 'Reno — Street Intel, Uncertain Source',
      situation: 'Reno pulls you aside. He\'s heard something through the street network — a name being whispered in connection to the delivery that night. The information is credible but sourced through channels that cannot be verified. If true, it\'s significant.',
      choices: [
        {
          text: 'Take the intel and pursue it formally',
          meters: { influence: -2, cityCorrupt: -3, streetCred: +4 },
          outcome: 'The lead checks out — partially. You have a new thread to pull. Your credibility with the street holds.',
          bonus: { type:'evidence', poolIndex:4 },
          bonusChance: 0.30,
        },
        {
          text: 'Use it informally — don\'t log it',
          meters: { influence: +4, cityCorrupt: +5, streetCred: +7 },
          outcome: 'The intel moves you forward without a paper trail. Useful, messy, and exactly the kind of work that defines who you are in this city.',
        },
        {
          text: 'Decline — unverified intel is a liability',
          meters: { influence: +2, cityCorrupt: +2, streetCred: -5 },
          outcome: 'Reno nods. A thread goes unpulled. Clean hands, narrow vision.',
        },
      ],
    },

    /* ══════════════ ACTIVIST EVENTS ══════════════ */
    {
      id: 'ACT-001',
      faction: 'activist',
      title: 'Transparency Campaign — Public Pressure',
      situation: 'A civil rights organisation launches a public campaign demanding transparency on the COL-001-A investigation. They\'re asking you to release a summary of findings to the public. Their influence is growing and the story is gaining traction.',
      choices: [
        {
          text: 'Release a partial findings summary',
          meters: { influence: -4, cityCorrupt: -8, streetCred: -3 },
          outcome: 'City Corruption drops as public scrutiny increases. You\'re briefly a hero to the activists. The institutions are not pleased.',
          bonus: { type:'evidence', poolIndex:2 },
          bonusChance: 0.30,
        },
        {
          text: 'Release a sanitised statement',
          meters: { influence: +4, cityCorrupt: +2, streetCred: -4 },
          outcome: 'You give them just enough to keep them quiet. The activists are unimpressed but the pressure eases temporarily.',
        },
        {
          text: 'Refuse on grounds of operational security',
          meters: { influence: +6, cityCorrupt: +6, streetCred: -2 },
          outcome: 'The activists escalate. The story becomes about the refusal rather than the investigation. Your influence with the establishment rises.',
        },
      ],
    },

    {
      id: 'ACT-002',
      faction: 'activist',
      title: 'Community Witness Network — Unsolicited Statement',
      situation: 'An activist-run community witness network delivers a package to the precinct — a collection of informal neighbourhood statements about activity near Harlow Street on the night of the incident. Several are specific. None are signed.',
      choices: [
        {
          text: 'Log them as supporting material',
          meters: { influence: -3, cityCorrupt: -4, streetCred: +3 },
          outcome: 'Several statements contain details that corroborate your physical evidence. The network is grateful for the acknowledgement.',
          bonus: { type:'evidence', poolIndex:2 },
          bonusChance: 0.30,
        },
        {
          text: 'Return them as inadmissible',
          meters: { influence: +4, cityCorrupt: +5, streetCred: -5 },
          outcome: 'You send the package back. Admissibility rules are real. So is the cost of ignoring people who were trying to help.',
        },
        {
          text: 'Accept them informally — pursue the leads',
          meters: { influence: 0, cityCorrupt: -2, streetCred: +6 },
          outcome: 'You use the statements as background context without formally entering them. Two leads prove worth pursuing.',
          bonus: { type:'evidence', poolIndex:2 },
          bonusChance: 0.30,
        },
      ],
    },

    /* ══════════════ PRIVATE SECURITY EVENTS ══════════════ */
    {
      id: 'SEC-001',
      faction: 'security',
      title: 'Private Security Firm — Records Request Denied',
      situation: 'You submit a formal request for security access logs from a private firm covering the Kessler Warehouse District on the night of the incident. The firm denies the request citing client confidentiality. Their client list is not public.',
      choices: [
        {
          text: 'Escalate through legal channels',
          meters: { influence: -5, cityCorrupt: -4, streetCred: +1 },
          outcome: 'A court order is issued. The records arrive three weeks later — useful but slow. The firm flags you as a problem.',
          bonus: { type:'evidence', poolIndex:5 },
          bonusChance: 0.30,
        },
        {
          text: 'Offer to keep their client name out of the report',
          meters: { influence: +8, cityCorrupt: +9, streetCred: +4 },
          outcome: 'The records arrive the next day. The client\'s name stays out of your formal report — though not out of your notes.',
          bonus: { type:'evidence', poolIndex:5 },
          bonusChance: 1.0,
        },
        {
          text: 'Drop the request — pursue other avenues',
          meters: { influence: +2, cityCorrupt: +4, streetCred: 0 },
          outcome: 'The thread goes cold. The firm\'s client remains unknown. The gap in the timeline persists.',
          penalty: { evidenceId:'COL-001-A-E18', reason:'Vehicle fibre evidence context incomplete following failure to obtain corroborating security records. Chain of custody weakened.' },
          penaltyChance: 0.30,
        },
      ],
    },

    {
      id: 'SEC-002',
      faction: 'security',
      title: 'Corporate Security — Surveillance Offer',
      situation: 'A senior operative from a private security firm approaches you — not through official channels. They have extensive private surveillance on the Kessler and Harbour areas and are willing to share selectively. They represent corporate clients whose interests may overlap with yours.',
      choices: [
        {
          text: 'Accept the offer and share case details in return',
          meters: { influence: +9, cityCorrupt: +8, streetCred: +6 },
          outcome: 'You get significant surveillance data. They get insight into your investigation. The relationship is transactional and the information is useful — but someone now knows exactly where your case stands.',
          bonus: { type:'evidence', poolIndex:5 },
          bonusChance: 0.30,
        },
        {
          text: 'Accept the surveillance but share nothing',
          meters: { influence: +4, cityCorrupt: +4, streetCred: +4 },
          outcome: 'You take the data and give nothing back. The operative notes it. Trust is a finite resource in Merrehope.',
        },
        {
          text: 'Decline — private surveillance is inadmissible',
          meters: { influence: -2, cityCorrupt: -3, streetCred: 0 },
          outcome: 'You walk away clean. The surveillance data stays with them. You\'ll never know what was on it.',
        },
      ],
    },

  ];

  /* ── CONSTANTS ── */
  const BONUS_CHANCE        = 0.30;
  const TIMER_MIN_MS        = 2 * 60 * 1000;
  const TIMER_MAX_MS        = 7 * 60 * 1000;
  const METER_MAX           = 100;
  const METER_MIN           = 0;

  /* ── STATE ── */
  let eventTimer  = null;
  let isModalOpen = false;

  /* ── LOAD SAVE STATE ── */
  function getMeters() {
    try {
      const s = JSON.parse(localStorage.getItem('col_save') || '{}');
      return {
        influence:   Math.max(METER_MIN, Math.min(METER_MAX, s.influence   ?? 0)),
        cityCorrupt: Math.max(METER_MIN, Math.min(METER_MAX, s.cityCorrupt ?? 0)),
        streetCred:  Math.max(METER_MIN, Math.min(METER_MAX, s.streetCred  ?? 0)),
      };
    } catch { return { influence:0, cityCorrupt:0, streetCred:0 }; }
  }

  function saveMeters(meters) {
    try {
      const s = JSON.parse(localStorage.getItem('col_save') || '{}');
      s.influence   = Math.max(METER_MIN, Math.min(METER_MAX, meters.influence));
      s.cityCorrupt = Math.max(METER_MIN, Math.min(METER_MAX, meters.cityCorrupt));
      // streetCred is always inverse of cityCorrupt
      s.streetCred  = Math.max(METER_MIN, Math.min(METER_MAX, 100 - s.cityCorrupt));
      localStorage.setItem('col_save', JSON.stringify(s));
    } catch(e) {}
  }

  function getSeenEvents() {
    try { return JSON.parse(localStorage.getItem('col_faction_seen') || '[]'); }
    catch { return []; }
  }

  function markEventSeen(id) {
    const seen = getSeenEvents();
    if (!seen.includes(id)) {
      seen.push(id);
      localStorage.setItem('col_faction_seen', JSON.stringify(seen));
    }
  }

  function getPenalties() {
    try { return JSON.parse(localStorage.getItem('col_faction_penalties') || '{}'); }
    catch { return {}; }
  }

  function addPenalty(evidenceId, reason) {
    const p = getPenalties();
    p[evidenceId] = { reason, date: Date.now() };
    localStorage.setItem('col_faction_penalties', JSON.stringify(p));
  }

  function getBonuses() {
    try { return JSON.parse(localStorage.getItem('col_faction_bonuses') || '[]'); }
    catch { return []; }
  }

  function addBonus(evidenceId) {
    const b = getBonuses();
    if (!b.includes(evidenceId)) {
      b.push(evidenceId);
      localStorage.setItem('col_faction_bonuses', JSON.stringify(b));
    }
  }

  /* ── PICK NEXT RANDOM EVENT ── */
  function pickNextEvent() {
    const seen  = getSeenEvents();
    const unseen = FACTION_EVENTS.filter(e => !seen.includes(e.id));
    if (unseen.length === 0) return null; // all events shown
    return unseen[Math.floor(Math.random() * unseen.length)];
  }

  /* ── SCHEDULE NEXT EVENT ── */
  function scheduleNext() {
    if (eventTimer) clearTimeout(eventTimer);
    const delay = TIMER_MIN_MS + Math.random() * (TIMER_MAX_MS - TIMER_MIN_MS);
    eventTimer = setTimeout(() => {
      if (!isModalOpen) triggerEvent();
      else scheduleNext(); // try again if modal already open
    }, delay);
  }

  /* ── TRIGGER EVENT ── */
  function triggerEvent() {
    const event = pickNextEvent();
    if (!event) return; // all events exhausted
    showEventModal(event);
  }

  /* ── BUILD AND SHOW MODAL ── */
  function showEventModal(event) {
    isModalOpen = true;
    markEventSeen(event.id);

    const faction = FACTIONS[event.faction];
    const meters  = getMeters();

    // Remove existing modal if any
    document.getElementById('faction-event-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'faction-event-overlay';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:200;
      background:rgba(4,2,0,.90); backdrop-filter:blur(8px);
      display:flex; align-items:center; justify-content:center;
      padding:clamp(12px,3vw,36px); overflow-y:auto;
      animation:factionFadeIn .35s ease;
    `;

    // Build choices HTML
    const choicesHtml = event.choices.map((c, i) => {
      const meterLines = buildMeterLines(c.meters, meters);
      const bonusChance = c.bonus    ? (c.bonusChance ?? BONUS_CHANCE) : 0;
      const penaltyChance = c.penalty ? (c.penaltyChance ?? BONUS_CHANCE) : 0;
      const hasSideEffect = bonusChance > 0 || penaltyChance > 0;

      const sideEffectHtml = hasSideEffect ? `
        <div style="margin-top:8px;padding:6px 10px;
          background:${c.bonus ? 'rgba(58,154,90,.08)' : 'rgba(196,48,48,.08)'};
          border:1px solid ${c.bonus ? 'rgba(58,154,90,.25)' : 'rgba(196,48,48,.25)'};
          font-size:clamp(7px,.82vw,9px);letter-spacing:.15em;text-transform:uppercase;
          color:${c.bonus ? '#3a9a5a' : '#c43030'};">
          ${c.bonus
            ? `✦ ${Math.round(bonusChance*100)}% chance: New evidence may be unlocked`
            : `⚠ ${Math.round(penaltyChance*100)}% chance: Evidence may become inadmissible`}
        </div>
      ` : '';

      return `
        <button class="faction-choice-btn" data-index="${i}" style="
          width:100%; text-align:left;
          background:rgba(168,131,46,.06);
          border:1px solid rgba(168,131,46,.2);
          padding:clamp(12px,2vw,16px); margin-bottom:8px;
          cursor:pointer; transition:background .18s, border-color .18s;
          font-family:'Courier Prime',monospace;
        "
        onmouseover="this.style.background='rgba(168,131,46,.12)';this.style.borderColor='rgba(168,131,46,.5)'"
        onmouseout="this.style.background='rgba(168,131,46,.06)';this.style.borderColor='rgba(168,131,46,.2)'">
          <span style="font-size:clamp(10px,1.4vw,14px);color:#d8c8a8;display:block;margin-bottom:8px;line-height:1.4;">
            ${c.text}
          </span>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px;">
            ${meterLines}
          </div>
          ${sideEffectHtml}
        </button>
      `;
    }).join('');

    overlay.innerHTML = `
      <style>
        @keyframes factionFadeIn { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
        @keyframes factionSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .faction-result-enter { animation:factionSlideIn .3s ease; }
      </style>
      <div style="
        width:100%; max-width:540px;
        background:rgba(14,11,8,.98);
        border:1px solid rgba(168,131,46,.3);
        padding:clamp(20px,3.5vw,32px);
      ">
        <!-- Faction header -->
        <div style="display:flex;align-items:center;gap:10px;
          margin-bottom:clamp(14px,2.5vh,20px);
          padding-bottom:clamp(10px,1.8vh,14px);
          border-bottom:1px solid rgba(168,131,46,.15);">
          <span style="font-size:clamp(22px,3.5vw,32px);">${faction.icon}</span>
          <div>
            <span style="font-size:clamp(7px,.85vw,9px);letter-spacing:.35em;text-transform:uppercase;
              color:${faction.color};opacity:.8;display:block;margin-bottom:2px;">${faction.label}</span>
            <span style="font-size:clamp(12px,1.8vw,16px);color:#d8c8a8;font-weight:700;">
              ${faction.name}
            </span>
          </div>
          <div style="margin-left:auto;text-align:right;">
            <span style="font-size:clamp(6px,.75vw,8px);letter-spacing:.25em;text-transform:uppercase;
              color:rgba(168,131,46,.4);">Faction Event</span>
          </div>
        </div>

        <!-- Event title -->
        <div style="margin-bottom:clamp(10px,1.8vh,16px);">
          <span style="font-size:clamp(7px,.82vw,9px);letter-spacing:.35em;text-transform:uppercase;
            color:rgba(168,131,46,.5);display:block;margin-bottom:4px;">Situation</span>
          <span style="font-size:clamp(14px,2.2vw,18px);color:#d8c8a8;font-weight:700;
            display:block;margin-bottom:8px;">${event.title}</span>
          <p style="font-size:clamp(10px,1.3vw,13px);color:rgba(168,150,100,.7);line-height:1.7;">
            ${event.situation}
          </p>
        </div>

        <!-- Current meters -->
        <div style="display:flex;gap:clamp(8px,1.5vw,14px);margin-bottom:clamp(14px,2.5vh,20px);
          padding:clamp(8px,1.4vw,12px);background:rgba(168,131,46,.04);
          border:1px solid rgba(168,131,46,.12);">
          ${buildMeterDisplay(meters)}
        </div>

        <!-- Choices -->
        <div style="margin-bottom:clamp(10px,1.8vh,14px);">
          <span style="font-size:clamp(7px,.82vw,9px);letter-spacing:.35em;text-transform:uppercase;
            color:rgba(168,131,46,.5);display:block;margin-bottom:10px;">Choose your response</span>
          <div id="faction-choices-wrap">
            ${choicesHtml}
          </div>
        </div>

        <!-- Result area (hidden until choice) -->
        <div id="faction-result" style="display:none;"></div>

      </div>
    `;

    document.body.appendChild(overlay);

    // Wire up choice buttons
    overlay.querySelectorAll('.faction-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        handleChoice(event, idx, meters, overlay);
      });
    });
  }

  /* ── HANDLE CHOICE ── */
  function handleChoice(event, choiceIndex, currentMeters, overlay) {
    const choice  = event.choices[choiceIndex];
    const faction = FACTIONS[event.faction];

    // Apply meter changes
    const newMeters = {
      influence:   currentMeters.influence   + (choice.meters.influence   || 0),
      cityCorrupt: currentMeters.cityCorrupt + (choice.meters.cityCorrupt || 0),
      streetCred:  currentMeters.streetCred  + (choice.meters.streetCred  || 0),
    };
    saveMeters(newMeters);

    // Roll for bonus/penalty
    let bonusEv  = null;
    let penaltyEv = null;

    if (choice.bonus && Math.random() < (choice.bonusChance ?? BONUS_CHANCE)) {
      const poolItem = BONUS_EVIDENCE_POOL[choice.bonus.poolIndex];
      if (poolItem && !getBonuses().includes(poolItem.id)) {
        // Add to evidence locker
        const extras = JSON.parse(localStorage.getItem('col_evidence_extra') || '[]');
        if (!extras.find(e => e.id === poolItem.id)) {
          extras.push(poolItem);
          localStorage.setItem('col_evidence_extra', JSON.stringify(extras));
        }
        const statusMap = JSON.parse(localStorage.getItem('col_evidence_status') || '{}');
        statusMap[poolItem.id] = 'logged';
        localStorage.setItem('col_evidence_status', JSON.stringify(statusMap));
        addBonus(poolItem.id);
        bonusEv = poolItem;
      }
    }

    if (choice.penalty && Math.random() < (choice.penaltyChance ?? BONUS_CHANCE)) {
      addPenalty(choice.penalty.evidenceId, choice.penalty.reason);
      penaltyEv = choice.penalty;
    }

    // Build result panel
    const meterChangesHtml = buildMeterChangeSummary(currentMeters, newMeters);

    const bonusHtml = bonusEv ? `
      <div style="margin-top:10px;padding:10px 12px;
        background:rgba(58,154,90,.1);border:1px solid rgba(58,154,90,.35);">
        <span style="font-size:clamp(7px,.82vw,9px);letter-spacing:.25em;text-transform:uppercase;
          color:#3a9a5a;display:block;margin-bottom:4px;">✦ New Evidence Unlocked</span>
        <span style="font-size:clamp(10px,1.3vw,12px);color:#d8c8a8;">${bonusEv.name}</span>
        <span style="font-size:clamp(8px,1vw,10px);color:rgba(168,150,100,.55);display:block;margin-top:2px;">
          Now available in your Evidence Locker
        </span>
      </div>
    ` : '';

    const penaltyHtml = penaltyEv ? `
      <div style="margin-top:10px;padding:10px 12px;
        background:rgba(196,48,48,.1);border:1px solid rgba(196,48,48,.35);">
        <span style="font-size:clamp(7px,.82vw,9px);letter-spacing:.25em;text-transform:uppercase;
          color:#c43030;display:block;margin-bottom:4px;">⚠ Evidence Flagged Inadmissible</span>
        <span style="font-size:clamp(10px,1.3vw,12px);color:#d8c8a8;">${penaltyEv.evidenceId}</span>
        <span style="font-size:clamp(8px,1vw,10px);color:rgba(196,80,80,.7);display:block;margin-top:2px;">
          ${penaltyEv.reason}
        </span>
      </div>
    ` : '';

    // Replace choices with result
    const choicesWrap = overlay.querySelector('#faction-choices-wrap');
    const resultDiv   = overlay.querySelector('#faction-result');

    choicesWrap.style.display = 'none';
    resultDiv.style.display   = 'block';
    resultDiv.className       = 'faction-result-enter';
    resultDiv.innerHTML = `
      <div style="padding:clamp(12px,2vw,18px);background:rgba(168,131,46,.06);
        border:1px solid rgba(168,131,46,.2);margin-bottom:10px;">
        <span style="font-size:clamp(7px,.82vw,9px);letter-spacing:.3em;text-transform:uppercase;
          color:rgba(168,131,46,.6);display:block;margin-bottom:6px;">Outcome</span>
        <p style="font-size:clamp(10px,1.3vw,13px);color:rgba(168,150,100,.8);line-height:1.7;">
          ${choice.outcome}
        </p>
      </div>
      <div style="margin-bottom:10px;">
        <span style="font-size:clamp(7px,.82vw,9px);letter-spacing:.3em;text-transform:uppercase;
          color:rgba(168,131,46,.5);display:block;margin-bottom:8px;">Meter Changes</span>
        ${meterChangesHtml}
      </div>
      ${bonusHtml}
      ${penaltyHtml}
      <button onclick="closeFactionModal()" style="
        width:100%;margin-top:14px;
        font-family:'Courier Prime',monospace;
        font-size:clamp(9px,1.2vw,11px);letter-spacing:.25em;text-transform:uppercase;
        padding:clamp(10px,1.8vw,14px);
        background:rgba(168,131,46,.1);color:rgba(168,131,46,.8);
        border:1px solid rgba(168,131,46,.3);cursor:pointer;
        transition:background .2s,border-color .2s;
      "
      onmouseover="this.style.background='rgba(168,131,46,.2)';this.style.borderColor='rgba(168,131,46,.6)'"
      onmouseout="this.style.background='rgba(168,131,46,.1)';this.style.borderColor='rgba(168,131,46,.3)'">
        Acknowledge &amp; Continue
      </button>
    `;
  }

  /* ── CLOSE MODAL ── */
  window.closeFactionModal = function() {
    document.getElementById('faction-event-overlay')?.remove();
    isModalOpen = false;
    scheduleNext();
  };

  /* ── METER DISPLAY HELPERS ── */
  function buildMeterDisplay(meters) {
    return `
      <div style="flex:1;text-align:center;">
        <span style="font-size:clamp(6px,.72vw,8px);letter-spacing:.25em;text-transform:uppercase;
          color:rgba(168,131,46,.4);display:block;margin-bottom:2px;">Influence</span>
        <span style="font-size:clamp(12px,1.8vw,16px);font-weight:700;color:#c43030;">${meters.influence}</span>
      </div>
      <div style="width:1px;background:rgba(168,131,46,.15);flex-shrink:0;"></div>
      <div style="flex:1;text-align:center;">
        <span style="font-size:clamp(6px,.72vw,8px);letter-spacing:.25em;text-transform:uppercase;
          color:rgba(168,131,46,.4);display:block;margin-bottom:2px;">City Corrupt.</span>
        <span style="font-size:clamp(12px,1.8vw,16px);font-weight:700;color:#4080c0;">${meters.cityCorrupt}</span>
      </div>
      <div style="width:1px;background:rgba(168,131,46,.15);flex-shrink:0;"></div>
      <div style="flex:1;text-align:center;">
        <span style="font-size:clamp(6px,.72vw,8px);letter-spacing:.25em;text-transform:uppercase;
          color:rgba(168,131,46,.4);display:block;margin-bottom:2px;">Street Cred</span>
        <span style="font-size:clamp(12px,1.8vw,16px);font-weight:700;color:#3a9a5a;">${100 - meters.cityCorrupt}</span>
      </div>
    `;
  }

  function buildMeterLines(changes, currentMeters) {
    const pills = [];
    const labels = { influence:'Influence', cityCorrupt:'City Corrupt.', streetCred:'Street Cred' };
    const colors = { influence:'#c43030',  cityCorrupt:'#4080c0',       streetCred:'#3a9a5a' };

    Object.entries(changes).forEach(([key, delta]) => {
      if (delta === 0) return;
      const sign  = delta > 0 ? '+' : '';
      const color = delta > 0
        ? (key === 'cityCorrupt' ? '#c43030' : '#3a9a5a')
        : (key === 'cityCorrupt' ? '#3a9a5a' : '#c43030');
      pills.push(`
        <span style="font-size:clamp(7px,.82vw,9px);letter-spacing:.15em;padding:2px 8px;
          border:1px solid ${color}40;color:${color};background:${color}14;
          white-space:nowrap;">
          ${labels[key]}: ${sign}${delta}
        </span>
      `);
    });

    // Always note streetCred inverse if cityCorrupt changes
    if (changes.cityCorrupt && changes.cityCorrupt !== 0 && !changes.streetCred) {
      const invDelta  = -changes.cityCorrupt;
      const sign      = invDelta > 0 ? '+' : '';
      const color     = invDelta > 0 ? '#3a9a5a' : '#c43030';
      pills.push(`
        <span style="font-size:clamp(7px,.82vw,9px);letter-spacing:.15em;padding:2px 8px;
          border:1px solid ${color}40;color:${color};background:${color}14;
          white-space:nowrap;opacity:.7;">
          Street Cred: ${sign}${invDelta} (inverse)
        </span>
      `);
    }

    return pills.join('');
  }

  function buildMeterChangeSummary(oldM, newM) {
    const rows = [
      { label:'Influence',    old:oldM.influence,   newV:newM.influence,   color:'#c43030' },
      { label:'City Corrupt.',old:oldM.cityCorrupt, newV:newM.cityCorrupt, color:'#4080c0' },
      { label:'Street Cred', old:100-oldM.cityCorrupt, newV:100-newM.cityCorrupt, color:'#3a9a5a' },
    ];
    return rows.map(r => {
      const delta = r.newV - r.old;
      const sign  = delta > 0 ? '+' : '';
      const dColor = delta > 0
        ? (r.label === 'City Corrupt.' ? '#c43030' : '#3a9a5a')
        : (r.label === 'City Corrupt.' ? '#3a9a5a' : '#c43030');
      return `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
          <span style="font-size:clamp(7px,.82vw,9px);letter-spacing:.2em;text-transform:uppercase;
            color:rgba(168,131,46,.5);min-width:90px;">${r.label}</span>
          <span style="font-size:clamp(10px,1.3vw,12px);color:${r.color};min-width:28px;">${r.old}</span>
          <span style="font-size:10px;color:rgba(168,131,46,.3);">→</span>
          <span style="font-size:clamp(10px,1.3vw,12px);font-weight:700;color:${r.color};">${r.newV}</span>
          ${delta !== 0 ? `<span style="font-size:clamp(8px,1vw,10px);color:${dColor};font-weight:700;">(${sign}${delta})</span>` : ''}
        </div>
      `;
    }).join('');
  }

  /* ── INIT ── */
  function init() {
    // Don't run on index, settings, credits, codex
    const page = window.location.pathname.split('/').pop();
    const skipPages = ['index.html','settings.html','credits.html'];
    if (skipPages.includes(page)) return;

    // Start the timer
    scheduleNext();
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
