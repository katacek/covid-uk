const Apify = require('apify');

const sourceUrl = 'https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases';
const LATEST = 'LATEST';
let check = false;

Apify.main(async () =>
{

    const kvStore = await Apify.openKeyValueStore('COVID-19-UK');
    const dataset = await Apify.openDataset('COVID-19-UK-HISTORY');
    const { email } = await Apify.getValue('INPUT');

    try{

    console.log('Launching Puppeteer...');
    const browser = await Apify.launchPuppeteer();

    const page = await browser.newPage();
    await Apify.utils.puppeteer.injectJQuery(page);

    console.log('Going to the website...');
    await page.goto('https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases');
    
    const trackCoronavirusCases = '#attachment_4091163 > div.attachment-details > h2 > a';
    //const trackCoronavirusCases = '#attachment_4077017 > div.attachment-details > h2 > a';
    await page.waitForSelector(trackCoronavirusCases);

    const trackCoronavirusCasesLink = await page.$eval(trackCoronavirusCases, el => el.href);
    // networkidle0 : wait for all page to load
    await page.goto(trackCoronavirusCasesLink, { timeout: 60000 });
   
    await page.waitForSelector('#UK_Countries_cases_976_layer', { timeout: 60000 });
    await page.waitForSelector('div.flex-fluid');
    //await page.waitFor(4000);
    await page.waitForSelector("text[vector-effect='non-scaling-stroke']");
 
    console.log('Getting data...');
    // page.evaluate(pageFunction[, ...args]), pageFunction <function|string> Function to be evaluated in the page context, returns: <Promise<Serializable>> Promise which resolves to the return value of pageFunction
    const result = await page.evaluate(() =>
    {

        const getInt = (x)=>{
            return parseInt(x.replace(' ','').replace(',','').replace(String.fromCharCode(160),''))};
            
        const now = new Date();
        
        // eq() selector selects an element with a specific index number, text() method sets or returns the text content of the selected elements
        const totalInfected = $('strong:contains("Cumulative Totals")').closest('full-container').find('.responsive-text:contains(cases)').text().trim();
        const dailyConfirmed = $('strong:contains("Daily Totals")').closest('full-container').find('.responsive-text:contains(cases)').text().trim();
        //const patientsRecovered = $("text[vector-effect='non-scaling-stroke']").eq(4).text();
        const deceased = $('strong:contains("Cumulative Totals")').closest('full-container').find('.responsive-text:contains(deaths)').text().trim();
        const englandConfirmed = $('strong:contains("England")').closest('full-container').find('.responsive-text').eq(0).text().trim();
        const englandDeceased = $('strong:contains("England")').closest('full-container').find('.responsive-text').eq(1).text().trim();
        const scottlandConfirmed = $('strong:contains("Scotland")').closest('full-container').find('.responsive-text').eq(0).text().trim();
        const scottlandDeceased = $('strong:contains("Scotland")').closest('full-container').find('.responsive-text').eq(1).text().trim();
        const walesConfirmed =$('strong:contains("Wales")').closest('full-container').find('.responsive-text').eq(0).text().trim();
        const walesDeceased = $('strong:contains("Wales")').closest('full-container').find('.responsive-text').eq(1).text().trim();
        const irelandConfirmed = $('strong:contains("N. Ireland")').closest('full-container').find('.responsive-text').eq(0).text().trim();
        const irelandDeceased = $('strong:contains("N. Ireland")').closest('full-container').find('.responsive-text').eq(1).text().trim();
                     
        
        const data = {
            infected: getInt(totalInfected),
            tested: "N/A",
            recovered: "N/A",
            deceased: getInt(deceased),
            dailyConfirmed: getInt(dailyConfirmed),
            englandConfirmed: getInt(englandConfirmed),
            englandDeceased: getInt(englandDeceased),
            scottlandConfirmed: getInt(scottlandConfirmed),
            scottlandDeceased: getInt(scottlandDeceased),
            walesConfirmed: getInt(walesConfirmed),
            walesDeceased: getInt(walesDeceased),
            northenIrelandConfirmed: getInt(irelandConfirmed),
            northenIrelandDeceased: getInt(irelandDeceased),
            country: "UK",
            historyData: "https://api.apify.com/v2/datasets/K1mXdufnpvr53AFk6/items?format=json&clean=1",
            sourceUrl:'https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases',
            lastUpdatedAtApify: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes())).toISOString(),
            lastUpdatedAtSource: "N/A",
            readMe: 'https://apify.com/katerinahronik/covid-uk',
            };
        return data;
        
    });       
    
    console.log(result)
    
    if ( !result.infected || !result.dailyConfirmed || !result.deceased|| !result.englandConfirmed|| !result.scottlandConfirmed|| !result.walesConfirmed|| !result.northenIrelandConfirmed) {
                check = true;
            }
    else {
            let latest = await kvStore.getValue(LATEST);
            if (!latest) {
                await kvStore.setValue('LATEST', result);
                latest = result;
            }
            delete latest.lastUpdatedAtApify;
            const actual = Object.assign({}, result);
            delete actual.lastUpdatedAtApify;

            if (JSON.stringify(latest) !== JSON.stringify(actual)) {
                await dataset.pushData(result);
            }

            await kvStore.setValue('LATEST', result);
            await Apify.pushData(result);
        }


    console.log('Closing Puppeteer...');
    await browser.close();
    console.log('Done.');  
    
    // if there are no data for TotalInfected, send email, because that means something is wrong
    // const env = await Apify.getEnv();
    // if (check) {
    //     await Apify.call(
    //         'apify/send-mail',
    //         {
    //             to: email,
    //             subject: `Covid-19 UK from ${env.startedAt} failed `,
    //             html: `Hi, ${'<br/>'}
    //                     <a href="https://my.apify.com/actors/${env.actorId}#/runs/${env.actorRunId}">this</a> 
    //                     run had 0 TotalInfected, check it out.`,
    //         },
    //         { waitSecs: 0 },
    //     );
    // };
}
catch(err){

    console.log(err)

    let latest = await kvStore.getValue(LATEST);
    var latestKvs = latest.lastUpdatedAtApify;
    var latestKvsDate = new Date(latestKvs)
    var d = new Date();
    // adding two hours to d
    d.setHours(d.getHours() - 2);
    if (latestKvsDate < d) {
        throw (err)
    }
}
});
