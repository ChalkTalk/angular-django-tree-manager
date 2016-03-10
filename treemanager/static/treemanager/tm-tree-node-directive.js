(function() {

  angular.module('tmTreeManagerModule')
  .directive('tmTreeNode', tmTreeNode);

  function tmTreeNode(STATIC_URL, $compile) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs){

        scope.$watch('node_pair', function(node_pair) {
          console.log(node_pair);
          var indent_level = node_pair[0];
          var node = node_pair[1];
          scope.node = node;
          scope.indent_level = indent_level;
        });


        scope.parent = scope.$parent;

        function toggler(node, hidden) {
          if(!node.children) return;
          for(var i = 0; i < node.children.length; i++) {
            var child_node = node.children[i];
            child_node.hidden = hidden;
            if (!child_node.children_hidden) {
              toggler(child_node, hidden);
            }
          }
        }

        scope.toggle = function($event) {
          var newstate = !scope.node.children_hidden;
          scope.node.children_hidden = newstate;
          toggler(scope.node, newstate);
        };
      }
    };
  }
})();