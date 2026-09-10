/*
  İÇERİK DOSYASI
  ------------------------------------------------------------
  Bu dosyadaki örnek başlık/metinleri kendi gerçek şiir ve yazılarınla
  değiştirmen yeterli. Tasarım ve filtre sistemi otomatik çalışır.
  Mevcut Supabase yapına bağlanırken bu diziler API verisiyle değiştirilebilir.
*/

window.CF_CONTENT = {
  quotes: [
    "İnsan bazen kendini en çok, kimseye anlatmadığı yerde bulur.",
    "Bazı yollar bir yere varmak için değil, insanın içinden geçmek içindir.",
    "Geçmiş gitmez; yalnızca sesini biraz kısar.",
    "Bir insanı anlamak için söylediklerinden çok, sustuğu yerlere bak.",
    "Hayat bazen cevap vermez. Yalnızca insanı biraz daha dikkatli yapar."
  ],

  poems: [
    {
      id: 1,
      title: "Sokak Lambasının Altında",
      category: "eski-zamanlar",
      categoryLabel: "Eski Zamanlar",
      date: "Eylül 2026",
      excerpt: "Akşam, sarı bir ışık gibi düştü çocukluğun üzerine…",
      body: "Akşam, sarı bir ışık gibi\ndüştü çocukluğun üzerine.\n\nBir sokağın ucunda kaldı sesimiz,\nbir annenin pencereden çağırışında.\n\nBüyüdük.\nAma bazı akşamlar hâlâ\no lambanın altında bekliyor."
    },
    {
      id: 2,
      title: "Kalabalıkların İçinde",
      category: "yalnizlik",
      categoryLabel: "Yalnızlık",
      date: "Ağustos 2026",
      excerpt: "En çok insanın olduğu yerde sustum; kimse fark etmedi.",
      body: "En çok insanın olduğu yerde sustum.\nKimse fark etmedi.\n\nÇünkü yalnızlık bazen\nbir odanın boşluğu değil,\nbir cümlenin karşılıksız kalışıdır."
    },
    {
      id: 3,
      title: "Babamın Elleri",
      category: "insan",
      categoryLabel: "İnsan",
      date: "Temmuz 2026",
      excerpt: "Bazı eller konuşmaz; yılları avuçlarının içinde taşır.",
      body: "Bazı eller konuşmaz.\nYılları avuçlarının içinde taşır.\n\nBir nasırın içinde saklıdır\nkimsenin bilmediği bir yorgunluk.\n\nBen büyüdükçe\nbabamın elleri daha çok şey anlattı."
    },
    {
      id: 4,
      title: "Çocukken Dünya",
      category: "cocukluk",
      categoryLabel: "Çocukluk",
      date: "Haziran 2026",
      excerpt: "Dünya küçüktü; bir sokak, bir top ve eve geç kalma korkusu kadar.",
      body: "Dünya küçüktü çocukken.\nBir sokak, bir top,\neve geç kalma korkusu kadar.\n\nSonra büyüdük.\nDünya büyüdü,\nbizim yerimiz küçüldü."
    },
    {
      id: 5,
      title: "Eksik Olanla",
      category: "hayat",
      categoryLabel: "Hayat",
      date: "Mayıs 2026",
      excerpt: "İnsana her şey verilir; ama hiçbir zaman aynı anda değil.",
      body: "İnsana her şey verilir,\nama hiçbir zaman aynı anda değil.\n\nVakit gelir, para gider.\nGüç gelir, sabır eksilir.\n\nBelki de hayat,\ntamamlanmayı beklemek değil;\neksik olanla yürümeyi öğrenmektir."
    }
  ],

  writings: [
    {
      id: 101,
      title: "İnsana Her Şey Aynı Anda Verilmez",
      category: "Hayat",
      date: "09.09.2026",
      body: "Hayatın en sessiz adaletsizliği şudur: İnsana her şey verilir, ama hiçbir zaman aynı anda verilmez.\n\nÇocukken vaktin vardır, paran yoktur. Gençken gücün vardır; tecrüben ve sabrın yetişmez. Yetişkinlikte para kazanırsın, bu kez zamanın tükenir. Yaşlandığında ise her şeyi tartacak aklın ve vaktin olur; fakat beden o yükü taşımaz.\n\nİnsanın en büyük yanılgısı, bütün şartların aynı anda kusursuz olacağı o günü beklemektir. O gün gelmez; hayat, eksik olanla yürümeyi öğrenmektir."
    },
    {
      id: 102,
      title: "Büyümek Biraz da Susmayı Öğrenmektir",
      category: "İnsan",
      date: "27.08.2026",
      body: "Büyümek yalnızca yaş almak değildir. Ne zaman susacağını ve kime ne kadarını anlatacağını bilmektir.\n\nHer doğru her insana söylenmez. Bazen insan kendini korumak için değil, sözün değerini korumak için susar."
    },
    {
      id: 103,
      title: "Eski Evlerin Pencereleri",
      category: "Eski Zamanlar",
      date: "12.08.2026",
      body: "Bazı evleri yıktıklarında yalnızca duvarlar gitmez. Bir mahallenin hafızası da sessizce eksilir.\n\nPencereler kapanır, sokak isimleri değişir; ama insan çocukluğunun adresini zihninde yıllarca taşır."
    }
  ]
};
