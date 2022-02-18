import _ from 'lodash';
import fs from 'fs';
import ejs from 'ejs';
var pdf = require('html-pdf');
import puppeteer from 'puppeteer'


var htmlToPdf = async (htmlTemplate, data, outputFileName) => {
  return new Promise( async (resolve, reject) => {
    console.log('In html to PDF' + JSON.stringify(data));
    try {
      var html = fs.readFileSync(htmlTemplate, 'utf8');
      // var options = {
      //   format: 'A3',
      //   orientation: 'portrait',
      //   border: '10mm',
      // };
  //     var template = handlebars.compile(html);
	// var document = template({});
      var document = ejs.render(html, { data: data });
      //   console.log('Document ' + document);
     let pdfPath =  './tempFiles/' + outputFileName + '.pdf'

      var options = {
        width: '1230px',
        headerTemplate: "<p></p>",
        footerTemplate: "<p></p>",
        displayHeaderFooter: false,
        margin: {
          top: "10px",
          bottom: "30px"
        },
        printBackground: true,
        path: pdfPath
      }

      
	const browser = await puppeteer.launch({
		args: ['--no-sandbox'],
		headless: true
	});

	var page = await browser.newPage();
	
	await page.goto(`data:text/html;charset=UTF-8,${document}`, {
		waitUntil: 'networkidle0'
	});

	await page.pdf(options);
	await browser.close();
  resolve("done")

      // pdf
      //   .create(document, options)
      //   .toFile('./tempFiles/' + outputFileName + '.pdf', function (err, res) {
      //     if (err) return console.log(err);
      //     console.log(res);
      //     return resolve(res);
      //   });
    } catch (error) {
      return reject(error);
    }
  });
};

export default {
  htmlToPdf,
};
