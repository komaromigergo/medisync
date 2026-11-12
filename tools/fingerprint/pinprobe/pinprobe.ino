// MediSync – ujjlenyomat-olvasó PIN-KERESŐ (ESP32)
// Kipróbálja a lábpárokat és a baudrate-eket, és kiírja, hol válaszol az olvasó (R307/AS608 protokoll).
// Soros monitor: 115200 baud.
#include <Arduino.h>

const int RXS[] = {4,5,13,14,16,17,18,19,21,22,23,25,26,27,32,33,34,35,36,39};   // ESP32 RX (ide megy az olvasó TX-e)
const int TXS[] = {4,5,13,14,16,17,18,19,21,22,23,25,26,27,32,33};               // ESP32 TX (ide megy az olvasó RX-e)
const long BAUDS[] = {57600, 9600, 115200};
const uint8_t PKT[] = {0xEF,0x01,0xFF,0xFF,0xFF,0xFF,0x01,0x00,0x07,0x13,0x00,0x00,0x00,0x00,0x00,0x1B}; // VfyPwd

bool probe(int rx, int tx, long baud) {
  Serial2.end();
  Serial2.begin(baud, SERIAL_8N1, rx, tx);
  delay(15);
  while (Serial2.available()) Serial2.read();
  Serial2.write(PKT, sizeof(PKT));
  uint32_t t = millis();
  int idx = 0;
  while (millis() - t < 150) {
    if (Serial2.available()) {
      int b = Serial2.read();
      if (idx == 0 && b == 0xEF) idx = 1;
      else if (idx == 1 && b == 0x01) return true;
      else idx = 0;
    }
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println("\n=== MediSync pin-kereso ===");
  Serial.println("Keresem az ujjlenyomat-olvasot, ~1-2 perc...");
  int found = 0;
  for (int r : RXS) for (int t : TXS) {
    if (r == t) continue;
    for (long b : BAUDS) {
      if (probe(r, t, b)) {
        Serial.printf(">>> TALALAT: ESP32 RX=GPIO%d, ESP32 TX=GPIO%d, baud=%ld\n", r, t, b);
        found++;
      }
    }
  }
  Serial.printf("Kesz. Talalatok: %d\n", found);
  if (!found) Serial.println("Nincs talalat: ellenorizd a taplalast (3.3V/5V, GND) es az USB-kabelt.");
}
void loop() {}
