var mapWidth = 12,
    mapHeight = 8,
    cellSize = 55,
    margin = 4;

var width = mapWidth * cellSize + margin,
    height = mapHeight * cellSize + margin;

var colors = {D: '#009de3', R: '#ff5c37'},
    selectedParty = 'D',
    dragParty;

var check = '<img class="px1" src="assets/img/check.png" width="16">';

var svg = d3.select('#viz')
    .on('touchstart', nozoom)
    .on('touchmove', nozoom)
  .append('svg')
    .attr('width', width)
    .attr('height', height)
    .call(responsivefy)

var totals = d3.selectAll('.total'),
    need = d3.selectAll('.need');

var tweet = d3.select('.tweet');

d3.selectAll('input').on('change', function() { selectedParty = this.value; });

d3.json('assets/data/data.json', function(error, data) {
    var stateIds = data.map(function(d) { return d.id; });

    var state = svg.append('g')
        .attr('class', 'foreground')
        .attr('transform', 'translate(' + margin / 2 + ',' + margin / 2  + ')')
      .selectAll('.state')
        .data(data)
      .enter().append('g')
        .attr('class', 'state')
        .attr('transform', function(d) {
          return 'translate(' + d.grid.x * cellSize + ',' + (d.grid.y - 1) * cellSize + ')';
        })
        .on('mouseover', function() { this.style.stroke = 'black'; })
        .on('mouseout', function() { this.style.stroke = 'none'; })
        .call(d3.behavior.drag()
          .on('dragstart', dragStart)
          .on('drag', drag));

    state.append('rect')
        .attr('width', cellSize - 2)
        .attr('height', cellSize - 2)
        .style('fill', '#dedede');

    state.append('text')
        .attr('x', cellSize / 2)
        .attr('y', cellSize / 2)
        .attr('dy', '.35em')
        .text(function(d) { return d.name_short; });

    state.append('text')
        .attr('class', 'votes')
        .attr('x', cellSize - 4)
        .attr('y', cellSize - 5)
        .text(function(d) { return d.votes; });

    init();

    function dragStart() {
      var d = d3.event.sourceEvent.target.__data__;
      if (assign(d, dragParty = d.win === selectedParty ? null : selectedParty)) update();
    }

    function drag() {
      var d = d3.event.sourceEvent.target.__data__;
      if (d && assign(d, dragParty)) update();
    }

    function assign(state, party) {
      if (state.win === party) return false;
      if (party !== null) state.win = party;
      else state.win = null;
      return true;
    }

    function init() {
      var picks = top.location.hash.slice(1).split(',');
      picks.forEach(function(d) {
        var info = d.split('-'), state = info[0], party = info[1];
        var i = stateIds.indexOf(state);
        if (i > -1 && true) assign(data[i], party);
      });

      update();
    }

    function update() {
      updateColors();
      updateTotals();
      updateUrl();
      updateTweet();
    }

    function updateColors() {
      state.data(data);
      state.select('rect').style('fill', function(d) {
        return d.win ? colors[d.win] : '#dedede';
      });
    }

    function updateTotals() {
      var agg = {D: 0, N: 0, R: 0};

      data.forEach(function(d) { agg[d.win || 'N'] += d.votes; });
      totals.data(d3.values(agg)).text(function(d) { return d; });

      var left = [270 - agg.D, 270 - agg.R],
          no_winner = left[0] > 0 && left[1] > 0;

      need.data(left).html(function(d) {
        return no_winner ? d + ' to win' : (d <= 0 ? check : '');
      });
    }

    function updateUrl() {
      var picks = data.filter(function(d) { return d.win; }).map(function(d) {
        return d.id + '-' + d.win; 
      });

      top.history.replaceState(null, null, '#' + picks.join(','));
    }

    function updateTweet() {
      var url = encodeURIComponent(top.location.href),
          href = `https://twitter.com/intent/tweet?text=My%202016%20election%20forecast&url=${url}`;

      tweet.attr('href', href);
    }
});

function nozoom() {
  d3.event.preventDefault();
}

function responsivefy(svg) {
  var container = d3.select(svg.node().parentNode),
      width = parseInt(svg.style('width')),
      height = parseInt(svg.style('height')),
      aspect = width / height;

  svg.attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('perserveAspectRatio', 'xMinYMid')
      .call(resize);

  d3.select(window).on('resize.' + container.attr('id'), resize);

  function resize() {
    var targetWidth = parseInt(container.style('width'));
    svg.attr('width', targetWidth);
    svg.attr('height', Math.round(targetWidth / aspect));
  }
}
