import os
import random
import logging

logging.basicConfig(filename='mock_data.log', format='%(asctime)s %(message)s', datefmt='%m/%d/%Y %I:%M:%S %p', level=logging.INFO)

file_name = "%s/mock_data.csv" % (os.path.dirname(os.path.abspath(__file__)))

def mock_data(json_obj):

	result_list = json_obj['results']
	logging.info('\nResult list: %s\n', result_list)
	with open(file_name, "r") as file_ptr:
		lines = file_ptr.read().splitlines()
		logging.info('\nLines: %s\n', lines)

	for result in result_list:
		record_no = get_or_add_record(result['id'])
		logging.info('\nRecord no is %s for id %s\n', record_no-1, result['id'])
		mocked_data = lines[record_no-1].split(",")
		result['price'] = mocked_data[1]

	return json_obj

def get_or_add_record(record_id):

	with open(file_name, "r+") as file_ptr:

		lines = file_ptr.read().splitlines()
		for idx, line in enumerate(lines):
			if record_id in line.split(","):
				global new_line
				new_line = "\n"
				return idx
		if len(lines) == 0:
			new_record = "%s,%s,%s" % (record_id, random.randint(5,21), random.randint(1,31))
		else:
			new_record = "\n%s,%s,%s" % (record_id, random.randint(5,21), random.randint(1,31))

		file_ptr.write(new_record)
		return len(lines)
			
