var globals = require('../globals'),
  util = require('../util'),
  vlfield = require('../field'),
  Encoding = require('../Encoding');

module.exports = function(encoding, stats) {
  return {
    opacity: estimateOpacity(encoding, stats)
  };
};

 function estimateOpacity(encoding,stats) {
  if (!stats) {
    return 1;
  }

  var numPoints = 0;
  var multipleSkewFactor;
  var maxbins = encoding.config('maxbins');

  if (encoding.isAggregate()) { // aggregate plot
    numPoints = 1;

    //  get number of points in each "cell"
    //  by calculating product of cardinality
    //  for each non faceting and non-ordinal X / Y fields
    //  note that ordinal x,y are not include since we can
    //  consider that ordinal x are subdividing the cell into subcells anyway
    encoding.forEach(function(encType, field) {

      if (encType !== ROW && encType !== COL &&
          !((encType === X || encType === Y) &&
          vlfield.isOrdinalScale(field, Encoding.isType))
        ) {
        numPoints *= vlfield.cardinality(field, stats, maxbins);
      }
    });

    multipleSkewFactor = 0.2; // aggregated plot should have less skew

  } else { // raw plot
    numPoints = stats.count;
    multipleSkewFactor = 0.8;
  }

  // small multiples divide number of points
  var numMultiples = 1;
  if (encoding.has(ROW)) {
    // 0.8  because of skew
    numMultiples *= multipleSkewFactor * vlfield.cardinality(encoding.enc(ROW), stats, maxbins);
  }

  if (encoding.has(COL)) {
    numMultiples *= multipleSkewFactor * vlfield.cardinality(encoding.enc(COL), stats, maxbins);
  }
  numPoints /= numMultiples;

  // console.log('numPoints', numPoints, numMultiples);

  var opacity = 0;
  if (numPoints < 20) {
    opacity = 1;
  } else if (numPoints < 200) {
    opacity = 0.7;
  } else if (numPoints < 1000) {
    opacity = 0.6;
  } else {
    opacity = 0.3;
  }

  return opacity;
}

