# Ujjlenyomat-olvasó (ESP32 + R307)

- `pinprobe/` – megkeresi, melyik lábakra van kötve az olvasó (talált: RX=GPIO16, TX=GPIO17, 57600 baud).
- `medisync_fp/` – a tényleges firmware. USB soros port, 115200 baud, soronkénti protokoll
  (`FP:<id>:<conf>`, `FP:NOMATCH`, `ENROLL <id>`, `READY templates=N`).
- A lenyomatok az olvasó saját memóriájában vannak. A weboldal (Chrome, Web Serial) csak az azonosítót kapja.
- Tárolóhelyek: 1 = Teszt Elek, 2 = Példa Piroska (`src/app/orvos/page.tsx`, `FP_SLOTS`).
