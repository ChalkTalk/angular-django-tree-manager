"""
Models for materialized path tree
"""
from __future__ import unicode_literals

from django.utils.encoding import python_2_unicode_compatible
from django.db import models

from treebeard.mp_tree import MP_Node

@python_2_unicode_compatible
class MaterializedPathTree(MP_Node):
    """
    This is a model to store a materialized path tree data
    """
    slug = models.SlugField(max_length=64, blank=True)
    name = models.CharField(max_length=64)

    def __str__(self):
        label = []
        for ancestor in self.get_ancestors():
            label.append(ancestor.name)
            label.append(u' \u2192 ')
        label.append(self.name)
        return u''.join(label)

    @classmethod
    def get_serial_tree(cls):
        """
        get the tree in a format that is json serializable
        """
        dfs_nodes = cls.get_tree()
        root_node = {'name': 'All', 'node': [], 'children': [], 'depth': None}
        def _insert(node, serial_node, depth, stack):
            """Returns a serial_node and depth tuple"""
            if node.depth > depth:
                stack.append(serial_node)
                new_child = {
                    'id': node.id,
                    'name': node.name,
                    'path': node.path,
                    'children': [],
                    'depth': depth,
                    'display_name': node.__str__(),
                }
                serial_node['children'].append(new_child)
                return (new_child, (depth + 1), stack)
            else:
                parent = stack.pop()
                return _insert(node, parent, (depth - 1), stack)
        serial_node = root_node
        depth = 0
        stack = []
        for node in dfs_nodes:
            (serial_node, depth, stack) = _insert(node, serial_node, depth, stack)

        return root_node
