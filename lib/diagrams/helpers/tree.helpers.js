(function (window) {

  // Configurations
  var duration = 750;
  var margin = {top: 20, right: 120, bottom: 20, left: 120};
  var padding = 10;
  var radius = 10;
  var width;
  var height;
  var tree;
  var svg;
  var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

  function init() {
    width = $('body').width() - margin.right - margin.left;
    height = 800 - margin.top - margin.bottom;

    tree = d3.layout.tree()
      .size([height, width]);

    svg = d3.select("body").append("svg")
      .attr({
        width: width + margin.right + margin.left,
        height: height + margin.top + margin.bottom
      })
      .append("g")
      .attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
      });
  }

  // Private methods
  function findNode(name, nodes) {
    const node = nodes.shift();
    if (node.name === name) {
      return node;
    }
    if (node.children) {
      nodes = nodes.concat(node.children);
    }
    return findNode(name, nodes)
  }

  // D3 helpers
  function renderNodes(nodes, data) {
    var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.name });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
      .attr({
        class: "node",
        transform: function(d) {
          var x = d.parent !== undefined ? d.parent.y0 : data.y0;
          var y = d.parent !== undefined ? d.parent.x0 : data.x0;
          return "translate(" + x + "," + y + ")";
        }
      });

    nodeEnter.append("rect")
      .attr({
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        rx: radius,
        ry: radius
      });

    var text = nodeEnter.append('text')
      .attr({
        'text-anchor': 'middle',
        'alignment-baseline': 'middle',
        opacity: 0
      })
      .style({
        'font-size': '20px'
      })
      .text(function (d) {return d.name.toUpperCase()});

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("rect")
      .attr({
        width: function (d) {
          return getSiblingTextSize(this).width + (padding * 2);
        },
        height: 50,
        x: function (d) {
          return - ((getSiblingTextSize(this).width + (padding * 2))/2);
        },
        y: -25
      });

    nodeUpdate.select("text")
      .attr({
        opacity: 1
      });

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
        var x = d.parent !== undefined ? d.parent.y : data.y0;
        var y = d.parent !== undefined ? d.parent.x : data.x0;
        return "translate(" + x + "," + y + ")";
      })
      .remove();

    nodeExit.select("rect")
      .attr({
        width: 0,
        height: 0,
        x: 0,
        y: 0
      });

    nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  }

  function getSiblingTextSize(node) {
    return  d3.select(node.parentNode).select('text').node().getBBox();
  }

  // Public methods
  function addItem(name, parent, root) {
    if (!parent) {
      throw Error('You need to specify a parent to add a node in the Tree!')
    }
    return function() {
      const parentNode = findNode(parent, [root]);
      if (!parentNode.children) {
        parentNode.children = []
      }
      parentNode.children.push({
        name: name
      })
      update(root);
    }
  }

  function removeItem(name, root) {
    return function() {
      const node = findNode(name, [root]);
      _.remove(node.parent.children, {name: name});
      update(root);
    }
  }

  function update(data) {
    // create the tree
    var nodes = tree.nodes(treeData);
    var links = tree.links(nodes);

    renderNodes(nodes, data);

    // update links
    var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.name; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: d.source.x0, y: d.source.y0};
        return diagonal({source: o, target: o});
      });

    // Transition links to their new position.
    link.transition()
      .duration(duration)
      .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: d.source.x, y: d.source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

  }

  // store all the random links added
  var _randomLinks = {};

  function addLink(source, target, tree) {
    return function() {
      var _source = findNode(source, [tree]);
      var _target = findNode(target, [tree]);
      var s = {x: _source.x, y: _source.y};
      var t = {x: _target.x, y: _target.y};

      var link = svg.insert("path", "g")
        .attr("class", "link-alone")
        .attr("d", function(d) {
          return diagonal({source: s, target: s});
        });

      link
        .transition()
        .duration(duration)
        .attr("d", function(d) {
          return diagonal({source: s, target: t});
        });

      var key = source + '~' + target;
      _randomLinks[key] = link;
    }

  }

  function removeLink(source, target, tree) {
    return function() {
      var key = source + '~' + target;
      var link = _randomLinks[key];

      var _source = findNode(source, [tree]);
      var s = {x: _source.x, y: _source.y};

      link
        .transition()
        .duration(duration)
        .attr("d", function(d) {
          return diagonal({source: s, target: s});
        })
        .remove();
    }
  }

  window.diagram = {
    init: init,
    addItem: addItem,
    removeItem: removeItem,
    update: update,
    addLink: addLink,
    removeLink: removeLink,
    width: width,
    heigth: height
  };
})(window);