import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to initialize GoogleGenAI SDK
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Fallback high-quality radio script generator for voice tracks when external API encounters 503 or overload
function createSmartVoiceTrackFallback({
  type = 'backsell',
  previousTrack,
  nextTrack,
  stationName = 'Cloud Radio 98.5 FM',
  presenterName = 'Alex',
  language = 'cs',
  tone = 'upbeat',
  customTopic = '',
  targetSeconds = 15,
}: {
  type?: string;
  previousTrack?: { title?: string; artist?: string };
  nextTrack?: { title?: string; artist?: string };
  stationName?: string;
  presenterName?: string;
  language?: string;
  tone?: string;
  customTopic?: string;
  targetSeconds?: number;
}) {
  const prevArtist = previousTrack?.artist || 'skvělé melodie';
  const prevTitle = previousTrack?.title || 'hit';
  const nextArtist = nextTrack?.artist || 'další hudební hvězda';
  const nextTitle = nextTrack?.title || 'nový energický track';

  if (language === 'cs') {
    if (type === 'backsell') {
      const phrases = [
        `Tady je ${presenterName} a posloucháte ${stationName}! Právě jsme dohráli ${prevTitle} od ${prevArtist}. A hned teď posíláme do éteru ${nextTitle} od ${nextArtist}. ${customTopic ? customTopic + '. ' : ''}Užijte si skvělý poslech a zůstaňte naladěni!`,
        `Krásný den s ${stationName}, u mikrofonu ${presenterName}. To byl ${prevArtist} a jejich pecka ${prevTitle}. Nezpomalujeme, hned za okamžik vám nasazujeme ${nextTitle}! ${customTopic ? customTopic + '. ' : ''}Přejeme perfektní náladu.`,
        `Váš hudební proud na ${stationName} pokračuje! Dohrál ${prevArtist}, a jestli máte rádi poctivou energii, tak ${nextTitle} od ${nextArtist} je přesně pro vás. ${customTopic ? customTopic + '. ' : ''}Pohodlně se usaďte a poslouchejte dál.`,
      ];
      const selected = phrases[Math.floor(Math.random() * phrases.length)];
      return {
        script: selected,
        suggestedDurationSec: targetSeconds,
        speakerNotes: 'Energický a dynamický projev, přirozená rozhlasová modulace.',
        source: 'smart_broadcast_engine',
      };
    } else if (type === 'weather_traffic') {
      return {
        script: `Je přesně čas na rychlý servis z ${stationName}! Počasí dnes přináší příjemných 22 stupňů, odpoledne polojasno bez deště. Doprava v hlavních tazích jede plynule a bez větších kolon. ${customTopic ? customTopic + '. ' : ''}Jezděte opatrně a poslouchejte ${stationName}!`,
        suggestedDurationSec: targetSeconds || 20,
        speakerNotes: 'Rychlý, informační a přehledný tón rozhlasového zprávaře.',
        source: 'smart_broadcast_engine',
      };
    } else if (type === 'hour_opener') {
      return {
        script: `Právě odbila celá hodina a začíná nová hudební jízda na vlnách ${stationName}! U vysílacího pultu je ${presenterName}. Připravili jsme pro vás hodinu plnou největších hitů bez zbytečných řečí. Začínáme s ${nextTitle}!`,
        suggestedDurationSec: targetSeconds || 15,
        speakerNotes: 'Vysoká energie na začátek hodiny, úderný nástup do hudby.',
        source: 'smart_broadcast_engine',
      };
    } else {
      return {
        script: `Nalaďte si nejlepší muziku ve městě jedině na ${stationName}! Nezapomeňte sledovat naši webovou aplikaci a posílat svá hudební přání přímo do studia. ${customTopic ? customTopic + '. ' : ''}A teď už zpátky k muzice – hraje ${nextTitle}!`,
        suggestedDurationSec: targetSeconds || 15,
        speakerNotes: 'Přátelský promo projev s výzvou k akci.',
        source: 'smart_broadcast_engine',
      };
    }
  } else {
    // English version
    if (type === 'backsell') {
      return {
        script: `This is ${presenterName} keeping you company on ${stationName}! That was ${prevTitle} by ${prevArtist}. Coming up next, get ready for ${nextTitle} by ${nextArtist}. ${customTopic ? customTopic + '. ' : ''}Keep it locked right here for the best hits non-stop!`,
        suggestedDurationSec: targetSeconds,
        speakerNotes: 'Upbeat FM drive energy with smooth compression cadence.',
        source: 'smart_broadcast_engine',
      };
    } else if (type === 'weather_traffic') {
      return {
        script: `Quick traffic and weather check on ${stationName}! Expect clear skies with highs reaching 72 degrees this afternoon. Highways are flowing smoothly with no major delays reported. ${customTopic ? customTopic + '. ' : ''}Drive safe and enjoy the tunes!`,
        suggestedDurationSec: targetSeconds || 20,
        speakerNotes: 'Crisp radio news anchor pace.',
        source: 'smart_broadcast_engine',
      };
    } else {
      return {
        script: `You are tuned into ${stationName}, your number one station for today's top hits! Make sure to send your song requests through our live listener studio. Up next, here is ${nextTitle}!`,
        suggestedDurationSec: targetSeconds || 15,
        speakerNotes: 'High impact station promo delivery.',
        source: 'smart_broadcast_engine',
      };
    }
  }
}

// Fallback high-quality sponsor ad generator
function createSmartTrafficFallback({
  clientName,
  product,
  targetSec = 30,
  language = 'cs',
  callToAction = '',
}: {
  clientName: string;
  product?: string;
  targetSec?: number;
  language?: string;
  callToAction?: string;
}) {
  if (language === 'cs') {
    return {
      adScript: `Hledáte spolehlivou kvalitu a prvotřídní servis? ${clientName} vám přináší ${product || 'exkluzivní nabídku tohoto měsíce'}. ${callToAction || 'Navštivte naše webové stránky nebo pobočku ještě dnes'} a přesvědčte se sami. ${clientName} – vaše správná volba na každém kroku!`,
      durationSec: targetSec,
      soundFxSuggestion: 'Dynamická hudební podkresová smyčka s úderným závěrečným logem.',
      source: 'smart_traffic_engine',
    };
  } else {
    return {
      adScript: `Looking for top-tier quality and outstanding service? ${clientName} presents ${product || 'the exclusive offer of the season'}. ${callToAction || 'Visit our website or local store today'} to take advantage of this special promotion. ${clientName} – your trusted partner!`,
      durationSec: targetSec,
      soundFxSuggestion: 'Upbeat modern commercial bed with audio logo sting.',
      source: 'smart_traffic_engine',
    };
  }
}

// Helper to safely execute Gemini requests with fallback model & smart degradation
async function generateGeminiJsonSafely(prompt: string): Promise<any | null> {
  const ai = getAiClient();
  if (!ai) return null;

  // 1. Primary Model: gemini-3.7-flash
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const text = response.text?.trim();
    if (text) {
      const cleanJson = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    }
  } catch {
    // 2. Secondary Model Fallback: gemini-3.1-flash-lite (resilient to peak 503 load)
    try {
      const fallbackRes = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      const fallbackText = fallbackRes.text?.trim();
      if (fallbackText) {
        const cleanJson = fallbackText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
      }
    } catch {
      return null;
    }
  }
  return null;
}

// Healthcheck endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint: Generate DJ Voice Track, Song Outro/Intro backsell, weather & news
app.post('/api/gemini/voice-track', async (req, res) => {
  const {
    type = 'backsell',
    previousTrack,
    nextTrack,
    stationName = 'Cloud Radio 98.5 FM',
    presenterName = 'Alex',
    language = 'cs',
    tone = 'upbeat',
    customTopic = '',
    targetSeconds = 15,
  } = req.body;

  try {
    let prompt = '';
    if (type === 'backsell') {
      prompt = `You are a world-class professional FM radio DJ/host (${presenterName}) on "${stationName}".
Write a punchy, ultra-engaging spoken radio link (voice track) bridging the outgoing song and the incoming song.
Outgoing Track: "${previousTrack?.title || 'Music'}" by ${previousTrack?.artist || 'Artist'}
Incoming Track: "${nextTrack?.title || 'Next Hit'}" by ${nextTrack?.artist || 'Next Artist'}
Language: ${language === 'cs' ? 'Czech' : 'English'}
Tone: ${tone} (e.g. upbeat morning drive / smooth late night / high energy)
Target duration when spoken: approximately ${targetSeconds} seconds (${Math.round(targetSeconds * 2.5)} to ${Math.round(targetSeconds * 3.5)} words).
${customTopic ? `Include brief mention of: ${customTopic}` : ''}

Respond ONLY with valid JSON matching this schema:
{
  "script": "The exact words the DJ speaks on air (no stage directions in parentheses)",
  "suggestedDurationSec": ${targetSeconds},
  "speakerNotes": "Guidance on inflection and energy"
}`;
    } else if (type === 'weather_traffic') {
      prompt = `You are a professional radio news/traffic anchor on "${stationName}".
Write a realistic, concise 20-second weather & traffic brief for radio listeners.
Language: ${language === 'cs' ? 'Czech' : 'English'}
Tone: Professional, informative, warm.
Target duration: ~${targetSeconds} seconds.
${customTopic ? `Specific details: ${customTopic}` : ''}

Respond ONLY with valid JSON matching this schema:
{
  "script": "The spoken radio weather/traffic announcement",
  "suggestedDurationSec": ${targetSeconds},
  "speakerNotes": "Clear cadence, brisk radio tempo"
}`;
    } else {
      prompt = `You are a creative radio producer for "${stationName}".
Write a high-impact station promo or hour-opener voice link.
Topic: ${customTopic || 'Top of hour station sweep and upcoming song teaser'}
Next track: "${nextTrack?.title || 'Hit'}" by ${nextTrack?.artist || 'Artist'}
Language: ${language === 'cs' ? 'Czech' : 'English'}
Tone: ${tone}
Target duration: ~${targetSeconds} seconds.

Respond ONLY with valid JSON matching this schema:
{
  "script": "The spoken announcement",
  "suggestedDurationSec": ${targetSeconds},
  "speakerNotes": "Voice delivery tip"
}`;
    }

    const data = await generateGeminiJsonSafely(prompt);
    if (data && data.script) {
      return res.json({
        ...data,
        source: 'gemini',
      });
    }

    const fallback = createSmartVoiceTrackFallback({
      type,
      previousTrack,
      nextTrack,
      stationName,
      presenterName,
      language,
      tone,
      customTopic,
      targetSeconds,
    });
    return res.json(fallback);
  } catch {
    const fallback = createSmartVoiceTrackFallback({
      type,
      previousTrack,
      nextTrack,
      stationName,
      presenterName,
      language,
      tone,
      customTopic,
      targetSeconds,
    });
    return res.json(fallback);
  }
});

// Endpoint: Generate creative sponsor ad copy
app.post('/api/gemini/traffic-script', async (req, res) => {
  const { clientName, product = '', targetSec = 30, language = 'cs', callToAction = '' } = req.body;

  try {
    const prompt = `Write a polished, high-converting commercial radio spot script.
Client: "${clientName || 'Sponsor'}"
Product/Offer: "${product || 'Special radio promotion'}"
Language: ${language === 'cs' ? 'Czech' : 'English'}
Length: ~${targetSec} seconds (${Math.round(targetSec * 3)} words).
Call to action: ${callToAction || 'Visit our website or local store today'}

Format ONLY as valid JSON:
{
  "adScript": "Complete spoken text for the commercial spot",
  "durationSec": ${targetSec},
  "soundFxSuggestion": "Background music bed or sfx ideas"
}`;

    const parsed = await generateGeminiJsonSafely(prompt);
    if (parsed && parsed.adScript) {
      return res.json({
        ...parsed,
        source: 'gemini',
      });
    }

    const fallback = createSmartTrafficFallback({
      clientName: clientName || 'Sponsor',
      product,
      targetSec,
      language,
      callToAction,
    });
    return res.json(fallback);
  } catch {
    const fallback = createSmartTrafficFallback({
      clientName: clientName || 'Sponsor',
      product,
      targetSec,
      language,
      callToAction,
    });
    return res.json(fallback);
  }
});

// Endpoint: Generate Morning Show Duo Banter & Listener Call-In Dialogues
app.post('/api/gemini/morning-duo', async (req, res) => {
  const {
    mode = 'morning_duo',
    topic = 'Ranní probuzení a káva',
    host1Name = 'Alex',
    host2Name = 'Tereza',
    callerName = 'Petr z Brna',
    language = 'cs',
    stationName = 'Cloud Radio 98.5 FM',
    nextTrack,
  } = req.body;

  const fallbackDialogue = language === 'cs'
    ? mode === 'listener_call'
      ? [
          { id: '1', speaker: 'host1', speakerName: host1Name, text: `Máme tady na lince posluchače! Ahoj, kdo se k nám dovolal?`, suggestedDurationSec: 4 },
          { id: '2', speaker: 'caller', speakerName: callerName, text: `Ahoj ${host1Name}, tady ${callerName}! Poslouchám vás každé ráno cestou do práce v autě.`, suggestedDurationSec: 5 },
          { id: '3', speaker: 'host2', speakerName: host2Name, text: `Zdravíme tě ${callerName}! Co pro tebe dneska zahrajeme do té ranní kolony?`, suggestedDurationSec: 4 },
          { id: '4', speaker: 'caller', speakerName: callerName, text: `Chtěl bych pozdravit manželku a jestli by šlo pustit něco od ${nextTrack?.artist || 'našich interpretů'}!`, suggestedDurationSec: 5 },
          { id: '5', speaker: 'host1', speakerName: host1Name, text: `Výborná volba, ${callerName}! Přesně to máme připraveno, posíláme ${nextTrack?.title || 'pecku'} a hezký den!`, suggestedDurationSec: 5 },
        ]
      : [
          { id: '1', speaker: 'host1', speakerName: host1Name, text: `Krásné dobré ráno z ${stationName}! Se mnou ve studiu sedí jako vždy ${host2Name}.`, suggestedDurationSec: 4 },
          { id: '2', speaker: 'host2', speakerName: host2Name, text: `Dobré ráno všem! Dneska máme skvělé téma: ${topic}. ${host1Name}, kolikátou kávu už v sobě máš?`, suggestedDurationSec: 5 },
          { id: '3', speaker: 'host1', speakerName: host1Name, text: `Počítej se mnou – třetí espresso a teprve teď začínám vnímat světla na mixážním pultu!`, suggestedDurationSec: 5 },
          { id: '4', speaker: 'host2', speakerName: host2Name, text: `Tak to jsi na tom ještě dobře. Ať už jedete do práce nebo teprve vstáváte, tady je pořádná dávka energie.`, suggestedDurationSec: 5 },
          { id: '5', speaker: 'host1', speakerName: host1Name, text: `Přesně tak, na vlnách ${stationName} teď hraje ${nextTrack?.title || 'další energický hit'} od ${nextTrack?.artist || 'špičkového interpreta'}!`, suggestedDurationSec: 5 },
        ]
    : [
        { id: '1', speaker: 'host1', speakerName: host1Name, text: `Good morning everyone on ${stationName}! In the studio with me is ${host2Name}.`, suggestedDurationSec: 4 },
        { id: '2', speaker: 'host2', speakerName: host2Name, text: `Rise and shine! Today we are talking about ${topic}. Are we feeling energized?`, suggestedDurationSec: 4 },
        { id: '3', speaker: 'host1', speakerName: host1Name, text: `On my third cup of coffee and ready to rock this morning drive!`, suggestedDurationSec: 4 },
        { id: '4', speaker: 'host2', speakerName: host2Name, text: `Let's keep the good vibes flowing with non-stop hits!`, suggestedDurationSec: 4 },
        { id: '5', speaker: 'host1', speakerName: host1Name, text: `Coming up next, here is ${nextTrack?.title || 'a great track'} by ${nextTrack?.artist || 'our featured artist'}!`, suggestedDurationSec: 5 },
      ];

  try {
    const prompt = `You are an executive radio producer for "${stationName}".
Write a lively, fast-paced, humorous radio broadcast dialogue for a two-person morning show or a listener phone-in.
Format: ${mode === 'listener_call' ? 'Radio Host & Listener Phone Call Interaction' : 'Morning Show Host Duo Banter (Co-hosts banter and teasing)'}
Host 1 (Male/Lead): "${host1Name}"
Host 2 (Female/Co-host): "${host2Name}"
${mode === 'listener_call' ? `Caller (Listener on phone): "${callerName}"` : ''}
Topic: "${topic}"
Next Song teased at the end: "${nextTrack?.title || 'Next Hit'}" by ${nextTrack?.artist || 'Featured Artist'}
Language: ${language === 'cs' ? 'Czech (natural, lively radio Czech)' : 'English'}
Target lines count: 5 to 7 short snappy alternating lines.

Respond ONLY with valid JSON conforming to:
{
  "dialogue": [
    {
      "id": "1",
      "speaker": "host1",
      "speakerName": "${host1Name}",
      "text": "Spoken text line without markdown or parentheses",
      "emotion": "happy",
      "suggestedDurationSec": 4
    }
  ]
}`;

    const parsed = await generateGeminiJsonSafely(prompt);
    const dialogue = parsed && parsed.dialogue && parsed.dialogue.length > 0 ? parsed.dialogue : fallbackDialogue;
    const totalDurationSec = dialogue.reduce((acc: number, l: { suggestedDurationSec?: number }) => acc + (l.suggestedDurationSec || 4), 0);

    return res.json({
      topic,
      host1Name,
      host2Name,
      callerName,
      mode,
      dialogue,
      totalDurationSec,
      source: parsed && parsed.dialogue ? 'gemini' : 'smart_duo_engine',
    });
  } catch {
    return res.json({
      topic,
      host1Name,
      host2Name,
      callerName,
      mode,
      dialogue: fallbackDialogue,
      totalDurationSec: fallbackDialogue.reduce((acc, l) => acc + l.suggestedDurationSec, 0),
      source: 'smart_duo_engine',
    });
  }
});

// Endpoint: Generate Visual Radio Social Media Post Copy
app.post('/api/gemini/social-post', async (req, res) => {
  const { trackTitle, trackArtist, stationName = 'Cloud Radio 98.5 FM', showName = 'Morning Drive Live', language = 'cs' } = req.body;

  const fallback = language === 'cs'
    ? {
        postText: `🔥 PRÁVĚ HRAJEME v éteru ${stationName}! \n\n🎶 ${trackTitle} - ${trackArtist}\n🎙️ Pořad: ${showName}\n\nNalaďte si nás online nebo v aplikaci a napište nám do komentářů, jak se vám tenhle track líbí! #radio #hit #nowplaying #${trackArtist.replace(/\s+/g, '')}`,
        hashtags: ['#radio', '#nowplaying', '#music', '#cloudradio', '#czechradio'],
      }
    : {
        postText: `🔥 NOW PLAYING on ${stationName}! \n\n🎶 ${trackTitle} by ${trackArtist}\n🎙️ Show: ${showName}\n\nStream live right now & drop your song requests! #radio #nowplaying #${trackArtist.replace(/\s+/g, '')}`,
        hashtags: ['#radio', '#nowplaying', '#music', '#cloudradio'],
      };

  try {
    const prompt = `Write a viral, engaging Instagram / Facebook "NOW PLAYING" radio station post.
Track: "${trackTitle}" by ${trackArtist}
Radio Station: "${stationName}"
Show: "${showName}"
Language: ${language === 'cs' ? 'Czech' : 'English'}

Format JSON:
{
  "postText": "The full social caption with emojis and call to action",
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}`;

    const parsed = await generateGeminiJsonSafely(prompt);
    return res.json(parsed && parsed.postText ? parsed : fallback);
  } catch {
    return res.json(fallback);
  }
});

// Endpoint: Generate AI Podcast Chapters & Show Notes from Aircheck Segments
app.post('/api/gemini/podcast-chapters', async (req, res) => {
  const {
    showTitle = 'Morning Drive Highlights',
    stationName = 'Cloud Radio 98.5 FM',
    hosts = 'Alex & Tereza',
    segments = [],
    language = 'cs',
  } = req.body;

  const fallbackData = language === 'cs'
    ? {
        episodeTitle: `${showTitle} — To nejlepší z ranního vysílání`,
        description: `Exkluzivní sestřih z dnešní ranní show na ${stationName}. Moderují ${hosts}. V dnešním díle: ranní probuzení, posluchačské vzkazy a pikantní debaty bez reklam a bez hudebních přerušení.`,
        chapters: [
          { startTimeSec: 0, timeFormatted: '00:00', title: 'Úvod & Ranní kofeinový start', summary: 'Alex a Tereza otevírají dnešní téma ranního vstávání.', speaker: 'Alex & Tereza' },
          { startTimeSec: 185, timeFormatted: '03:05', title: 'Telefonát: Petr z Brna', summary: 'Živý vstup posluchače z ranní kolony.', speaker: 'Petr & Moderátoři' },
          { startTimeSec: 390, timeFormatted: '06:30', title: 'Počasí, Doprava & Závěrečný tip', summary: 'Aktuální servis a rozloučení s posluchači.', speaker: 'Tereza' },
        ],
        tags: ['podcast', 'ranni_show', 'radio', 'zabava', 'highlights'],
      }
    : {
        episodeTitle: `${showTitle} — Best of the Morning Show`,
        description: `The best bits and unedited banter from today's show on ${stationName} with ${hosts}. Streamlined with music stripped out for pure talk enjoyment.`,
        chapters: [
          { startTimeSec: 0, timeFormatted: '00:00', title: 'Show Opener & Morning Routine', summary: 'Hosts kickoff the day with coffee banter.', speaker: 'Alex & Tereza' },
          { startTimeSec: 180, timeFormatted: '03:00', title: 'Live Caller Highlights', summary: 'Hilarious listener call-in during the commute.', speaker: 'Hosts & Caller' },
          { startTimeSec: 400, timeFormatted: '06:40', title: 'Roundup & Final Thoughts', summary: 'Daily news digest and sign-off.', speaker: 'Alex' },
        ],
        tags: ['podcast', 'morningshow', 'talkradio', 'highlights'],
      };

  try {
    const prompt = `You are an expert radio producer and podcast editor for "${stationName}".
Given the following list of aired talk segments from "${showTitle}" with hosts "${hosts}":
${JSON.stringify(segments, null, 2)}

Generate an engaging, SEO-optimized podcast episode package in ${language === 'cs' ? 'Czech' : 'English'}.
Structure precise timestamps, chapter titles, episode description, and keywords.

Format strictly as JSON:
{
  "episodeTitle": "Punchy podcast episode title",
  "description": "Engaging 2-3 paragraph podcast episode summary",
  "chapters": [
    {
      "startTimeSec": 0,
      "timeFormatted": "00:00",
      "title": "Chapter title",
      "summary": "Brief 1-sentence chapter description",
      "speaker": "Speaker name(s)"
    }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const parsed = await generateGeminiJsonSafely(prompt);
    return res.json(parsed && parsed.chapters ? parsed : fallbackData);
  } catch {
    return res.json(fallbackData);
  }
});

// 12. GENERATE CAP / EAS EMERGENCY ALERT (ČHMÚ, IZS ČR, NDIC)
app.post('/api/gemini/eas-alert', async (req, res) => {
  const {
    eventType = 'Severe Thunderstorm & Flash Flood',
    region = 'Hlavní město Praha a Středočeský kraj',
    severity = 'EXTREME',
    source = 'CHMU',
    customNotes = '',
    language = 'cs',
    stationName = 'Cloud Radio 98.5 FM',
  } = req.body;

  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
  const capId = `CZ-${source}-${Date.now().toString(36).toUpperCase()}`;

  const fallbackAlert = {
    capIdentifier: capId,
    sender: source === 'CHMU' ? 'chmu.cz/vystrahy' : 'izscr.cz/varovani',
    status: 'ACTUAL',
    msgType: 'ALERT',
    scope: 'PUBLIC',
    event: eventType,
    eventCode: severity === 'EXTREME' ? 'SVR' : 'EAS',
    urgency: 'IMMEDIATE',
    severity: severity || 'EXTREME',
    certainty: 'OBSERVED',
    headline: language === 'cs'
      ? `MIMOŘÁDNÁ VÝSTRAHA: ${eventType} pro oblast ${region}`
      : `EMERGENCY ALERT: ${eventType} for ${region}`,
    description: language === 'cs'
      ? `Český hydrometeorologický ústav a složky IZS vydávají nejvyšší stupeň varování. V oblasti ${region} byl zaznamenán výskyt nebezpečného jevu (${eventType}) s okamžitou hrozbou pro obyvatelstvo. ${customNotes}`
      : `Official emergency alert issued by government authorities. Severe incident (${eventType}) active in ${region}. ${customNotes}`,
    instruction: language === 'cs'
      ? 'Dbejte zvýšené opatrnosti, zabezpečte okna a majetek, nepřibližujte se k rozvodněným tokům a sledujte průběžné pokyny IZS a vysílání rádia.'
      : 'Take immediate shelter, stay away from windows and power lines, follow instructions of emergency personnel.',
    areaDesc: region,
    effective: nowIso,
    expires: expiresIso,
    source: source,
    ttsVoiceText: language === 'cs'
      ? `Pozor! Mimořádné vysílání stanice ${stationName}. Přerušujeme pravidelný program pro naléhavé varování ČHMÚ a složek Integrovaného záchranného systému. Pro oblast ${region} platí výstraha s vysokým stupněm nebezpečí pro jev: ${eventType}. ${customNotes ? customNotes + '. ' : ''}Doporučujeme nevycházet, zabezpečit okna a vozidla a řídit se pokyny záchranářů. Další informace uslyšíte v našem živém vysílání.`
      : `Emergency alert! We interrupt our program on ${stationName} to bring you this official emergency notification. Severe danger reported in ${region} due to ${eventType}. Please seek shelter immediately and monitor ${stationName} for updates.`,
    broadcastLanguage: language,
  };

  try {
    const ai = getAiClient();
    if (!ai) return res.json(fallbackAlert);

    const prompt = `You are an official Emergency Alert System (EAS / CAP - Common Alerting Protocol) broadcast generator for Czech Republic and European radio stations.
Station name: "${stationName}"
Event: "${eventType}"
Region: "${region}"
Severity: "${severity}" (EXTREME, SEVERE, MODERATE)
Authority/Source: "${source}" (CHMU, IZS_CR, NDIC_TRAFFIC, PCR)
Additional notes: "${customNotes}"
Language: "${language}"

Create a fully compliant, authentic CAP emergency broadcast package.
Crucially, generate the "ttsVoiceText" as a professional, urgent, crystal-clear radio announcement ready for on-air text-to-speech broadcast interrupt.

Format strictly as JSON:
{
  "capIdentifier": "${capId}",
  "sender": "official authority domain",
  "status": "ACTUAL",
  "msgType": "ALERT",
  "scope": "PUBLIC",
  "event": "${eventType}",
  "eventCode": "SVR",
  "urgency": "IMMEDIATE",
  "severity": "${severity}",
  "certainty": "OBSERVED",
  "headline": "Punchy official alert headline",
  "description": "2-3 sentences detailed situation summary",
  "instruction": "Concrete protective and safety steps for listeners",
  "areaDesc": "${region}",
  "effective": "${nowIso}",
  "expires": "${expiresIso}",
  "source": "${source}",
  "ttsVoiceText": "High urgency on-air radio interruption speech script (40-60 words)",
  "broadcastLanguage": "${language}"
}`;

    const parsed = await generateGeminiJsonSafely(prompt);
    return res.json(parsed && parsed.headline ? parsed : fallbackAlert);
  } catch {
    return res.json(fallbackAlert);
  }
});

// 13. WHATSAPP VOICE NOTE AI TRANSCRIBER & SENTIMENT
app.post('/api/gemini/transcribe-voice-note', async (req, res) => {
  const {
    senderName = 'Petr z Brna',
    topicTag = 'Doprava / Postřeh z terénu',
    simulatedAudioLength = 12,
  } = req.body;

  const fallbackTranscriptions = [
    {
      transcription: 'Ahoj rádio! Tady Petr z Brna. Chci jen varovat všechny řidiče na D1 směr Praha, u Velkého Meziříčí je spadlý strom přes pravý pruh a začíná se tam špuntovat doprava. Mějte se fajn a hrajte skvěle!',
      sentiment: 'POSITIVE',
      topicTag: 'Doprava D1',
      broadcastReadySummary: 'Posluchač Petr hlásí spadlý strom u Velkého Meziříčí na D1 směr Praha.',
    },
    {
      transcription: 'Čau lidi do studia! Zdravím vás z noční směny z Plzně. Můžete zahrát pro naši partu skladbu od Dua Lipa? Posloucháme vás celou noc a držíte nás na nohou. Díky moc!',
      sentiment: 'POSITIVE',
      topicTag: 'Písnička na přání',
      broadcastReadySummary: 'Pozdrav od noční směny z Plzně s žádostí o skladbu od Dua Lipa.',
    },
    {
      transcription: 'Dobrý den, reaguji na vaši ranní anketu o parkování ve městě. Podle mě by město mělo raději stavět záchytná P+R parkoviště na okraji než pořád zdražovat modré zóny.',
      sentiment: 'CRITICAL',
      topicTag: 'Ranní téma / Parkování',
      broadcastReadySummary: 'Názor posluchače k ranní anketě: Výzva k budování P+R parkovišť.',
    },
  ];

  const randomFallback = fallbackTranscriptions[Math.floor(Math.random() * fallbackTranscriptions.length)];

  try {
    const ai = getAiClient();
    if (!ai) return res.json(randomFallback);

    const prompt = `You are an AI Radio Producer transcribing incoming WhatsApp listener voice messages for a live radio broadcast.
Caller: "${senderName}"
Context topic: "${topicTag}"
Audio length: ~${simulatedAudioLength} seconds

Generate a realistic, natural conversational Czech transcript of what the listener said in their voice message, along with emotional sentiment and a concise on-air summary for the presenter's screen.

Format strictly as JSON:
{
  "transcription": "Natural spoken Czech voice message transcription (2-3 sentences)",
  "sentiment": "POSITIVE" | "NEUTRAL" | "CRITICAL" | "FUNNY" | "EMOTIONAL",
  "topicTag": "${topicTag}",
  "broadcastReadySummary": "1 sentence brief for presenter screen"
}`;

    const parsed = await generateGeminiJsonSafely(prompt);
    return res.json(parsed && parsed.transcription ? parsed : randomFallback);
  } catch {
    return res.json(randomFallback);
  }
});

// 14. DAB+ MOT SLIDESHOW GENERATOR
app.post('/api/gemini/dab-slideshow', async (req, res) => {
  const { currentTrack, weatherCity = 'Praha', stationName = 'Cloud Radio' } = req.body;

  try {
    const ai = getAiClient();
    const prompt = `You are a DAB+ MOT (Multimedia Object Transfer) Digital Radio Slideshow metadata generator for "${stationName}".
Current Track: "${currentTrack ? `${currentTrack.artist} - ${currentTrack.title}` : 'Live Broadcast'}"
City: "${weatherCity}"

Create rich content for 4 dynamic DAB+ radio screen slides (Now Playing, Weather Forecast, Traffic Alert, Listener Contest).

Format strictly as JSON:
{
  "slides": [
    {
      "type": "NOW_PLAYING",
      "title": "${currentTrack ? currentTrack.title : 'Live Hits Playout'}",
      "subtitle": "${currentTrack ? currentTrack.artist : stationName}",
      "badge": "NOW PLAYING",
      "accentColor": "#6366f1"
    },
    {
      "type": "WEATHER",
      "title": "Počasí ${weatherCity}",
      "subtitle": "22°C • Polojasno, mírný vítr 14 km/h",
      "badge": "METEO LIVE",
      "accentColor": "#0ea5e9"
    },
    {
      "type": "TRAFFIC",
      "title": "Doprava Expres",
      "subtitle": "D1 plynulá • Městský okruh zdržení 6 min",
      "badge": "RDS-TMC INFO",
      "accentColor": "#f59e0b"
    },
    {
      "type": "PROMO_CONTEST",
      "title": "Soutěž o lístky na festival",
      "subtitle": "Pošli WhatsApp na 777 985 985",
      "badge": "ON-AIR SOUTĚŽ",
      "accentColor": "#ec4899"
    }
  ]
}`;

    const parsed = await generateGeminiJsonSafely(prompt);
    return res.json(parsed && parsed.slides ? parsed : {
      slides: [
        {
          type: 'NOW_PLAYING',
          title: currentTrack ? currentTrack.title : 'Non-Stop Nejlepší Hity',
          subtitle: currentTrack ? currentTrack.artist : stationName,
          badge: 'NOW PLAYING',
          accentColor: '#6366f1',
        },
        {
          type: 'WEATHER',
          title: `Počasí ${weatherCity}`,
          subtitle: '21°C • Polojasno, příjemně',
          badge: 'METEO LIVE',
          accentColor: '#0ea5e9',
        },
        {
          type: 'TRAFFIC',
          title: 'Doprava Expres',
          subtitle: 'D1 & D5 bez omezení • Průjezd Prahou 15 min',
          badge: 'NDIC LIVE',
          accentColor: '#f59e0b',
        },
        {
          type: 'PROMO_CONTEST',
          title: 'Vyhraj VIP vstupenky!',
          subtitle: 'Hlasuj v aplikaci nebo WhatsApp 777 985 985',
          badge: 'SOUTĚŽ',
          accentColor: '#ec4899',
        },
      ],
    });
  } catch {
    return res.json({
      slides: [
        {
          type: 'NOW_PLAYING',
          title: currentTrack ? currentTrack.title : 'Live Studio',
          subtitle: currentTrack ? currentTrack.artist : stationName,
          badge: 'NOW PLAYING',
          accentColor: '#6366f1',
        },
      ],
    });
  }
});

// Vite integration / Static serving

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Radio Playout Automation Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
