// MediSync – ujjlenyomat-azonosító firmware (ESP32 + R307/AS608)
// Könyvtár: "Adafruit Fingerprint Sensor Library" (Arduino Library Manager)
// Soros port (USB): 115200 baud, soronkénti szöveges protokoll:
//   ESP32 -> PC:  READY | FP:<id>:<confidence> | FP:NOMATCH | ENROLL:PUT | ENROLL:AGAIN | ENROLL:OK:<id> | ENROLL:FAIL | ERR:...
//   PC -> ESP32:  ENROLL <id> | CLEAR | PING
#include <Adafruit_Fingerprint.h>

#define FP_RX 16   // <-- a pin-keresővel talált ESP32 RX
#define FP_TX 17   // <-- a pin-keresővel talált ESP32 TX
#define FP_BAUD 57600

Adafruit_Fingerprint finger(&Serial2);
uint32_t lastNoMatch = 0, lastHit = 0;

bool waitFinger(uint32_t ms, bool wantPresent) {
  uint32_t t = millis();
  while (millis() - t < ms) {
    uint8_t p = finger.getImage();
    if (wantPresent && p == FINGERPRINT_OK) return true;
    if (!wantPresent && p == FINGERPRINT_NOFINGER) return true;
    delay(50);
  }
  return false;
}

void enroll(int id) {
  Serial.println("ENROLL:PUT");
  if (!waitFinger(15000, true) || finger.image2Tz(1) != FINGERPRINT_OK) { Serial.println("ENROLL:FAIL"); return; }
  Serial.println("ENROLL:LIFT");
  waitFinger(8000, false);
  Serial.println("ENROLL:AGAIN");
  if (!waitFinger(15000, true) || finger.image2Tz(2) != FINGERPRINT_OK) { Serial.println("ENROLL:FAIL"); return; }
  if (finger.createModel() != FINGERPRINT_OK) { Serial.println("ENROLL:FAIL"); return; }
  if (finger.storeModel(id) != FINGERPRINT_OK) { Serial.println("ENROLL:FAIL"); return; }
  Serial.printf("ENROLL:OK:%d\n", id);
  waitFinger(5000, false);
}

void handleCmd(String s) {
  s.trim();
  if (s == "PING") Serial.println("READY");
  else if (s == "CLEAR") { finger.emptyDatabase(); Serial.println("CLEARED"); }
  else if (s.startsWith("ENROLL ")) enroll(s.substring(7).toInt());
}

void setup() {
  Serial.begin(115200);
  finger.begin(FP_BAUD);                         // a könyvtár begin-je után állítjuk a lábakat
  Serial2.begin(FP_BAUD, SERIAL_8N1, FP_RX, FP_TX);
  delay(300);
  if (finger.verifyPassword()) { finger.getTemplateCount(); Serial.printf("READY templates=%d\n", finger.templateCount); }
  else Serial.println("ERR:SENSOR");
}

void loop() {
  if (Serial.available()) { handleCmd(Serial.readStringUntil('\n')); return; }
  if (finger.getImage() != FINGERPRINT_OK) return;
  if (finger.image2Tz() != FINGERPRINT_OK) return;
  if (finger.fingerFastSearch() == FINGERPRINT_OK) {
    if (millis() - lastHit > 1200) { Serial.printf("FP:%d:%d\n", finger.fingerID, finger.confidence); lastHit = millis(); }
  } else if (millis() - lastNoMatch > 1200) { Serial.println("FP:NOMATCH"); lastNoMatch = millis(); }
}
