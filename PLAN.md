# Group Pages Studio – Projektplan

## Umfang

Eine eigenständige ChurchTools-Extension für gestaltbare, konfigurierbare öffentliche Gruppen-Homepages. ChurchTools bleibt das führende System für Gruppeninhalte, Hierarchie, Anmeldebedingungen und Formularfelder. Der Extension-Key ist `group-pages-studio`.

Die Extension umfasst öffentliche Gruppenseiten, eine eigene Einzelpersonen-Anmeldung über den ChurchTools-Flow und einen eingeloggten Bereich für Marke und Design. Gruppen-Konfigurator, Vorlagegruppen und Stapeländerungen werden als separate Extension betrachtet.

## Öffentliche Darstellung

- Einstieg über Homepage-Kennung und frei wählbare Gruppen-ID: `/ccm/group-pages-studio/{homepageHash}/100`.
- Hierarchie aus `children` der öffentlichen Homepage; jede Seite zeigt nur direkte Untergruppen. Die technische Wurzel bleibt unsichtbar.
- Kategorien mit Titel, Beschreibung und Untergruppen; Blattgruppen mit Bild, Markdown-Beschreibung und ausgefüllten öffentlichen Informationen.
- Gruppenbild im Seitenkopf; ohne eigenes Bild rekursiv das nächstgelegene Elternbild verwenden.
- Breadcrumbs und Zurück-Navigation aus dem vollständigen ID-Pfad. History-Routing ohne `#`.
- Mobile Darstellung und verständliche Lade-, Fehler- und Leerzustände.
- Öffentliche Requests ohne Benutzer-Cookies; keine zusätzlichen internen Gruppendaten laden.

## Anmeldung

- Eigene generische Seite nach Klick auf „Zur Anmeldung“: `/{homepageHash}/{groupIds}/anmeldung` relativ zum Extension-Pfad.
- Gruppenseitenkopf bleibt bestehen, während nur der Inhalt das Formular lädt.
- ChurchTools-Flow: Token anfordern → Formular laden → Einzelpersonen-Anmeldung absenden.
- Felddefinitionen, Pflichtfelder, Vorgaben, Auswahloptionen und Datenschutz aus ChurchTools übernehmen.
- Anmeldebedingungen, Warteliste und E-Mail-Verifizierung berücksichtigen. Keine Mehrpersonen-Anmeldung.

## Marke und Design

- Eigene wiederverwendbare UI-Komponenten ohne ChurchTools-Styleguide.
- Zentrale CSS-Variablen für Farben, Schrift, Größen, Abstände und Button-Darstellung.
- Logo der ChurchTools-Instanz unter `/logo`, optional invertiert; eigene Logo-URL möglich.
- Marke, externe Links und Header-/Footertexte konfigurierbar.
- Einstellungsseite unter `/admin/settings` mit begrenzter Vorschau; erst Speichern übernimmt die Werte global.
- Konfiguration als JSON im CCM unter `public-config`; öffentliche Lesbarkeit und Schreibrechte getrennt behandeln.
- Sitzung und CSRF-Token für Schreibzugriffe, Validierung und Konfliktprüfung vor dem Speichern. Keine automatische Änderung von Rechten.

## Stand und nächste Schritte

Boilerplate, Vue, Routing, öffentliche Hierarchie, Anmeldung und Design-Einstellungen sind implementiert. API-Flow und Konfiguration werden mit simulierten Requests getestet. Öffentliche Darstellung und Navigation sind im Browser geprüft.

Vor Veröffentlichung bleiben:

1. CCM-Einrichtung und Speicherung mit einem berechtigten Benutzerkonto prüfen, einschließlich öffentlicher Leserechte.
2. Echte Testanmeldungen, E-Mail-Verifizierung, Warteliste und geschlossene Gruppen mit vorgesehenen Testgruppen prüfen.
3. Darstellung mit unterschiedlichen Gruppenstrukturen, Textlängen, Bildern und Markenwerten erproben.
4. Installation und Direktlinks auf der Zielinstanz unter dem Extension-Key prüfen.

Details zum lokalen Start, zur Paketierung und zu den Rechten stehen in [README.md](README.md).
