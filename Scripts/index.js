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

	ns.Snapshots = [];
	ns.CurrentSnapshotIdx = 0;

	ns.getRank = function getRank(startRank, delta) {
		return getOrderedItemAtDelta(ns.ORDERED_RANKS, ns.RANK_ORDER_INDEX[startRank], delta);
	}

	ns.getFile = function getFile(startFile, delta) {
		return getOrderedItemAtDelta(ns.ORDERED_FILES, ns.FILE_ORDER_INDEX[startFile], delta);
	}

	function getOrderedItemAtDelta(ary, startIdx, delta) {
		if(startIdx === null || startIdx === undefined) { return ""; }

		const newIdx = startIdx + delta;
		if(newIdx < 0 || newIdx >= ary.length) { return ""; }

		return ary[newIdx];
	}

	ns.onSquareClicked = (file, rank) => {
		const tbodyBoard = document.getElementById("tbodyBoard");
		tbodyBoard.querySelectorAll("button").forEach(
			buttonEl => buttonEl.setAttribute("aria-pressed", buttonEl.id === `button-${file}${rank}`)
		);

		ns.Rendering.cleanSelectionBasedClasses();
		ns.Rendering.calloutPiecesMovable(file, rank);
		ns.Rendering.calloutPiecesThreatening(file, rank);
		ns.Rendering.calloutPiecePath(file, rank);
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

	GW.Chessboard.LoadSave.reloadSavesList();
	GW.Chessboard.LoadSave.newGame();
});
window.addEventListener("beforeunload", (event) => {});