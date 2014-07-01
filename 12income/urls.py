from django.conf.urls.defaults import patterns, include, url
from django.conf import settings

urlpatterns = patterns('app.views',
    # Examples:
    (r'^$', 'index'),
    (r'^signup/$','signup'),
    (r'^signup_action/$','signup_action'),
    (r'^login/$','login_action'),
    (r'^logout/$','logout_action'),
    (r'^reports/$','reports'),
    (r'^settings/$','settings'),
    (r'^api/', include('api.urls')),
)

urlpatterns += patterns('',
    (r'^statics/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT}))
