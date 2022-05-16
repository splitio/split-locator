import * as github from '@actions/github';
import * as core from '@actions/core';
import * as glob from '@actions/glob';
import * as fs from 'fs';
import {default as axios} from 'axios';

let patterns = [
	{
		extension: ['**/*.html'],
		regexp: 'getTreatment.*\(["\'](.*)["\'].*\)',
		group: 2,
		multiline: 1
	},
	{
		extension: ['**/*.java'],
		regexp: 'getTreatment.*\(["\']([a-zA-Z0-9][-_\.a-zA-Z0-9]+)["\'],((.|\n)*)["\']([a-zA-Z0-9][-_\.a-zA-Z0-9]+)[\'"])',
		group: 5,
		multiline: 2
	},
	{
		extension: ['**/*.go'],
		regexp: '(Treatment.*)[(]+(\n|.)(.*)(\n|.)["\']*(.*)["\']*,',
		group: 5,
		multiline: 3
	}
]

async function run() {
	try {
		let fileCount = 0;

		let splitsFound = new Map();
		let splits = [];
		for(const pattern of patterns) {
			const patterns = pattern.extension;
			const globber = await glob.create(patterns.join('\n'))

			for await (const file of globber.globGenerator()) {
		  		fileCount++;
		  		// console.log(file);
		  		searchFile(splits, file, pattern.regexp, pattern.group, pattern.multiline);
			}
			if(splits.length > 0) {
				const found = sortAndAggregate(splits);
				found.forEach((value, key) => splitsFound.set(key, value));
			} else {
				console.log('no splits found');
				core.setOutput('splits', fileCount + ' files found; no splits found. cwd: ' + process.cwd());
			}
		}
		const results = createResults(splitsFound);
		core.setOutput('splits', results);
	} catch (error) {
		console.log(error);
		core.setFailed(error.message);
	}
}

const isItASplitName = new RegExp('[a-z][-+a-zA-Z0-9]+');
function searchFile(splits, file, regexp, group, multiline) {
	console.log('searchFile: ' + file);

	let buffer = [];
	let lineNo = 0;
	fs.readFile(file, (err, fi) => {
		if (err) throw err;

		// FIXME no support for windows line endings
		fi.toString().split('\n').forEach(line => {
			lineNo++;
			buffer.push(line);

			while(buffer.length > multiline) {
				buffer.shift();
			}
			line = buffer.join('\n');

			const splitNameMatch = new RegExp(regexp);
			if(splitNameMatch.test(line)) {
				let found = line.match(regexp);
				let splitName = found[group];
				const isIt = isItASplitName.test(splitName);
				splitName = splitName.replace(/['"]+/g, '');
				if(isIt) {
					const s = {
						name: splitName,
						locations: [],
						seen: false
					}
					let matched = false;
					const theHit = file + ':' + lineNo;
					for(const v of splits) {
						for(const w of v.locations) {
							if(w === theHit) {
								matched = true;
								console.log('skipping already matched: ' + theHit);
							}
						}
					}
					if(!matched) {
						s.locations.push(theHit);
						for(const t of splits) {
							if(s.name === t.name && !t.seen) {
								for(const loc of t.locations) {
									s.locations.push(loc);
								}
								t.seen = true;
							}
						}
						// console.log(s);
						splits.push(s);
					}
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

	return results;
}

function wait(ms) {
    return new Promise( (resolve) => {setTimeout(resolve, ms)});
}

run();
