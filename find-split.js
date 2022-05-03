import * as github from '@actions/github';
import * as core from '@actions/core';
import * as glob from '@actions/glob';
import * as fs from 'fs';
import {default as axios} from 'axios';

async function run() {
	try {
		let fileCount = 0;

		const adminApiToken = core.getInput('adminApiToken');
		const wsId = core.getInput('wsId');

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

			for(const s of splits) {
				console.log(s);
				const getSplitUrl = 'https://api.split.io/internal/api/v2/splits/ws/'+ wsId + '/' + s.name;

				await axios.get(getSplitUrl, { headers: 
					{'Authorization': 'Bearer ' + adminApiToken}})
				.then(async function(response) {
					await wait(750);

					let oldDesc = response.data.description;
					console.log('oldDesc: ' + oldDesc);
					const descIndex = oldDesc.indexOf('{"name":');
					if(descIndex != -1) {
						// ASSUMES the location info is appended
						// Drops any suffix
						oldDesc = oldDesc.substring(0, descIndex);
					}
					console.log('oldDesc minus desc: ' + oldDesc);

					// create new full location description
					const newDesc = JSON.stringify(s);
					// const newDesc = '';

					console.log('newDesc: ' + newDesc);

					// update split with new full location description
					const updateDescriptionUrl = 'https://api.split.io/internal/api/v2/splits/ws/' + wsId + '/' + s.name + '/updateDescription';
					await axios.put(updateDescriptionUrl, newDesc, 
						{ headers: 
							{'Authorization': 'Bearer ' + adminApiToken,
							 'Content-Type': 'application/json'
					}})
					.then(function (response) {
						console.log('updated!');
						console.log('response.data');
					})
					.catch(function(err) {
						console.log('FAILED to update');
						console.log(err);
					});
				})
				.catch(function(err) {
				  console.log('split not found: ' + s.name);
				  // console.log(err);
				});

			}
			core.setOutput('splits', splits);


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
