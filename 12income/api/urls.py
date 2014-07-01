from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('api.views',
    (r'^get_records/(?P<request_year>\w+)/(?P<request_month>\w+)/$','get_records'),
    (r'^add_record/$','add_record'),
    (r'^delete_record/$','delete_record'),
    (r'^switch_record/$','switch_record'),
    (r'^update_record/$','update_record'),
    (r'^update_record_date/$','update_record_date'),
    (r'^switch_record_recurrent/$','switch_record_recurrent'),
    (r'^get_annual_reports/(?P<year>\w+)/$','get_annual_reports'),
    (r'^update_settings/$','update_settings'),
)
