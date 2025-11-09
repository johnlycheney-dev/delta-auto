import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { fetch } from 'undici';

const root = process.cwd();
const cfgPath = join(root, 'fetcher', 'config.json');
const outDir = join(root, 'public');
mkdirSync(outDir, { recursive: true });

const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'));

// helper: fetch and parse a single SKU
async function fetchSKU(sku){
  const conf = cfg.sources[sku];
  if(!conf){ return { sku, M: null, error: "no source config" }; }

  try{
    const res = await fetch(conf.url, { headers: conf.headers || {} });
    const html = await res.text();
    if(conf.selector){
      const $ = cheerio.load(html);
      const txt = $(conf.selector).first().text().trim();
      const m = (txt.match(conf.regex ? new RegExp(conf.regex) : /[\d.,]+/) || [null])[0];
      const val = m ? parseFloat(String(m).replace(/,/g,'')) : null;
      return { sku, M: val, raw: txt };
    }else if(conf.jsonPath){
      const j = JSON.parse(html);
      const val = conf.jsonPath.split('.').reduce((o,k)=>o?.[k], j);
      return { sku, M: typeof val === 'number' ? val : (val ? parseFloat(val) : null) };
    }else{
      return { sku, M: null, error: "no selector/jsonPath" };
    }
  }catch(e){
    return { sku, M: null, error: e.message };
  }
}

const items = [];
for(const sku of cfg.skus){
  /* eslint-disable no-await-in-loop */
  const r = await fetchSKU(sku);
  items.push(r);
}

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth()+1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const out = {
  date: `${yyyy}-${mm}-${dd}`,
  items: items.map(x=>({ sku: x.sku, M: x.M })),
  meta: items
};

writeFileSync(join(outDir, 'market-today.json'), JSON.stringify(out, null, 2), 'utf-8');
console.log("Wrote public/market-today.json with", items.length, "items.");
