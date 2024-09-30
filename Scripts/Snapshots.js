/**
 * @file Code for game state snapshots
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function Snapshots(ns) {
	/**
	 * Builds snapshots from loaded game data
	 */
	ns.buildGameSnapshots = function buildGameSnapshots() {
		ns.List = [];
		ns.HighlightSquares = [];

		const initSnap = {};
		GW.Chessboard.ORDERED_FILES.forEach(file => {
			initSnap[`${file}7`] = new GW.Chessboard.Pieces.Pawn("black", file, "7");
			initSnap[`${file}2`] = new GW.Chessboard.Pieces.Pawn("white", file, "2");
			switch(file) {
				case "a":
				case "h":
					initSnap[`${file}8`] = new GW.Chessboard.Pieces.Rook("black", file, "8");
					initSnap[`${file}1`] = new GW.Chessboard.Pieces.Rook("white", file, "1");
					break;
				case "b":
				case "g":
					initSnap[`${file}8`] = new GW.Chessboard.Pieces.Knight("black", file, "8");
					initSnap[`${file}1`] = new GW.Chessboard.Pieces.Knight("white", file, "1");
					break;
				case "c":
				case "f":
					initSnap[`${file}8`] = new GW.Chessboard.Pieces.Bishop("black", file, "8");
					initSnap[`${file}1`] = new GW.Chessboard.Pieces.Bishop("white", file, "1");
					break;
				case "d":
					initSnap[`${file}8`] = new GW.Chessboard.Pieces.Queen("black", file, "8");
					initSnap[`${file}1`] = new GW.Chessboard.Pieces.Queen("white", file, "1");
					break;
				case "e":
					initSnap[`${file}8`] = new GW.Chessboard.Pieces.King("black", file, "8");
					initSnap[`${file}1`] = new GW.Chessboard.Pieces.King("white", file, "1");
					break;
			}
		});
		ns.List.push(initSnap);
		ns.HighlightSquares.push({});

		for(let i = 0; i < GW.Chessboard.Data.Moves.length; i++) {
			const {Snap, Start, End} = getSnapshot(
				ns.List[i],
				GW.Chessboard.Data.Moves[i],
				i % 2 == 0 ? "white" : "black"
			);
			ns.List.push(Snap);
			ns.HighlightSquares.push({[Start]: true, [End]: true})
		}
	}

	function getSnapshot(snapshot, moveNotation, color) {
		const {CellStart, Move} = GW.Chessboard.Notation.getNotationAsMove(moveNotation, color, snapshot);
		const newSnap = ns.cloneSnapshot(snapshot);
		if(CellStart && Move) {
			applyMove(newSnap, CellStart, Move); //Async is only for user input, not needed here
		}
		return {Snap: newSnap, Start: CellStart, End: Move.Cell};
	}

	/**
	 * Sets the specified snapshot index as the current one
	 * @param {number} idx Index of the snapshot to clip at
	 */
	ns.clipAtIdx = function clipAtIdx(idx) {
		ns.List = ns.List.slice(0, idx + 1);
		ns.HighlightSquares = ns.HighlightSquares.slice(0, idx + 1);
		GW.Chessboard.Rendering.setSnapshot(idx);
	};

	/**
	 * Applies a user-initiated move based on algebraic notation
	 * @param {string} note Algebraic notation
	 * @returns Whether the move succeeded
	 */
	ns.initiateNotationMove = function initiateNotationMove(note) {
		const curSnap = ns.List[GW.Chessboard.Rendering.CurrentSnapshotIdx];
		
		const {CellStart, Move} = GW.Chessboard.Notation.getNotationAsMove(
			note,
			GW.Chessboard.Rendering.getCurrentMovingColor(),
			curSnap
		);
		if(!CellStart || !Move) {
			return false;
		}

		return initiateMove(CellStart, Move);
	}

	/**
	 * Applies a user initiated move
	 * @param {string} cellStart Move primary piece beginning
	 * @param {string} cellEnd Move primary piece endingending
	 * @returns a promise which resolves when the move has applied
	 */
	ns.initiateClickMove = async function(cellStart, cellEnd) {
		const curSnap = ns.List[GW.Chessboard.Rendering.CurrentSnapshotIdx];

		const startPiece = curSnap[cellStart];
		if(!startPiece) {
			debugger; //No?
			return;
		}
		const move = startPiece.getMoves(curSnap).find(move => move.Cell === cellEnd);
		if(!move) {
			debugger; //No??
			return;
		}

		return initiateMove(cellStart, move);
	}

	async function initiateMove(cellStart, move) {
		const curSnapIdx = GW.Chessboard.Rendering.CurrentSnapshotIdx;
		const curSnap = ns.List[curSnapIdx];
		const movingColor = GW.Chessboard.Rendering.getCurrentMovingColor();

		ns.List = ns.List.slice(0, curSnapIdx + 1);
		ns.HighlightSquares = ns.HighlightSquares.slice(0, curSnapIdx + 1);
		const newSnap = ns.cloneSnapshot(curSnap);
		await applyMove(newSnap, cellStart, move);
		ns.List.push(newSnap);
		ns.HighlightSquares.push({[cellStart]: true, [move.Cell]: true});

		GW.Chessboard.Data.Moves = GW.Chessboard.Data.Moves.slice(0, curSnapIdx);
		const moveNotation = GW.Chessboard.Notation.getMoveAsNotation(cellStart, move, curSnap, newSnap)
		GW.Chessboard.Data.Moves.push(moveNotation);
		if(document.getElementById("selAutoCopy").value === movingColor) {
			setTimeout(() => GW.Chessboard.writeToClipboard(moveNotation), 0);
		}
		if(document.getElementById("cbxAutoSave").checked) {
			const lastSaveName = localStorage.getItem("last-save-name");
			if(lastSaveName && lastSaveName !== "!temp") {
				GW.Chessboard.LoadSave.saveToLocal(lastSaveName);
			}
			else {
				GW.Chessboard.LoadSave.tempSave();
			}
		}

		GW.Chessboard.Rendering.setSnapshot(curSnapIdx + 1);
	}

	async function applyMove(snapshot, cellStart, move) {
		ns.applyMove(snapshot, cellStart, move);
		if(move.Promotion) {
			if(["Queen", "Knight", "Rook", "Bishop"].includes(move.Promotion)) {
				promotePiece(move.Cell, move.Promotion, snapshot);
			}
			else {
				const userPromise = new Promise(resolve => ns.resolvePromotion = GW.createDelegate(
					this,
					(resolve, event) => {
						event.preventDefault();

						const promo = event.target.elements["promoteTo"].value;
						move.Promotion = promo;
						
						promotePiece(move.Cell, move.Promotion, snapshot);
						resolve();
					},
					[resolve]
				));
				document.getElementById("diaPromotion").showModal();
				return userPromise;
			}
		}
	}

	function promotePiece(cell, pieceName, snapshot)  {
		let oldPieceColor = snapshot[cell].Color;
		delete snapshot[cell];
		snapshot[cell] = new GW.Chessboard.Pieces[pieceName](
			oldPieceColor,
			cell[0],
			cell[1]
		);
	}
	ns.promotePiece = promotePiece;

	/**
	 * Applies a move to the snapshot
	 * @param {Object} snapshot Board snapshot
	 * @param {string} cellStart Primary piece starting point
	 * @param {Object} move Move description
	 */
	ns.applyMove = function applyMove(snapshot, cellStart, move) {
		const piece = snapshot[cellStart];
		if(!piece) {
			debugger; //Hey maybe see how this happened
			return;
		}

		if(move.Capture) {
			delete snapshot[move.Capture];
		}
		piece.moveTo(move.Cell[0], move.Cell[1]);
		snapshot[move.Cell] = piece;
		delete snapshot[cellStart];

		//Recursion, but should be rare and only ever go one deep
		if(move.CastleKS) {
			ns.applyMove(snapshot, move.CastleKS, {Cell: `${GW.Chessboard.getFile(piece.File, -1)}${piece.Rank}`, Capture: null});
		}
		else if (move.CastleQS) {
			ns.applyMove(snapshot, move.CastleQS, {Cell: `${GW.Chessboard.getFile(piece.File, 1)}${piece.Rank}`, Capture: null});
		}
	}

	/**
	 * Duplicates a board
	 * @param {Object} snapshot Board snapshot
	 * @returns A new board snapshot matching the input
	 */
	ns.cloneSnapshot = function(snapshot) {
		const cloneSnapshot = {};
		for(let cell of Object.keys(snapshot)) {
			cloneSnapshot[cell] = snapshot[cell].clone();
		}
		return cloneSnapshot;
	}

	/**
	 * Gets the values for each color at the board state
	 * @param {Object} snapshot Board snapshot
	 * @returns Object of values by color
	 */
	ns.getScores = function(snapshot) {
		let result = {white: 0, black: 0};
		Object.values(snapshot).forEach(piece => result[piece.Color] += piece.Value);
		return result;
	}

	/**
	 * Gets a number representing the difference in scores
	 * @param {Object} snapshot Board snapshot
	 * @param {string} posColor The color considered positive
	 * @returns How far ahead posColor is
	 */
	ns.getScoreDiff = function(snapshot, posColor) {
		const {white, black} = ns.getScores(snapshot);
		if(posColor === "white") {
			return white - black;
		}
		else {
			return black - white;
		}
	}

	/**
	 * Converts a snapshot to a string
	 * @param {Object} snapshot Snapshot to stringify
	 * @returns String
	 */
	ns.getSnapStr = function(snapshot) {
		let str = "";
		Object.entries(snapshot).forEach(([cell, piece]) => {
			str += `${cell}${piece.Abbr}`;
		});
		return str;
	}
}) (window.GW.Chessboard.Snapshots = window.GW.Chessboard.Snapshots || {});