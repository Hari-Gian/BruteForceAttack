# Brute-Force Attack Implementation Status

## Requirements Analysis

Based on `anforderungen.txt`, here's the current implementation status:

### 4.1.1 Einfach - Mono-Alphabet
- ✅ **Implemented**
  - Klein- und Grossschreibung: Letters (A-Z, a-z)
  - Zahlen: 0-9
  - Sonderzeichen: !@#$%^&*()_+-=~`[]{}|\;:'",.<>?/©®™±§¶°¿¡

### 4.1.2 Mittel - Poly-Alphabet
- ✅ **Implemented**
  - Türkische Zeichen: ÇŞĞİÖÜçşğıöü
  - Kyrillische Zeichen: АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя

### 4.1.2 Mittel - Dictionaries
- ✅ **Implemented**
  - Smart-Vorgehen durch Verwendung von Benutzer-Kredentials und deren Permutationen
  - Dictionary-Angriff mit `PasswordDictionary.txt`
  - Parallele Verarbeitung der Dictionary-Attacke

### 4.1.3 Komplexe Angriffe - Parallelisierter Angriff
- ✅ **Implemented**
  - Echte Worker Threads für maximale Parallelität
  - Nutzung aller verfügbaren CPU-Kerne (22 Kerne)
  - Bidirektionale Suche (eine Gruppe geht nach oben, eine nach unten)
  - 70/30 Verteilung (längere vs. kürzere Passwörter)

### 4.1.3 Komplexe Angriffe - Rainbow-Tables
- ✅ **Fully Implemented**
  - Vorbereitete Hash-Plain-Tabelle (SHA-256) implementiert
  - Generator-Script: `generate-rainbow-table.js`
  - Rainbow-Table mit ~299.000 vorberechneten Hashes
  - Lookup-Zeit: <0.01s (praktisch sofort)
  - Beinhaltet: Dictionary-Passwörter, Benutzer-Permutationen, kurze Passwörter (1-3 Zeichen)
  - Module: `rainbow-table.js` für Hash-Generierung und Lookup

### 4.1.4 Angriff in separatem File
- ✅ **Fully Implemented**
  - Angriff ist in separatem File (`attack.js`) untergebracht
  - Alle Angriffsmethoden sind in separate Module aufgeteilt:
    - `credential-permutation.js` - Generierung von Permutationen aus Benutzerdaten
    - `dictionary-attack.js` - Smart Dictionary Angriff
    - `bruteforce-attack.js` - Brute-Force Angriff
    - `attack-worker.js` - Worker für parallele Brute-Force Berechnungen
  - Master-Datei `attack.js` koordiniert alle Angriffe
  - Parametrisierbarkeit durch Übergabe von Konfigurationsdaten

## Current Features

### Password Generation
- Alle Alphabete (Latein, Türkisch, Kyrillisch)
- Zahlen und Sonderzeichen
- Permutationen aus Benutzerdaten (E-Mail, Geburtstag, Name, Nachname)

### Attack Methods
1. **Smart Dictionary Attack**
   - Nutzt Benutzer-Kredentials zur Generierung von Passwort-Permutationen
   - Common Password Dictionary (`PasswordDictionary.txt`)
   - Parallele Verarbeitung für maximale Geschwindigkeit

2. **Brute-Force Attack**
   - Bidirektionale parallele Suche
   - 70% der Kerne suchen längere Passwörter (UP-Gruppe)
   - 30% der Kerne suchen kürzere Passwörter (DOWN-Gruppe)
   - Sofortiger Stop bei Fund

### Performance Optimization
- Echte Parallelisierung mit Worker Threads
- Vollständige CPU-Auslastung (21/22 Kerne)
- Effiziente Aufteilung der Suchräume

## Remaining Tasks

### 1. Parametrisierbarkeit
- [ ] Kommandozeilen-Parameter für Ziel-Hash
- [ ] Konfigurierbare Alphabete
- [ ] Einstellbare Suchstrategie
- [ ] Export-Funktion für Ergebnisse

### 3. Dokumentation
- [ ] Erweiterung der README.md
- [ ] CLI-Hilfe implementieren
- [ ] Anwendungsbeispiele dokumentieren

## Testing Results

### Successful Tests
- ✅ **Rainbow Table Attack** - Password found in <0.01s (instantly!)
- ✅ Smart Dictionary Attack (Benutzer-Kredentials)
- ✅ Common Password Dictionary Attack
- ✅ Bidirektionale parallele Brute-Force Attack
- ✅ Maximale CPU-Auslastung (21/22 Kerne)
- ✅ Passwort gefunden: "şД3\" (Länge 4)

### Performance Metrics
- **Rainbow Table Lookup**: <0.01s (praktisch sofort)
- **Rainbow Table Size**: ~299.000 vorberechnete Hashes
- **Dictionary Attack**: Innerhalb von Millisekunden
- **Brute-Force (Länge 4)**: ~9-76 Sekunden (je nach Glück)
- **CPU-Auslastung**: 95-100% während Brute-Force
- **Memory Usage**: Effizient durch Worker-basierte Aufteilung

## Attack Sequence

Das System versucht die Angriffe in optimaler Reihenfolge:

1. **Rainbow Table Attack** (schnellste Methode)
   - O(1) Lookup-Zeit
   - Findet bekannte Passwörter sofort
   
2. **Smart Dictionary Attack** (mittlere Geschwindigkeit)
   - Nutzt Benutzer-Permutationen
   - Common Password Dictionary
   
3. **Brute-Force Attack** (langsamste, aber vollständig)
   - Bidirektionale parallele Suche
   - Nutzt alle CPU-Kerne

## Recommendations

1. **Parametrisierbarkeit** - Würde die Flexibilität des Tools erhöhen (CLI-Parameter, etc.)
2. **Erweiterte Rainbow-Tables** - Größere Tables für noch mehr Abdeckung
3. **Erweiterte Dokumentation** - Für einfachere Bedienung und Wartung
