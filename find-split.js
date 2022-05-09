import * as github from '@actions/github';
import * as core from '@actions/core';
import * as glob from '@actions/glob';
import * as fs from 'fs';
import {default as axios} from 'axios';

let patterns = [
	{
		extension: ['**/*.html', '**/*.js'],
		regexp: 'getTreatment.*\((.*)\)'
	}
]

async function run() {
	try {
		let fileCount = 0;

		for(const pattern of patterns) {
			const patterns = pattern.extension;
			const globber = await glob.create(patterns.join('\n'))

			const splits = [];
			for await (const file of globber.globGenerator()) {
		  		fileCount++;
		  		searchFile(file, pattern.regexp);
			}
			if(splits.length > 0) {
				const splitsFound = sortAndAggregate(splits);
				const results = createResults();

				core.setOutput('splits', results);
			} else {
				console.log('no splits found');
				core.setOutput('splits', fileCount + ' files found; no splits found. cwd: ' + process.cwd());
			}
		}
	} catch (error) {
		console.log(error);
		core.setFailed(error.message);
	}
}

function searchFile(file, regexp) {
	let lineNo = 0;
	fs.readFile(file, (err, fi) => {
		if (err) throw err;

		// no support for windows line endings
		fi.toString().split('\n').forEach(line => {
			lineNo++;
			if(regexp.test(line)) {
				const splitNameMatch = new RegExp(regexp);
				let found = splitNameMatch.exec(line);

				// extract from single or double quotes
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

function sortAndAggregate(splits) {
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
	return splitsFound;
}

function createResults(splitsFound) {
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

}

function wait(ms) {
    return new Promise( (resolve) => {setTimeout(resolve, ms)});
}

run();
