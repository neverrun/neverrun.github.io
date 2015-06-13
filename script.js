/*global d3, google*/

google.maps.Map.prototype.boundsAt = function (zoom, center, projection, div) {
  var p = projection || this.getProjection();
  if (!p) {
    return undefined;
  }
  //var d = $(div || this.getDiv());
  var d = div || this.getDiv();
  var zf = Math.pow(2, zoom) * 2;
  var dw = d.clientWidth  / zf;
  var dh = d.clientHeight / zf;
  var cpx = p.fromLatLngToPoint(center || this.getCenter());
  var llb = new google.maps.LatLngBounds(
      p.fromPointToLatLng(new google.maps.Point(cpx.x - dw, cpx.y + dh)),
      p.fromPointToLatLng(new google.maps.Point(cpx.x + dw, cpx.y - dh)));
  return {
    'from_long': llb.qa.j,
    'to_long': llb.qa.A,
    'from_lat': llb.za.A,
    'to_lat': llb.za.j
  };
};

// Create the Google Map…
var map = new google.maps.Map( d3.select('#map').node(), {
  zoom: 12,
    minZoom: 12,
    maxZoom: 21,
    center: new google.maps.LatLng( 50.075538, 14.437800 ),
    mapTypeId: google.maps.MapTypeId.ROADMAP
});

var buildQuery = function ( bounds, table ) {
  var url = 'http://ubuntu-bte.cloudapp.net/rest/v1/db.php?table=';
  url += table;
  url += '&limit=500';
  if ( bounds ) {
    Object.keys( bounds ).forEach( function ( key ) {
      url += '&' + key + '=' + bounds[key];
    } );
  }
  return url;
};

var overlay = null;
var layer = null;

// Load the station data. When the data comes back, create an overlay.
var processData = function( data ) {
  if ( overlay ) {
    overlay.setMap( null );
  } else {
  }
  overlay = new google.maps.OverlayView();

  // Add the container when the overlay is added to the map.
  overlay.onAdd = function() {
    layer = d3.select( this.getPanes().overlayLayer ).append('div')
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
        .attr('r', getRadius )
        .attr('cx', 100 )
        .attr('cy', 100 );

      //// Animate in circles
      //layer.selectAll( 'circle' ).transition()
      //  .delay( function() { return 1000 * Math.random(); } )
      //  .duration( 500 )
      //  .attr('r', getRadius );

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

    overlay.onRemove = function () {
      layer.remove();
    };
  };

  // Bind our overlay to the map…
  overlay.setMap( map );
};

var query = buildQuery( null, 'stops' );
d3.json( query, processData );

// Listen for map changes
google.maps.event.addListener( map, 'idle', function() {
  var bounds = this.boundsAt( this.zoom );
  var query = buildQuery( bounds, 'stops' );
  d3.json( query, processData );
});
