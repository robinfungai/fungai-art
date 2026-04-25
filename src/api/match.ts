// Standard Node/Express-style handler for Vite
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const answers = req.body;

    // Validate required fields
    if (!answers.body_pattern || !answers.organ_focus || !answers.spiritual_intention) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Match protocol
    const protocol_id = matchProtocol(answers);

    // Return result
    return res.status(200).json({
      protocol_id,
      message: `Matched protocol: ${PROTOCOLS.find((p) => p.id === protocol_id)?.name}`,
    });
  } catch (error) {
    console.error('Error in match function:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Matching Algorithm
function matchProtocol(answers: any): number {
  let scores = PROTOCOLS.map((protocol) => {
    let score = 0;

    // Body Pattern Match (40%)
    if (protocol.body_pattern_match.includes(answers.body_pattern || '')) {
      score += 40;
    }

    // Organ Focus Match (30%)
    const organMatches = (answers.organ_focus || []).filter((organ: string) =>
      protocol.organ_focus_match.includes(organ)
    ).length;
    score += (organMatches / Math.max((answers.organ_focus || []).length, 1)) * 30;

    // Spiritual Intention Match (20%)
    if (protocol.spiritual_qualities.includes(answers.spiritual_intention || '')) {
      score += 20;
    }

    // Lifestyle Fit (10%)
    if (protocol.lifestyle_fit.includes(answers.lifestyle || '')) {
      score += 10;
    }

    return { protocol, score };
  });

  // Safety filtering
  const hasSafetyFlags = answers.safety_flags && Object.values(answers.safety_flags).some((v: any) => v);
  if (hasSafetyFlags) {
    scores = scores.filter((item) => item.protocol.contraindications.length <= 2);
  }

  // Return highest scored protocol ID
  const best = scores.sort((a, b) => b.score - a.score)[0];
  return best?.protocol.id || 1;
}

// 8 Protocols
const PROTOCOLS = [
  {
    id: 1,
    name: 'The Nourisher',
    body_pattern_match: ['DEFICIENCY', 'PREVENTATIVE'],
    organ_focus_match: ['Energy, Immunity, Stamina', 'Grounding, Stability, Resilience'],
    spiritual_qualities: ['Surrender & Softness', 'Harmony & Balance'],
    lifestyle_fit: ['Slow, grounded, nature-connected', 'High stress, intense emotions'],
    contraindications: [],
  },
  {
    id: 2,
    name: 'The Clarifier',
    body_pattern_match: ['STAGNATION', 'PREVENTATIVE'],
    organ_focus_match: ['Creativity, Vision, Clarity', 'Grounding, Stability, Resilience'],
    spiritual_qualities: ['Clarity & Focus', 'Grounding & Stability'],
    lifestyle_fit: ['Sedentary, desk-bound, mentally intense'],
    contraindications: ['Pregnant or breastfeeding', 'High blood pressure'],
  },
  {
    id: 3,
    name: 'The Soother',
    body_pattern_match: ['EXCESS', 'PREVENTATIVE'],
    organ_focus_match: ['Sleep, Nerves, Mood', 'Grounding, Stability, Resilience'],
    spiritual_qualities: ['Surrender & Softness', 'Flow & Ease'],
    lifestyle_fit: ['High stress, intense emotions', 'Shift work / irregular sleep'],
    contraindications: [],
  },
  {
    id: 4,
    name: 'The Activator',
    body_pattern_match: ['DEFICIENCY', 'PREVENTATIVE'],
    organ_focus_match: ['Energy, Immunity, Stamina', 'Magnetism, Radiance, Activation'],
    spiritual_qualities: ['Courage & Activation', 'Radiance & Magnetism'],
    lifestyle_fit: ['Active, physical work, outdoor'],
    contraindications: ['Pregnant or breastfeeding', 'Anxiety disorder', 'High blood pressure'],
  },
  {
    id: 5,
    name: 'The Protector',
    body_pattern_match: ['PREVENTATIVE'],
    organ_focus_match: ['Energy, Immunity, Stamina', 'Grounding, Stability, Resilience'],
    spiritual_qualities: ['Harmony & Balance', 'Grounding & Stability'],
    lifestyle_fit: ['All lifestyles (foundational)'],
    contraindications: ['Autoimmune conditions (consult practitioner)', 'On immunosuppressants'],
  },
  {
    id: 6,
    name: 'The Flow Master',
    body_pattern_match: ['STAGNATION'],
    organ_focus_match: ['Digestion, Gut, Metabolism', 'Heart, Circulation, Emotional Release'],
    spiritual_qualities: ['Flow & Ease', 'Grounding & Stability'],
    lifestyle_fit: ['Sedentary, desk-bound, mentally intense'],
    contraindications: ['Pregnancy (avoid Yarrow)', 'On anticoagulants (monitor)'],
  },
  {
    id: 7,
    name: 'The Radiance',
    body_pattern_match: ['PREVENTATIVE'],
    organ_focus_match: ['Skin, Beauty, Vitality', 'Energy, Immunity, Stamina'],
    spiritual_qualities: ['Radiance & Magnetism', 'Harmony & Balance'],
    lifestyle_fit: ['Active, physical work, outdoor'],
    contraindications: ['On anticoagulants (Saffron—minor effect)'],
  },
  {
    id: 8,
    name: 'The Heart Opener',
    body_pattern_match: ['EXCESS', 'PREVENTATIVE'],
    organ_focus_match: ['Heart, Circulation, Emotional Release', 'Sleep, Nerves, Mood'],
    spiritual_qualities: ['Flow & Ease', 'Grounding & Stability'],
    lifestyle_fit: ['High stress, intense emotions'],
    contraindications: ['Very early pregnancy (Motherwort consideration)'],
  },
];
