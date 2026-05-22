// GBIF (Global Biodiversity Information Facility) proxy
// CC0 licensed open observation data — no API key required
// Docs: https://www.gbif.org/developer/occurrence

const GBIF_BASE = 'https://api.gbif.org/v1/occurrence/search';

// Map of common herb/fungi names to GBIF scientific names
const SPECIES_MAP = {
  'chanterelle': 'Cantharellus cibarius',
  'chaga': 'Inonotus obliquus',
  'lingonberry': 'Vaccinium vitis-idaea',
  'bilberry': 'Vaccinium myrtillus',
  'nettle': 'Urtica dioica',
  'elderflower': 'Sambucus nigra',
  'yarrow': 'Achillea millefolium',
  'lion\'s mane': 'Hericium erinaceus',
  "lion's mane": 'Hericium erinaceus',
  'turkey tail': 'Trametes versicolor',
  'reishi': 'Ganoderma lucidum',
  'birch polypore': 'Fomitopsis betulina',
  'raspberry': 'Rubus idaeus',
  'rose': 'Rosa canina',
  'porcini': 'Boletus edulis',
  'oyster mushroom': 'Pleurotus ostreatus',
  'meadowsweet': 'Filipendula ulmaria',
  'goldenrod': 'Solidago virgaurea',
  'horsetail': 'Equisetum arvense',
  'pine': 'Pinus sylvestris',
  'amanita': 'Amanita muscaria',
  'amanita muscaria': 'Amanita muscaria',
  'linden': 'Tilia cordata',
  'chickweed': 'Stellaria media',
  'dandelion': 'Taraxacum officinale',
  'cleavers': 'Galium aparine',
  'wood sorrel': 'Oxalis acetosella',
  'morel': 'Morchella esculenta',
  'black trumpet': 'Craterellus cornucopioides',
  'hedgehog mushroom': 'Hydnum repandum',
};

export default async function handler(req, context) {
  const url = new URL(req.url);
  const taxon = url.searchParams.get('taxon') || '';
  const lat = parseFloat(url.searchParams.get('lat') || '59.5');
  const lng = parseFloat(url.searchParams.get('lng') || '15.0');
  const radius = parseFloat(url.searchParams.get('radius') || '150'); // km
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '60'), 100);

  // Resolve scientific name
  const scientificName = SPECIES_MAP[taxon.toLowerCase()] || taxon;

  // Build GBIF query — bounding box around the requested point
  const latDelta = radius / 111; // 1 degree lat ≈ 111 km
  const lngDelta = radius / (111 * Math.cos(lat * Math.PI / 180));

  const params = new URLSearchParams({
    hasCoordinate: 'true',
    hasGeospatialIssue: 'false',
    decimalLatitude: `${lat - latDelta},${lat + latDelta}`,
    decimalLongitude: `${lng - lngDelta},${lng + lngDelta}`,
    limit: limit.toString(),
    fields: 'key,decimalLatitude,decimalLongitude,species,eventDate,stateProvince,datasetName,occurrenceID',
  });

  if (scientificName) {
    params.set('scientificName', scientificName);
  }

  const gbifUrl = `${GBIF_BASE}?${params.toString()}`;

  try {
    const res = await fetch(gbifUrl, {
      headers: { 'User-Agent': 'Fungai-Art-Foraging/1.0 (robin@fungai.art)' },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'GBIF request failed', status: res.status }), {
        status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const data = await res.json();

    // Clean and deduplicate (GBIF can return duplicates across datasets)
    const seen = new Set();
    const observations = (data.results || [])
      .filter(o => o.decimalLatitude && o.decimalLongitude)
      .filter(o => {
        const key = `${o.decimalLatitude.toFixed(4)}_${o.decimalLongitude.toFixed(4)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(o => ({
        id: o.key,
        lat: o.decimalLatitude,
        lng: o.decimalLongitude,
        species: o.species || scientificName,
        date: o.eventDate ? o.eventDate.slice(0, 10) : null,
        region: o.stateProvince || null,
        source: 'GBIF',
      }));

    return new Response(JSON.stringify({
      taxon: scientificName,
      count: observations.length,
      total: data.count,
      observations,
      credit: 'GBIF.org — CC0 1.0 Universal Public Domain',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600', // 1hr cache
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
