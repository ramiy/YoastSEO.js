var getSentences = require( "../stringProcessing/getSentences.js" );
var stripHTMLTags = require( "../stringProcessing/stripHTMLTags.js" ).stripFullTags;
var getLanguage = require( "../helpers/getLanguage.js" );
var Sentence = require( "../values/Sentence.js" );

// English.
var getSentencePartsEnglish = require( "./english/getSentenceParts.js" );
var determinePassivesEnglish = require( "./english/determinePassives.js" );

// German.
var getSentencePartsGerman = require( "./german/getSentenceParts.js" );
var determinePassivesGerman = require( "./german/determinePassives.js" );

var forEach = require( "lodash/forEach" );

/**
 * Gets the sentence parts from a sentence by determining sentence breakers.
 *
 * @param {string} sentence The sentence to split up in sentence parts.
 * @param {string} language The language to use for determining how to get sentence parts.
 * @returns {Array} The array with all parts of a sentence that have an auxiliary.
 */
var getSentenceParts = function( sentence, language ) {
	var sentenceParts = [];

	switch( language ) {
		case "de":
			sentenceParts = getSentencePartsGerman( sentence );
			break;
		case "en":
		default:
			sentenceParts = getSentencePartsEnglish( sentence );
			break;
	}
	return sentenceParts;
};

/**
 * Checks the sentence part for any passive verb.
 *
 * @param {object} sentencePart The sentence part object to check for passives.
 * @param {string} language The language to use for finding passive verbs.
 * @returns {boolean} True if passive is found, false if no passive is found.
 */
var determinePassives = function( sentencePart, language ) {
	switch( language ) {
		case "de":
			sentencePart.setPassive( determinePassivesGerman( sentencePart.getSentencePartText(), sentencePart.getAuxiliaries() ) );
			break;
		case "en":
		default:
			sentencePart.setPassive( determinePassivesEnglish( sentencePart.getSentencePartText(), sentencePart.getAuxiliaries() ) );
			break;
	}
};

/**
 * Determines the number of passive sentences in the text.
 *
 * @param {Paper} paper The paper object to get the text from.
 * @returns {object} The number of passives found in the text and the passive sentences.
 */
module.exports = function( paper ) {
	var text = paper.getText();
	var locale = paper.getLocale();
	var language = getLanguage( locale );
	var sentences = getSentences( text );

	var sentenceObjects = [];

	forEach( sentences, function( sentence ) {
		sentenceObjects.push( new Sentence( sentence, locale ) );
	} );

	var passiveSentences = [];

	// Get sentence parts for each sentence.
	forEach( sentenceObjects, function( sentence ) {
		var strippedSentence = stripHTMLTags( sentence.getSentenceText() ).toLocaleLowerCase();

		var sentenceParts = getSentenceParts( strippedSentence, language );

		var passive = false;
		forEach( sentenceParts, function( sentencePart ) {
			determinePassives( sentencePart, language );
			passive = passive || sentencePart.isPassive();
		} );

		if ( passive === true ) {
			passiveSentences.push( sentence.getSentenceText() );
		}
	} );

	return {
		total: sentences.length,
		passives: passiveSentences,
	};
};