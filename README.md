# WNE Extension

Öffentliche, hierarchische Gruppen-Homepage für Weihnachten neu erleben. Vue 3, TypeScript und eigene UI-Komponenten auf Grundlage des [ChurchTools Extension Boilerplate](https://github.com/churchtools/extension-boilerplate).

## Lokal starten

Node.js 22.12+ oder 24 und npm verwenden.

```sh
npm ci
npm run dev
```

Für lokale ChurchTools-Daten `.env-example` nach `.env` kopieren und `VITE_BASE_URL` auf die Zielinstanz setzen. Hier ist WNE in der ignorierten `.env.local` eingerichtet. Der Vite-Proxy leitet `/api` an diese Instanz weiter; im Browser ist kein CORS-Setup nötig. Keine Zugangsdaten erforderlich.

Live-Einstieg für „Bei WNE mitarbeiten“:

`http://localhost:5173/ccm/wne/#/3b5xzyvScw0ELaqqxQ6wrAOMLalcFjDo/6257`

Falls der Port bereits belegt ist, verwendet Vite den nächsten freien Port. Die geprüfte Vorschau läuft aktuell auf 5174.

`npm run dev:demo` erlaubt zusätzlich `#/demo/100` mit gekennzeichneten Beispieldaten. Echte Homepage-Hashes laden auch in diesem Entwicklungsmodus echte öffentliche Daten. Der Produktionsbuild enthält keine Demodaten.

## Navigation und Daten

- URL: `#/:homepageHash/:groupIds+`, zum Beispiel `#/3b5xzyvScw0ELaqqxQ6wrAOMLalcFjDo/6257/6251/6260`.
- Der Hash bestimmt die ChurchTools-Gruppen-Homepage. Ihre übergeordnete technische Gruppe wird nicht angezeigt. Die erste Gruppen-ID ist der frei wählbare sichtbare Einstieg.
- `GET /api/grouphomepages/{hash}` liefert alle freigegebenen Gruppen. Eine Zuordnung nach ID und die `children`-Referenzen bilden die Hierarchie. Es werden keine zusätzlichen Einzelgruppen außerhalb dieser Homepage geladen.
- Jede Seite zeigt ausschließlich ihre direkten Untergruppen. Andere Zweige erscheinen nicht im Einstieg. Referenzen auf nicht gelieferte Gruppen werden ausgeblendet.
- Kategorien verwenden die gemeinsame `GroupListItem.vue`: Titel, kurzer Text und Vorschau der direkten Untergruppen, ohne Bilder. Blattgruppen verwenden hohe `GroupCard.vue`-Karten mit Bild und kurzem Text. Die Detailseite zeigt Beschreibung, Bild, Teamleitung und verfügbare Angaben zu Treffen, Standort, Zielgruppe, Alter und Treffpunkten. Die gemeinsame Gruppenkategorie (z. B. 2027) wird nicht angezeigt. Es werden nur ausgefüllte öffentliche Angaben angezeigt.
- Breadcrumbs, Zurück-Links und Neuladen verwenden den vollständigen Pfad. Jede Eltern-Kind-Beziehung wird geprüft; ungültige Pfade zeigen eine Fehlermeldung.
- Öffentliche Requests verwenden `credentials: omit`. Die Homepage wird für eine Minute zwischengespeichert; ein erneuter Versuch lädt sie neu.
- Beschreibungen verwenden `MarkdownText.vue` und markdown-it (HTML deaktiviert). Fettschrift, Listen, Überschriften und Links werden formatiert. Klickbare Karten und Kategoriezeilen verwenden eine aus Markdown abgeleitete Textvorschau, damit keine verschachtelten Links entstehen.
- Der Gruppenseitenkopf bleibt beim Wechsel zur Anmeldung stehen. Nur der Inhaltsbereich lädt das Formular nach; vorhandene Gruppendaten werden wiederverwendet.
- „Zur Anmeldung“ öffnet die eigene generische Formularseite `#/:homepageHash/:groupIds+/anmeldung`. Erst dort werden anhand der letzten Gruppen-ID ein Token und anschließend die Formularinformationen geladen.
- Anmeldung: `POST /api/publicgroups/{id}/token` → `GET /api/publicgroups/{id}/form?token=…` → nach Absenden `POST /api/publicgroups/{id}/signup`. Immer genau eine Person: `forms: [{ personId: null, form: […] }]`; Feld-IDs und Typen kommen aus ChurchTools. Pflichtfelder, Reihenfolge, Optionen, Vorgaben und Datenschutzzustimmung werden übernommen. Bei einem verifizierten Personen-Token wird ausschließlich die zugehörige Person angemeldet.
- Die `signUpConditions` der geladenen Homepage steuern Verfügbarkeit, Warteliste und Anmeldestatus. Der Form-Endpunkt liefert teilweise unvollständige rollenabhängige Bedingungen; für die Anzeige bleiben deshalb die Homepage-Bedingungen maßgeblich. Die ChurchTools-API prüft die tatsächlichen Berechtigungen bei Token und Anmeldung erneut.
- Bei `emailVerificationMode: all` beginnt die Seite mit der Anforderung eines E-Mail-Links. Der Link führt über `signUpUrlTemplate` wieder zur eigenen Formularseite. Bei `existing`/`none` wird direkt das Formular geladen. Eine `verificationNotice` nach dem Abschicken zeigt die noch erforderliche E-Mail-Bestätigung an.
- Unterstützte Felder: Text/E-Mail/Telefon, Datum, Datum mit Zeit, Zahl, Langtext, Checkbox, Auswahl und Mehrfachauswahl sowie versteckte Vorgabefelder. API-Auswahlfelder benötigen mitgelieferte Optionen. Unbekannte Feldtypen verhindern das Abschicken. Es gibt keine Mehrpersonen-, Familien- oder Partneranmeldung. Tokens und Eingaben werden nicht lokal gespeichert.
- Tests prüfen Statusauswertung, Feldtypen und eindeutige Feldschlüssel, Payload, API-Abfolge und Fehlerantworten mit simulierten Requests. Der Live-Test lädt Token/Formular ohne Abschicken einer echten Anmeldung.

Die Live-Hierarchie wurde am 2. Oktober 2026 geprüft: `6257` → `2911` (Casting), `6251` (Freie Teams), `6254` (Teams mit Bewerbung). Freie Teams → `6260` (Ordner Saal), `6263` (Ordner Foyer). Casting → `6275` (Schauspiel). Der getrennte Zweig „Interne Teams“ erscheint nicht unter `6257`. „Teams mit Bewerbung“ hat aktuell keine Kinder und wird daher als Blattgruppe behandelt.

## Prüfen und paketieren

```sh
npm test
npm run build
npm run deploy
```

`deploy` erstellt wie im Boilerplate nur ein ZIP unter `releases/`; es lädt nichts hoch. Hash-Routing ermöglicht Direktlinks ohne zusätzliche Server-Rewrite-Regeln. `VITE_KEY` bestimmt den Extension-Pfad (Standard: `wne`).

## Herkunft und nächste Schritte

Boilerplate übernommen von `churchtools/extension-boilerplate`, Commit `c723b0154f751412eced661e9c2384f4f5632775`. Vite-Konfiguration und Einstieg wurden für Vue angepasst, der automatische Entwicklungslogin entfernt und Abhängigkeiten aktualisiert. API-Typen, KV-Helfer und Paketierung stammen aus dem Boilerplate. Der KV-Helfer ist für spätere Extension-Einstellungen vorhanden, wird öffentlich nicht ausgeführt.

Siehe [PLAN.md](PLAN.md). Die Verwaltung folgt später: echte Vorlagegruppen im Entwurfsstatus, auswählbare Einstellungsbereiche und Anwendung auf bestehende oder neue Teams. Keine Vorlagenversionierung.

## Gemeinsames Design

Die Palette wird in `src/theme.css` gepflegt: Schwarz/Weiß, Hellblau `#6cc0e4`, Dunkelblau `#141c31` und Goldgelb `#e3bc65` für zentrale Aktionen. Montserrat wird einschließlich Lizenz lokal mitgeliefert. Der kompakte Header verwendet das WNE-Logo.

`PageHero.vue` zeigt das Gruppenbild mit Verlauf nach Schwarz, Breadcrumbs und Großbuchstaben-Titel am unteren Rand. Ohne eigenes Bild wird entlang der Elternhierarchie das nächstgelegene Bild verwendet. `GroupImage.vue` fordert passende `w`/`h`-Varianten an. Das Bild wird in der Detailseite nicht doppelt angezeigt.

Die erste Übersicht verwendet hohe, bildlose Karten mit Titel, Text und umbrechenden Untergruppen. Weitere Kategorien nutzen bildlose Listen; Blattgruppen erscheinen als hohe Bildkarten. Auf der Detailseite stehen auf breiten Seiten Text und Infos links und die Anmeldekarte rechts; mobil folgen sie aufeinander.

`UiButton.vue`, `SignupField.vue` und `FormLabel.vue` bilden die gemeinsamen Formularbausteine. Felder entsprechen den transparenten, eckigen Feldern der WNE-Newsletterseite. HTML-Labels aus ChurchTools werden ausschließlich als Text und sichere Links gerendert.
