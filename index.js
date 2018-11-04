function testProcess() {
    checkPFSRD(grabText("main-input"));
}

function grabText(targetID) {
    let textchunk = document.getElementById(targetID).value;
    return textchunk;
}

function checkPFSRD(textchunk) {
    //if CR comes before XP, and XP comes before Init, then it must be a monster from PFSRD.org

    //first, we need to make sure all the phrases are in the text sample in the first place; otherwise it's definitely not a PFSRD entry
    if ( wholeWord("CR").test(textchunk) && wholeWord("XP").test(textchunk) && wholeWord("Init").test(textchunk) ) {
        //if all three are in the text, can proceed to check order to make sure it's a PFSRD entry and not something else; capitalization matters
        //defining the next three terms as variables for readability
        let positionCR = textchunk.search(wholeWord("CR"));
        let positionXP = textchunk.search(wholeWord("XP"));
        let positionInit = textchunk.search(wholeWord("Init"));

        if (positionCR < positionXP && positionXP < positionInit) {
            alert("Right order!");
        }
        else {
            alert("Wrong order!");
        }

    } else {
        //if all three phrases aren't in the text, it's not a PFSRD entry, so return false
        //return false;
        alert("Not here!");
    }

}

function wholeWord(word) { //placeholder
    let regWord = new RegExp('\\b' + word + '\\b');
    return regWord;
}