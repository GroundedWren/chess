/**
 * @file Chessboard scripts
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Chessboard(ns) {
	/**
	 *	Data: {
	 *		Name: "filename"
	 *		Timestamp: Date,
	 *		Moves: [
	 *			"Move in algebraic notation", ...
	 *		]
	 *	}
	 */
	ns.SavesList = [];
	ns.Data = {
		Name: "",
		Timestamp: null,
		Moves: [],
	};

	ns.ORDERED_RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];
	ns.RANK_ORDER_INDEX = {"8": 0, "7": 1, "6": 2, "5": 3, "4": 4, "3": 5, "2": 6, "1": 7};
	ns.ORDERED_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
	ns.FILE_ORDER_INDEX = {"a": 0, "b": 1, "c": 2, "d": 3, "e": 4, "f": 5, "g": 6, "h": 7};

	/**
	 * Retrieves a rank relative to another
	 * @param {string} startRank The rank to move from
	 * @param {number} delta How far to move
	 * @returns A rank
	 */
	ns.getRank = function getRank(startRank, delta) {
		return getOrderedItemAtDelta(ns.ORDERED_RANKS, ns.RANK_ORDER_INDEX[startRank], delta);
	};

	/**
	 * Retrieves a file relative to another
	 * @param {string} startFile The file to move from
	 * @param {number} delta How far to move
	 * @returns A file
	 */
	ns.getFile = function getFile(startFile, delta) {
		return getOrderedItemAtDelta(ns.ORDERED_FILES, ns.FILE_ORDER_INDEX[startFile], delta);
	};

	function getOrderedItemAtDelta(ary, startIdx, delta) {
		if(startIdx === null || startIdx === undefined) { return ""; }

		const newIdx = startIdx + delta;
		if(newIdx < 0 || newIdx >= ary.length) { return ""; }

		return ary[newIdx];
	}

	/**
	 * Shows a non-visual alert
	 * @param {string} message Plain text to alert
	 */
	ns.invisibleAlert = function invisibleAlert(message) {
		const asiChessboardLive = document.getElementById("asiChessboardLive");
		asiChessboardLive.innerText = "";
		setTimeout(() => asiChessboardLive.innerText = message, 0);
	};

	/**
	 * Copies text to the clipboard
	 * @param {string} message Plain text to copy
	 */
	ns.writeToClipboard = function writeToClipboard(message) {
		navigator.clipboard.writeText(message);
		GW.Controls.Toaster.showToast("Copied to clipboard");
	};

	/**
	 * Pasts the clipboard's value into the notation field
	 * @param {Event} event button click event
	 */
	ns.pasteToNotation = async (event) => {
		const txtApplyNotation = document.getElementById("txtApplyNotation");
		const note = await navigator.clipboard.readText();
		txtApplyNotation.value = note;
	};

	/**
	 * Handler for submitting the apply move form
	 * @param {SubmitEvent} event Form submit
	 */
	ns.onApplyMoveSubmit = (event) => {
		event.preventDefault();

		if(GW.Chessboard.Snapshots.initiateNotationMove(document.getElementById("txtApplyNotation").value)) {
			GW.Controls.Toaster.showToast("Move applied");
		}
		document.getElementById("formApplyMove").reset();
	};

	/**
	 * general function to create a javascript delegate with some specified parameters.
	 * @param {any} context The context for the delegate
	 * @param {Function} method The method to invoke
	 * @param {Array} args Array of method arguments
	 * @returns 
	 */
	GW.createDelegate = function(context, method, args)  {
		return function generatedFunction()
		{
			return method.apply(context, (args || []).concat(...arguments));
		};
	}
}) (window.GW.Chessboard = window.GW.Chessboard || {});

window.addEventListener("load", () => {
	const cbxDarkMode = document.getElementById("cbxDarkMode");
	const theme = localStorage.getItem("theme");
	switch(theme) {
		case "light":
			cbxDarkMode.checked = false;
			break;
		case "dark":
			cbxDarkMode.checked = true;
			break;
		default:
			cbxDarkMode.checked = window.matchMedia("(prefers-color-scheme: dark)").matches;
			break;
	}

	const autoSave = localStorage.getItem("auto-save");
	if(autoSave === "true") {
		document.getElementById("cbxAutoSave").checked = true;
	}

	const selAutoCopy = document.getElementById("selAutoCopy");
	let autoCopy = localStorage.getItem("auto-copy");
	if(![...selAutoCopy.options].map(optionEl => optionEl.value).includes(autoCopy)) {
		autoCopy = "none";
	}
	selAutoCopy.value = autoCopy;

	GW.Chessboard.LoadSave.configureInitialGame();
});
window.addEventListener("beforeunload", (event) => {});