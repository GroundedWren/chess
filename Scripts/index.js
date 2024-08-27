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

	ns.getRank = function getRank(startRank, delta) {
		return getOrderedItemAtDelta(ns.ORDERED_RANKS, ns.RANK_ORDER_INDEX[startRank], delta);
	};

	ns.getFile = function getFile(startFile, delta) {
		return getOrderedItemAtDelta(ns.ORDERED_FILES, ns.FILE_ORDER_INDEX[startFile], delta);
	};

	function getOrderedItemAtDelta(ary, startIdx, delta) {
		if(startIdx === null || startIdx === undefined) { return ""; }

		const newIdx = startIdx + delta;
		if(newIdx < 0 || newIdx >= ary.length) { return ""; }

		return ary[newIdx];
	}

	ns.invisibleAlert = function invisibleAlert(message) {
		const asiChessboardLive = document.getElementById("asiChessboardLive");
		asiChessboardLive.innerText = "";
		setTimeout(() => asiChessboardLive.innerText = message, 0);
	};

	ns.writeToClipboard = function writeToClipboard(message) {
		navigator.clipboard.writeText(message);
		GW.Controls.Toaster.showToast("Copied to clipboard");
	};

	ns.onApplyMoveSubmit = (event) => {
		event.preventDefault();

		if(GW.Chessboard.Snapshots.initiateNotationMove(document.getElementById("txtApplyNotation").value)) {
			GW.Controls.Toaster.showToast("Move applied");
		}
		document.getElementById("formApplyMove").reset();
	};

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

	const autoCopy = localStorage.getItem("auto-copy");
	if(autoCopy === "true") {
		document.getElementById("cbxAutoCopy").checked = true;
	}

	GW.Chessboard.LoadSave.configureInitialGame();
});
window.addEventListener("beforeunload", (event) => {});