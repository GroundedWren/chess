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
		const note = await navigator.clipboard.readText();
		GW.Chessboard.Snapshots.initiateNotationMove(note);
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
	 * Has the computer figure out a move and make it
	 */
	ns.doAutoMove = async () => {
		const diaBusy = document.getElementById("diaBusy");
		diaBusy.showModal();

		const thinkingPromise = new Promise(resolve => ns.finishAutoMove = resolve);
		setTimeout(() => doAutoMove(), 10);
		await thinkingPromise;

		diaBusy.close();
		document.getElementById("divCurMove").focus();
	};

	function doAutoMove() {
		const snapNS = GW.Chessboard.Snapshots;

		const color = GW.Chessboard.Rendering.getCurrentMovingColor();
		const curSnap = snapNS.List[GW.Chessboard.Rendering.CurrentSnapshotIdx];
		const eventualities = [];
		const memoEventlys = {};
		let i = 0;
		let maxDepth = 0;
		do {
			const evntly = (i > 0)
				? eventualities.shift()
				: {
					Snap: snapNS.cloneSnapshot(curSnap),
					Score: snapNS.getScoreDiff(curSnap, color),
					PrevScore: null,
					Color: color,
					StartMoveNote: null,
					Depth: 0,
				};
			
			if((Math.random() < (0.1*evntly.Depth)) || !evntly.Snap) {
				eventualities.push(evntly);
				i += 0.5;
				continue;
			}

			const newEvntlys = [];
			let bestNewScoreDiff = Number.MIN_SAFE_INTEGER;
			Object.entries(evntly.Snap).forEach(([cell, piece]) => {
				if(piece.Color !== evntly.Color) { return; }
				piece.getMoves(evntly.Snap).forEach(move => {
					const newSnap = snapNS.cloneSnapshot(evntly.Snap);
					if(move.Promotion) {
						move.Promotion = "Queen";
						snapNS.promotePiece(cell, move.Promotion, newSnap);
					}
					else {
						snapNS.applyMove(newSnap, cell, move);
					}

					const startMoveNote = evntly.StartMoveNote
						|| GW.Chessboard.Notation.getMoveAsNotation(cell, move, curSnap, newSnap);
					const memoEvntly = `${startMoveNote}${snapNS.getSnapStr(newSnap)}`;
					if(memoEventlys[memoEvntly]) {
						return;
					}
					else {
						memoEventlys[memoEvntly] = true;
					}

					if(startMoveNote === "Qh4#") {
						i++;
					}

					const scoreDiff = snapNS.getScoreDiff(newSnap, color);
					if(evntly.Color === color) {
						bestNewScoreDiff = Math.max(bestNewScoreDiff, scoreDiff);
					}
					else {
						bestNewScoreDiff = Math.max(bestNewScoreDiff, scoreDiff * -1);
					}

					newEvntlys.push({
						Snap: newSnap,
						Score: scoreDiff,
						PrevScore: evntly.Score,
						Color: evntly.Color === "white" ? "black" : "white",
						StartMoveNote: startMoveNote,
						Depth: evntly.Depth + 1,
					});

					maxDepth = Math.max(maxDepth, evntly.Depth + 1);
				});
			});

			if(!newEvntlys.length) {
				const checkmateScore = evntly.Color === color ? -100000 : 100000;
				eventualities.push({
					Snap: null,
					Score: checkmateScore,
					PrevScore: checkmateScore,
					Color: evntly.Color === "white" ? "black" : "white",
					StartMoveNote: evntly.StartMoveNote,
					Depth: evntly.Depth + 1
				});
			}

			eventualities.push(...(newEvntlys.filter(newEvntly => {
				const scoreDiff = (evntly.Color === color) ? newEvntly.Score : (-1 * newEvntly.Score);
				return (scoreDiff === bestNewScoreDiff) || (Math.random() < 0.25)
			})));

			i++;
		} while(i < 2500 && eventualities.length);
		
		const moveScoreIdx = {};
		eventualities.forEach(evntly => {
			if((maxDepth - evntly.Depth) > 1 && Math.abs(evntly.Score) !== 100000) { return; }
			const moveScore = moveScoreIdx[evntly.StartMoveNote] || {Score: 0, Count: 0}

			moveScore.Score += evntly.Color === color ? evntly.Score : evntly.PrevScore;
			moveScore.Count += 1;

			moveScoreIdx[evntly.StartMoveNote] = moveScore;
		});

		let bestMoveNote = null;
		let bestMoveScore = Number.MIN_SAFE_INTEGER;
		Object.entries(moveScoreIdx).forEach(([moveNote, moveScore]) => {
			let avgEvntlyScore = moveScore.Score / moveScore.Count;
			if(avgEvntlyScore >= bestMoveScore) {
				bestMoveScore = avgEvntlyScore;
				bestMoveNote = moveNote;
			}
		});

		snapNS.initiateNotationMove(bestMoveNote);
		ns.finishAutoMove();
	}

	ns.setUseSquareDesc = (event) => {
		localStorage.setItem('square-desc', event.target.checked ? 'true' : 'false');
		GW.Chessboard.Rendering.setSnapshot(GW.Chessboard.Rendering.CurrentSnapshotIdx);
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

	const squareDesc = localStorage.getItem("square-desc");
	if(squareDesc === "false") {
		document.getElementById("cbxSquareDesc").checked = false;
	}

	GW.Chessboard.LoadSave.configureInitialGame();
});
window.addEventListener("beforeunload", (event) => {});