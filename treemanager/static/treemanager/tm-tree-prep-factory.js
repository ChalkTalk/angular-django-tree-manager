(function() {

angular.module('tmTreeManagerModule')
.factory('tmPrepTreeFactory', tmPrepTreeFactory);

function tmPrepTreeFactory() {
  var api = {};
  api.prepTree = prepTree;
  return api;
}

/**
 * prep tree by doing a dfs
 */
function prepTree(treeReport) {

  function set_hidden(reportNode, hidden) {
    reportNode.hidden = hidden;
    if (reportNode.children) {
      hidden = hidden || reportNode.children_hidden;
      reportNode.children.map(function(child){ set_hidden(child, hidden); });
    }
  }

  treeReport.children.map(function(child){set_hidden(child, treeReport.children_hidden);});

  reportNodes = [];
  function tagDfs(reportNode, indentLevel) {
    reportNodes.push([indentLevel, reportNode]);
      for (var i = 0; i < reportNode.children.length; i++) {
        tagDfs(reportNode.children[i], indentLevel + 1);
      }
  }

  tagDfs(treeReport, 0);
  return reportNodes;
}

})();