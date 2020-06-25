import fiona
import json
import urllib2
import datetime
from shapely.geometry import Point, mapping, Polygon,shape
from shapely.wkt import loads
from django.contrib.gis.geos import Point as django_point
from django.contrib.gis.geos import Polygon as django_polygon
from django.contrib.gis.geos import fromstr
from fiona.crs import from_epsg,from_string
from fiona.transform import transform_geom,transform
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from quakes.settings import MEDIA_ROOT
from django.core.files.storage import FileSystemStorage
from django.http import JsonResponse,HttpResponse
from .models import EarthquakeBuffers,EarthquakePoints
import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "quakes.settings")
django.setup()

def Map(request):
    return render(request,'mapping.html')

@csrf_exempt
def earthquakes(request):
    template="earthquake_retrieval.html"
    if request.method=="GET":
        return render(request,template)
    try:
        date=str(datetime.datetime.now()).replace(' ','_').replace('-','_').replace(':','_')
        points=os.path.join(MEDIA_ROOT,date+'_points.geojson')
        buffers=os.path.join(MEDIA_ROOT,date+'_buffers.geojson')
        quake_type=request.POST.get('quakes')
        print quake_type
        if quake_type =='sig':
            url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson'
            EarthQuakePoints(points,url)
            EarthQuakeBuffers(buffers,url)
        else:
            url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'
            EarthQuakePoints(points,url)
            EarthQuakeBuffers(buffers,url)
        x={"geom_id": date,
            "status": "OK",
            "err_msg": "GOOD for now"}
        return JsonResponse(x)
    except Exception as e:
        print(e)
        return render(request,template)

def EarthQuakeBuffers(shpname,USGSurl):
    crs = from_epsg(4326)
    schema = {'geometry': 'Polygon', 'properties': {'Place': 'str', 'KM': 'int','Bearing':'str', 'Magnitude': 'float'}}
    with fiona.open(shpname, "w", "GeoJSON", schema, crs) as output:
        url = USGSurl
        weburl = urllib2.urlopen(url)
        if weburl.getcode() == 200:
            data = json.loads(weburl.read())
        for i in data["features"]:
            place = ""
            mag = i["properties"]["mag"]
            p1 = i["properties"]["place"].split()
            p2 = ''.join(c for c in p1[0] if c not in 'km')
            km = ''.join(z for z in p2 if z.isdigit())
            bearing = ''.join(b for b in p1[1] if b in ('S','SSE','SE','ESE','E','ENE','NE','NNE','N','NNW','NW','WNW','W','WSW','SW','SSW'))
            if type(km) == str: km = None
            else: km = int(str(km))
            if type(bearing) == str: bearing = None
            if bearing == None and km == None: place = i["properties"]["place"]
            else: place = ' '.join(i["properties"]["place"].split()[3:])
            x,y=float(i["geometry"]["coordinates"][0]),float(i["geometry"]["coordinates"][1])
            cs="+proj=tmerc +lat_0={0} +lon_0={1} +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs".format(y,x)
            cs_custom=from_string(cs)
            x2,y2=transform(crs,cs_custom,[x],[y])
            point=Point(x2[0],y2[0])
            if mag<=0:
                mag=.1
            try:
                poly =point.buffer(abs(mag)*10000)
                poly2=transform_geom(cs_custom,crs,mapping(poly))
                postgres_poly=fromstr(str(shape(poly2).wkt),srid=4326)
                #poly_postgres=django_polygon(poly2)
                output.write({'properties':{'Place': place, 'Magnitude': mag, 'KM': km, 'Bearing': bearing},
                'geometry': mapping(shape(poly2))})
                """_,created=EarthquakeBuffers.objects.update_or_create(
                bearing=bearing,
                magnitude=mag,
                place=place,
                km=km,
                geometry=postgres_poly
                ) """
            except Exception as e:
                print(e)

def EarthQuakePoints(shpname,USGSurl):
    crs = from_epsg(4326)
    schema = {'geometry': 'Point', 'properties': {'Place': 'str', 'KM': 'int','Bearing':'str', 'Magnitude': 'float'}}
    with fiona.open(shpname, "w", "GeoJSON", schema, crs) as output:
        url = USGSurl
        weburl = urllib2.urlopen(url)
        if weburl.getcode() == 200:
            data = json.loads(weburl.read())
        for i in data["features"]:
            place = ""
            mag = i["properties"]["mag"]
            p1 = i["properties"]["place"].split()
            p2 = ''.join(c for c in p1[0] if c not in 'km')
            km = ''.join(z for z in p2 if z.isdigit())
            bearing = ''.join(b for b in p1[1] if b in ('S','SSE','SE','ESE','E','ENE','NE','NNE','N','NNW','NW','WNW','W','WSW','SW','SSW'))
            if type(km) == str: km = None
            else: km = int(str(km))
            if type(bearing) == str: bearing = None
            if bearing == None and km == None: place = i["properties"]["place"]
            else: place = ' '.join(i["properties"]["place"].split()[3:])
            point_postgres = django_point(float(i["geometry"]["coordinates"][0]),float(i["geometry"]["coordinates"][1]))
            point=Point(float(i["geometry"]["coordinates"][0]),float(i["geometry"]["coordinates"][1]))
            output.write({'properties':{'Place': place, 'Magnitude': mag, 'KM': km, 'Bearing': bearing},
            'geometry': mapping(point)})
            """ _,created=EarthquakePoints.objects.update_or_create(
                bearing=bearing,
                magnitude=mag,
                place=place,
                km=km,
                geometry=point_postgres
                ) """
