from django.contrib import admin
from .models import EarthquakeBuffers,EarthquakePoints
from leaflet.admin import LeafletGeoAdmin

class quakepoints(LeafletGeoAdmin):
    pass

admin.site.register(EarthquakePoints,quakepoints)
