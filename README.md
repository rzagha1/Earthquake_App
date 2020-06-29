# Earthquake_App
Earthquake App that scrapes USGS Data and creates a custom SRID for each earthquake and buffers the earthquake depending on its magnitude

Postgres as the backend, Django/GeoDjango as the middleware and Leaflet+Turf as the frontend

On the page -- click on Significant Earthquakes or All Earthquakes. This sends a POST request to the server which then scrapes the USGS earthquake data depending on the chosen option. Once the data is scraped it runs through a process in GeoDjango where each earthquake gets assigned a custom UTM SRID and then is buffered based on its magnitude size and then reprojected to 4326 for mapping and consistency purposes. The data is then rendered into GeoJSON where the frontend picks it up and the points and buffers can be added to the map with there respective buttons. 

On the interactive map the user can click on multiple buffers at once and in the top right corner they can click on the button Earthquake Info and the info for each selected buffer will be displayed each time the button is clicked. 


Majority of important code is located in geospatial/views.py | static/js2.js | templates
