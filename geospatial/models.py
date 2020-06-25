from django.db import models
from django.contrib.gis.db import models as gismodels

class EarthquakePoints(models.Model):
    bearing=models.CharField(max_length=20)
    magnitude=models.FloatField()
    place=models.CharField(max_length=100)
    km=models.IntegerField()
    geometry=gismodels.PointField(srid=4326)

class EarthquakeBuffers(models.Model):
    bearing=models.CharField(max_length=20)
    magnitude=models.FloatField()
    place=models.CharField(max_length=100)
    km=models.IntegerField()
    geometry=gismodels.PolygonField(srid=4326)