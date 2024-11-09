// app.js
// import { MAPBOX_ACCESS_TOKEN } from "./config.js";

mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN; // set the access token

const map = new mapboxgl.Map({
  container: "map", // The container ID
  style: "mapbox://styles/mapbox/light-v11", // The map style to use
  center: [-105.0178157, 39.737925], // Starting position [lng, lat]
  zoom: 12, // Starting zoom level
});

map.on("load", () => {
  const geocoder = new MapboxGeocoder({
    // Initialize the geocoder
    accessToken: mapboxgl.accessToken, // Set the access token
    mapboxgl: mapboxgl, // Set the mapbox-gl instance
    zoom: 13, // Set the zoom level for geocoding results
    placeholder: "Enter an address or place name", // This placeholder text will display in the search bar
    bbox: [-105.116, 39.679, -104.898, 39.837], // Set a bounding box
  });
  // Add the geocoder to the map
  map.addControl(geocoder, "top-left"); // Add the search box to the top left
  const marker = new mapboxgl.Marker({ color: "#008000" }); // Create a new green marker

  geocoder.on("result", async (event) => {
    // When the geocoder returns a result
    const point = event.result.center; // Capture the result coordinates

    const tileset = "salyana.a4vjsb3u"; // replace this with the ID of the tileset you created
    const radius = 1609; // 1609 meters is roughly equal to one mile
    const limit = 50; // The maximum amount of results to return

    marker.setLngLat(point).addTo(map); // Add the marker to the map at the result coordinates
    const query = await fetch(
      `https://api.mapbox.com/v4/${tileset}/tilequery/${point[0]},${point[1]}.json?radius=${radius}&limit=${limit}&access_token=${mapboxgl.accessToken}`,
      { method: "GET" }
    );
    const json = await query.json();
    // Use the response to populate the 'tilequery' source
    map.getSource("tilequery").setData(json);
  });
  map.addSource("tilequery", {
    // Add a new source to the map style: https://docs.mapbox.com/mapbox-gl-js/api/#map#addsource
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });

  map.addLayer({
    // Add a new layer to the map style: https://docs.mapbox.com/mapbox-gl-js/api/#map#addlayer
    id: "tilequery-points",
    type: "circle",
    source: "tilequery", // Set the layer source
    paint: {
      "circle-stroke-color": "white",
      "circle-stroke-width": {
        // Set the stroke width of each circle: https://docs.mapbox.com/style-spec/reference/layers/#paint-circle-circle-stroke-width
        stops: [
          [0, 0.1],
          [18, 3],
        ],
        base: 5,
      },
      "circle-radius": {
        // Set the radius of each circle, as well as its size at each zoom level: https://docs.mapbox.com/style-spec/reference/layers/#paint-circle-circle-radius
        stops: [
          [12, 5],
          [22, 180],
        ],
        base: 5,
      },
      "circle-color": [
        // Specify the color each circle should be
        "match", // Use the 'match' expression: https://docs.mapbox.com/style-spec/reference/expressions/#match
        ["get", "STORE_TYPE"], // Use the result 'STORE_TYPE' property
        "Small Grocery Store",
        "#008000",
        "Supercenter",
        "#008000",
        "Superette",
        "#008000",
        "Supermarket",
        "#008000",
        "Warehouse Club Store",
        "#008000",
        "Specialty Food Store",
        "#9ACD32",
        "Convenience Store",
        "#FF8C00",
        "Convenience Store With Gas",
        "#FF8C00",
        "Pharmacy",
        "#FF8C00",
        "#FF0000", // any other store type
      ],
    },
  });
  const popup = new mapboxgl.Popup(); // Initialize a new popup

  map.on("mouseenter", "tilequery-points", (event) => {
    map.getCanvas().style.cursor = "pointer"; // When the cursor enters a feature, set it to a pointer
    const properties = event.features[0].properties;
    const obj = JSON.parse(properties.tilequery); // Get the feature's tilequery object (https://docs.mapbox.com/api/maps/#response-retrieve-features-from-vector-tiles)
    const coordinates = new mapboxgl.LngLat(
      properties.longitude,
      properties.latitude
    ); // Create a new LngLat object (https://docs.mapbox.com/mapbox-gl-js/api/#lnglatlike)

    const content = `<h3>${properties.STORE_NAME}</h3><h4>${
      properties.STORE_TYPE
    }</h4><p>${properties.ADDRESS_LINE1}</p><p>${(
      obj.distance / 1609.344
    ).toFixed(2)} mi. from location</p>`;

    popup
      .setLngLat(coordinates) // Set the popup at the given coordinates
      .setHTML(content) // Set the popup contents equal to the HTML elements you created
      .addTo(map); // Add the popup to the map
  });

  map.on("mouseleave", "tilequery-points", () => {
    map.getCanvas().style.cursor = ""; // Reset the cursor when it leaves the point
    popup.remove(); // Remove the popup when the cursor leaves the point
  });
});
