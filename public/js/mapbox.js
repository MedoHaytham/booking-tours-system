/* eslint-disable */
export const displayMap = (locations) => {
  const map = new mapboxgl.Map({
    accessToken: document.getElementById('map').dataset.token,
    container: 'map',
    style: 'mapbox://styles/medohaytham1/cmq4s2s0s000j01qr3r283v4h',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach(location => {
    const el = document.createElement('div');
    el.className = 'marker';
    
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
    .setLngLat(location.coordinates)
    .addTo(map);

    new mapboxgl.Popup({
      offset: 30,
      focusAfterOpen: false,
    })
    .setLngLat(location.coordinates)
    .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
    .addTo(map);

    bounds.extend(location.coordinates)
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    }
  });
}