"""
All the views for creating the tag trees.
"""
import json

from django.shortcuts import render
from django.http import Http404, JsonResponse
from django.utils.text import slugify

from . import models

def tree_view(request):
    """
    View for the master tag tree
    """
    template_name = "treemanager/tree-manager.html"
    return render(request, template_name)

def get_tree(request):
    """
    Returns a JSON response of a dictionary of all the curricula trees.
    """
    if request.method == 'GET':
        mptree = {
            models.MaterializedPathTree.__name__: models.MaterializedPathTree.get_serial_tree()
        }

        data = {
            'data': mptree,
        }
        return JsonResponse(data)
    else:
        raise Http404

def update_tree(request):
    """
    Update the node in the tree based on changes
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        deleted_nodes = data['deleted']
        dirty_nodes = data['dirty']

        node = None
        for node in deleted_nodes:
            try:
                node = models.MaterializedPathTree.objects.get(pk=node['id'])
                node.delete()
            except models.MaterializedPathTree.DoesNotExist:
                pass

        for node in dirty_nodes:
            update_name = node['new_name']

            node = models.MaterializedPathTree.objects.get(pk=node['id'])
            node.name = update_name
            node.slug = slugify(update_name)

            node.save()

        data = {
            'data': data,
        }

        return JsonResponse(data)
    else:
        raise Http404

def add_node(request):
    """
    Add new node to the master or curriculum tree
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        node = data['node']
        print node

        update_name = node['new_name']
        parent_node_id = None
        if 'parent_id' in node:
            parent_node_id = node['parent_id']

        if parent_node_id:
            try:
                parent_node = models.MaterializedPathTree.objects.get(id=parent_node_id)
            except models.MaterializedPathTree.DoesNotExist:
                return JsonResponse({'error': 'Parent node does not exist'})

            new_node = parent_node.add_child(
                name=update_name,
                slug=slugify(update_name)
            )
        else:
            new_node = models.MaterializedPathTree.add_root(
                name=update_name,
                slug=slugify(update_name)
            )

        if new_node:
            new_node.save()
            node['id'] = new_node.id

        data = {
            'node': node,
        }
        return JsonResponse(data)
    else:
        raise Http404
