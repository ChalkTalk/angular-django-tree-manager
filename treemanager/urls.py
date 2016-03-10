from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.tree_view, name='tree-view'),
    url(r'^tree-manager/$', views.get_tree, name='tree-manager'),
    url(r'^update_tree/$',
        views.update_tree, name='update-tree'),
    url(r'^add_node/$',
        views.add_node, name='add-node'),
]
