(function() {
  
  angular.module('tmTreeManagerModule')
  .directive('tmTree', ['tmBuildTreeFactory', 'tmPrepTreeFactory', 'STATIC_URL', 'UPDATE_TREE', 'ADD_NODE', '$http', tmTreeDirective]);

  function tmTreeDirective(tmBuildTreeFactory, tmPrepTreeFactory, STATIC_URL, UPDATE_TREE, ADD_NODE, $http) {
    return {
      restrict: 'AE',
      templateUrl: STATIC_URL + 'treemanager/tm-tree-manager-template.html',
      controller: "tmTreeManagerCtrl",

      link: function (scope, element, attrs) {
        // initial state:
        function set_children_hidden(node) {
          node.children_hidden = true;
          node.children.map(set_children_hidden);
        }

        scope.setup = function(data) {
          scope.loaded = false;

          scope.TreeToView = data.data.MaterializedPathTree;

          for (var key in scope.TreeToView) {
            scope.TreeToView.children.map(set_children_hidden);
          }

          scope.edit_nodes = [];
          scope.delete_nodes = [];
          scope.dirty_nodes = [];
          scope.new_nodes = [];

          scope.redraw();
          scope.loaded = true;  
        }

        scope.TreePromise.then(function(data) {
          console.log(data);
          scope.mpTree = data;
          scope.setup(scope.mpTree);
        });
        

        scope.redraw = function() {
          var builtTree = tmBuildTreeFactory.buildTree(scope.TreeToView, scope);
          // This is the format of the finalTree
          // scope.finalTree = [
          //    [<indent_level_int>, <node_info_object>] 
          //  ]
          scope.finalTree = tmPrepTreeFactory.prepTree(builtTree);
          console.log(scope.finalTree);
        };

        function toggler(node, hidden) {
          node.children_hidden = hidden;

          if(!node.children) return;
          for(var i = 0; i < node.children.length; i++) {
            var child_node = node.children[i];
            child_node.hidden = hidden;
            toggler(child_node, hidden);
          }
        }

        scope.toggleAll = function(state) {
          var root_nodes = scope.finalTagTree[0][1].children;
          for(var i=0; i< root_nodes.length; i++) {
            toggler(root_nodes[i], state);
          }
        };

//------------- TREE MANIPULATION FUNCTIONS ----------------------//
/*----------------------------------------------------------------*/
//------------- Common functions for any node---------------------//
        // set tag/node into edit mode
        scope.edit = function(node) {
          if(!node.edit) {
            node.edit = true;
            scope.edit_nodes.push(node);
          }
        }

        // update children based on changes to the parent tag
        scope.updateChildren = function(node, parent) {
          if(
              node.name != node.new_name
            ) {
              node.dirty = true;
              node.children_hidden = false;
              node.hidden = false;
          }
          else {
            node.dirty = false;
          }
          if(node.dirty) {
            var index = scope.dirty_nodes.indexOf(node);
            if(index <= -1) {
              scope.dirty_nodes.push(node);
            }
          }
          else {
            var index = scope.dirty_nodes.indexOf(node);
            if(index > -1) {
              scope.dirty_nodes.splice(index, 1);
            }
          }
          for(var i=0; i<node.children.length; i++){
            scope.updateChildren(node.children[i], parent);
          }
        }
//------------- End of Common functions for any node---------------------//

//------------- functions for new nodes-----------------------//
        scope.addChild = function(node) {
          new_node = {
            children: [],
            children_hidden: true,
            deleted: false,
            depth: node.depth + 1,
            dirty: true,
            edit: true,
            hidden: false,
            name: "New Name",
            new_name: "New Name",
            id: -1,
            parent_node: node,
            new: true,
          }
          node.children.unshift(new_node);
          node.children_hidden = false;

          scope.edit_nodes.push(new_node);
          scope.redraw();
        }

        scope.addParent = function(node) {
          new_node = {
            children: [],
            children_hidden: true,
            deleted: false,
            depth: node.depth,
            dirty: true,
            edit: true,
            hidden: false,
            name: "New Name",
            new_name: "New Name",
            id: -1,
            parent_node: null,
            new: true,
          }

          // add the new node to the node parent node
          var old_parent = node.parent_node;
          if(old_parent) {
            old_parent.children.unshift(new_node);
            old_parent.children_hidden = false;
            // remove the current node from its old parent children
            var node_index = old_parent.children.indexOf(node);
            old_parent.children.splice(node_index,1);
          
            // set the right pointers to parent nodes and depth update
            new_node.parent_node = old_parent;
          }
          node.parent_node = new_node;
          
          node.depth += 1;
          
          new_node.children.push(node);
          
          scope.edit_nodes.push(new_node);
          scope.redraw();
        }
        scope.submitNew = function(node) {
          var index = scope.edit_nodes.indexOf(node);
          scope.edit_nodes.splice(index, 1);
          node.edit = false;

          var index = scope.new_nodes.indexOf(node);
          if(index <= -1) {
            scope.new_nodes.push(node);
          }
        }
        scope.removeNew = function(node) {
          var index = scope.new_nodes.indexOf(node);
          scope.new_nodes.splice(index, 1);

          parent_node = node.parent_node;
          index = parent_node.children.indexOf(node);
          parent_node.children.splice(index, 1);

          scope.redraw();
        }
        scope.commitNew = function(node) {
          new_node = {
              name: node.name,
              new_name: node.new_name,
              parent_id: node.parent_node.id,
              id: node.id,
            }
          data = {
            node: new_node,
          };
          $http.post(ADD_NODE, data).then(
            function(data) {
              if(data.data.error) {
                scope.error = data.data.error;
              }
              else {
                if(!scope.master) {
                  node.id = data.data.node.id;
                }
                node.name = data.data.node.new_name;
                node.new = false;
                node.edit = false;
                node.dirty = false;
                node.delete = false;

                var index = scope.new_nodes.indexOf(node);
                scope.new_nodes.splice(index, 1);

                scope.redraw();
              }
            }, function(data) {
              scope.error = "Couldn't save new node.";
              if (data.data) {
                scope.error += ' ' + data.data;
              }
            }
          );
        }
//------------- End of functions for new nodes-------------------//

//------------- functions for existing nodes---------------------//
        scope.delete = function(node) {
          node.delete = true;
          scope.delete_nodes.push(node);
          for(var i=0; i<node.children.length; i++) {
              scope.delete(node.children[i]);
          }

        }

        scope.undoDelete = function(node) {
          node.delete = false;
          var index = scope.delete_nodes.indexOf(node);
          scope.delete_nodes.splice(index, 1);

          for(var i=0; i<node.children.length; i++) {
              scope.undoDelete(node.children[i]);
          }
        }

        // Submit edit and changes to exxisting node/tag
        scope.submitEdit = function(node) {
          var index = scope.edit_nodes.indexOf(node);
          scope.edit_nodes.splice(index, 1);
          node.edit = false;

          if( node.name != node.new_name
            ) {
                var index = scope.dirty_nodes.indexOf(node);
                if(index <= -1) {
                  scope.dirty_nodes.push(node);
                }
                node.dirty = true;
          }
          else {
            node.dirty = false;
            var index = scope.dirty_nodes.indexOf(node);
            scope.dirty_nodes.splice(index, 1);
          }

          scope.updateChildren(node, node);
        }

        // Save changes made to existing tags/nodes to the database
        scope.saveChanges = function() {
          if(scope.new_nodes.length > 0) {
            return alert("There are new nodes added. Please submit new nodes before saving other changes.");
          }

          var delete_nodes = [];
          var dirty_nodes = [];
          for(var i=0; i<scope.dirty_nodes.length; i++) {
            var index = scope.delete_nodes.indexOf(scope.dirty_nodes[i]);
            if(index > -1) {
              continue;
            }
            else {
              dirty_node = {
                name: scope.dirty_nodes[i].name,
                new_name: scope.dirty_nodes[i].new_name,
                child_id: scope.dirty_nodes[i].children[0].id,
                parent_id: sscope.dirty_nodes[i].parent_node.id,
                id: scope.dirty_nodes[i].id,
              }
              dirty_nodes.push(dirty_node);
            }
          }
          
          if(scope.delete_nodes.length > 0) {
            if (!window.confirm("There are might be nodes deleted. Are you sure you want to save these changes?") ) {
                return
              }
          }

          for(var j=0; j<scope.delete_nodes.length; j++) {
            delete_nodes.push(
            {
              name: scope.delete_nodes[j].name,
              id: scope.delete_nodes[j].id,
            }
            )
          }
          
          data = {
            dirty: dirty_nodes,
            deleted: delete_nodes,
          };
          scope.loaded = false;
          $http.post(UPDATE_TREE, data).then(
            function(data) {
              window.location.href = window.location.href;
            }, function(data) {
              scope.error = "Couldn't save changes.";
              if (data.data) {
                scope.error += ' ' + data.data;
              }
            }
          );

        }
//------------- End of functions for existing nodes-----------------//
      },
    };
  }
})();