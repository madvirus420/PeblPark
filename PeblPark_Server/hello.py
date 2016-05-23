from flask import Flask
import urllib2
from flask import Response
import json
from MockData import mock_data
from flask import request
import logging

app = Flask(__name__)
logging.basicConfig(filename='server_log.log', format='%(asctime)s %(message)s', datefmt='%m/%d/%Y %I:%M:%S %p', level=logging.INFO)

radius = '1000'
API_key = 'AIzaSyB6j5F-yvw5B7zeZ-9oaUZKQl-2Z8Zay2k'

@app.route('/location', methods=['GET', 'POST'])
def current_location():
	
	lat = request.args['lat']
	lng = request.args['lng']

	response = urllib2.urlopen('https://maps.googleapis.com/maps/api/geocode/json?latlng=%s,%s&key=%s' % (lat, lng, API_key))
	curr_data = json.load(response)
	return curr_data['results'][0]['address_components'][1]['short_name']

@app.route('/navigate', methods=['GET', 'POST'])
def navigate():

	lat = request.args['lat']
	lng = request.args['lng']

	lat_dest = request.args['lat_dest']
	lng_dest = request.args['lng_dest']

	response = urllib2.urlopen('https://maps.googleapis.com/maps/api/directions/json?origin=%s,%s&destination=%s,%s&key=%s' % (lat, lng, lat_dest, lng_dest, API_key))
	data = json.load(response)

	direction_list = []
	step_list = data['routes'][0]['legs'][0]['steps']
	
	new_step_list = []

	for step in step_list:

		new_step = {}

		new_step['lat'] = step['end_location']['lat']
		new_step['lng'] = step['end_location']['lng']
		if 'maneuver' not in step.keys() or 'keep' in step['maneuver']:
			new_step['maneuver'] = 'straight'
		elif 'left' in step['maneuver']:
			new_step['maneuver'] = 'left'
		elif 'right' in step['maneuver']:
			new_step['maneuver'] = 'right'
		#else:
			#new_step['maneuver'] = step['maneuver']
		
		new_step['dist'] = step['distance']['text']
		new_step['time'] = step['duration']['text']

		new_step_list.append(new_step)
	
	resp = Response(json.dumps(new_step_list), status=200, mimetype='application/json')
	
	return resp
	
@app.route('/', methods=['GET', 'POST'])
def get_parking():

	lat = request.args['lat']
	lng = request.args['lng']

	response = urllib2.urlopen('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=%s,%s&radius=%s&types=parking&sensor=false&key=%s' % (lat, lng, radius, API_key))
	data = json.load(response)
	logging.info('\nData received: %s\n', data)
	
	json_data = mock_data(data)

	logging.info('\nAfter mocking: %s\n', json_data)

	processed_data = clean_data(json_data)

	logging.info('\nProcessed data: %s\n', processed_data)

	result_set = find_parking(processed_data, key="dist")
	logging.info('\nResult set: %s\n', result_set)

	resp = Response(json.dumps(result_set), status=200, mimetype='application/json')

	return resp

def find_parking(data_obj, key="dist"):

	if key == "price":
		data_obj = sorted(data_obj, key=lambda k: k['price'])
	
	if len(data_obj) > 3:
		data_obj = data_obj[:3]
	
	return data_obj

def clean_data(json_data):

	result_set = json_data['results']

	processed_data = []

	for result in result_set:
		my_dict = {}
		my_dict['place_id'] = result['place_id']
		my_dict['price'] = result['price']
		my_dict['name'] = result['name']
		my_dict['vicinity'] = result['vicinity']
		my_dict['price'] = result['price']
		my_dict['lat'] = result['geometry']['location']['lat']
		my_dict['lng'] = result['geometry']['location']['lng']
		processed_data.append(my_dict)

	return processed_data

if __name__ == '__main__':
    app.run(host='0.0.0.0')
