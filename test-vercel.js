async function run() {
  const html = await fetch('https://streamvault-wheat-three.vercel.app').then(r=>r.text());
  const m = html.match(/assets\/index-[^"']*\.js/);
  if (!m) return console.log('no js file');
  const js = await fetch('https://streamvault-wheat-three.vercel.app/' + m[0]).then(r=>r.text());
  const urls = js.match(/https?:\/\/[^\/"']+\/api/g);
  console.log([...new Set(urls)]);
}
run();
