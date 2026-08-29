/* ────────────────────────────────────────────────────────────────
   MYCO · client-side prompt catalogue
   ────────────────────────────────────────────────────────────────
   These are the chip prompts shown in the panel. The system prompt
   itself lives on the server (netlify/functions/myco-agent.js) so
   nobody can dump it via the client and the safety guardrails
   (no medical advice, no member data, no jailbreak) can't be
   overridden by editing the DOM.
   ──────────────────────────────────────────────────────────────── */
(function () {
  const CHIPS_BY_TAB = {
    default: [
      { label:'✦ Clean lab note',  prefix:'Please clean and structure this lab note into proper sections:\n\n' },
      { label:'⚗ Herb guidance',    prefix:'Recommend herbs and extraction method for: ' },
      { label:'◇ Ceremony arc',     prefix:'Suggest a ceremony arc for: '  },
      { label:'△ Improve the network', msg:'What concrete improvements would you suggest for the Spore Living Network — token economy, community features, upcoming events?' },
    ],
    calendar: [
      { label:'✦ Next event for me', msg:'What is the next event I could contribute to based on my node?' },
      { label:'◇ Ceremony framing',  prefix:'Frame a short pre-ceremony invocation for: ' },
      { label:'△ Coordination',      prefix:'Help me draft a logistics message for volunteers of: ' },
    ],
    shop: [
      { label:'⚗ Formula riff',      prefix:'Propose a variant on this Fungai Art formula: ' },
      { label:'◇ Pairing',            prefix:'Suggest a companion elixir + protocol for: ' },
      { label:'✦ Origin note',        prefix:'Write a short poetic origin note (2-3 lines) for: ' },
    ],
    exp: [
      { label:'◇ Dinner arc',        prefix:'Sketch a seven-movement tasting arc themed around: ' },
      { label:'✦ Sensory beat',      prefix:'One-sentence sensory description of this course: ' },
    ],
    admin: [
      { label:'△ Member insight',    msg:'Based on the visible activity, which members might need a gentle re-engagement message?' },
      { label:'◇ Sunday note',        prefix:'Draft this week\'s Sunday note to the network. Tone: ' },
    ],
  };

  // Hard client-side refuse patterns. Server also enforces — this is
  // extra polish so the request never leaves the browser.
  const CLIENT_REFUSE = [
    /diagnos(e|is)/i,
    /prescri(be|ption)/i,
    /cure my /i,
    /replace (my )?(doctor|medication|prescription)/i,
    /am i (safe|okay) to (take|combine)/i,
  ];

  function shouldClientRefuse(text) {
    if (!text) return null;
    for (const p of CLIENT_REFUSE) {
      if (p.test(text)) {
        return "MYCO can't give medical or diagnostic advice. For dosing questions with medications, talk to a herbalist or physician you trust. I can talk about traditions, extraction, ceremony framing.";
      }
    }
    return null;
  }

  window.MycoPrompts = {
    chipsFor(tab) {
      return CHIPS_BY_TAB[tab] || CHIPS_BY_TAB.default;
    },
    shouldClientRefuse,
  };
})();
