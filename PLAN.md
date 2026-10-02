# WNE Extension – grober Projektplan

Stand: 2. Oktober 2026. Verfeinerter Plan; erstes öffentliches Frontend implementiert, Felddefinitionen der Verwaltung noch offen.

## Zielbild

`extension-wne` löst `plugin-wne` schrittweise ab. Der erste Ausbauschritt besteht aus einer eigenen öffentlichen Gruppen-Homepage und einem eingeloggten Verwaltungsbereich mit Gruppen-Konfigurator und wiederverwendbaren Gruppenvorlagen. ChurchTools bleibt das führende System für Gruppen und Berechtigungen.

## Ausgangslage und technische Basis

- `extension-wne` war bei der Bestandsaufnahme leer.
- Das alte Plugin verwendet Vue und enthält bereits öffentliche Kategorien, Gruppendetails und WNE-spezifische Anmeldeabläufe. Diese dienen als fachliche Referenz; weitere Funktionen wie Schichten, Import, Backstage und Kleidung gehören nicht automatisch in den ersten Ausbauschritt.
- Als Grundlage ist das offizielle [ChurchTools Extension Boilerplate](https://github.com/churchtools/extension-boilerplate) vorgesehen. Es bringt TypeScript, Vite, den ChurchTools-Client und die Paketierung mit. Vue war nicht enthalten; Vue 3 und Vue Router sind inzwischen ergänzt.
- Eigene UI-Komponenten und Gestaltung, ohne `@churchtools/styleguide` und ohne lokale Abhängigkeiten auf das ChurchTools-Monorepo.
- „Backend“ bedeutet zunächst den geschützten Verwaltungsbereich. Ein eigener Server ist vorerst nicht vorgesehen. Ob Hintergrundverarbeitung erforderlich ist, hängt von Umfang und API-Möglichkeiten der Stapeländerungen ab.
- Vorlagen sind echte ChurchTools-Gruppen im Entwurfsstatus. Keine Kopie ihrer Einstellungen im Key-Value Store und keine Versionierung. Der KV-Store steht bei Bedarf für reine Extension-Konfiguration zur Verfügung.

## 1. Öffentliche Gruppen-Homepage

Besucher finden passende Teams und erhalten die für eine Teilnahme relevanten Informationen.

- Einstieg über Homepage-Hash und Gruppen-ID in der URL (`#/{homepageHash}/6257/6251/6260`). Die technische Wurzel der Homepage bleibt unsichtbar; die erste Gruppen-ID bestimmt den sichtbaren Einstieg. Keine fest hinterlegte Gruppenstruktur.
- Hierarchische Navigation: Wurzel → Kategorien (typischerweise zwei bis drei) → Teams. Jede Ebene ist eine eigene Seite und zeigt nur direkte Kinder; weitere Ebenen funktionieren nach demselben Prinzip.
- Suche innerhalb der aktuellen Ebene bei längeren Listen; Breadcrumbs und Zurück-Navigation aus dem vollständigen ID-Pfad; kein `via`-Query-Parameter.
- Gruppendetail mit Beschreibung, Bild, relevanten Informationen und klarer Anmeldeaktion.
- Mobile Darstellung sowie verständliche Zustände für Laden, Fehler, leere Listen und geschlossene Anmeldung.
- Daten aus `/grouphomepages/{hash}`: Alle freigegebenen Gruppen werden nach ID zugeordnet und über `children` hierarchisch verbunden. Ausschließlich Daten dieser Homepage verwenden; keine zusätzlichen Einzelgruppen laden. Die WNE-Live-Anbindung ist geprüft.
- Öffentliche Ansicht darf ausschließlich öffentlich freigegebene Daten verwenden, auch bei gleichzeitig eingeloggten Administratoren.
- Eigene generische Formularseite nach Klick auf „Zur Anmeldung“, mit ChurchTools-Token/Formular/Signup-Flow. Ausschließlich Einzelpersonen; Feldkonfiguration vollständig aus ChurchTools.
- Jede in der Homepage gelieferte Gruppe kann sichtbarer Einstiegspunkt sein. Kategorien zeigen kompakte Listen mit Titel, Text und Vorschau ihrer Untergruppen ohne Bilder; Blattgruppen erscheinen als hohe Karten. Details enthalten Bild, Markdown-Beschreibung und verfügbare öffentliche Zusatzinformationen einschließlich Teamleitung. Wiederholte Aktionsbeschriftungen und dekorative Slogans entfallen.

## 2. Gruppen-Konfigurator

Zentraler Anwendungsfall: „Übernimm die Einstellungen der Vorlagegruppe Team-Standard für alle ausgewählten Gruppen vom Typ Team.“

### Vorlagen

- Eine echte Gruppe als Vorlage benennen und im ChurchTools-Entwurfsstatus belassen.
- Aktuelle Einstellungen dieser Gruppe sind unmittelbar die Vorlage. Keine Snapshots oder Versionierung.
- Vorlagen aus öffentlichen Seiten und der normalen Zielauswahl ausschließen.
- Einstellungs-Container einzeln auswählen: zunächst Anmeldung, Gruppenmitgliedsfelder und weitere fachlich sinnvolle Bereiche wie Sichtbarkeit oder Gruppenfunktionen. Die genaue Aufteilung bleibt verfeinerbar.
- „Auf bestehende Gruppen anwenden“ und „Neue Gruppe aus Vorlage erstellen“ als getrennte Aktionen.
- Beschreibung, Bild und weitere individuelle Inhalte werden beim Anwenden nicht überschrieben. Neue Gruppen erhalten eigene Namen und Inhalte.

### Anwenden auf bestehende Gruppen

1. Vorlage auswählen.
2. Zielgruppen nach Gruppentyp filtern, beispielsweise „Team“, und Auswahl prüfen.
3. Einstellungsbereiche auswählen; für den vollständigen Abgleich alle unterstützten Bereiche aktivieren.
4. Unterschiede je Gruppe in einer Vorschau sehen.
5. Änderungen ausführen und Ergebnisse je Gruppe anzeigen.
6. Anschließend erneut lesen und prüfen, ob die verwalteten Einstellungen der Vorlage entsprechen.

Der Abgleich muss auch ausgeschaltete oder leere Einstellungen übernehmen können. Bloßes Ergänzen fehlender Werte genügt nicht. Wiederholtes Anwenden derselben Vorlage soll keine weiteren Änderungen erzeugen, sofern die Gruppen bereits übereinstimmen.

### Bedeutung von „alle Einstellungen“

Ziel ist die vollständige Angleichung aller vereinbarten, API-seitig schreibbaren Konfigurationen. Die genaue Feldliste entsteht in der ersten technischen Prüfung. Kandidaten sind Anmeldung, Sichtbarkeit, Gruppenfunktionen, Felddefinitionen und weitere Gruppeneinstellungen, soweit die API sie unterstützt.

Gruppen-ID, Name, Beschreibung, Bild, Mitglieder, Mitgliedsfeldwerte und Historie bleiben individuell. Mitgliedsfelddefinitionen dagegen sind übertragbare Einstellungen. Leitung und Hierarchie werden bei der weiteren Feldabgrenzung eingeordnet. Der Entwurfsstatus der Vorlage darf bestehende aktive Teams nicht versehentlich in Entwürfe umwandeln; bei neuen Gruppen ist der Zielstatus ausdrücklich festzulegen. Globale Einstellungen eines Gruppentyps sind gesondert von Einstellungen einzelner Gruppen zu betrachten.

Nicht unterstützte Einstellungen müssen sichtbar ausgewiesen werden. Die Oberfläche darf dann keine vollständige Übereinstimmung behaupten. Rollen und Felddefinitionen brauchen gegebenenfalls eine Zuordnung statt einer direkten Übernahme gruppenspezifischer IDs.

### Nachvollziehbarkeit

- Zugriff und Änderungen mit der ChurchTools-Sitzung und den tatsächlichen API-Berechtigungen des Benutzers.
- Ergebnisübersicht mit Quellgruppe, Zeitpunkt und Ergebnis pro Zielgruppe; keine Vorlagenversionierung.
- Teilerfolge und Fehler getrennt darstellen; fehlgeschlagene Gruppen gezielt erneut bearbeiten können.
- Vorherige Werte der veränderten Einstellungen sichern. Eine Rücknahme ist auf API-seitig reversible Änderungen begrenzt; keine atomare Änderung über viele Gruppen voraussetzen.
- Zwischen Vorschau und Ausführung Änderungen an den Zielgruppen erkennen und die Vorschau bei Konflikten erneuern.
- Erste Version mit manuellem Anwenden; automatischer dauerhafter Abgleich ist ein späterer Ausbau.

## 3. Gestaltung und Navigation

Inspiration: [weihnachten-neu-erleben.de](https://weihnachten-neu-erleben.de/), visuell geprüft. Die Website arbeitet unter anderem mit dunklem Rahmen, großflächiger Bühnenfotografie, warmem goldenen Licht und weißer Typografie.

Daraus abgeleiteter Entwurf:

- Öffentlich: Einstieg in Marine/Indigo, Orange-Gold als Akzent, großzügige Bilder, prägnante Überschriften und gut lesbare Gruppenkarten.
- Verwaltung: dieselben Markenfarben, aber ruhige helle Arbeitsflächen, kompakte Tabellen und klare Formulare.
- Eigene wiederverwendbare Buttons, Eingaben, Auswahlfelder, Karten, Statusanzeigen, Dialoge und Vergleichsansichten. Farben zentral in `src/theme.css`; dekorative Sterne als gemeinsame SVG-Komponente `BrandStar.vue`.
- Tastaturbedienung, sichtbare Fokuszustände und ausreichende Kontraste von Anfang an berücksichtigen.

| Bereich                | Grober Aufbau                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Gruppen-Homepage       | Homepage-Hash / Einstiegs-ID / Kategorie-ID / Team-ID; technische Wurzel unsichtbar |
| Verwaltung: Gruppen    | Suche/Typfilter → Tabelle mit Vorlagenstatus → Bearbeiten/Anwenden                  |
| Verwaltung: Vorlagen   | Vorlagegruppen im Entwurf → auswählbare Einstellungs-Container                      |
| Vorlage anwenden       | Vorlage → Zielgruppen → Änderungsvorschau → Ergebnis                                |
| Öffentliche Navigation | Automatisch aus Homepage-Daten und direkten Untergruppen                            |

## 4. Umsetzung in Etappen

| Etappe                       | Ergebnis                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Fundament und API-Prüfung | Offizielles Boilerplate übernehmen und Ausgangsrevision dokumentieren; Vue ergänzen; WNE-Konfiguration, Routing, Sitzung und eigene Basis-Komponenten vorbereiten. Übertragbare Gruppenfelder und Rechte an einer Testinstanz prüfen. |
| 2. Öffentliche Homepage      | Übersicht und Details mit echten öffentlichen API-Daten sowie Übergang zur Anmeldung.                                                                                                                                                 |
| 3. Vorlagen-Konfigurator     | Vorlagegruppe im Entwurf auswählen; neue Gruppe daraus anlegen; eine bestehende Testgruppe mit Vorschau angleichen.                                                                                                                   |
| 4. Stapelabgleich            | Gruppentyp-Auswahl, Änderungsvorschau, Ausführung, Ergebnisprüfung und Fehlerbehandlung für mehrere Gruppen.                                                                                                                          |
| 5. Erste Ablösung            | Mit Testgruppen und unterschiedlichen Berechtigungen erproben; öffentliche und interne Nutzung prüfen; neue Extension parallel zum alten Plugin einführen.                                                                            |

Erster Ende-zu-Ende-Meilenstein: Die Homepage zeigt echte freigegebene Teams. Ein berechtigter Benutzer wählt eine Vorlagegruppe im Entwurfsstatus, gleicht ausgewählte Einstellungs-Container zweier Testteams daran an und sieht danach für die verwalteten Einstellungen keine Abweichungen mehr.

## 5. Punkte für die nächste Verfeinerung

- Welche konkreten Einstellungen müssen bei allen Teams identisch sein, und welche Eigenschaften bleiben individuell?
- Eigene Einzelpersonen-Anmeldung ist umgesetzt. Echte Testanmeldungen und E-Mail-Bestätigungen vor Veröffentlichung mit einem vorgesehenen Testteam prüfen.
- Welche Entwurfsgruppe soll als erste Vorlage dienen?
- Welche Benutzer dürfen Vorlagen pflegen und auf welche Gruppen anwenden?
- Wo soll die öffentliche Homepage erreichbar sein: als Extension in ChurchTools oder zusätzlich unter einer eigenen Adresse?

## Implementierungsstand

Das offizielle Boilerplate ist übernommen. Vue, Routing, eigene UI-Komponenten und eine öffentliche, hierarchische Ansicht sind umgesetzt. Die WNE-Homepage ist live angebunden und die Navigation von `6257` über `6251` zu `6260` im Browser geprüft. Hash und ID-Pfad bestimmen den sichtbaren Zweig; Kategorien verwenden die wiederverwendbare bildlose Liste. Ein separater Demo-Pfad steht weiterhin zur Verfügung. Es wurde keine ChurchTools-Instanz verändert. Verwaltungsbereich und Schreib-APIs sind noch nicht umgesetzt bzw. verifiziert. Details zum Start stehen in README.md.
