/*
  Danzz For You 💌

  Beberapa router (BMKG, alquran.cloud) manggil proxy() sebagai prefix URL
  tapi fungsinya nggak pernah ada — cuma `declare const`, yang hilang saat
  compile. Hasilnya ReferenceError begitu endpoint-nya dipanggil.

  Di sini dibikin implementasi aslinya: default kosong (langsung ke sumber),
  dan bisa diarahkan lewat env PROXY_URL kalau suatu saat host tujuan
  memblokir IP server.

    PROXY_URL=https://api.allorigins.win/raw?url=
*/
export const proxy = (): string => process.env.PROXY_URL || '';

export default proxy;
