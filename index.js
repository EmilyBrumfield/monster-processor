//iterative attacks should be replaced with "iterative" or something, because they're often different when converted

//Problems
//wholeWord will return the last line with the contents, not all lines or the first line or whatever
//should probably fix that before it becomes a problem, but it's not the first priority right now

//Inefficiencies
//getStatsRegex and getLineRegex seem kinda kludgy, but they work for now

//Compatible monster sources: PFSRD
//can refactor this for efficiency but let's just work on making things work for now
//should probably write some unit tests for all this soon

//New Priority: Now that the basics work, pick a converter type (2e, 5e, etc) and focus on getting everything it needs
//Worry about other stuff later

const inputBox = "input-box";  //the name of the input textarea; paste a monster here from a compatible source

//-----------------------------TEST FUNCTION, IGNORE-------------------

function testProcess() {
    let testMonster = butcherMonster(inputBox);
    let testAC = getStats(testMonster, "AC");
    testAC = processAC(testAC);
    let testHP = getStats(testMonster, "hp");
    testHP = processHitDice(testHP);
    let testSaves = getStats(testMonster, "Fort");
    let testAbilities = getStats(testMonster, "Str");
    testAbilities = processAbilities(testAbilities);
    let testAlignment = getStatsRegex(testMonster, /LG|NG|CG|LN|\bN\b|LE|NE|CE/)
    testAlignment = processIdentity(testAlignment)
    let testDefensive = getStats(testMonster, "Defensive Abilities");
    let testWeakness = getStats(testMonster, "Weaknesses");
    let testSpecialAttacks = getStats(testMonster, "Special Attacks");
    let testMelee = getStats(testMonster, "Melee");
    testMelee = processAttack(testMelee);

    console.log(testAC)
    console.log(testHP)
    console.log(testSaves)
    console.log(testAbilities)
    console.log(testAlignment)
    console.log(testMelee)
}

//----STRING FUNCTIONS
//----Various functions to get text from the input, split it up into arrays, search it for particular information

function grabText(targetID) {
    let textchunk = document.getElementById(targetID).value;
    return textchunk;
}

function splitText(targetID) {
    let textchunk = grabText(targetID);
    return textchunk.split('\n');
}

function wholeWord(word) { //placeholder
    let regWord = new RegExp('\\b' + word + '\\b');
    return regWord;
}

function findLine(word, monster) {  //finds a particular element in a monster array based on the starting word, returns index of that element
    //this will search through the entire text, even after it finds the index, so it shouldn't be used with enormous text blocks at the moment
    let targetIndex = -1;
    
    for (let i = 0; i < monster.length; i += 1) {
        if ( wholeWord(word).test(monster[i]) ) { //if the word is in the particular line of the array
            targetIndex = i;
        }
        else {
        }
    }
    return targetIndex;
}

function findLineRegex(word, monster) {  //just like findLine, but takes a RegExp instead of a normal string
    //this will search through the entire text, even after it finds the index, so it shouldn't be used with enormous text blocks at the moment
    let targetIndex = -1;
    
    for (let i = 0; i < monster.length; i += 1) {
        if ( word.test(monster[i]) ) { //if the word is in the particular line of the array
            targetIndex = i;
        }
        else {
        }
    }
    return targetIndex;
}

function fixNaN(possibleNaN) {  //changes any Not A Number integers to 0
    if (isNaN(possibleNaN)) {  //if the argument tested is not a number
        possibleNaN = 0; //changes it to 0; otherwise, nothing happens
    }

    return possibleNaN;
}

function wordArrayCheck(textchunk, wordArray) { //goes through an array of strings, checks each against a bit of text until it finds a match

    /*This one is short, but requires a bit of explaining.
    This function takes a line of text from a monster array (textchunk), and an array of strings to search through (wordArray)
    It will search through the wordArray from index 0 to the end, and check to see if each string is in the textchunk
    It will return the last matching term in the array; for example, 
    if textchunk = "apples and oranges and pineapples" and wordArray = ["oranges", "bananas", "apples", "milk"]
    then it'll return "apples"
    
    Use this one to find alignment, size category, or creature type.
    If there are several similar terms, where one could be found inside another, write the wordArray from shortest to longest string;
    For example, "Humanoid" should come before "Monstrous Humanoid" to prevent it from returning "Humanoid" for a monstrous humanoid

    If it doesn't find any of the words, then it returns the string "Unknown";

    This is case sensitive
    */

    let foundText = "Unknown"
    for (let i = 0; i < wordArray.length; i += 1) {
        if (wholeWord(wordArray[i]).test(textchunk) ) { //if the word exists in the textchunk as a complete word, not part of another
            foundText = wordArray[i];
        }
    }

    return foundText;
}


function sanitize(rawText) { //removes fancy formatting like longdashes and such
    rawText = rawText.replace(/–/g, "-");
    return rawText;
}

function clearModifiers(rawText) {  //deletes modifiers like +3, -5, or the like

    let modifierTemplate = /[+-]\d*/g;
    rawText = sanitize(rawText); //gets rid of fancy dashes to make this easier
    rawText = rawText.replace(/[+-]\d*/g, "");

    return rawText;
}

//----SOURCE CHECK
//----Identifies source of the monster text; can only process a compatible source or something formatted the same

function checkPFSRD(textchunk) {
    //if first appearances of CR comes before XP, and XP comes before Init, then it must be a monster from PFSRD.org
    //if not, it's probably some other format

    //first, we need to make sure all the phrases are in the text sample in the first place; otherwise it's definitely not a PFSRD entry
    if ( wholeWord("CR").test(textchunk) && wholeWord("XP").test(textchunk) && wholeWord("Init").test(textchunk) ) {
        //if all three are in the text, can proceed to check order to make sure it's a PFSRD entry and not something else; capitalization matters
        //defining the next three terms as variables for readability
        let positionCR = textchunk.search(wholeWord("CR"));
        let positionXP = textchunk.search(wholeWord("XP"));
        let positionInit = textchunk.search(wholeWord("Init"));

        if (positionCR < positionXP && positionXP < positionInit) {
            return true;
        }
        else {
            return false;
        }

    } else {
        //if all three phrases aren't in the text, it's not a PFSRD entry, so return false
        return false;    
    }

}

//----GET STATS
//----Functions to grab particular stat lines from the document; most can be done with getStats

function getStats(monster, statName) {  //searches a "monster" array for a line that contains the relevant statName
    let targetIndex = findLine(statName, monster);
    return monster[targetIndex];
}

function getStatsRegex(monster, statName) {  //as getStats, but takes a RegExp as a statName instead of a string
    let targetIndex = findLineRegex(statName, monster);
    return monster[targetIndex];
}

//----PROCESS STATS
//These functions extract useful information from stat strings, generally as integers that can be easily converted to another rules edition

function processAbilities(rawText) {  //extracts all six ability scores
    //simple function to code because the line format will always be the same

    let Abilities = {};

    //get Str, cut it out of the raw text
    cutOffPoint = rawText.indexOf(","); 
    Abilities.strength = rawText.slice(0, cutOffPoint);
    rawText = rawText.slice(cutOffPoint+2)

    //get Dex, cut it out of the raw text; repeat for Con, Int, Wis, Cha below; pretty straightforward
    cutOffPoint = rawText.indexOf(","); 
    Abilities.dexterity = rawText.slice(0, cutOffPoint);
    rawText = rawText.slice(cutOffPoint+2)

    cutOffPoint = rawText.indexOf(","); 
    Abilities.constitution = rawText.slice(0, cutOffPoint);
    rawText = rawText.slice(cutOffPoint+2)


    cutOffPoint = rawText.indexOf(","); 
    Abilities.intelligence = rawText.slice(0, cutOffPoint);
    rawText = rawText.slice(cutOffPoint+2)

    cutOffPoint = rawText.indexOf(","); 
    Abilities.wisdom = rawText.slice(0, cutOffPoint);
    rawText = rawText.slice(cutOffPoint+2)

    //the remainder will be Charisma
    Abilities.charisma = rawText;

    //strip non-numeric characters
    Abilities.strength = Abilities.strength.replace(/\D/g,'');
    Abilities.dexterity = Abilities.dexterity.replace(/\D/g,'');
    Abilities.constitution = Abilities.constitution.replace(/\D/g,'');
    Abilities.intelligence = Abilities.intelligence.replace(/\D/g,'');
    Abilities.wisdom = Abilities.wisdom.replace(/\D/g,'');
    Abilities.charisma = Abilities.charisma.replace(/\D/g,'');

    //convert to integers
    Abilities.strength = parseInt(Abilities.strength, 10);
    Abilities.dexterity = parseInt(Abilities.dexterity, 10);
    Abilities.constitution = parseInt(Abilities.constitution, 10);
    Abilities.intelligence = parseInt(Abilities.intelligence, 10);
    Abilities.wisdom = parseInt(Abilities.wisdom, 10);
    Abilities.charisma = parseInt(Abilities.charisma, 10);

    //convert non-stats to 0
    Abilities.strength = fixNaN(Abilities.strength);
    Abilities.dexterity = fixNaN(Abilities.dexterity);
    Abilities.constitution = fixNaN(Abilities.constitution);
    Abilities.intelligence = fixNaN(Abilities.intelligence);
    Abilities.wisdom = fixNaN(Abilities.wisdom);
    Abilities.charisma = fixNaN(Abilities.charisma);

    //return the processed ability scores as a single object
    return Abilities;
}

function processAC(rawText) {  //extracts AC, touch AC, and flat-footed AC
    //This section will chop the armor sources in parentheses off the end of the AC; if there's no parenthetical, it doesn't do anything
    //simple function to code because the line format will always be the same

    let cutOffPoint = rawText.indexOf("(") - 1; 
    rawText = rawText.slice(0, cutOffPoint);

    let Armor = {};

    //get AC, cut it out of the raw text
    cutOffPoint = rawText.indexOf(","); 
    Armor.AC = rawText.slice(0, cutOffPoint);
    rawText = rawText.slice(cutOffPoint+2)

    //get touch, cut it out of the raw text
    cutOffPoint = rawText.indexOf(","); 
    Armor.touch = rawText.slice(0, cutOffPoint);
    rawText = rawText.slice(cutOffPoint+2)
    
    //the remainder is flat-footed; get it
    Armor.flatfooted = rawText;

    //strip non-numeric characters
    Armor.AC = Armor.AC.replace(/\D/g,'');
    Armor.touch = Armor.touch.replace(/\D/g,'');
    Armor.flatfooted = Armor.flatfooted.replace(/\D/g,'');

    //convert to integers
    Armor.AC = parseInt(Armor.AC, 10);
    Armor.touch = parseInt(Armor.touch, 10);
    Armor.flatfooted = parseInt(Armor.flatfooted, 10);
   
    //return the processed AC types as a single object
    return Armor;
}

function processHitDice(rawText) {  //extracts Hit Dice; nothing else is needed
    
    let cutOffPoint = rawText.indexOf("(") + 1; //cut off everything before the hit dice
    rawText = rawText.slice(cutOffPoint);
    cutOffPoint = rawText.indexOf("d");
    rawText = rawText.slice(0, cutOffPoint); //after this, the only thing is what's between the "("" and the "d", which is the number of hit dice

    rawText = parseInt(rawText, 10);
    
    return rawText; //returns a single integer because hit dice are simple
}

function processIdentity(rawText) {  //extracts alignment, size, type, and subtype; everything on the line starting with alignment
//simple function to code because the line format will always be the same

let Identity = {};
let hasSubCategory = false;

//checks for a subcategory or subcategories in parentheses
if ( rawText.indexOf("(") != -1 ) {
    hasSubCategory = true;
}

//get alignment, cut it out of the raw text
cutOffPoint = rawText.indexOf(" "); 
Identity.alignment = rawText.slice(0, cutOffPoint);
rawText = rawText.slice(cutOffPoint+1)

//get size category, cut it out of the raw text
cutOffPoint = rawText.indexOf(" ");
Identity.sizeCategory = rawText.slice(0, cutOffPoint);
rawText = rawText.slice(cutOffPoint+1)

//get creature category
if ( hasSubCategory ) {
    cutOffPoint = rawText.indexOf("("); 
    Identity.creatureCategory = rawText.slice(0, cutOffPoint);
    rawText = rawText.slice(cutOffPoint+1)
    //if there's a remainder, it should be the creature subcategories
    Identity.creatureSubCategory = rawText;
}
else {
    Identity.creatureCategory = rawText;
    Identity.creatureSubCategory = "";
}

    //clean up the output to remove unnecessary characters
    Identity.creatureCategory = Identity.creatureCategory.replace(/\s+/g, "");
    Identity.creatureSubCategory = Identity.creatureSubCategory.replace(")", "");

//return the processed ability scores as a single object
return Identity;
}

function processAttack(rawText) {  //extracts attacks and damage
    //complex function to code because the line can vary a bit
   
    let Attack = {};
    let cutOffPoint = -1;
    let cutOffPointSecond = -1;
    
    rawText = sanitize(rawText);

    //cut off the Melee or Ranged tag; it always comes before the first space
    cutOffPoint = rawText.indexOf(" "); 
    rawText = rawText.slice(cutOffPoint+1);

    rawText = clearModifiers(rawText);

    /*
    
    //get size category, cut it out of the raw text
    cutOffPoint = rawText.indexOf(" ");
    Identity.sizeCategory = rawText.slice(0, cutOffPoint);
    rawText = rawText.slice(cutOffPoint+1)
    
    //get creature category
    if ( hasSubCategory ) {
        cutOffPoint = rawText.indexOf("("); 
        Identity.creatureCategory = rawText.slice(0, cutOffPoint);
        rawText = rawText.slice(cutOffPoint+1)
        //if there's a remainder, it should be the creature subcategories
        Identity.creatureSubCategory = rawText;
    }
    else {
        Identity.creatureCategory = rawText;
        Identity.creatureSubCategory = "";
    }
    
        //clean up the output to remove unnecessary characters
        Identity.creatureCategory = Identity.creatureCategory.replace(/\s+/g, "");
        Identity.creatureSubCategory = Identity.creatureSubCategory.replace(")", "");
    
    //return the processed ability scores as a single object
*/
    return rawText;
    }

//---NEEDS BETTER DEFINITION
//---Various stuff that should be renamed and put elsewhere

//makes sure this is PFSRD text, chops it up for use in the next step



function butcherMonster(targetID) {
    if ( checkPFSRD(grabText(inputBox))) {
        //here is where the code goes
        return splitText(inputBox);
    }
    else {
        alert("This isn't going to work out.")
        return ["Not PFSRD"];
    }
}

/*Summary of procedures:
--Check if the text came from a standard Pathfinder PFSRD page
--Break down the text into chunks of information; this will take quite some time to work out
*/

/*PLANS
--Each format (PFSRD, etc) is going to need slightly different mechanisms due to different rules and different layouts
--Probably easiest to make separate functions to harvest each type of data, like getAC, getAttacks, etc.
--Might be efficient to delete any array element that's already been harvested completely, like the AC line
--Can have special processors and converters available in each harvester function

*/