// ============================================================
// CITY OF LIES — GAME ENGINE
// ============================================================

const COL = {

  // ── GAME STATE ──────────────────────────────────────────
  state: {
    currentCase: 'case_01',
    discoveredEvidence: new Set(),
    interrogatedWitnesses: new Set(),
    watchedCCTV: new Set(),
    listenedAudio: new Set(),
    readDocuments: new Set(),
    caseNotes: [],
    theorySubmitted: false,
    theoryResult: null,
  },

  // ── SAVE / LOAD ──────────────────────────────────────────
  save() {
    const s = { ...this.state };
    s.discoveredEvidence = [...this.state.discoveredEvidence];
    s.interrogatedWitnesses = [...this.state.interrogatedWitnesses];
    s.watchedCCTV = [...this.state.watchedCCTV];
    s.listenedAudio = [...this.state.listenedAudio];
    s.readDocuments = [...this.state.readDocuments];
    localStorage.setItem('col_save', JSON.stringify(s));
  },

  load() {
    try {
      const raw = localStorage.getItem('col_save');
      if (!raw) return;
      const s = JSON.parse(raw);
      this.state.discoveredEvidence = new Set(s.discoveredEvidence || []);
      this.state.interrogatedWitnesses = new Set(s.interrogatedWitnesses || []);
      this.state.watchedCCTV = new Set(s.watchedCCTV || []);
      this.state.listenedAudio = new Set(s.listenedAudio || []);
      this.state.readDocuments = new Set(s.readDocuments || []);
      this.state.caseNotes = s.caseNotes || [];
      this.state.theorySubmitted = s.theorySubmitted || false;
      this.state.theoryResult = s.theoryResult || null;
    } catch(e) { console.warn('Save load failed', e); }
  },

  reset() {
    localStorage.removeItem('col_save');
    location.reload();
  },

  markEvidence(id) {
    this.state.discoveredEvidence.add(id);
    this.save();
    this.updatePins();
  },

  addNote(text) {
    this.state.caseNotes.push({ text, time: new Date().toLocaleTimeString() });
    this.save();
  },

  notify(msg, duration = 3000) {
    const el = document.getElementById('notification');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), duration);
  },

  updatePins() {
    // Update pin discovery indicators on corkboard if present
    document.querySelectorAll('.pin-note[data-evidence]').forEach(note => {
      const id = note.dataset.evidence;
      if (this.state.discoveredEvidence.has(id)) {
        note.classList.add('discovered');
      }
    });
  },

  // ── CASE DATA ────────────────────────────────────────────
  cases: {
    case_01: {
      id: 'case_01',
      title: 'The Whitmore Affair',
      subtitle: 'A City of Lies Investigation',
      tagline: 'In Vesper City, every secret has a price.',
      status: 'ACTIVE',

      // ── SUSPECTS ──
      suspects: [
        {
          id: 'suspect_01',
          name: 'Councilman Aldric Whitmore',
          portrait: 'Suspect #1 portrait',
          role: 'City Council Chairman',
          age: 58,
          powerful: true,
          powerLevel: 'HIGH',
          description: 'Twenty-year veteran of Vesper City politics. Known for backroom deals and iron control of the city planning committee. Whitmore approved three major rezoning permits in the past year — all benefiting the same shell corporation.',
          motive: 'Conceal financial corruption and illegal land deals worth $40 million.',
          alibi: 'Claims to have been attending a charity gala at the Meridian Hotel from 8pm to midnight.',
          alibiSupport: 'Partial — verified present at gala until 9:47pm. Whereabouts after unknown.',
          knownAssociates: ['Suspect #4', 'Witness #2', 'Witness #7'],
        },
        {
          id: 'suspect_02',
          name: 'Renata Voss',
          portrait: 'Suspect #2 portrait',
          role: 'Private Security Contractor',
          age: 41,
          powerful: false,
          powerLevel: 'LOW',
          description: 'Former military intelligence. Now runs a private security firm with ties to Whitmore\'s office. Voss has a history of making problems disappear — legally and otherwise.',
          motive: 'Eliminate a journalist who had obtained evidence of her involvement in contract fraud.',
          alibi: 'Claims to have been at her office reviewing security footage until 11pm.',
          alibiSupport: 'Unverified — no witnesses. Office keycard log shows entry at 8:12pm.',
          knownAssociates: ['Suspect #1', 'Suspect #5'],
        },
        {
          id: 'suspect_03',
          name: 'Deputy Mayor Conrad Hale',
          portrait: 'Suspect #3 portrait',
          role: 'Deputy Mayor of Vesper City',
          age: 52,
          powerful: true,
          powerLevel: 'VERY HIGH',
          description: 'Whitmore\'s political protege. Hale manages the city\'s infrastructure budget and has systematically redirected funds to projects tied to Whitmore\'s network. Ambitious, calculating, and deeply connected.',
          motive: 'Prevent exposure of a decade-long embezzlement scheme before his mayoral campaign.',
          alibi: 'Claims to have been home with his family all evening.',
          alibiSupport: 'Wife confirms — but phone records show 14 calls to an unregistered number between 9pm and midnight.',
          knownAssociates: ['Suspect #1', 'Witness #5', 'Witness #9'],
        },
        {
          id: 'suspect_04',
          name: 'Marcus Theel',
          portrait: 'Suspect #4 portrait',
          role: 'Real Estate Developer',
          age: 46,
          powerful: false,
          powerLevel: 'MEDIUM',
          description: 'Theel Construction is the primary beneficiary of Whitmore\'s rezoning approvals. Theel is ruthless in business and has a prior conviction for bribery charges that were mysteriously dropped in 2019.',
          motive: 'Silence anyone threatening to expose his illegal arrangement with Whitmore.',
          alibi: 'Claims he was on a flight to Harrington City.',
          alibiSupport: 'Flight manifest confirmed — but departure was at 11:45pm. Window of 3+ hours unaccounted for.',
          knownAssociates: ['Suspect #1', 'Witness #3'],
        },
        {
          id: 'suspect_05',
          name: 'Lena Dray',
          portrait: 'Suspect #5 portrait',
          role: 'Fixer / Intelligence Broker',
          age: 38,
          powerful: false,
          powerLevel: 'MEDIUM',
          description: 'Known in certain circles as "the Accountant." Dray specializes in information — buying it, selling it, and occasionally destroying it. Her client list reads like a who\'s who of Vesper City corruption.',
          motive: 'Protect a high-value client whose identity is buried in the victim\'s files.',
          alibi: 'Claims to have been dining at Castelo Restaurant until closing.',
          alibiSupport: 'Staff confirm she was present — but she left at 9:20pm, not 11pm as claimed.',
          knownAssociates: ['Suspect #2', 'Suspect #3'],
        },
      ],

      // ── VICTIM ──
      victim: {
        name: 'Joel Cassidy',
        portrait: 'Witness #1 portrait',
        role: 'Investigative Journalist, Vesper City Tribune',
        age: 34,
        description: 'Cassidy had been working a story on city corruption for eight months. Found dead in the Meridian Parking Garage at approximately 10:15pm. Official cause of death: blunt force trauma. His laptop and recorder were missing from the scene.',
        lastKnownLocation: 'Meridian Hotel — attended the charity gala as press.',
      },

      // ── WITNESSES ──
      witnesses: [
        {
          id: 'witness_02',
          number: 2,
          name: 'Eloise Graves',
          portrait: 'Witness #2 portrait',
          role: 'Event Coordinator, Meridian Hotel',
          description: 'Managed the charity gala. Nervous, cooperative, clearly hiding something minor.',
        },
        {
          id: 'witness_03',
          number: 3,
          name: 'Terrance Webb',
          portrait: 'Witness #3 portrait',
          role: 'Parking Garage Attendant',
          description: 'Was on duty the night of the incident. Saw multiple vehicles enter and exit. Initially gave a different story to police.',
        },
        {
          id: 'witness_05',
          number: 5,
          name: 'Sasha Mirin',
          portrait: 'Witness #5 portrait',
          role: 'Cassidy\'s Editor, Vesper City Tribune',
          description: 'Last person to speak with Cassidy before his death. Received a partial voicemail at 10:02pm.',
        },
        {
          id: 'witness_07',
          number: 7,
          name: 'Dmitri Vane',
          portrait: 'Witness #7 portrait',
          role: 'Whitmore\'s Personal Driver',
          description: 'Drove Whitmore to the gala and was instructed to wait. Claims he waited the entire evening without interruption.',
        },
        {
          id: 'witness_09',
          number: 9,
          name: 'Officer Carla Reese',
          portrait: 'Witness #9 portrait',
          role: 'First Responding Officer, VPD',
          description: 'Arrived at the scene at 10:31pm. Filed the initial report. Off-the-record, expressed concern that the crime scene was disturbed before her arrival.',
        },
        {
          id: 'witness_12',
          number: 12,
          name: 'Unknown Contact',
          portrait: 'Witness #12 portrait',
          role: 'Anonymous — identity unknown',
          description: 'Left the anonymous tip recording. Voice has been digitally altered.',
        },
      ],

      // ── LOCATIONS ──
      locations: [
        { id: 'loc_01', name: 'Meridian Hotel Parking Garage', description: 'Scene of the crime. Multi-level structure adjacent to the hotel. CCTV covers levels B1 and B2 only.' },
        { id: 'loc_02', name: 'Hotel Office Hallway', description: 'Service corridor connecting the gala ballroom to the parking garage stairwell.' },
        { id: 'loc_03', name: 'Rooftop Access', description: 'Roof of the Meridian Hotel. Fire exit accessed via stairwell B. Keypad entry — log shows access at 9:58pm.' },
        { id: 'loc_04', name: 'Alleyway (East Side)', description: 'Alley behind the hotel. Secondary exit. Used by service staff and, apparently, others.' },
      ],

      // ── METHODS ──
      methods: [
        { id: 'method_01', name: 'Premeditated Ambush', description: 'Planned in advance. Perpetrator knew Cassidy\'s movements and waited.' },
        { id: 'method_02', name: 'Hired Contract', description: 'Perpetrator paid a third party to carry out the act.' },
        { id: 'method_03', name: 'Crime of Opportunity', description: 'Unplanned confrontation that escalated.' },
        { id: 'method_04', name: 'Staged Accident', description: 'Designed to look like an accident or robbery gone wrong.' },
      ],

      // ── CCTV FOOTAGE ──
      cctv: [
        {
          id: 'cctv_01',
          file: 'cctv_01_parking_garage.mp4',
          location: 'Meridian Hotel — Parking Garage Level B1',
          timestamp: '21:44 — 22:18',
          duration: '34 minutes',
          quality: 'DEGRADED',
          description: 'Camera covers the main entrance ramp and elevator bank. Footage shows a dark-colored sedan entering at 21:52 with no visible plates. Driver does not exit for 11 minutes. At 22:03, a figure matching Cassidy\'s description enters from the stairwell. At 22:07, the sedan\'s door opens. Footage becomes corrupted from 22:07 to 22:14.',
          anomaly: 'Seven-minute corruption window coincides precisely with the estimated time of death. Corruption pattern is consistent with signal interference — not camera malfunction.',
          evidence_ids: ['ev_cctv_01'],
        },
        {
          id: 'cctv_02',
          file: 'cctv_02_office_hallway.mp4',
          location: 'Meridian Hotel — Service Corridor, Level 2',
          timestamp: '21:30 — 22:30',
          duration: '60 minutes',
          quality: 'CLEAR',
          description: 'Covers the service hallway connecting the ballroom to stairwell B. At 21:47, Councilman Whitmore is visible walking toward stairwell B — alone, without his driver. He does not return via this corridor. At 22:19, an unidentified figure in a hotel staff uniform walks toward the ballroom.',
          anomaly: 'Whitmore\'s departure contradicts his driver\'s statement that Whitmore never left the ballroom. The staff uniform figure\'s gait matches Suspect #5\'s profile.',
          evidence_ids: ['ev_cctv_02'],
        },
        {
          id: 'cctv_03',
          file: 'cctv_03_rooftop_access.mp4',
          location: 'Meridian Hotel — Rooftop Stairwell Exit',
          timestamp: '21:55 — 22:25',
          duration: '30 minutes',
          quality: 'PARTIAL',
          description: 'Camera covers the rooftop access door. At 21:58, the door opens from inside — keypad entry. A figure exits and makes a phone call. Call duration approximately 4 minutes. Figure re-enters at 22:03. Face not visible — hood up.',
          anomaly: 'Keypad log records badge ID 4471 at 21:58. Badge 4471 is registered to Renata Voss\'s security firm. Voss claims she was at her office at this time.',
          evidence_ids: ['ev_cctv_03'],
        },
        {
          id: 'cctv_04',
          file: 'cctv_04_alleyway.mp4',
          location: 'East Alleyway — Behind Meridian Hotel',
          timestamp: '22:05 — 22:40',
          duration: '35 minutes',
          quality: 'LOW',
          description: 'Low-resolution camera covers the alley\'s service entrance. At 22:11, two figures exit via the fire door. One appears to carry a bag. They separate — one enters a waiting vehicle; the other walks east on foot. Vehicle departs at 22:14.',
          anomaly: 'Vehicle matches the description of a car registered to a shell company linked to Marcus Theel. The pedestrian figure\'s height and build match Witness #7 — Whitmore\'s driver — who claimed to have waited in the hotel parking structure all evening.',
          evidence_ids: ['ev_cctv_04'],
        },
      ],

      // ── AUDIO FILES ──
      audio: [
        {
          id: 'audio_01',
          file: 'voicemail_01.wav',
          source: 'Cassidy\'s phone — voicemail left for editor Sasha Mirin',
          timestamp: '22:02:17',
          duration: '1 min 43 sec',
          transcript: '"Sasha — it\'s Joel. I have it. The whole thing. Names, numbers, transfers. The rezoning deal goes all the way to the top — I mean the very top. Whitmore isn\'t just taking bribes, he\'s been laundering through Theel\'s shell companies for years. I have the wire records. I\'m sending you the encrypted file tonight. If something happens to me..." [14-second silence] "...the password is the date of the Aldgate Bridge opening. Don\'t lose it." [call ends]',
          anomaly: 'A 14-second silence at 22:02:44. During this window, audio analysis reveals ambient noise consistent with a parking garage — tire echo, distant ventilation hum. Suggests Cassidy heard or saw something alarming.',
          spectrogram_id: 'spec_a',
          evidence_ids: ['ev_audio_01'],
        },
        {
          id: 'audio_02',
          file: 'radio_intercept_02.wav',
          source: 'Intercepted encrypted radio channel — attributed to private security frequency',
          timestamp: '21:49:03',
          duration: '38 sec',
          transcript: '"Package is mobile. Confirm exit route." [static] "B-level. East door. Have the car ready." [static] "Understood. Clean sweep after." [transmission ends]',
          anomaly: 'Voice analysis identifies two distinct speakers. Speaker A matches vocal pattern database entry for Renata Voss with 74% confidence. Speaker B is unidentified. The phrase "clean sweep after" suggests post-incident cleanup was planned.',
          spectrogram_id: 'spec_b',
          evidence_ids: ['ev_audio_02'],
        },
        {
          id: 'audio_03',
          file: 'anonymous_tip_03.wav',
          source: 'Anonymous call to the Vesper City Tribune tip line',
          timestamp: '23:15:44 (night of incident)',
          duration: '52 sec',
          transcript: '"You want the Whitmore story? Check the parking garage CCTV before it disappears. Level B1, 10 o\'clock. Someone knew he was there. Someone told them. Look at who left the ballroom at 9:47. And look at who was already in that garage before Cassidy arrived." [call ends without identification]',
          anomaly: 'Voice has been digitally pitch-shifted. However, the cadence and phrasing analysis suggests a female speaker, mid-30s to mid-40s. Background noise includes faint typing and air conditioning consistent with an office environment.',
          spectrogram_id: 'spec_c',
          evidence_ids: ['ev_audio_03'],
        },
      ],

      // ── SPECTROGRAMS ──
      spectrograms: [
        {
          id: 'spec_a',
          label: 'SPECTROGRAM A',
          audio_ref: 'voicemail_01.wav',
          visual: 'Dense blue-green frequency bands in the 200–800Hz vocal range for the first 82 seconds. At the 82-second mark (timestamp 22:02:44), all vocal frequencies drop abruptly to near-zero. A faint but distinct rhythmic pulse appears in the 40–60Hz low-frequency band — three beats, evenly spaced at approximately 0.8-second intervals. The silence window spans 14 seconds before vocal frequencies resume. In the final 7 seconds of the recording, a subtle harmonic distortion overlays the vocal track — consistent with an external microphone picking up a second audio source.',
          hidden_clue: 'The three low-frequency pulses at 22:02:44 match the acoustic signature of a car door closing in an enclosed concrete space. Timing places a vehicle arrival or departure coinciding with Cassidy\'s moment of alarm. The harmonic distortion in the final seconds suggests a second voice was present — too far from the mic to be captured clearly.',
          investigator_notes: 'The silence is not a network drop — vocal bands resume cleanly, indicating deliberate silence. The LF pulses suggest Cassidy was reacting to something physical in his environment. The faint secondary harmonic in the closing seconds may be recoverable with enhanced audio processing.',
        },
        {
          id: 'spec_b',
          label: 'SPECTROGRAM B',
          audio_ref: 'radio_intercept_02.wav',
          visual: 'Narrow-band transmission typical of encrypted radio — compressed frequency range of 300–3400Hz with hard upper and lower cutoffs. Two distinct vocal signatures appear in alternating bands: Speaker A displays consistently higher fundamental frequency (~180Hz) with smooth formant transitions; Speaker B shows a lower fundamental (~130Hz) with irregular formant spikes suggesting stress or deliberate vocal masking. At 21:49:31, a brief unencrypted bleed appears in the 4–6kHz range lasting 0.3 seconds — a carrier signal artifact that was not successfully suppressed.',
          hidden_clue: 'The carrier signal bleed at 21:49:31 contains a partial frequency fingerprint matching the encrypted comms system used by Voss Security Solutions — the same system documented in a seized equipment manifest from a 2021 VPD investigation. Speaker B\'s irregular formant spikes are consistent with someone speaking through a voice modulator — but the spikes reveal the underlying fundamental frequency.',
          investigator_notes: 'The 0.3-second carrier bleed is the key finding. It ties this transmission to Voss\'s known equipment. Speaker B\'s voice modulation is competent but imperfect — a forensic voice specialist could potentially reconstruct the unmasked fundamental from the formant spike pattern.',
        },
        {
          id: 'spec_c',
          label: 'SPECTROGRAM C',
          audio_ref: 'anonymous_tip_03.wav',
          visual: 'Uniform pitch-shift applied across the full vocal range — fundamental frequency artificially raised approximately 80Hz above natural. Despite the shift, the speaker\'s natural prosodic rhythm (stress patterns, pausing cadence) remains intact. Background frequencies in the 8–12kHz range show a consistent cyclic pattern — 0.6-second on, 1.2-second off — beginning at the 4-second mark and continuing throughout. At 00:38 in the recording, a brief acoustic anomaly appears: a sharp 2kHz spike lasting 0.08 seconds, consistent with a notification alert from a nearby device.',
          hidden_clue: 'The cyclic background pattern at 8–12kHz is consistent with a specific model of HVAC system used in Vesper City municipal and commercial buildings. Cross-referenced with building management records, this pattern matches units installed in the Whitmore Building — Vesper City\'s government administrative complex. The notification spike at 00:38 has a frequency profile matching the default alert tone of encrypted government-issue communication devices.',
          investigator_notes: 'The caller is likely calling from inside a government building — possibly the Whitmore Building itself. The notification alert suggests they received a message mid-call, possibly confirming their information was being acted upon. The consistent prosodic rhythm despite pitch-shifting narrows the speaker profile significantly.',
        },
        {
          id: 'spec_d',
          label: 'SPECTROGRAM D',
          audio_ref: 'Composite — derived from CCTV_01 ambient audio track',
          visual: 'Extracted from the parking garage CCTV footage\'s ambient audio channel. For the first 23 minutes, the spectrogram shows a stable low-frequency environment: ventilation at 60Hz, distant traffic at 80–120Hz, occasional tire-on-concrete impacts. At 22:03:14, footsteps register as sharp percussive spikes in the 200–400Hz range — two distinct gait patterns. At 22:07:02 (the start of the footage corruption), the audio channel does not corrupt — it continues recording. A sharp 1.2kHz spike at 22:07:02 is followed by a 340Hz tonal hum for 6.8 seconds, then silence.',
          hidden_clue: 'The audio track survived the video corruption — because they are on separate channels. The 1.2kHz spike at 22:07:02 is consistent with a high-voltage electrical discharge — possibly from a stun device. The 340Hz hum for 6.8 seconds is within the frequency range of a vehicle idling in a confined space. This places an active vehicle inside the garage during the corruption window.',
          investigator_notes: 'This is critical: the video was corrupted but the audio was not. The stun device signature followed immediately by an idling vehicle strongly suggests the assault occurred at exactly 22:07:02. The two gait patterns captured at 22:03:14 confirm both Cassidy and another individual were present before the assault.',
        },
      ],

      // ── DOCUMENTS ──
      documents: [
        {
          id: 'doc_01',
          title: 'Incident Report — VPD Case #4471-B',
          type: 'POLICE REPORT',
          author: 'Officer Carla Reese, Badge #1147',
          date: 'Filed: Day of incident, 01:14am',
          classification: 'STANDARD',
          content: `VESPER CITY POLICE DEPARTMENT
INCIDENT REPORT — CASE #4471-B

Reporting Officer: C. Reese, Badge #1147
Incident Type: Homicide (Suspicious Death)
Location: Meridian Hotel Parking Garage, Level B1
Time of Report: 01:14am

SUMMARY:
At approximately 22:31, this officer received a dispatch call reporting a body discovered at the above location. Upon arrival at 22:31, the scene had already been accessed by hotel security staff.

SCENE OBSERVATIONS:
Victim identified as Joel Cassidy, 34, press credentials for Vesper City Tribune found on person. Victim was found between vehicles in row C, Level B1. Blunt force trauma to the posterior cranium. No weapon recovered. Victim's shoulder bag was absent — Tribune press lanyard present but badge missing.

NOTE: This officer observed prior to securing the scene that vehicle in Bay C-14 (dark sedan) had been recently moved — tire marks in dust inconsistent with static parking. Bay C-14 is directly adjacent to the body's location.

Personal effects recovered: wallet (cash and cards intact — not a robbery), phone (screen cracked, found 8 feet from body), hotel event wristband.

ANOMALY:
Scene was disturbed prior to this officer's arrival. Hotel security supervisor Dmitri Vane was present at scene when officer arrived — Vane is employed as personal driver to Councilman Aldric Whitmore. When asked how he became aware of the body, Vane stated he "heard something." When asked to clarify, Vane declined further comment and requested to contact his attorney.

PRELIMINARY DETERMINATION:
Suspicious death. Homicide investigation recommended.

— Officer C. Reese`,
          evidence_ids: ['ev_doc_01'],
        },
        {
          id: 'doc_02',
          title: 'Financial Summary — Theel Construction Shell Network',
          type: 'FINANCIAL DOCUMENT',
          author: 'Source: Anonymous — delivered to Tribune offices',
          date: 'Received: Three days before incident',
          classification: 'SENSITIVE',
          content: `CONFIDENTIAL FINANCIAL SUMMARY
Compiled from: Public records, leaked internal documents, wire transfer logs

THEEL CONSTRUCTION — SHELL NETWORK OVERVIEW

Primary Entity: Theel Construction LLC (Vesper City)
Shell Layer 1: Meridian Development Partners LP (registered: Cayman Islands)
Shell Layer 2: Vespra Holdings Inc (registered: Delaware)
Shell Layer 3: Aldgate Infrastructure Fund (registered: British Virgin Islands)

FLOW OF FUNDS (2019–2023):
City infrastructure contracts awarded to Theel Construction: $127,400,000
Payments routed to Meridian Development Partners: $43,200,000
Payments routed to Vespra Holdings: $19,800,000
Final destination — Aldgate Infrastructure Fund: $38,600,000

POLITICAL CONNECTIONS:
Rezoning approvals authorizing Theel's projects were signed by:
- Councilman Aldric Whitmore (x7 approvals, 2020–2023)
- Deputy Mayor Conrad Hale (x3 infrastructure sign-offs, 2021–2023)

IDENTIFIED PERSONAL ACCOUNTS RECEIVING DISTRIBUTIONS:
[REDACTED — documents obtained are partial]
Account ending 4471: $2,100,000 (2022–2023)
Account ending 8823: $890,000 (2021–2023)

NOTE FROM SOURCE:
"These are the ones I could verify. There are more. The account ending 4471 is the one that leads to the top. Follow the Aldgate Bridge opening date."`,
          evidence_ids: ['ev_doc_02'],
        },
        {
          id: 'doc_03',
          title: 'Hotel Keycard Access Log — Night of Incident',
          type: 'SECURITY LOG',
          author: 'Meridian Hotel Security System',
          date: 'Night of incident',
          classification: 'EVIDENCE',
          content: `MERIDIAN HOTEL — ELECTRONIC ACCESS LOG
Date: [Night of incident]
Extracted by: VPD Digital Forensics Unit

STAIRWELL B — ACCESS LOG (18:00 – 24:00)
19:14  Badge: STAFF-0012  [IN — from Level 1]
19:41  Badge: STAFF-0012  [OUT — to Level 1]
20:03  Badge: GUEST-1847  [IN — from Level 2]
20:03  Badge: GUEST-1847  [OUT — to Level 1]
21:47  Badge: GUEST-1847  [IN — from Level 2]
[NO EXIT RECORDED FOR GUEST-1847 AFTER 21:47]
21:58  Badge: EXT-4471    [IN — Rooftop Level, external]
22:03  Badge: EXT-4471    [OUT — Rooftop Level, external]
22:19  Badge: STAFF-0031  [IN — from Level 1]
22:19  Badge: STAFF-0031  [OUT — to Level 2]

NOTES:
GUEST-1847: Registered to Joel Cassidy (Tribune Press Pass)
EXT-4471: External contractor badge — registered to Voss Security Solutions
STAFF-0031: Hotel housekeeping staff — verified present at gala

ANOMALY FLAGGED BY SYSTEM:
Guest badge 1847 entered stairwell B at 21:47 with no recorded exit. Badge was recovered from victim at scene (cracked). Either: (a) exit was not registered due to badge damage, or (b) victim did not exit via badged entry point — consistent with body being found on Level B1 (garage), which has no badge reader on the garage-side door.`,
          evidence_ids: ['ev_doc_03'],
        },
        {
          id: 'doc_04',
          title: 'Cassidy\'s Encrypted File — Partial Decrypt',
          type: 'JOURNALIST\'S NOTES',
          author: 'Joel Cassidy',
          date: 'Last modified: Day of incident, 17:43',
          classification: 'CRITICAL',
          content: `[PARTIAL DECRYPT — password confirmed via voicemail reference]
[FILE: WHITMORE_FINAL_DRAFT.enc — 67% recovered]

WORKING TITLE: THE CITY THAT WHITMORE BUILT

Eight months. That's how long I've been working this story. And now I have everything.

The rezoning approvals aren't just corruption — they're the mechanism for a money laundering operation that makes the infrastructure budget look like pocket change. Whitmore isn't the architect. He's the front. The real money flows through Aldgate Infrastructure Fund, and the person controlling Aldgate isn't on any public record I've found.

What I know for certain:
1. Theel Construction is a pass-through. The profits go somewhere else.
2. Account 4471 belongs to someone with access to the city's financial systems at the highest level.
3. Renata Voss isn't just a security contractor — she's the operational arm. She makes sure people who get too close don't stay that way.
4. There's a name I keep finding in the margins of everything. Not Whitmore. Not Theel. Someone above all of them.

[SECTION CORRUPTED — 847 bytes unrecoverable]

I spoke to someone inside today. They confirmed the account. They said if the story runs, it ends careers. Possibly more than careers.

I'm meeting a source tonight at the Meridian. If I'm right about what they're bringing me, this story runs tomorrow morning and the city changes forever.

If I'm wrong about who I can trust... 

[FILE ENDS — remaining 33% not recovered]`,
          evidence_ids: ['ev_doc_04'],
        },
      ],

      // ── INTERROGATIONS ──
      interrogations: [
        {
          id: 'interrog_witness_03',
          subject_id: 'witness_03',
          subject_name: 'Terrance Webb',
          subject_role: 'Parking Garage Attendant',
          portrait: 'Witness #3 portrait',
          personality: 'Working-class, mid-50s. Initially cooperative but becomes evasive on specific details. Shows clear signs of fear — not guilt. Likely intimidated or coerced into his original police statement. Responds well to empathy, poorly to aggression.',
          questions: [
            {
              q: 'Mr. Webb, what time did you begin your shift that evening?',
              a: 'Six o\'clock. Same as always. I\'ve done Tuesday nights for three years.',
              lie_detector: { hr: '72 bpm — stable', stress: 'LOW', truth: '94%', interpretation: 'Consistent physiological baseline. High probability of truthfulness.' },
            },
            {
              q: 'Did you notice anything unusual about the vehicles entering the garage that evening?',
              a: 'It was a busy night — the gala. Lots of town cars, SUVs. Nothing that stood out.',
              lie_detector: { hr: '78 bpm — slight elevation', stress: 'MILD', truth: '71%', interpretation: 'Minor stress response. Possible omission — subject may have noticed something but is underreporting.' },
            },
            {
              q: 'You told police that you did not see a dark-colored sedan enter between 9:45 and 10pm. Is that accurate?',
              a: 'I — yeah. I didn\'t see any sedan. I was on a break around that time.',
              lie_detector: { hr: '91 bpm — significant elevation', stress: 'HIGH', truth: '23%', interpretation: 'Strong deception indicator. Heart rate spike on question delivery consistent with conscious withholding. Subject is likely lying about the sedan or the break.' },
            },
            {
              q: 'You took a break at that exact time. Did anyone ask you to take that break?',
              a: 'No. I just — it was a long shift. I needed a coffee.',
              lie_detector: { hr: '97 bpm — elevated', stress: 'HIGH', truth: '18%', interpretation: 'Continued deception. The specificity of the question has increased physiological response. Subject is concealing the origin of his break decision.' },
            },
            {
              q: 'Mr. Webb, I want to be clear — I\'m not here to implicate you. Someone put you in a difficult position that night. Who told you to look away?',
              a: '...I got a call. Before my shift. A man\'s voice. Said there was an envelope in my locker. Said my break was at 9:50 and I\'d forget I saw anything. The envelope had five hundred dollars and a number to call if I talked to police.',
              lie_detector: { hr: '84 bpm — settling', stress: 'MODERATE — decreasing', truth: '97%', interpretation: 'Significant stress reduction upon disclosure. Physiological profile consistent with relief. High confidence in truthfulness of this statement.' },
            },
            {
              q: 'Did you call that number after speaking to police?',
              a: 'No. I threw it away. I was scared. I still am.',
              lie_detector: { hr: '80 bpm — stable', stress: 'MODERATE', truth: '88%', interpretation: 'Consistent with truthfulness. Residual stress attributable to ongoing fear rather than deception.' },
            },
            {
              q: 'What did the man\'s voice sound like? Any detail you remember.',
              a: 'Smooth. Educated. Like a lawyer or a politician. He didn\'t threaten me — he just said it like it was the most normal thing in the world. That\'s what scared me most.',
              lie_detector: { hr: '76 bpm — stable', stress: 'LOW-MODERATE', truth: '95%', interpretation: 'Truthful account. The vocal description is consistent with known profiles of several persons of interest.' },
            },
          ],
        },
        {
          id: 'interrog_suspect_03',
          subject_id: 'suspect_03',
          subject_name: 'Deputy Mayor Conrad Hale',
          subject_role: 'Deputy Mayor of Vesper City',
          portrait: 'Suspect #3 portrait',
          personality: 'Polished, controlled, politically experienced. Treats interrogation as a PR exercise. Never directly answers questions — redirects, reframes, and deploys plausible deniability with practiced ease. Reacts with contempt to direct accusations. His tells are subtle: slightly increased blink rate, micro-pauses before named individuals.',
          questions: [
            {
              q: 'Deputy Mayor Hale, thank you for your time. Where were you between 9pm and midnight on the night in question?',
              a: 'As I\'ve already told the police, I was home with my family. My wife can confirm that. I find it remarkable that you\'re asking me the same questions as a common suspect.',
              lie_detector: { hr: '68 bpm — controlled', stress: 'LOW — artificially suppressed', truth: '52%', interpretation: 'Physiological control is deliberate. Low heart rate in this context indicates trained suppression rather than honesty. The alibi statement shows minimal variance — rehearsed.' },
            },
            {
              q: 'Your phone records show 14 calls to an unregistered number between 9pm and midnight. Who were you calling?',
              a: 'I make dozens of calls daily on secure lines related to city business. I\'m not going to discuss the operational details of government communications with a private investigator.',
              lie_detector: { hr: '74 bpm — small elevation', stress: 'MILD-MODERATE', truth: '41%', interpretation: 'Deflection response. The reference to "government communications" is a legal shield. Stress elevation suggests the calls are not routine business.' },
            },
            {
              q: 'Joel Cassidy had been investigating corruption tied to your office. Were you aware of his investigation?',
              a: 'Joel Cassidy was an aggressive reporter who pursued sensational stories. I was aware of his work in the same way any public official is aware of press activity.',
              lie_detector: { hr: '79 bpm — notable elevation', stress: 'MODERATE', truth: '33%', interpretation: 'Measurable deception. The phrasing "aware of his work" is carefully chosen. Stress response increases on "Joel Cassidy" — above baseline for a name that should be professionally inconsequential.' },
            },
            {
              q: 'Account number ending 4471 appears in documents linked to the Aldgate Infrastructure Fund. Does that number mean anything to you?',
              a: '...',
              lie_detector: { hr: '94 bpm — significant spike', stress: 'HIGH', truth: 'N/A — no verbal response', interpretation: 'CRITICAL RESPONSE. A 26 bpm spike on question delivery with no verbal answer. Subject chose silence over response — a significant deception indicator in itself. This number is directly meaningful to him.' },
            },
            {
              q: 'Did you have any contact with Renata Voss in the 48 hours before Cassidy\'s death?',
              a: 'Ms. Voss\'s firm provides security consulting to city government. Any contact would be entirely professional and entirely appropriate.',
              lie_detector: { hr: '88 bpm — elevated', stress: 'HIGH', truth: '29%', interpretation: 'Strong deception indicator. The question asked about contact — the answer confirmed contact while framing it as routine. Subject did not say he had no contact.' },
            },
            {
              q: 'Are you familiar with the shell company Aldgate Infrastructure Fund?',
              a: 'I\'m familiar with Aldgate as a legitimate infrastructure investment vehicle. I\'ve had no improper relationship with any of its affiliated entities.',
              lie_detector: { hr: '85 bpm — elevated', stress: 'HIGH', truth: '26%', interpretation: 'The qualifier "improper" is significant — it implies the relationship exists but he is characterizing its nature. Combined with high stress, this is likely a technically-crafted non-denial denial.' },
            },
            {
              q: 'Deputy Mayor, who was Cassidy going to expose? Was it you, or someone above even you?',
              a: 'This interview is over. Anything further goes through my attorney.',
              lie_detector: { hr: '91 bpm — sustained elevation', stress: 'HIGH — sustained', truth: 'N/A', interpretation: 'Termination of interview on this specific question is itself informative. Subject did not deny the premise — that there is someone above him in this structure.' },
            },
          ],
        },
      ],

      // ── EVIDENCE INDEX ──
      evidence: [
        { id: 'ev_cctv_01', label: 'CCTV — Parking Garage', type: 'VIDEO', critical: true },
        { id: 'ev_cctv_02', label: 'CCTV — Office Hallway', type: 'VIDEO', critical: true },
        { id: 'ev_cctv_03', label: 'CCTV — Rooftop Access', type: 'VIDEO', critical: false },
        { id: 'ev_cctv_04', label: 'CCTV — Alleyway', type: 'VIDEO', critical: false },
        { id: 'ev_audio_01', label: 'Voicemail — Cassidy to Mirin', type: 'AUDIO', critical: true },
        { id: 'ev_audio_02', label: 'Radio Intercept', type: 'AUDIO', critical: true },
        { id: 'ev_audio_03', label: 'Anonymous Tip', type: 'AUDIO', critical: false },
        { id: 'ev_doc_01', label: 'VPD Incident Report', type: 'DOCUMENT', critical: false },
        { id: 'ev_doc_02', label: 'Shell Network Financial Summary', type: 'DOCUMENT', critical: true },
        { id: 'ev_doc_03', label: 'Hotel Keycard Log', type: 'DOCUMENT', critical: true },
        { id: 'ev_doc_04', label: 'Cassidy\'s Encrypted Notes', type: 'DOCUMENT', critical: true },
      ],

      // ── SOLUTION ──
      solution: {
        culprit: 'suspect_03', // Deputy Mayor Conrad Hale
        location: 'loc_01',   // Parking Garage
        method: 'method_01',  // Premeditated Ambush
        powerLevel: 'VERY HIGH',
        explanation: `Deputy Mayor Conrad Hale orchestrated the murder of Joel Cassidy to prevent the publication of evidence tying him — and his network — to a decade-long embezzlement and money laundering operation running through Theel Construction and the Aldgate Infrastructure Fund. Account 4471, referenced in both the financial documents and Cassidy's encrypted notes, belongs to Hale. Whitmore was a willing participant but a lower-level player — a useful front. Hale used Voss as the operational layer, and used his political influence to arrange Whitmore's driver to clean the scene. The 14 phone calls on the night of the murder were coordinating the operation in real time.`,
        partialCredit: ['suspect_01', 'suspect_02', 'suspect_05'], // Whitmore, Voss, Dray — involved but not primary
        endings: {
          correct_expose: {
            title: 'Justice Served',
            stamp: 'CASE CLOSED',
            stampClass: 'stamp-green',
            text: 'You brought your evidence to the District Attorney. The case against Deputy Mayor Conrad Hale went to trial. Three months later, Hale was convicted on charges of conspiracy to commit murder, corruption, and money laundering. Whitmore resigned within the week. Voss fled the country — an international warrant remains active. The Tribune published Cassidy\'s story. Vesper City began the long, difficult process of rebuilding its institutions. You received no reward. No one thanked you. But for the first time in years, the city felt like it could breathe.',
          },
          correct_corrupt: {
            title: 'The Price of Silence',
            stamp: 'CASE BURIED',
            stampClass: 'stamp-amber',
            text: 'Hale\'s representative met you at a diner on the east side. The briefcase contained $200,000 and a warning. You walked away. The official verdict was robbery gone wrong. Cassidy\'s story was never published. Hale became Mayor two years later. You saw his inauguration on a bar TV, nursing a drink you couldn\'t taste. The city didn\'t change. Neither did you. But you\'re still alive — which is more than Cassidy got.',
          },
          wrong_expose: {
            title: 'The Wrong Man',
            stamp: 'CASE DISMISSED',
            stampClass: 'stamp-red',
            text: 'The case against your suspect collapsed within days. Evidence was circumstantial. The real perpetrator had time to destroy the remaining trail. Hale\'s office released a statement calling the investigation "a politically motivated witch hunt." Cassidy\'s case was quietly archived. The city moved on. You didn\'t.',
          },
          partial_expose: {
            title: 'Incomplete Truth',
            stamp: 'PARTIAL VERDICT',
            stampClass: 'stamp-amber',
            text: 'You identified part of the network — enough to bring down Whitmore and Voss. But Hale survived. He restructured his operation, cut the loose ends, and emerged politically stronger. The conviction of his associates was treated as proof that the system worked. It didn\'t. The head of the snake was still intact. Somewhere in Vesper City, the machine kept running.',
          },
        },
      },
    },
  },

  // ── CROSS-REFERENCE CONTRADICTIONS ──
  contradictions: [
    {
      id: 'contra_01',
      title: 'Witness #7 vs. CCTV Alleyway',
      type: 'ALIBI CONTRADICTION',
      severity: 'HIGH',
      description: 'Dmitri Vane (Witness #7 — Whitmore\'s driver) stated he waited in the hotel parking structure all evening without leaving. CCTV footage from the east alleyway (cctv_04) at 22:11 shows a figure matching Vane\'s height and build exiting the fire door. This directly contradicts his stated location.',
      evidence_a: 'ev_cctv_04',
      evidence_b: 'ev_doc_01',
    },
    {
      id: 'contra_02',
      title: 'Keycard Log vs. Voss Alibi',
      type: 'LOCATION CONTRADICTION',
      severity: 'HIGH',
      description: 'Renata Voss claims she was at her office at 21:58. Keycard access log (doc_03) records badge EXT-4471 — registered to Voss Security Solutions — accessing the Meridian Hotel rooftop at 21:58. Voss cannot be in two places simultaneously.',
      evidence_a: 'ev_doc_03',
      evidence_b: 'ev_cctv_03',
    },
    {
      id: 'contra_03',
      title: 'Spectrogram D vs. CCTV Corruption Window',
      type: 'TIMELINE EVIDENCE',
      severity: 'CRITICAL',
      description: 'The CCTV footage from the parking garage (cctv_01) suffers video corruption from 22:07–22:14. However, Spectrogram D (derived from the same footage\'s audio channel) shows the audio track remained active and recorded a 1.2kHz spike consistent with a stun device at 22:07:02, followed by an idling engine. The video corruption was selective — the audio was not suppressed.',
      evidence_a: 'ev_cctv_01',
      evidence_b: 'ev_audio_01',
    },
    {
      id: 'contra_04',
      title: 'Hale Phone Records vs. Home Alibi',
      type: 'ALIBI CONTRADICTION',
      severity: 'HIGH',
      description: 'Hale claims he was home all evening. Phone records show 14 calls to an unregistered number between 21:00 and midnight. The calls begin at 21:03 — before the incident — and continue through 23:47 — long after. This suggests active coordination, not a quiet evening at home.',
      evidence_a: 'ev_doc_01',
      evidence_b: 'ev_audio_02',
    },
    {
      id: 'contra_05',
      title: 'Cassidy Notes vs. Whitmore as Primary Suspect',
      type: 'NARRATIVE CONTRADICTION',
      severity: 'MODERATE',
      description: 'Cassidy\'s encrypted notes (doc_04) explicitly state "Whitmore isn\'t the architect. He\'s the front." and reference someone above Whitmore controlling account 4471. Treating Whitmore as the primary culprit contradicts the victim\'s own documented analysis of the conspiracy.',
      evidence_a: 'ev_doc_04',
      evidence_b: 'ev_doc_02',
    },
  ],
};

// ── NAVIGATION ──────────────────────────────────────────────
COL.goTo = function(screen) {
  window.location.href = screen;
};

COL.getCase = function() {
  return this.cases[this.state.currentCase];
};

// ── INIT ────────────────────────────────────────────────────
COL.init = function() {
  this.load();
  this.updatePins();
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => COL.init());

