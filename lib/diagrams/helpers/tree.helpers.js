(function (window) {
  function findNode(name, nodes) {
    const node = nodes.shift();
    if (node.name === name) {
      return node;
    }
    return findNode(name, nodes.concat(node.children))
  }

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

  window.diagram = {
    addItem: addItem,
    removeItem: removeItem
  }
})(window);