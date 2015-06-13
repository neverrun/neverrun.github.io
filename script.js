/*global d3, google*/
// Create the Google Map…
var map = new google.maps.Map( d3.select('#map').node(), {
  zoom: 12,
    minZoom: 12,
    maxZoom: 21,
    center: new google.maps.LatLng( 50.075538, 14.437800 ),
    mapTypeId: google.maps.MapTypeId.ROADMAP
});

// Load the station data. When the data comes back, create an overlay.
d3.json('http://ubuntu-bte.cloudapp.net/rest/v1/db.php?table=stops&limit=5000', function( data ) {
  var overlay = new google.maps.OverlayView();

  // Add the container when the overlay is added to the map.
  overlay.onAdd = function() {
    var layer = d3.select( this.getPanes().overlayLayer ).append('div')
    .attr('class', 'stations');

    // Draw each marker as a separate SVG element.
    // We could use a single SVG, but what size would it have?
    overlay.draw = function() {
      var transform = function( d ) {
        d = new google.maps.LatLng( d.value.stop_lat, d.value.stop_lon );
        d = projection.fromLatLngToDivPixel( d );
        return d3.select( this )
          .style('left', ( d.x - padding ) + 'px')
          .style('top', ( d.y - padding ) + 'px');
      };
      var projection = this.getProjection(),
      padding = 100;

      var marker = layer.selectAll('svg')
        .data( d3.entries( data ) )
        .each( transform ) // update existing markers
        .enter().append('svg:svg')
        .each( transform )
        .attr('class', 'marker');

      // Add a circle.
      var getRadius = function( d ) {
        return 10;
      };
      marker.append('svg:circle')
        .attr('r', 0 )
        .attr('cx', 100 )
        .attr('cy', 100 );

      // Animate in circles
      layer.selectAll( 'circle' ).transition()
        .delay( function() { return 1000 * Math.random(); } )
        .duration( 500 )
        .attr('r', getRadius );

      // Add a label.
      marker.append('svg:text')
        .classed( 'label', true )
        .attr('x', padding + 7 )
        .attr('y', padding )
        .attr('dy', '.31em')
        .text( function( d ) { return d.value.stop_name; } );

      layer.selectAll( 'text.label' ).transition()
        .duration( 500 );
    };
  };

  // Bind our overlay to the map…
  overlay.setMap( map );
});
