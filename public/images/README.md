# Kelime resimleri

Her kelimenin resmi bu klasöre konur. Bir kelimeye resim eklemek için dosyayı
kelimenin adıyla kaydetmek yeterlidir:

```
public/images/Akçe.jpg
public/images/Çadır.png
public/images/İbrik.webp
```

Türkçe karakterler, büyük/küçük harf ve boşluk sorun değildir. Şu adlar da
aynı resmi bulur:

```
akce.jpg
AKCE.JPG
01-akce.png
```

Desteklenen türler: `.webp`, `.avif`, `.jpg`, `.jpeg`, `.png`, `.svg`.
Aynı kelime için birden fazla dosya varsa sırasıyla `webp → avif → jpg → png`
tercih edilir.

## Öneriler

- Kare (1:1) resimler en iyi sonucu verir; farklı oranlar ortadan kırpılır.
- En az 800 × 800 piksel, tercihen `.webp` kullan.
- Resim ekledikten sonra `npm run dev` veya `npm run build` eşlemeyi kendisi
  yeniler. Sunucu açıkken eklediysen `npm run images` çalıştır.

Resmi henüz eklenmemiş kelimelerde okuma ekranında altın renkli simge yer
tutucu olarak görünür; yani resimleri parça parça ekleyebilirsin.

## Beklenen dosya adları

```
akce        azik        bey         buyruk      cenk
cusse       cadir       cerci       degirmen    destur
efsun       ferman      gaip        heybe       heybet
ilica       ibrik       kadi        kagni       kavuk
kervan      maya        mesale      mujde       nasihat
nukte       obur        ozan        oreke       padisah
pusat       riza        sadak       sancak      sifali
tilsim      ulak        vezir       yagiz       yaren
zanaat
```
