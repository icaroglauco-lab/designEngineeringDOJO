/* 
    RandomCoolDesignScrapper é a engrenagem que tem responsabilidade de fazer scrap em uma determinada (ou padrão) url de designs
 e retorna uma aleatória, respeitando um arquivo de histórico yaml para não haver repetição.
    De certa forma, é o core da aplicação, sendo a primeira a ser escrita.
 */
import axios from 'axios';
import cheerio from 'cheerio';

// Using require instead of import cause ts bugs (rg: module['default']) not handled
const fs = require('fs');
const yaml = require('js-yaml');

// Yargs for cli usage completion
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

const url = 'https://collectui.com/challenges/user-profile';
const historyFile = `${process.cwd()}/history.yml`;

async function RandomCoolDesignScrapper(fromUrl:string = url) : Promise<string>{
    // load up the designs page
    const response = await axios(fromUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    // query .design img
    const designInpirationsRaw = $(".design img");

    // digest the results, switching from default medium src urls to large and removing undefined items
    const designInpirations : Array<string> = Object.keys(designInpirationsRaw).map( index => {
        return $(designInpirationsRaw[index]).attr('src')?.replace('medium', 'large');
    }).filter(url => url!==undefined);

    // get a random' index number' design
    let randomizedChoice = designInpirations[getRandomInt(0, designInpirations.length - 1)];

    // load history with type verification
    const loadedYaml = yaml.load(fs.readFileSync(historyFile, 'utf8'));
    let {history} : {history: Array<string>} = typeof loadedYaml == 'object' ? {history: [], ...loadedYaml} : {history: []};
    // &
    // enter in loop to randomize the choice until the choice
    // is not in the history array;
    while (history.findIndex( el => el === randomizedChoice) > -1) {
        randomizedChoice = designInpirations[getRandomInt(0, designInpirations.length - 1)];
    }
    // register in the history file the randomized choice
    history.push(randomizedChoice);
    fs.writeFileSync(historyFile, yaml.dump({history}));

    // end with a return foolproof design image
    return randomizedChoice;
}

// !Entry if its running as cli
if (require.main === module) {
    RandomCoolDesignScrapper(argv['from'])
    .then(result => console.log(result));
}

// util
function getRandomInt(min:number, max:number) :number{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = RandomCoolDesignScrapper;