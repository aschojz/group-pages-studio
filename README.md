# Group Pages Studio

Konfigurierbare öffentliche Gruppen-Homepage mit hierarchischer Navigation und Einzelpersonen-Anmeldung für ChurchTools. Vue 3, TypeScript und eigene UI-Komponenten auf Grundlage des [ChurchTools Extension Boilerplate](https://github.com/churchtools/extension-boilerplate).

## Lokal starten

Node.js 22.12+ oder 24 und npm verwenden.

```sh
npm ci
npm run dev
```

Für lokale ChurchTools-Daten `.env-example` nach `.env` kopieren und `VITE_BASE_URL` auf die Zielinstanz setzen. Instanzbezogene Werte können in der ignorierten `.env.local` hinterlegt werden. Der Vite-Proxy leitet `/api` und `/logo` an diese Instanz weiter; im Browser ist kein CORS-Setup nötig. Öffentliche Gruppenseiten benötigen keine Zugangsdaten. Die Einstellungsseite verwendet dagegen die ChurchTools-Sitzung.

Mit `VITE_KEY=group-pages-studio` ist ein Einstieg beispielsweise:

`http://localhost:5173/ccm/group-pages-studio/{homepageHash}/100`

`{homepageHash}` durch die Kennung der öffentlichen Gruppen-Homepage und `100` durch die gewünschte Einstiegsgruppen-ID ersetzen. Falls der Port belegt ist, verwendet Vite den nächsten freien Port.

## Navigation und Daten

- URL: `/:homepageHash/:groupIds+`, zum Beispiel `/{homepageHash}/100/110/111`.
- Der Hash bestimmt die ChurchTools-Gruppen-Homepage. Ihre übergeordnete technische Gruppe wird nicht angezeigt. Die erste Gruppen-ID ist der frei wählbare sichtbare Einstieg.
- `GET /api/grouphomepages/{hash}` liefert alle freigegebenen Gruppen. Eine Zuordnung nach ID und die `children`-Referenzen bilden die Hierarchie. Es werden keine zusätzlichen Einzelgruppen außerhalb dieser Homepage geladen.
- Jede Seite zeigt ausschließlich ihre direkten Untergruppen. Andere Zweige erscheinen nicht im Einstieg. Referenzen auf nicht gelieferte Gruppen werden ausgeblendet.
- Kategorien verwenden die gemeinsame `GroupListItem.vue`: Titel, kurzer Text und Vorschau der direkten Untergruppen, ohne Bilder. Blattgruppen verwenden hohe `GroupCard.vue`-Karten mit Bild und kurzem Text. Die Detailseite zeigt Beschreibung, Bild, Gruppenleitung und verfügbare Angaben zu Treffen, Standort, Zielgruppe, Alter und Treffpunkten. Die Gruppenkategorie wird nicht als zusätzliches Detail angezeigt. Es werden nur ausgefüllte öffentliche Angaben angezeigt.
- Breadcrumbs, Zurück-Links und Neuladen verwenden den vollständigen Pfad. Jede Eltern-Kind-Beziehung wird geprüft; ungültige Pfade zeigen eine Fehlermeldung.
- Öffentliche Requests verwenden `credentials: omit`. Die Homepage wird für eine Minute zwischengespeichert; ein erneuter Versuch lädt sie neu.
- Beschreibungen verwenden `MarkdownText.vue` und markdown-it (HTML deaktiviert). Fettschrift, Listen, Überschriften und Links werden formatiert. Klickbare Karten und Kategoriezeilen verwenden eine aus Markdown abgeleitete Textvorschau, damit keine verschachtelten Links entstehen.
- Der Gruppenseitenkopf bleibt beim Wechsel zur Anmeldung stehen. Nur der Inhaltsbereich lädt das Formular nach; vorhandene Gruppendaten werden wiederverwendet.
- „Zur Anmeldung“ öffnet die eigene generische Formularseite `/:homepageHash/:groupIds+/anmeldung`. Erst dort werden anhand der letzten Gruppen-ID ein Token und anschließend die Formularinformationen geladen.
- Anmeldung: `POST /api/publicgroups/{id}/token` → `GET /api/publicgroups/{id}/form?token=…` → nach Absenden `POST /api/publicgroups/{id}/signup`. Immer genau eine Person: `forms: [{ personId: null, form: […] }]`; Feld-IDs und Typen kommen aus ChurchTools. Pflichtfelder, Reihenfolge, Optionen, Vorgaben und Datenschutzzustimmung werden übernommen. Bei einem verifizierten Personen-Token wird ausschließlich die zugehörige Person angemeldet.
- Die `signUpConditions` der geladenen Homepage steuern Verfügbarkeit, Warteliste und Anmeldestatus. Der Form-Endpunkt liefert teilweise unvollständige rollenabhängige Bedingungen; für die Anzeige bleiben deshalb die Homepage-Bedingungen maßgeblich. Die ChurchTools-API prüft die tatsächlichen Berechtigungen bei Token und Anmeldung erneut.
- Bei `emailVerificationMode: all` beginnt die Seite mit der Anforderung eines E-Mail-Links. Der Link führt über `signUpUrlTemplate` wieder zur eigenen Formularseite. Bei `existing`/`none` wird direkt das Formular geladen. Eine `verificationNotice` nach dem Abschicken zeigt die noch erforderliche E-Mail-Bestätigung an.
- Unterstützte Felder: Text/E-Mail/Telefon, Datum, Datum mit Zeit, Zahl, Langtext, Checkbox, Auswahl und Mehrfachauswahl sowie versteckte Vorgabefelder. API-Auswahlfelder benötigen mitgelieferte Optionen. Unbekannte Feldtypen verhindern das Abschicken. Es gibt keine Mehrpersonen-, Familien- oder Partneranmeldung. Tokens und Eingaben werden nicht lokal gespeichert.
- Tests prüfen Statusauswertung, Feldtypen und eindeutige Feldschlüssel, Payload, API-Abfolge und Fehlerantworten mit simulierten Requests. Der Live-Test lädt Token/Formular ohne Abschicken einer echten Anmeldung.

## Prüfen und paketieren

```sh
npm test
npm run build
npm run deploy
```

`deploy` erstellt wie im Boilerplate nur ein ZIP unter `releases/`; es lädt nichts hoch. Vue verwendet History-Routing ohne `#`. ChurchTools muss Unterpfade der Extension auf deren `index.html` zurückführen; der lokale Vite-Server übernimmt dies ebenfalls. `VITE_KEY` bestimmt den Extension-Pfad und muss zum Schlüssel des installierten CCM-Moduls passen. Die Beispiele verwenden `group-pages-studio`.

## Herkunft und nächste Schritte

Boilerplate übernommen von `churchtools/extension-boilerplate`, Commit `c723b0154f751412eced661e9c2384f4f5632775`. Vite-Konfiguration und Einstieg wurden für Vue angepasst, der automatische Entwicklungslogin entfernt und Abhängigkeiten aktualisiert. API-Typen, KV-Helfer und Paketierung stammen aus dem Boilerplate. Die Darstellungskonfiguration verwendet eine eigene typisierte CCM-Anbindung; der ursprüngliche KV-Helfer bleibt als Boilerplate-Bestandteil erhalten.

Siehe [PLAN.md](PLAN.md). Die Extension ist eigenständig und umfasst öffentliche Gruppenseiten, Anmeldung sowie Marken- und Designkonfiguration. Ein Gruppen-Konfigurator und Gruppenvorlagen gehören zu einer separaten Extension.

## Gemeinsames Design

Standardwerte liegen in `src/services/config.ts` und werden über CSS-Variablen auf alle Komponenten angewendet: Schwarz/Weiß, Hellblau `#6cc0e4`, Dunkelblau `#141c31` und Goldgelb `#e3bc65` für zentrale Aktionen. Montserrat wird einschließlich Lizenz lokal mitgeliefert. Der kompakte Header verwendet standardmäßig das Logo der jeweiligen ChurchTools-Instanz.

`PageHero.vue` zeigt das Gruppenbild mit Verlauf nach Schwarz, Breadcrumbs und Großbuchstaben-Titel am unteren Rand. Ohne eigenes Bild wird entlang der Elternhierarchie das nächstgelegene Bild verwendet. `GroupImage.vue` fordert passende `w`/`h`-Varianten an. Das Bild wird in der Detailseite nicht doppelt angezeigt.

Die erste Übersicht verwendet hohe, bildlose Karten mit Titel, Text und umbrechenden Untergruppen. Weitere Kategorien nutzen bildlose Listen; Blattgruppen erscheinen als hohe Bildkarten. Auf der Detailseite stehen auf breiten Seiten Text und Infos links und die Anmeldekarte rechts; mobil folgen sie aufeinander.

`UiButton.vue`, `SignupField.vue` und `FormLabel.vue` bilden die gemeinsamen Formularbausteine. Felder sind transparent und eckig gestaltet. HTML-Labels aus ChurchTools werden ausschließlich als Text und sichere Links gerendert.

## Darstellung konfigurieren

Die Einstellungsseite liegt unter `/admin/settings` (lokale Vorschau: `http://localhost:5173/ccm/group-pages-studio/admin/settings`). Sie verwendet die bestehende ChurchTools-Anmeldung und prüft die CCM-Rechte des Benutzers. Lokal gibt es zusätzlich ein Login über den Vite-Proxy, da die Sitzung der entfernten ChurchTools-Domain nicht für localhost gilt. Zugangsdaten werden nicht gespeichert; Zwei-Faktor-Anmeldung mit TOTP wird unterstützt.

Konfigurierbar sind Markenname, Logo-URL und Logo-Invertierung, Website-Button und URL, Header-/Footertexte, Impressum und Datenschutz sowie fünf Grundfarben, Schrift (Montserrat oder Systemschrift), Inhaltsbreite, Header-/Logogröße, Abschnittsabstände, Button-Abstand/-Rahmen und Eckenradius. Die Vorschau bleibt auf die Einstellungsseite begrenzt. Erst Speichern übernimmt die Werte global. „Auf Standard zurücksetzen“ setzt zunächst nur den Entwurf zurück.

Die installierte Extension wird anhand ihres `VITE_KEY` gesucht. In ihrer CCM-Kategorie `public-config` liegt genau ein Custom-Data-Eintrag als JSON `{ "key": "config", "config": { ... } }`. Die Kategorie lässt sich in der Einstellungsseite mit den entsprechenden Rechten anlegen. Bestehende Einträge werden aktualisiert; vor dem Speichern werden Änderungen durch andere Administratoren geprüft. Diese Prüfung verhindert gewöhnliche Konflikte, ist aber keine atomare serverseitige Sperre. CCM-Schreibrequests verwenden die Sitzung und ein aktuelles CSRF-Token.

Nötige Rechte innerhalb des Moduls:

- Gäste: Extension sehen sowie `view custom category` und `view custom data` für **ausschließlich** `public-config`. Keine Schreibrechte und keine Freigabe interner Kategorien.
- Administratoren: dieselben Leserechte, dazu `create custom data` für den ersten Eintrag und `edit custom data` für spätere Änderungen, jeweils für `public-config`.
- Einrichtung der Kategorie: `create custom category` und Leserechte für alle Kategorien, damit eine bestehende, versteckte Konfiguration nicht versehentlich doppelt angelegt wird.

Die Extension verändert keine Rechte. Nach dem Speichern wird die öffentliche Lesbarkeit geprüft und bei fehlender Freigabe ein Hinweis angezeigt. Ohne lesbare oder gültige gespeicherte Konfiguration greifen die mitgelieferten Standardwerte. In der öffentlichen Ansicht wird die Konfiguration ohne Benutzer-Cookies geladen. Das Standardlogo wird von `/logo` der ChurchTools-Instanz geladen; lokal leitet der Vite-Proxy den Aufruf an die konfigurierte Instanz weiter. „Logo invertieren“ schaltet den CSS-Filter `invert(1)` für Header und Vorschau ein. Eine eigene Logo-URL ist weiterhin möglich.

Gruppen, Hierarchie, Beschreibung, Bilder, Anmeldestatus und Formularfelder bleiben in ChurchTools. Layoutvarianten, Texte der funktionalen UI und der Einzelpersonen-Anmeldeablauf sind weiterhin Teil des Codes. Homepage-Hash und Einstiegsgruppe kommen aus der URL. Ein Gruppen-Konfigurator gehört nicht zum Umfang dieser Extension.

Konfigurationsvalidierung, öffentliche/angemeldete API-Aufrufe, CSRF-Header, Anlegen/Aktualisieren und Rechteprüfungen sind mit simulierten Requests getestet. Anmeldung und CCM-Speicherung mit einem echten CT-Konto sind noch nicht live geprüft.

## Einbettung in ChurchTools

ChurchTools bettet das Extension-HTML in seine eigene Seitenhülle ein. Die Anwendung wird deshalb im offenen Shadow DOM von `#group-pages-studio-root` gerendert. Die eigenen Styles und Theme-Variablen gelten dort; globale ChurchTools-Selektoren können Buttons, Überschriften und Formulare nicht überschreiben. Montserrat wird über eine separate Font-Deklaration geladen.

`src/host.css` passt ausschließlich bei gemounteter Extension die CT-Seitenhülle an: Navigation und CT-Footer ausblenden, reservierten Menüabstand entfernen und Inhaltscontainer ohne zusätzliche Außenabstände darstellen. Die Extension behält ihren eigenen Header und Footer. Andere ChurchTools-Seiten und die CT-Anmeldung bleiben unverändert.
