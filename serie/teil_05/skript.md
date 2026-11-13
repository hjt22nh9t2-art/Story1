# Teil 5/10 – „Das Wrack“

**Länge:** 60,0 s · 1080×1920 · 30 fps
**Erzähltext:** 117 Wörter, Ich-Perspektive Jonas
**Stimme:** Speko → Soniox „Adrian“ (`tts-rt-v2`, de). Ausnahme: Die Serienstimme „Thomas“ (ElevenLabs) war ohne Speko-Aufladung gesperrt, siehe `status.md`

## Erzähltext

> Das Logbuch war in meiner Handschrift. … Aber ich habe es nie geschrieben.
> Was bisher geschah: Im Keller fand ich ein Foto von 1953. Der Wärter darauf hatte mein Gesicht. … Und hinter mir stand etwas.
>
> Am Morgen war Ebbe. Das Meer war weg. Nur Schlick. Und Nebel.
> Und draußen im Watt: das Wrack.
> Ich lief los. Meine Stiefel sanken bei jedem Schritt ein.
> Der Rumpf war schwarz und voller Muscheln.
> Drinnen tropfte es. Und auf einer Kiste lag ein Logbuch.
> Ich schlug es auf.
> Es war meine Schrift. Jeder Buchstabe. Jeder Bogen.
> Der letzte Eintrag: Heute. 3:33 Uhr. Die Flut kommt.
> Dann hörte ich es. Ein Rauschen.
> Ich rannte hinaus.
> Das Wasser kam. … Viel zu schnell.
> Und der Weg zurück … war weg.
>
> *(Schreck: Eine Welle schlägt an, Jonas dreht sich um. Draußen auf dem Wasser glimmt eine Laterne, darunter eine dunkle Gestalt. Die Kamera geht unter.)*

## Szenenliste

| # | Zeit (s) | Bild | Ton / Text |
|---|---|---|---|
| 1 | 0,0–2,45 | **HOOK:** Nahaufnahme der Logbuchseite im Taschenlampenlicht: Jonas’ eigene Einträge („03:33 Licht aus. Es klopft.“, „Nasse Spuren. Bis zum Bett.“), Unterschrift „J.“. „TEIL 5/10“ | Bass-Einschlag, Tropfen, „Das Logbuch war in meiner Handschrift.“ |
| 2 | 2,45–4,6 | Jonas’ Gesicht über dem Buch, von unten angeleuchtet | „Aber ich habe es nie geschrieben.“ |
| 3 | 4,6–9,5 | **WAS BISHER GESCHAH:** das Foto von 1953 im Keller | Glühbirnen-Brummen |
| 4 | 9,5–11,65 | Rückblick: das Gesicht des Wärters | „Der Wärter darauf hatte mein Gesicht.“ |
| 5 | 11,65–13,6 | Rückblick: die Gestalt im Spiegel hinter Jonas | Glaston |
| 6 | 13,6–16,3 | Morgendämmerung, Blick von der Insel aufs leere Watt, weit draußen das Wrack, der Leuchtturm-Kegel schwach | Wind, ferne Möwen, „Am Morgen war Ebbe.“ |
| 7 | 16,3–18,4 | Tiefe Fahrt über Rippelmarken und Priele | „Nur Schlick. Und Nebel.“ |
| 8 | 18,4–20,9 | Tele auf das Wrack, das aus dem Nebel auftaucht | „Und draußen im Watt: das Wrack.“ |
| 9 | 20,9–22,6 | Jonas läuft los, hinter ihm die Insel | Schmatzende Schritte |
| 10 | 22,6–24,6 | Bodennah: die Stiefel sinken in den spiegelnden Schlick, Abdrücke laufen voll | „… bei jedem Schritt ein.“ |
| 11 | 24,6–27,35 | Fahrt am Rumpf entlang: schwarze Planken, Spanten, Muscheln, Seepocken | „Der Rumpf war schwarz und voller Muscheln.“ |
| 12 | 27,35–28,95 | Im Wrack: Lichtschächte durch das offene Deck, Tropfen | Tropfen, Ächzen |
| 13 | 28,95–31,15 | Die Taschenlampe findet die Kiste mit dem Logbuch | „Und auf einer Kiste lag ein Logbuch.“ |
| 14 | 31,15–32,8 | Der Buchdeckel klappt auf | Blättern |
| 15 | 32,8–36,9 | Langsame Fahrt über die Handschrift | Tiefer Puls, „Es war meine Schrift …“ |
| 16 | 36,9–42,45 | Der letzte Eintrag, zittrig und doppelt nachgezogen: „Heute. 03:33 – Die Flut kommt.“ | Steigender Ton, Bass-Schlag |
| 17 | 42,45–44,8 | Jonas hebt den Kopf, durch den Bruch und die Fugen schießt Wasser herein | Dumpfes Rauschen, Rumpf ächzt |
| 18 | 44,8–46,55 | Jonas rennt aus dem Wrack, Wasser um die Stiefel | Platschende Schritte, Rauschen voll |
| 19 | 46,55–49,45 | Von oben: Die Flut schiebt sich mit Schaumkante übers Watt, Jonas rennt | „Das Wasser kam. … Viel zu schnell.“ |
| 20 | 49,45–52,3 | **CLIFFHANGER:** über Jonas’ Schulter Richtung Turm, zwischen ihm und der Insel nur noch Wasser | „Und der Weg zurück … war weg.“, Musik bricht ab |
| 21 | 52,3–54,6 | Schreck: Die Welle schlägt an, Jonas wirbelt herum. Draußen im Nebel glimmt eine Laterne, darunter eine dunkle Gestalt | Schreck-Sound, Herzschlag |
| 22 | 54,6–56,8 | Kamera auf Wasserhöhe, das Wasser steigt über das Objektiv, dumpf, Schwarz | Unterwasser-Rauschen, Blubbern |
| 23 | 56,8–60,0 | Schwarzbild: „FOLGE FÜR TEIL 6 👁“, „Wie kommt er zurück?“, „Schreib’s in die Kommentare“ | Herzschlag |

*Technik:* Das Watt (`assets/watt.js`) ist eine eigene Schlickfläche mit Rippelmarken als Normal-Map und Prielen. Die Flut ist ein Wasserspiegel mit Shader, der eine Höhenkarte des Schlicks kennt und dort Schaum zeichnet, wo das Wasser flach ist. Steigt der Spiegel, wandert die Wasserkante von selbst über das abfallende Watt auf die Insel zu. Das Wrack (`assets/wreck.js`) ist ein parametrischer Holzrumpf mit Löchern (Alpha-Map) und echten Lichtschächten im Innenraum. Die Laterne am Ende kündigt Teil 6 an.
