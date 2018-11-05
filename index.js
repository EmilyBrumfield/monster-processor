//can refactor this for efficiency but let's just work on making things work for now
const inputBox = "input-box";

function testProcess() {
    let testMonster = butcherMonster(inputBox);
    let testAC = getStats(testMonster, "AC");
    testAC = processAC(testAC);
    let testHP = getStats(testMonster, "hp");
    let testSaves = getStats(testMonster, "Fort");
    let testAbilities = getStats(testMonster, "Str");
    console.log(testAC)
    console.log(testHP)
    console.log(testSaves)
    console.log(testAbilities)    
}



function grabText(targetID) {
    let textchunk = document.getElementById(targetID).value;
    return textchunk;
}

function splitText(targetID) {
    let textchunk = grabText(targetID);
    return textchunk.split('\n');
}

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

//-----------------------------------GET STAT FUNCTIONS---------------------------------
//Gets statistics, then reformats or converts them depending on settings

function getStats(monster, statName) {
    let targetIndex = findLine(statName, monster);
    return monster[targetIndex];
}

function processAC(rawText) {
    //This section will chop the armor sources in parentheses off the end of the AC; if there's no parenthetical, it doesn't do anything
    let cutOffPoint = rawText.indexOf("(") - 1; 
    rawText = rawText.slice(0, cutOffPoint);
    return rawText;
}

//---------------------------------------------------------------------------------------

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

function processMonster(monster) {  //"monster" is an array of parts from butcherMonster
    
//getAC
//getAttacks
//getEtc

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