(function() {

  angular.module('tmTreeManagerModule')
  .factory('tmBuildTreeFactory', tmBuildTreeFactory);

  function tmBuildTreeFactory() {
    var api = {};
    api.populateNode = populateNode;

    api.buildTree = function(tree, scope) {
      var tree = populateNode(tree, tree, scope);
      tree = populateParent(tree, null);
      return tree;
    };
    return api;
  }

function populateNode(tagHashmap, node, scope) {
  children = node.children.map( function (childnode){ 
    return populateNode(tagHashmap, childnode, scope); 
  });

  var deleted = scope.delete_nodes.indexOf(node);
  var edit = scope.edit_nodes.indexOf(node);
  var dirty = scope.dirty_nodes.indexOf(node);

  node.deleted = deleted != -1 ? true : false;
  node.edit = edit != -1 ? true : false;
  node.dirty = dirty != -1 ? true : false;
  node.new = node.new;
  node.new_name = node.new_name ? node.new_name : node.name;

  return node;
}

// update tree nodes with the right parent.
function populateParent(tree, parent) {
  tree.parent_node = parent;
  for(var i=0; i<tree.children.length; i++) {
    populateParent(tree.children[i], tree);
  }
  return tree;
}
})();