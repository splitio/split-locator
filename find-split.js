import * as github from '@actions/github';
import * as core from '@actions/core';
import * as glob from '@actions/glob';
import * as fs from 'fs';
import {default as axios} from 'axios';

async function run() {
	try {
		let fileCount = 0;

		const splitMatch = 'getTreatment';
		const regex = new RegExp(splitMatch);

		// assumes a getTreatment method with the first parameter as split name
		const patterns = ['**/*.html', '**/*.js']
		const globber = await glob.create(patterns.join('\n'))

		const splits = [];
		for await (const file of globber.globGenerator()) {
	  		// console.log(file)
	  		fileCount++;

	  		let lineNo = 0;
			fs.readFile(file, (err, fi) => {
			  if (err) throw err;

			  // no support for windows line endings
			  fi.toString().split('\n').forEach(line => {
			  	lineNo++;
			  	if(regex.test(line)) {
			  		const splitNameMatch = new RegExp('getTreatment.*\((.*)\)');
			  		let found = splitNameMatch.exec(line);

			  		const splitNameFilter = new RegExp('[\'\"]+(.*)[\'\"]')
			  		let found2 = splitNameFilter.exec(found);
			  		if(found2) {
				  		const s = {
				  			name: found2[1],
				  			locations: [],
				  			seen: false
				  		}
				  		s.locations.push(file + ':' + lineNo);
				  		for(const t of splits) {
				  			if(s.name === t.name && !t.seen) {
				  				for(const loc of t.locations) {
				  					s.locations.push(loc);
				  				}
				  				t.seen = true;
				  			}
				  		}
				  		splits.push(s);
				  	}
			  	}
			  });
			});
		}
		if(splits.length > 0) {
			function compare( a, b ) {
			  if ( a.name < b.name ){
			    return -1;
			  }
			  if ( a.name > b.name ){
			    return 1;
			  }
			  return 0;
			}

			splits.sort( compare );	

			const splitsFound = new Map();

			for (const location of splits) {
				let locationsSeen = splitsFound.get(location.name);
				if(!locationsSeen) {
					locationsSeen = new Set();
					splitsFound.set(location.name, locationsSeen);
				}
				for(const reference of location.locations) {
					locationsSeen.add(reference);
				}
			}

			let results = '<html>\n<head><title>Split Locations</title></head>\n<body bgcolor="white">\n'
			results += '<!-- timestamp: ' + new Date().getTime() + '-->\n';
			results += '<table border="1">\n';

			splitsFound.forEach((value, key, map) => {
				results += '  <tr><td>' + key + '<td>';
				results += '<td>'
				for(const reference of value) {
					results += reference + '</br>';
				}
				results += '</td></tr>\n';
			});
			results += '</table>\n</body>\n</html>'
			fs.writeFile('locations.html', results, function(err) {
				if(err) return console.log(err);
			});

			core.setOutput('splits', results);
		} else {
			console.log('no splits found');
			core.setOutput('splits', fileCount + ' files found; no splits found. cwd: ' + process.cwd());
		}
	} catch (error) {
		console.log(error);
		core.setFailed(error.message);
	}
}
function wait(ms) {
    return new Promise( (resolve) => {setTimeout(resolve, ms)});
}

run();
