export default {
  async fetch(request) {
    const url = new URL(request.url);
    const isoTime = url.pathname.replace(/^\//, '');

    if (!isoTime || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(isoTime)) {
      return new Response(
        JSON.stringify({ error: 'Expected format: /YYYY-MM-DDTHH:MM' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const nasaUrl = `https://svs.gsfc.nasa.gov/api/dialamoon/${isoTime}`;
    const resp = await fetch(nasaUrl);

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: `NASA SVS returned ${resp.status}` }),
        { status: resp.status, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const data = await resp.text();
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
