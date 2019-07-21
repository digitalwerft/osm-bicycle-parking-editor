<template>
  <div class="map">
    <l-map
        :zoom="zoom"
        :center="center"
        @update:zoom="zoomUpdated"
        @update:center="centerUpdated"
        @update:bounds="boundsUpdated"
        @ready="mapReady"
      >
        <l-tile-layer :url="url"></l-tile-layer>
        <l-geo-json
            v-if="elementsLoaded"
            :geojson="geojson"
            :options="options"
            :options-style="styleFunction">
        </l-geo-json>
      </l-map>
    </div>

</template>

<script>
import {LMap, LTileLayer, LGeoJson} from 'vue2-leaflet'
import { icon, marker, layerGroup } from 'leaflet'
import axios from 'axios';
import 'leaflet/dist/leaflet.css'

var bicycleParkingIcon = icon({
  iconUrl: "https://cdn.mapmarker.io/api/v1/pin?size=55&background=%23FE9200&icon=fa-bicycle&color=%23FFFFFF&voffset=0&hoffset=1&",
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

var overpassApiUrl = 'https://lz4.overpass-api.de/api/interpreter';

function overpassJsonToGeoJson (overpassJson) {
  var geoJson = {
    features: []
  };

  overpassJson.elements.forEach(function (element) {
    var feature = {
      type: 'Feature',
      properties: {
        name: 'Parking Spot',
        amenity: 'bicycle_parking'
      },
      geometry: {
        type: 'Point',
        coordinates: null
      }
    };

    switch (element.type) {
      case 'node':
        feature.geometry.coordinates = [element.lon, element.lat];
        break;
      case 'way':
        feature.geometry.coordinates = [element.center.lon, element.center.lat]
        break;
    }
    geoJson.features.push(feature);
  });
  return geoJson;
}

/* eslint-disable */

export default {
  name: 'Map',
  data: function () {
    return {
      url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      zoom: 18,
      center: [52.490643,13.4295803],
      bounds: null,
      geojson: [],
      elementsLoaded: false,
      markerLayerGroup: null,
      map: null
    }
  },
  components: {
    LMap,
    LTileLayer,
    LGeoJson
  },
  methods: {
    zoomUpdated (zoom) {
      this.zoom = zoom;
    },
    centerUpdated (center) {
      this.center = center;
    },
    boundsUpdated (bounds) {
      this.bounds = bounds;
      this.loadFromOverpass();
    },
    mapReady (mapObject) {
      // save ref to map
      this.map = mapObject;
      // set bounds
      this.bounds = mapObject.getBounds();
      // create layer group for markers
      this.markerLayerGroup = layerGroup().addTo(this.map);
      // load data
      this.loadFromOverpass();
    },
    clearMarkers () {
      // remove all markers
      this.markerLayerGroup.clearLayers();
    },
    loadFromOverpass () {
      // skip, if there is no boundary box yet
      if (this.bounds == null) return;
      // clear all existing markers
      this.clearMarkers();
      var bbox = this.bounds._southWest.lat + ',' + this.bounds._southWest.lng + ',' + this.bounds._northEast.lat + ',' + this.bounds._northEast.lng;
      var query = '[out:json][timeout:25]; (node["amenity"="bicycle_parking"](' + bbox + '); way["amenity"="bicycle_parking"](' + bbox + '););out center;';
      var url = overpassApiUrl + '?data=' + query;

      // requests map data from overpass api
      axios.get(url).then((response) => {
        this.geojson = overpassJsonToGeoJson(response.data);
        this.elementsLoaded = true;
      });
    }
  },
  computed: {
    options() {
      var markerLayerGroup = this.markerLayerGroup;
      return {
        pointToLayer: function(feature, latlng) {
            // create marker and add to layer group
            marker(latlng, {icon: bicycleParkingIcon}).addTo(markerLayerGroup)
          },
      };
    },
    styleFunction() {

    },
  }
}
</script>

<style scoped lang="less">
.map {
  .vue2leaflet-map {
    position: absolute;
    top: 0px;
    bottom: 0px;
    right: 0px;
    left: 0px;
  }
}
</style>
