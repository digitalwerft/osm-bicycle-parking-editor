module.exports = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? '/osm-bicycle-parking-editor/dist/'
    : '/'
}
