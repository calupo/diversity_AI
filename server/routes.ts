import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { openai, speechToText, textToSpeech, ensureCompatibleFormat } from "./replit_integrations/audio/client"; // Import from integration
import { z } from "zod";

const systemPrompt = `Du hilfst Fahrpersonal in Berlin dabei, aus kurzen Stichworten oder Sätzen schnell verständliche und freundliche Durchsagen für Fahrgäste zu machen: Erst auf Berliner Deutsch, dann in lockerem britischen Englisch. Die Fahrgäste sollen sofort wissen, was los ist, und sich gut informiert fühlen. Der Ton ist kräftig, direkt, rau, aber freundlich – wie ein erfahrener Berliner Busfahrer. Immer empathisch, im Alltagston, und mit trockenem Humor, wenn’s passt. Formuliere zügig.

## Detaillierte Anforderungen

- Antworte erst auf Berliner Deutsch (leichter Dialekt, typische Redewendungen, direkte Ansprache, natürliche Sprechweise).
- Dann sage das Gleiche in britischem Englisch (lockerer Ton, Klartext, freundlich-direkt).
- Sprich zügig, als wärst Du im echten Berliner Stadtverkehr unterwegs – keine langen Sätze!
- Gib, falls möglich, eine grobe Zeitangabe („gleich weiter“, „dit dauert nich lang“).
- Mach die Durchsage für Laien verständlich: keine Fachbegriffe, kein Amtsdeutsch!
- Benutze trockenen Humor als charmante Auflockerung, wenn’s passt („na, hoffen wir mal, der Verkehr hat Erbarmen“).
- Sprich natürlich, ohne gezierte Betonungen oder Künstlichkeit – so, wie ein Busfahrer auf’m Bock reden würde.
- Keine unnötige Formalität. Lieber: einfach, klar, menschlich.
- Antworte kurz, in Alltagssprache. Bevorzuge Satzenden ohne Artikel oder Personalpronomen da, wo’s natürlich klingt („nächste Haltestelle gleich“).
- Halte pro Durchsage max. 2-3 Sätze. Sprich maximal je 10-15 Sekunden pro Sprache.
- London/British slang ist für Englisch willkommen, solange es die Message nicht verwässert.

## Output Format
Return ONLY a JSON object with the following structure:
{
  "berlin": "The Berlin dialect text",
  "english": "The British English text"
}
`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // registerAudioRoutes(app); // We can use the integration's routes if needed, but we are building custom ones.

  app.post(api.translations.process.path, async (req, res) => {
    try {
      const { audio, autoPlay } = api.translations.process.input.parse(req.body);
      const audioBuffer = Buffer.from(audio, "base64");
      
      // 1. Ensure format compatibility and transcribe
      const { buffer: compatibleBuffer, format } = await ensureCompatibleFormat(audioBuffer);
      const originalText = await speechToText(compatibleBuffer, format);
      
      if (!originalText) {
         return res.status(400).json({ message: "Could not transcribe audio" });
      }

      // 2. Generate translations
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Use a smart model for the persona
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: originalText }
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("No content from OpenAI");
      }

      const result = JSON.parse(content) as { berlin: string; english: string };

      // 3. Generate Audio (Optional / Auto-play)
      // We'll generate audio for the Berliner text for now, or both concatenated?
      // The user wants "Ausgabe auf Deutsch und Englisch".
      // Let's generate one audio file containing both, or maybe just the Berlin one?
      // "toggle ob audio sofort ausgegeben wird" -> implies we should send back audio.
      // Let's generate audio for both combined or separate. The frontend might want to play them separately.
      // For simplicity in this prototype, let's generate one combined audio for "Auto-play".
      // Or better: return distinct audio for each if possible, but that's 2 calls.
      // Let's do 2 calls if autoPlay is true, or just return text and let frontend request audio later?
      // The prompt says "output ... in two text windows".
      // For the "auto play", let's generate the Berlin audio primarily as it's the "fun" part, 
      // but the requirement is "Durchsagen for guests", so it should probably be both.
      
      let berlinAudioBase64: string | undefined;
      let englishAudioBase64: string | undefined;

      // Parallelize TTS calls if autoPlay is requested or we want to have them ready
      // To save latency, maybe only do it if autoPlay is true?
      // But the user might want to play it manually later.
      // Let's generate them.
      
      const [berlinAudio, englishAudio] = await Promise.all([
        textToSpeech(result.berlin, "onyx", "mp3"), // Rougher voice for Berlin
        textToSpeech(result.english, "fable", "mp3") // British-ish voice? OpenAI voices are limited.
      ]);
      
      berlinAudioBase64 = berlinAudio.toString("base64");
      englishAudioBase64 = englishAudio.toString("base64");

      // 4. Save to DB
      await storage.createTranslation({
        originalText,
        berlinText: result.berlin,
        englishText: result.english,
      });

      res.json({
        original: originalText,
        berlin: result.berlin,
        english: result.english,
        berlinAudio: berlinAudioBase64,
        englishAudio: englishAudioBase64,
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Translation failed" });
    }
  });

  app.get(api.translations.history.path, async (req, res) => {
    const history = await storage.getHistory();
    res.json(history);
  });

  // Seed data if empty
  const history = await storage.getHistory();
  if (history.length === 0) {
    console.log("Seeding database...");
    await storage.createTranslation({
      originalText: "Wegen Baustelle 5 Minuten später",
      berlinText: "Jut’n Tach zusammen, wegen Baustelle dauert dit hier heute mal fünf Minütchen länger. Danke fürs Warten, wa!",
      englishText: "Alright folks, bit of roadworks up ahead, so we’ll be five minutes late. Cheers for waiting!",
    });
    await storage.createTranslation({
      originalText: "Rolli mit Rampe, Bitte Geduld",
      berlinText: "Kurze Pause, wa – muss kurz die Rampe ausklappen für’n Rolli. Gleich geht’s weiter, danke euch!",
      englishText: "Quick pause, just getting the ramp out for a wheelchair. Won’t be long, thanks a lot!",
    });
  }

  return httpServer;
}
