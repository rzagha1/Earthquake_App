from django.contrib import admin
#from django.urls import path
from django.conf.urls import url as path
from geospatial import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('map/', views.Map, name='map'),
    path('earthquakes',views.earthquakes,name='earthquakes')
]
