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

- Dikey (3:4) resimler kullan; site resmi kırpmadan olduğu gibi gösterir.
- Yaklaşık 1200 × 1600 piksel, tercihen `.webp` veya kaliteli `.jpg` kullan.
- Resim ekledikten sonra `npm run dev` veya `npm run build` eşlemeyi kendisi
  yeniler. Sunucu açıkken eklediysen `npm run images` çalıştır.

Resmi henüz eklenmemiş kelimelerde okuma ekranında altın renkli simge yer
tutucu olarak görünür; yani resimleri parça parça ekleyebilirsin.

## Beklenen dosya adları

```
akce        azik        basma       bey         buyruk
cusse       cadir       cerag       cerci       degirmen
destur      diyar       efsun       gaip        ibrik
kavuk       kilim       mesale      mujde       nasihat
oreke       padisah     pusat       sadak       sancak
sultan      sifali      yalak       zanaat      zindan
kaynakca
```
