/**
 * @file Code for game state snapshots
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function Snapshots(ns) {
	ns.buildGameSnapshots = function buildGameSnapshots() {
		ns.List = [];

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

		for(let i = 0; i < GW.Chessboard.Data.Moves.length; i++) {
			ns.List.push(getSnapshot(
				ns.List[i],
				GW.Chessboard.Data.Moves[i],
				i % 2 == 0 ? "white" : "black"
			));
		}
	}

	function getSnapshot(snapshot, moveNotation, color) {
		const {CellStart, Move} = GW.Chessboard.Notation.getNotationAsMove(moveNotation, color, snapshot);
		const newSnap = ns.cloneSnapshot(snapshot);
		if(CellStart && Move) {
			applyMove(newSnap, CellStart, Move); //Async is only for user input, not needed here
		}
		return newSnap;
	}

	ns.initiateNotationMove = function(note) {
		const curSnapIdx = GW.Chessboard.Rendering.CurrentSnapshotIdx;
		const boardSnap = ns.List[curSnapIdx];
		
		const {CellStart, Move} = GW.Chessboard.Notation.getNotationAsMove(
			note,
			GW.Chessboard.Rendering.getCurrentMovingColor(),
			boardSnap
		);
		if(!CellStart || !Move) {
			return false;
		}

		const newSnap = ns.cloneSnapshot(boardSnap);
		ns.applyMove(
			newSnap,
			CellStart,
			Move
		);
		ns.List.push(newSnap);

		GW.Chessboard.Data.Moves = GW.Chessboard.Data.Moves.slice(0, curSnapIdx);
		GW.Chessboard.Data.Moves.push(note);

		GW.Chessboard.Rendering.setSnapshot(curSnapIdx + 1);

		if(document.getElementById("cbxAutoSave").checked && GW.Chessboard.LoadSave.LocalSaveName) {
			GW.Chessboard.LoadSave.saveToLocal(GW.Chessboard.LoadSave.LocalSaveName)
			setTimeout(() => GW.Controls.Toaster.showToast("Auto saved"), 10);
		}

		return true;
	}

	ns.initiateMove = async function(cellStart, cellEnd) {
		const curSnapIdx = GW.Chessboard.Rendering.CurrentSnapshotIdx;
		const curSnap = ns.List[curSnapIdx];

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

		ns.List = ns.List.slice(0, curSnapIdx + 1);
		const newSnap = ns.cloneSnapshot(curSnap);
		await applyMove(newSnap, cellStart, move);
		ns.List.push(newSnap);

		GW.Chessboard.Data.Moves = GW.Chessboard.Data.Moves.slice(0, curSnapIdx);
		const moveNotation = GW.Chessboard.Notation.getMoveAsNotation(cellStart, move, curSnap, newSnap)
		GW.Chessboard.Data.Moves.push(moveNotation);
		if(document.getElementById("cbxAutoCopy").checked) {
			setTimeout(() => GW.Chessboard.writeToClipboard(moveNotation), 0);
		}
		if(document.getElementById("cbxAutoSave").checked && GW.Chessboard.LoadSave.LocalSaveName) {
			GW.Chessboard.LoadSave.saveToLocal(GW.Chessboard.LoadSave.LocalSaveName)
			setTimeout(() => GW.Controls.Toaster.showToast("Auto saved"), 10);
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

	ns.cloneSnapshot = function(snapshot) {
		const cloneSnapshot = {};
		for(let cell of Object.keys(snapshot)) {
			cloneSnapshot[cell] = snapshot[cell].clone();
		}
		return cloneSnapshot;
	}
}) (window.GW.Chessboard.Snapshots = window.GW.Chessboard.Snapshots || {});