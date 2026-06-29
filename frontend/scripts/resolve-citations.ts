// For each broken citation, ping a list of candidate replacement URLs (NICE CKS
// variants first, then NHS / DermNet fallbacks) and pick the first that resolves.
// Prints an old->new map. Does NOT mutate anything.
//
//   npm exec tsx scripts/resolve-citations.ts

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function ping(url: string): Promise<number> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 20000)
  try { return (await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA } })).status }
  catch { return 0 } finally { clearTimeout(t) }
}

const cks = (s: string) => `https://cks.nice.org.uk/topics/${s}/`
const nhs = (s: string) => `https://www.nhs.uk/conditions/${s}/`
const dn = (s: string) => `https://dermnetnz.org/topics/${s}`

// old broken URL -> ordered candidate replacements { url, source, title }
const FIX: Record<string, { url: string; source: string; title: string }[]> = {
  [cks('ankylosing-spondylitis')]: [{ url: cks('spondyloarthritis'), source: 'NICE CKS', title: 'Spondyloarthritis' }, { url: nhs('ankylosing-spondylitis'), source: 'NHS', title: 'Ankylosing spondylitis' }],
  [cks('blood-pressure-low')]: [{ url: nhs('low-blood-pressure-hypotension'), source: 'NHS', title: 'Low blood pressure (hypotension)' }],
  [cks('bronchiolitis')]: [{ url: cks('bronchiolitis-acute'), source: 'NICE CKS', title: 'Bronchiolitis (acute)' }, { url: nhs('bronchiolitis'), source: 'NHS', title: 'Bronchiolitis' }],
  [cks('cluster-headache')]: [{ url: cks('headache-cluster'), source: 'NICE CKS', title: 'Headache - cluster' }, { url: nhs('cluster-headaches'), source: 'NHS', title: 'Cluster headaches' }],
  [cks('dvt-deep-vein-thrombosis')]: [{ url: cks('deep-vein-thrombosis'), source: 'NICE CKS', title: 'Deep vein thrombosis' }],
  [cks('fibromyalgia')]: [{ url: cks('fibromyalgia'), source: 'NICE CKS', title: 'Fibromyalgia' }, { url: nhs('fibromyalgia'), source: 'NHS', title: 'Fibromyalgia' }],
  [cks('glandular-fever-infectious-mononucleosis')]: [{ url: cks('glandular-fever-infectious-mononucleosis-'), source: 'NICE CKS', title: 'Glandular fever (infectious mononucleosis)' }, { url: nhs('glandular-fever'), source: 'NHS', title: 'Glandular fever' }],
  [cks('gord')]: [{ url: cks('dyspepsia-proven-gord'), source: 'NICE CKS', title: 'Dyspepsia - proven GORD' }, { url: nhs('heartburn-and-acid-reflux'), source: 'NHS', title: 'Heartburn and acid reflux' }],
  [cks('hidradenitis-suppurativa')]: [{ url: dn('hidradenitis-suppurativa'), source: 'DermNet', title: 'Hidradenitis suppurativa' }, { url: nhs('hidradenitis-suppurativa'), source: 'NHS', title: 'Hidradenitis suppurativa' }],
  [cks('lactose-intolerance')]: [{ url: cks('lactose-intolerance'), source: 'NICE CKS', title: 'Lactose intolerance' }, { url: nhs('lactose-intolerance'), source: 'NHS', title: 'Lactose intolerance' }],
  [cks('mastitis-and-breast-abscess')]: [{ url: cks('mastitis-and-breast-abscess'), source: 'NICE CKS', title: 'Mastitis and breast abscess' }, { url: nhs('mastitis'), source: 'NHS', title: 'Mastitis' }],
  [cks('menorrhagia')]: [{ url: cks('menorrhagia-heavy-menstrual-bleeding'), source: 'NICE CKS', title: 'Menorrhagia (heavy menstrual bleeding)' }, { url: nhs('heavy-periods'), source: 'NHS', title: 'Heavy periods' }],
  [cks('panic-disorder')]: [{ url: cks('generalized-anxiety-disorder'), source: 'NICE CKS', title: 'Generalized anxiety disorder' }, { url: nhs('panic-disorder'), source: 'NHS', title: 'Panic disorder' }],
  [cks('psoriatic-arthritis')]: [{ url: cks('psoriasis'), source: 'NICE CKS', title: 'Psoriasis' }, { url: nhs('psoriatic-arthritis'), source: 'NHS', title: 'Psoriatic arthritis' }],
  [cks('scrotal-pain-and-swelling')]: [{ url: cks('scrotal-pain-and-swelling'), source: 'NICE CKS', title: 'Scrotal pain and swelling' }, { url: nhs('testicular-lumps-and-swellings'), source: 'NHS', title: 'Testicular lumps and swellings' }],
  [cks('stroke-and-tia')]: [{ url: cks('stroke-and-tia'), source: 'NICE CKS', title: 'Stroke and TIA' }, { url: nhs('stroke'), source: 'NHS', title: 'Stroke' }],
  [cks('styes-meibomian-cysts')]: [{ url: cks('meibomian-cyst-chalazion'), source: 'NICE CKS', title: 'Meibomian cyst (chalazion)' }, { url: nhs('stye'), source: 'NHS', title: 'Stye' }],
  [cks('tenosynovitis')]: [{ url: cks('tenosynovitis'), source: 'NICE CKS', title: 'Tenosynovitis' }, { url: nhs('tendonitis'), source: 'NHS', title: 'Tendonitis' }],
  [cks('vitamin-d-deficiency')]: [{ url: cks('vitamin-d-deficiency-in-adults'), source: 'NICE CKS', title: 'Vitamin D deficiency in adults' }, { url: nhs('vitamins-and-minerals/vitamin-d'), source: 'NHS', title: 'Vitamin D' }],
  [dn('bcc')]: [{ url: dn('basal-cell-carcinoma'), source: 'DermNet', title: 'Basal cell carcinoma' }],
  [dn('erythema-migrans')]: [{ url: dn('lyme-disease'), source: 'DermNet', title: 'Lyme disease' }, { url: nhs('lyme-disease'), source: 'NHS', title: 'Lyme disease' }],
  [dn('urticaria')]: [{ url: dn('urticaria-an-overview'), source: 'DermNet', title: 'Urticaria - an overview' }, { url: nhs('hives'), source: 'NHS', title: 'Hives (urticaria)' }],
}

async function main() {
  const out: Record<string, { url: string; source: string; title: string }> = {}
  for (const [oldUrl, cands] of Object.entries(FIX)) {
    let chosen: typeof cands[0] | null = null
    for (const c of cands) {
      const s = await ping(c.url)
      await sleep(200)
      if (s >= 200 && s < 400) { chosen = c; break }
    }
    if (chosen) { out[oldUrl] = chosen; console.log(`  ✓ ${oldUrl}\n      -> [${chosen.source}] ${chosen.url}`) }
    else console.log(`  ✗ NO REPLACEMENT FOUND for ${oldUrl}`)
  }
  console.log('\nJSON_MAP_START')
  console.log(JSON.stringify(out))
  console.log('JSON_MAP_END')
}
main().catch((e) => { console.error(e); process.exit(1) })
