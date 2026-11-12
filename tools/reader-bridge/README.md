# MediSync olvasó-híd

A weboldal nem éri el közvetlenül a chipkártya-olvasót, ezért ez a kis program fut a MacBookon,
és a kártya behelyezését (a kártya típusjelét, ATR) továbbítja az oldalnak a saját gépen (127.0.0.1:8787).
Személyes adatot nem olvas ki, PIN-kódot nem kér.

## Telepítés (egyszer, MacBookon)
1. Node.js (https://nodejs.org, LTS) és az Xcode parancssori eszközök: `xcode-select --install`
2. A mappában: `npm install`

## Használat
- `npm start`: a valódi olvasóval
- `npm run demo`: olvasó nélküli próba (6 másodpercenként be-/kivesz egy kitalált kártyát)
- Az oldalon: Orvos → „e-személyi (olvasó)" fül, Chrome böngészővel. Az első csatlakozásnál a Chrome
  engedélyt kérhet a helyi hálózat eléréséhez: engedélyezni kell.
